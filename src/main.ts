/**
 * War Card Game - Main Entry Point
 * 
 * This file integrates all modules and implements the game flow:
 * 1. Title Screen -> Player name input
 * 2. Game Screen -> Draw cards, show winner
 * 3. Victory Screen -> Show stats, play again
 */

import { WarGameEngine } from './engine'
import type { GameEvent, PlayerId, Card, GameStats } from './engine/types'
import {
  GameScene,
  showTitleScreen,
  showVictoryScreen,
  UITextManager,
  InputManager,
  showLoadingScreen,
  Animator,
  fireConfetti,
  type Rank,
  type Suit,
} from './ui'

// =============================================================================
// Game State
// =============================================================================

interface GameController {
  engine: WarGameEngine
  scene: GameScene
  textManager: UITextManager
  inputManager: InputManager
  animator: Animator
  player1Name: string
  player2Name: string
  waitingForInput: boolean
  phase: 'title' | 'playing' | 'showingResult' | 'war' | 'victory'
}

let game: GameController | null = null

// =============================================================================
// Initialization
// =============================================================================

async function init(): Promise<void> {
  // Show loading screen while initializing
  const loadingScreen = showLoadingScreen({ text: 'Loading...' })
  
  // Small delay to ensure loading screen is visible
  await new Promise(resolve => setTimeout(resolve, 100))
  loadingScreen.setProgress(0.5)
  
  await new Promise(resolve => setTimeout(resolve, 200))
  loadingScreen.setProgress(1)
  
  await loadingScreen.hide()
  loadingScreen.dispose()
  
  // Start the game loop
  await showTitleAndStart()
}

// =============================================================================
// Title Screen
// =============================================================================

async function showTitleAndStart(): Promise<void> {
  const result = await showTitleScreen({
    defaultPlayer1Name: 'Player 1',
    defaultPlayer2Name: 'Player 2',
  })
  
  await startGame(result.player1Name, result.player2Name)
}

// =============================================================================
// Game Initialization
// =============================================================================

async function startGame(player1Name: string, player2Name: string): Promise<void> {
  // Create game components
  const container = document.getElementById('app')!
  const scene = new GameScene(container)
  const textManager = new UITextManager()
  const inputManager = new InputManager()
  const animator = new Animator()
  
  // Create engine with classic rules
  const engine = new WarGameEngine()
  
  // Set up players
  engine.setPlayers(
    { id: 'player1', name: player1Name },
    { id: 'player2', name: player2Name }
  )
  
  // Initialize game state
  game = {
    engine,
    scene,
    textManager,
    inputManager,
    animator,
    player1Name,
    player2Name,
    waitingForInput: false,
    phase: 'playing',
  }
  
  // Subscribe to engine events
  setupEngineEvents(engine)
  
  // Start the engine
  engine.start()
  
  // Setup scene with initial deck counts
  const state = engine.getState()
  scene.setup(state.players.player1.deck.length, state.players.player2.deck.length)
  
  // Start rendering
  scene.start()
  
  // Hook animator into render loop
  scene.getSceneManager().onRender(() => animator.update())
  
  // Update UI
  updatePlayerInfo()
  
  // Show initial prompt
  textManager.setPrompt('Click anywhere to draw')
  
  // Setup input handling
  inputManager.onTap(handleInput)
  game.waitingForInput = true
}

// =============================================================================
// Engine Event Handling
// =============================================================================

function setupEngineEvents(engine: WarGameEngine): void {
  engine.on('*', (event: GameEvent) => {
    switch (event.type) {
      case 'cardsDrawn':
        handleCardsDrawn(event.cards.player1, event.cards.player2)
        break
      case 'comparison':
        handleComparison(event.result, event.cards)
        break
      case 'roundWon':
        handleRoundWon(event.winner, event.cardsWon)
        break
      case 'warStarted':
        handleWarStarted(event.depth)
        break
      case 'warResolved':
        handleWarResolved(event.winner, event.totalCards)
        break
      case 'gameEnded':
        handleGameEnded(event.winner, event.stats)
        break
    }
  })
}

// =============================================================================
// Input Handling
// =============================================================================

