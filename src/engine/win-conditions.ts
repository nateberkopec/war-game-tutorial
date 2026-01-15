/**
 * Win condition checking for the War game.
 */

import type { GameState, PlayerId, WinCondition } from './types'

export interface WinCheckResult {
  isOver: boolean
  winner: PlayerId | null
  reason: 'elimination' | 'firstTo' | 'rounds' | null
}

/**
 * Check if the game has ended based on the configured win condition.
 */
export function checkWinCondition(state: GameState): WinCheckResult {
  const { config, players, currentRound } = state
  const p1Cards = players.player1.deck.length
  const p2Cards = players.player2.deck.length

  switch (config.winCondition.type) {
    case 'elimination':
      return checkElimination(p1Cards, p2Cards)

    case 'firstTo':
      return checkFirstTo(p1Cards, p2Cards, config.winCondition.count)

    case 'rounds':
      return checkRounds(p1Cards, p2Cards, currentRound, config.winCondition.count)

    default: {
      // TypeScript exhaustiveness check - ensures all cases are handled
      const exhaustiveCheck: never = config.winCondition
      throw new Error(`Unhandled win condition type: ${exhaustiveCheck}`)
    }
  }
}

/**
 * Check elimination win condition (opponent has 0 cards).
 */
function checkElimination(p1Cards: number, p2Cards: number): WinCheckResult {
  if (p1Cards === 0 && p2Cards === 0) {
    // Edge case: both players eliminated simultaneously (shouldn't happen normally)
    // Could occur in nested wars - the player who ran out first loses
    // If truly simultaneous, this is a draw - but we don't have draws,
    // so the game should have ended earlier based on insufficient cards
    return { isOver: true, winner: null, reason: 'elimination' }
  }

  if (p1Cards === 0) {
    return { isOver: true, winner: 'player2', reason: 'elimination' }
  }

  if (p2Cards === 0) {
    return { isOver: true, winner: 'player1', reason: 'elimination' }
  }

  return { isOver: false, winner: null, reason: null }
}

/**
 * Check first-to-N-cards win condition.
 */
function checkFirstTo(
  p1Cards: number,
  p2Cards: number,
  targetCount: number
): WinCheckResult {
  if (p1Cards >= targetCount) {
    return { isOver: true, winner: 'player1', reason: 'firstTo' }
  }

  if (p2Cards >= targetCount) {
    return { isOver: true, winner: 'player2', reason: 'firstTo' }
  }

  return { isOver: false, winner: null, reason: null }
}

/**
 * Check most-cards-after-N-rounds win condition.
 */
function checkRounds(
  p1Cards: number,
  p2Cards: number,
  currentRound: number,
  maxRounds: number
): WinCheckResult {
  if (currentRound < maxRounds) {
    return { isOver: false, winner: null, reason: null }
  }

  // Game is over - determine winner by card count
  if (p1Cards > p2Cards) {
    return { isOver: true, winner: 'player1', reason: 'rounds' }
  }

  if (p2Cards > p1Cards) {
    return { isOver: true, winner: 'player2', reason: 'rounds' }
  }

  // Tie on cards at end of rounds - this is a rare edge case
  // The spec doesn't define this, so we'll declare the game over with no winner
  // In practice, the UI layer should handle this as a draw
  return { isOver: true, winner: null, reason: 'rounds' }
}

/**
 * Get a human-readable description of the win condition.
 */
export function describeWinCondition(winCondition: WinCondition): string {
  switch (winCondition.type) {
    case 'elimination':
      return 'Win by collecting all cards'
    case 'firstTo':
      return `First to ${winCondition.count} cards wins`
    case 'rounds':
      return `Most cards after ${winCondition.count} rounds wins`
    default:
      return 'Unknown win condition'
  }
}
