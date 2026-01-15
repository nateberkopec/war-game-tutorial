/**
 * Data Validation for War game
 *
 * Validates loaded data to detect corruption and ensure type safety.
 * Provides graceful handling of invalid data.
 */

import type { SavedGame, Replay } from '../engine/types'
import type { PlayerProfile, GlobalSettings } from './types'

/** Validation result */
export interface ValidationResult {
  valid: boolean
  errors: string[]
}

/** Create a successful validation result */
function valid(): ValidationResult {
  return { valid: true, errors: [] }
}

/** Create a failed validation result */
function invalid(...errors: string[]): ValidationResult {
  return { valid: false, errors }
}



// =============================================================================
// Type Guards
// =============================================================================

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isString(value: unknown): value is string {
  return typeof value === 'string'
}

function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value)
}

function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean'
}

function isArray(value: unknown): value is unknown[] {
  return Array.isArray(value)
}

// =============================================================================
// Profile Validation
// =============================================================================

export function validateProfile(data: unknown): ValidationResult {
  if (!isObject(data)) {
    return invalid('Profile must be an object')
  }

  const errors: string[] = []

  if (!isString(data.id)) errors.push('Profile id must be a string')
  if (!isString(data.name)) errors.push('Profile name must be a string')
  if (!isNumber(data.createdAt)) errors.push('Profile createdAt must be a number')

  if (!isObject(data.stats)) {
    errors.push('Profile stats must be an object')
  } else {
    const statsErrors = validateProfileStats(data.stats)
    errors.push(...statsErrors.errors)
  }

  if (!isArray(data.recentGames)) {
    errors.push('Profile recentGames must be an array')
  }

  if (!isObject(data.preferences)) {
    errors.push('Profile preferences must be an object')
  }

  return errors.length === 0 ? valid() : invalid(...errors)
}

function validateProfileStats(data: unknown): ValidationResult {
  if (!isObject(data)) {
    return invalid('Stats must be an object')
  }

  const errors: string[] = []
  const requiredNumbers = [
    'gamesPlayed',
    'gamesWon',
    'gamesLost',
    'winStreak',
    'bestWinStreak',
    'totalRoundsPlayed',
    'totalWarsWon',
    'totalWarsFought',
    'biggestComeback',
    'mostWarsInGame',
    'longestWarChain',
  ]

  for (const field of requiredNumbers) {
    if (!isNumber(data[field])) {
      errors.push(`Stats.${field} must be a number`)
    }
  }

  // fastestWin and longestGame can be null
  if (data.fastestWin !== null && !isNumber(data.fastestWin)) {
    errors.push('Stats.fastestWin must be a number or null')
  }
  if (data.longestGame !== null && !isNumber(data.longestGame)) {
    errors.push('Stats.longestGame must be a number or null')
  }

  return errors.length === 0 ? valid() : invalid(...errors)
}

// =============================================================================
// SavedGame Validation
// =============================================================================

export function validateSavedGame(data: unknown): ValidationResult {
  if (!isObject(data)) {
    return invalid('SavedGame must be an object')
  }

  const errors: string[] = []

  if (!isString(data.id)) errors.push('SavedGame id must be a string')
  if (!isNumber(data.savedAt)) errors.push('SavedGame savedAt must be a number')

  if (!isObject(data.state)) {
    errors.push('SavedGame state must be an object')
  } else {
    const stateErrors = validateGameState(data.state)
    errors.push(...stateErrors.errors)
  }

  if (!isArray(data.history)) {
    errors.push('SavedGame history must be an array')
  }

  if (!isArray(data.playerProfiles) || data.playerProfiles.length !== 2) {
    errors.push('SavedGame playerProfiles must be an array of 2 elements')
  }

  return errors.length === 0 ? valid() : invalid(...errors)
}

function validateGameState(data: unknown): ValidationResult {
  if (!isObject(data)) {
    return invalid('GameState must be an object')
  }

  const errors: string[] = []

  if (!isString(data.id)) errors.push('GameState id must be a string')
  if (!isObject(data.config)) errors.push('GameState config must be an object')
  if (!isString(data.phase)) errors.push('GameState phase must be a string')
  if (!isObject(data.players)) errors.push('GameState players must be an object')
  if (!isObject(data.battlefield)) errors.push('GameState battlefield must be an object')
  if (!isNumber(data.currentRound)) errors.push('GameState currentRound must be a number')
  if (!isNumber(data.warDepth)) errors.push('GameState warDepth must be a number')
  if (!isString(data.rngState)) errors.push('GameState rngState must be a string')

  return errors.length === 0 ? valid() : invalid(...errors)
}

