/**
 * Main entry point for War Card Game.
 * Integrates engine, UI, and persistence systems.
 */

import { WarGameEngine, type PlayerId, type GameStats, type RulePreset, getPreset } from './engine'
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
  autoDrawButton: HTMLButtonElement | null
}

// Auto-draw state
let isAutoDrawing = false
let autoDrawTimeoutId: number | null = null
const AUTO_DRAW_DELAY = 800 // ms between auto-draws

let engine: WarGameEngine | null = null
let gameUI: GameUI | null = null

// Track round winner for animation purposes
let lastRoundWinner: PlayerId | null = null
// Track drawn cards for animation
let pendingCardAnimations: Array<{ player: 'player1' | 'player2', rank: Rank, suit: Suit }> = []

// Delay configuration
const WIN_DISPLAY_DELAY = 5000 // 5 seconds to show "Player X wins!"

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
  
  // Start the game with the player names, preset, and optional seed
  startGame(result.player1Name, result.player2Name, result.preset, result.seed)
}

// =============================================================================
// Game Flow
// =============================================================================

async function startGame(
  player1Name: string,
  player2Name: string,
  preset: RulePreset = 'classic',
  seed?: string
): Promise<void> {
  console.log(`Starting game: ${player1Name} vs ${player2Name} (${preset} mode)${seed ? ` [seed: ${seed}]` : ''}`)

  // Clean up previous game UI if any
  if (gameUI) {
    gameUI.scene.dispose()
    gameUI.textManager.dispose()
    gameUI.inputManager.dispose()
    gameUI = null
  }

  // Create engine with selected preset
  // Check for quick mode override via URL param (for testing)
  const urlParams = new URLSearchParams(window.location.search)
  const quickMode = urlParams.get('quick') === 'true'
  
  let config
  if (quickMode) {
    console.log('Quick mode enabled via URL param - overriding preset')
    config = { ...getPreset('quick'), seed }
  } else if (preset !== 'custom') {
    config = { ...getPreset(preset), seed }
  } else {
    config = seed ? { seed } : undefined
  }
  
  engine = config ? new WarGameEngine(config) : new WarGameEngine()
  engine.setPlayers(
    { id: 'player1', name: player1Name },
    { id: 'player2', name: player2Name }
  )

  // Set up UI
  const container = document.getElementById('app')!
  const scene = new GameScene(container)
  const textManager = new UITextManager()
  const inputManager = new InputManager()

  gameUI = { scene, textManager, inputManager, autoDrawButton: null }

  // Create auto-draw button
  createAutoDrawButton()

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
    if (event.type === 'cardsDrawn') {
      const { cards } = event
      // Queue card animations to be played after engine.draw() completes
      pendingCardAnimations = [
        { player: 'player1', rank: cards.player1.rank as Rank, suit: cards.player1.suit as Suit },
        { player: 'player2', rank: cards.player2.rank as Rank, suit: cards.player2.suit as Suit }
      ]
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
      // Show for full WIN_DISPLAY_DELAY duration (user can click to skip)
      gameUI.textManager.showAnnouncement(`${winnerName} wins!`, WIN_DISPLAY_DELAY)
      // Track winner for collect animation
      lastRoundWinner = event.winner
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

function createAutoDrawButton(): void {
  if (!gameUI) return

  const button = document.createElement('button')
  button.id = 'auto-draw-button'
  button.textContent = 'Auto Draw: OFF'
  button.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    padding: 12px 24px;
    font-size: 16px;
    font-weight: bold;
    color: white;
    background: linear-gradient(180deg, #4a90d9 0%, #357abd 100%);
    border: none;
    border-radius: 8px;
    cursor: pointer;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
    transition: transform 0.1s, box-shadow 0.1s;
    z-index: 1000;
    user-select: none;
    -webkit-user-select: none;
  `

  button.addEventListener('mouseenter', () => {
    button.style.transform = 'scale(1.05)'
    button.style.boxShadow = '0 6px 8px rgba(0, 0, 0, 0.4)'
  })

  button.addEventListener('mouseleave', () => {
    button.style.transform = 'scale(1)'
    button.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.3)'
  })

  button.addEventListener('click', (e) => {
    e.stopPropagation()
    toggleAutoDraw()
  })

  document.body.appendChild(button)
  gameUI.autoDrawButton = button
}

function toggleAutoDraw(): void {
  isAutoDrawing = !isAutoDrawing
  
  if (gameUI?.autoDrawButton) {
    if (isAutoDrawing) {
      gameUI.autoDrawButton.textContent = 'Auto Draw: ON'
      gameUI.autoDrawButton.style.background = 'linear-gradient(180deg, #5cb85c 0%, #449d44 100%)'
    } else {
      gameUI.autoDrawButton.textContent = 'Auto Draw: OFF'
      gameUI.autoDrawButton.style.background = 'linear-gradient(180deg, #4a90d9 0%, #357abd 100%)'
      // Clear any pending auto-draw
      if (autoDrawTimeoutId !== null) {
        clearTimeout(autoDrawTimeoutId)
        autoDrawTimeoutId = null
      }
    }
  }
}

function stopAutoDraw(): void {
  isAutoDrawing = false
  if (autoDrawTimeoutId !== null) {
    clearTimeout(autoDrawTimeoutId)
    autoDrawTimeoutId = null
  }
  if (gameUI?.autoDrawButton) {
    gameUI.autoDrawButton.textContent = 'Auto Draw: OFF'
    gameUI.autoDrawButton.style.background = 'linear-gradient(180deg, #4a90d9 0%, #357abd 100%)'
  }
}

function removeAutoDrawButton(): void {
  if (gameUI?.autoDrawButton) {
    gameUI.autoDrawButton.remove()
    gameUI.autoDrawButton = null
  }
  stopAutoDraw()
}

/**
 * Wait for either a timeout or user input, whichever comes first.
 * Uses AbortController to properly clean up the input listener.
 * Returns true if user input occurred, false if timeout completed.
 */
async function waitWithInterrupt(timeoutMs: number): Promise<boolean> {
  return new Promise((resolve) => {
    const abortController = new AbortController()
    let resolved = false
    
    const cleanup = () => {
      if (!resolved) {
        resolved = true
        abortController.abort()
      }
    }
    
    const timeoutId = setTimeout(() => {
      cleanup()
      resolve(false)
    }, timeoutMs)
    
    // Set up input listener with abort signal for cleanup
    const handleInput = () => {
      if (!resolved) {
        clearTimeout(timeoutId)
        cleanup()
        resolve(true)
      }
    }
    
    // Listen for click, touch, or key events
    const options = { once: true, signal: abortController.signal }
    document.addEventListener('click', handleInput, options)
    document.addEventListener('touchstart', handleInput, options)
    document.addEventListener('keydown', handleInput, options)
  })
}

async function gameLoop(): Promise<void> {
  if (!engine || !gameUI) return

  const state = engine.getState()

  // Check if game is over
  if (state.phase === 'finished') {
    return
  }

  // Wait for user input OR auto-draw timer
  if (isAutoDrawing) {
    await new Promise<void>((resolve) => {
      autoDrawTimeoutId = window.setTimeout(resolve, AUTO_DRAW_DELAY)
    })
    autoDrawTimeoutId = null
  } else {
    await waitForAnyInput()
  }

  // Check if game ended or auto-draw was stopped while waiting
  if (!engine || !gameUI) return
  const currentState = engine.getState()
  if (currentState.phase === 'finished') {
    return
  }

  // Reset tracking variables
  lastRoundWinner = null
  pendingCardAnimations = []

  // Execute draw (this populates pendingCardAnimations and lastRoundWinner via events)
  try {
    engine.draw()
  } catch (error) {
    console.error('Error during draw:', error)
    return
  }

  // Animate cards being drawn from decks to battlefield
  if (pendingCardAnimations.length > 0 && gameUI) {
    // Animate both cards in parallel
    await Promise.all(
      pendingCardAnimations.map(({ player, rank, suit }) =>
        gameUI!.scene.showBattleCard(player, rank, suit, true)
      )
    )
  }

  // Update UI (deck counts)
  updateUI()

  // Wait for WIN_DISPLAY_DELAY or user click (whichever comes first)
  // This gives users time to see the result but allows them to proceed immediately
  // In auto-draw mode, use a shorter delay to keep the game moving
  if (isAutoDrawing) {
    await new Promise((resolve) => setTimeout(resolve, 800))
  } else {
    await waitWithInterrupt(WIN_DISPLAY_DELAY)
  }

  // Clear battlefield for next round (unless in war)
  const newState = engine.getState()
  if (newState.phase === 'playing' && gameUI) {
    // Animate cards going back to winner's deck
    if (lastRoundWinner) {
      await gameUI.scene.collectCardsToWinner(lastRoundWinner)
    } else {
      // Fallback: just clear without animation
      gameUI.scene.clearBattlefield()
    }
    // Update deck visuals after cards collected
    updateUI()
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
  removeAutoDrawButton()

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
      startGame(result.player1Name, result.player2Name, result.preset, result.seed)
    },
    onMainMenu: async () => {
      victoryScreen.hide()
      victoryScreen.dispose()
      const result = await showTitleScreen({})
      startGame(result.player1Name, result.player2Name, result.preset, result.seed)
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
  removeAutoDrawButton()

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
      startGame(result.player1Name, result.player2Name, result.preset, result.seed)
    },
    onMainMenu: async () => {
      victoryScreen.hide()
      victoryScreen.dispose()
      const result = await showTitleScreen({})
      startGame(result.player1Name, result.player2Name, result.preset, result.seed)
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
