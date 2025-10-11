/**
 * SPORT ANALYTICS SERVICE
 * Sport-specific analytics and insights
 */

import { BaseService, ServiceConfig } from '../core/base-service'
import { serviceFactory, SupportedSport } from '../core/service-factory'

export interface AnalyticsMetrics {
  totalGames: number
  totalTeams: number
  totalPlayers: number
  averageScore: number
  winRate: number
  homeAdvantage: number
  lastUpdated: string
}

export interface TeamPerformance {
  teamId: string
  teamName: string
  wins: number
  losses: number
  winPercentage: number
  pointsFor: number
  pointsAgainst: number
  pointDifferential: number
  homeRecord: { wins: number; losses: number }
  awayRecord: { wins: number; losses: number }
  lastUpdated: string
}

export interface PlayerPerformance {
  playerId: string
  playerName: string
  team: string
  position: string
  gamesPlayed: number
  averageStats: Record<string, number>
  seasonHighs: Record<string, number>
  lastUpdated: string
}

export class SportAnalyticsService extends BaseService {
  private sport: SupportedSport
  private league: string

  constructor(sport: SupportedSport, league?: string) {
    const config: ServiceConfig = {
      name: `analytics-${sport}`,
      cacheTTL: 15 * 60 * 1000, // 15 minutes
      rateLimitService: 'analytics',
      retryAttempts: 2,
      retryDelay: 500,
    }
    super(config)
    this.sport = sport
    this.league = league || ''
  }

  /**
   * Initialize the service with the default league
   */
  async initialize(): Promise<void> {
    if (!this.league) {
      this.league = await serviceFactory.getDefaultLeague(this.sport)
    }
  }

  /**
   * Get comprehensive analytics for a sport
   */
  async getSportAnalytics(): Promise<AnalyticsMetrics> {
    const key = this.getCacheKey('analytics', this.sport, this.league)

    return this.getCachedOrFetch(key, async () => {
      const service = await serviceFactory.getService(this.sport, this.league)

      const [games, teams, players] = await Promise.all([
        service.getGames(),
        service.getTeams(),
        service.getPlayers(),
      ])

      const totalGames = games.length
      const totalTeams = teams.length
      const totalPlayers = players.length

      // Calculate average score
      const finishedGames = games.filter(
        game =>
          game.status === 'finished' && game.homeScore !== undefined && game.awayScore !== undefined
      )
      const averageScore =
        finishedGames.length > 0
          ? finishedGames.reduce((sum, game) => sum + (game.homeScore! + game.awayScore!), 0) /
            (finishedGames.length * 2)
          : 0

      // Calculate win rate and home advantage based on actual data
      const homeWins = finishedGames.filter(game => game.homeScore! > game.awayScore!).length
      const winRate = finishedGames.length > 0 ? homeWins / finishedGames.length : 0
      const homeWinRate = winRate
      const awayWinRate = 1 - homeWinRate
      const homeAdvantage = homeWinRate - awayWinRate

      return {
        totalGames,
        totalTeams,
        totalPlayers,
        averageScore: Math.round(averageScore * 100) / 100,
        winRate: Math.round(winRate * 100) / 100,
        homeAdvantage: Math.round(homeAdvantage * 100) / 100,
        lastUpdated: new Date().toISOString(),
      }
    })
  }

  /**
   * Get team performance analytics
   */
  async getTeamPerformance(teamId?: string): Promise<TeamPerformance[]> {
    const key = this.getCacheKey('team-performance', this.sport, this.league, teamId || 'all')

    return this.getCachedOrFetch(key, async () => {
      const service = await serviceFactory.getService(this.sport, this.league)
      const teams = teamId
        ? [await service.getTeamById(teamId)].filter(Boolean)
        : await service.getTeams()
      const games = await service.getGames()

      const performances: TeamPerformance[] = []

      for (const team of teams) {
        if (!team) continue

        const teamGames = games.filter(
          game => game.homeTeam === team.name || game.awayTeam === team.name
        )

        const finishedGames = teamGames.filter(
          game =>
            game.status === 'finished' &&
            game.homeScore !== undefined &&
            game.awayScore !== undefined
        )

        const wins = finishedGames.filter(game => {
          if (game.homeTeam === team.name) {
            return game.homeScore! > game.awayScore!
          } else {
            return game.awayScore! > game.homeScore!
          }
        }).length

        const losses = finishedGames.length - wins
        const winPercentage = finishedGames.length > 0 ? wins / finishedGames.length : 0

        const pointsFor = finishedGames.reduce((sum, game) => {
          if (game.homeTeam === team.name) {
            return sum + (game.homeScore || 0)
          } else {
            return sum + (game.awayScore || 0)
          }
        }, 0)

        const pointsAgainst = finishedGames.reduce((sum, game) => {
          if (game.homeTeam === team.name) {
            return sum + (game.awayScore || 0)
          } else {
            return sum + (game.homeScore || 0)
          }
        }, 0)

        const pointDifferential = pointsFor - pointsAgainst

        // Calculate home/away records
        const homeGames = finishedGames.filter(game => game.homeTeam === team.name)
        const homeWins = homeGames.filter(game => game.homeScore! > game.awayScore!).length
        const homeLosses = homeGames.length - homeWins

        const awayGames = finishedGames.filter(game => game.awayTeam === team.name)
        const awayWins = awayGames.filter(game => game.awayScore! > game.homeScore!).length
        const awayLosses = awayGames.length - awayWins

        performances.push({
          teamId: team.id,
          teamName: team.name,
          wins,
          losses,
          winPercentage: Math.round(winPercentage * 100) / 100,
          pointsFor,
          pointsAgainst,
          pointDifferential,
          homeRecord: { wins: homeWins, losses: homeLosses },
          awayRecord: { wins: awayWins, losses: awayLosses },
          lastUpdated: new Date().toISOString(),
        })
      }

      return performances
    })
  }

  /**
   * Get player performance analytics
   */
  async getPlayerPerformance(playerId?: string): Promise<PlayerPerformance[]> {
    const key = this.getCacheKey('player-performance', this.sport, this.league, playerId || 'all')

    return this.getCachedOrFetch(key, async () => {
      const service = await serviceFactory.getService(this.sport, this.league)
      const players = playerId
        ? [await service.getPlayerById(playerId)].filter(Boolean)
        : await service.getPlayers()

      const performances: PlayerPerformance[] = []

      for (const player of players) {
        if (!player) continue

        // This would integrate with actual player stats
        performances.push({
          playerId: player.id,
          playerName: player.name,
          team: player.team,
          position: player.position || '',
          gamesPlayed: 0, // Would calculate from actual data
          averageStats: player.stats || {},
          seasonHighs: {}, // Would calculate from actual data
          lastUpdated: new Date().toISOString(),
        })
      }

      return performances
    })
  }

  /**
   * Get trending teams (based on recent performance)
   */
  async getTrendingTeams(limit: number = 5): Promise<TeamPerformance[]> {
    const performances = await this.getTeamPerformance()

    return performances.sort((a, b) => b.winPercentage - a.winPercentage).slice(0, limit)
  }

  /**
   * Get value betting opportunities
   */
  async getValueBettingOpportunities(minValue: number = 0.1): Promise<any[]> {
    const key = this.getCacheKey('value-bets', this.sport, this.league, minValue.toString())

    return this.getCachedOrFetch(key, async () => {
      // This would integrate with odds and prediction services
      return []
    })
  }

  /**
   * Get sport-specific health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.getSportAnalytics()
      return true
    } catch (error) {
      console.error(`${this.sport} analytics service health check failed:`, error)
      return false
    }
  }
}