// =============================================================================
// Replay Validation
// =============================================================================

export function validateReplay(data: unknown): ValidationResult {
  if (!isObject(data)) {
    return invalid('Replay must be an object')
  }

  const errors: string[] = []

  if (!isString(data.id)) errors.push('Replay id must be a string')
  if (!isNumber(data.createdAt)) errors.push('Replay createdAt must be a number')
  if (!isObject(data.config)) errors.push('Replay config must be an object')
  if (!isString(data.seed)) errors.push('Replay seed must be a string')
  if (!isArray(data.players) || data.players.length !== 2) {
    errors.push('Replay players must be an array of 2 elements')
  }
  if (!isArray(data.events)) errors.push('Replay events must be an array')
  if (!isObject(data.stats)) errors.push('Replay stats must be an object')
  if (!isNumber(data.duration)) errors.push('Replay duration must be a number')

  return errors.length === 0 ? valid() : invalid(...errors)
}

// =============================================================================
// Settings Validation
// =============================================================================

export function validateSettings(data: unknown): ValidationResult {
  if (!isObject(data)) {
    return invalid('Settings must be an object')
  }

  const errors: string[] = []

  // lastProfileId is optional
  if (data.lastProfileId !== undefined && !isString(data.lastProfileId)) {
    errors.push('Settings.lastProfileId must be a string or undefined')
  }

  if (!isBoolean(data.soundEnabled)) {
    errors.push('Settings.soundEnabled must be a boolean')
  }

  if (!isNumber(data.animationSpeed)) {
    errors.push('Settings.animationSpeed must be a number')
  }

  // theme is optional
  if (data.theme !== undefined && !isString(data.theme)) {
    errors.push('Settings.theme must be a string or undefined')
  }

  return errors.length === 0 ? valid() : invalid(...errors)
}

// =============================================================================
// Safe Loading Utilities
// =============================================================================

/**
 * Safely load and validate a profile
 *
 * Returns null if data is invalid or corrupt.
 */
export function safeLoadProfile(data: unknown): PlayerProfile | null {
  const result = validateProfile(data)
  if (!result.valid) {
    console.warn('Invalid profile data:', result.errors)
    return null
  }
  return data as PlayerProfile
}

/**
 * Safely load and validate a saved game
 */
export function safeLoadSavedGame(data: unknown): SavedGame | null {
  const result = validateSavedGame(data)
  if (!result.valid) {
    console.warn('Invalid saved game data:', result.errors)
    return null
  }
  return data as SavedGame
}

/**
 * Safely load and validate a replay
 */
export function safeLoadReplay(data: unknown): Replay | null {
  const result = validateReplay(data)
  if (!result.valid) {
    console.warn('Invalid replay data:', result.errors)
    return null
  }
  return data as Replay
}

/**
 * Safely load and validate settings
 */
export function safeLoadSettings(data: unknown): GlobalSettings | null {
  const result = validateSettings(data)
  if (!result.valid) {
    console.warn('Invalid settings data:', result.errors)
    return null
  }
  return data as GlobalSettings
}

/**
 * Attempt to repair corrupted profile data
 *
 * Returns a valid profile with default values for missing/invalid fields,
 * or null if repair is not possible.
 */
export function repairProfile(data: unknown): PlayerProfile | null {
  if (!isObject(data)) return null

  // Must have at least id and name
  if (!isString(data.id) || !isString(data.name)) return null

  const defaultStats = {
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

  const defaultPreferences = {
    favoritePreset: 'classic' as const,
  }

  return {
    id: data.id,
    name: data.name,
    createdAt: isNumber(data.createdAt) ? data.createdAt : Date.now(),
    stats: isObject(data.stats) ? { ...defaultStats, ...data.stats } : defaultStats,
    recentGames: isArray(data.recentGames) ? (data.recentGames as []) : [],
    preferences: isObject(data.preferences)
      ? { ...defaultPreferences, ...data.preferences }
      : defaultPreferences,
  } as PlayerProfile
}
