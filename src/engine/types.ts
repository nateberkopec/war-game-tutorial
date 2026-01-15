/**
 * Core types for the War card game engine.
 * This module defines all types used throughout the engine.
 * Other workstreams (W2: Persistence, W3: Rendering) import from here.
 */

// =============================================================================
// Card Types
// =============================================================================

export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades'

export type Rank = '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'A'

export interface Card {
  suit: Suit
  rank: Rank
  /** Unique ID: "{deckIndex}-{suit}-{rank}" e.g. "0-hearts-A" */
  id: string
}

// =============================================================================
// Player Types
// =============================================================================

export type PlayerId = 'player1' | 'player2'

/** Lightweight player info for game sessions */
export interface Player {
  id: PlayerId
  name: string
  /** Optional link to persistent profile */
  profileId?: string
}

/** Minimal player info for replays/summaries */
export interface PlayerInfo {
  name: string
  profileId?: string
}

export interface PlayerState {
  id: PlayerId
  name: string
  profileId?: string
  deck: Card[]
  /** Running total of cards won this game */
  cardsWon: number
}

// =============================================================================
// Configuration Types
// =============================================================================

export type RulePreset = 'classic' | 'quick' | 'marathon' | 'chaos' | 'custom'

export type WinCondition =
  | { type: 'elimination' }
  | { type: 'firstTo'; count: number }
  | { type: 'rounds'; count: number }

export type InsufficientCardsRule = 'lose' | 'useRemaining' | 'splitPot'

export type WonCardsPosition = 'bottom' | 'random'

export interface GameConfig {
  // Deck setup
  /** Number of standard decks combined (1-4) */
  deckCount: number
  /** Fixed count or split entire deck */
  cardsPerPlayer: number | 'all'

  // Card rankings
  /** true = Ace beats King */
  aceHigh: boolean
  /** Custom rank order, e.g., ['2','3',...,'A'] */
  customRankOrder?: Rank[]
  /** false = suits don't matter (default) */
  suitsRank: boolean
  /** If suits matter: ['clubs','diamonds','hearts','spades'] */
  suitOrder?: Suit[]

  // War rules
  /** Number of face-down cards in war (1 = classic, 3 = common variant) */
  warFaceDownCards: number
  /** What happens when a player can't complete a war */
  insufficientCardsRule: InsufficientCardsRule

  // Win conditions
  winCondition: WinCondition

  // Card collection
  /** Shuffle won cards before adding to deck */
  shuffleWonCards: boolean
  /** Where won cards go */
  wonCardsPosition: WonCardsPosition

  // Randomization
  /** For reproducible games / replays */
  seed?: string
}

// =============================================================================
// Game State Types
// =============================================================================

export type GamePhase = 'setup' | 'playing' | 'war' | 'paused' | 'finished'

export interface Battlefield {
  /** Current face-up card being compared */
  player1FaceUp: Card | null
  player2FaceUp: Card | null
  /** Face-down cards placed during war */
  player1FaceDown: Card[]
  player2FaceDown: Card[]
  /** All cards accumulated during war sequence */
  warPile: Card[]
}

export interface GameState {
  /** Unique game ID (for saves/replays) */
  id: string
  config: GameConfig
  phase: GamePhase

  players: {
    player1: PlayerState
    player2: PlayerState
  }

  battlefield: Battlefield

  currentRound: number
  /** 0 = normal round, 1+ = nested war */
  warDepth: number

  /** Random state for replay */
  rngState: string
}

// =============================================================================
// Event Types
// =============================================================================

export type GameEvent =
  | { type: 'gameStarted'; config: GameConfig; players: [Player, Player] }
  | { type: 'roundStarted'; roundNumber: number }
  | { type: 'cardsDrawn'; cards: { player1: Card; player2: Card } }
  | { type: 'comparison'; result: PlayerId | 'tie'; cards: [Card, Card] }
  | { type: 'roundWon'; winner: PlayerId; cardsWon: Card[] }
  | { type: 'warStarted'; depth: number }
  | { type: 'warFaceDownPlaced'; player: PlayerId; count: number }
  | { type: 'warResolved'; winner: PlayerId; totalCards: number }
  | { type: 'insufficientCards'; player: PlayerId; needed: number; had: number }
  | { type: 'gameEnded'; winner: PlayerId; stats: GameStats }
  | { type: 'gameDraw'; reason: 'simultaneousElimination' | 'roundsTie'; stats: GameStats }
  | { type: 'deckShuffled'; player: PlayerId }
  | { type: 'stateRestored'; fromSave: boolean }

export type GameEventType = GameEvent['type']

// =============================================================================
// Statistics Types
// =============================================================================

export interface GameStats {
  // Per-game stats
  totalRounds: number
  warsCount: number
  /** Max consecutive ties */
  longestWarChain: number
  /** Most cards won in single war */
  largestWarPot: number

  // Card distribution
  /** Which ranks won most */
  cardRankWins: Record<string, number>
  suitDistribution: Record<string, number>

  // Timing
  duration: number
  averageRoundTime: number

  // Player-specific
  player1RoundsWon: number
  player2RoundsWon: number
  biggestLead: { player: PlayerId; amount: number }
}

// =============================================================================
// Save/Load Types
// =============================================================================

export interface SavedGame {
  id: string
  savedAt: number
  state: GameState
  /** For undo/replay */
  history: GameEvent[]
  /** Profile IDs of players */
  playerProfiles: [string | undefined, string | undefined]
}

// =============================================================================
// Replay Types
// =============================================================================

export interface Replay {
  id: string
  createdAt: number
  config: GameConfig
  /** For deterministic replay */
  seed: string
  players: [PlayerInfo, PlayerInfo]
  events: GameEvent[]
  stats: GameStats
  /** Total game time in ms */
  duration: number
}

// =============================================================================
// Event Emitter Interface
// =============================================================================

export type GameEventCallback = (event: GameEvent) => void

export interface GameEventEmitter {
  on(event: GameEventType | '*', callback: GameEventCallback): void
  off(event: GameEventType | '*', callback: GameEventCallback): void
}

// =============================================================================
// Engine Interface
// =============================================================================

export interface IWarGameEngine extends GameEventEmitter {
  // Game setup
  setPlayers(p1: Player, p2: Player): void
  start(): void

  // Core gameplay
  draw(): void

  // State access
  getState(): GameState
  getConfig(): GameConfig

  // Persistence
  save(): SavedGame
  load(save: SavedGame): void
  exportReplay(): Replay

  // History
  undo(): void
  redo(): void
  canUndo(): boolean
  canRedo(): boolean
}
