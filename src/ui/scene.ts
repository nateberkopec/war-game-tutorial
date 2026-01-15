import * as THREE from 'three'

/**
 * SceneManager handles Three.js scene initialization, camera setup,
 * and responsive canvas management.
 */
export class SceneManager {
  readonly scene: THREE.Scene
  readonly camera: THREE.PerspectiveCamera
  readonly renderer: THREE.WebGLRenderer

  private animationFrameId: number | null = null
  private resizeHandler: (() => void) | null = null
  private renderCallbacks: Array<(delta: number) => void> = []
  private clock: THREE.Clock

  constructor(container?: HTMLElement) {
    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color(0x1a1a2e)

    this.camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    )
    this.camera.position.set(0, 8, 10)
    this.camera.lookAt(0, 0, 0)

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false
    })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.setSize(window.innerWidth, window.innerHeight)

    const targetContainer = container ?? document.body
    targetContainer.appendChild(this.renderer.domElement)

    this.clock = new THREE.Clock()

    this.setupResizeHandler()
    this.setupLighting()
  }

  private setupResizeHandler(): void {
    this.resizeHandler = () => {
      this.camera.aspect = window.innerWidth / window.innerHeight
      this.camera.updateProjectionMatrix()
      this.renderer.setSize(window.innerWidth, window.innerHeight)
    }
    window.addEventListener('resize', this.resizeHandler)
  }

  private setupLighting(): void {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
    this.scene.add(ambientLight)

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
    directionalLight.position.set(5, 10, 5)
    directionalLight.castShadow = false
    this.scene.add(directionalLight)
  }

  /**
   * Register a callback to be called each frame during the render loop.
   * @param callback Function receiving delta time in seconds
   */
  onRender(callback: (delta: number) => void): void {
    this.renderCallbacks.push(callback)
  }

  /**
   * Remove a previously registered render callback.
   */
  offRender(callback: (delta: number) => void): void {
    const index = this.renderCallbacks.indexOf(callback)
    if (index !== -1) {
      this.renderCallbacks.splice(index, 1)
    }
  }

  /**
   * Start the render loop.
   */
  start(): void {
    if (this.animationFrameId !== null) return

    const animate = () => {
      this.animationFrameId = requestAnimationFrame(animate)
      const delta = this.clock.getDelta()

      for (const callback of this.renderCallbacks) {
        callback(delta)
      }

      this.renderer.render(this.scene, this.camera)
    }

    this.clock.start()
    animate()
  }

  /**
   * Stop the render loop.
   */
  stop(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId)
      this.animationFrameId = null
    }
    this.clock.stop()
  }

  /**
   * Add an object to the scene.
   */
  add(object: THREE.Object3D): void {
    this.scene.add(object)
  }

  /**
   * Remove an object from the scene.
   */
  remove(object: THREE.Object3D): void {
    this.scene.remove(object)
  }

  /**
   * Clean up all resources.
   */
  dispose(): void {
    this.stop()

    if (this.resizeHandler) {
      window.removeEventListener('resize', this.resizeHandler)
      this.resizeHandler = null
    }

    this.renderCallbacks = []

    this.renderer.domElement.remove()
    this.renderer.dispose()

    this.scene.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.geometry.dispose()
        if (Array.isArray(object.material)) {
          object.material.forEach((m) => m.dispose())
        } else {
          object.material.dispose()
        }
      }
    })

    this.scene.clear()
  }

  /**
   * Get the canvas element.
   */
  get canvas(): HTMLCanvasElement {
    return this.renderer.domElement
  }
}
