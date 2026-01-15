/**
 * Replay system for recording and playing back games.
 * Enables watching completed games and analyzing gameplay.
 */

import type {
  GameConfig,
  GameEvent,
  GameStats,
  PlayerInfo,
  Replay,
} from './types'
import { WarGameEngine } from './engine'

/**
 * Create a replay from game data.
 */
export function createReplay(
  config: GameConfig,
  seed: string,
  players: [PlayerInfo, PlayerInfo],
  events: GameEvent[],
  stats: GameStats,
  duration: number
): Replay {
  return {
    id: `replay-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    createdAt: Date.now(),
    config: { ...config },
    seed,
    players: [{ ...players[0] }, { ...players[1] }],
    events: [...events],
    stats: { ...stats },
    duration,
  }
}

/**
 * Validate a replay object has all required fields.
 */
export function validateReplay(replay: unknown): replay is Replay {
  if (!replay || typeof replay !== 'object') return false

  const r = replay as Record<string, unknown>

  return (
    typeof r.id === 'string' &&
    typeof r.createdAt === 'number' &&
    typeof r.config === 'object' &&
    typeof r.seed === 'string' &&
    Array.isArray(r.players) &&
    r.players.length === 2 &&
    Array.isArray(r.events) &&
    typeof r.stats === 'object' &&
    typeof r.duration === 'number'
  )
}

/**
 * Replay player for stepping through a recorded game.
 */
export class ReplayPlayer {
  private replay: Replay
  private currentIndex: number = 0
  private playbackSpeed: number = 1
  private isPlaying: boolean = false
  private playbackTimer: ReturnType<typeof setTimeout> | null = null
  private onEvent: ((event: GameEvent, index: number) => void) | null = null
  private onComplete: (() => void) | null = null

  constructor(replay: Replay) {
    this.replay = replay
  }

  /**
   * Get the replay being played.
   */
  getReplay(): Replay {
    return this.replay
  }

  /**
   * Get current position in the replay.
   */
  getCurrentIndex(): number {
    return this.currentIndex
  }

  /**
   * Get total number of events.
   */
  getTotalEvents(): number {
    return this.replay.events.length
  }

  /**
   * Check if at the beginning.
   */
  isAtStart(): boolean {
    return this.currentIndex === 0
  }

  /**
   * Check if at the end.
   */
  isAtEnd(): boolean {
    return this.currentIndex >= this.replay.events.length
  }

  /**
   * Set callback for when events are played.
   */
  setOnEvent(callback: (event: GameEvent, index: number) => void): void {
    this.onEvent = callback
  }

  /**
   * Set callback for when replay completes.
   */
  setOnComplete(callback: () => void): void {
    this.onComplete = callback
  }

  /**
   * Step forward one event.
   */
  stepForward(): GameEvent | null {
    if (this.isAtEnd()) return null

    const event = this.replay.events[this.currentIndex]
    this.currentIndex++

    if (this.onEvent) {
      this.onEvent(event, this.currentIndex - 1)
    }

    if (this.isAtEnd() && this.onComplete) {
      this.onComplete()
    }

    return event
  }

  /**
   * Step backward one event.
   */
  stepBackward(): GameEvent | null {
    if (this.isAtStart()) return null

    this.currentIndex--
    return this.replay.events[this.currentIndex]
  }

  /**
   * Jump to a specific event index.
   */
  jumpTo(index: number): void {
    this.currentIndex = Math.max(0, Math.min(index, this.replay.events.length))
  }

  /**
   * Jump to a specific round.
   * Finds the roundStarted event for that round.
   */
  jumpToRound(roundNumber: number): void {
    for (let i = 0; i < this.replay.events.length; i++) {
      const event = this.replay.events[i]
      if (event.type === 'roundStarted' && event.roundNumber === roundNumber) {
        this.currentIndex = i
        return
      }
    }
  }

  /**
   * Set playback speed multiplier.
   */
  setPlaybackSpeed(multiplier: number): void {
    this.playbackSpeed = Math.max(0.1, Math.min(10, multiplier))
  }

  /**
   * Get current playback speed.
   */
  getPlaybackSpeed(): number {
    return this.playbackSpeed
  }

  /**
   * Start automatic playback.
   */
  play(): void {
    if (this.isPlaying || this.isAtEnd()) return

    this.isPlaying = true
    this.scheduleNextEvent()
  }

  /**
   * Pause automatic playback.
   */
  pause(): void {
    this.isPlaying = false
    if (this.playbackTimer) {
      clearTimeout(this.playbackTimer)
      this.playbackTimer = null
    }
  }

  /**
   * Check if currently playing.
   */
  getIsPlaying(): boolean {
    return this.isPlaying
  }

  /**
   * Reset to the beginning.
   */
  reset(): void {
    this.pause()
    this.currentIndex = 0
  }

  /**
   * Schedule the next event during playback.
   */
  private scheduleNextEvent(): void {
    if (!this.isPlaying || this.isAtEnd()) {
      this.isPlaying = false
      return
    }

    // Base delay of 500ms, adjusted by playback speed
    const delay = 500 / this.playbackSpeed

    this.playbackTimer = setTimeout(() => {
      this.stepForward()
      this.scheduleNextEvent()
    }, delay)
  }

  /**
   * Clean up resources.
   */
  dispose(): void {
    this.pause()
    this.onEvent = null
    this.onComplete = null
  }
}

/**
 * Create a game engine from a replay for re-simulation.
 * This creates a new engine with the same config and seed,
 * allowing the game to be replayed deterministically.
 */
export function createEngineFromReplay(replay: Replay): WarGameEngine {
  const engine = new WarGameEngine({
    ...replay.config,
    seed: replay.seed,
  })

  engine.setPlayers(
    { id: 'player1', name: replay.players[0].name, profileId: replay.players[0].profileId },
    { id: 'player2', name: replay.players[1].name, profileId: replay.players[1].profileId }
  )

  return engine
}

/**
 * Serialize a replay to JSON string.
 */
export function serializeReplay(replay: Replay): string {
  return JSON.stringify(replay)
}

/**
 * Deserialize a replay from JSON string.
 */
export function deserializeReplay(json: string): Replay {
  const parsed = JSON.parse(json)

  if (!validateReplay(parsed)) {
    throw new Error('Invalid replay data')
  }

  return parsed
}

/**
 * Get summary information about a replay.
 */
export function getReplaySummary(replay: Replay): {
  id: string
  date: Date
  players: [string, string]
  winner: string | null
  rounds: number
  wars: number
  duration: number
} {
  // Find winner from gameEnded event
  const endEvent = replay.events.find((e) => e.type === 'gameEnded')
  let winner: string | null = null

  if (endEvent && endEvent.type === 'gameEnded') {
    winner =
      endEvent.winner === 'player1'
        ? replay.players[0].name
        : replay.players[1].name
  }

  return {
    id: replay.id,
    date: new Date(replay.createdAt),
    players: [replay.players[0].name, replay.players[1].name],
    winner,
    rounds: replay.stats.totalRounds,
    wars: replay.stats.warsCount,
    duration: replay.duration,
  }
}
