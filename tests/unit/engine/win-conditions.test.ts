import { describe, it, expect } from 'vitest'
import { checkWinCondition, describeWinCondition } from '../../../src/engine/win-conditions'
import type { GameState, GameConfig } from '../../../src/engine/types'

function createTestState(overrides: Partial<GameState> = {}): GameState {
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

  return {
    id: 'test-game',
    config: defaultConfig,
    phase: 'playing',
    players: {
      player1: { id: 'player1', name: 'Alice', deck: [], cardsWon: 0 },
      player2: { id: 'player2', name: 'Bob', deck: [], cardsWon: 0 },
    },
    battlefield: {
      player1FaceUp: null,
      player2FaceUp: null,
      player1FaceDown: [],
      player2FaceDown: [],
      warPile: [],
    },
    currentRound: 0,
    warDepth: 0,
    rngState: '',
    ...overrides,
  }
}

describe('checkWinCondition - elimination', () => {
  it('player2 wins when player1 has no cards', () => {
    const state = createTestState({
      players: {
        player1: { id: 'player1', name: 'Alice', deck: [], cardsWon: 0 },
        player2: { id: 'player2', name: 'Bob', deck: [{ id: '1', suit: 'hearts', rank: 'A' }], cardsWon: 26 },
      },
    })

    const result = checkWinCondition(state)
    expect(result.isOver).toBe(true)
    expect(result.winner).toBe('player2')
    expect(result.reason).toBe('elimination')
  })

  it('player1 wins when player2 has no cards', () => {
    const state = createTestState({
      players: {
        player1: { id: 'player1', name: 'Alice', deck: [{ id: '1', suit: 'hearts', rank: 'A' }], cardsWon: 26 },
        player2: { id: 'player2', name: 'Bob', deck: [], cardsWon: 0 },
      },
    })

    const result = checkWinCondition(state)
    expect(result.isOver).toBe(true)
    expect(result.winner).toBe('player1')
    expect(result.reason).toBe('elimination')
  })

  it('game continues when both players have cards', () => {
    const state = createTestState({
      players: {
        player1: { id: 'player1', name: 'Alice', deck: [{ id: '1', suit: 'hearts', rank: 'A' }], cardsWon: 13 },
        player2: { id: 'player2', name: 'Bob', deck: [{ id: '2', suit: 'spades', rank: 'K' }], cardsWon: 13 },
      },
    })

    const result = checkWinCondition(state)
    expect(result.isOver).toBe(false)
    expect(result.winner).toBeNull()
  })

  it('handles edge case of both players empty', () => {
    const state = createTestState({
      players: {
        player1: { id: 'player1', name: 'Alice', deck: [], cardsWon: 0 },
        player2: { id: 'player2', name: 'Bob', deck: [], cardsWon: 0 },
      },
    })

    const result = checkWinCondition(state)
    expect(result.isOver).toBe(true)
    expect(result.winner).toBeNull()
    expect(result.reason).toBe('elimination')
  })
})

describe('checkWinCondition - firstTo', () => {
  it('player1 wins when reaching target count', () => {
    const cards = Array.from({ length: 30 }, (_, i) => ({ id: `${i}`, suit: 'hearts' as const, rank: 'A' as const }))
    const state = createTestState({
      config: {
        deckCount: 1,
        cardsPerPlayer: 'all',
        aceHigh: true,
        suitsRank: false,
        warFaceDownCards: 3,
        insufficientCardsRule: 'lose',
        winCondition: { type: 'firstTo', count: 30 },
        shuffleWonCards: false,
        wonCardsPosition: 'bottom',
      },
      players: {
        player1: { id: 'player1', name: 'Alice', deck: cards, cardsWon: 30 },
        player2: { id: 'player2', name: 'Bob', deck: [], cardsWon: 0 },
      },
    })

    const result = checkWinCondition(state)
    expect(result.isOver).toBe(true)
    expect(result.winner).toBe('player1')
    expect(result.reason).toBe('firstTo')
  })

  it('game continues when neither player reaches target', () => {
    const state = createTestState({
      config: {
        deckCount: 1,
        cardsPerPlayer: 'all',
        aceHigh: true,
        suitsRank: false,
        warFaceDownCards: 3,
        insufficientCardsRule: 'lose',
        winCondition: { type: 'firstTo', count: 40 },
        shuffleWonCards: false,
        wonCardsPosition: 'bottom',
      },
      players: {
        player1: { id: 'player1', name: 'Alice', deck: Array(26).fill({ id: '1', suit: 'hearts', rank: 'A' }), cardsWon: 13 },
        player2: { id: 'player2', name: 'Bob', deck: Array(26).fill({ id: '2', suit: 'spades', rank: 'K' }), cardsWon: 13 },
      },
    })

    const result = checkWinCondition(state)
    expect(result.isOver).toBe(false)
  })
})

