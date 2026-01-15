/**
 * Main entry point for War Card Game.
 * Integrates engine, UI, and persistence systems.
 */

import { WarGameEngine, type PlayerId, type GameStats, QUICK_CONFIG } from './engine'
import {
  GameScene,
  showTitleScreen,
  VictoryScreen,
  InputManager,
  waitForAnyInput,
  UITextManager,
  fireConfetti,
  fireSideConfetti,
  withLoadingScreen
} from './ui'
import type { Rank, Suit } from './ui'

// =============================================================================
// Game State
// =============================================================================

interface GameUI {
  scene: GameScene
  textManager: UITextManager
  inputManager: InputManager
}

let engine: WarGameEngine | null = null
let gameUI: GameUI | null = null

// =============================================================================
// Initialization
// =============================================================================

async function init(): Promise<void> {
  console.log('War Card Game - Initializing...')

  // Show loading screen while initializing
  await withLoadingScreen(
    async (updateProgress) => {
      updateProgress(0.3)
      await new Promise((resolve) => setTimeout(resolve, 100))
      updateProgress(0.6)
      await new Promise((resolve) => setTimeout(resolve, 100))
      updateProgress(1)
      await new Promise((resolve) => setTimeout(resolve, 200))
    },
    { minDisplayTime: 500, text: 'Loading War Card Game...' }
  )

  // Show title screen and wait for player names
  const result = await showTitleScreen({
    defaultPlayer1Name: 'Player 1',
    defaultPlayer2Name: 'Player 2',
  })
  
  // Start the game with the player names
  startGame(result.player1Name, result.player2Name)
}

// =============================================================================
// Game Flow
// =============================================================================

async function startGame(player1Name: string, player2Name: string): Promise<void> {
  console.log(`Starting game: ${player1Name} vs ${player2Name}`)

  // Clean up previous game UI if any
  if (gameUI) {
    gameUI.scene.dispose()
    gameUI.textManager.dispose()
    gameUI.inputManager.dispose()
    gameUI = null
  }

  // Create engine - check for quick mode via URL param (for testing)
  const urlParams = new URLSearchParams(window.location.search)
  const quickMode = urlParams.get('quick') === 'true'
  
  if (quickMode) {
    console.log('Quick mode enabled - first to 30 cards wins!')
  }
  
  engine = quickMode ? new WarGameEngine(QUICK_CONFIG) : new WarGameEngine()
  engine.setPlayers(
    { id: 'player1', name: player1Name },
    { id: 'player2', name: player2Name }
  )

  // Set up UI
  const container = document.getElementById('app')!
  const scene = new GameScene(container)
  const textManager = new UITextManager()
  const inputManager = new InputManager()

  gameUI = { scene, textManager, inputManager }

  // Subscribe to engine events
  setupEngineEventHandlers()

  // Start the engine
  engine.start()

  // Set up initial deck display
  const state = engine.getState()
  scene.setup(state.players.player1.deck.length, state.players.player2.deck.length)
  scene.start()

  // Show player info
  showPlayerInfo()

  // Show prompt
  textManager.showAnnouncement('Click anywhere to draw', 2000)

  // Start game loop
  gameLoop()
}

function showPlayerInfo(): void {
  if (!engine || !gameUI) return

  const state = engine.getState()
  const { textManager } = gameUI

  // Player 1 info (left side)
  textManager.setText(
    'player1-name',
    state.players.player1.name,
    { x: '15%', y: '10%' },
    { fontSize: '24px', fontWeight: 'bold' }
  )
  textManager.setText(
    'player1-cards',
    `Cards: ${state.players.player1.deck.length}`,
    { x: '15%', y: '15%' },
    { fontSize: '18px' }
  )

  // Player 2 info (right side)
  textManager.setText(
    'player2-name',
    state.players.player2.name,
    { x: '85%', y: '10%' },
    { fontSize: '24px', fontWeight: 'bold' }
  )
  textManager.setText(
    'player2-cards',
    `Cards: ${state.players.player2.deck.length}`,
    { x: '85%', y: '15%' },
    { fontSize: '18px' }
  )
}

