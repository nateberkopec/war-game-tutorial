/**
 * Profile Manager for War game
 *
 * Handles CRUD operations for player profiles stored in LocalStorage.
 * Profiles track lifetime stats, recent games, and preferences.
 */

import { getCollection, CollectionStorage } from './storage'
import type { PlayerProfile, ProfileStats, ProfilePreferences, GameSummary } from './types'

/** Generate a UUID v4 */
function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

/** Create empty stats for a new profile */
function createEmptyStats(): ProfileStats {
  return {
    gamesPlayed: 0,
    gamesWon: 0,
    gamesLost: 0,
    winStreak: 0,
    bestWinStreak: 0,
    totalRoundsPlayed: 0,
    totalWarsWon: 0,
    totalWarsFought: 0,
    fastestWin: null,
    longestGame: null,
    biggestComeback: 0,
    mostWarsInGame: 0,
    longestWarChain: 0,
  }
}

/** Create default preferences for a new profile */
function createDefaultPreferences(): ProfilePreferences {
  return {
    favoritePreset: 'classic',
  }
}

/** ProfileManager handles all profile operations */
export class ProfileManager {
  private storage: CollectionStorage<PlayerProfile>

  constructor() {
    this.storage = getCollection<PlayerProfile>('profiles')
  }

  /** Create a new profile with the given name */
  createProfile(name: string): PlayerProfile {
    const profile: PlayerProfile = {
      id: generateId(),
      name: name.trim(),
      createdAt: Date.now(),
      stats: createEmptyStats(),
      recentGames: [],
      preferences: createDefaultPreferences(),
    }
    this.storage.set(profile.id, profile)
    return profile
  }

  /** Get a profile by ID, returns null if not found */
  getProfile(id: string): PlayerProfile | null {
    return this.storage.get(id)
  }

  /** List all profiles */
  listProfiles(): PlayerProfile[] {
    return this.storage.list()
  }

  /** Update a profile with partial changes */
  updateProfile(id: string, updates: Partial<Omit<PlayerProfile, 'id' | 'createdAt'>>): PlayerProfile | null {
    const profile = this.storage.get(id)
    if (!profile) return null

    const updated: PlayerProfile = {
      ...profile,
      ...updates,
      // Merge nested objects properly
      stats: updates.stats ? { ...profile.stats, ...updates.stats } : profile.stats,
      preferences: updates.preferences
        ? { ...profile.preferences, ...updates.preferences }
        : profile.preferences,
    }

    this.storage.set(id, updated)
    return updated
  }

  /** Delete a profile */
  deleteProfile(id: string): boolean {
    return this.storage.delete(id)
  }

  /** Check if a profile exists */
  hasProfile(id: string): boolean {
    return this.storage.has(id)
  }

  /** Get profile count */
  getProfileCount(): number {
    return this.storage.listIds().length
  }

  /** Find profiles by name (case-insensitive partial match) */
  findProfilesByName(query: string): PlayerProfile[] {
    const loweredQuery = query.toLowerCase()
    return this.listProfiles().filter((p) => p.name.toLowerCase().includes(loweredQuery))
  }

  /**
   * Record a game result for a profile
   *
   * Updates lifetime stats and adds to recent games.
   * Keeps only the last 20 games in history.
   */
  recordGameResult(profileId: string, game: GameSummary): PlayerProfile | null {
    const profile = this.storage.get(profileId)
    if (!profile) return null

    // Update lifetime stats
    const stats = { ...profile.stats }
    stats.gamesPlayed++
    stats.totalRoundsPlayed += game.stats.totalRounds
    stats.totalWarsFought += game.stats.warsCount

    if (game.won) {
      stats.gamesWon++
      stats.winStreak++
      stats.bestWinStreak = Math.max(stats.bestWinStreak, stats.winStreak)

      // Track fastest win
      if (stats.fastestWin === null || game.stats.duration < stats.fastestWin) {
        stats.fastestWin = game.stats.duration
      }
    } else {
      stats.gamesLost++
      stats.winStreak = 0
    }

    // Track longest game
    if (stats.longestGame === null || game.stats.duration > stats.longestGame) {
      stats.longestGame = game.stats.duration
    }

    // Track war records
    if (game.stats.warsCount > stats.mostWarsInGame) {
      stats.mostWarsInGame = game.stats.warsCount
    }
    if (game.stats.longestWarChain > stats.longestWarChain) {
      stats.longestWarChain = game.stats.longestWarChain
    }

    // Add to recent games (keep last 20)
    const recentGames = [game, ...profile.recentGames].slice(0, 20)

    const updated: PlayerProfile = {
      ...profile,
      stats,
      recentGames,
    }

    this.storage.set(profileId, updated)
    return updated
  }
}

/** Singleton instance */
let profileManagerInstance: ProfileManager | null = null

export function getProfileManager(): ProfileManager {
  if (!profileManagerInstance) {
    profileManagerInstance = new ProfileManager()
  }
  return profileManagerInstance
}

/** For testing: reset the singleton */
export function resetProfileManager(): void {
  profileManagerInstance = null
}
