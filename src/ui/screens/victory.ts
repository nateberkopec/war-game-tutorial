/**
 * Victory Screen - Shown when a player wins the game.
 * Includes animated celebration effects and game stats display.
 */

import { createButton } from '../text'
import type { GameStats, PlayerId } from '../../engine/types'

/**
 * Configuration for the victory screen.
 */
export interface VictoryScreenConfig {
  /** Name of the winning player */
  winnerName: string
  /** Which player won */
  winnerId: PlayerId
  /** Game statistics to display */
  stats?: GameStats
  /** Callback when user wants to play again */
  onPlayAgain?: () => void
  /** Callback when user wants to return to title */
  onMainMenu?: () => void
}

/**
 * VictoryScreen displays the game winner with celebration effects.
 */
export class VictoryScreen {
  private container: HTMLElement
  private confettiCanvas: HTMLCanvasElement | null = null
  private confettiCtx: CanvasRenderingContext2D | null = null
  private confettiAnimationId: number | null = null
  private confettiParticles: ConfettiParticle[] = []
  private onPlayAgainCallback?: () => void
  private onMainMenuCallback?: () => void

  constructor(config: VictoryScreenConfig) {
    this.onPlayAgainCallback = config.onPlayAgain
    this.onMainMenuCallback = config.onMainMenu
    this.container = this.createContainer()
    this.render(config)
  }

