/**
 * Card flip animation - 3D rotation from face-down to face-up.
 */

import type { CardMesh } from '../card'
import type { Animation, EasingFunction } from './animator'
import { Easing } from './animator'

/**
 * Configuration for card flip animation.
 */
export interface CardFlipConfig {
  /** Duration in milliseconds (default: 400) */
  duration?: number
  /** Easing function (default: easeOutCubic) */
  easing?: EasingFunction
  /** Callback when flip completes */
  onComplete?: () => void
}

const DEFAULT_FLIP_DURATION = 400

/**
 * Create a card flip animation (face-down to face-up).
 * The card rotates 180 degrees around the Y axis.
 */
export function createCardFlipAnimation(
  card: CardMesh,
  faceUp: boolean,
  config: CardFlipConfig = {}
): Animation {
  const {
    duration = DEFAULT_FLIP_DURATION,
    easing = Easing.easeOutCubic,
    onComplete
  } = config

  const startRotation = card.rotation.y
  const endRotation = faceUp ? 0 : Math.PI

  return {
    duration,
    easing,
    update: (progress) => {
      card.rotation.y = startRotation + (endRotation - startRotation) * progress
    },
    onComplete: () => {
      // Ensure final state is exact
      card.rotation.y = endRotation
      onComplete?.()
    }
  }
}

/**
 * Create a dramatic card flip with a slight arc/lift effect.
 * The card lifts up slightly during the flip for visual impact.
 */
export function createDramaticFlipAnimation(
  card: CardMesh,
  faceUp: boolean,
  config: CardFlipConfig = {}
): Animation {
  const {
    duration = DEFAULT_FLIP_DURATION * 1.5,
    easing = Easing.easeOutCubic,
    onComplete
  } = config

  const startRotation = card.rotation.y
  const endRotation = faceUp ? 0 : Math.PI
  const startZ = card.position.z
  const liftHeight = 0.5 // How high the card lifts during flip

  return {
    duration,
    easing,
    update: (progress) => {
      // Y rotation for flip
      card.rotation.y = startRotation + (endRotation - startRotation) * progress
      
      // Z position for lift arc (parabola: peak at 0.5)
      const arcProgress = 4 * progress * (1 - progress) // 0 -> 1 -> 0
      card.position.z = startZ + liftHeight * arcProgress
    },
    onComplete: () => {
      card.rotation.y = endRotation
      card.position.z = startZ
      onComplete?.()
    }
  }
}

/**
 * Create a quick flip animation for war reveals.
 */
export function createQuickFlipAnimation(
  card: CardMesh,
  faceUp: boolean,
  config: CardFlipConfig = {}
): Animation {
  return createCardFlipAnimation(card, faceUp, {
    ...config,
    duration: config.duration ?? 200,
    easing: config.easing ?? Easing.easeOutQuad
  })
}

/**
 * Flip multiple cards simultaneously.
 * Returns an array of animations to be played in parallel.
 */
export function createMultiFlipAnimations(
  cards: CardMesh[],
  faceUp: boolean,
  config: CardFlipConfig = {}
): Animation[] {
  return cards.map(card => createCardFlipAnimation(card, faceUp, config))
}