function setupEngineEventHandlers(): void {
  if (!engine) return

  engine.on('roundStarted', (event) => {
    if (event.type === 'roundStarted') {
      console.log(`Round ${event.roundNumber} started`)
    }
  })

  engine.on('cardsDrawn', (event) => {
    if (event.type === 'cardsDrawn' && gameUI) {
      const { cards } = event
      // Show cards face up
      gameUI.scene.showBattleCard(
        'player1',
        cards.player1.rank as Rank,
        cards.player1.suit as Suit,
        true
      )
      gameUI.scene.showBattleCard(
        'player2',
        cards.player2.rank as Rank,
        cards.player2.suit as Suit,
        true
      )
    }
  })

  engine.on('comparison', (event) => {
    if (event.type === 'comparison' && gameUI) {
      if (event.result === 'tie') {
        gameUI.textManager.showAnnouncement('WAR!', 1500)
      }
    }
  })

  engine.on('roundWon', (event) => {
    if (event.type === 'roundWon' && gameUI && engine) {
      const state = engine.getState()
      const winnerName = state.players[event.winner].name
      gameUI.textManager.showAnnouncement(`${winnerName} wins!`, 1000)
    }
  })

  engine.on('warStarted', (event) => {
    if (event.type === 'warStarted' && gameUI) {
      if (event.depth > 1) {
        gameUI.textManager.showAnnouncement('DOUBLE WAR!', 1500)
      }
    }
  })

  engine.on('warResolved', (event) => {
    if (event.type === 'warResolved' && gameUI && engine) {
      const state = engine.getState()
      const winnerName = state.players[event.winner].name
      gameUI.textManager.showAnnouncement(`${winnerName} wins ${event.totalCards} cards!`, 1500)
      // Clear war pile
      gameUI.scene.clearWarPile()
    }
  })

  engine.on('gameEnded', (event) => {
    if (event.type === 'gameEnded') {
      handleGameEnd(event.winner, event.stats)
    }
  })

  engine.on('gameDraw', (event) => {
    if (event.type === 'gameDraw') {
      handleGameDraw(event.reason, event.stats)
    }
  })
}

async function gameLoop(): Promise<void> {
  if (!engine || !gameUI) return

  const state = engine.getState()

  // Check if game is over
  if (state.phase === 'finished') {
    return
  }

  // Wait for user input
  await waitForAnyInput()

  // Execute draw
  try {
    engine.draw()
  } catch (error) {
    console.error('Error during draw:', error)
    return
  }

  // Update UI
  updateUI()

  // Small delay for visual feedback
  await new Promise((resolve) => setTimeout(resolve, 500))

  // Clear battlefield for next round (unless in war)
  const newState = engine.getState()
  if (newState.phase === 'playing') {
    gameUI.scene.clearBattlefield()
  }

  // Continue game loop if not finished
  if (newState.phase !== 'finished') {
    gameLoop()
  }
}

function updateUI(): void {
  if (!engine || !gameUI) return

  const state = engine.getState()

  // Update deck visuals
  gameUI.scene.updateDecks(
    state.players.player1.deck.length,
    state.players.player2.deck.length
  )

  // Update card count text
  gameUI.textManager.setText(
    'player1-cards',
    `Cards: ${state.players.player1.deck.length}`,
    { x: '15%', y: '15%' },
    { fontSize: '18px' }
  )
  gameUI.textManager.setText(
    'player2-cards',
    `Cards: ${state.players.player2.deck.length}`,
    { x: '85%', y: '15%' },
    { fontSize: '18px' }
  )
}

async function handleGameEnd(winner: PlayerId, stats: GameStats): Promise<void> {
  if (!engine || !gameUI) return

  const state = engine.getState()
  const winnerName = state.players[winner].name

  console.log(`Game ended! ${winnerName} wins!`)

  // Clean up game UI
  gameUI.scene.stop()
  gameUI.inputManager.dispose()
  gameUI.textManager.dispose()

  // Fire celebration effects
  fireConfetti()
  fireSideConfetti()

  // Show victory screen
  const victoryScreen = new VictoryScreen({
    winnerName,
    winnerId: winner,
    stats,
    onPlayAgain: async () => {
      victoryScreen.hide()
      victoryScreen.dispose()
      // Show title screen again
      const result = await showTitleScreen({
        defaultPlayer1Name: state.players.player1.name,
        defaultPlayer2Name: state.players.player2.name,
      })
      startGame(result.player1Name, result.player2Name)
    },
    onMainMenu: async () => {
      victoryScreen.hide()
      victoryScreen.dispose()
      const result = await showTitleScreen({})
      startGame(result.player1Name, result.player2Name)
    }
  })
  victoryScreen.show()
}

async function handleGameDraw(reason: string, stats: GameStats): Promise<void> {
  if (!engine || !gameUI) return

  const state = engine.getState()

  console.log(`Game ended in a draw! Reason: ${reason}`)

  // Clean up game UI
  gameUI.scene.stop()
  gameUI.inputManager.dispose()
  gameUI.textManager.dispose()

  // Show draw screen (using victory screen with draw message)
  const victoryScreen = new VictoryScreen({
    winnerName: "It's a Draw!",
    winnerId: 'player1', // Arbitrary for draws
    stats,
    onPlayAgain: async () => {
      victoryScreen.hide()
      victoryScreen.dispose()
      const result = await showTitleScreen({
        defaultPlayer1Name: state.players.player1.name,
        defaultPlayer2Name: state.players.player2.name,
      })
      startGame(result.player1Name, result.player2Name)
    },
    onMainMenu: async () => {
      victoryScreen.hide()
      victoryScreen.dispose()
      const result = await showTitleScreen({})
      startGame(result.player1Name, result.player2Name)
    }
  })
  victoryScreen.show()
}

// =============================================================================
// Start the Application
// =============================================================================

// Wait for DOM to be ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init)
} else {
  init()
}