  private createContainer(): HTMLElement {
    const container = document.createElement('div')
    container.id = 'victory-screen'
    container.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background: rgba(26, 26, 46, 0.95);
      z-index: 200;
      font-family: Arial, sans-serif;
      opacity: 0;
      transition: opacity 0.5s ease-out;
    `
    return container
  }

  private render(config: VictoryScreenConfig): void {
    // Create confetti canvas
    this.createConfettiCanvas()

    // Winner announcement
    const winnerText = document.createElement('h1')
    winnerText.innerHTML = `🎉 ${config.winnerName} WINS! 🎉`
    winnerText.style.cssText = `
      font-size: 64px;
      color: #ffd700;
      margin: 0 0 20px 0;
      text-shadow: 0 0 20px rgba(255,215,0,0.8),
                   0 0 40px rgba(255,215,0,0.4),
                   3px 3px 6px rgba(0,0,0,0.5);
      animation: winnerPulse 1s ease-in-out infinite;
      text-align: center;
    `

    // Add animation
    const style = document.createElement('style')
    style.textContent = `
      @keyframes winnerPulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.05); }
      }
      @keyframes statsFadeIn {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
      }
    `
    document.head.appendChild(style)

    // Stats container
    const statsContainer = this.createStatsDisplay(config.stats)

    // Buttons container
    const buttonsContainer = document.createElement('div')
    buttonsContainer.style.cssText = `
      display: flex;
      gap: 20px;
      margin-top: 40px;
    `

    // Play Again button
    const playAgainButton = createButton('PLAY AGAIN', () => {
      this.onPlayAgainCallback?.()
    }, { fontSize: '24px' })
    playAgainButton.style.pointerEvents = 'auto'

    // Main Menu button
    const mainMenuButton = createButton('MAIN MENU', () => {
      this.onMainMenuCallback?.()
    }, { fontSize: '20px' })
    mainMenuButton.style.pointerEvents = 'auto'
    mainMenuButton.style.background = 'linear-gradient(180deg, #666666 0%, #444444 100%)'
    mainMenuButton.style.borderColor = '#333333'

    buttonsContainer.appendChild(playAgainButton)
    buttonsContainer.appendChild(mainMenuButton)

    // Assemble
    this.container.appendChild(winnerText)
    this.container.appendChild(statsContainer)
    this.container.appendChild(buttonsContainer)
  }

  private createStatsDisplay(stats?: GameStats): HTMLElement {
    const container = document.createElement('div')
    container.style.cssText = `
      background: rgba(0, 0, 0, 0.5);
      border-radius: 12px;
      padding: 24px 40px;
      margin: 20px 0;
      animation: statsFadeIn 0.5s ease-out 0.3s both;
    `

    const title = document.createElement('h2')
    title.textContent = '— GAME STATS —'
    title.style.cssText = `
      font-size: 24px;
      color: #aaaaaa;
      margin: 0 0 20px 0;
      text-align: center;
      letter-spacing: 4px;
    `
    container.appendChild(title)

    const statsGrid = document.createElement('div')
    statsGrid.style.cssText = `
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px 40px;
    `

    const statItems = [
      { label: 'Total Rounds', value: stats?.totalRounds ?? '-' },
      { label: 'Wars Fought', value: stats?.warsCount ?? '-' },
      { label: 'Longest War Chain', value: stats?.longestWarChain ?? '-' },
      { label: 'Largest War Pot', value: stats?.largestWarPot ?? '-' },
      { label: 'P1 Rounds Won', value: stats?.player1RoundsWon ?? '-' },
      { label: 'P2 Rounds Won', value: stats?.player2RoundsWon ?? '-' }
    ]

    for (const item of statItems) {
      const statRow = document.createElement('div')
      statRow.style.cssText = `
        display: flex;
        justify-content: space-between;
        gap: 20px;
      `

      const label = document.createElement('span')
      label.textContent = item.label + ':'
      label.style.cssText = `
        color: #888888;
        font-size: 16px;
      `

      const value = document.createElement('span')
      value.textContent = String(item.value)
      value.style.cssText = `
        color: #ffffff;
        font-size: 16px;
        font-weight: bold;
      `

      statRow.appendChild(label)
      statRow.appendChild(value)
      statsGrid.appendChild(statRow)
    }

    container.appendChild(statsGrid)
    return container
  }

  private createConfettiCanvas(): void {
    this.confettiCanvas = document.createElement('canvas')
    this.confettiCanvas.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
    `
    this.confettiCanvas.width = window.innerWidth
    this.confettiCanvas.height = window.innerHeight
    this.confettiCtx = this.confettiCanvas.getContext('2d')
    this.container.appendChild(this.confettiCanvas)

    // Initialize confetti particles
    this.initConfetti()
  }

  private initConfetti(): void {
    const colors = ['#ff6b6b', '#4ecdc4', '#ffe66d', '#95e1d3', '#f38181', '#aa96da']
    
    for (let i = 0; i < 150; i++) {
      this.confettiParticles.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight - window.innerHeight,
        size: Math.random() * 10 + 5,
        color: colors[Math.floor(Math.random() * colors.length)],
        speedY: Math.random() * 3 + 2,
        speedX: (Math.random() - 0.5) * 2,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 10
      })
    }
  }

  private animateConfetti(): void {
    if (!this.confettiCtx || !this.confettiCanvas) return

    this.confettiCtx.clearRect(0, 0, this.confettiCanvas.width, this.confettiCanvas.height)

    for (const particle of this.confettiParticles) {
      this.confettiCtx.save()
      this.confettiCtx.translate(particle.x, particle.y)
      this.confettiCtx.rotate((particle.rotation * Math.PI) / 180)
      this.confettiCtx.fillStyle = particle.color
      this.confettiCtx.fillRect(-particle.size / 2, -particle.size / 2, particle.size, particle.size / 2)
      this.confettiCtx.restore()

      // Update position
      particle.y += particle.speedY
      particle.x += particle.speedX
      particle.rotation += particle.rotationSpeed

      // Reset if off screen
      if (particle.y > window.innerHeight) {
        particle.y = -particle.size
        particle.x = Math.random() * window.innerWidth
      }
    }

    this.confettiAnimationId = requestAnimationFrame(() => this.animateConfetti())
  }

  /**
   * Show the victory screen with animation.
   */
  show(): void {
    if (!this.container.parentElement) {
      document.body.appendChild(this.container)
    }
    
    // Force reflow then animate in
    this.container.offsetHeight
    this.container.style.opacity = '1'
    
    // Start confetti
    this.animateConfetti()
  }

  /**
   * Hide the victory screen.
   */
  hide(duration: number = 500): Promise<void> {
    return new Promise(resolve => {
      // Stop confetti
      if (this.confettiAnimationId !== null) {
        cancelAnimationFrame(this.confettiAnimationId)
        this.confettiAnimationId = null
      }

      this.container.style.opacity = '0'
      
      setTimeout(() => {
        this.container.style.display = 'none'
        resolve()
      }, duration)
    })
  }

  /**
   * Set callbacks.
   */
  onPlayAgain(callback: () => void): void {
    this.onPlayAgainCallback = callback
  }

  onMainMenu(callback: () => void): void {
    this.onMainMenuCallback = callback
  }

  /**
   * Clean up the victory screen.
   */
  dispose(): void {
    if (this.confettiAnimationId !== null) {
      cancelAnimationFrame(this.confettiAnimationId)
    }
    this.container.remove()
  }
}

/**
 * Confetti particle definition.
 */
interface ConfettiParticle {
  x: number
  y: number
  size: number
  color: string
  speedY: number
  speedX: number
  rotation: number
  rotationSpeed: number
}

/**
 * Show the victory screen and wait for user action.
 */
export function showVictoryScreen(config: VictoryScreenConfig): Promise<'playAgain' | 'mainMenu'> {
  return new Promise(resolve => {
    const screen = new VictoryScreen({
      ...config,
      onPlayAgain: async () => {
        await screen.hide()
        screen.dispose()
        resolve('playAgain')
      },
      onMainMenu: async () => {
        await screen.hide()
        screen.dispose()
        resolve('mainMenu')
      }
    })
    screen.show()
  })
}
