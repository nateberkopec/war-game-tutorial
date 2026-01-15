/**
 * Title Screen - Game start screen with player name inputs.
 */

import { createButton, createTextInput } from '../text'

/**
 * Player info collected from the title screen.
 */
export interface TitleScreenResult {
  player1Name: string
  player2Name: string
}

/**
 * Configuration for the title screen.
 */
export interface TitleScreenConfig {
  /** Default name for player 1 */
  defaultPlayer1Name?: string
  /** Default name for player 2 */
  defaultPlayer2Name?: string
  /** Callback when game starts */
  onStart?: (result: TitleScreenResult) => void
}

/**
 * TitleScreen renders the game's title screen with name inputs.
 */
export class TitleScreen {
  private container: HTMLElement
  private onStartCallback?: (result: TitleScreenResult) => void
  private player1Input: HTMLInputElement | null = null
  private player2Input: HTMLInputElement | null = null

  constructor(config: TitleScreenConfig = {}) {
    this.onStartCallback = config.onStart
    this.container = this.createContainer()
    this.render(config)
  }

  private createContainer(): HTMLElement {
    const container = document.createElement('div')
    container.id = 'title-screen'
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
      background: linear-gradient(180deg, #1a1a2e 0%, #16213e 100%);
      z-index: 200;
      font-family: Arial, sans-serif;
    `
    return container
  }

  private render(config: TitleScreenConfig): void {
    // Title
    const title = document.createElement('h1')
    title.textContent = 'WAR'
    title.style.cssText = `
      font-size: 96px;
      color: #ffffff;
      margin: 0 0 20px 0;
      text-shadow: 0 0 30px rgba(255,255,255,0.5), 
                   0 0 60px rgba(74,144,217,0.5),
                   4px 4px 8px rgba(0,0,0,0.5);
      letter-spacing: 20px;
      animation: titlePulse 2s ease-in-out infinite;
    `

    // Add animation keyframes
    const style = document.createElement('style')
    style.textContent = `
      @keyframes titlePulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.02); }
      }
    `
    document.head.appendChild(style)

    // Subtitle
    const subtitle = document.createElement('p')
    subtitle.textContent = 'The Classic Card Game'
    subtitle.style.cssText = `
      font-size: 24px;
      color: #888888;
      margin: 0 0 60px 0;
      letter-spacing: 4px;
    `

    // Player inputs container
    const inputsContainer = document.createElement('div')
    inputsContainer.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 20px;
      margin-bottom: 40px;
    `

    // Player 1 input row
    const player1Row = this.createPlayerInputRow(
      'Player 1',
      config.defaultPlayer1Name || 'Player 1'
    )
    this.player1Input = player1Row.input

    // Player 2 input row
    const player2Row = this.createPlayerInputRow(
      'Player 2',
      config.defaultPlayer2Name || 'Player 2'
    )
    this.player2Input = player2Row.input

    inputsContainer.appendChild(player1Row.container)
    inputsContainer.appendChild(player2Row.container)

    // Start button
    const startButton = createButton('START GAME', () => this.handleStart(), {
      fontSize: '28px'
    })
    startButton.style.marginTop = '20px'
    startButton.style.padding = '16px 48px'
    startButton.style.pointerEvents = 'auto'

    // Assemble
    this.container.appendChild(title)
    this.container.appendChild(subtitle)
    this.container.appendChild(inputsContainer)
    this.container.appendChild(startButton)
  }

  private createPlayerInputRow(
    label: string,
    defaultValue: string
  ): { container: HTMLElement; input: HTMLInputElement } {
    const container = document.createElement('div')
    container.style.cssText = `
      display: flex;
      align-items: center;
      gap: 16px;
    `

    const labelElement = document.createElement('label')
    labelElement.textContent = label + ':'
    labelElement.style.cssText = `
      font-size: 20px;
      color: #ffffff;
      width: 100px;
      text-align: right;
    `

    const input = createTextInput(label)
    input.value = defaultValue
    input.style.pointerEvents = 'auto'
    
    // Handle Enter key
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        this.handleStart()
      }
    })

    container.appendChild(labelElement)
    container.appendChild(input)

    return { container, input }
  }

  private handleStart(): void {
    const player1Name = this.player1Input?.value.trim() || 'Player 1'
    const player2Name = this.player2Input?.value.trim() || 'Player 2'

    this.onStartCallback?.({
      player1Name,
      player2Name
    })
  }

  /**
   * Show the title screen.
   */
  show(): void {
    if (!this.container.parentElement) {
      document.body.appendChild(this.container)
    }
    this.container.style.display = 'flex'
    
    // Focus first input
    setTimeout(() => {
      this.player1Input?.focus()
      this.player1Input?.select()
    }, 100)
  }

  /**
   * Hide the title screen with fade animation.
   */
  hide(duration: number = 500): Promise<void> {
    return new Promise(resolve => {
      this.container.style.transition = `opacity ${duration}ms ease-out`
      this.container.style.opacity = '0'
      
      setTimeout(() => {
        this.container.style.display = 'none'
        resolve()
      }, duration)
    })
  }

  /**
   * Set the callback for when the game starts.
   */
  onStart(callback: (result: TitleScreenResult) => void): void {
    this.onStartCallback = callback
  }

  /**
   * Clean up the title screen.
   */
  dispose(): void {
    this.container.remove()
  }
}

/**
 * Show the title screen and wait for user to start the game.
 */
export function showTitleScreen(config: TitleScreenConfig = {}): Promise<TitleScreenResult> {
  return new Promise(resolve => {
    const screen = new TitleScreen({
      ...config,
      onStart: async (result) => {
        await screen.hide()
        screen.dispose()
        resolve(result)
      }
    })
    screen.show()
  })
}
