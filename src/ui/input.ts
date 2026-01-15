/**
 * Input handling for both mouse/keyboard and touch events.
 * Provides unified interface for click/tap to advance gameplay.
 */

/**
 * Input event types.
 */
export type InputEventType = 'tap' | 'swipe' | 'hold'

/**
 * Input event data.
 */
export interface InputEvent {
  type: InputEventType
  x: number
  y: number
  /** For swipe events */
  deltaX?: number
  deltaY?: number
  /** Original DOM event */
  originalEvent: MouseEvent | TouchEvent | KeyboardEvent
}

/**
 * Input event callback.
 */
export type InputCallback = (event: InputEvent) => void

/**
 * Configuration for input manager.
 */
export interface InputConfig {
  /** Element to attach listeners to (default: document) */
  element?: HTMLElement | Document
  /** Enable keyboard input (default: true) */
  enableKeyboard?: boolean
  /** Keys that trigger tap (default: ['Space', 'Enter']) */
  tapKeys?: string[]
  /** Swipe threshold in pixels (default: 50) */
  swipeThreshold?: number
  /** Hold time in ms (default: 500) */
  holdTime?: number
  /** Prevent default on events (default: true) */
  preventDefault?: boolean
}

/**
 * InputManager handles unified input from mouse, touch, and keyboard.
 */
export class InputManager {
  private element: HTMLElement | Document
  private listeners: Map<InputEventType, Set<InputCallback>> = new Map()
  private config: Required<InputConfig>
  
  // Touch tracking
  private touchStartX = 0
  private touchStartY = 0
  private touchStartTime = 0
  private holdTimeout: number | null = null
  private isHolding = false

  // Bound handlers for cleanup
  private boundHandleClick: EventListener
  private boundHandleTouchStart: EventListener
  private boundHandleTouchEnd: EventListener
  private boundHandleTouchMove: EventListener
  private boundHandleKeyDown: EventListener

  constructor(config: InputConfig = {}) {
    this.config = {
      element: config.element ?? document,
      enableKeyboard: config.enableKeyboard ?? true,
      tapKeys: config.tapKeys ?? ['Space', 'Enter'],
      swipeThreshold: config.swipeThreshold ?? 50,
      holdTime: config.holdTime ?? 500,
      preventDefault: config.preventDefault ?? true
    }

    this.element = this.config.element

    // Bind handlers
    this.boundHandleClick = ((e: Event) => this.handleClick(e as MouseEvent)) as EventListener
    this.boundHandleTouchStart = ((e: Event) => this.handleTouchStart(e as TouchEvent)) as EventListener
    this.boundHandleTouchEnd = ((e: Event) => this.handleTouchEnd(e as TouchEvent)) as EventListener
    this.boundHandleTouchMove = ((e: Event) => this.handleTouchMove(e as TouchEvent)) as EventListener
    this.boundHandleKeyDown = ((e: Event) => this.handleKeyDown(e as KeyboardEvent)) as EventListener

    this.attachListeners()
  }

  private attachListeners(): void {
    // Mouse
    this.element.addEventListener('click', this.boundHandleClick)

    // Touch
    this.element.addEventListener('touchstart', this.boundHandleTouchStart, { passive: false })
    this.element.addEventListener('touchend', this.boundHandleTouchEnd, { passive: false })
    this.element.addEventListener('touchmove', this.boundHandleTouchMove, { passive: false })

    // Keyboard
    if (this.config.enableKeyboard) {
      document.addEventListener('keydown', this.boundHandleKeyDown)
    }
  }

  private detachListeners(): void {
    this.element.removeEventListener('click', this.boundHandleClick)
    this.element.removeEventListener('touchstart', this.boundHandleTouchStart)
    this.element.removeEventListener('touchend', this.boundHandleTouchEnd)
    this.element.removeEventListener('touchmove', this.boundHandleTouchMove)
    
    if (this.config.enableKeyboard) {
      document.removeEventListener('keydown', this.boundHandleKeyDown)
    }
  }

  private handleClick(e: MouseEvent): void {
    // Ignore if the click was on an interactive element
    if (this.isInteractiveElement(e.target as HTMLElement)) {
      return
    }

    if (this.config.preventDefault) {
      e.preventDefault()
    }

    this.emit({
      type: 'tap',
      x: e.clientX,
      y: e.clientY,
      originalEvent: e
    })
  }

  private handleTouchStart(e: TouchEvent): void {
    if (this.isInteractiveElement(e.target as HTMLElement)) {
      return
    }

    const touch = e.touches[0]
    this.touchStartX = touch.clientX
    this.touchStartY = touch.clientY
    this.touchStartTime = performance.now()
    this.isHolding = false

    // Start hold timer
    this.holdTimeout = window.setTimeout(() => {
      this.isHolding = true
      this.emit({
        type: 'hold',
        x: this.touchStartX,
        y: this.touchStartY,
        originalEvent: e
      })
    }, this.config.holdTime)
  }

