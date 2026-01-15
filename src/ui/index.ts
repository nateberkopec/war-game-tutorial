/**
 * UI module exports for the War card game.
 */

// Scene management
export { SceneManager } from './scene'

// Card rendering
export { CardMesh, createCardBackMesh, createDeckStack, CARD_WIDTH, CARD_HEIGHT, CARD_DEPTH } from './card'
export type { Rank, Suit, CardConfig } from './card'

// Texture generation
export { generateCardFaceTexture, generateCardBackTexture, clearTextureCache, preloadAllTextures } from './card-textures'

// Layout
export { LAYOUT, UI_POSITIONS, CAMERA_POSITIONS, getCardTableRotation, getDeckStackRotation, getStackedCardPosition, getResponsiveScale } from './layout'

// Game scene
export { GameScene, createDefaultGameScene } from './game-scene'

// Animations
export {
  Animator,
  Easing,
  createDelay,
  createTween,
  createCardFlipAnimation,
  createDramaticFlipAnimation,
  createQuickFlipAnimation,
  createMultiFlipAnimations,
  createMoveAnimation,
  createArcMoveAnimation,
  createSlideAnimation,
  createCollectAnimation,
  createDealAnimation,
  createShakeAnimation,
  createRotationAnimation
} from './animations'
export type { Animation, EasingFunction, CardFlipConfig, CardMoveConfig } from './animations'

// UI Text
export { UITextManager, createButton, createTextInput } from './text'
export type { TextConfig, TextPosition } from './text'

// Screens
export { TitleScreen, showTitleScreen, VictoryScreen, showVictoryScreen } from './screens'
export type { TitleScreenResult, TitleScreenConfig, VictoryScreenConfig } from './screens'
