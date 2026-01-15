/**
 * War Game Persistence Module
 *
 * Public API for all persistence functionality:
 * - Storage: Low-level storage abstraction
 * - Profiles: Player profile management
 * - Stats: Statistics calculation utilities
 * - Settings: Global application settings
 */

// Storage
export {
  type StorageAdapter,
  type StorageCollection,
  buildKey,
  parseKey,
  LocalStorageAdapter,
  CollectionStorage,
  getDefaultAdapter,
  setDefaultAdapter,
  getCollection,
} from './storage'

// Types
export type {
  RulePreset,
  GameConfigSummary,
  GameStats,
  GameSummary,
  ProfileStats,
  ProfilePreferences,
  PlayerProfile,
  GlobalSettings,
} from './types'

// Profile Manager
export {
  ProfileManager,
  getProfileManager,
  resetProfileManager,
} from './profiles'

// Stats utilities
export {
  calculateWinRate,
  calculateAverageGameDuration,
  calculateAverageRoundsPerGame,
  calculateWarWinRate,
  formatDuration,
  detectComeback,
  calculateDerivedStats,
  mergeGameIntoStats,
  getRankTitle,
  type DerivedStats,
} from './stats'

// Settings Manager
export {
  SettingsManager,
  getSettingsManager,
  resetSettingsManager,
} from './settings'
