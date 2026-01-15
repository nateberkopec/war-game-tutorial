/**
 * War Game Persistence Module
 *
 * Public API for all persistence functionality:
 * - Storage: Low-level storage abstraction
 * - Profiles: Player profile management
 * - Stats: Statistics calculation utilities
 * - Settings: Global application settings
 * - Saves: Game save/load management
 * - Replays: Replay storage and retrieval
 * - Migration: Data versioning and migration
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

// Types (includes re-exports from engine/types)
export type {
  // Re-exported from engine
  RulePreset,
  PlayerId,
  GameStats,
  // Persistence-specific types
  GameConfigSummary,
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

// Save Manager
export {
  SaveManager,
  getSaveManager,
  resetSaveManager,
  type SaveMetadata,
} from './saves'

// Replay Manager
export {
  ReplayManager,
  getReplayManager,
  resetReplayManager,
  type ReplayMetadata,
} from './replays'

// Migration
export {
  MigrationManager,
  getMigrationManager,
  resetMigrationManager,
  CURRENT_VERSION,
  addVersion,
  dataNeedsMigration,
  type MigrationResult,
} from './migration'
