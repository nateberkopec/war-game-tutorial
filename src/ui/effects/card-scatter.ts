/**
 * Card scatter effect - cards flying around on victory.
 * Uses Three.js for 3D card rendering.
 */

import * as THREE from 'three'
import { createCardBackMesh, CARD_WIDTH, CARD_HEIGHT } from '../card'
import { generateCardBackTexture, generateCardFaceTexture } from '../card-textures'
import type { Rank, Suit } from '../card'

/**
 * A flying card particle.
 */
interface FlyingCard {
  mesh: THREE.Mesh
  velocity: THREE.Vector3
  angularVelocity: THREE.Vector3
  gravity: number
}

/**
 * Configuration for card scatter effect.
 */
export interface CardScatterConfig {
  /** Number of cards (default: 20) */
  cardCount?: number
  /** Initial spread velocity (default: 10) */
  spread?: number
  /** Gravity strength (default: 15) */
  gravity?: number
  /** Duration before auto-cleanup in ms (default: 4000) */
  duration?: number
  /** Show card faces (default: false, shows backs) */
  showFaces?: boolean
}

/**
 * CardScatterEffect creates flying cards for victory celebrations.
 */
export class CardScatterEffect {
  private scene: THREE.Scene
  private cards: FlyingCard[] = []
  private group: THREE.Group
  private running = false
  private startTime = 0
  private config: Required<CardScatterConfig>
  private boundUpdate: () => void

  constructor(scene: THREE.Scene, config: CardScatterConfig = {}) {
    this.scene = scene
    this.config = {
      cardCount: config.cardCount ?? 20,
      spread: config.spread ?? 10,
      gravity: config.gravity ?? 15,
      duration: config.duration ?? 4000,
      showFaces: config.showFaces ?? false
    }

    this.group = new THREE.Group()
    this.boundUpdate = this.update.bind(this)
  }

  private createFlyingCard(originX: number, originY: number, originZ: number): FlyingCard {
    const { spread, gravity, showFaces } = this.config
    
    let mesh: THREE.Mesh
    
    if (showFaces) {
      // Random card face
      const suits: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades']
      const ranks: Rank[] = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A']
      const suit = suits[Math.floor(Math.random() * suits.length)]
      const rank = ranks[Math.floor(Math.random() * ranks.length)]
      
      const faceTexture = generateCardFaceTexture(rank, suit)
      const backTexture = generateCardBackTexture()
      
      const geometry = new THREE.BoxGeometry(CARD_WIDTH, CARD_HEIGHT, 0.02)
      const materials = [
        new THREE.MeshStandardMaterial({ color: 0xffffff }),
        new THREE.MeshStandardMaterial({ color: 0xffffff }),
        new THREE.MeshStandardMaterial({ color: 0xffffff }),
        new THREE.MeshStandardMaterial({ color: 0xffffff }),
        new THREE.MeshStandardMaterial({ map: faceTexture }),
        new THREE.MeshStandardMaterial({ map: backTexture })
      ]
      mesh = new THREE.Mesh(geometry, materials)
    } else {
      const backTexture = generateCardBackTexture()
      mesh = createCardBackMesh(backTexture)
    }

    mesh.position.set(originX, originY, originZ)

    // Random initial velocity - upward and outward
    const angle = Math.random() * Math.PI * 2
    const upwardBoost = Math.random() * spread * 0.5 + spread * 0.5
    const velocity = new THREE.Vector3(
      Math.cos(angle) * spread * (Math.random() * 0.5 + 0.5),
      upwardBoost,
      Math.sin(angle) * spread * (Math.random() * 0.5 + 0.5)
    )

    // Random rotation
    mesh.rotation.set(
      Math.random() * Math.PI * 2,
      Math.random() * Math.PI * 2,
      Math.random() * Math.PI * 2
    )

    // Random angular velocity
    const angularVelocity = new THREE.Vector3(
      (Math.random() - 0.5) * 5,
      (Math.random() - 0.5) * 5,
      (Math.random() - 0.5) * 5
    )

    return {
      mesh,
      velocity,
      angularVelocity,
      gravity
    }
  }

  private initCards(originX: number, originY: number, originZ: number): void {
    for (let i = 0; i < this.config.cardCount; i++) {
      const card = this.createFlyingCard(originX, originY, originZ)
      this.cards.push(card)
      this.group.add(card.mesh)
    }
  }

  private update(): void {
    if (!this.running) return

    const deltaTime = 1 / 60 // Assume 60fps

    // Update each card
    for (const card of this.cards) {
      // Apply gravity
      card.velocity.y -= card.gravity * deltaTime

      // Apply velocity
      card.mesh.position.add(card.velocity.clone().multiplyScalar(deltaTime))

      // Apply rotation
      card.mesh.rotation.x += card.angularVelocity.x * deltaTime
      card.mesh.rotation.y += card.angularVelocity.y * deltaTime
      card.mesh.rotation.z += card.angularVelocity.z * deltaTime
    }

    // Check duration
    const elapsed = performance.now() - this.startTime
    if (elapsed > this.config.duration) {
      this.stop()
      return
    }

    requestAnimationFrame(this.boundUpdate)
  }

  /**
   * Start the card scatter effect from a point.
   */
  start(originX: number = 0, originY: number = 2, originZ: number = 0): void {
    if (this.running) return

    this.running = true
    this.startTime = performance.now()

    // Add group to scene
    this.scene.add(this.group)

    // Create cards
    this.initCards(originX, originY, originZ)

    // Start animation
    this.update()
  }

  /**
   * Stop the effect and clean up.
   */
  stop(): void {
    this.running = false

    // Remove all cards
    for (const card of this.cards) {
      this.group.remove(card.mesh)
      card.mesh.geometry.dispose()
      if (Array.isArray(card.mesh.material)) {
        card.mesh.material.forEach(m => m.dispose())
      } else {
        card.mesh.material.dispose()
      }
    }
    this.cards = []

    // Remove group from scene
    this.scene.remove(this.group)
  }

  /**
   * Check if effect is running.
   */
  isRunning(): boolean {
    return this.running
  }

  /**
   * Clean up all resources.
   */
  dispose(): void {
    this.stop()
  }
}

/**
 * Fire a one-shot card scatter from the center.
 */
export function fireCardScatter(
  scene: THREE.Scene,
  config: CardScatterConfig = {}
): CardScatterEffect {
  const effect = new CardScatterEffect(scene, config)
  effect.start()
  return effect
}

/**
 * Fire card scatter from a specific position.
 */
export function fireCardScatterAt(
  scene: THREE.Scene,
  x: number,
  y: number,
  z: number,
  config: CardScatterConfig = {}
): CardScatterEffect {
  const effect = new CardScatterEffect(scene, config)
  effect.start(x, y, z)
  return effect
}
