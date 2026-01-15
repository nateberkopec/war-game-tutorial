/**
 * Global Settings Storage for War game
 *
 * Manages application-wide settings stored in LocalStorage.
 * Settings persist across sessions and include user preferences.
 */

import { getCollection, CollectionStorage } from './storage'
import type { GlobalSettings } from './types'

/** Default settings for new installations */
const DEFAULT_SETTINGS: GlobalSettings = {
  lastProfileId: undefined,
  soundEnabled: true,
  animationSpeed: 1.0,
  theme: undefined,
}

/** Settings storage key (single record) */
const SETTINGS_KEY = 'global'

/** SettingsManager handles global application settings */
export class SettingsManager {
  private storage: CollectionStorage<GlobalSettings>

  constructor() {
    this.storage = getCollection<GlobalSettings>('settings')
  }

  /** Get current settings, returns defaults if none saved */
  getSettings(): GlobalSettings {
    const saved = this.storage.get(SETTINGS_KEY)
    if (!saved) {
      return { ...DEFAULT_SETTINGS }
    }
    // Merge with defaults to handle new fields added in updates
    return { ...DEFAULT_SETTINGS, ...saved }
  }

  /** Update settings with partial changes */
  updateSettings(updates: Partial<GlobalSettings>): GlobalSettings {
    const current = this.getSettings()
    const updated = { ...current, ...updates }
    this.storage.set(SETTINGS_KEY, updated)
    return updated
  }

  /** Reset all settings to defaults */
  resetSettings(): GlobalSettings {
    this.storage.set(SETTINGS_KEY, DEFAULT_SETTINGS)
    return { ...DEFAULT_SETTINGS }
  }

  /** Get the last used profile ID */
  getLastProfileId(): string | undefined {
    return this.getSettings().lastProfileId
  }

  /** Set the last used profile ID */
  setLastProfileId(profileId: string | undefined): void {
    this.updateSettings({ lastProfileId: profileId })
  }

  /** Check if sound is enabled */
  isSoundEnabled(): boolean {
    return this.getSettings().soundEnabled
  }

  /** Toggle sound on/off */
  toggleSound(): boolean {
    const current = this.isSoundEnabled()
    this.updateSettings({ soundEnabled: !current })
    return !current
  }

  /** Get animation speed multiplier */
  getAnimationSpeed(): number {
    return this.getSettings().animationSpeed
  }

  /** Set animation speed (0.5 = slow, 1.0 = normal, 2.0 = fast) */
  setAnimationSpeed(speed: number): void {
    // Clamp to valid range
    const clamped = Math.max(0.25, Math.min(4.0, speed))
    this.updateSettings({ animationSpeed: clamped })
  }

  /** Get current theme */
  getTheme(): string | undefined {
    return this.getSettings().theme
  }

  /** Set theme */
  setTheme(theme: string | undefined): void {
    this.updateSettings({ theme })
  }
}

/** Singleton instance */
let settingsManagerInstance: SettingsManager | null = null

export function getSettingsManager(): SettingsManager {
  if (!settingsManagerInstance) {
    settingsManagerInstance = new SettingsManager()
  }
  return settingsManagerInstance
}

/** For testing: reset the singleton */
export function resetSettingsManager(): void {
  settingsManagerInstance = null
}
