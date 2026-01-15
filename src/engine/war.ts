/**
 * War resolution logic for handling ties.
 */

import type {
  Card,
  InsufficientCardsRule,
  PlayerId,
} from './types'
import { drawCard } from './deck'

export interface WarResolutionResult {
  /** Winner of the war, or null if game ends due to insufficient cards */
  winner: PlayerId | null
  /** All cards won (includes face-up and face-down from both players) */
  cardsWon: Card[]
  /** The final face-up cards that decided the war */
  finalCards: [Card, Card] | null
  /** How many nested wars occurred (1 = single war, 2+ = nested) */
  warDepth: number
  /** If a player couldn't complete the war */
  insufficientCards?: {
    player: PlayerId
    needed: number
    had: number
  }
  /** If game ends immediately due to insufficient cards rule */
  gameEnds: boolean
  /** If gameEnds, who loses */
  loser?: PlayerId
}

/**
 * Check if a player has enough cards for a war.
 * They need: warFaceDownCards + 1 (for the face-up card)
 */
export function canCompleteWar(
  deckSize: number,
  warFaceDownCards: number
): boolean {
  return deckSize >= warFaceDownCards + 1
}

/**
 * Get the number of face-down cards a player can actually place.
 * Respects the 'useRemaining' rule when they don't have enough.
 */
export function getFaceDownCount(
  deckSize: number,
  warFaceDownCards: number,
  rule: InsufficientCardsRule
): number {
  if (rule === 'useRemaining') {
    // Use all but one (save one for face-up)
    return Math.max(0, Math.min(warFaceDownCards, deckSize - 1))
  }

  // For 'lose' and 'splitPot', we need the full count
  return warFaceDownCards
}

/**
 * Determine the war winner when one player has insufficient cards.
 */
export function handleInsufficientCards(
  player1Remaining: number,
  player2Remaining: number,
  rule: InsufficientCardsRule,
  warPile: Card[]
): WarResolutionResult {
  const p1CanComplete = player1Remaining >= 2 // At minimum need 1 face-down + 1 face-up
  const p2CanComplete = player2Remaining >= 2

  if (rule === 'lose') {
    // The player who can't complete loses the game immediately
    if (!p1CanComplete && !p2CanComplete) {
      // Both can't complete - player with fewer cards loses
      // If tied, this is an edge case - player 1 loses (arbitrary)
      const loser = player1Remaining <= player2Remaining ? 'player1' : 'player2'
      return {
        winner: null,
        cardsWon: warPile,
        finalCards: null,
        warDepth: 1,
        insufficientCards: {
          player: loser,
          needed: 2,
          had: loser === 'player1' ? player1Remaining : player2Remaining,
        },
        gameEnds: true,
        loser,
      }
    }

    if (!p1CanComplete) {
      return {
        winner: null,
        cardsWon: warPile,
        finalCards: null,
        warDepth: 1,
        insufficientCards: {
          player: 'player1',
          needed: 2,
          had: player1Remaining,
        },
        gameEnds: true,
        loser: 'player1',
      }
    }

    if (!p2CanComplete) {
      return {
        winner: null,
        cardsWon: warPile,
        finalCards: null,
        warDepth: 1,
        insufficientCards: {
          player: 'player2',
          needed: 2,
          had: player2Remaining,
        },
        gameEnds: true,
        loser: 'player2',
      }
    }
  }

  if (rule === 'splitPot') {
    // Split the war pile - this doesn't end the game, just ends the war
    // We return null winner to signal the split
    return {
      winner: null,
      cardsWon: warPile,
      finalCards: null,
      warDepth: 1,
      gameEnds: false,
    }
  }

  // 'useRemaining' is handled by getFaceDownCount - shouldn't reach here
  // unless truly no cards left
  return {
    winner: null,
    cardsWon: warPile,
    finalCards: null,
    warDepth: 1,
    gameEnds: false,
  }
}

/**
 * Draw face-down cards for war from a player's deck.
 * Returns the drawn cards.
 */
export function drawFaceDownCards(
  deck: Card[],
  count: number
): Card[] {
  const cards: Card[] = []
  for (let i = 0; i < count; i++) {
    const card = drawCard(deck)
    if (card) {
      cards.push(card)
    }
  }
  return cards
}

/**
 * Structure for war state during resolution
 */
export interface WarState {
  pile: Card[]
  depth: number
  player1FaceDown: Card[]
  player2FaceDown: Card[]
  player1FaceUp: Card | null
  player2FaceUp: Card | null
}

/**
 * Initialize war state from a tie.
 * The initial face-up cards should be added to the pile.
 */
export function initWarState(card1: Card, card2: Card): WarState {
  return {
    pile: [card1, card2],
    depth: 1,
    player1FaceDown: [],
    player2FaceDown: [],
    player1FaceUp: null,
    player2FaceUp: null,
  }
}
