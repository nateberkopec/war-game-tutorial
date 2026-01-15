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

/**
 * Device type detection.
 */
export type DeviceType = 'mobile' | 'tablet' | 'desktop'

/**
 * Detect device type based on screen size and touch support.
 */
export function detectDeviceType(): DeviceType {
  const width = window.innerWidth
  const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0
  
  if (width < 768 || (hasTouch && width < 1024)) {
    return 'mobile'
  } else if (width < 1200 && hasTouch) {
    return 'tablet'
  }
  return 'desktop'
}

/**
 * Check if the device is in portrait mode.
 */
export function isPortrait(): boolean {
  return window.innerHeight > window.innerWidth
}

/**
 * Check if the device is mobile.
 */
export function isMobile(): boolean {
  return detectDeviceType() === 'mobile'
}

/**
 * Mobile-specific layout configuration.
 */
export interface MobileLayoutConfig {
  /** Scale factor for cards */
  cardScale: number
  /** Camera distance multiplier */
  cameraDistance: number
  /** Font size multiplier */
  fontScale: number
  /** Touch area padding in pixels */
  touchPadding: number
  /** Whether to use simplified animations */
  simplifiedAnimations: boolean
}

/**
 * Get mobile layout configuration based on current viewport.
 */
export function getMobileConfig(): MobileLayoutConfig {
  const deviceType = detectDeviceType()
  const portrait = isPortrait()
  
  if (deviceType === 'mobile') {
    return {
      cardScale: portrait ? 0.7 : 0.85,
      cameraDistance: portrait ? 1.4 : 1.2,
      fontScale: portrait ? 0.8 : 0.9,
      touchPadding: 16,
      simplifiedAnimations: true
    }
  } else if (deviceType === 'tablet') {
    return {
      cardScale: portrait ? 0.85 : 0.95,
      cameraDistance: portrait ? 1.2 : 1.1,
      fontScale: portrait ? 0.9 : 0.95,
      touchPadding: 12,
      simplifiedAnimations: false
    }
  }
  
  // Desktop defaults
  return {
    cardScale: 1.0,
    cameraDistance: 1.0,
    fontScale: 1.0,
    touchPadding: 8,
    simplifiedAnimations: false
  }
}

/**
 * Get responsive layout positions based on viewport.
 */
export function getResponsiveLayout() {
  const config = getMobileConfig()
  const portrait = isPortrait()
  
  // Adjust horizontal spacing for portrait mode
  const horizontalSpacing = portrait ? 2.0 : HORIZONTAL_SPACING
  
  return {
    player1Deck: new THREE.Vector3(-horizontalSpacing * config.cardScale, 0, 0),
    player2Deck: new THREE.Vector3(horizontalSpacing * config.cardScale, 0, 0),
    player1Battle: new THREE.Vector3(-CARD_WIDTH * 0.6 * config.cardScale, BATTLE_Y_OFFSET, 0.1),
    player2Battle: new THREE.Vector3(CARD_WIDTH * 0.6 * config.cardScale, BATTLE_Y_OFFSET, 0.1),
    warPile: new THREE.Vector3(0, WAR_PILE_Y_OFFSET * config.cardScale, 0),
    player1WarFaceDown: new THREE.Vector3(-CARD_WIDTH * 0.6 * config.cardScale, WAR_PILE_Y_OFFSET * config.cardScale, 0.05),
    player2WarFaceDown: new THREE.Vector3(CARD_WIDTH * 0.6 * config.cardScale, WAR_PILE_Y_OFFSET * config.cardScale, 0.05)
  }
}

/**
 * Get responsive UI positions based on viewport.
 */
export function getResponsiveUIPositions() {
  const portrait = isPortrait()
  const mobile = isMobile()
  
  if (portrait && mobile) {
    // Portrait mobile: stack player info vertically
    return {
      player1Info: { x: '50%', y: '5%' },
      player2Info: { x: '50%', y: '95%' },
      announcement: { x: '50%', y: '50%' },
      prompt: { x: '50%', y: '75%' }
    }
  } else if (mobile) {
    // Landscape mobile: tighter layout
    return {
      player1Info: { x: '10%', y: '10%' },
      player2Info: { x: '90%', y: '10%' },
      announcement: { x: '50%', y: '50%' },
      prompt: { x: '50%', y: '90%' }
    }
  }
  
  // Desktop/tablet defaults
  return UI_POSITIONS
}

/**
 * Get camera configuration for current viewport.
 */
export function getResponsiveCameraConfig() {
  const config = getMobileConfig()
  const portrait = isPortrait()
  
  // Adjust camera for mobile
  const defaultPos = CAMERA_POSITIONS.default.position.clone()
  defaultPos.y *= config.cameraDistance
  defaultPos.z *= config.cameraDistance
  
  // In portrait, pull camera back more
  if (portrait) {
    defaultPos.y *= 1.2
    defaultPos.z *= 1.2
  }
  
  return {
    default: {
      position: defaultPos,
      lookAt: CAMERA_POSITIONS.default.lookAt.clone()
    },
    warCloseUp: {
      position: CAMERA_POSITIONS.warCloseUp.position.clone().multiplyScalar(config.cameraDistance),
      lookAt: CAMERA_POSITIONS.warCloseUp.lookAt.clone()
    },
    victory: {
      position: CAMERA_POSITIONS.victory.position.clone().multiplyScalar(config.cameraDistance),
      lookAt: CAMERA_POSITIONS.victory.lookAt.clone()
    }
  }
}

/**
 * Apply mobile-friendly styles to an HTML element.
 */
export function applyMobileStyles(element: HTMLElement): void {
  const config = getMobileConfig()
  
  // Prevent text selection on mobile
  element.style.userSelect = 'none'
  element.style.webkitUserSelect = 'none'
  
  // Prevent callout on iOS
  ;(element.style as unknown as Record<string, string>).webkitTouchCallout = 'none'
  
  // Scale font sizes
  const currentFontSize = parseFloat(getComputedStyle(element).fontSize)
  element.style.fontSize = `${currentFontSize * config.fontScale}px`
  
  // Add touch-friendly padding for interactive elements
  if (element.tagName === 'BUTTON' || element.getAttribute('role') === 'button') {
    const paddingValue = `${config.touchPadding}px`
    element.style.minHeight = '44px' // iOS minimum touch target
    element.style.minWidth = '44px'
    element.style.padding = paddingValue
  }
}

/**
 * Create a viewport resize handler that updates layout.
 */
export function createResponsiveHandler(
  onResize: (config: MobileLayoutConfig) => void
): () => void {
  let resizeTimeout: number | null = null
  
  const handler = () => {
    if (resizeTimeout !== null) {
      clearTimeout(resizeTimeout)
    }
    
    resizeTimeout = window.setTimeout(() => {
      const config = getMobileConfig()
      onResize(config)
    }, 100) // Debounce
  }
  
  window.addEventListener('resize', handler)
  window.addEventListener('orientationchange', handler)
  
  // Return cleanup function
  return () => {
    window.removeEventListener('resize', handler)
    window.removeEventListener('orientationchange', handler)
    if (resizeTimeout !== null) {
      clearTimeout(resizeTimeout)
    }
  }
}
