/**
 * Core War game engine.
 * Manages game state, handles gameplay, and emits events.
 */

import type {
  Card,
  GameConfig,
  GameEvent,
  GameEventCallback,
  GameState,
  GameStats,
  IWarGameEngine,
  Player,
  PlayerId,
  Replay,
  SavedGame,
} from './types'
import { EventEmitter, EventKey } from './events'
import { createRng, serializeRngState, deserializeRngState, Rng } from './rng'
import {
  addToBottom,
  compareCards,
  createShuffledDeck,
  drawCard,
  splitDeck,
} from './deck'
import { checkWinCondition } from './win-conditions'
import {
  canCompleteWar,
  drawFaceDownCards,
  getFaceDownCount,
  handleInsufficientCards,
  initWarState,
  WarState,
} from './war'
import { createGameHistory, GameHistory } from './history'
import { getPreset } from './presets'
import type { RulePreset } from './types'

// =============================================================================
// Default Configuration
// =============================================================================

export const DEFAULT_CONFIG: GameConfig = {
  deckCount: 1,
  cardsPerPlayer: 'all',
  aceHigh: true,
  suitsRank: false,
  warFaceDownCards: 1,
  insufficientCardsRule: 'lose',
  winCondition: { type: 'elimination' },
  shuffleWonCards: false,
  wonCardsPosition: 'bottom',
}

// =============================================================================
// Utility Functions
// =============================================================================

