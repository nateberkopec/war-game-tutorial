import { describe, it, expect } from 'vitest'
import {
  createDeck,
  createMultiDeck,
  createCard,
  createCardId,
  shuffle,
  splitDeck,
  drawCard,
  addToBottom,
  compareCards,
  getRankValue,
  getSuitValue,
  SUITS,
  RANKS,
} from '../../../src/engine/deck'
import { createRng } from '../../../src/engine/rng'
import type { Card, GameConfig } from '../../../src/engine/types'

const defaultConfig: GameConfig = {
  deckCount: 1,
  cardsPerPlayer: 'all',
  aceHigh: true,
  suitsRank: false,
  warFaceDownCards: 3,
  insufficientCardsRule: 'lose',
  winCondition: { type: 'elimination' },
  shuffleWonCards: false,
  wonCardsPosition: 'bottom',
}

describe('Card Creation', () => {
  it('createCardId generates correct format', () => {
    expect(createCardId(0, 'hearts', 'A')).toBe('0-hearts-A')
    expect(createCardId(1, 'spades', '10')).toBe('1-spades-10')
  })

  it('createCard creates a card with correct properties', () => {
    const card = createCard(0, 'diamonds', 'K')
    expect(card.suit).toBe('diamonds')
    expect(card.rank).toBe('K')
    expect(card.id).toBe('0-diamonds-K')
  })
})

describe('Deck Creation', () => {
  it('createDeck generates 52 cards', () => {
    const deck = createDeck()
    expect(deck.length).toBe(52)
  })

  it('createDeck generates all suit/rank combinations', () => {
    const deck = createDeck()
    const ids = new Set(deck.map((c) => c.id))
    expect(ids.size).toBe(52)

    for (const suit of SUITS) {
      for (const rank of RANKS) {
        expect(ids.has(`0-${suit}-${rank}`)).toBe(true)
      }
    }
  })

  it('createMultiDeck generates correct card count', () => {
    const deck2 = createMultiDeck(2)
    expect(deck2.length).toBe(104)

    const deck4 = createMultiDeck(4)
    expect(deck4.length).toBe(208)
  })

  it('createMultiDeck has unique IDs across decks', () => {
    const deck = createMultiDeck(2)
    const ids = new Set(deck.map((c) => c.id))
    expect(ids.size).toBe(104)
  })
})

describe('Shuffle', () => {
  it('shuffle maintains deck length', () => {
    const deck = createDeck()
    const rng = createRng('test-seed')
    shuffle(deck, rng)
    expect(deck.length).toBe(52)
  })

  it('shuffle with same seed produces same result', () => {
    const deck1 = createDeck()
    const deck2 = createDeck()
    const rng1 = createRng('same-seed')
    const rng2 = createRng('same-seed')

    shuffle(deck1, rng1)
    shuffle(deck2, rng2)

    expect(deck1.map((c) => c.id)).toEqual(deck2.map((c) => c.id))
  })

  it('shuffle with different seeds produces different results', () => {
    const deck1 = createDeck()
    const deck2 = createDeck()
    const rng1 = createRng('seed-a')
    const rng2 = createRng('seed-b')

    shuffle(deck1, rng1)
    shuffle(deck2, rng2)

    expect(deck1.map((c) => c.id)).not.toEqual(deck2.map((c) => c.id))
  })
})

describe('splitDeck', () => {
  it('splits deck evenly with "all"', () => {
    const deck = createDeck()
    const [p1, p2] = splitDeck(deck, 'all')
    expect(p1.length).toBe(26)
    expect(p2.length).toBe(26)
  })

  it('splits deck with fixed count', () => {
    const deck = createDeck()
    const [p1, p2] = splitDeck(deck, 10)
    expect(p1.length).toBe(10)
    expect(p2.length).toBe(10)
  })

  it('throws when not enough cards for fixed count', () => {
    const deck = createDeck()
    expect(() => splitDeck(deck, 30)).toThrow(/Not enough cards/)
  })

  it('players get different cards', () => {
    const deck = createDeck()
    const [p1, p2] = splitDeck(deck, 'all')
    const p1Ids = new Set(p1.map((c) => c.id))
    const p2Ids = new Set(p2.map((c) => c.id))

    for (const id of p1Ids) {
      expect(p2Ids.has(id)).toBe(false)
    }
  })
})

