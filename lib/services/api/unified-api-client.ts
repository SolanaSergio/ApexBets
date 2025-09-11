/**
 * UNIFIED API CLIENT
 * Provides a unified interface to all split services
 */

import { serviceFactory, SupportedSport } from '../core/service-factory'

// Re-export types for convenience
export type { SupportedSport, UnifiedGameData, UnifiedTeamData, UnifiedPlayerData }
import { SportAnalyticsService } from '../analytics/sport-analytics-service'
import { SportPredictionService } from '../predictions/sport-prediction-service'
import { SportOddsService } from '../odds/sport-odds-service'

export interface ApiResponse<T> {
  success: boolean
  data: T
  meta: {
    timestamp: string
    sport?: string
    league?: string
    action?: string
    count?: number
  }
  error?: string
}

export interface UnifiedGameData {
  id: string
  sport: string
  league: string
  homeTeam: string
  awayTeam: string
  date: string
  time?: string
  status: 'scheduled' | 'live' | 'finished' | 'postponed' | 'cancelled'
  homeScore?: number
  awayScore?: number
  venue?: string
  odds?: any[]
  predictions?: any[]
  lastUpdated: string
}

export interface UnifiedTeamData {
  id: string
  sport: string
  league: string
  name: string
  abbreviation: string
  city?: string
  logo?: string
  stats?: any
  lastUpdated: string
}

export interface UnifiedPlayerData {
  id: string
  sport: string
  league: string
  name: string
  team: string
  position?: string
  stats?: any
  lastUpdated: string
}

export class UnifiedApiClient {
  /**
   * Get all supported sports
   */
  getSupportedSports(): SupportedSport[] {
    return serviceFactory.getSupportedSports()
  }

  /**
   * Get leagues for a specific sport
   */
  getLeaguesForSport(sport: SupportedSport): string[] {
    return serviceFactory.getLeaguesForSport(sport)
  }

  /**
   * Get default league for a sport
   */
  getDefaultLeague(sport: SupportedSport): string {
    return serviceFactory.getDefaultLeague(sport)
  }

  /**
   * Get games for a specific sport
   */
  async getGames(sport: SupportedSport, params: {
    league?: string
    date?: string
    status?: 'scheduled' | 'live' | 'finished'
    teamId?: string
    limit?: number
  } = {}): Promise<UnifiedGameData[]> {
    const service = serviceFactory.getService(sport, params.league)
    const games = await service.getGames({
      date: params.date,
      status: params.status,
      teamId: params.teamId
    })

    return games.slice(0, params.limit || 10)
  }

  /**
   * Get live games for a specific sport
   */
  async getLiveGames(sport: SupportedSport, league?: string): Promise<UnifiedGameData[]> {
    const service = serviceFactory.getService(sport, league)
    return service.getLiveGames()
  }

  /**
   * Get teams for a specific sport
   */
  async getTeams(sport: SupportedSport, params: {
    league?: string
    search?: string
    limit?: number
  } = {}): Promise<UnifiedTeamData[]> {
    const service = serviceFactory.getService(sport, params.league)
    const teams = await service.getTeams({
      league: params.league,
      search: params.search
    })

    return teams.slice(0, params.limit || 10)
  }

  /**
   * Get players for a specific sport
   */
  async getPlayers(sport: SupportedSport, params: {
    league?: string
    teamId?: string
    search?: string
    limit?: number
  } = {}): Promise<UnifiedPlayerData[]> {
    const service = serviceFactory.getService(sport, params.league)
    const players = await service.getPlayers({
      teamId: params.teamId,
      search: params.search
    })

    return players.slice(0, params.limit || 10)
  }

  /**
   * Get standings for a specific sport
   */
  async getStandings(sport: SupportedSport, league?: string, season?: string): Promise<any[]> {
    const service = serviceFactory.getService(sport, league)
    return service.getStandings(season)
  }

  /**
   * Get odds for a specific sport
   */
  async getOdds(sport: SupportedSport, params: {
    league?: string
    gameId?: string
    date?: string
    markets?: string[]
    limit?: number
  } = {}): Promise<any[]> {
    const oddsService = new SportOddsService(sport, params.league)
    return oddsService.getOdds({
      gameId: params.gameId,
      date: params.date,
      markets: params.markets,
      limit: params.limit
    })
  }

  /**
   * Get predictions for a specific sport
   */
  async getPredictions(sport: SupportedSport, params: {
    league?: string
    gameId?: string
    date?: string
    limit?: number
  } = {}): Promise<any[]> {
    const predictionService = new SportPredictionService(sport, params.league)
    return predictionService.getPredictions({
      gameId: params.gameId,
      date: params.date,
      limit: params.limit
    })
  }

  /**
   * Get analytics for a specific sport
   */
  async getAnalytics(sport: SupportedSport, params: {
    league?: string
    teamId?: string
    playerId?: string
    limit?: number
  } = {}): Promise<any> {
    const analyticsService = new SportAnalyticsService(sport, params.league)
    return analyticsService.getSportAnalytics()
  }

  /**
   * Get team performance for a specific sport
   */
  async getTeamPerformance(sport: SupportedSport, params: {
    league?: string
    teamId?: string
  } = {}): Promise<any[]> {
    const analyticsService = new SportAnalyticsService(sport, params.league)
    return analyticsService.getTeamPerformance(params.teamId)
  }

  /**
   * Get value betting opportunities for a specific sport
   */
  async getValueBets(sport: SupportedSport, params: {
    league?: string
    minValue?: number
    limit?: number
  } = {}): Promise<any[]> {
    const predictionService = new SportPredictionService(sport, params.league)
    return predictionService.getValueBettingOpportunities({
      minValue: params.minValue || 0.1,
      limit: params.limit || 10
    })
  }

  /**
   * Get comprehensive sport overview
   */
  async getSportOverview(sport: SupportedSport, league?: string): Promise<{
    sport: string
    league: string
    games: UnifiedGameData[]
    teams: UnifiedTeamData[]
    players: UnifiedPlayerData[]
    standings: any[]
    odds: any[]
    predictions: any[]
    analytics: any
    lastUpdated: string
  }> {
    const [games, teams, players, standings, odds, predictions, analytics] = await Promise.all([
      this.getGames(sport, { league, limit: 5 }),
      this.getTeams(sport, { league, limit: 5 }),
      this.getPlayers(sport, { league, limit: 5 }),
      this.getStandings(sport, league),
      this.getOdds(sport, { league, limit: 5 }),
      this.getPredictions(sport, { league, limit: 5 }),
      this.getAnalytics(sport, { league })
    ])

    return {
      sport,
      league: league || serviceFactory.getDefaultLeague(sport),
      games,
      teams,
      players,
      standings,
      odds,
      predictions,
      analytics,
      lastUpdated: new Date().toISOString()
    }
  }

  /**
   * Get health status for all services
   */
  async getHealthStatus(): Promise<Record<string, boolean>> {
    return serviceFactory.getHealthStatus()
  }

  /**
   * Warm up services
   */
  async warmupServices(sports: SupportedSport[] = ['basketball', 'football']): Promise<void> {
    return serviceFactory.warmupServices(sports)
  }

  /**
   * Clear all caches
   */
  clearAllCaches(): void {
    serviceFactory.clearAllCaches()
  }

  /**
   * Clear all health check caches
   */
  clearAllHealthCheckCaches(): void {
    serviceFactory.clearAllHealthCheckCaches()
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): Record<string, any> {
    return serviceFactory.getAllCacheStats()
  }
}

// Export singleton instance
export const unifiedApiClient = new UnifiedApiClient()
