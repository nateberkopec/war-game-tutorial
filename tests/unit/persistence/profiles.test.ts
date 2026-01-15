import { describe, it, expect, beforeEach } from 'vitest'
import {
  ProfileManager,
  getProfileManager,
  resetProfileManager,
} from '../../../src/persistence/profiles'
import type { GameSummary } from '../../../src/persistence/types'

describe('ProfileManager', () => {
  let manager: ProfileManager

  beforeEach(() => {
    localStorage.clear()
    resetProfileManager()
    manager = new ProfileManager()
  })

  describe('createProfile', () => {
    it('creates a profile with generated UUID', () => {
      const profile = manager.createProfile('Alice')
      expect(profile.id).toMatch(/^[a-f0-9-]{36}$/)
      expect(profile.name).toBe('Alice')
    })

    it('trims whitespace from name', () => {
      const profile = manager.createProfile('  Bob  ')
      expect(profile.name).toBe('Bob')
    })

    it('initializes empty stats', () => {
      const profile = manager.createProfile('Alice')
      expect(profile.stats.gamesPlayed).toBe(0)
      expect(profile.stats.gamesWon).toBe(0)
      expect(profile.stats.winStreak).toBe(0)
    })

    it('initializes default preferences', () => {
      const profile = manager.createProfile('Alice')
      expect(profile.preferences.favoritePreset).toBe('classic')
    })

    it('sets createdAt timestamp', () => {
      const before = Date.now()
      const profile = manager.createProfile('Alice')
      const after = Date.now()
      expect(profile.createdAt).toBeGreaterThanOrEqual(before)
      expect(profile.createdAt).toBeLessThanOrEqual(after)
    })
  })

  describe('getProfile', () => {
    it('retrieves existing profile', () => {
      const created = manager.createProfile('Alice')
      const retrieved = manager.getProfile(created.id)
      expect(retrieved).toEqual(created)
    })

    it('returns null for non-existent profile', () => {
      expect(manager.getProfile('nonexistent-id')).toBeNull()
    })
  })

  describe('listProfiles', () => {
    it('returns empty array when no profiles', () => {
      expect(manager.listProfiles()).toEqual([])
    })

    it('returns all profiles', () => {
      manager.createProfile('Alice')
      manager.createProfile('Bob')
      manager.createProfile('Charlie')

      const profiles = manager.listProfiles()
      expect(profiles).toHaveLength(3)
      expect(profiles.map((p) => p.name).sort()).toEqual(['Alice', 'Bob', 'Charlie'])
    })
  })

  describe('updateProfile', () => {
    it('updates profile name', () => {
      const profile = manager.createProfile('Alice')
      const updated = manager.updateProfile(profile.id, { name: 'Alice Smith' })
      expect(updated?.name).toBe('Alice Smith')
    })

    it('merges stats updates', () => {
      const profile = manager.createProfile('Alice')
      // Record some games to set initial stats
      const game: GameSummary = {
        id: 'g1',
        playedAt: Date.now(),
        opponent: 'Bob',
        won: true,
        stats: {
          totalRounds: 10,
          warsCount: 1,
          longestWarChain: 1,
          largestWarPot: 4,
          duration: 5000,
          averageRoundTime: 500,
          player1RoundsWon: 6,
          player2RoundsWon: 4,
          biggestLead: { player: 'player1', amount: 3 },
        },
        config: 'classic',
      }
      for (let i = 0; i < 5; i++) {
        manager.recordGameResult(profile.id, { ...game, id: `g${i}`, won: i < 3 })
      }
      const updated = manager.getProfile(profile.id)
      expect(updated?.stats.gamesPlayed).toBe(5)
      expect(updated?.stats.gamesWon).toBe(3)
    })

    it('returns null for non-existent profile', () => {
      expect(manager.updateProfile('nonexistent', { name: 'New' })).toBeNull()
    })

    it('persists updates', () => {
      const profile = manager.createProfile('Alice')
      manager.updateProfile(profile.id, { name: 'Alice Updated' })
      const retrieved = manager.getProfile(profile.id)
      expect(retrieved?.name).toBe('Alice Updated')
    })
  })

  describe('deleteProfile', () => {
    it('removes profile and returns true', () => {
      const profile = manager.createProfile('Alice')
      expect(manager.deleteProfile(profile.id)).toBe(true)
      expect(manager.getProfile(profile.id)).toBeNull()
    })

    it('returns false for non-existent profile', () => {
      expect(manager.deleteProfile('nonexistent')).toBe(false)
    })
  })

  describe('hasProfile', () => {
    it('returns true for existing profile', () => {
      const profile = manager.createProfile('Alice')
      expect(manager.hasProfile(profile.id)).toBe(true)
    })

    it('returns false for non-existent profile', () => {
      expect(manager.hasProfile('nonexistent')).toBe(false)
    })
  })

  describe('getProfileCount', () => {
    it('returns correct count', () => {
      expect(manager.getProfileCount()).toBe(0)
      manager.createProfile('Alice')
      expect(manager.getProfileCount()).toBe(1)
      manager.createProfile('Bob')
      expect(manager.getProfileCount()).toBe(2)
    })
  })

  describe('findProfilesByName', () => {
    beforeEach(() => {
      manager.createProfile('Alice')
      manager.createProfile('Bob')
      manager.createProfile('Alice Smith')
    })

    it('finds profiles by partial name match', () => {
      const results = manager.findProfilesByName('alice')
      expect(results).toHaveLength(2)
    })

    it('is case-insensitive', () => {
      const results = manager.findProfilesByName('ALICE')
      expect(results).toHaveLength(2)
    })

    it('returns empty array for no matches', () => {
      expect(manager.findProfilesByName('Charlie')).toEqual([])
    })
  })

  describe('recordGameResult', () => {
    const gameSummary: GameSummary = {
      id: 'game-1',
      playedAt: Date.now(),
      opponent: 'Bob',
      won: true,
      stats: {
        totalRounds: 100,
        warsCount: 5,
        longestWarChain: 2,
        largestWarPot: 10,
        duration: 60000,
        averageRoundTime: 600,
        player1RoundsWon: 60,
        player2RoundsWon: 40,
        biggestLead: { player: 'player1', amount: 10 },
      },
      config: 'classic',
    }

    it('increments games played', () => {
      const profile = manager.createProfile('Alice')
      manager.recordGameResult(profile.id, gameSummary)
      const updated = manager.getProfile(profile.id)
      expect(updated?.stats.gamesPlayed).toBe(1)
    })

    it('increments games won on win', () => {
      const profile = manager.createProfile('Alice')
      manager.recordGameResult(profile.id, { ...gameSummary, won: true })
      const updated = manager.getProfile(profile.id)
      expect(updated?.stats.gamesWon).toBe(1)
      expect(updated?.stats.gamesLost).toBe(0)
    })

    it('increments games lost on loss', () => {
      const profile = manager.createProfile('Alice')
      manager.recordGameResult(profile.id, { ...gameSummary, won: false })
      const updated = manager.getProfile(profile.id)
      expect(updated?.stats.gamesWon).toBe(0)
      expect(updated?.stats.gamesLost).toBe(1)
    })

    it('tracks win streak', () => {
      const profile = manager.createProfile('Alice')
      manager.recordGameResult(profile.id, { ...gameSummary, won: true })
      manager.recordGameResult(profile.id, { ...gameSummary, won: true })
      manager.recordGameResult(profile.id, { ...gameSummary, won: true })
      const updated = manager.getProfile(profile.id)
      expect(updated?.stats.winStreak).toBe(3)
      expect(updated?.stats.bestWinStreak).toBe(3)
    })

    it('resets win streak on loss', () => {
      const profile = manager.createProfile('Alice')
      manager.recordGameResult(profile.id, { ...gameSummary, won: true })
      manager.recordGameResult(profile.id, { ...gameSummary, won: true })
      manager.recordGameResult(profile.id, { ...gameSummary, won: false })
      const updated = manager.getProfile(profile.id)
      expect(updated?.stats.winStreak).toBe(0)
      expect(updated?.stats.bestWinStreak).toBe(2)
    })

    it('tracks fastest win', () => {
      const profile = manager.createProfile('Alice')
      manager.recordGameResult(profile.id, {
        ...gameSummary,
        won: true,
        stats: { ...gameSummary.stats, duration: 30000 },
      })
      manager.recordGameResult(profile.id, {
        ...gameSummary,
        won: true,
        stats: { ...gameSummary.stats, duration: 20000 },
      })
      const updated = manager.getProfile(profile.id)
      expect(updated?.stats.fastestWin).toBe(20000)
    })

    it('adds game to recent games', () => {
      const profile = manager.createProfile('Alice')
      manager.recordGameResult(profile.id, gameSummary)
      const updated = manager.getProfile(profile.id)
      expect(updated?.recentGames).toHaveLength(1)
      expect(updated?.recentGames[0].id).toBe('game-1')
    })

    it('limits recent games to 20', () => {
      const profile = manager.createProfile('Alice')
      for (let i = 0; i < 25; i++) {
        manager.recordGameResult(profile.id, {
          ...gameSummary,
          id: `game-${i}`,
        })
      }
      const updated = manager.getProfile(profile.id)
      expect(updated?.recentGames).toHaveLength(20)
      expect(updated?.recentGames[0].id).toBe('game-24') // Most recent first
    })

    it('returns null for non-existent profile', () => {
      expect(manager.recordGameResult('nonexistent', gameSummary)).toBeNull()
    })
  })
})

describe('getProfileManager singleton', () => {
  beforeEach(() => {
    localStorage.clear()
    resetProfileManager()
  })

  it('returns same instance', () => {
    const manager1 = getProfileManager()
    const manager2 = getProfileManager()
    expect(manager1).toBe(manager2)
  })

  it('resetProfileManager creates new instance', () => {
    const manager1 = getProfileManager()
    manager1.createProfile('Alice')
    resetProfileManager()
    localStorage.clear()
    const manager2 = getProfileManager()
    expect(manager2.listProfiles()).toHaveLength(0)
  })
})
