/**
 * Confetti particle effect for victory celebration.
 * Uses Canvas 2D for efficient rendering.
 */

/**
 * Individual confetti particle.
 */
interface ConfettiParticle {
  x: number
  y: number
  size: number
  color: string
  velocityX: number
  velocityY: number
  rotation: number
  rotationSpeed: number
  gravity: number
  drag: number
  shape: 'square' | 'circle' | 'strip'
}

/**
 * Configuration for confetti effect.
 */
export interface ConfettiConfig {
  /** Number of particles (default: 200) */
  particleCount?: number
  /** Colors to use (default: festive colors) */
  colors?: string[]
  /** Gravity strength (default: 0.2) */
  gravity?: number
  /** Air drag (default: 0.02) */
  drag?: number
  /** Initial velocity spread (default: 15) */
  spread?: number
  /** Duration before auto-stop in ms (default: 5000, 0 = infinite) */
  duration?: number
  /** Origin X as percentage (default: 50) */
  originX?: number
  /** Origin Y as percentage (default: 30) */
  originY?: number
}

const DEFAULT_COLORS = [
  '#ff6b6b', // Red
  '#4ecdc4', // Teal
  '#ffe66d', // Yellow
  '#95e1d3', // Mint
  '#f38181', // Coral
  '#aa96da', // Purple
  '#fcbad3', // Pink
  '#a8d8ea'  // Light blue
]

/**
 * ConfettiEffect creates and manages a confetti particle system.
 */
export class ConfettiEffect {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private particles: ConfettiParticle[] = []
  private animationId: number | null = null
  private running = false
  private config: Required<ConfettiConfig>
  private startTime: number = 0

  constructor(config: ConfettiConfig = {}) {
    this.config = {
      particleCount: config.particleCount ?? 200,
      colors: config.colors ?? DEFAULT_COLORS,
      gravity: config.gravity ?? 0.2,
      drag: config.drag ?? 0.02,
      spread: config.spread ?? 15,
      duration: config.duration ?? 5000,
      originX: config.originX ?? 50,
      originY: config.originY ?? 30
    }

    this.canvas = document.createElement('canvas')
    this.canvas.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 1000;
    `
    this.ctx = this.canvas.getContext('2d')!
    
    this.handleResize = this.handleResize.bind(this)
  }

  private handleResize(): void {
    this.canvas.width = window.innerWidth
    this.canvas.height = window.innerHeight
  }

  private createParticle(): ConfettiParticle {
    const { colors, gravity, drag, spread, originX, originY } = this.config
    const angle = Math.random() * Math.PI * 2
    const velocity = Math.random() * spread + 5
    
    const shapes: Array<'square' | 'circle' | 'strip'> = ['square', 'circle', 'strip']

    return {
      x: (originX / 100) * this.canvas.width,
      y: (originY / 100) * this.canvas.height,
      size: Math.random() * 8 + 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      velocityX: Math.cos(angle) * velocity,
      velocityY: Math.sin(angle) * velocity - 10, // Initial upward boost
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 15,
      gravity,
      drag,
      shape: shapes[Math.floor(Math.random() * shapes.length)]
    }
  }

  private initParticles(): void {
    this.particles = []
    for (let i = 0; i < this.config.particleCount; i++) {
      this.particles.push(this.createParticle())
    }
  }

  private updateParticle(particle: ConfettiParticle): boolean {
    // Apply physics
    particle.velocityY += particle.gravity
    particle.velocityX *= (1 - particle.drag)
    particle.velocityY *= (1 - particle.drag)
    
    particle.x += particle.velocityX
    particle.y += particle.velocityY
    particle.rotation += particle.rotationSpeed

    // Check if particle is still visible
    return particle.y < this.canvas.height + 50
  }

  private drawParticle(particle: ConfettiParticle): void {
    this.ctx.save()
    this.ctx.translate(particle.x, particle.y)
    this.ctx.rotate((particle.rotation * Math.PI) / 180)
    this.ctx.fillStyle = particle.color

    const size = particle.size

    switch (particle.shape) {
      case 'square':
        this.ctx.fillRect(-size / 2, -size / 2, size, size)
        break
      case 'circle':
        this.ctx.beginPath()
        this.ctx.arc(0, 0, size / 2, 0, Math.PI * 2)
        this.ctx.fill()
        break
      case 'strip':
        this.ctx.fillRect(-size / 2, -size / 4, size, size / 2)
        break
    }

    this.ctx.restore()
  }

  private animate(): void {
    if (!this.running) return

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)

    // Update and draw particles
    this.particles = this.particles.filter(particle => {
      const visible = this.updateParticle(particle)
      if (visible) {
        this.drawParticle(particle)
      }
      return visible
    })

    // Check duration
    if (this.config.duration > 0) {
      const elapsed = performance.now() - this.startTime
      if (elapsed > this.config.duration && this.particles.length === 0) {
        this.stop()
        return
      }
    }

    // Stop if no particles left
    if (this.particles.length === 0) {
      this.stop()
      return
    }

    this.animationId = requestAnimationFrame(() => this.animate())
  }

  /**
   * Start the confetti effect.
   */
  start(): void {
    if (this.running) return

    this.running = true
    this.startTime = performance.now()

    // Add canvas to DOM
    document.body.appendChild(this.canvas)
    this.handleResize()
    window.addEventListener('resize', this.handleResize)

    // Create particles
    this.initParticles()

    // Start animation
    this.animate()
  }

  /**
   * Burst additional confetti from a specific point.
   */
  burst(x: number, y: number, count: number = 50): void {
    const originalOriginX = this.config.originX
    const originalOriginY = this.config.originY

    this.config.originX = (x / window.innerWidth) * 100
    this.config.originY = (y / window.innerHeight) * 100

    for (let i = 0; i < count; i++) {
      this.particles.push(this.createParticle())
    }

    this.config.originX = originalOriginX
    this.config.originY = originalOriginY

    if (!this.running) {
      this.running = true
      this.startTime = performance.now()
      if (!this.canvas.parentElement) {
        document.body.appendChild(this.canvas)
        this.handleResize()
        window.addEventListener('resize', this.handleResize)
      }
      this.animate()
    }
  }

  /**
   * Stop the confetti effect.
   */
  stop(): void {
    this.running = false

    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId)
      this.animationId = null
    }

    window.removeEventListener('resize', this.handleResize)

    if (this.canvas.parentElement) {
      this.canvas.remove()
    }
  }

  /**
   * Check if the effect is currently running.
   */
  isRunning(): boolean {
    return this.running
  }

  /**
   * Get the current particle count.
   */
  getParticleCount(): number {
    return this.particles.length
  }

  /**
   * Clean up resources.
   */
  dispose(): void {
    this.stop()
    this.particles = []
  }
}

/**
 * Fire a one-shot confetti burst.
 */
export function fireConfetti(config: ConfettiConfig = {}): ConfettiEffect {
  const effect = new ConfettiEffect(config)
  effect.start()
  return effect
}

/**
 * Fire confetti from both sides of the screen.
 */
export function fireSideConfetti(): ConfettiEffect[] {
  const left = new ConfettiEffect({
    originX: 10,
    originY: 50,
    spread: 20,
    particleCount: 100
  })
  
  const right = new ConfettiEffect({
    originX: 90,
    originY: 50,
    spread: 20,
    particleCount: 100
  })

  left.start()
  right.start()

  return [left, right]
}
