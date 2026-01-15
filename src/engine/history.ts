/**
 * History tracking for game events with checkpoint support.
 * Enables undo/redo and replay functionality.
 */

import type { GameEvent, GameState } from './types'

/**
 * A checkpoint captures the complete game state at a specific point.
 * Used to restore state for undo operations.
 */
export interface Checkpoint {
  /** Index in the event history where this checkpoint was created */
  eventIndex: number
  /** Round number at checkpoint */
  roundNumber: number
  /** Serialized game state */
  state: GameState
  /** Timestamp when checkpoint was created */
  timestamp: number
}

/**
 * History manager for tracking events and checkpoints.
 */
export class GameHistory {
  private events: GameEvent[] = []
  private checkpoints: Checkpoint[] = []
  private currentIndex: number = 0

  /**
   * Record an event in history.
   */
  recordEvent(event: GameEvent): void {
    // If we're not at the end of history (after an undo), truncate
    if (this.currentIndex < this.events.length) {
      this.events = this.events.slice(0, this.currentIndex)
      // Remove any checkpoints after the current position
      this.checkpoints = this.checkpoints.filter(
        (cp) => cp.eventIndex <= this.currentIndex
      )
    }

    this.events.push(event)
    this.currentIndex = this.events.length
  }

  /**
   * Create a checkpoint at the current position.
   * Checkpoints are created at round boundaries for efficient undo.
   */
  createCheckpoint(state: GameState, roundNumber: number): void {
    // Don't create duplicate checkpoints at the same position
    const existing = this.checkpoints.find(
      (cp) => cp.eventIndex === this.currentIndex
    )
    if (existing) return

    this.checkpoints.push({
      eventIndex: this.currentIndex,
      roundNumber,
      state: deepCloneState(state),
      timestamp: Date.now(),
    })
  }

  /**
   * Get the checkpoint for a specific round, or the nearest one before it.
   */
  getCheckpointForRound(roundNumber: number): Checkpoint | null {
    // Find the checkpoint at or before the requested round
    let bestCheckpoint: Checkpoint | null = null

    for (const checkpoint of this.checkpoints) {
      if (checkpoint.roundNumber <= roundNumber) {
        if (!bestCheckpoint || checkpoint.roundNumber > bestCheckpoint.roundNumber) {
          bestCheckpoint = checkpoint
        }
      }
    }

    return bestCheckpoint
  }

  /**
   * Get the most recent checkpoint before the current position.
   */
  getPreviousCheckpoint(): Checkpoint | null {
    // Find the latest checkpoint before current position
    let best: Checkpoint | null = null

    for (const checkpoint of this.checkpoints) {
      if (checkpoint.eventIndex < this.currentIndex) {
        if (!best || checkpoint.eventIndex > best.eventIndex) {
          best = checkpoint
        }
      }
    }

    return best
  }

  /**
   * Get the next checkpoint after the current position.
   */
  getNextCheckpoint(): Checkpoint | null {
    let best: Checkpoint | null = null

    for (const checkpoint of this.checkpoints) {
      if (checkpoint.eventIndex > this.currentIndex) {
        if (!best || checkpoint.eventIndex < best.eventIndex) {
          best = checkpoint
        }
      }
    }

    return best
  }

  /**
   * Move to a checkpoint, returning events to replay from there.
   */
  restoreToCheckpoint(checkpoint: Checkpoint): GameEvent[] {
    this.currentIndex = checkpoint.eventIndex
    // Return events that need to be replayed to reach current state
    return []
  }

  /**
   * Get events between two indices (exclusive end).
   */
  getEventsBetween(startIndex: number, endIndex: number): GameEvent[] {
    return this.events.slice(startIndex, endIndex)
  }

  /**
   * Get all events from a checkpoint to current position.
   */
  getEventsFromCheckpoint(checkpoint: Checkpoint): GameEvent[] {
    return this.events.slice(checkpoint.eventIndex, this.currentIndex)
  }

  /**
   * Check if undo is possible.
   */
  canUndo(): boolean {
    return this.getPreviousCheckpoint() !== null
  }

  /**
   * Check if redo is possible.
   */
  canRedo(): boolean {
    return this.currentIndex < this.events.length
  }

  /**
   * Get events to redo (from current position to end or next checkpoint).
   */
  getRedoEvents(): GameEvent[] {
    if (!this.canRedo()) return []

    // Find next checkpoint or end of history
    const nextCheckpoint = this.getNextCheckpoint()
    const endIndex = nextCheckpoint?.eventIndex ?? this.events.length

    return this.events.slice(this.currentIndex, endIndex)
  }

  /**
   * Advance the current index after replaying events.
   */
  advanceIndex(count: number): void {
    this.currentIndex = Math.min(this.currentIndex + count, this.events.length)
  }

  /**
   * Get all recorded events.
   */
  getAllEvents(): GameEvent[] {
    return [...this.events]
  }

  /**
   * Get all checkpoints.
   */
  getAllCheckpoints(): Checkpoint[] {
    return [...this.checkpoints]
  }

  /**
   * Get current position in history.
   */
  getCurrentIndex(): number {
    return this.currentIndex
  }

  /**
   * Get total number of events.
   */
  getEventCount(): number {
    return this.events.length
  }

  /**
   * Clear all history.
   */
  clear(): void {
    this.events = []
    this.checkpoints = []
    this.currentIndex = 0
  }

  /**
   * Load history from a saved game.
   */
  loadFromSave(events: GameEvent[], checkpoints?: Checkpoint[]): void {
    this.events = [...events]
    this.checkpoints = checkpoints ? [...checkpoints] : []
    this.currentIndex = this.events.length
  }

  /**
   * Export history for saving.
   */
  export(): { events: GameEvent[]; checkpoints: Checkpoint[] } {
    return {
      events: [...this.events],
      checkpoints: [...this.checkpoints],
    }
  }
}

/**
 * Deep clone a game state for checkpointing.
 * This ensures the checkpoint is independent of future mutations.
 */
function deepCloneState(state: GameState): GameState {
  return {
    id: state.id,
    config: { ...state.config },
    phase: state.phase,
    players: {
      player1: {
        ...state.players.player1,
        deck: [...state.players.player1.deck],
      },
      player2: {
        ...state.players.player2,
        deck: [...state.players.player2.deck],
      },
    },
    battlefield: {
      player1FaceUp: state.battlefield.player1FaceUp,
      player2FaceUp: state.battlefield.player2FaceUp,
      player1FaceDown: [...state.battlefield.player1FaceDown],
      player2FaceDown: [...state.battlefield.player2FaceDown],
      warPile: [...state.battlefield.warPile],
    },
    currentRound: state.currentRound,
    warDepth: state.warDepth,
    rngState: state.rngState,
  }
}

/**
 * Create a new GameHistory instance.
 */
export function createGameHistory(): GameHistory {
  return new GameHistory()
}
