/**
 * Persistence-specific types for War game
 *
 * Note: Some types here mirror or extend types from src/engine/types.ts.
 * Once Agent 1 completes types.ts, we'll import shared types from there.
 * For now, we define what we need locally to avoid blocking.
 */

// Re-export engine types when available
// TODO: import { GameConfig, GameStats, GameEvent, PlayerId, RulePreset } from '../engine/types'

/** Rule preset names */
export type RulePreset = 'classic' | 'quick' | 'marathon' | 'chaos' | 'custom'

/** Minimal game config for persistence (full config in engine) */
export interface GameConfigSummary {
  preset: RulePreset
  deckCount?: number
  warFaceDownCards?: number
}

/** Stats tracked per-game */
export interface GameStats {
  totalRounds: number
  warsCount: number
  longestWarChain: number
  largestWarPot: number
  duration: number
  averageRoundTime: number
  player1RoundsWon: number
  player2RoundsWon: number
  biggestLead: { player: 'player1' | 'player2'; amount: number }
}

/** Summary of a completed game for profile history */
export interface GameSummary {
  id: string
  playedAt: number
  opponent: string
  opponentProfileId?: string
  won: boolean
  stats: GameStats
  config: RulePreset | 'custom'
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
