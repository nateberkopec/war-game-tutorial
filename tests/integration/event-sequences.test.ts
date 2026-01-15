import { describe, it, expect, beforeEach } from 'vitest'
import { WarGameEngine, GameEvent } from '../../src/engine'

describe('Event Sequences', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  describe('Game lifecycle events', () => {
    it('emits gameStarted with correct config and players', () => {
      const engine = new WarGameEngine({
        seed: 'lifecycle-test',
        deckCount: 1,
        aceHigh: true,
      })

      engine.setPlayers(
        { id: 'player1', name: 'Alice', profileId: 'profile-1' },
        { id: 'player2', name: 'Bob', profileId: 'profile-2' }
      )

      const events: GameEvent[] = []
      engine.on('*', (event) => events.push(event))

      engine.start()

      const startEvent = events.find((e) => e.type === 'gameStarted')
      expect(startEvent).toBeDefined()
      if (startEvent && startEvent.type === 'gameStarted') {
        expect(startEvent.players[0].name).toBe('Alice')
        expect(startEvent.players[1].name).toBe('Bob')
        expect(startEvent.config.seed).toBe('lifecycle-test')
      }
    })

    it('emits gameEnded with stats', () => {
      const engine = new WarGameEngine({
        seed: 'end-event-test',
        winCondition: { type: 'firstTo', count: 30 },
      })

      engine.setPlayers(
        { id: 'player1', name: 'Alice' },
        { id: 'player2', name: 'Bob' }
      )

      const events: GameEvent[] = []
      engine.on('*', (event) => events.push(event))

      engine.start()

      while (!events.some((e) => e.type === 'gameEnded')) {
        engine.draw()
      }

      const endEvent = events.find((e) => e.type === 'gameEnded')
      expect(endEvent).toBeDefined()
      if (endEvent && endEvent.type === 'gameEnded') {
        expect(endEvent.winner).toMatch(/player[12]/)
        expect(endEvent.stats).toBeDefined()
        expect(endEvent.stats.totalRounds).toBeGreaterThan(0)
      }
    })
  })

  describe('Round events', () => {
    it('emits roundStarted with round number', () => {
      const engine = new WarGameEngine({ seed: 'round-test' })
      engine.setPlayers(
        { id: 'player1', name: 'Alice' },
        { id: 'player2', name: 'Bob' }
      )

      const events: GameEvent[] = []
      engine.on('*', (event) => events.push(event))

      engine.start()
      engine.draw()
      engine.draw()
      engine.draw()

      const roundEvents = events.filter((e) => e.type === 'roundStarted')
      expect(roundEvents.length).toBeGreaterThanOrEqual(3)
      
      const firstRound = roundEvents[0]
      if (firstRound && firstRound.type === 'roundStarted') {
        expect(firstRound.roundNumber).toBeGreaterThanOrEqual(1)
      }
    })

    it('emits cardsDrawn with both player cards', () => {
      const engine = new WarGameEngine({ seed: 'cards-drawn-test' })
      engine.setPlayers(
        { id: 'player1', name: 'Alice' },
        { id: 'player2', name: 'Bob' }
      )

      const events: GameEvent[] = []
      engine.on('*', (event) => events.push(event))

      engine.start()
      engine.draw()

      const drawnEvent = events.find((e) => e.type === 'cardsDrawn')
      expect(drawnEvent).toBeDefined()
      if (drawnEvent && drawnEvent.type === 'cardsDrawn') {
        expect(drawnEvent.cards.player1).toBeDefined()
        expect(drawnEvent.cards.player2).toBeDefined()
        expect(drawnEvent.cards.player1.id).toBeDefined()
        expect(drawnEvent.cards.player2.id).toBeDefined()
      }
    })

    it('emits comparison with result', () => {
      const engine = new WarGameEngine({ seed: 'comparison-test' })
      engine.setPlayers(
        { id: 'player1', name: 'Alice' },
        { id: 'player2', name: 'Bob' }
      )

      const events: GameEvent[] = []
      engine.on('*', (event) => events.push(event))

      engine.start()
      engine.draw()

      const comparisonEvent = events.find((e) => e.type === 'comparison')
      expect(comparisonEvent).toBeDefined()
      if (comparisonEvent && comparisonEvent.type === 'comparison') {
        expect(['player1', 'player2', 'tie']).toContain(comparisonEvent.result)
        expect(comparisonEvent.cards).toHaveLength(2)
      }
    })

    it('emits roundWon when round has a winner', () => {
      const engine = new WarGameEngine({ seed: 'round-won-test' })
      engine.setPlayers(
        { id: 'player1', name: 'Alice' },
        { id: 'player2', name: 'Bob' }
      )

      const events: GameEvent[] = []
      engine.on('*', (event) => events.push(event))

      engine.start()

      // Keep drawing until we get a non-tie round
      for (let i = 0; i < 50 && !events.some((e) => e.type === 'roundWon'); i++) {
        engine.draw()
      }

      const roundWonEvent = events.find((e) => e.type === 'roundWon')
      expect(roundWonEvent).toBeDefined()
      if (roundWonEvent && roundWonEvent.type === 'roundWon') {
        expect(['player1', 'player2']).toContain(roundWonEvent.winner)
        expect(roundWonEvent.cardsWon.length).toBeGreaterThanOrEqual(2)
      }
    })
  })

  describe('War events', () => {
    it('emits warStarted when cards tie', () => {
      // We need to find a seed that produces a tie early
      let warStartedEvent: GameEvent | undefined

      for (let seedNum = 0; seedNum < 100 && !warStartedEvent; seedNum++) {
        const engine = new WarGameEngine({ seed: `war-search-${seedNum}` })
        engine.setPlayers(
          { id: 'player1', name: 'Alice' },
          { id: 'player2', name: 'Bob' }
        )

        const events: GameEvent[] = []
        engine.on('*', (event) => events.push(event))

        engine.start()

        for (let i = 0; i < 100 && !warStartedEvent; i++) {
          engine.draw()
          warStartedEvent = events.find((e) => e.type === 'warStarted')
          if (engine.getState().phase === 'finished') break
        }
      }

      expect(warStartedEvent).toBeDefined()
      if (warStartedEvent && warStartedEvent.type === 'warStarted') {
        expect(warStartedEvent.depth).toBeGreaterThanOrEqual(1)
      }
    })

    it('emits warFaceDownPlaced for both players', () => {
      let faceDownEvents: GameEvent[] = []

      for (let seedNum = 0; seedNum < 100 && faceDownEvents.length < 2; seedNum++) {
        const engine = new WarGameEngine({ seed: `facedown-search-${seedNum}` })
        engine.setPlayers(
          { id: 'player1', name: 'Alice' },
          { id: 'player2', name: 'Bob' }
        )

        const events: GameEvent[] = []
        engine.on('*', (event) => events.push(event))

        engine.start()

        for (let i = 0; i < 200; i++) {
          engine.draw()
          faceDownEvents = events.filter((e) => e.type === 'warFaceDownPlaced')
          if (faceDownEvents.length >= 2) break
          if (engine.getState().phase === 'finished') break
        }
        
        if (faceDownEvents.length >= 2) break
      }

      expect(faceDownEvents.length).toBeGreaterThanOrEqual(2)
      
      const players = faceDownEvents
        .filter((e): e is Extract<GameEvent, { type: 'warFaceDownPlaced' }> => 
          e.type === 'warFaceDownPlaced'
        )
        .map((e) => e.player)
      
      expect(players).toContain('player1')
      expect(players).toContain('player2')
    })

    it('emits warResolved after war completes', () => {
      let warResolved: GameEvent | undefined

      for (let seedNum = 0; seedNum < 100 && !warResolved; seedNum++) {
        const engine = new WarGameEngine({ seed: `resolved-search-${seedNum}` })
        engine.setPlayers(
          { id: 'player1', name: 'Alice' },
          { id: 'player2', name: 'Bob' }
        )

        const events: GameEvent[] = []
        engine.on('*', (event) => events.push(event))

        engine.start()

        for (let i = 0; i < 200 && !warResolved; i++) {
          engine.draw()
          warResolved = events.find((e) => e.type === 'warResolved')
          if (engine.getState().phase === 'finished') break
        }
      }

      expect(warResolved).toBeDefined()
      if (warResolved && warResolved.type === 'warResolved') {
        expect(['player1', 'player2']).toContain(warResolved.winner)
        expect(warResolved.totalCards).toBeGreaterThanOrEqual(6)
      }
    })
  })

  describe('Wildcard listener', () => {
    it('receives all events with wildcard', () => {
      const engine = new WarGameEngine({ seed: 'wildcard-test' })
      engine.setPlayers(
        { id: 'player1', name: 'Alice' },
        { id: 'player2', name: 'Bob' }
      )

      const allEvents: GameEvent[] = []
      engine.on('*', (event) => {
        allEvents.push(event)
      })

      engine.start()
      engine.draw()

      const eventTypes = new Set(allEvents.map((e) => e.type))
      expect(eventTypes.has('gameStarted')).toBe(true)
      expect(eventTypes.has('roundStarted')).toBe(true)
      expect(eventTypes.has('cardsDrawn')).toBe(true)
      expect(eventTypes.has('comparison')).toBe(true)
    })
  })

  describe('Event listener management', () => {
    it('can remove event listeners with off()', () => {
      const engine = new WarGameEngine({ seed: 'listener-test' })
      engine.setPlayers(
        { id: 'player1', name: 'Alice' },
        { id: 'player2', name: 'Bob' }
      )

      let callCount = 0
      const listener = () => {
        callCount++
      }

      engine.on('roundStarted', listener)
      engine.start()
      engine.draw()
      
      const firstCount = callCount
      expect(firstCount).toBeGreaterThan(0)

      engine.off('roundStarted', listener)
      engine.draw()

      // Count should not increase after removing listener
      expect(callCount).toBe(firstCount)
    })
  })
})
