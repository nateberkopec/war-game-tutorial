/**
 * Card movement animations - moving cards between positions.
 */

import * as THREE from 'three'
import type { Animation, EasingFunction } from './animator'
import { Easing } from './animator'

/**
 * Configuration for card movement animation.
 */
export interface CardMoveConfig {
  /** Duration in milliseconds (default: 300) */
  duration?: number
  /** Easing function (default: easeOutCubic) */
  easing?: EasingFunction
  /** Height of arc during movement (default: 0) */
  arcHeight?: number
  /** Callback when movement completes */
  onComplete?: () => void
}

const DEFAULT_MOVE_DURATION = 300

/**
 * Create a linear movement animation.
 */
export function createMoveAnimation(
  object: THREE.Object3D,
  target: THREE.Vector3,
  config: CardMoveConfig = {}
): Animation {
  const {
    duration = DEFAULT_MOVE_DURATION,
    easing = Easing.easeOutCubic,
    onComplete
  } = config

  const start = object.position.clone()

  return {
    duration,
    easing,
    update: (progress) => {
      object.position.lerpVectors(start, target, progress)
    },
    onComplete: () => {
      object.position.copy(target)
      onComplete?.()
    }
  }
}

/**
 * Create an arc movement animation (for throwing cards).
 */
export function createArcMoveAnimation(
  object: THREE.Object3D,
  target: THREE.Vector3,
  config: CardMoveConfig = {}
): Animation {
  const {
    duration = DEFAULT_MOVE_DURATION,
    easing = Easing.easeOutCubic,
    arcHeight = 1.0,
    onComplete
  } = config

  const start = object.position.clone()

  return {
    duration,
    easing,
    update: (progress) => {
      // Linear interpolation for X and Y
      object.position.x = start.x + (target.x - start.x) * progress
      object.position.y = start.y + (target.y - start.y) * progress
      
      // Parabolic arc for Z
      const arcProgress = 4 * progress * (1 - progress) // 0 -> 1 -> 0
      const baseZ = start.z + (target.z - start.z) * progress
      object.position.z = baseZ + arcHeight * arcProgress
    },
    onComplete: () => {
      object.position.copy(target)
      onComplete?.()
    }
  }
}

/**
 * Create a slide animation (card slides along the table).
 */
export function createSlideAnimation(
  object: THREE.Object3D,
  target: THREE.Vector3,
  config: CardMoveConfig = {}
): Animation {
  const {
    duration = DEFAULT_MOVE_DURATION * 1.5,
    easing = Easing.easeOutQuad,
    onComplete
  } = config

  const start = object.position.clone()

  return {
    duration,
    easing,
    update: (progress) => {
      // Keep Z constant (sliding along table)
      object.position.x = start.x + (target.x - start.x) * progress
      object.position.y = start.y + (target.y - start.y) * progress
    },
    onComplete: () => {
      object.position.x = target.x
      object.position.y = target.y
      onComplete?.()
    }
  }
}

/**
 * Create animation for collecting won cards to a deck.
 */
export function createCollectAnimation(
  cards: THREE.Object3D[],
  deckPosition: THREE.Vector3,
  config: CardMoveConfig = {}
): Animation[] {
  const {
    duration = DEFAULT_MOVE_DURATION,
    easing = Easing.easeInCubic,
    onComplete
  } = config

  return cards.map((card, index) => {
    // Stagger the collection slightly
    const staggerDelay = index * 50
    const cardDuration = duration + staggerDelay
    const start = card.position.clone()
    
    // Add slight offset so cards don't all go to exact same spot
    const offset = new THREE.Vector3(
      (Math.random() - 0.5) * 0.1,
      (Math.random() - 0.5) * 0.1,
      index * 0.02
    )
    const target = deckPosition.clone().add(offset)

    return {
      duration: cardDuration,
      easing,
      update: (progress) => {
        // Delay start based on stagger
        const adjustedProgress = Math.max(0, (progress * cardDuration - staggerDelay) / duration)
        if (adjustedProgress > 0) {
          card.position.lerpVectors(start, target, Math.min(1, adjustedProgress))
        }
      },
      onComplete: index === cards.length - 1 ? onComplete : undefined
    }
  })
}

/**
 * Create animation for dealing a card from deck.
 */
export function createDealAnimation(
  card: THREE.Object3D,
  fromDeck: THREE.Vector3,
  toPosition: THREE.Vector3,
  config: CardMoveConfig = {}
): Animation {
  const {
    duration = DEFAULT_MOVE_DURATION,
    easing = Easing.easeOutBack,
    arcHeight = 0.5,
    onComplete
  } = config

  // Start at deck
  card.position.copy(fromDeck)
  const start = card.position.clone()

  return {
    duration,
    easing,
    update: (progress) => {
      card.position.x = start.x + (toPosition.x - start.x) * progress
      card.position.y = start.y + (toPosition.y - start.y) * progress
      
      const arcProgress = 4 * progress * (1 - progress)
      const baseZ = start.z + (toPosition.z - start.z) * progress
      card.position.z = baseZ + arcHeight * arcProgress
    },
    onComplete: () => {
      card.position.copy(toPosition)
      onComplete?.()
    }
  }
}

/**
 * Create a shake animation for emphasis.
 */
export function createShakeAnimation(
  object: THREE.Object3D,
  intensity: number = 0.1,
  duration: number = 300
): Animation {
  const originalPosition = object.position.clone()
  
  return {
    duration,
    easing: Easing.linear,
    update: (progress) => {
      // Decreasing shake as progress increases
      const remaining = 1 - progress
      const offsetX = (Math.random() - 0.5) * intensity * remaining
      const offsetY = (Math.random() - 0.5) * intensity * remaining
      
      object.position.x = originalPosition.x + offsetX
      object.position.y = originalPosition.y + offsetY
    },
    onComplete: () => {
      object.position.copy(originalPosition)
    }
  }
}

/**
 * Create a rotation animation.
 */
export function createRotationAnimation(
  object: THREE.Object3D,
  targetRotation: THREE.Euler,
  duration: number = 300,
  easing: EasingFunction = Easing.easeOutCubic
): Animation {
  const startRotation = object.rotation.clone()
  
  return {
    duration,
    easing,
    update: (progress) => {
      object.rotation.x = startRotation.x + (targetRotation.x - startRotation.x) * progress
      object.rotation.y = startRotation.y + (targetRotation.y - startRotation.y) * progress
      object.rotation.z = startRotation.z + (targetRotation.z - startRotation.z) * progress
    },
    onComplete: () => {
      object.rotation.copy(targetRotation)
    }
  }
}
