/**
 * Deck management functions: creating, shuffling, splitting, and comparing cards.
 */

import type { Card, GameConfig, PlayerId, Rank, Suit } from './types'
import type { Rng } from './rng'

// =============================================================================
// Constants
// =============================================================================

export const SUITS: readonly Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'] as const

export const RANKS: readonly Rank[] = [
  '2',
  '3',
  '4',
  '5',
  '6',
  '7',
  '8',
  '9',
  '10',
  'J',
  'Q',
  'K',
  'A',
] as const

/** Default rank order (2 is lowest, A is highest when aceHigh is true) */
export const DEFAULT_RANK_ORDER: readonly Rank[] = RANKS

// =============================================================================
// Card Creation
// =============================================================================

/**
 * Create a unique card ID.
 * Format: "{deckIndex}-{suit}-{rank}" e.g. "0-hearts-A"
 */
export function createCardId(deckIndex: number, suit: Suit, rank: Rank): string {
  return `${deckIndex}-${suit}-${rank}`
}

/**
 * Create a single card.
 */
export function createCard(deckIndex: number, suit: Suit, rank: Rank): Card {
  return {
    suit,
    rank,
    id: createCardId(deckIndex, suit, rank),
  }
}

/**
 * Create a standard 52-card deck.
 * @param deckIndex - Index for multi-deck games (default 0)
 */
export function createDeck(deckIndex: number = 0): Card[] {
  const deck: Card[] = []
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push(createCard(deckIndex, suit, rank))
    }
  }
  return deck
}

/**
 * Create multiple combined decks.
 * @param count - Number of decks to combine
 */
export function createMultiDeck(count: number): Card[] {
  const deck: Card[] = []
  for (let i = 0; i < count; i++) {
    deck.push(...createDeck(i))
  }
  return deck
}

// =============================================================================
// Shuffling
// =============================================================================

/**
 * Fisher-Yates shuffle algorithm.
 * Mutates the array in place and returns it.
 * @param deck - Array to shuffle
 * @param rng - Random number generator
 */
export function shuffle<T>(deck: T[], rng: Rng): T[] {
  for (let i = deck.length - 1; i > 0; i--) {
    const j = rng.nextInt(i + 1)
    ;[deck[i], deck[j]] = [deck[j], deck[i]]
  }
  return deck
}

/**
 * Create and shuffle a deck in one operation.
 * @param rng - Random number generator
 * @param deckCount - Number of decks to combine (default 1)
 */
export function createShuffledDeck(rng: Rng, deckCount: number = 1): Card[] {
  const deck = deckCount === 1 ? createDeck() : createMultiDeck(deckCount)
  return shuffle(deck, rng)
}

// =============================================================================
// Deck Operations
// =============================================================================

/**
 * Split a deck between two players.
 * @param deck - The deck to split
 * @param count - Cards per player, or 'all' to split evenly
 * @returns Tuple of [player1Cards, player2Cards]
 */
export function splitDeck(
  deck: Card[],
  count: number | 'all'
): [Card[], Card[]] {
  if (count === 'all') {
    const mid = Math.floor(deck.length / 2)
    return [deck.slice(0, mid), deck.slice(mid)]
  }

  // Fixed count per player
  const total = count * 2
  if (total > deck.length) {
    throw new Error(
      `Not enough cards: need ${total} for ${count} per player, but deck has ${deck.length}`
    )
  }

  return [deck.slice(0, count), deck.slice(count, count * 2)]
}

/**
 * Draw the top card from a deck.
 * Removes and returns the first card.
 * @returns The drawn card, or null if deck is empty
 */
export function drawCard(deck: Card[]): Card | null {
  return deck.shift() ?? null
}

/**
 * Add cards to the bottom of a deck.
 * Optionally shuffles them before adding.
 */
export function addToBottom(
  deck: Card[],
  cards: Card[],
  rng?: Rng,
  shouldShuffle: boolean = false
): void {
  const toAdd = shouldShuffle && rng ? shuffle([...cards], rng) : cards
  deck.push(...toAdd)
}

// =============================================================================
// Card Comparison
// =============================================================================

/** Pre-computed rank value lookup for ace-high (default) */
const ACE_HIGH_RANK_VALUES: Record<Rank, number> = {
  '2': 0, '3': 1, '4': 2, '5': 3, '6': 4, '7': 5, '8': 6, '9': 7,
  '10': 8, 'J': 9, 'Q': 10, 'K': 11, 'A': 12,
}

