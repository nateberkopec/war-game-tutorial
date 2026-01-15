/**
 * Main entry point for War Card Game
 * 
 * Wires together the game engine, UI, and persistence layers.
 */

import { WarGameEngine } from './engine/engine'
import type { GameEvent, PlayerId, GameStats } from './engine/types'
import { GameScene } from './ui/game-scene'
import { showTitleScreen, showVictoryScreen, UITextManager } from './ui'
import type { Rank, Suit } from './ui/card'

// Game state
let engine: WarGameEngine | null = null
let gameScene: GameScene | null = null
let uiText: UITextManager | null = null
let isWaitingForClick = false
let currentPhase: 'title' | 'playing' | 'victory' = 'title'

/**
 * Initialize the game
 */
async function init() {
  console.log('War Card Game - Starting...')
  
  // Show title screen and get player names
  const { player1Name, player2Name } = await showTitleScreen({
    defaultPlayer1Name: 'Player 1',
    defaultPlayer2Name: 'Player 2'
  })
  
  // Start a new game with those names
  startGame(player1Name, player2Name)
}

/**
 * Start a new game with the given player names
 */
function startGame(player1Name: string, player2Name: string) {
  currentPhase = 'playing'
  
  // Create game engine
  engine = new WarGameEngine()
  engine.setPlayers(
    { id: 'player1', name: player1Name },
    { id: 'player2', name: player2Name }
  )
  
  // Subscribe to game events
  engine.on('*', handleGameEvent)
  
  // Create game scene
  gameScene = new GameScene()
  gameScene.start()
  
  // Create UI text manager
  uiText = new UITextManager()
  
  // Start the game
  engine.start()
  
  // Update UI
  updateUI()
  promptForClick('Click anywhere to draw cards')
  
  // Listen for clicks
  document.addEventListener('click', handleClick)
  document.addEventListener('keydown', handleKeyDown)
}

/**
 * Handle game events from the engine
 */
function handleGameEvent(event: GameEvent) {
  console.log('Game event:', event.type, event)
  
  switch (event.type) {
    case 'gameStarted':
      updateUI()
      break
      
    case 'cardsDrawn':
      // Show cards on battlefield
      if (gameScene) {
        const p1Card = event.cards.player1
        const p2Card = event.cards.player2
        gameScene.showBattleCard('player1', p1Card.rank as Rank, p1Card.suit as Suit, true)
        gameScene.showBattleCard('player2', p2Card.rank as Rank, p2Card.suit as Suit, true)
      }
      break
      
    case 'comparison':
      if (event.result === 'tie') {
        promptForClick('WAR! Click to continue...')
      } else {
        const winner = event.result as PlayerId
        const winnerName = engine?.getState().players[winner].name || winner
        promptForClick(`${winnerName} wins this round! Click to continue...`)
      }
      break
      
    case 'roundWon':
      // Update deck counts after a short delay
      setTimeout(() => {
        if (gameScene && engine) {
          const state = engine.getState()
          gameScene.clearBattlefield()
          gameScene.updateDecks(
            state.players.player1.deck.length,
            state.players.player2.deck.length
          )
          updateUI()
          promptForClick('Click anywhere to draw cards')
        }
      }, 500)
      break
      
    case 'warStarted':
      if (uiText) {
        uiText.showText('war-banner', 'WAR!', {
          x: '50%',
          y: '40%'
        }, {
          fontSize: '72px',
          color: '#ff4444'
        })
        
        // Hide after 1 second
        setTimeout(() => {
          uiText?.hideText('war-banner')
        }, 1000)
      }
      break
      
    case 'warResolved':
      const resolveWinner = event.winner as PlayerId
      const resolveWinnerName = engine?.getState().players[resolveWinner].name || resolveWinner
      promptForClick(`${resolveWinnerName} wins the war! Click to continue...`)
      
      setTimeout(() => {
        if (gameScene) {
          gameScene.clearWarPile()
        }
      }, 500)
      break
      
    case 'gameEnded':
      handleGameEnd(event.winner, event.stats)
      break
  }
}

/**
 * Handle game end
 */
async function handleGameEnd(winner: PlayerId, stats: GameStats) {
  currentPhase = 'victory'
  
  const winnerName = engine?.getState().players[winner].name || winner
  
  // Clean up game scene
  if (gameScene) {
    gameScene.stop()
    gameScene.dispose()
    gameScene = null
  }
  
  // Clean up UI text
  if (uiText) {
    uiText.dispose()
    uiText = null
  }
  
  // Remove event listeners
  document.removeEventListener('click', handleClick)
  document.removeEventListener('keydown', handleKeyDown)
  
  // Show victory screen
  await showVictoryScreen({
    winnerName,
    winnerId: winner,
    stats,
    onPlayAgain: () => {
      // Restart the game
      init()
    }
  })
}

/**
 * Handle click events
 */
function handleClick(event: MouseEvent) {
  // Don't handle clicks on interactive elements
  if ((event.target as HTMLElement).tagName === 'INPUT' ||
      (event.target as HTMLElement).tagName === 'BUTTON') {
    return
  }
  
  if (currentPhase === 'playing' && isWaitingForClick && engine) {
    isWaitingForClick = false
    hidePrompt()
    
    const state = engine.getState()
    if (state.phase === 'playing' || state.phase === 'war') {
      engine.draw()
    }
  }
}

/**
 * Handle keyboard events
 */
function handleKeyDown(event: KeyboardEvent) {
  if (event.key === ' ' || event.key === 'Enter') {
    handleClick(new MouseEvent('click'))
  }
}

/**
 * Update the UI with current game state
 */
function updateUI() {
  if (!engine || !uiText) return
  
  const state = engine.getState()
  
  // Update player info
  uiText.setText('player1-name', state.players.player1.name, {
    x: '10%',
    y: '5%'
  }, {
    fontSize: '24px',
    color: '#ffffff'
  })
  
  uiText.setText('player1-cards', `Cards: ${state.players.player1.deck.length}`, {
    x: '10%',
    y: '10%'
  }, {
    fontSize: '18px',
    color: '#cccccc'
  })
  
  uiText.setText('player2-name', state.players.player2.name, {
    x: '90%',
    y: '5%'
  }, {
    fontSize: '24px',
    color: '#ffffff'
  })
  
  uiText.setText('player2-cards', `Cards: ${state.players.player2.deck.length}`, {
    x: '90%',
    y: '10%'
  }, {
    fontSize: '18px',
    color: '#cccccc'
  })
}

/**
 * Show a prompt message
 */
function promptForClick(message: string) {
  isWaitingForClick = true
  
  if (uiText) {
    uiText.setText('prompt', message, {
      x: '50%',
      y: '90%'
    }, {
      fontSize: '20px',
      color: '#aaaaaa'
    })
  }
}

/**
 * Hide the prompt message
 */
function hidePrompt() {
  if (uiText) {
    uiText.hideText('prompt')
  }
}

// Start the game when the page loads
window.addEventListener('DOMContentLoaded', init)
