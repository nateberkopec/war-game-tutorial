/**
 * LocalStorage Quota Handling for War game
 *
 * Handles storage quota detection, graceful degradation, and cleanup utilities.
 * LocalStorage typically has a 5-10MB limit depending on the browser.
 */

import { getDefaultAdapter } from './storage'
import { getSaveManager } from './saves'
import { getReplayManager } from './replays'

/** Typical LocalStorage quota (conservative estimate) */
const ESTIMATED_QUOTA_BYTES = 5 * 1024 * 1024 // 5MB

/** Warning threshold - start warning when 80% full */
const WARNING_THRESHOLD = 0.8

/** Error thrown when storage quota is exceeded */
export class StorageQuotaError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'StorageQuotaError'
  }
}

/** Storage usage information */
export interface StorageUsage {
  /** Estimated bytes used by war-game data */
  usedBytes: number
  /** Estimated total quota */
  quotaBytes: number
  /** Usage as percentage (0-100) */
  usagePercent: number
  /** True if approaching quota limit */
  isNearQuota: boolean
  /** Breakdown by collection */
  byCollection: {
    profiles: number
    saves: number
    replays: number
    settings: number
  }
}

/**
 * Estimate storage usage for war-game data
 *
 * Note: This is an approximation since we can't get exact localStorage size.
 */
export function getStorageUsage(): StorageUsage {
  const adapter = getDefaultAdapter()
  const prefix = 'war-game/'

  let totalBytes = 0
  const byCollection = {
    profiles: 0,
    saves: 0,
    replays: 0,
    settings: 0,
  }

  // Get all war-game keys and measure their size
  const keys = adapter.keys(prefix)

  for (const key of keys) {
    try {
      const value = localStorage.getItem(key)
      if (value) {
        const size = key.length + value.length
        totalBytes += size * 2 // UTF-16 encoding = 2 bytes per char

        // Categorize by collection
        if (key.includes('/profiles/')) {
          byCollection.profiles += size * 2
        } else if (key.includes('/saves/')) {
          byCollection.saves += size * 2
        } else if (key.includes('/replays/')) {
          byCollection.replays += size * 2
        } else if (key.includes('/settings/')) {
          byCollection.settings += size * 2
        }
      }
    } catch {
      // Ignore read errors
    }
  }

  const usagePercent = Math.round((totalBytes / ESTIMATED_QUOTA_BYTES) * 100)

  return {
    usedBytes: totalBytes,
    quotaBytes: ESTIMATED_QUOTA_BYTES,
    usagePercent,
    isNearQuota: totalBytes / ESTIMATED_QUOTA_BYTES >= WARNING_THRESHOLD,
    byCollection,
  }
}

/**
 * Format bytes to human-readable string
 */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

/**
 * Try to write to storage, catching quota errors
 *
 * Returns true if write succeeded, false if quota exceeded.
 */
export function tryWrite(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value)
    return true
  } catch (error) {
    if (isQuotaError(error)) {
      return false
    }
    throw error
  }
}

/**
 * Check if an error is a quota exceeded error
 */
export function isQuotaError(error: unknown): boolean {
  if (error instanceof DOMException) {
    // Different browsers use different error names/codes
    return (
      error.name === 'QuotaExceededError' ||
      error.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
      error.code === 22 // Legacy quota exceeded code
    )
  }
  return false
}

/** Cleanup suggestion for user */
export interface CleanupSuggestion {
  type: 'saves' | 'replays'
  count: number
  estimatedBytes: number
  description: string
}

/**
 * Get suggestions for freeing up storage space
 */
export function getCleanupSuggestions(): CleanupSuggestion[] {
  const suggestions: CleanupSuggestion[] = []
  const usage = getStorageUsage()

  // Suggest deleting old saves if they're taking significant space
  if (usage.byCollection.saves > 100 * 1024) {
    // > 100KB
    const saveManager = getSaveManager()
    const saves = saveManager.listManualSaves()
    if (saves.length > 3) {
      const oldSaves = saves.slice(3) // Keep 3 most recent
      suggestions.push({
        type: 'saves',
        count: oldSaves.length,
        estimatedBytes: Math.round(usage.byCollection.saves * 0.6),
        description: `Delete ${oldSaves.length} old saved games`,
      })
    }
  }

  // Suggest deleting old replays
  if (usage.byCollection.replays > 200 * 1024) {
    // > 200KB
    const replayManager = getReplayManager()
    const replays = replayManager.listReplays()
    if (replays.length > 10) {
      const oldReplays = replays.slice(10) // Keep 10 most recent
      suggestions.push({
        type: 'replays',
        count: oldReplays.length,
        estimatedBytes: Math.round(usage.byCollection.replays * 0.5),
        description: `Delete ${oldReplays.length} old replays`,
      })
    }
  }

  return suggestions
}

/**
 * Execute a cleanup suggestion
 */
export function executeCleanup(suggestion: CleanupSuggestion): number {
  let deleted = 0

  if (suggestion.type === 'saves') {
    const saveManager = getSaveManager()
    const saves = saveManager.listManualSaves()
    const toDelete = saves.slice(3) // Keep 3 most recent
    for (const save of toDelete) {
      if (saveManager.deleteSave(save.id)) {
        deleted++
      }
    }
  } else if (suggestion.type === 'replays') {
    const replayManager = getReplayManager()
    const replays = replayManager.listReplays()
    const toDelete = replays.slice(10) // Keep 10 most recent
    for (const replay of toDelete) {
      if (replayManager.deleteReplay(replay.id)) {
        deleted++
      }
    }
  }

  return deleted
}

/**
 * Clear all war-game data from storage
 *
 * Use as last resort when quota is critically exceeded.
 */
export function clearAllData(): void {
  const adapter = getDefaultAdapter()
  adapter.clear('war-game/')
}

/**
 * Check storage health and return status
 */
export interface StorageHealth {
  status: 'healthy' | 'warning' | 'critical'
  message: string
  usage: StorageUsage
  suggestions: CleanupSuggestion[]
}

export function checkStorageHealth(): StorageHealth {
  const usage = getStorageUsage()
  const suggestions = getCleanupSuggestions()

  if (usage.usagePercent >= 95) {
    return {
      status: 'critical',
      message: 'Storage is almost full. Please delete old saves or replays.',
      usage,
      suggestions,
    }
  }

  if (usage.isNearQuota) {
    return {
      status: 'warning',
      message: 'Storage is getting full. Consider deleting old data.',
      usage,
      suggestions,
    }
  }

  return {
    status: 'healthy',
    message: 'Storage usage is normal.',
    usage,
    suggestions: [],
  }
}