function generateGameId(): string {
  return `game-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

function createInitialBattlefield() {
  return {
    player1FaceUp: null,
    player2FaceUp: null,
    player1FaceDown: [],
    player2FaceDown: [],
    warPile: [],
  }
}

function createInitialStats(): GameStats {
  return {
    totalRounds: 0,
    warsCount: 0,
    longestWarChain: 0,
    largestWarPot: 0,
    cardRankWins: {},
    suitDistribution: {},
    duration: 0,
    averageRoundTime: 0,
    player1RoundsWon: 0,
    player2RoundsWon: 0,
    biggestLead: { player: 'player1', amount: 0 },
  }
}

// =============================================================================
// War Game Engine
// =============================================================================

export class WarGameEngine implements IWarGameEngine {
  private emitter: EventEmitter
  private state: GameState
  private rng: Rng
  private gameHistory: GameHistory
  private stats: GameStats
  private startTime: number = 0
  private lastRoundTime: number = 0
  private warState: WarState | null = null

  constructor(config: Partial<GameConfig> = {}) {
    this.emitter = new EventEmitter()
    this.rng = createRng(config.seed)
    this.gameHistory = createGameHistory()

    const fullConfig: GameConfig = { ...DEFAULT_CONFIG, ...config }

    this.state = {
      id: generateGameId(),
      config: fullConfig,
      phase: 'setup',
      players: {
        player1: { id: 'player1', name: 'Player 1', deck: [], cardsWon: 0 },
        player2: { id: 'player2', name: 'Player 2', deck: [], cardsWon: 0 },
      },
      battlefield: createInitialBattlefield(),
      currentRound: 0,
      warDepth: 0,
      rngState: serializeRngState(this.rng.getState()),
    }

    this.stats = createInitialStats()
  }

  // ===========================================================================
  // Static Factory Methods
  // ===========================================================================

  static fromPreset(preset: RulePreset): WarGameEngine {
    const config = getPreset(preset)
    return new WarGameEngine(config)
  }

  static fromSave(save: SavedGame): WarGameEngine {
    const engine = new WarGameEngine(save.state.config)
    engine.load(save)
    return engine
  }

  static fromReplay(replay: Replay): WarGameEngine {
    const engine = new WarGameEngine({ ...replay.config, seed: replay.seed })
    // Replay playback would be implemented in Phase 2
    return engine
  }

  // ===========================================================================
  // Event Emitter Interface
  // ===========================================================================

  on(event: EventKey, callback: GameEventCallback): void {
    this.emitter.on(event, callback)
  }

  off(event: EventKey, callback: GameEventCallback): void {
    this.emitter.off(event, callback)
  }

  private emit(event: GameEvent): void {
    this.gameHistory.recordEvent(event)
    this.emitter.emit(event)
  }

  // ===========================================================================
  // Game Setup
  // ===========================================================================

  setPlayers(p1: Player, p2: Player): void {
    if (this.state.phase !== 'setup') {
      throw new Error('Cannot set players after game has started')
    }

    this.state.players.player1 = {
      id: 'player1',
      name: p1.name,
      profileId: p1.profileId,
      deck: [],
      cardsWon: 0,
    }

    this.state.players.player2 = {
      id: 'player2',
      name: p2.name,
      profileId: p2.profileId,
      deck: [],
      cardsWon: 0,
    }
  }

  start(): void {
    if (this.state.phase !== 'setup') {
      throw new Error('Game already started')
    }

    // Create and shuffle deck
    const deck = createShuffledDeck(this.rng, this.state.config.deckCount)

    // Split deck between players
    const [p1Deck, p2Deck] = splitDeck(deck, this.state.config.cardsPerPlayer)
    this.state.players.player1.deck = p1Deck
    this.state.players.player2.deck = p2Deck

    // Update state
    this.state.phase = 'playing'
    this.state.currentRound = 0
    this.state.rngState = serializeRngState(this.rng.getState())
    this.startTime = Date.now()
    this.lastRoundTime = this.startTime

    // Emit game started event
    this.emit({
      type: 'gameStarted',
      config: this.state.config,
      players: [
        { id: 'player1', name: this.state.players.player1.name, profileId: this.state.players.player1.profileId },
        { id: 'player2', name: this.state.players.player2.name, profileId: this.state.players.player2.profileId },
      ],
    })
  }

  // ===========================================================================
  // Core Gameplay
  // ===========================================================================

  draw(): void {
    if (this.state.phase === 'setup') {
      throw new Error('Game not started')
    }

    if (this.state.phase === 'finished') {
      throw new Error('Game already finished')
    }

    if (this.state.phase === 'war') {
      this.handleWarDraw()
    } else {
      this.handleNormalDraw()
    }
  }

  private handleNormalDraw(): void {
    // Create checkpoint at round start for undo functionality
    this.gameHistory.createCheckpoint(this.state, this.state.currentRound)

    this.state.currentRound++

    this.emit({ type: 'roundStarted', roundNumber: this.state.currentRound })

    // Draw cards from both players
    const card1 = drawCard(this.state.players.player1.deck)
    const card2 = drawCard(this.state.players.player2.deck)

    if (!card1 || !card2) {
      // One player has no cards - check win condition
      this.checkAndEndGame()
      return
    }

    // Place cards on battlefield
    this.state.battlefield.player1FaceUp = card1
    this.state.battlefield.player2FaceUp = card2

    this.emit({
      type: 'cardsDrawn',
      cards: { player1: card1, player2: card2 },
    })

    // Compare cards
    const result = compareCards(card1, card2, this.state.config)

    this.emit({
      type: 'comparison',
      result,
      cards: [card1, card2],
    })

    if (result === 'tie') {
      this.startWar(card1, card2)
    } else {
      this.resolveRound(result, [card1, card2])
    }
  }

  private startWar(card1: Card, card2: Card): void {
    this.state.phase = 'war'
    this.state.warDepth = 1
    this.warState = initWarState(card1, card2)

    this.stats.warsCount++

    this.emit({ type: 'warStarted', depth: 1 })

    // Check if players can complete war
    const p1Remaining = this.state.players.player1.deck.length
    const p2Remaining = this.state.players.player2.deck.length
    const faceDownNeeded = this.state.config.warFaceDownCards

    const p1CanComplete = canCompleteWar(p1Remaining, faceDownNeeded)
    const p2CanComplete = canCompleteWar(p2Remaining, faceDownNeeded)

    if (!p1CanComplete || !p2CanComplete) {
      // Handle insufficient cards
      const result = handleInsufficientCards(
        p1Remaining,
        p2Remaining,
        this.state.config.insufficientCardsRule,
        this.warState.pile
      )

      if (result.insufficientCards) {
        this.emit({
          type: 'insufficientCards',
          player: result.insufficientCards.player,
          needed: result.insufficientCards.needed,
          had: result.insufficientCards.had,
        })
      }

      if (result.gameEnds && result.loser) {
        // Game ends - the player who couldn't complete war loses
        const winner: PlayerId = result.loser === 'player1' ? 'player2' : 'player1'
        this.endGame(winner)
        return
      }

      // Handle splitPot or useRemaining
      if (this.state.config.insufficientCardsRule === 'splitPot') {
        this.handleSplitPot()
        return
      }
    }

    // Place face-down cards
    this.placeFaceDownCards()
  }

  private placeFaceDownCards(): void {
    if (!this.warState) return

    const faceDownCount = this.state.config.warFaceDownCards
    const rule = this.state.config.insufficientCardsRule

    // Calculate actual face-down count for each player
    const p1Count = getFaceDownCount(
      this.state.players.player1.deck.length,
      faceDownCount,
      rule
    )
    const p2Count = getFaceDownCount(
      this.state.players.player2.deck.length,
      faceDownCount,
      rule
    )

    // Draw face-down cards
    const p1FaceDown = drawFaceDownCards(this.state.players.player1.deck, p1Count)
    const p2FaceDown = drawFaceDownCards(this.state.players.player2.deck, p2Count)

    this.warState.player1FaceDown.push(...p1FaceDown)
    this.warState.player2FaceDown.push(...p2FaceDown)

    this.state.battlefield.player1FaceDown = this.warState.player1FaceDown
    this.state.battlefield.player2FaceDown = this.warState.player2FaceDown

    if (p1Count > 0) {
      this.emit({ type: 'warFaceDownPlaced', player: 'player1', count: p1Count })
    }
    if (p2Count > 0) {
      this.emit({ type: 'warFaceDownPlaced', player: 'player2', count: p2Count })
    }

    // War state is now waiting for the next draw() call to flip face-up cards
  }

  private handleWarDraw(): void {
    if (!this.warState) {
      // Shouldn't happen, but recover gracefully
      this.state.phase = 'playing'
      return
    }

    // Draw face-up cards for war
    const card1 = drawCard(this.state.players.player1.deck)
    const card2 = drawCard(this.state.players.player2.deck)

    if (!card1 || !card2) {
      // One player ran out during war
      this.emit({
        type: 'insufficientCards',
        player: !card1 ? 'player1' : 'player2',
        needed: 1,
        had: 0,
      })

      if (this.state.config.insufficientCardsRule === 'lose') {
        const loser: PlayerId = !card1 ? 'player1' : 'player2'
        const winner: PlayerId = loser === 'player1' ? 'player2' : 'player1'
        this.endGame(winner)
        return
      }

      // Handle other rules
      this.handleSplitPot()
      return
    }

    this.warState.player1FaceUp = card1
    this.warState.player2FaceUp = card2
    this.state.battlefield.player1FaceUp = card1
    this.state.battlefield.player2FaceUp = card2

    this.emit({
      type: 'cardsDrawn',
      cards: { player1: card1, player2: card2 },
    })

    // Compare cards
    const result = compareCards(card1, card2, this.state.config)

    this.emit({
      type: 'comparison',
      result,
      cards: [card1, card2],
    })

    if (result === 'tie') {
      // Nested war!
      this.state.warDepth++
      this.warState.depth = this.state.warDepth

      // Track longest war chain
      if (this.state.warDepth > this.stats.longestWarChain) {
        this.stats.longestWarChain = this.state.warDepth
      }

      // Add current cards to pile
      this.warState.pile.push(card1, card2)
      this.warState.pile.push(...this.warState.player1FaceDown)
      this.warState.pile.push(...this.warState.player2FaceDown)
      this.warState.player1FaceDown = []
      this.warState.player2FaceDown = []

      this.emit({ type: 'warStarted', depth: this.state.warDepth })

      // Check if can continue
      const p1Remaining = this.state.players.player1.deck.length
      const p2Remaining = this.state.players.player2.deck.length
      const faceDownNeeded = this.state.config.warFaceDownCards

      if (!canCompleteWar(p1Remaining, faceDownNeeded) || !canCompleteWar(p2Remaining, faceDownNeeded)) {
        const handleResult = handleInsufficientCards(
          p1Remaining,
          p2Remaining,
          this.state.config.insufficientCardsRule,
          this.warState.pile
        )

        if (handleResult.gameEnds && handleResult.loser) {
          const winner: PlayerId = handleResult.loser === 'player1' ? 'player2' : 'player1'
          this.endGame(winner)
          return
        }
      }

      this.placeFaceDownCards()
    } else {
      // War resolved - winner takes all
      this.resolveWar(result, card1, card2)
    }
  }

  private resolveWar(winner: PlayerId, card1: Card, card2: Card): void {
    if (!this.warState) return

    // Collect all war cards
    const allCards = [
      ...this.warState.pile,
      ...this.warState.player1FaceDown,
      ...this.warState.player2FaceDown,
      card1,
      card2,
    ]

    // Track largest war pot
    if (allCards.length > this.stats.largestWarPot) {
      this.stats.largestWarPot = allCards.length
    }

    this.emit({
      type: 'warResolved',
      winner,
      totalCards: allCards.length,
    })

    // Give cards to winner
    this.awardCards(winner, allCards)

    // Reset war state
    this.warState = null
    this.state.warDepth = 0
    this.state.phase = 'playing'
    this.state.battlefield = createInitialBattlefield()

    // Check win condition
    this.checkAndEndGame()
  }

  private resolveRound(winner: PlayerId, cards: Card[]): void {
    // Update stats
    this.updateRoundStats(winner, cards[winner === 'player1' ? 0 : 1])

    this.emit({
      type: 'roundWon',
      winner,
      cardsWon: cards,
    })

    this.awardCards(winner, cards)

    // Reset battlefield
    this.state.battlefield = createInitialBattlefield()

    // Update timing
    const now = Date.now()
    const roundTime = now - this.lastRoundTime
    this.lastRoundTime = now
    this.stats.averageRoundTime =
      (this.stats.averageRoundTime * (this.stats.totalRounds - 1) + roundTime) /
      this.stats.totalRounds

    // Check win condition
    this.checkAndEndGame()
  }

  private awardCards(winner: PlayerId, cards: Card[]): void {
    const winnerState = this.state.players[winner]

    addToBottom(
      winnerState.deck,
      cards,
      this.rng,
      this.state.config.shuffleWonCards
    )

    winnerState.cardsWon += cards.length

    // Update RNG state
    this.state.rngState = serializeRngState(this.rng.getState())
  }

  private handleSplitPot(): void {
    if (!this.warState) return

    // Split all cards in the war pile between players
    const allCards = [
      ...this.warState.pile,
      ...this.warState.player1FaceDown,
      ...this.warState.player2FaceDown,
    ]

    const mid = Math.floor(allCards.length / 2)
    const p1Cards = allCards.slice(0, mid)
    const p2Cards = allCards.slice(mid)

    addToBottom(this.state.players.player1.deck, p1Cards, this.rng)
    addToBottom(this.state.players.player2.deck, p2Cards, this.rng)

    // Reset war state
    this.warState = null
    this.state.warDepth = 0
    this.state.phase = 'playing'
    this.state.battlefield = createInitialBattlefield()

    this.checkAndEndGame()
  }

  private updateRoundStats(winner: PlayerId, winningCard: Card): void {
    this.stats.totalRounds++

    if (winner === 'player1') {
      this.stats.player1RoundsWon++
    } else {
      this.stats.player2RoundsWon++
    }

    // Track card rank wins
    const rank = winningCard.rank
    this.stats.cardRankWins[rank] = (this.stats.cardRankWins[rank] ?? 0) + 1

    // Track suit distribution
    const suit = winningCard.suit
    this.stats.suitDistribution[suit] = (this.stats.suitDistribution[suit] ?? 0) + 1

    // Track biggest lead
    const p1Cards = this.state.players.player1.deck.length
    const p2Cards = this.state.players.player2.deck.length
    const lead = Math.abs(p1Cards - p2Cards)
    const leadPlayer: PlayerId = p1Cards > p2Cards ? 'player1' : 'player2'

    if (lead > this.stats.biggestLead.amount) {
      this.stats.biggestLead = { player: leadPlayer, amount: lead }
    }
  }

  private checkAndEndGame(): void {
    const result = checkWinCondition(this.state)

    if (result.isOver && result.winner) {
      this.endGame(result.winner)
    }
  }

  private endGame(winner: PlayerId): void {
    this.state.phase = 'finished'
    this.stats.duration = Date.now() - this.startTime

    this.emit({
      type: 'gameEnded',
      winner,
      stats: { ...this.stats },
    })
  }

  // ===========================================================================
  // State Access
  // ===========================================================================

  getState(): GameState {
    return { ...this.state }
  }

  getConfig(): GameConfig {
    return { ...this.state.config }
  }

  getStats(): GameStats {
    return { ...this.stats }
  }

  // ===========================================================================
  // Persistence (Phase 2 implementation stubs)
  // ===========================================================================

  save(): SavedGame {
    return {
      id: this.state.id,
      savedAt: Date.now(),
      state: deepCloneState(this.state),
      history: this.gameHistory.getAllEvents(),
      playerProfiles: [
        this.state.players.player1.profileId,
        this.state.players.player2.profileId,
      ],
    }
  }

  load(save: SavedGame): void {
    this.state = deepCloneState(save.state)
    this.gameHistory.loadFromSave(save.history)
    this.rng.setState(deserializeRngState(this.state.rngState))

    this.emit({ type: 'stateRestored', fromSave: true })
  }

  exportReplay(): Replay {
    return {
      id: `replay-${this.state.id}`,
      createdAt: Date.now(),
      config: { ...this.state.config },
      seed: this.rng.getSeed(),
      players: [
        { name: this.state.players.player1.name, profileId: this.state.players.player1.profileId },
        { name: this.state.players.player2.name, profileId: this.state.players.player2.profileId },
      ],
      events: this.gameHistory.getAllEvents(),
      stats: { ...this.stats },
      duration: this.stats.duration,
    }
  }

  /**
   * Get the event history for inspection.
   */
  getHistory(): GameEvent[] {
    return this.gameHistory.getAllEvents()
  }

  /**
   * Get current position in history.
   */
  getHistoryIndex(): number {
    return this.gameHistory.getCurrentIndex()
  }

  // ===========================================================================
  // Undo/Redo
  // ===========================================================================

  canUndo(): boolean {
    return this.gameHistory.canUndo()
  }

  canRedo(): boolean {
    return this.gameHistory.canRedo()
  }

  /**
   * Undo to the previous round start.
   * Restores game state from the most recent checkpoint.
   */
  undo(): void {
    if (!this.canUndo()) {
      throw new Error('Cannot undo - no previous checkpoint available')
    }

    const checkpoint = this.gameHistory.getPreviousCheckpoint()
    if (!checkpoint) {
      throw new Error('Cannot undo - no checkpoint found')
    }

    // Restore state from checkpoint
    this.state = deepCloneState(checkpoint.state)
    this.rng.setState(deserializeRngState(this.state.rngState))
    this.warState = null
    this.gameHistory.restoreToCheckpoint(checkpoint)

    this.emitter.emit({ type: 'stateRestored', fromSave: false })
  }

  /**
   * Redo previously undone actions.
   * Replays events from current position to next checkpoint or end.
   */
  redo(): void {
    if (!this.canRedo()) {
      throw new Error('Cannot redo - no events to replay')
    }

    const events = this.gameHistory.getRedoEvents()
    if (events.length === 0) {
      return
    }

    // Re-emit the events (they're already in history)
    for (const event of events) {
      this.emitter.emit(event)
    }

    this.gameHistory.advanceIndex(events.length)
  }
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Deep clone a game state.
 */
function deepCloneState(state: GameState): GameState {
  return {
    id: state.id,
    config: { ...state.config },
    phase: state.phase,
    players: {
      player1: {
        ...state.players.player1,
        deck: [...state.players.player1.deck],
      },
      player2: {
        ...state.players.player2,
        deck: [...state.players.player2.deck],
      },
    },
    battlefield: {
      player1FaceUp: state.battlefield.player1FaceUp,
      player2FaceUp: state.battlefield.player2FaceUp,
      player1FaceDown: [...state.battlefield.player1FaceDown],
      player2FaceDown: [...state.battlefield.player2FaceDown],
      warPile: [...state.battlefield.warPile],
    },
    currentRound: state.currentRound,
    warDepth: state.warDepth,
    rngState: state.rngState,
  }
}
