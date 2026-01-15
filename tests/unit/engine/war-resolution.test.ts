import { describe, it, expect } from 'vitest'
import {
  canCompleteWar,
  getFaceDownCount,
  handleInsufficientCards,
  drawFaceDownCards,
  initWarState,
} from '../../../src/engine/war'
import { createCard } from '../../../src/engine/deck'
import type { Card } from '../../../src/engine/types'

describe('canCompleteWar', () => {
  it('returns true when player has enough cards', () => {
    expect(canCompleteWar(4, 3)).toBe(true) // 3 face-down + 1 face-up
    expect(canCompleteWar(2, 1)).toBe(true) // 1 face-down + 1 face-up
  })

  it('returns false when player lacks cards', () => {
    expect(canCompleteWar(3, 3)).toBe(false) // Need 4 (3+1), have 3
    expect(canCompleteWar(0, 1)).toBe(false) // No cards at all
    expect(canCompleteWar(1, 1)).toBe(false) // Need 2, have 1
  })

  it('returns true when exactly enough cards', () => {
    expect(canCompleteWar(4, 3)).toBe(true) // Exactly 3+1
  })
})

describe('getFaceDownCount', () => {
  it('returns full count when player has enough cards with useRemaining', () => {
    expect(getFaceDownCount(10, 3, 'useRemaining')).toBe(3)
  })

  it('returns reduced count when player lacks cards with useRemaining', () => {
    expect(getFaceDownCount(3, 3, 'useRemaining')).toBe(2) // Save 1 for face-up
    expect(getFaceDownCount(2, 3, 'useRemaining')).toBe(1)
    expect(getFaceDownCount(1, 3, 'useRemaining')).toBe(0) // Only 1 card, need it for face-up
  })

  it('returns full count with lose rule regardless of deck size', () => {
    expect(getFaceDownCount(10, 3, 'lose')).toBe(3)
    expect(getFaceDownCount(2, 3, 'lose')).toBe(3)
  })

  it('returns full count with splitPot rule', () => {
    expect(getFaceDownCount(10, 3, 'splitPot')).toBe(3)
    expect(getFaceDownCount(2, 3, 'splitPot')).toBe(3)
  })
})

describe('handleInsufficientCards', () => {
  const warPile: Card[] = [
    createCard(0, 'hearts', 'A'),
    createCard(0, 'spades', 'A'),
  ]

  describe('with lose rule', () => {
    it('player1 loses when they cannot complete war', () => {
      const result = handleInsufficientCards(1, 10, 'lose', warPile)
      expect(result.gameEnds).toBe(true)
      expect(result.loser).toBe('player1')
      expect(result.winner).toBeNull()
    })

    it('player2 loses when they cannot complete war', () => {
      const result = handleInsufficientCards(10, 1, 'lose', warPile)
      expect(result.gameEnds).toBe(true)
      expect(result.loser).toBe('player2')
    })

    it('player with fewer cards loses when both cannot complete', () => {
      const result = handleInsufficientCards(0, 1, 'lose', warPile)
      expect(result.gameEnds).toBe(true)
      expect(result.loser).toBe('player1')
    })

    it('includes insufficient cards info', () => {
      const result = handleInsufficientCards(1, 10, 'lose', warPile)
      expect(result.insufficientCards).toEqual({
        player: 'player1',
        needed: 2,
        had: 1,
      })
    })
  })

  describe('with splitPot rule', () => {
    it('does not end game', () => {
      const result = handleInsufficientCards(1, 1, 'splitPot', warPile)
      expect(result.gameEnds).toBe(false)
      expect(result.winner).toBeNull()
    })

    it('returns the war pile', () => {
      const result = handleInsufficientCards(1, 1, 'splitPot', warPile)
      expect(result.cardsWon).toEqual(warPile)
    })
  })
})

describe('drawFaceDownCards', () => {
  it('draws specified number of cards', () => {
    const deck: Card[] = [
      createCard(0, 'hearts', '2'),
      createCard(0, 'hearts', '3'),
      createCard(0, 'hearts', '4'),
      createCard(0, 'hearts', '5'),
    ]
    const drawn = drawFaceDownCards(deck, 3)
    expect(drawn.length).toBe(3)
    expect(deck.length).toBe(1)
    expect(deck[0].rank).toBe('5')
  })

  it('draws only available cards when deck is small', () => {
    const deck: Card[] = [
      createCard(0, 'hearts', '2'),
    ]
    const drawn = drawFaceDownCards(deck, 3)
    expect(drawn.length).toBe(1)
    expect(deck.length).toBe(0)
  })

  it('returns empty array for empty deck', () => {
    const deck: Card[] = []
    const drawn = drawFaceDownCards(deck, 3)
    expect(drawn.length).toBe(0)
  })
})

describe('initWarState', () => {
  it('creates war state with initial cards in pile', () => {
    const card1 = createCard(0, 'hearts', 'K')
    const card2 = createCard(0, 'spades', 'K')
    const state = initWarState(card1, card2)

    expect(state.pile).toContain(card1)
    expect(state.pile).toContain(card2)
    expect(state.pile.length).toBe(2)
    expect(state.depth).toBe(1)
    expect(state.player1FaceDown).toEqual([])
    expect(state.player2FaceDown).toEqual([])
    expect(state.player1FaceUp).toBeNull()
    expect(state.player2FaceUp).toBeNull()
  })
})