describe('checkWinCondition - rounds', () => {
  it('player with more cards wins after max rounds', () => {
    const state = createTestState({
      config: {
        deckCount: 1,
        cardsPerPlayer: 'all',
        aceHigh: true,
        suitsRank: false,
        warFaceDownCards: 3,
        insufficientCardsRule: 'lose',
        winCondition: { type: 'rounds', count: 50 },
        shuffleWonCards: false,
        wonCardsPosition: 'bottom',
      },
      currentRound: 50,
      players: {
        player1: { id: 'player1', name: 'Alice', deck: Array(30).fill({ id: '1', suit: 'hearts', rank: 'A' }), cardsWon: 30 },
        player2: { id: 'player2', name: 'Bob', deck: Array(22).fill({ id: '2', suit: 'spades', rank: 'K' }), cardsWon: 22 },
      },
    })

    const result = checkWinCondition(state)
    expect(result.isOver).toBe(true)
    expect(result.winner).toBe('player1')
    expect(result.reason).toBe('rounds')
  })

  it('game continues before max rounds', () => {
    const state = createTestState({
      config: {
        deckCount: 1,
        cardsPerPlayer: 'all',
        aceHigh: true,
        suitsRank: false,
        warFaceDownCards: 3,
        insufficientCardsRule: 'lose',
        winCondition: { type: 'rounds', count: 50 },
        shuffleWonCards: false,
        wonCardsPosition: 'bottom',
      },
      currentRound: 25,
      players: {
        player1: { id: 'player1', name: 'Alice', deck: Array(30).fill({ id: '1', suit: 'hearts', rank: 'A' }), cardsWon: 30 },
        player2: { id: 'player2', name: 'Bob', deck: Array(22).fill({ id: '2', suit: 'spades', rank: 'K' }), cardsWon: 22 },
      },
    })

    const result = checkWinCondition(state)
    expect(result.isOver).toBe(false)
  })

  it('tie at end of rounds results in no winner', () => {
    const state = createTestState({
      config: {
        deckCount: 1,
        cardsPerPlayer: 'all',
        aceHigh: true,
        suitsRank: false,
        warFaceDownCards: 3,
        insufficientCardsRule: 'lose',
        winCondition: { type: 'rounds', count: 50 },
        shuffleWonCards: false,
        wonCardsPosition: 'bottom',
      },
      currentRound: 50,
      players: {
        player1: { id: 'player1', name: 'Alice', deck: Array(26).fill({ id: '1', suit: 'hearts', rank: 'A' }), cardsWon: 26 },
        player2: { id: 'player2', name: 'Bob', deck: Array(26).fill({ id: '2', suit: 'spades', rank: 'K' }), cardsWon: 26 },
      },
    })

    const result = checkWinCondition(state)
    expect(result.isOver).toBe(true)
    expect(result.winner).toBeNull()
    expect(result.reason).toBe('rounds')
  })
})

describe('describeWinCondition', () => {
  it('describes elimination condition', () => {
    expect(describeWinCondition({ type: 'elimination' })).toBe('Win by collecting all cards')
  })

  it('describes firstTo condition', () => {
    expect(describeWinCondition({ type: 'firstTo', count: 40 })).toBe('First to 40 cards wins')
  })

  it('describes rounds condition', () => {
    expect(describeWinCondition({ type: 'rounds', count: 100 })).toBe('Most cards after 100 rounds wins')
  })
})
