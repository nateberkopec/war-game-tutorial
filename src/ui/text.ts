/**
 * UI Text Rendering - HTML overlay for text elements.
 * Uses HTML/CSS for crisp text rendering instead of Three.js sprites.
 */

/**
 * Text element configuration.
 */
export interface TextConfig {
  /** CSS font-size (default: '24px') */
  fontSize?: string
  /** CSS color (default: '#ffffff') */
  color?: string
  /** CSS font-family (default: 'Arial, sans-serif') */
  fontFamily?: string
  /** CSS font-weight (default: 'normal') */
  fontWeight?: string
  /** CSS text-shadow for glow/outline effects */
  textShadow?: string
  /** Additional CSS classes */
  className?: string
}

/**
 * Position for text elements (screen-space).
 */
export interface TextPosition {
  x: string  // CSS value like '50%' or '100px'
  y: string  // CSS value like '50%' or '100px'
}

/**
 * UITextManager manages HTML overlay text elements.
 */
export class UITextManager {
  private container: HTMLElement
  private elements: Map<string, HTMLElement> = new Map()

  constructor(container?: HTMLElement) {
    // Create or use existing overlay container
    if (container) {
      this.container = container
    } else {
      this.container = document.createElement('div')
      this.container.id = 'ui-text-overlay'
      this.container.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 100;
        overflow: hidden;
      `
      document.body.appendChild(this.container)
    }
  }

  /**
   * Create or update a text element.
   */
  setText(
    id: string,
    text: string,
    position: TextPosition,
    config: TextConfig = {}
  ): HTMLElement {
    let element = this.elements.get(id)
    
    if (!element) {
      element = document.createElement('div')
      element.id = `ui-text-${id}`
      this.container.appendChild(element)
      this.elements.set(id, element)
    }

    const {
      fontSize = '24px',
      color = '#ffffff',
      fontFamily = 'Arial, sans-serif',
      fontWeight = 'normal',
      textShadow = '2px 2px 4px rgba(0,0,0,0.5)',
      className = ''
    } = config

    element.textContent = text
    element.className = className
    element.style.cssText = `
      position: absolute;
      left: ${position.x};
      top: ${position.y};
      transform: translate(-50%, -50%);
      font-size: ${fontSize};
      color: ${color};
      font-family: ${fontFamily};
      font-weight: ${fontWeight};
      text-shadow: ${textShadow};
      text-align: center;
      white-space: nowrap;
      pointer-events: none;
      user-select: none;
    `

    return element
  }

  /**
   * Show a text element with fade-in animation.
   */
  showText(
    id: string,
    text: string,
    position: TextPosition,
    config: TextConfig = {},
    duration: number = 300
  ): Promise<void> {
    const element = this.setText(id, text, position, config)
    element.style.opacity = '0'
    element.style.transition = `opacity ${duration}ms ease-out`
    
    // Force reflow
    element.offsetHeight
    
    element.style.opacity = '1'
    
    return new Promise(resolve => setTimeout(resolve, duration))
  }

  /**
   * Hide a text element with fade-out animation.
   */
  hideText(id: string, duration: number = 300): Promise<void> {
    const element = this.elements.get(id)
    if (!element) return Promise.resolve()

    element.style.transition = `opacity ${duration}ms ease-out`
    element.style.opacity = '0'

    return new Promise(resolve => {
      setTimeout(() => {
        element.style.display = 'none'
        resolve()
      }, duration)
    })
  }

  /**
   * Remove a text element completely.
   */
  removeText(id: string): void {
    const element = this.elements.get(id)
    if (element) {
      element.remove()
      this.elements.delete(id)
    }
  }

  /**
   * Show announcement text (center screen, dramatic).
   */
  showAnnouncement(
    text: string,
    duration: number = 2000,
    config: TextConfig = {}
  ): Promise<void> {
    const id = 'announcement'
    const position = { x: '50%', y: '50%' }
    
    const fullConfig: TextConfig = {
      fontSize: '48px',
      fontWeight: 'bold',
      color: '#ffdd00',
      textShadow: '0 0 20px rgba(255,221,0,0.8), 2px 2px 4px rgba(0,0,0,0.8)',
      ...config
    }

    return this.showText(id, text, position, fullConfig).then(() => {
      return new Promise(resolve => {
        setTimeout(async () => {
          await this.hideText(id)
          resolve()
        }, duration)
      })
    })
  }

  /**
   * Show "WAR!" dramatic text.
   */
  showWarAnnouncement(): Promise<void> {
    return this.showAnnouncement('WAR!', 1500, {
      fontSize: '72px',
      color: '#ff4444',
      textShadow: '0 0 30px rgba(255,68,68,0.9), 0 0 60px rgba(255,68,68,0.5), 3px 3px 6px rgba(0,0,0,0.8)'
    })
  }

  /**
   * Update player info display.
   */
  setPlayerInfo(
    player: 'player1' | 'player2',
    name: string,
    cardCount: number
  ): void {
    const id = `${player}-info`
    const position = player === 'player1' 
      ? { x: '15%', y: '10%' }
      : { x: '85%', y: '10%' }
    
    const text = `${name}\nCards: ${cardCount}`
    
    const element = this.setText(id, text, position, {
      fontSize: '18px',
      fontWeight: 'bold'
    })
    
    element.style.whiteSpace = 'pre-line'
  }

  /**
   * Show round result.
   */
  showRoundResult(winnerName: string, duration: number = 1500): Promise<void> {
    return this.showAnnouncement(`${winnerName} wins!`, duration, {
      fontSize: '36px',
      color: '#44ff44'
    })
  }

  /**
   * Show action prompt.
   */
  setPrompt(text: string): void {
    this.setText('prompt', text, { x: '50%', y: '90%' }, {
      fontSize: '20px',
      color: '#cccccc',
      fontWeight: 'normal'
    })
  }

  /**
   * Hide action prompt.
   */
  hidePrompt(): void {
    this.hideText('prompt', 200)
  }

  /**
   * Clear all text elements.
   */
  clear(): void {
    for (const [id] of this.elements) {
      this.removeText(id)
    }
  }

  /**
   * Dispose of the text manager.
   */
  dispose(): void {
    this.clear()
    if (this.container.id === 'ui-text-overlay') {
      this.container.remove()
    }
  }
}

/**
 * Create a styled button element.
 */
export function createButton(
  text: string,
  onClick: () => void,
  config: TextConfig = {}
): HTMLButtonElement {
  const button = document.createElement('button')
  button.textContent = text
  
  const {
    fontSize = '24px',
    color = '#ffffff',
    fontFamily = 'Arial, sans-serif',
    fontWeight = 'bold'
  } = config

  button.style.cssText = `
    font-size: ${fontSize};
    color: ${color};
    font-family: ${fontFamily};
    font-weight: ${fontWeight};
    background: linear-gradient(180deg, #4a90d9 0%, #357abd 100%);
    border: 2px solid #2a5a8a;
    border-radius: 8px;
    padding: 12px 32px;
    cursor: pointer;
    transition: all 0.2s ease;
    text-shadow: 1px 1px 2px rgba(0,0,0,0.3);
    box-shadow: 0 4px 6px rgba(0,0,0,0.3);
  `

  button.addEventListener('mouseenter', () => {
    button.style.background = 'linear-gradient(180deg, #5aa0e9 0%, #4a8acd 100%)'
    button.style.transform = 'translateY(-2px)'
  })

  button.addEventListener('mouseleave', () => {
    button.style.background = 'linear-gradient(180deg, #4a90d9 0%, #357abd 100%)'
    button.style.transform = 'translateY(0)'
  })

  button.addEventListener('click', onClick)

  return button
}

/**
 * Create a styled text input element.
 */
export function createTextInput(
  placeholder: string,
  config: TextConfig = {}
): HTMLInputElement {
  const input = document.createElement('input')
  input.type = 'text'
  input.placeholder = placeholder
  
  const {
    fontSize = '20px',
    color = '#333333',
    fontFamily = 'Arial, sans-serif'
  } = config

  input.style.cssText = `
    font-size: ${fontSize};
    color: ${color};
    font-family: ${fontFamily};
    background: #ffffff;
    border: 2px solid #cccccc;
    border-radius: 6px;
    padding: 10px 16px;
    width: 200px;
    text-align: center;
    transition: border-color 0.2s ease;
  `

  input.addEventListener('focus', () => {
    input.style.borderColor = '#4a90d9'
    input.style.outline = 'none'
  })

  input.addEventListener('blur', () => {
    input.style.borderColor = '#cccccc'
  })

  return input
}
