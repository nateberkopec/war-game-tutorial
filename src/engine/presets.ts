/**
 * Game configuration presets for different play styles.
 */

import type { GameConfig, RulePreset } from './types'

/**
 * Classic War rules - standard gameplay.
 * - Single deck, split evenly
 * - Ace high
 * - 1 face-down card in war
 * - Play until elimination
 */
export const CLASSIC_CONFIG: GameConfig = {
  deckCount: 1,
  cardsPerPlayer: 'all',
  aceHigh: true,
  suitsRank: false,
  warFaceDownCards: 1,
  insufficientCardsRule: 'lose',
  winCondition: { type: 'elimination' },
  shuffleWonCards: false,
  wonCardsPosition: 'bottom',
}

/**
 * Quick game - shorter matches.
 * - Single deck
 * - First to 30 cards wins
 * - 1 face-down card in war
 */
export const QUICK_CONFIG: GameConfig = {
  deckCount: 1,
  cardsPerPlayer: 'all',
  aceHigh: true,
  suitsRank: false,
  warFaceDownCards: 1,
  insufficientCardsRule: 'lose',
  winCondition: { type: 'firstTo', count: 30 },
  shuffleWonCards: false,
  wonCardsPosition: 'bottom',
}

/**
 * Marathon game - longer matches with more war cards.
 * - Double deck (104 cards)
 * - 3 face-down cards in war
 * - Play until elimination
 */
export const MARATHON_CONFIG: GameConfig = {
  deckCount: 2,
  cardsPerPlayer: 'all',
  aceHigh: true,
  suitsRank: false,
  warFaceDownCards: 3,
  insufficientCardsRule: 'lose',
  winCondition: { type: 'elimination' },
  shuffleWonCards: false,
  wonCardsPosition: 'bottom',
}

/**
 * Chaos mode - unpredictable and wild.
 * - Double deck (104 cards)
 * - 5 face-down cards in war (high stakes!)
 * - Won cards are shuffled before adding
 * - Split pot on insufficient cards (keeps game going)
 */
export const CHAOS_CONFIG: GameConfig = {
  deckCount: 2,
  cardsPerPlayer: 'all',
  aceHigh: true,
  suitsRank: false,
  warFaceDownCards: 5,
  insufficientCardsRule: 'splitPot',
  winCondition: { type: 'elimination' },
  shuffleWonCards: true,
  wonCardsPosition: 'random',
}

/**
 * Map of preset names to configurations.
 */
export const PRESETS: Record<Exclude<RulePreset, 'custom'>, GameConfig> = {
  classic: CLASSIC_CONFIG,
  quick: QUICK_CONFIG,
  marathon: MARATHON_CONFIG,
  chaos: CHAOS_CONFIG,
}

/**
 * Get a preset configuration by name.
 * @param preset - Preset name
 * @returns The configuration for the preset
 * @throws If preset is 'custom' or not found
 */
export function getPreset(preset: RulePreset): GameConfig {
  if (preset === 'custom') {
    throw new Error("Cannot get 'custom' preset - use a custom GameConfig instead")
  }

  const config = PRESETS[preset]
  if (!config) {
    throw new Error(`Unknown preset: ${preset}`)
  }

  return { ...config }
}

/**
 * Get all available preset names.
 */
export function getPresetNames(): RulePreset[] {
  return ['classic', 'quick', 'marathon', 'chaos', 'custom']
}

/**
 * Get a description of a preset.
 */
export function describePreset(preset: RulePreset): string {
  switch (preset) {
    case 'classic':
      return 'Classic War - Standard rules, play until one player has all cards'
    case 'quick':
      return 'Quick Game - First to 30 cards wins'
    case 'marathon':
      return 'Marathon - Double deck with 3 face-down cards in war'
    case 'chaos':
      return 'Chaos Mode - Double deck, 5 face-down cards, shuffled winnings'
    case 'custom':
      return 'Custom - Configure your own rules'
    default:
      return 'Unknown preset'
  }
}
