import * as THREE from 'three'

/**
 * Card dimensions in world units.
 * Standard playing card ratio is approximately 2.5:3.5 (5:7).
 */
export const CARD_WIDTH = 1.0
export const CARD_HEIGHT = 1.4
export const CARD_DEPTH = 0.02

/**
 * Represents a suit for card rendering.
 */
export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades'

/**
 * Represents a rank for card rendering.
 */
export type Rank = '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'A'

/**
 * Configuration for creating a card mesh.
 */
export interface CardConfig {
  rank: Rank
  suit: Suit
  faceTexture: THREE.Texture
  backTexture: THREE.Texture
}

/**
 * CardMesh extends THREE.Mesh to include card-specific data and methods.
 */
export class CardMesh extends THREE.Mesh {
  readonly rank: Rank
  readonly suit: Suit
  private _faceUp: boolean = false

  constructor(config: CardConfig) {
    const geometry = createCardGeometry()
    const materials = createCardMaterials(config.faceTexture, config.backTexture)

    super(geometry, materials)

    this.rank = config.rank
    this.suit = config.suit

    // Start face-down (rotated 180 degrees around Y axis)
    this.rotation.y = Math.PI
  }

  /**
   * Whether the card is currently face-up.
   */
  get faceUp(): boolean {
    return this._faceUp
  }

  /**
   * Set the card to face-up or face-down state (instant, no animation).
   */
  setFaceUp(faceUp: boolean): void {
    this._faceUp = faceUp
    this.rotation.y = faceUp ? 0 : Math.PI
  }

  /**
   * Get the Y rotation needed for face-up state.
   */
  get faceUpRotation(): number {
    return 0
  }

  /**
   * Get the Y rotation needed for face-down state.
   */
  get faceDownRotation(): number {
    return Math.PI
  }

  /**
   * Dispose of this card's geometry and materials.
   */
  disposeCard(): void {
    this.geometry.dispose()
    if (Array.isArray(this.material)) {
      this.material.forEach((m) => m.dispose())
    } else {
      this.material.dispose()
    }
  }
}

/**
 * Create the geometry for a playing card.
 * Uses a BoxGeometry with the standard card proportions.
 */
function createCardGeometry(): THREE.BoxGeometry {
  return new THREE.BoxGeometry(CARD_WIDTH, CARD_HEIGHT, CARD_DEPTH)
}

/**
 * Create materials for a card. Returns an array of 6 materials for each face
 * of the box geometry:
 * [+X, -X, +Y, -Y, +Z (front), -Z (back)]
 */
function createCardMaterials(
  faceTexture: THREE.Texture,
  backTexture: THREE.Texture
): THREE.MeshStandardMaterial[] {
  const edgeMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.8
  })

  const faceMaterial = new THREE.MeshStandardMaterial({
    map: faceTexture,
    roughness: 0.5
  })

  const backMaterial = new THREE.MeshStandardMaterial({
    map: backTexture,
    roughness: 0.5
  })

  return [
    edgeMaterial, // +X (right edge)
    edgeMaterial, // -X (left edge)
    edgeMaterial, // +Y (top edge)
    edgeMaterial, // -Y (bottom edge)
    faceMaterial, // +Z (front face)
    backMaterial  // -Z (back face)
  ]
}

/**
 * Create a simple card back mesh for deck visualization.
 * Uses a placeholder solid color texture.
 */
export function createCardBackMesh(backTexture: THREE.Texture): THREE.Mesh {
  const geometry = createCardGeometry()
  
  const edgeMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.8
  })

  const backMaterial = new THREE.MeshStandardMaterial({
    map: backTexture,
    roughness: 0.5
  })

  const materials = [
    edgeMaterial,
    edgeMaterial,
    edgeMaterial,
    edgeMaterial,
    backMaterial, // Show back on both sides for deck representation
    backMaterial
  ]

  return new THREE.Mesh(geometry, materials)
}

/**
 * Create a deck stack (multiple cards stacked on top of each other).
 * @param count Number of cards in the stack
 * @param backTexture Texture for card backs
 * @returns A group containing the stacked cards
 */
export function createDeckStack(count: number, backTexture: THREE.Texture): THREE.Group {
  const group = new THREE.Group()
  
  // Show a maximum of visible cards in the stack (for performance)
  const visibleCards = Math.min(count, 10)
  const stackOffset = CARD_DEPTH * 0.8
  
  for (let i = 0; i < visibleCards; i++) {
    const card = createCardBackMesh(backTexture)
    // Stack cards with slight offset to show depth
    card.position.z = i * stackOffset
    // Add slight random offset for realistic look
    card.position.x = (Math.random() - 0.5) * 0.01
    card.position.y = (Math.random() - 0.5) * 0.01
    card.rotation.z = (Math.random() - 0.5) * 0.02
    group.add(card)
  }
  
  return group
}
