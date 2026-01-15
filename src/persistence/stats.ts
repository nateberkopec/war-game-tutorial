/**
 * Profile Stats utility functions for War game
 *
 * Provides helpers for calculating and updating profile statistics
 * based on game results.
 */

import type { ProfileStats, GameSummary } from './types'

/** Calculate win rate as a percentage (0-100) */
export function calculateWinRate(stats: ProfileStats): number {
  if (stats.gamesPlayed === 0) return 0
  return Math.round((stats.gamesWon / stats.gamesPlayed) * 100)
}

/** Calculate average game duration in milliseconds */
export function calculateAverageGameDuration(recentGames: GameSummary[]): number {
  if (recentGames.length === 0) return 0
  const totalDuration = recentGames.reduce((sum, game) => sum + game.stats.duration, 0)
  return Math.round(totalDuration / recentGames.length)
}

/** Calculate average rounds per game */
export function calculateAverageRoundsPerGame(stats: ProfileStats): number {
  if (stats.gamesPlayed === 0) return 0
  return Math.round(stats.totalRoundsPlayed / stats.gamesPlayed)
}

/** Calculate war win rate (wars won / wars fought) */
export function calculateWarWinRate(stats: ProfileStats): number {
  if (stats.totalWarsFought === 0) return 0
  return Math.round((stats.totalWarsWon / stats.totalWarsFought) * 100)
}

/** Format duration in ms to human-readable string */
export function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)

  if (hours > 0) {
    const remainingMinutes = minutes % 60
    return `${hours}h ${remainingMinutes}m`
  }
  if (minutes > 0) {
    const remainingSeconds = seconds % 60
    return `${minutes}m ${remainingSeconds}s`
  }
  return `${seconds}s`
}

/**
 * Detect if this game was a comeback victory
 *
 * A comeback is when the player won after being down by a significant margin.
 * The biggestLead stat from GameStats tells us the opponent's largest lead.
 */
export function detectComeback(game: GameSummary, profileWasPlayer1: boolean): number {
  if (!game.won) return 0

  // Check if the opponent ever had a lead
  const opponentPlayer = profileWasPlayer1 ? 'player2' : 'player1'
  if (game.stats.biggestLead.player === opponentPlayer) {
    return game.stats.biggestLead.amount
  }
  return 0
}

/**
 * Calculate derived stats for display
 *
 * Returns a set of computed statistics useful for UI display.
 */
export interface DerivedStats {
  winRate: number
  averageGameDuration: number
  averageRoundsPerGame: number
  warWinRate: number
  gamesPlayedFormatted: string
  fastestWinFormatted: string | null
  longestGameFormatted: string | null
}

export function calculateDerivedStats(
  stats: ProfileStats,
  recentGames: GameSummary[]
): DerivedStats {
  return {
    winRate: calculateWinRate(stats),
    averageGameDuration: calculateAverageGameDuration(recentGames),
    averageRoundsPerGame: calculateAverageRoundsPerGame(stats),
    warWinRate: calculateWarWinRate(stats),
    gamesPlayedFormatted: `${stats.gamesWon}W - ${stats.gamesLost}L`,
    fastestWinFormatted: stats.fastestWin ? formatDuration(stats.fastestWin) : null,
    longestGameFormatted: stats.longestGame ? formatDuration(stats.longestGame) : null,
  }
}

/**
 * Merge game stats into profile stats
 *
 * This is a lower-level helper used by ProfileManager.recordGameResult.
 * Exposed here for flexibility and testing.
 */
export function mergeGameIntoStats(
  current: ProfileStats,
  game: GameSummary,
  warsWonThisGame: number
): ProfileStats {
  const stats = { ...current }

  stats.gamesPlayed++
  stats.totalRoundsPlayed += game.stats.totalRounds
  stats.totalWarsFought += game.stats.warsCount
  stats.totalWarsWon += warsWonThisGame

  if (game.won) {
    stats.gamesWon++
    stats.winStreak++
    stats.bestWinStreak = Math.max(stats.bestWinStreak, stats.winStreak)

    if (stats.fastestWin === null || game.stats.duration < stats.fastestWin) {
      stats.fastestWin = game.stats.duration
    }
  } else {
    stats.gamesLost++
    stats.winStreak = 0
  }

  if (stats.longestGame === null || game.stats.duration > stats.longestGame) {
    stats.longestGame = game.stats.duration
  }

  if (game.stats.warsCount > stats.mostWarsInGame) {
    stats.mostWarsInGame = game.stats.warsCount
  }

  if (game.stats.longestWarChain > stats.longestWarChain) {
    stats.longestWarChain = game.stats.longestWarChain
  }

  return stats
}

/**
 * Get ranking title based on games played and win rate
 */
export function getRankTitle(stats: ProfileStats): string {
  const winRate = calculateWinRate(stats)

  if (stats.gamesPlayed < 5) return 'Newcomer'
  if (stats.gamesPlayed < 20) {
    if (winRate >= 60) return 'Promising'
    return 'Learning'
  }
  if (stats.gamesPlayed < 50) {
    if (winRate >= 70) return 'Skilled'
    if (winRate >= 50) return 'Competent'
    return 'Determined'
  }
  if (winRate >= 80) return 'War Master'
  if (winRate >= 65) return 'Veteran'
  if (winRate >= 50) return 'Regular'
  return 'Persistent'
}
