/**
 * Data Migration for War game
 *
 * Handles versioning of stored data and migration between versions.
 * Ensures backward compatibility when data format changes.
 */

import { getCollection, CollectionStorage, getDefaultAdapter } from './storage'

/** Current data schema version */
export const CURRENT_VERSION = 1

/** Version metadata stored in settings */
interface VersionInfo {
  version: number
  migratedAt: number
}

/** Base interface for versioned data */
interface Versioned {
  _version?: number
}

/** Migration function type */
type MigrationFn<T> = (data: T) => T

/** Registry of migrations per collection */
interface MigrationRegistry<T> {
  [fromVersion: number]: MigrationFn<T>
}

/**
 * MigrationManager handles data versioning and migrations
 *
 * When the data format changes:
 * 1. Increment CURRENT_VERSION
 * 2. Add a migration function for the previous version
 * 3. Call runMigrations() on app startup
 */
export class MigrationManager {
  private versionStorage: CollectionStorage<VersionInfo>

  constructor() {
    this.versionStorage = getCollection<VersionInfo>('settings')
  }

  /** Get the stored schema version */
  getStoredVersion(): number {
    const info = this.versionStorage.get('_version')
    return info?.version ?? 0
  }

  /** Update the stored schema version */
  setStoredVersion(version: number): void {
    this.versionStorage.set('_version', {
      version,
      migratedAt: Date.now(),
    })
  }

  /** Check if migration is needed */
  needsMigration(): boolean {
    return this.getStoredVersion() < CURRENT_VERSION
  }

  /**
   * Run all pending migrations
   *
   * Call this on app startup to ensure data is up-to-date.
   */
  runMigrations(): MigrationResult {
    const fromVersion = this.getStoredVersion()
    const result: MigrationResult = {
      fromVersion,
      toVersion: CURRENT_VERSION,
      migratedCollections: [],
      errors: [],
    }

    if (!this.needsMigration()) {
      return result
    }

    // Run migrations for each collection
    try {
      this.migrateCollection('profiles', profileMigrations, result)
      this.migrateCollection('saves', saveMigrations, result)
      this.migrateCollection('replays', replayMigrations, result)
      this.migrateCollection('settings', settingsMigrations, result)

      // Update stored version if no errors
      if (result.errors.length === 0) {
        this.setStoredVersion(CURRENT_VERSION)
      }
    } catch (error) {
      result.errors.push({
        collection: 'unknown',
        message: error instanceof Error ? error.message : String(error),
      })
    }

    return result
  }

  /** Migrate a single collection */
  private migrateCollection<T extends Versioned>(
    collectionName: string,
    migrations: MigrationRegistry<T>,
    result: MigrationResult
  ): void {
    const adapter = getDefaultAdapter()
    const prefix = `war-game/${collectionName}/`
    const keys = adapter.keys(prefix)

    let migrated = 0

    for (const key of keys) {
      try {
        const data = adapter.get<T>(key)
        if (!data) continue

        const dataVersion = data._version ?? 0
        let current = data

        // Apply migrations sequentially
        for (let v = dataVersion; v < CURRENT_VERSION; v++) {
          const migration = migrations[v]
          if (migration) {
            current = migration(current)
          }
        }

        // Mark with current version and save
        current._version = CURRENT_VERSION
        adapter.set(key, current)
        migrated++
      } catch (error) {
        result.errors.push({
          collection: collectionName,
          key,
          message: error instanceof Error ? error.message : String(error),
        })
      }
    }

    if (migrated > 0) {
      result.migratedCollections.push({
        name: collectionName,
        count: migrated,
      })
    }
  }
}

/** Result of a migration run */
export interface MigrationResult {
  fromVersion: number
  toVersion: number
  migratedCollections: Array<{ name: string; count: number }>
  errors: Array<{ collection: string; key?: string; message: string }>
}

// =============================================================================
// Collection-specific migrations
// =============================================================================

/**
 * Profile migrations
 *
 * Version 0 -> 1: Initial format, no changes needed
 */
const profileMigrations: MigrationRegistry<Versioned> = {
  // Example for future migrations:
  // 0: (data) => {
  //   // Transform from v0 to v1 format
  //   return { ...data, newField: defaultValue }
  // },
}

/**
 * Save migrations
 */
const saveMigrations: MigrationRegistry<Versioned> = {
  // No migrations yet
}

/**
 * Replay migrations
 */
const replayMigrations: MigrationRegistry<Versioned> = {
  // No migrations yet
}

/**
 * Settings migrations
 */
const settingsMigrations: MigrationRegistry<Versioned> = {
  // No migrations yet
}

// =============================================================================
// Utility functions
// =============================================================================

/**
 * Add version to data if not present
 *
 * Use when saving new data to ensure it has a version.
 */
export function addVersion<T extends object>(data: T): T & Versioned {
  return {
    ...data,
    _version: CURRENT_VERSION,
  }
}

/**
 * Check if data needs migration
 */
export function dataNeedsMigration(data: Versioned): boolean {
  return (data._version ?? 0) < CURRENT_VERSION
}

/** Singleton instance */
let migrationManagerInstance: MigrationManager | null = null

export function getMigrationManager(): MigrationManager {
  if (!migrationManagerInstance) {
    migrationManagerInstance = new MigrationManager()
  }
  return migrationManagerInstance
}

/** For testing: reset the singleton */
export function resetMigrationManager(): void {
  migrationManagerInstance = null
}