  private handleTouchMove(e: TouchEvent): void {
    if (this.isInteractiveElement(e.target as HTMLElement)) {
      return
    }

    // Cancel hold if moved too much
    const touch = e.touches[0]
    const deltaX = touch.clientX - this.touchStartX
    const deltaY = touch.clientY - this.touchStartY
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)

    if (distance > 10 && this.holdTimeout !== null) {
      clearTimeout(this.holdTimeout)
      this.holdTimeout = null
    }
  }

  private handleTouchEnd(e: TouchEvent): void {
    if (this.isInteractiveElement(e.target as HTMLElement)) {
      return
    }

    if (this.config.preventDefault) {
      e.preventDefault()
    }

    // Clear hold timer
    if (this.holdTimeout !== null) {
      clearTimeout(this.holdTimeout)
      this.holdTimeout = null
    }

    // If was holding, don't fire tap
    if (this.isHolding) {
      this.isHolding = false
      return
    }

    const touch = e.changedTouches[0]
    const deltaX = touch.clientX - this.touchStartX
    const deltaY = touch.clientY - this.touchStartY
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
    const duration = performance.now() - this.touchStartTime

    // Check for swipe
    if (distance > this.config.swipeThreshold && duration < 500) {
      this.emit({
        type: 'swipe',
        x: touch.clientX,
        y: touch.clientY,
        deltaX,
        deltaY,
        originalEvent: e
      })
      return
    }

    // Tap
    this.emit({
      type: 'tap',
      x: touch.clientX,
      y: touch.clientY,
      originalEvent: e
    })
  }

  private handleKeyDown(e: KeyboardEvent): void {
    // Ignore if typing in an input
    if (this.isTypingInInput(e.target as HTMLElement)) {
      return
    }

    if (this.config.tapKeys.includes(e.code)) {
      if (this.config.preventDefault) {
        e.preventDefault()
      }

      this.emit({
        type: 'tap',
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
        originalEvent: e
      })
    }
  }

  private isInteractiveElement(element: HTMLElement): boolean {
    const tagName = element.tagName.toLowerCase()
    return (
      tagName === 'button' ||
      tagName === 'input' ||
      tagName === 'textarea' ||
      tagName === 'select' ||
      tagName === 'a' ||
      element.getAttribute('role') === 'button' ||
      element.hasAttribute('onclick')
    )
  }

  private isTypingInInput(element: HTMLElement): boolean {
    const tagName = element.tagName.toLowerCase()
    return tagName === 'input' || tagName === 'textarea'
  }

  private emit(event: InputEvent): void {
    const callbacks = this.listeners.get(event.type)
    if (callbacks) {
      for (const callback of callbacks) {
        try {
          callback(event)
        } catch (error) {
          console.error('Error in input callback:', error)
        }
      }
    }

    // Also emit to 'tap' listeners for all input types (unified "advance" action)
    if (event.type !== 'tap') {
      const tapCallbacks = this.listeners.get('tap')
      if (tapCallbacks) {
        for (const callback of tapCallbacks) {
          try {
            callback({ ...event, type: 'tap' })
          } catch (error) {
            console.error('Error in input callback:', error)
          }
        }
      }
    }
  }

  /**
   * Subscribe to an input event type.
   */
  on(type: InputEventType, callback: InputCallback): void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set())
    }
    this.listeners.get(type)!.add(callback)
  }

  /**
   * Unsubscribe from an input event type.
   */
  off(type: InputEventType, callback: InputCallback): void {
    const callbacks = this.listeners.get(type)
    if (callbacks) {
      callbacks.delete(callback)
    }
  }

  /**
   * Subscribe to any tap/click/key press (the main "advance" action).
   */
  onTap(callback: InputCallback): void {
    this.on('tap', callback)
  }

  /**
   * Wait for the next tap/click/key press.
   */
  waitForTap(): Promise<InputEvent> {
    return new Promise(resolve => {
      const handler = (event: InputEvent) => {
        this.off('tap', handler)
        resolve(event)
      }
      this.on('tap', handler)
    })
  }

  /**
   * Enable or disable input handling.
   */
  setEnabled(enabled: boolean): void {
    if (enabled) {
      this.attachListeners()
    } else {
      this.detachListeners()
    }
  }

  /**
   * Clean up the input manager.
   */
  dispose(): void {
    this.detachListeners()
    this.listeners.clear()
    
    if (this.holdTimeout !== null) {
      clearTimeout(this.holdTimeout)
    }
  }
}

/**
 * Create a simple "click anywhere to continue" handler.
 */
export function waitForAnyInput(config: InputConfig = {}): Promise<InputEvent> {
  const manager = new InputManager(config)
  return manager.waitForTap().then(event => {
    manager.dispose()
    return event
  })
}
