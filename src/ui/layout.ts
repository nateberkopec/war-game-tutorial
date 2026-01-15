import * as THREE from 'three'
import { CARD_WIDTH } from './card'

/**
 * Layout positions for the game table.
 * All positions are in world units, centered around (0, 0, 0).
 * 
 * The table is viewed from above with the camera looking down.
 * Player 1 is on the left, Player 2 is on the right.
 * 
 * Layout (top-down view):
 * 
 *    ┌─────────────────────────────────────┐
 *    │                                     │
 *    │   [P1 Deck]  [Battle]  [P2 Deck]   │
 *    │                                     │
 *    │             [War Pile]              │
 *    │                                     │
 *    └─────────────────────────────────────┘
 */

/**
 * Horizontal spacing between elements.
 */
const HORIZONTAL_SPACING = 3.0

/**
 * Vertical offset for battlefield cards.
 */
const BATTLE_Y_OFFSET = 0.5

/**
 * Vertical offset for war pile.
 */
const WAR_PILE_Y_OFFSET = -2.0

/**
 * Layout positions for the game elements.
 */
export const LAYOUT = {
  /**
   * Player 1's deck position (left side).
   */
  player1Deck: new THREE.Vector3(-HORIZONTAL_SPACING, 0, 0),
  
  /**
   * Player 2's deck position (right side).
   */
  player2Deck: new THREE.Vector3(HORIZONTAL_SPACING, 0, 0),
  
  /**
   * Player 1's battlefield card position (left-center).
   */
  player1Battle: new THREE.Vector3(-CARD_WIDTH * 0.8, BATTLE_Y_OFFSET, 0.1),
  
  /**
   * Player 2's battlefield card position (right-center).
   */
  player2Battle: new THREE.Vector3(CARD_WIDTH * 0.8, BATTLE_Y_OFFSET, 0.1),
  
  /**
   * War pile position (center, below battlefield).
   */
  warPile: new THREE.Vector3(0, WAR_PILE_Y_OFFSET, 0),
  
  /**
   * Position for Player 1's face-down war cards.
   */
  player1WarFaceDown: new THREE.Vector3(-CARD_WIDTH * 0.8, WAR_PILE_Y_OFFSET, 0.05),
  
  /**
   * Position for Player 2's face-down war cards.
   */
  player2WarFaceDown: new THREE.Vector3(CARD_WIDTH * 0.8, WAR_PILE_Y_OFFSET, 0.05),
} as const

/**
 * Get card rotation for lying flat on the table.
 * Cards lie flat with the face pointing up (when face-up).
 */
export function getCardTableRotation(): THREE.Euler {
  // Rotate card to lie flat on the table (face up toward camera)
  return new THREE.Euler(-Math.PI / 2, 0, 0)
}

/**
 * Get the deck stack rotation (cards stacked vertically).
 * Deck stands upright for drawing.
 */
export function getDeckStackRotation(): THREE.Euler {
  // Deck is upright
  return new THREE.Euler(0, 0, 0)
}

/**
 * Calculate a staggered position for cards in a pile.
 * @param basePosition Base position of the pile
 * @param index Index of the card in the pile
 * @param total Total cards in the pile
 * @returns Position with slight offset for visual stacking
 */
export function getStackedCardPosition(
  basePosition: THREE.Vector3,
  index: number,
  _total: number
): THREE.Vector3 {
  const stackHeight = 0.02 // Height offset per card
  const randomOffset = 0.02 // Random XY offset for realistic look
  
  return new THREE.Vector3(
    basePosition.x + (Math.random() - 0.5) * randomOffset,
    basePosition.y + (Math.random() - 0.5) * randomOffset,
    basePosition.z + index * stackHeight
  )
}

/**
 * UI text positions (in screen-space percentages, for HTML overlay).
 */
export const UI_POSITIONS = {
  /**
   * Player 1 name and card count (top-left area).
   */
  player1Info: { x: '15%', y: '10%' },
  
  /**
   * Player 2 name and card count (top-right area).
   */
  player2Info: { x: '85%', y: '10%' },
  
  /**
   * Round result announcement (center).
   */
  announcement: { x: '50%', y: '50%' },
  
  /**
   * Action prompt (bottom center).
   */
  prompt: { x: '50%', y: '85%' },
} as const

/**
 * Camera positions for different views.
 */
export const CAMERA_POSITIONS = {
  /**
   * Default game view - looking down at the table.
   */
  default: {
    position: new THREE.Vector3(0, 8, 10),
    lookAt: new THREE.Vector3(0, 0, 0)
  },
  
  /**
   * Close-up view for war sequence.
   */
  warCloseUp: {
    position: new THREE.Vector3(0, 5, 6),
    lookAt: new THREE.Vector3(0, -1, 0)
  },
  
  /**
   * Victory celebration view.
   */
  victory: {
    position: new THREE.Vector3(0, 10, 12),
    lookAt: new THREE.Vector3(0, 0, 0)
  }
} as const

/**
 * Get responsive scale factor based on viewport aspect ratio.
 * Used to adjust card and element sizes on different screens.
 */
export function getResponsiveScale(aspectRatio: number): number {
  // Base scale assumes 16:9 aspect ratio
  const baseAspect = 16 / 9
  
  if (aspectRatio < 1) {
    // Portrait mode - scale down significantly
    return 0.6
  } else if (aspectRatio < baseAspect) {
    // Narrower than 16:9 - slight scale down
    return 0.8 + (aspectRatio / baseAspect) * 0.2
  } else {
    // Wider than 16:9 - no scaling needed
    return 1.0
  }
}
