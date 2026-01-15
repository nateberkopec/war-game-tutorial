/**
 * Title Screen - Game start screen with player name inputs.
 */

import { createButton, createTextInput } from '../text'
import type { RulePreset } from '../../engine/types'
import { getPresetNames, describePreset } from '../../engine/presets'

/**
 * Player info collected from the title screen.
 */
export interface TitleScreenResult {
  player1Name: string
  player2Name: string
  /** Optional seed for reproducible games */
  seed?: string
  /** Selected rule preset */
  preset: RulePreset
}

/**
 * Configuration for the title screen.
 */
export interface TitleScreenConfig {
  /** Default name for player 1 */
  defaultPlayer1Name?: string
  /** Default name for player 2 */
  defaultPlayer2Name?: string
  /** Default seed value */
  defaultSeed?: string
  /** Default preset */
  defaultPreset?: RulePreset
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
  private seedInput: HTMLInputElement | null = null
  private selectedPreset: RulePreset = 'classic'

  constructor(config: TitleScreenConfig = {}) {
    this.onStartCallback = config.onStart
    this.selectedPreset = config.defaultPreset || 'classic'
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

    // Preset selection
    const presetSection = this.createPresetSection()
    inputsContainer.appendChild(presetSection)

    // Seed input row (optional, in a collapsible section)
    const seedSection = this.createSeedSection(config.defaultSeed)
    inputsContainer.appendChild(seedSection)

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

  private createPresetSection(): HTMLElement {
    const container = document.createElement('div')
    container.style.cssText = `
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
      margin-top: 20px;
    `

    const label = document.createElement('label')
    label.textContent = 'Game Mode:'
    label.style.cssText = `
      font-size: 18px;
      color: #a8dadc;
    `

    const buttonsContainer = document.createElement('div')
    buttonsContainer.style.cssText = `
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 10px;
      max-width: 500px;
    `

    const presets = getPresetNames().filter(p => p !== 'custom')
    const presetButtons: HTMLButtonElement[] = []

    for (const preset of presets) {
      const btn = document.createElement('button')
      btn.textContent = preset.charAt(0).toUpperCase() + preset.slice(1)
      btn.title = describePreset(preset)
      btn.style.cssText = `
        background: ${preset === this.selectedPreset ? '#457b9d' : 'rgba(69, 123, 157, 0.3)'};
        border: 2px solid ${preset === this.selectedPreset ? '#a8dadc' : '#457b9d'};
        color: white;
        padding: 8px 16px;
        border-radius: 6px;
        cursor: pointer;
        font-size: 14px;
        transition: all 0.2s ease;
        pointer-events: auto;
      `

      btn.addEventListener('mouseenter', () => {
        if (preset !== this.selectedPreset) {
          btn.style.background = 'rgba(69, 123, 157, 0.5)'
        }
      })
      btn.addEventListener('mouseleave', () => {
        if (preset !== this.selectedPreset) {
          btn.style.background = 'rgba(69, 123, 157, 0.3)'
        }
      })

      btn.addEventListener('click', () => {
        this.selectedPreset = preset
        // Update button styles
        presetButtons.forEach(b => {
          const isSelected = b === btn
          b.style.background = isSelected ? '#457b9d' : 'rgba(69, 123, 157, 0.3)'
          b.style.borderColor = isSelected ? '#a8dadc' : '#457b9d'
        })
        // Update description
        descriptionEl.textContent = describePreset(preset)
      })

      presetButtons.push(btn)
      buttonsContainer.appendChild(btn)
    }

    const descriptionEl = document.createElement('p')
    descriptionEl.textContent = describePreset(this.selectedPreset)
    descriptionEl.style.cssText = `
      font-size: 14px;
      color: #888;
      text-align: center;
      margin: 0;
      min-height: 20px;
    `

    container.appendChild(label)
    container.appendChild(buttonsContainer)
    container.appendChild(descriptionEl)

    return container
  }

  private createSeedSection(defaultSeed?: string): HTMLElement {
    const container = document.createElement('div')
    container.style.cssText = `
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      margin-top: 10px;
    `

    // Toggle button to show/hide seed input
    const toggleBtn = document.createElement('button')
    toggleBtn.textContent = 'Advanced Options'
    toggleBtn.style.cssText = `
      background: transparent;
      border: 1px solid #457b9d;
      color: #a8dadc;
      padding: 6px 16px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      transition: all 0.2s ease;
    `
    toggleBtn.addEventListener('mouseenter', () => {
      toggleBtn.style.background = 'rgba(69, 123, 157, 0.2)'
    })
    toggleBtn.addEventListener('mouseleave', () => {
      toggleBtn.style.background = 'transparent'
    })

    // Seed input row (hidden by default)
    const seedRow = document.createElement('div')
    seedRow.style.cssText = `
      display: none;
      align-items: center;
      gap: 16px;
      margin-top: 8px;
    `

    const labelElement = document.createElement('label')
    labelElement.textContent = 'Seed:'
    labelElement.style.cssText = `
      font-size: 16px;
      color: #a8dadc;
      width: 100px;
      text-align: right;
    `

    this.seedInput = createTextInput('Seed')
    this.seedInput.value = defaultSeed || ''
    this.seedInput.placeholder = 'Leave empty for random'
    this.seedInput.style.pointerEvents = 'auto'
    this.seedInput.style.width = '200px'
    this.seedInput.style.fontSize = '14px'

    // Handle Enter key
    this.seedInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        this.handleStart()
      }
    })

    // Random seed button
    const randomBtn = document.createElement('button')
    randomBtn.textContent = 'Random'
    randomBtn.style.cssText = `
      background: #457b9d;
      border: none;
      color: white;
      padding: 8px 12px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 12px;
    `
    randomBtn.addEventListener('click', () => {
      if (this.seedInput) {
        this.seedInput.value = Math.random().toString(36).substring(2, 10)
      }
    })

    seedRow.appendChild(labelElement)
    seedRow.appendChild(this.seedInput)
    seedRow.appendChild(randomBtn)

    // Toggle visibility
    toggleBtn.addEventListener('click', () => {
      const isHidden = seedRow.style.display === 'none'
      seedRow.style.display = isHidden ? 'flex' : 'none'
      toggleBtn.textContent = isHidden ? 'Hide Options' : 'Advanced Options'
    })

    container.appendChild(toggleBtn)
    container.appendChild(seedRow)

    return container
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
    const seed = this.seedInput?.value.trim() || undefined

    this.onStartCallback?.({
      player1Name,
      player2Name,
      seed,
      preset: this.selectedPreset,
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