describe('drawCard', () => {
  it('draws and removes the top card', () => {
    const deck = createDeck()
    const topCard = deck[0]
    const drawn = drawCard(deck)
    expect(drawn).toEqual(topCard)
    expect(deck.length).toBe(51)
    expect(deck[0]).not.toEqual(topCard)
  })

  it('returns null for empty deck', () => {
    const deck: Card[] = []
    expect(drawCard(deck)).toBeNull()
  })
})

describe('addToBottom', () => {
  it('adds cards to the bottom of deck', () => {
    const deck = [createCard(0, 'hearts', 'A')]
    const cards = [createCard(0, 'spades', 'K'), createCard(0, 'diamonds', 'Q')]
    addToBottom(deck, cards)
    expect(deck.length).toBe(3)
    expect(deck[0].id).toBe('0-hearts-A')
    expect(deck[1].id).toBe('0-spades-K')
    expect(deck[2].id).toBe('0-diamonds-Q')
  })

  it('shuffles cards before adding when specified', () => {
    const deck = [createCard(0, 'hearts', 'A')]
    const cards = [createCard(0, 'spades', '2'), createCard(0, 'spades', '3'), createCard(0, 'spades', '4')]
    const rng = createRng('shuffle-test')
    addToBottom(deck, cards, rng, true)
    expect(deck.length).toBe(4)
  })
})

describe('Card Comparison', () => {
  it('higher rank wins', () => {
    const aceHearts = createCard(0, 'hearts', 'A')
    const kingSpades = createCard(0, 'spades', 'K')
    expect(compareCards(aceHearts, kingSpades, defaultConfig)).toBe('player1')
    expect(compareCards(kingSpades, aceHearts, defaultConfig)).toBe('player2')
  })

  it('same rank is a tie when suits do not rank', () => {
    const aceHearts = createCard(0, 'hearts', 'A')
    const aceSpades = createCard(0, 'spades', 'A')
    expect(compareCards(aceHearts, aceSpades, defaultConfig)).toBe('tie')
  })

  it('respects aceHigh config', () => {
    const ace = createCard(0, 'hearts', 'A')
    const two = createCard(0, 'spades', '2')

    const aceHighConfig = { ...defaultConfig, aceHigh: true }
    expect(compareCards(ace, two, aceHighConfig)).toBe('player1')

    const aceLowConfig = { ...defaultConfig, aceHigh: false }
    expect(compareCards(ace, two, aceLowConfig)).toBe('player2')
  })

  it('compares suits when suitsRank is true', () => {
    const aceHearts = createCard(0, 'hearts', 'A')
    const aceSpades = createCard(0, 'spades', 'A')

    const suitsRankConfig: GameConfig = {
      ...defaultConfig,
      suitsRank: true,
      suitOrder: ['hearts', 'diamonds', 'clubs', 'spades'],
    }
    expect(compareCards(aceSpades, aceHearts, suitsRankConfig)).toBe('player1')
  })
})

describe('getRankValue', () => {
  it('returns correct values for ace-high', () => {
    const config = { ...defaultConfig, aceHigh: true }
    expect(getRankValue('2', config)).toBe(0)
    expect(getRankValue('A', config)).toBe(12)
    expect(getRankValue('K', config)).toBe(11)
  })

  it('returns correct values for ace-low', () => {
    const config = { ...defaultConfig, aceHigh: false }
    expect(getRankValue('A', config)).toBe(0)
    expect(getRankValue('2', config)).toBe(1)
  })
})

describe('getSuitValue', () => {
  it('returns correct values with default suit order', () => {
    expect(getSuitValue('hearts', defaultConfig)).toBe(0)
    expect(getSuitValue('spades', defaultConfig)).toBe(3)
  })

  it('respects custom suit order', () => {
    const config: GameConfig = {
      ...defaultConfig,
      suitOrder: ['spades', 'hearts', 'diamonds', 'clubs'],
    }
    expect(getSuitValue('spades', config)).toBe(0)
    expect(getSuitValue('hearts', config)).toBe(1)
  })
})