function handleInput(): void {
  if (!game || !game.waitingForInput) return
  
  game.waitingForInput = false
  
  if (game.phase === 'playing' || game.phase === 'war') {
    // Draw cards
    try {
      game.engine.draw()
    } catch (error) {
      console.error('Error during draw:', error)
    }
  } else if (game.phase === 'showingResult') {
    // Continue to next round
    continueAfterResult()
  }
}

function continueAfterResult(): void {
  if (!game) return
  
  // Clear battlefield
  game.scene.clearBattlefield()
  
  // Update deck counts
  const state = game.engine.getState()
  game.scene.updateDecks(
    state.players.player1.deck.length,
    state.players.player2.deck.length
  )
  
  // Update player info
  updatePlayerInfo()
  
  // Check if game is still going
  if (state.phase === 'finished') {
    return // Will be handled by gameEnded event
  }
  
  // Reset for next round
  game.phase = 'playing'
  game.textManager.setPrompt('Click anywhere to draw')
  game.waitingForInput = true
}

// =============================================================================
// Event Handlers
// =============================================================================

function handleCardsDrawn(card1: Card, card2: Card): void {
  if (!game) return
  
  // Show cards on battlefield
  game.scene.showBattleCard('player1', card1.rank as Rank, card1.suit as Suit, true)
  game.scene.showBattleCard('player2', card2.rank as Rank, card2.suit as Suit, true)
  
  // Update player info
  updatePlayerInfo()
}

function handleComparison(result: PlayerId | 'tie', _cards: [Card, Card]): void {
  if (!game) return
  
  if (result === 'tie') {
    // War will be handled by warStarted event
    return
  }
  
  // Show winner announcement
  const winnerName = result === 'player1' ? game.player1Name : game.player2Name
  game.textManager.showRoundResult(`${winnerName} wins!`, 1000)
}

function handleRoundWon(_winner: PlayerId, _cardsWon: Card[]): void {
  if (!game) return
  
  game.phase = 'showingResult'
  game.textManager.setPrompt('Click to continue')
  game.waitingForInput = true
}

async function handleWarStarted(_depth: number): Promise<void> {
  if (!game) return
  
  game.phase = 'war'
  
  // Show dramatic "WAR!" announcement
  await game.textManager.showWarAnnouncement()
  
  // Update prompt
  game.textManager.setPrompt('Click to draw war cards')
  game.waitingForInput = true
}

function handleWarResolved(winner: PlayerId, totalCards: number): void {
  if (!game) return
  
  const winnerName = winner === 'player1' ? game.player1Name : game.player2Name
  game.textManager.showRoundResult(`${winnerName} wins ${totalCards} cards!`, 1500)
  
  game.phase = 'showingResult'
  game.textManager.setPrompt('Click to continue')
  game.waitingForInput = true
}

async function handleGameEnded(winner: PlayerId, stats: GameStats): Promise<void> {
  if (!game) return
  
  game.phase = 'victory'
  game.waitingForInput = false
  game.inputManager.dispose()
  
  // Fire confetti
  fireConfetti()
  
  // Small delay before showing victory screen
  await new Promise(resolve => setTimeout(resolve, 500))
  
  // Show victory screen
  const winnerName = winner === 'player1' ? game.player1Name : game.player2Name
  const action = await showVictoryScreen({
    winnerName,
    winnerId: winner,
    stats,
  })
  
  // Clean up current game
  game.scene.dispose()
  game.textManager.dispose()
  
  // Handle user choice
  if (action === 'playAgain') {
    await startGame(game.player1Name, game.player2Name)
  } else {
    await showTitleAndStart()
  }
}

// =============================================================================
// UI Updates
// =============================================================================

function updatePlayerInfo(): void {
  if (!game) return
  
  const state = game.engine.getState()
  
  game.textManager.setPlayerInfo(
    'player1',
    game.player1Name,
    state.players.player1.deck.length
  )
  
  game.textManager.setPlayerInfo(
    'player2',
    game.player2Name,
    state.players.player2.deck.length
  )
}

// =============================================================================
// Start
// =============================================================================

// Wait for DOM to be ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init)
} else {
  init()
}
