/**
 * War Game Engine - Public API
 *
 * This module exports all public types and classes for the War card game engine.
 */

// Core engine
export { WarGameEngine, DEFAULT_CONFIG } from './engine'

// Types
export type {
  Card,
  Suit,
  Rank,
  PlayerId,
  Player,
  PlayerInfo,
  PlayerState,
  RulePreset,
  WinCondition,
  InsufficientCardsRule,
  WonCardsPosition,
  GameConfig,
  GamePhase,
  Battlefield,
  GameState,
  GameEvent,
  GameEventType,
  GameEventCallback,
  GameEventEmitter,
  GameStats,
  SavedGame,
  Replay,
  IWarGameEngine,
} from './types'

// Deck utilities
export {
  SUITS,
  RANKS,
  DEFAULT_RANK_ORDER,
  createCardId,
  createCard,
  createDeck,
  createMultiDeck,
  shuffle,
  createShuffledDeck,
  splitDeck,
  drawCard,
  addToBottom,
  getRankValue,
  getSuitValue,
  compareCards,
  CardComparator,
} from './deck'

// RNG
export { createRng, serializeRngState, deserializeRngState } from './rng'
export type { Rng, RngState } from './rng'

// Events
export { EventEmitter } from './events'
export type { EventKey } from './events'

// Win conditions
export { checkWinCondition, describeWinCondition } from './win-conditions'
export type { WinCheckResult } from './win-conditions'

// War resolution
export {
  canCompleteWar,
  getFaceDownCount,
  handleInsufficientCards,
  drawFaceDownCards,
  initWarState,
} from './war'
export type { WarResolutionResult, WarState } from './war'

// Presets
export {
  CLASSIC_CONFIG,
  QUICK_CONFIG,
  MARATHON_CONFIG,
  CHAOS_CONFIG,
  PRESETS,
  getPreset,
  getPresetNames,
  describePreset,
} from './presets'

// History
export { GameHistory, createGameHistory } from './history'
export type { Checkpoint } from './history'

// Replay
export {
  createReplay,
  validateReplay,
  ReplayPlayer,
  createEngineFromReplay,
  serializeReplay,
  deserializeReplay,
  getReplaySummary,
} from './replay'

// Stats
export {
  createInitialStats,
  calculateStatsFromEvents,
  mergeStats,
  getMostWinningRank,
  getMostWinningSuit,
  getWinRate,
  formatDuration,
  generateStatsSummary,
  compareStats,
} from './stats'
