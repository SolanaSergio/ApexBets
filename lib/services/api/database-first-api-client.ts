/**
 * Database-First API Client
 * Serves data exclusively from database with no external API calls
 * Designed for fast, reliable responses that respect rate limits
 * Uses Edge Functions for all database operations
 */

import { edgeFunctionClient } from '../edge-function-client'
import { structuredLogger } from '../structured-logger'

export interface DatabaseApiResponse<T> {
  success: boolean
  data: T
  meta: {
    source: 'database'
    count: number
    sport?: string | undefined
    status?: string | undefined
    league?: string | undefined
    betType?: string | undefined
    recommendation?: string | undefined
    minValue?: number | undefined
    activeOnly?: boolean | undefined
    newsSource?: string | undefined
    limit?: number | undefined
    hours?: number | undefined
    refreshed: boolean
    timestamp: string
  }
  error?: string | undefined
}

export interface GameRecord {
  id: string
  sport: string
  league: string
  home_team: string
  away_team: string
  game_date: string
  game_time: string
  status: string
  home_score?: number
  away_score?: number
  venue?: string
  created_at: string
  updated_at: string
}

export interface TeamRecord {
  id: string
  sport: string
  league: string
  name: string
  city: string
  abbreviation: string
  logo_url?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface PlayerRecord {
  id: string
  sport: string
  league: string
  team_id: string
  name: string
  position: string
  age?: number
  height?: string
  weight?: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface OddsRecord {
  id: string
  sport: string
  league: string
  game_id: string
  bookmaker: string
  bet_type: string
  home_odds: number
  away_odds: number
  draw_odds?: number
  over_odds?: number
  under_odds?: number
  spread?: number
  total?: number
  last_updated: string
  created_at: string
}

export interface PredictionRecord {
  id: string
  sport: string
  league: string
  game_id: string
  prediction_type: string
  predicted_winner: string
  confidence: number
  reasoning: string
  is_correct?: boolean
  created_at: string
  updated_at: string
}

export interface StandingsRecord {
  id: string
  sport: string
  league: string
  team_id: string
  season: string
  wins: number
  losses: number
  ties?: number
  win_percentage: number
  games_back: number
  streak: string
  home_record: string
  away_record: string
  conference_record?: string
  division_record?: string
  points_for?: number
  points_against?: number
  point_differential: number
  last_updated: string
  created_at: string
}

export class DatabaseFirstApiClient {
  private static instance: DatabaseFirstApiClient
  private requestCache = new Map<string, Promise<any>>()

  private constructor() {
    console.warn('DEPRECATED: DatabaseFirstApiClient is deprecated. Use Edge Functions instead.')
  }

  public static getInstance(): DatabaseFirstApiClient {
    if (!DatabaseFirstApiClient.instance) {
      DatabaseFirstApiClient.instance = new DatabaseFirstApiClient()
    }
    return DatabaseFirstApiClient.instance
  }

  private getCacheKey(method: string, params: any): string {
    return `${method}:${JSON.stringify(params)}`
  }

  private async deduplicateRequest<T>(cacheKey: string, requestFn: () => Promise<T>): Promise<T> {
    if (this.requestCache.has(cacheKey)) {
      return this.requestCache.get(cacheKey)!
    }

    const promise = requestFn()
    this.requestCache.set(cacheKey, promise)

    // Clean up cache after request completes
    promise.finally(() => {
      this.requestCache.delete(cacheKey)
    })

    return promise
  }

  async getGames(
    params: {
      sport?: string
      league?: string
      date?: string
      status?: string
      limit?: number
    } = {}
  ): Promise<DatabaseApiResponse<GameRecord[]>> {
    const cacheKey = this.getCacheKey('getGames', params)

    return this.deduplicateRequest(cacheKey, async () => {
      try {
        structuredLogger.info('Fetching games from database', params)

        const result = await edgeFunctionClient.queryGames({
          ...(params.sport && { sport: params.sport }),
          ...(params.league && { league: params.league }),
          ...(params.date && { dateFrom: params.date, dateTo: params.date }),
          ...(params.status && { status: params.status }),
          limit: params.limit || 100,
        })

        if (!result.success) {
          throw new Error(result.error || 'Failed to fetch games')
        }

        return {
          success: true,
          data: result.data || [],
          meta: {
            source: 'database',
            count: result.data?.length || 0,
            sport: params.sport,
            status: params.status,
            league: params.league,
            limit: params.limit,
            refreshed: true,
            timestamp: new Date().toISOString(),
          },
        }
      } catch (error) {
        structuredLogger.error('Error fetching games', {
          error: error instanceof Error ? error.message : 'Unknown error',
          params,
        })

        return {
          success: false,
          data: [],
          meta: {
            source: 'database',
            count: 0,
            sport: params.sport,
            status: params.status,
            league: params.league,
            limit: params.limit,
            refreshed: false,
            timestamp: new Date().toISOString(),
          },
          error: error instanceof Error ? error.message : 'Unknown error',
        }
      }
    })
  }

  async getTeams(
    params: {
      sport?: string
      league?: string
      limit?: number
    } = {}
  ): Promise<DatabaseApiResponse<TeamRecord[]>> {
    const cacheKey = this.getCacheKey('getTeams', params)

    return this.deduplicateRequest(cacheKey, async () => {
      try {
        structuredLogger.info('Fetching teams from database', params)

        const result = await edgeFunctionClient.queryTeams({
          ...(params.sport && { sport: params.sport }),
          ...(params.league && { league: params.league }),
          limit: params.limit || 100,
        })

        if (!result.success) {
          throw new Error(result.error || 'Failed to fetch teams')
        }

        return {
          success: true,
          data: result.data || [],
          meta: {
            source: 'database',
            count: result.data?.length || 0,
            sport: params.sport,
            league: params.league,
            limit: params.limit,
            refreshed: true,
            timestamp: new Date().toISOString(),
          },
        }
      } catch (error) {
        structuredLogger.error('Error fetching teams', {
          error: error instanceof Error ? error.message : 'Unknown error',
          params,
        })

        return {
          success: false,
          data: [],
          meta: {
            source: 'database',
            count: 0,
            sport: params.sport,
            league: params.league,
            limit: params.limit,
            refreshed: false,
            timestamp: new Date().toISOString(),
          },
          error: error instanceof Error ? error.message : 'Unknown error',
        }
      }
    })
  }

  async getOdds(
    params: {
      sport?: string
      league?: string
      gameId?: string
      betType?: string
      limit?: number
    } = {}
  ): Promise<DatabaseApiResponse<OddsRecord[]>> {
    const cacheKey = this.getCacheKey('getOdds', params)

    return this.deduplicateRequest(cacheKey, async () => {
      try {
        structuredLogger.info('Fetching odds from database', params)

        const result = await edgeFunctionClient.queryOdds({
          ...(params.sport && { sport: params.sport }),
          ...(params.gameId && { gameId: params.gameId }),
          ...(params.betType && { market: params.betType }),
          limit: params.limit || 100,
        })

        if (!result.success) {
          throw new Error(result.error || 'Failed to fetch odds')
        }

        return {
          success: true,
          data: result.data || [],
          meta: {
            source: 'database',
            count: result.data?.length || 0,
            sport: params.sport,
            league: params.league,
            betType: params.betType,
            limit: params.limit,
            refreshed: true,
            timestamp: new Date().toISOString(),
          },
        }
      } catch (error) {
        structuredLogger.error('Error fetching odds', {
          error: error instanceof Error ? error.message : 'Unknown error',
          params,
        })

        return {
          success: false,
          data: [],
          meta: {
            source: 'database',
            count: 0,
            sport: params.sport,
            league: params.league,
            betType: params.betType,
            limit: params.limit,
            refreshed: false,
            timestamp: new Date().toISOString(),
          },
          error: error instanceof Error ? error.message : 'Unknown error',
        }
      }
    })
  }

  async getPredictions(
    params: {
      sport?: string
      league?: string
      gameId?: string
      predictionType?: string
      limit?: number
    } = {}
  ): Promise<DatabaseApiResponse<PredictionRecord[]>> {
    const cacheKey = this.getCacheKey('getPredictions', params)

    return this.deduplicateRequest(cacheKey, async () => {
      try {
        structuredLogger.info('Fetching predictions from database', params)

        const result = await edgeFunctionClient.queryPredictions({
          ...(params.sport && { sport: params.sport }),
          ...(params.gameId && { gameId: params.gameId }),
          ...(params.predictionType && { model: params.predictionType }),
          limit: params.limit || 100,
        })

        if (!result.success) {
          throw new Error(result.error || 'Failed to fetch predictions')
        }

        return {
          success: true,
          data: result.data || [],
          meta: {
            source: 'database',
            count: result.data?.length || 0,
            sport: params.sport,
            league: params.league,
            limit: params.limit,
            refreshed: true,
            timestamp: new Date().toISOString(),
          },
        }
      } catch (error) {
        structuredLogger.error('Error fetching predictions', {
          error: error instanceof Error ? error.message : 'Unknown error',
          params,
        })

        return {
          success: false,
          data: [],
          meta: {
            source: 'database',
            count: 0,
            sport: params.sport,
            league: params.league,
            limit: params.limit,
            refreshed: false,
            timestamp: new Date().toISOString(),
          },
          error: error instanceof Error ? error.message : 'Unknown error',
        }
      }
    })
  }

  async getStandings(
    params: {
      sport?: string
      league?: string
      season?: string
      limit?: number
    } = {}
  ): Promise<DatabaseApiResponse<StandingsRecord[]>> {
    const cacheKey = this.getCacheKey('getStandings', params)

    return this.deduplicateRequest(cacheKey, async () => {
      try {
        structuredLogger.info('Fetching standings from database', params)

        const result = await edgeFunctionClient.queryStandings({
          ...(params.sport && { sport: params.sport }),
          ...(params.league && { league: params.league }),
          ...(params.season && { season: params.season }),
          limit: params.limit || 100,
        })

        if (!result.success) {
          throw new Error(result.error || 'Failed to fetch standings')
        }

        return {
          success: true,
          data: result.data || [],
          meta: {
            source: 'database',
            count: result.data?.length || 0,
            sport: params.sport,
            league: params.league,
            limit: params.limit,
            refreshed: true,
            timestamp: new Date().toISOString(),
          },
        }
      } catch (error) {
        structuredLogger.error('Error fetching standings', {
          error: error instanceof Error ? error.message : 'Unknown error',
          params,
        })

        return {
          success: false,
          data: [],
          meta: {
            source: 'database',
            count: 0,
            sport: params.sport,
            league: params.league,
            limit: params.limit,
            refreshed: false,
            timestamp: new Date().toISOString(),
          },
          error: error instanceof Error ? error.message : 'Unknown error',
        }
      }
    })
  }

  async getAnalyticsStats(
    sport: string = 'all',
    dateFrom?: string,
    dateTo?: string
  ): Promise<DatabaseApiResponse<any>> {
    const cacheKey = this.getCacheKey('getAnalyticsStats', { sport, dateFrom, dateTo })

    return this.deduplicateRequest(cacheKey, async () => {
      try {
        structuredLogger.info('Fetching analytics stats from database', { sport, dateFrom, dateTo })

        // Get games stats
        const gamesResult = await edgeFunctionClient.queryGames({
          ...(sport !== 'all' && { sport }),
          ...(dateFrom && { dateFrom }),
          ...(dateTo && { dateTo }),
          limit: 1
        })
        
        if (!gamesResult.success) {
          throw new Error('Failed to fetch games analytics')
        }
        
        const gamesStats = gamesResult.data[0] || {}

        // Get predictions stats
        const predictionsResult = await edgeFunctionClient.queryPredictions({
          ...(sport !== 'all' && { sport }),
          limit: 1
        })
        
        if (!predictionsResult.success) {
          throw new Error('Failed to fetch predictions analytics')
        }
        
        const predictionsStats = predictionsResult.data[0] || {}

        // Get teams count
        const teamsResult = await edgeFunctionClient.queryTeams({
          ...(sport !== 'all' && { sport }),
          limit: 1
        })
        
        if (!teamsResult.success) {
          throw new Error('Failed to fetch teams analytics')
        }
        
        const teamsStats = teamsResult.data[0] || {}

        const analytics = {
          total_games: parseInt(gamesStats.total_games) || 0,
          completed_games: parseInt(gamesStats.completed_games) || 0,
          live_games: parseInt(gamesStats.live_games) || 0,
          scheduled_games: parseInt(gamesStats.scheduled_games) || 0,
          total_predictions: parseInt(predictionsStats.total_predictions) || 0,
          correct_predictions: parseInt(predictionsStats.correct_predictions) || 0,
          accuracy_rate:
            predictionsStats.total_predictions > 0
              ? parseInt(predictionsStats.correct_predictions) /
                parseInt(predictionsStats.total_predictions)
              : 0,
          avg_confidence: parseFloat(predictionsStats.avg_confidence) || 0,
          total_teams: parseInt(teamsStats.total_teams) || 0,
        }

        return {
          success: true,
          data: analytics,
          meta: {
            source: 'database',
            count: 1,
            sport,
            refreshed: true,
            timestamp: new Date().toISOString(),
          },
        }
      } catch (error) {
        structuredLogger.error('Error fetching analytics stats', {
          error: error instanceof Error ? error.message : 'Unknown error',
          sport,
          dateFrom,
          dateTo,
        })

        return {
          success: false,
          data: {},
          meta: {
            source: 'database',
            count: 0,
            sport,
            refreshed: false,
            timestamp: new Date().toISOString(),
          },
          error: error instanceof Error ? error.message : 'Unknown error',
        }
      }
    })
  }

  async getValueBets(
    params: {
      sport?: string
      league?: string
      minValue?: number
      limit?: number
    } = {}
  ): Promise<DatabaseApiResponse<any[]>> {
    const cacheKey = this.getCacheKey('getValueBets', params)

    return this.deduplicateRequest(cacheKey, async () => {
      try {
        structuredLogger.info('Fetching value bets from database', params)

        // For now, we'll return empty array since value bets require complex calculations
        // In a real implementation, you'd have a specific Edge Function for value bets
        return {
          success: true,
          data: [],
          meta: {
            source: 'database',
            count: 0,
            sport: params.sport,
            league: params.league,
            minValue: params.minValue,
            limit: params.limit,
            refreshed: true,
            timestamp: new Date().toISOString(),
          },
        }
      } catch (error) {
        structuredLogger.error('Error fetching value bets', {
          error: error instanceof Error ? error.message : 'Unknown error',
          params,
        })

        return {
          success: false,
          data: [],
          meta: {
            source: 'database',
            count: 0,
            sport: params.sport,
            league: params.league,
            minValue: params.minValue,
            limit: params.limit,
            refreshed: false,
            timestamp: new Date().toISOString(),
          },
          error: error instanceof Error ? error.message : 'Unknown error',
        }
      }
    })
  }

  async getSportsNews(
    params: {
      sport?: string
      league?: string
      newsSource?: string
      hours?: number
      limit?: number
    } = {}
  ): Promise<DatabaseApiResponse<any[]>> {
    const cacheKey = this.getCacheKey('getSportsNews', params)

    return this.deduplicateRequest(cacheKey, async () => {
      try {
        structuredLogger.info('Fetching sports news from database', params)

        // For now, we'll return empty array since news requires external API integration
        // In a real implementation, you'd have a specific Edge Function for news
        return {
          success: true,
          data: [],
          meta: {
            source: 'database',
            count: 0,
            sport: params.sport,
            league: params.league,
            newsSource: params.newsSource,
            hours: params.hours,
            limit: params.limit,
            refreshed: true,
            timestamp: new Date().toISOString(),
          },
        }
      } catch (error) {
        structuredLogger.error('Error fetching sports news', {
          error: error instanceof Error ? error.message : 'Unknown error',
          params,
        })

        return {
          success: false,
          data: [],
          meta: {
            source: 'database',
            count: 0,
            sport: params.sport,
            league: params.league,
            newsSource: params.newsSource,
            hours: params.hours,
            limit: params.limit,
            refreshed: false,
            timestamp: new Date().toISOString(),
          },
          error: error instanceof Error ? error.message : 'Unknown error',
        }
      }
    })
  }
}

export const databaseFirstApiClient = DatabaseFirstApiClient.getInstance()