/**
 * Statistics calculation from game events.
 * Provides detailed analysis of gameplay.
 */

import type { GameEvent, GameStats, PlayerId, Rank, Suit } from './types'

/**
 * Create empty initial stats.
 */
export function createInitialStats(): GameStats {
  return {
    totalRounds: 0,
    warsCount: 0,
    longestWarChain: 0,
    largestWarPot: 0,
    cardRankWins: {},
    suitDistribution: {},
    duration: 0,
    averageRoundTime: 0,
    player1RoundsWon: 0,
    player2RoundsWon: 0,
    biggestLead: { player: 'player1', amount: 0 },
  }
}

/**
 * Calculate statistics from a sequence of game events.
 * This is useful for replays or analyzing completed games.
 */
export function calculateStatsFromEvents(events: GameEvent[]): GameStats {
  const stats = createInitialStats()

  let currentWarDepth = 0
  let gameStartTime = 0
  let lastRoundTime = 0
  let roundTimes: number[] = []
  let player1Cards = 26 // Starting assumption
  let player2Cards = 26

  for (const event of events) {
    switch (event.type) {
      case 'gameStarted':
        gameStartTime = Date.now()
        lastRoundTime = gameStartTime
        break

      case 'roundStarted':
        stats.totalRounds++
        break

      case 'roundWon':
        if (event.winner === 'player1') {
          stats.player1RoundsWon++
          player1Cards += event.cardsWon.length
          player2Cards -= event.cardsWon.length / 2 // Approximate
        } else {
          stats.player2RoundsWon++
          player2Cards += event.cardsWon.length
          player1Cards -= event.cardsWon.length / 2
        }

        // Track winning card rank
        if (event.cardsWon.length > 0) {
          const winningCard = event.cardsWon[event.winner === 'player1' ? 0 : 1]
          if (winningCard) {
            const rank = winningCard.rank
            stats.cardRankWins[rank] = (stats.cardRankWins[rank] ?? 0) + 1
            stats.suitDistribution[winningCard.suit] =
              (stats.suitDistribution[winningCard.suit] ?? 0) + 1
          }
        }

        // Track biggest lead
        const lead = Math.abs(player1Cards - player2Cards)
        if (lead > stats.biggestLead.amount) {
          stats.biggestLead = {
            player: player1Cards > player2Cards ? 'player1' : 'player2',
            amount: lead,
          }
        }

        // Track round time
        const now = Date.now()
        if (lastRoundTime > 0) {
          roundTimes.push(now - lastRoundTime)
        }
        lastRoundTime = now
        break

      case 'warStarted':
        if (event.depth === 1) {
          stats.warsCount++
        }
        currentWarDepth = event.depth
        if (currentWarDepth > stats.longestWarChain) {
          stats.longestWarChain = currentWarDepth
        }
        break

      case 'warResolved':
        if (event.totalCards > stats.largestWarPot) {
          stats.largestWarPot = event.totalCards
        }
        currentWarDepth = 0
        break

      case 'gameEnded':
        stats.duration = event.stats.duration || Date.now() - gameStartTime
        break
    }
  }

  // Calculate average round time
  if (roundTimes.length > 0) {
    stats.averageRoundTime =
      roundTimes.reduce((a, b) => a + b, 0) / roundTimes.length
  }

  return stats
}

/**
 * Merge stats from an incremental update.
 */
export function mergeStats(base: GameStats, update: Partial<GameStats>): GameStats {
  return {
    ...base,
    ...update,
    cardRankWins: { ...base.cardRankWins, ...update.cardRankWins },
    suitDistribution: { ...base.suitDistribution, ...update.suitDistribution },
  }
}

/**
 * Get the most winning rank from stats.
 */
export function getMostWinningRank(stats: GameStats): Rank | null {
  let maxRank: Rank | null = null
  let maxWins = 0

  for (const [rank, wins] of Object.entries(stats.cardRankWins)) {
    if (wins > maxWins) {
      maxWins = wins
      maxRank = rank as Rank
    }
  }

  return maxRank
}

/**
 * Get the most common winning suit from stats.
 */
export function getMostWinningSuit(stats: GameStats): Suit | null {
  let maxSuit: Suit | null = null
  let maxWins = 0

  for (const [suit, wins] of Object.entries(stats.suitDistribution)) {
    if (wins > maxWins) {
      maxWins = wins
      maxSuit = suit as Suit
    }
  }

  return maxSuit
}

/**
 * Calculate win rate for a player.
 */
export function getWinRate(stats: GameStats, player: PlayerId): number {
  const total = stats.player1RoundsWon + stats.player2RoundsWon
  if (total === 0) return 0

  const wins = player === 'player1' ? stats.player1RoundsWon : stats.player2RoundsWon
  return wins / total
}

/**
 * Format duration in human-readable format.
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`

  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m ${seconds % 60}s`
  }

  if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`
  }

  return `${seconds}s`
}

/**
 * Generate a text summary of game stats.
 */
export function generateStatsSummary(stats: GameStats): string {
  const lines: string[] = []

  lines.push(`Total Rounds: ${stats.totalRounds}`)
  lines.push(`Wars Fought: ${stats.warsCount}`)

  if (stats.longestWarChain > 0) {
    lines.push(`Longest War Chain: ${stats.longestWarChain} ties`)
  }

  if (stats.largestWarPot > 0) {
    lines.push(`Largest War Pot: ${stats.largestWarPot} cards`)
  }

  lines.push(`Player 1 Rounds Won: ${stats.player1RoundsWon}`)
  lines.push(`Player 2 Rounds Won: ${stats.player2RoundsWon}`)

  if (stats.biggestLead.amount > 0) {
    lines.push(
      `Biggest Lead: ${stats.biggestLead.player} by ${stats.biggestLead.amount} cards`
    )
  }

  if (stats.duration > 0) {
    lines.push(`Duration: ${formatDuration(stats.duration)}`)
  }

  const mostWinningRank = getMostWinningRank(stats)
  if (mostWinningRank) {
    lines.push(`Most Winning Rank: ${mostWinningRank}`)
  }

  return lines.join('\n')
}

/**
 * Compare two stats objects and return differences.
 */
export function compareStats(
  stats1: GameStats,
  stats2: GameStats
): Record<string, { before: number; after: number; diff: number }> {
  const keys: (keyof GameStats)[] = [
    'totalRounds',
    'warsCount',
    'longestWarChain',
    'largestWarPot',
    'player1RoundsWon',
    'player2RoundsWon',
    'duration',
  ]

  const result: Record<string, { before: number; after: number; diff: number }> = {}

  for (const key of keys) {
    const before = stats1[key] as number
    const after = stats2[key] as number
    if (before !== after) {
      result[key] = { before, after, diff: after - before }
    }
  }

  return result
}
