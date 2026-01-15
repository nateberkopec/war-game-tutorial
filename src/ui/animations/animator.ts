/**
 * Animation system for queuing and executing animations.
 * Supports sequential and parallel animation execution.
 */

/**
 * Easing functions for smooth animations.
 */
export const Easing = {
  linear: (t: number): number => t,
  
  easeInQuad: (t: number): number => t * t,
  easeOutQuad: (t: number): number => t * (2 - t),
  easeInOutQuad: (t: number): number => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
  
  easeInCubic: (t: number): number => t * t * t,
  easeOutCubic: (t: number): number => (--t) * t * t + 1,
  easeInOutCubic: (t: number): number => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,
  
  easeOutBack: (t: number): number => {
    const c1 = 1.70158
    const c3 = c1 + 1
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
  },
  
  easeOutElastic: (t: number): number => {
    const c4 = (2 * Math.PI) / 3
    return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1
  },
  
  easeOutBounce: (t: number): number => {
    const n1 = 7.5625
    const d1 = 2.75
    if (t < 1 / d1) {
      return n1 * t * t
    } else if (t < 2 / d1) {
      return n1 * (t -= 1.5 / d1) * t + 0.75
    } else if (t < 2.5 / d1) {
      return n1 * (t -= 2.25 / d1) * t + 0.9375
    } else {
      return n1 * (t -= 2.625 / d1) * t + 0.984375
    }
  }
} as const

export type EasingFunction = (t: number) => number

/**
 * Base interface for all animations.
 */
export interface Animation {
  /** Duration in milliseconds */
  duration: number
  /** Easing function to use */
  easing: EasingFunction
  /** Called each frame with progress 0-1 */
  update(progress: number): void
  /** Called when animation completes */
  onComplete?(): void
}

/**
 * A running animation instance.
 */
interface RunningAnimation {
  animation: Animation
  startTime: number
  resolve: () => void
}

/**
 * Animator manages a queue of animations and executes them.
 */
export class Animator {
  private running: RunningAnimation[] = []
  private queue: Array<() => Promise<void>> = []
  private isProcessingQueue = false
  private paused = false

  /**
   * Play a single animation.
   * Returns a promise that resolves when the animation completes.
   */
  play(animation: Animation): Promise<void> {
    return new Promise((resolve) => {
      this.running.push({
        animation,
        startTime: performance.now(),
        resolve
      })
    })
  }

  /**
   * Play multiple animations in parallel.
   * Returns a promise that resolves when all animations complete.
   */
  parallel(...animations: Animation[]): Promise<void> {
    return Promise.all(animations.map(a => this.play(a))).then(() => {})
  }

  /**
   * Play multiple animations in sequence.
   * Returns a promise that resolves when all animations complete.
   */
  async sequence(...animations: Animation[]): Promise<void> {
    for (const animation of animations) {
      await this.play(animation)
    }
  }

  /**
   * Queue an animation to be played after current animations complete.
   */
  enqueue(animation: Animation): Promise<void> {
    return new Promise((resolve) => {
      this.queue.push(async () => {
        await this.play(animation)
        resolve()
      })
      this.processQueue()
    })
  }

  /**
   * Queue a function that returns animations to be played.
   */
  enqueueAsync(fn: () => Promise<void>): Promise<void> {
    return new Promise((resolve) => {
      this.queue.push(async () => {
        await fn()
        resolve()
      })
      this.processQueue()
    })
  }

  /**
   * Process the animation queue.
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessingQueue || this.queue.length === 0) return
    
    this.isProcessingQueue = true
    
    while (this.queue.length > 0) {
      // Wait for current animations to complete
      while (this.running.length > 0) {
        await new Promise(resolve => requestAnimationFrame(resolve))
      }
      
      const next = this.queue.shift()
      if (next) {
        await next()
      }
    }
    
    this.isProcessingQueue = false
  }

  /**
   * Update all running animations.
   * Call this from your render loop.
   */
  update(): void {
    if (this.paused) return
    
    const now = performance.now()
    const completed: RunningAnimation[] = []
    
    for (const running of this.running) {
      const elapsed = now - running.startTime
      const progress = Math.min(elapsed / running.animation.duration, 1)
      const easedProgress = running.animation.easing(progress)
      
      running.animation.update(easedProgress)
      
      if (progress >= 1) {
        completed.push(running)
      }
    }
    
    // Remove completed animations and call their callbacks
    for (const done of completed) {
      const index = this.running.indexOf(done)
      if (index !== -1) {
        this.running.splice(index, 1)
      }
      done.animation.onComplete?.()
      done.resolve()
    }
  }

  /**
   * Check if any animations are currently running.
   */
  isAnimating(): boolean {
    return this.running.length > 0
  }

  /**
   * Pause all animations.
   */
  pause(): void {
    this.paused = true
  }

  /**
   * Resume paused animations.
   */
  resume(): void {
    this.paused = false
  }

  /**
   * Stop all running animations immediately.
   */
  stop(): void {
    for (const running of this.running) {
      running.resolve()
    }
    this.running = []
  }

  /**
   * Clear the animation queue.
   */
  clearQueue(): void {
    this.queue = []
  }

  /**
   * Get the number of running animations.
   */
  get runningCount(): number {
    return this.running.length
  }

  /**
   * Get the number of queued animations.
   */
  get queuedCount(): number {
    return this.queue.length
  }
}

/**
 * Create a delay "animation" that just waits.
 */
export function createDelay(duration: number): Animation {
  return {
    duration,
    easing: Easing.linear,
    update: () => {}
  }
}

/**
 * Create an animation that tweens a value.
 */
export function createTween(
  from: number,
  to: number,
  duration: number,
  onUpdate: (value: number) => void,
  easing: EasingFunction = Easing.easeOutCubic,
  onComplete?: () => void
): Animation {
  return {
    duration,
    easing,
    update: (progress) => {
      const value = from + (to - from) * progress
      onUpdate(value)
    },
    onComplete
  }
}
