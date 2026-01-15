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