/** Pre-computed rank value lookup for ace-low */
const ACE_LOW_RANK_VALUES: Record<Rank, number> = {
  'A': 0, '2': 1, '3': 2, '4': 3, '5': 4, '6': 5, '7': 6, '8': 7,
  '9': 8, '10': 9, 'J': 10, 'Q': 11, 'K': 12,
}

/** Pre-computed suit value lookup (default order) */
const DEFAULT_SUIT_VALUES: Record<Suit, number> = {
  'hearts': 0, 'diamonds': 1, 'clubs': 2, 'spades': 3,
}

/**
 * Get the numeric value of a rank for comparison.
 * Optimized with pre-computed lookup tables for common cases.
 * @param rank - Card rank
 * @param config - Game config for ace-high and custom rank order
 */
export function getRankValue(rank: Rank, config: GameConfig): number {
  // Fast path: use pre-computed lookup for standard rank orders
  if (!config.customRankOrder) {
    return config.aceHigh ? ACE_HIGH_RANK_VALUES[rank] : ACE_LOW_RANK_VALUES[rank]
  }

  // Slow path: custom rank order requires indexOf
  const rankOrder = config.customRankOrder
  let order: readonly Rank[]
  if (!config.aceHigh) {
    order = ['A', ...rankOrder.filter((r) => r !== 'A')]
  } else {
    order = rankOrder
  }

  return order.indexOf(rank)
}

/**
 * Get the numeric value of a suit for comparison (when suits matter).
 * @param suit - Card suit
 * @param config - Game config for suit order
 */
export function getSuitValue(suit: Suit, config: GameConfig): number {
  // Fast path: use pre-computed lookup for default suit order
  if (!config.suitOrder) {
    return DEFAULT_SUIT_VALUES[suit]
  }

  // Slow path: custom suit order
  return config.suitOrder.indexOf(suit)
}

export type CompareResult = PlayerId | 'tie'

/**
 * Compare two cards and determine the winner.
 * @param card1 - Player 1's card
 * @param card2 - Player 2's card
 * @param config - Game config for ranking rules
 * @returns 'player1', 'player2', or 'tie'
 */
export function compareCards(
  card1: Card,
  card2: Card,
  config: GameConfig
): CompareResult {
  const rank1 = getRankValue(card1.rank, config)
  const rank2 = getRankValue(card2.rank, config)

  if (rank1 > rank2) return 'player1'
  if (rank2 > rank1) return 'player2'

  // Ranks are equal - check suits if configured
  if (config.suitsRank) {
    const suit1 = getSuitValue(card1.suit, config)
    const suit2 = getSuitValue(card2.suit, config)

    if (suit1 > suit2) return 'player1'
    if (suit2 > suit1) return 'player2'
  }

  return 'tie'
}

/**
 * Pre-computed card comparator for optimal performance.
 * Create once with a config and reuse for many comparisons.
 */
export class CardComparator {
  private rankValues: Record<Rank, number>
  private suitValues: Record<Suit, number>
  private suitsRank: boolean

  constructor(config: GameConfig) {
    this.suitsRank = config.suitsRank

    // Pre-compute rank values
    if (!config.customRankOrder) {
      this.rankValues = config.aceHigh ? ACE_HIGH_RANK_VALUES : ACE_LOW_RANK_VALUES
    } else {
      const rankOrder = config.customRankOrder
      const order: Rank[] = config.aceHigh
        ? [...rankOrder]
        : ['A', ...rankOrder.filter((r) => r !== 'A')]

      this.rankValues = {} as Record<Rank, number>
      order.forEach((rank, index) => {
        this.rankValues[rank] = index
      })
    }

    // Pre-compute suit values
    if (!config.suitOrder) {
      this.suitValues = DEFAULT_SUIT_VALUES
    } else {
      this.suitValues = {} as Record<Suit, number>
      config.suitOrder.forEach((suit, index) => {
        this.suitValues[suit] = index
      })
    }
  }

  /**
   * Compare two cards using pre-computed values.
   */
  compare(card1: Card, card2: Card): CompareResult {
    const rank1 = this.rankValues[card1.rank]
    const rank2 = this.rankValues[card2.rank]

    if (rank1 > rank2) return 'player1'
    if (rank2 > rank1) return 'player2'

    if (this.suitsRank) {
      const suit1 = this.suitValues[card1.suit]
      const suit2 = this.suitValues[card2.suit]

      if (suit1 > suit2) return 'player1'
      if (suit2 > suit1) return 'player2'
    }

    return 'tie'
  }
}
