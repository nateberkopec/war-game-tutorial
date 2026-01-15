import { describe, it, expect, vi } from 'vitest'
import { WarGameEngine, GameEvent } from '../../../src/engine'

describe('WarGameEngine', () => {
  it('can be instantiated with default config', () => {
    const engine = new WarGameEngine()
    expect(engine).toBeDefined()
    const state = engine.getState()
    expect(state.phase).toBe('setup')
  })

  it('can set players', () => {
    const engine = new WarGameEngine()
    engine.setPlayers(
      { id: 'player1', name: 'Alice' },
      { id: 'player2', name: 'Bob' }
    )
    const state = engine.getState()
    expect(state.players.player1.name).toBe('Alice')
    expect(state.players.player2.name).toBe('Bob')
  })

  it('emits gameStarted event on start', () => {
    const engine = new WarGameEngine({ seed: 'test-seed' })
    engine.setPlayers(
      { id: 'player1', name: 'Alice' },
      { id: 'player2', name: 'Bob' }
    )

    const events: GameEvent[] = []
    engine.on('*', (event) => events.push(event))

    engine.start()

    expect(events.length).toBeGreaterThan(0)
    expect(events[0].type).toBe('gameStarted')
    
    const state = engine.getState()
    expect(state.phase).toBe('playing')
    expect(state.players.player1.deck.length).toBe(26)
    expect(state.players.player2.deck.length).toBe(26)
  })

  it('emits events during a draw', () => {
    const engine = new WarGameEngine({ seed: 'test-draw' })
    engine.setPlayers(
      { id: 'player1', name: 'Alice' },
      { id: 'player2', name: 'Bob' }
    )
    engine.start()

    const events: GameEvent[] = []
    engine.on('*', (event) => events.push(event))

    engine.draw()

    // Should emit: roundStarted, cardsDrawn, comparison, and either roundWon or warStarted
    expect(events.length).toBeGreaterThanOrEqual(3)
    expect(events[0].type).toBe('roundStarted')
    expect(events[1].type).toBe('cardsDrawn')
    expect(events[2].type).toBe('comparison')
  })

  it('can play multiple rounds with a fixed seed', () => {
    const engine = new WarGameEngine({ seed: 'test-multiple-rounds' })
    engine.setPlayers(
      { id: 'player1', name: 'Alice' },
      { id: 'player2', name: 'Bob' }
    )
    engine.start()

    // Play 10 rounds to verify game progresses
    for (let i = 0; i < 10; i++) {
      engine.draw()
    }

    const state = engine.getState()
    // After 10 draws, the total cards should still be 52
    // (cards just move between players)
    const totalCards = state.players.player1.deck.length + 
                       state.players.player2.deck.length +
                       (state.battlefield.player1FaceUp ? 1 : 0) +
                       (state.battlefield.player2FaceUp ? 1 : 0) +
                       state.battlefield.player1FaceDown.length +
                       state.battlefield.player2FaceDown.length +
                       state.battlefield.warPile.length
    
    expect(totalCards).toBe(52)
    expect(state.currentRound).toBeGreaterThan(0)
  })

  it('handles a firstTo win condition', () => {
    // Use firstTo win condition for a shorter game
    const engine = new WarGameEngine({ 
      seed: 'firstto-test',
      winCondition: { type: 'firstTo', count: 30 }
    })
    engine.setPlayers(
      { id: 'player1', name: 'Alice' },
      { id: 'player2', name: 'Bob' }
    )
    engine.start()

    let gameEnded = false
    let winner: string | null = null
    engine.on('gameEnded', (event) => {
      if (event.type === 'gameEnded') {
        gameEnded = true
        winner = event.winner
      }
    })

    // Play until game ends or max iterations (safety)
    let iterations = 0
    const maxIterations = 500

    while (!gameEnded && iterations < maxIterations) {
      engine.draw()
      iterations++
    }

    expect(gameEnded).toBe(true)
    expect(winner).toMatch(/player[12]/)
    
    const state = engine.getState()
    expect(state.phase).toBe('finished')
  })
})
