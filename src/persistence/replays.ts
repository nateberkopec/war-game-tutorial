/**
 * Replay Storage for War game
 *
 * Handles storing and retrieving game replays in LocalStorage.
 * Replays contain enough information to reconstruct and replay a game.
 */

import { getCollection, CollectionStorage } from './storage'
import type { Replay } from '../engine/types'

/** Metadata for listing replays without loading full event history */
export interface ReplayMetadata {
  id: string
  createdAt: number
  player1Name: string
  player2Name: string
  /** Winner name */
  winner: string
  totalRounds: number
  warsCount: number
  duration: number
  /** Profile IDs if linked */
  profileIds: [string | undefined, string | undefined]
}

/** Extract metadata from a full replay for listing */
function extractMetadata(replay: Replay): ReplayMetadata {
  // Determine winner from stats
  const player1Won = replay.stats.player1RoundsWon > replay.stats.player2RoundsWon
  const winner = player1Won ? replay.players[0].name : replay.players[1].name

  return {
    id: replay.id,
    createdAt: replay.createdAt,
    player1Name: replay.players[0].name,
    player2Name: replay.players[1].name,
    winner,
    totalRounds: replay.stats.totalRounds,
    warsCount: replay.stats.warsCount,
    duration: replay.duration,
    profileIds: [replay.players[0].profileId, replay.players[1].profileId],
  }
}

/** Maximum replays to keep (oldest are auto-deleted) */
const MAX_REPLAYS = 50

/** ReplayManager handles all replay storage operations */
export class ReplayManager {
  private storage: CollectionStorage<Replay>

  constructor() {
    this.storage = getCollection<Replay>('replays')
  }

  /** Save a replay, enforcing max limit */
  saveReplay(replay: Replay): void {
    this.storage.set(replay.id, replay)
    this.enforceLimit()
  }

  /** Load a replay by ID */
  loadReplay(id: string): Replay | null {
    return this.storage.get(id)
  }

  /** List all replays with metadata only */
  listReplays(): ReplayMetadata[] {
    const replays = this.storage.list()
    return replays
      .map(extractMetadata)
      .sort((a, b) => b.createdAt - a.createdAt) // Most recent first
  }

  /** Delete a replay */
  deleteReplay(id: string): boolean {
    return this.storage.delete(id)
  }

  /** Check if a replay exists */
  hasReplay(id: string): boolean {
    return this.storage.has(id)
  }

  /** Get replay count */
  getReplayCount(): number {
    return this.storage.listIds().length
  }

  /** Find replays by profile ID */
  findReplaysByProfile(profileId: string): ReplayMetadata[] {
    return this.listReplays().filter(
      (r) => r.profileIds[0] === profileId || r.profileIds[1] === profileId
    )
  }

  /** Delete all replays for a profile */
  deleteReplaysByProfile(profileId: string): number {
    const replays = this.findReplaysByProfile(profileId)
    let deleted = 0
    for (const replay of replays) {
      if (this.deleteReplay(replay.id)) {
        deleted++
      }
    }
    return deleted
  }

  /** Find replays with a specific player matchup */
  findReplaysByMatchup(profile1Id: string, profile2Id: string): ReplayMetadata[] {
    return this.listReplays().filter(
      (r) =>
        (r.profileIds[0] === profile1Id && r.profileIds[1] === profile2Id) ||
        (r.profileIds[0] === profile2Id && r.profileIds[1] === profile1Id)
    )
  }

  /** Get replays sorted by duration (shortest first) */
  getShortestReplays(limit = 10): ReplayMetadata[] {
    return this.listReplays()
      .sort((a, b) => a.duration - b.duration)
      .slice(0, limit)
  }

  /** Get replays sorted by wars count (most first) */
  getMostExcitingReplays(limit = 10): ReplayMetadata[] {
    return this.listReplays()
      .sort((a, b) => b.warsCount - a.warsCount)
      .slice(0, limit)
  }

  /** Clear all replays */
  clearAllReplays(): void {
    this.storage.clear()
  }

  /** Enforce max replay limit by deleting oldest */
  private enforceLimit(): void {
    const replays = this.listReplays()
    if (replays.length > MAX_REPLAYS) {
      // Delete oldest replays (list is sorted newest first)
      const toDelete = replays.slice(MAX_REPLAYS)
      for (const replay of toDelete) {
        this.deleteReplay(replay.id)
      }
    }
  }
}

/** Singleton instance */
let replayManagerInstance: ReplayManager | null = null

export function getReplayManager(): ReplayManager {
  if (!replayManagerInstance) {
    replayManagerInstance = new ReplayManager()
  }
  return replayManagerInstance
}

/** For testing: reset the singleton */
export function resetReplayManager(): void {
  replayManagerInstance = null
}
