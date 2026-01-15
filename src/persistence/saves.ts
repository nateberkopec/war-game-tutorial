/**
 * Save Manager for War game
 *
 * Handles saving and loading game state to LocalStorage.
 * Works with the engine's SavedGame format.
 */

import { getCollection, CollectionStorage } from './storage'
import type { SavedGame } from '../engine/types'

/** Metadata for listing saves without loading full state */
export interface SaveMetadata {
  id: string
  savedAt: number
  player1Name: string
  player2Name: string
  currentRound: number
  player1Cards: number
  player2Cards: number
  /** Profile IDs if linked */
  profileIds: [string | undefined, string | undefined]
}

/** Extract metadata from a full save for listing */
function extractMetadata(save: SavedGame): SaveMetadata {
  return {
    id: save.id,
    savedAt: save.savedAt,
    player1Name: save.state.players.player1.name,
    player2Name: save.state.players.player2.name,
    currentRound: save.state.currentRound,
    player1Cards: save.state.players.player1.deck.length,
    player2Cards: save.state.players.player2.deck.length,
    profileIds: save.playerProfiles,
  }
}

/** SaveManager handles all save/load operations */
export class SaveManager {
  private storage: CollectionStorage<SavedGame>
  private autoSaveId = 'autosave'

  constructor() {
    this.storage = getCollection<SavedGame>('saves')
  }

  /** Save a game state */
  saveGame(save: SavedGame): void {
    this.storage.set(save.id, save)
  }

  /** Load a saved game by ID */
  loadGame(id: string): SavedGame | null {
    return this.storage.get(id)
  }

  /** List all saves with metadata only */
  listSaves(): SaveMetadata[] {
    const saves = this.storage.list()
    return saves
      .map(extractMetadata)
      .sort((a, b) => b.savedAt - a.savedAt) // Most recent first
  }

  /** Delete a saved game */
  deleteSave(id: string): boolean {
    return this.storage.delete(id)
  }

  /** Check if a save exists */
  hasSave(id: string): boolean {
    return this.storage.has(id)
  }

  /** Get save count */
  getSaveCount(): number {
    return this.storage.listIds().length
  }

  // Auto-save functionality

  /** Save as auto-save (overwrites previous auto-save) */
  autoSave(save: SavedGame): void {
    const autoSave: SavedGame = {
      ...save,
      id: this.autoSaveId,
    }
    this.storage.set(this.autoSaveId, autoSave)
  }

  /** Load the auto-save if it exists */
  loadAutoSave(): SavedGame | null {
    return this.storage.get(this.autoSaveId)
  }

  /** Check if an auto-save exists */
  hasAutoSave(): boolean {
    return this.storage.has(this.autoSaveId)
  }

  /** Clear the auto-save */
  clearAutoSave(): boolean {
    return this.storage.delete(this.autoSaveId)
  }

  /** List saves excluding auto-save */
  listManualSaves(): SaveMetadata[] {
    return this.listSaves().filter((s) => s.id !== this.autoSaveId)
  }

  /** Find saves by profile ID */
  findSavesByProfile(profileId: string): SaveMetadata[] {
    return this.listSaves().filter(
      (s) => s.profileIds[0] === profileId || s.profileIds[1] === profileId
    )
  }

  /** Delete all saves for a profile (useful when deleting profile) */
  deleteSavesByProfile(profileId: string): number {
    const saves = this.findSavesByProfile(profileId)
    let deleted = 0
    for (const save of saves) {
      if (this.deleteSave(save.id)) {
        deleted++
      }
    }
    return deleted
  }

  /** Clear all saves */
  clearAllSaves(): void {
    this.storage.clear()
  }
}

/** Singleton instance */
let saveManagerInstance: SaveManager | null = null

export function getSaveManager(): SaveManager {
  if (!saveManagerInstance) {
    saveManagerInstance = new SaveManager()
  }
  return saveManagerInstance
}

/** For testing: reset the singleton */
export function resetSaveManager(): void {
  saveManagerInstance = null
}
