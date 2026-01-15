/**
 * Animation module exports.
 */

// Core animator
export { Animator, Easing, createDelay, createTween } from './animator'
export type { Animation, EasingFunction } from './animator'

// Card flip animations
export {
  createCardFlipAnimation,
  createDramaticFlipAnimation,
  createQuickFlipAnimation,
  createMultiFlipAnimations
} from './card-flip'
export type { CardFlipConfig } from './card-flip'

// Card movement animations
export {
  createMoveAnimation,
  createArcMoveAnimation,
  createSlideAnimation,
  createCollectAnimation,
  createDealAnimation,
  createShakeAnimation,
  createRotationAnimation
} from './card-move'
export type { CardMoveConfig } from './card-move'
