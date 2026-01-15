/**
 * Loading Screen - Shown while game assets initialize.
 */

/**
 * Configuration for the loading screen.
 */
export interface LoadingScreenConfig {
  /** Text to display (default: 'Loading...') */
  text?: string
  /** Show progress bar (default: true) */
  showProgress?: boolean
  /** Minimum display time in ms (default: 500) */
  minDisplayTime?: number
}

/**
 * LoadingScreen displays a loading indicator while assets load.
 */
export class LoadingScreen {
  private container: HTMLElement
  private progressBar: HTMLElement | null = null
  private progressText: HTMLElement | null = null
  private config: Required<LoadingScreenConfig>
  private showTime: number = 0

  constructor(config: LoadingScreenConfig = {}) {
    this.config = {
      text: config.text ?? 'Loading...',
      showProgress: config.showProgress ?? true,
      minDisplayTime: config.minDisplayTime ?? 500
    }

    this.container = this.createContainer()
    this.render()
  }

  private createContainer(): HTMLElement {
    const container = document.createElement('div')
    container.id = 'loading-screen'
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
      z-index: 300;
      font-family: Arial, sans-serif;
    `
    return container
  }

  private render(): void {
    // Loading text
    const text = document.createElement('div')
    text.textContent = this.config.text
    text.style.cssText = `
      font-size: 32px;
      color: #ffffff;
      margin-bottom: 30px;
      letter-spacing: 4px;
    `
    this.container.appendChild(text)

    // Spinner
    const spinner = this.createSpinner()
    this.container.appendChild(spinner)

    // Progress bar
    if (this.config.showProgress) {
      const progressContainer = document.createElement('div')
      progressContainer.style.cssText = `
        width: 300px;
        height: 6px;
        background: rgba(255, 255, 255, 0.2);
        border-radius: 3px;
        margin-top: 30px;
        overflow: hidden;
      `

      this.progressBar = document.createElement('div')
      this.progressBar.style.cssText = `
        width: 0%;
        height: 100%;
        background: linear-gradient(90deg, #4a90d9 0%, #64b5f6 100%);
        border-radius: 3px;
        transition: width 0.3s ease;
      `

      progressContainer.appendChild(this.progressBar)
      this.container.appendChild(progressContainer)

      // Progress text
      this.progressText = document.createElement('div')
      this.progressText.textContent = '0%'
      this.progressText.style.cssText = `
        font-size: 14px;
        color: #888888;
        margin-top: 10px;
      `
      this.container.appendChild(this.progressText)
    }
  }

  private createSpinner(): HTMLElement {
    const spinner = document.createElement('div')
    spinner.style.cssText = `
      width: 50px;
      height: 50px;
      border: 4px solid rgba(255, 255, 255, 0.2);
      border-top-color: #4a90d9;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    `

    // Add animation
    const style = document.createElement('style')
    style.textContent = `
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
    `
    document.head.appendChild(style)

    return spinner
  }

  /**
   * Update the progress bar.
   * @param progress Value between 0 and 1
   */
  setProgress(progress: number): void {
    const percent = Math.round(Math.max(0, Math.min(1, progress)) * 100)
    
    if (this.progressBar) {
      this.progressBar.style.width = `${percent}%`
    }
    
    if (this.progressText) {
      this.progressText.textContent = `${percent}%`
    }
  }

  /**
   * Update the loading text.
   */
  setText(text: string): void {
    const textElement = this.container.querySelector('div')
    if (textElement) {
      textElement.textContent = text
    }
  }

  /**
   * Show the loading screen.
   */
  show(): void {
    if (!this.container.parentElement) {
      document.body.appendChild(this.container)
    }
    this.container.style.display = 'flex'
    this.container.style.opacity = '1'
    this.showTime = performance.now()
  }

  /**
   * Hide the loading screen with animation.
   * Ensures minimum display time is respected.
   */
  async hide(duration: number = 300): Promise<void> {
    // Ensure minimum display time
    const elapsed = performance.now() - this.showTime
    const remaining = this.config.minDisplayTime - elapsed
    
    if (remaining > 0) {
      await new Promise(resolve => setTimeout(resolve, remaining))
    }

    // Set progress to 100% before hiding
    this.setProgress(1)

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
   * Clean up the loading screen.
   */
  dispose(): void {
    this.container.remove()
  }
}

/**
 * Show loading screen while executing an async function.
 */
export async function withLoadingScreen<T>(
  fn: (updateProgress: (progress: number) => void) => Promise<T>,
  config: LoadingScreenConfig = {}
): Promise<T> {
  const screen = new LoadingScreen(config)
  screen.show()

  try {
    const result = await fn((progress) => screen.setProgress(progress))
    await screen.hide()
    screen.dispose()
    return result
  } catch (error) {
    screen.dispose()
    throw error
  }
}

/**
 * Simple loading screen that shows and hides automatically.
 */
export function showLoadingScreen(config: LoadingScreenConfig = {}): LoadingScreen {
  const screen = new LoadingScreen(config)
  screen.show()
  return screen
}
