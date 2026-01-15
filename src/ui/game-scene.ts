import * as THREE from 'three'
import { SceneManager } from './scene'
import { CardMesh, createDeckStack, Rank, Suit } from './card'
import { generateCardFaceTexture, generateCardBackTexture, preloadAllTextures } from './card-textures'
import { LAYOUT, getCardTableRotation } from './layout'

/**
 * GameScene manages the visual representation of the War card game.
 * It handles rendering decks, battlefield cards, and the war pile.
 */
export class GameScene {
  private sceneManager: SceneManager
  private player1DeckGroup: THREE.Group | null = null
  private player2DeckGroup: THREE.Group | null = null
  private player1BattleCard: CardMesh | null = null
  private player2BattleCard: CardMesh | null = null
  private warPileGroup: THREE.Group
  private tableGroup: THREE.Group

  constructor(container?: HTMLElement) {
    this.sceneManager = new SceneManager(container)
    this.warPileGroup = new THREE.Group()
    this.tableGroup = new THREE.Group()
    
    this.sceneManager.add(this.warPileGroup)
    this.sceneManager.add(this.tableGroup)
    
    // Preload all card textures
    preloadAllTextures()
    
    // Create the table surface
    this.createTable()
  }

  /**
   * Create a simple table surface.
   */
  private createTable(): void {
    const tableGeometry = new THREE.PlaneGeometry(12, 8)
    const tableMaterial = new THREE.MeshStandardMaterial({
      color: 0x2d5a27, // Felt green
      roughness: 0.8,
      side: THREE.DoubleSide
    })
    const table = new THREE.Mesh(tableGeometry, tableMaterial)
    table.rotation.x = -Math.PI / 2
    table.position.y = -0.01 // Slightly below cards
    this.tableGroup.add(table)
  }

  /**
   * Initialize the game scene with deck counts for both players.
   */
  setup(player1CardCount: number, player2CardCount: number): void {
    this.clearDecks()
    
    const backTexture = generateCardBackTexture()
    
    // Create Player 1's deck
    this.player1DeckGroup = createDeckStack(player1CardCount, backTexture)
    this.player1DeckGroup.position.copy(LAYOUT.player1Deck)
    this.sceneManager.add(this.player1DeckGroup)
    
    // Create Player 2's deck
    this.player2DeckGroup = createDeckStack(player2CardCount, backTexture)
    this.player2DeckGroup.position.copy(LAYOUT.player2Deck)
    this.sceneManager.add(this.player2DeckGroup)
  }

  /**
   * Clear all deck visualizations.
   */
  private clearDecks(): void {
    if (this.player1DeckGroup) {
      this.sceneManager.remove(this.player1DeckGroup)
      this.disposeGroup(this.player1DeckGroup)
      this.player1DeckGroup = null
    }
    if (this.player2DeckGroup) {
      this.sceneManager.remove(this.player2DeckGroup)
      this.disposeGroup(this.player2DeckGroup)
      this.player2DeckGroup = null
    }
  }

  /**
   * Update deck visuals to reflect current card counts.
   */
  updateDecks(player1CardCount: number, player2CardCount: number): void {
    // For now, recreate decks. In Phase 2, we'll animate this.
    this.setup(player1CardCount, player2CardCount)
  }

  /**
   * Show a card on the battlefield for a player.
   */
  showBattleCard(player: 'player1' | 'player2', rank: Rank, suit: Suit, faceUp: boolean = true): void {
    const faceTexture = generateCardFaceTexture(rank, suit)
    const backTexture = generateCardBackTexture()
    
    const card = new CardMesh({
      rank,
      suit,
      faceTexture,
      backTexture
    })
    
    const position = player === 'player1' ? LAYOUT.player1Battle : LAYOUT.player2Battle
    card.position.copy(position)
    
    // Lay card flat on table
    const tableRotation = getCardTableRotation()
    card.rotation.x = tableRotation.x
    card.rotation.z = tableRotation.z
    
    // Set face up/down (Y rotation)
    card.setFaceUp(faceUp)
    if (faceUp) {
      card.rotation.y = 0
    } else {
      card.rotation.y = Math.PI
    }
    
    // Remove existing battle card if any
    if (player === 'player1') {
      if (this.player1BattleCard) {
        this.sceneManager.remove(this.player1BattleCard)
        this.player1BattleCard.disposeCard()
      }
      this.player1BattleCard = card
    } else {
      if (this.player2BattleCard) {
        this.sceneManager.remove(this.player2BattleCard)
        this.player2BattleCard.disposeCard()
      }
      this.player2BattleCard = card
    }
    
    this.sceneManager.add(card)
  }

  /**
   * Clear battlefield cards (after round resolution).
   */
  clearBattlefield(): void {
    if (this.player1BattleCard) {
      this.sceneManager.remove(this.player1BattleCard)
      this.player1BattleCard.disposeCard()
      this.player1BattleCard = null
    }
    if (this.player2BattleCard) {
      this.sceneManager.remove(this.player2BattleCard)
      this.player2BattleCard.disposeCard()
      this.player2BattleCard = null
    }
  }

  /**
   * Add cards to the war pile visualization.
   */
  addToWarPile(cards: Array<{ rank: Rank; suit: Suit }>): void {
    const backTexture = generateCardBackTexture()
    
    for (let i = 0; i < cards.length; i++) {
      const { rank, suit } = cards[i]
      const faceTexture = generateCardFaceTexture(rank, suit)
      
      const card = new CardMesh({
        rank,
        suit,
        faceTexture,
        backTexture
      })
      
      // Stack cards with slight offset
      const basePos = LAYOUT.warPile
      card.position.set(
        basePos.x + (Math.random() - 0.5) * 0.3,
        basePos.y + (Math.random() - 0.5) * 0.3,
        basePos.z + this.warPileGroup.children.length * 0.03
      )
      
      // Lay flat, face down
      const tableRotation = getCardTableRotation()
      card.rotation.x = tableRotation.x
      card.rotation.y = Math.PI // Face down
      card.rotation.z = (Math.random() - 0.5) * 0.3 // Slight rotation for variety
      
      this.warPileGroup.add(card)
    }
  }

  /**
   * Clear the war pile visualization.
   */
  clearWarPile(): void {
    while (this.warPileGroup.children.length > 0) {
      const child = this.warPileGroup.children[0]
      this.warPileGroup.remove(child)
      if (child instanceof CardMesh) {
        child.disposeCard()
      }
    }
  }

  /**
   * Get the scene manager for advanced control.
   */
  getSceneManager(): SceneManager {
    return this.sceneManager
  }

  /**
   * Start rendering.
   */
  start(): void {
    this.sceneManager.start()
  }

  /**
   * Stop rendering.
   */
  stop(): void {
    this.sceneManager.stop()
  }

  /**
   * Clean up all resources.
   */
  dispose(): void {
    this.clearDecks()
    this.clearBattlefield()
    this.clearWarPile()
    this.disposeGroup(this.tableGroup)
    this.sceneManager.dispose()
  }

  /**
   * Dispose of all meshes in a group.
   */
  private disposeGroup(group: THREE.Group): void {
    group.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.geometry.dispose()
        if (Array.isArray(object.material)) {
          object.material.forEach((m) => m.dispose())
        } else {
          object.material.dispose()
        }
      }
    })
    group.clear()
  }
}

/**
 * Create and initialize a game scene with default setup (26 cards each).
 */
export function createDefaultGameScene(container?: HTMLElement): GameScene {
  const scene = new GameScene(container)
  scene.setup(26, 26)
  return scene
}
