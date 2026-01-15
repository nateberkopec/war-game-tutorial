/**
 * Persistence-specific types for War game
 *
 * Imports shared types from engine where possible, defines persistence-specific
 * types locally.
 */

// Re-export shared types from engine
export { type RulePreset, type PlayerId, type GameStats } from '../engine/types'

// Import for local use
import type { RulePreset, GameStats } from '../engine/types'

/** Minimal game config for persistence (full config in engine) */
export interface GameConfigSummary {
  preset: RulePreset
  deckCount?: number
  warFaceDownCards?: number
}

/** Summary of a completed game for profile history */
export interface GameSummary {
  id: string
  playedAt: number
  opponent: string
  opponentProfileId?: string
  won: boolean
  /** Game stats from engine - persistence only uses a subset of fields */
  stats: GameStats
  config: RulePreset
}

/** Lifetime stats tracked for a profile */
export interface ProfileStats {
  gamesPlayed: number
  gamesWon: number
  gamesLost: number
  winStreak: number
  bestWinStreak: number
  totalRoundsPlayed: number
  totalWarsWon: number
  totalWarsFought: number
  fastestWin: number | null
  longestGame: number | null
  biggestComeback: number
  mostWarsInGame: number
  longestWarChain: number
}

/** User preferences stored in profile */
export interface ProfilePreferences {
  favoritePreset: RulePreset
  customConfig?: GameConfigSummary
}

/** Full player profile persisted to storage */
export interface PlayerProfile {
  id: string
  name: string
  createdAt: number
  stats: ProfileStats
  recentGames: GameSummary[]
  preferences: ProfilePreferences
}

/** Global application settings */
export interface GlobalSettings {
  lastProfileId?: string
  soundEnabled: boolean
  animationSpeed: number
  theme?: string
}
