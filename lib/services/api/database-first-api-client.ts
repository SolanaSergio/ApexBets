/**
 * Database-First API Client
 * Serves data exclusively from database with no external API calls
 * Designed for fast, reliable responses that respect rate limits
 */

import { databaseService } from '../database-service'
import { structuredLogger } from '../structured-logger'

export interface DatabaseApiResponse<T> {
  success: boolean
  data: T
  meta: {
    source: 'database'
    count: number
    sport?: string
    status?: string
    league?: string
    betType?: string
    recommendation?: string
    minValue?: number
    activeOnly?: boolean
    newsSource?: string
    limit?: number
    hours?: number
    refreshed: boolean
    timestamp: string
  }
  error?: string
}

export interface GameData {
  id: string
  home_team_id: string
  away_team_id: string
  home_team_name: string
  away_team_name: string
  game_date: string
  season: string
  // // week // Column does not exist in database?: number // Column does not exist in database
  home_score?: number
  away_score?: number
  status: 'scheduled' | 'live' | 'completed' | 'postponed' | 'cancelled'
  venue?: string
  sport: string
  league?: string
  game_type?: string
  created_at: string
  updated_at: string
}

export interface TeamData {
  id: string
  name: string
  city?: string
  league: string
  sport: string
  abbreviation?: string
  logo_url?: string
  conference?: string
  division?: string
  founded_year?: number
  stadium_name?: string
  stadium_capacity?: number
  primary_color?: string
  secondary_color?: string
  country?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface OddsData {
  id: string
  game_id: string
  source: string
  odds_type: string
  home_odds?: number
  away_odds?: number
  spread?: number
  total?: number
  timestamp: string
  sport: string
  league?: string
  prop_bets?: any
  live_odds: boolean
  created_at: string
}

export interface PredictionData {
  id: string
  game_id: string
  model_name: string
  prediction_type: string
  predicted_value?: number
  confidence?: number
  actual_value?: number
  is_correct?: boolean
  sport: string
  league?: string
  reasoning?: string
  model_version?: string
  feature_importance?: any
  confidence_interval?: any
  created_at: string
}

export interface StandingData {
  id: string
  team_id: string
  team_name: string
  season: string
  league: string
  sport: string
  wins: number
  losses: number
  ties: number
  win_percentage?: number
  games_back?: number
  streak?: string
  home_wins: number
  home_losses: number
  away_wins: number
  away_losses: number
  division_wins: number
  division_losses: number
  conference_wins: number
  conference_losses: number
  points_for: number
  points_against: number
  point_differential: number
  last_updated: string
  created_at: string
}

export class DatabaseFirstApiClient {
  private static instance: DatabaseFirstApiClient
  private requestCache = new Map<string, Promise<any>>()

  public static getInstance(): DatabaseFirstApiClient {
    if (!DatabaseFirstApiClient.instance) {
      DatabaseFirstApiClient.instance = new DatabaseFirstApiClient()
    }
    return DatabaseFirstApiClient.instance
  }

  private getCacheKey(method: string, params: any): string {
    return `${method}:${JSON.stringify(params)}`
  }

  private async deduplicateRequest<T>(
    cacheKey: string,
    requestFn: () => Promise<T>
  ): Promise<T> {
    if (this.requestCache.has(cacheKey)) {
      return this.requestCache.get(cacheKey)!
    }

    const promise = requestFn()
    this.requestCache.set(cacheKey, promise)
    
    try {
      const result = await promise
      return result
    } finally {
      this.requestCache.delete(cacheKey)
    }
  }

  // Games
  async getGames(params: {
    sport?: string
    status?: string
    dateFrom?: string
    dateTo?: string
    limit?: number
    league?: string
  } = {}): Promise<DatabaseApiResponse<GameData[]>> {
    const cacheKey = this.getCacheKey('getGames', params)
    
    return this.deduplicateRequest(cacheKey, async () => {
      try {
        const {
          sport = 'all',
          status,
          dateFrom,
          dateTo,
          limit = 100,
          league
        } = params

      let query = `
        SELECT 
          g.id,
          g.home_team_id,
          g.away_team_id,
          g.game_date,
          g.season,
          g.home_score,
          g.away_score,
          g.status,
          g.venue,
          g.sport,
          g.league,
          g.game_type,
          g.created_at,
          g.updated_at,
          ht.name as home_team_name,
          at.name as away_team_name
        FROM games g
        LEFT JOIN teams ht ON g.home_team_id = ht.id
        LEFT JOIN teams at ON g.away_team_id = at.id
        WHERE 1=1
      `

      const queryParams: any[] = []
      let paramIndex = 1

      if (sport !== 'all') {
        query += ` AND g.sport = $${paramIndex}`
        queryParams.push(sport)
        paramIndex++
      }

      if (status) {
        query += ` AND g.status = $${paramIndex}`
        queryParams.push(status)
        paramIndex++
      }

      if (dateFrom) {
        query += ` AND g.game_date >= $${paramIndex}`
        queryParams.push(dateFrom)
        paramIndex++
      }

      if (dateTo) {
        query += ` AND g.game_date <= $${paramIndex}`
        queryParams.push(dateTo)
        paramIndex++
      }

      if (league) {
        query += ` AND g.league = $${paramIndex}`
        queryParams.push(league)
        paramIndex++
      }

      query += ` ORDER BY g.game_date DESC LIMIT $${paramIndex}`
      queryParams.push(limit)

      const result = await databaseService.executeSQL(query, queryParams)
      const games = result.data || []

      structuredLogger.info('Games fetched from database', {
        sport,
        status,
        count: games.length,
        source: 'database'
      })

      return {
        success: true,
        data: games,
        meta: {
          source: 'database',
          count: games.length,
          ...(sport !== 'all' && { sport }),
          ...(status && { status }),
          refreshed: false,
          timestamp: new Date().toISOString()
        }
      }

    } catch (error) {
      structuredLogger.error('Failed to fetch games from database', {
        error: error instanceof Error ? error.message : String(error),
        params
      })

      return {
        success: false,
        data: [],
        meta: {
          source: 'database',
          count: 0,
          ...(params.sport && params.sport !== 'all' && { sport: params.sport }),
          ...(params.status && { status: params.status }),
          refreshed: false,
          timestamp: new Date().toISOString()
        },
        error: error instanceof Error ? error.message : String(error)
      }
    }
    })
  }

  // Teams
  async getTeams(params: {
    sport?: string
    league?: string
    limit?: number
    isActive?: boolean
  } = {}): Promise<DatabaseApiResponse<TeamData[]>> {
    const cacheKey = this.getCacheKey('getTeams', params)
    
    return this.deduplicateRequest(cacheKey, async () => {
      try {
        const {
          sport = 'all',
          league,
          limit = 100,
          isActive = true
        } = params

      let query = `
        SELECT 
          id,
          name,
          city,
          league,
          sport,
          abbreviation,
          logo_url,
          conference,
          division,
          founded_year,
          stadium_name,
          stadium_capacity,
          primary_color,
          secondary_color,
          country,
          is_active,
          created_at,
          updated_at
        FROM teams 
        WHERE 1=1
      `
      const queryParams: any[] = []
      let paramIndex = 1

      if (sport !== 'all') {
        query += ` AND sport = $${paramIndex}`
        queryParams.push(sport)
        paramIndex++
      }

      if (league) {
        query += ` AND league = $${paramIndex}`
        queryParams.push(league)
        paramIndex++
      }

      if (isActive !== undefined) {
        query += ` AND is_active = $${paramIndex}`
        queryParams.push(isActive)
        paramIndex++
      }

      query += ` ORDER BY name LIMIT $${paramIndex}`
      queryParams.push(limit)

      const result = await databaseService.executeSQL(query, queryParams)
      const teams = result.data || []

      structuredLogger.info('Teams fetched from database', {
        sport,
        league,
        count: teams.length,
        source: 'database'
      })

      return {
        success: true,
        data: teams,
        meta: {
          source: 'database',
          count: teams.length,
          ...(sport !== 'all' && { sport }),
          refreshed: false,
          timestamp: new Date().toISOString()
        }
      }

    } catch (error) {
      structuredLogger.error('Failed to fetch teams from database', {
        error: error instanceof Error ? error.message : String(error),
        params
      })

      return {
        success: false,
        data: [],
        meta: {
          source: 'database',
          count: 0,
          ...(params.sport && params.sport !== 'all' && { sport: params.sport }),
          refreshed: false,
          timestamp: new Date().toISOString()
        },
        error: error instanceof Error ? error.message : String(error)
      }
    }
    })
  }

  // Odds
  async getOdds(params: {
    sport?: string
    gameId?: string
    source?: string
    limit?: number
    liveOnly?: boolean
  } = {}): Promise<DatabaseApiResponse<OddsData[]>> {
    const cacheKey = this.getCacheKey('getOdds', params)
    
    return this.deduplicateRequest(cacheKey, async () => {
      try {
        const {
          sport = 'all',
          gameId,
          source,
          limit = 100,
          liveOnly = false
        } = params

      let query = `
        SELECT 
          id,
          game_id,
          provider as source,
          odds_type,
          home_odds,
          away_odds,
          spread,
          total,
          last_updated as timestamp,
          sport,
          league,
          prop_bets,
          live_odds,
          created_at
        FROM betting_odds 
        WHERE 1=1
      `
      const queryParams: any[] = []
      let paramIndex = 1

      if (sport !== 'all') {
        query += ` AND sport = $${paramIndex}`
        queryParams.push(sport)
        paramIndex++
      }

      if (gameId) {
        query += ` AND game_id = $${paramIndex}`
        queryParams.push(gameId)
        paramIndex++
      }

      if (source) {
        query += ` AND source = $${paramIndex}`
        queryParams.push(source)
        paramIndex++
      }

      if (liveOnly) {
        query += ` AND live_odds = true`
      }

      query += ` ORDER BY timestamp DESC LIMIT $${paramIndex}`
      queryParams.push(limit)

      const result = await databaseService.executeSQL(query, queryParams)
      const odds = result.data || []

      structuredLogger.info('Odds fetched from database', {
        sport,
        gameId,
        source,
        count: odds.length,
        dataSource: 'database'
      })

      return {
        success: true,
        data: odds,
        meta: {
          source: 'database',
          count: odds.length,
          ...(sport !== 'all' && { sport }),
          refreshed: false,
          timestamp: new Date().toISOString()
        }
      }

    } catch (error) {
      structuredLogger.error('Failed to fetch odds from database', {
        error: error instanceof Error ? error.message : String(error),
        params
      })

      return {
        success: false,
        data: [],
        meta: {
          source: 'database',
          count: 0,
          ...(params.sport && params.sport !== 'all' && { sport: params.sport }),
          refreshed: false,
          timestamp: new Date().toISOString()
        },
        error: error instanceof Error ? error.message : String(error)
      }
    }
    })
  }

  // Predictions
  async getPredictions(params: {
    sport?: string
    gameId?: string
    modelName?: string
    predictionType?: string
    limit?: number
  } = {}): Promise<DatabaseApiResponse<PredictionData[]>> {
    const cacheKey = this.getCacheKey('getPredictions', params)
    
    return this.deduplicateRequest(cacheKey, async () => {
      try {
        const {
          sport = 'all',
          gameId,
          modelName,
          predictionType,
          limit = 50
        } = params

      let query = `
        SELECT 
          id,
          game_id,
          model_name,
          prediction_type,
          predicted_value,
          confidence,
          actual_value,
          is_correct,
          sport,
          league,
          reasoning,
          model_version,
          feature_importance,
          confidence_interval,
          created_at
        FROM predictions 
        WHERE 1=1
      `
      const queryParams: any[] = []
      let paramIndex = 1

      if (sport !== 'all') {
        query += ` AND sport = $${paramIndex}`
        queryParams.push(sport)
        paramIndex++
      }

      if (gameId) {
        query += ` AND game_id = $${paramIndex}`
        queryParams.push(gameId)
        paramIndex++
      }

      if (modelName) {
        query += ` AND model_name = $${paramIndex}`
        queryParams.push(modelName)
        paramIndex++
      }

      if (predictionType) {
        query += ` AND prediction_type = $${paramIndex}`
        queryParams.push(predictionType)
        paramIndex++
      }

      query += ` ORDER BY created_at DESC LIMIT $${paramIndex}`
      queryParams.push(limit)

      const result = await databaseService.executeSQL(query, queryParams)
      const predictions = result.data || []

      structuredLogger.info('Predictions fetched from database', {
        sport,
        gameId,
        modelName,
        predictionType,
        count: predictions.length,
        source: 'database'
      })

      return {
        success: true,
        data: predictions,
        meta: {
          source: 'database',
          count: predictions.length,
          ...(sport !== 'all' && { sport }),
          refreshed: false,
          timestamp: new Date().toISOString()
        }
      }

    } catch (error) {
      structuredLogger.error('Failed to fetch predictions from database', {
        error: error instanceof Error ? error.message : String(error),
        params
      })

      return {
        success: false,
        data: [],
        meta: {
          source: 'database',
          count: 0,
          ...(params.sport && params.sport !== 'all' && { sport: params.sport }),
          refreshed: false,
          timestamp: new Date().toISOString()
        },
        error: error instanceof Error ? error.message : String(error)
      }
    }
    })
  }

  // Standings
  async getStandings(params: {
    sport?: string
    league?: string
    season?: string
    limit?: number
  } = {}): Promise<DatabaseApiResponse<StandingData[]>> {
    try {
      const {
        sport = 'all',
        league,
        season,
        limit = 50
      } = params

      // Use the production Supabase client's dedicated getStandings method
      const { productionSupabaseClient } = await import('../../supabase/production-client')
      
      const standings = await productionSupabaseClient.getStandings(
        sport !== 'all' ? sport : undefined,
        league,
        season
      )

      // Transform the data to match our interface
      const transformedStandings = standings.map((standing: any) => ({
        id: standing.id,
        team_id: standing.team_id,
        team_name: standing.team?.name ?? null,
        season: standing.season,
        league: standing.league,
        sport: standing.sport,
        wins: standing.wins || 0,
        losses: standing.losses || 0,
        ties: standing.ties || 0,
        win_percentage: standing.win_percentage,
        games_back: standing.games_back,
        streak: standing.streak,
        home_wins: standing.home_wins || 0,
        home_losses: standing.home_losses || 0,
        away_wins: standing.away_wins || 0,
        away_losses: standing.away_losses || 0,
        division_wins: standing.division_wins || 0,
        division_losses: standing.division_losses || 0,
        conference_wins: standing.conference_wins || 0,
        conference_losses: standing.conference_losses || 0,
        points_for: standing.points_for || 0,
        points_against: standing.points_against || 0,
        point_differential: standing.point_differential || 0,
        last_updated: standing.last_updated,
        created_at: standing.created_at
      }))

      // Apply limit
      const limitedStandings = transformedStandings.slice(0, limit)

      structuredLogger.info('Standings fetched from database', {
        sport,
        league,
        season,
        count: limitedStandings.length,
        source: 'database'
      })

      return {
        success: true,
        data: limitedStandings,
        meta: {
          source: 'database',
          count: limitedStandings.length,
          ...(sport !== 'all' && { sport }),
          refreshed: false,
          timestamp: new Date().toISOString()
        }
      }

    } catch (error) {
      structuredLogger.error('Failed to fetch standings from database', {
        error: error instanceof Error ? error.message : String(error),
        params
      })

      return {
        success: false,
        data: [],
        meta: {
          source: 'database',
          count: 0,
          ...(params.sport && params.sport !== 'all' && { sport: params.sport }),
          refreshed: false,
          timestamp: new Date().toISOString()
        },
        error: error instanceof Error ? error.message : String(error)
      }
    }
  }

  // Analytics
  async getAnalyticsStats(params: {
    sport?: string
    dateFrom?: string
    dateTo?: string
  } = {}): Promise<DatabaseApiResponse<any>> {
    try {
      const { sport = 'all', dateFrom, dateTo } = params

      // Get basic stats
      const gamesQuery = `
        SELECT 
          COUNT(*) as total_games,
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_games,
          COUNT(CASE WHEN status = 'live' THEN 1 END) as live_games,
          COUNT(CASE WHEN status = 'scheduled' THEN 1 END) as scheduled_games
        FROM games 
        WHERE 1=1
        ${sport !== 'all' ? 'AND sport = $1' : ''}
        ${dateFrom ? `AND game_date >= $${sport !== 'all' ? '2' : '1'}` : ''}
        ${dateTo ? `AND game_date <= $${sport !== 'all' ? (dateFrom ? '3' : '2') : (dateFrom ? '2' : '1')}` : ''}
      `

      const queryParams: any[] = []
      if (sport !== 'all') queryParams.push(sport)
      if (dateFrom) queryParams.push(dateFrom)
      if (dateTo) queryParams.push(dateTo)

      const gamesResult = await databaseService.executeSQL(gamesQuery, queryParams)
      const gamesStats = gamesResult.data[0] || {}

      // Get predictions stats
      const predictionsQuery = `
        SELECT 
          COUNT(*) as total_predictions,
          COUNT(CASE WHEN is_correct = true THEN 1 END) as correct_predictions,
          AVG(confidence) as avg_confidence
        FROM predictions 
        WHERE 1=1
        ${sport !== 'all' ? 'AND sport = $1' : ''}
      `

      const predictionsResult = await databaseService.executeSQL(predictionsQuery, sport !== 'all' ? [sport] : [])
      const predictionsStats = predictionsResult.data[0] || {}

      // Get teams count
      const teamsQuery = `
        SELECT COUNT(*) as total_teams
        FROM teams 
        WHERE is_active = true
        ${sport !== 'all' ? 'AND sport = $1' : ''}
      `

      const teamsResult = await databaseService.executeSQL(teamsQuery, sport !== 'all' ? [sport] : [])
      const teamsStats = teamsResult.data[0] || {}

      const analytics = {
        total_games: parseInt(gamesStats.total_games) || 0,
        completed_games: parseInt(gamesStats.completed_games) || 0,
        live_games: parseInt(gamesStats.live_games) || 0,
        scheduled_games: parseInt(gamesStats.scheduled_games) || 0,
        total_predictions: parseInt(predictionsStats.total_predictions) || 0,
        correct_predictions: parseInt(predictionsStats.correct_predictions) || 0,
        accuracy_rate: predictionsStats.total_predictions > 0 
          ? (parseInt(predictionsStats.correct_predictions) / parseInt(predictionsStats.total_predictions)) 
          : 0,
        avg_confidence: parseFloat(predictionsStats.avg_confidence) || 0,
        total_teams: parseInt(teamsStats.total_teams) || 0,
        recent_predictions: parseInt(predictionsStats.total_predictions) || 0
      }

      structuredLogger.info('Analytics fetched from database', {
        sport,
        analytics,
        source: 'database'
      })

      return {
        success: true,
        data: analytics,
        meta: {
          source: 'database',
          count: 1,
          ...(sport !== 'all' && { sport }),
          refreshed: false,
          timestamp: new Date().toISOString()
        }
      }

    } catch (error) {
      structuredLogger.error('Failed to fetch analytics from database', {
        error: error instanceof Error ? error.message : String(error),
        params
      })

      return {
        success: false,
        data: {
          total_games: 0,
          total_predictions: 0,
          total_teams: 0,
          accuracy_rate: 0,
          recent_predictions: 0,
          recent_performance: {
            accuracy_by_type: {},
            daily_stats: []
          }
        },
        meta: {
          source: 'database',
          count: 0,
          ...(params.sport && params.sport !== 'all' && { sport: params.sport }),
          refreshed: false,
          timestamp: new Date().toISOString()
        },
        error: error instanceof Error ? error.message : String(error)
      }
    }
  }

  // Value Betting Opportunities
  async getValueBets(params: {
    sport?: string
    league?: string
    betType?: string
    recommendation?: string
    minValue?: number
    limit?: number
    activeOnly?: boolean
  } = {}): Promise<DatabaseApiResponse<any[]>> {
    try {
      const {
        sport = 'all',
        league,
        betType,
        recommendation,
        minValue,
        limit = 50,
        activeOnly = true
      } = params

      let query = `SELECT * FROM value_betting_opportunities WHERE 1=1`
      const queryParams: any[] = []
      let paramIndex = 1

      if (sport !== 'all') {
        query += ` AND sport = $${paramIndex}`
        queryParams.push(sport)
        paramIndex++
      }

      if (league) {
        query += ` AND league = $${paramIndex}`
        queryParams.push(league)
        paramIndex++
      }

      if (betType) {
        query += ` AND bet_type = $${paramIndex}`
        queryParams.push(betType)
        paramIndex++
      }

      if (recommendation) {
        query += ` AND recommendation = $${paramIndex}`
        queryParams.push(recommendation)
        paramIndex++
      }

      if (minValue !== undefined) {
        query += ` AND value >= $${paramIndex}`
        queryParams.push(minValue)
        paramIndex++
      }

      if (activeOnly) {
        query += ` AND expires_at > NOW()`
      }

      query += ` ORDER BY value DESC, confidence_score DESC LIMIT $${paramIndex}`
      queryParams.push(limit)

      const result = await databaseService.executeSQL(query, queryParams)
      const valueBets = result.data || []

      structuredLogger.info('Value bets fetched from database', {
        sport,
        league,
        betType,
        recommendation,
        minValue,
        limit,
        activeOnly,
        count: valueBets.length
      })

      return {
        success: true,
        data: valueBets,
        meta: {
          source: 'database',
          count: valueBets.length,
          ...(sport && sport !== 'all' && { sport }),
          ...(league && { league }),
          ...(betType && { betType }),
          ...(recommendation && { recommendation }),
          ...(minValue !== undefined && { minValue }),
          activeOnly,
          refreshed: false,
          timestamp: new Date().toISOString()
        }
      }

    } catch (error) {
      structuredLogger.error('Failed to fetch value bets from database', {
        error: error instanceof Error ? error.message : String(error),
        params
      })

      return {
        success: false,
        data: [],
        meta: {
          source: 'database',
          count: 0,
          ...(params.sport && params.sport !== 'all' && { sport: params.sport }),
          refreshed: false,
          timestamp: new Date().toISOString()
        },
        error: error instanceof Error ? error.message : String(error)
      }
    }
  }

  // Sports News
  async getSportsNews(params: {
    sport?: string | undefined
    league?: string | undefined
    teamId?: string | undefined
    playerId?: string | undefined
    newsType?: string | undefined
    source?: string | undefined
    limit?: number | undefined
    hours?: number | undefined
  } = {}): Promise<DatabaseApiResponse<any[]>> {
    try {
      const {
        sport = 'all',
        league,
        teamId,
        playerId,
        newsType,
        source,
        limit = 20,
        hours = 24
      } = params

      let query = `SELECT * FROM sports_news WHERE 1=1`
      const queryParams: any[] = []
      let paramIndex = 1

      if (sport !== 'all') {
        query += ` AND sport = $${paramIndex}`
        queryParams.push(sport)
        paramIndex++
      }

      if (league) {
        query += ` AND league = $${paramIndex}`
        queryParams.push(league)
        paramIndex++
      }

      if (teamId) {
        query += ` AND team_id = $${paramIndex}`
        queryParams.push(teamId)
        paramIndex++
      }

      if (playerId) {
        query += ` AND player_id = $${paramIndex}`
        queryParams.push(playerId)
        paramIndex++
      }

      if (newsType) {
        query += ` AND news_type = $${paramIndex}`
        queryParams.push(newsType)
        paramIndex++
      }

      if (source) {
        query += ` AND source = $${paramIndex}`
        queryParams.push(source)
        paramIndex++
      }

      // Use make_interval to parameterize hours
      query += ` AND published_at > NOW() - make_interval(hours => $${paramIndex})`
      queryParams.push(hours)
      paramIndex++

      query += ` ORDER BY published_at DESC LIMIT $${paramIndex}`
      queryParams.push(limit)

      const result = await databaseService.executeSQL(query, queryParams)
      const news = result.data || []

      structuredLogger.info('Sports news fetched from database', {
        sport,
        league,
        teamId,
        playerId,
        newsType,
        source,
        limit,
        hours,
        count: news.length
      })

      return {
        success: true,
        data: news,
        meta: {
          source: 'database',
          count: news.length,
          ...(sport && sport !== 'all' && { sport }),
          ...(league && { league }),
          ...(teamId && { teamId }),
          ...(playerId && { playerId }),
          ...(newsType && { newsType }),
          ...(source && { newsSource: source }),
          limit,
          hours,
          refreshed: false,
          timestamp: new Date().toISOString()
        }
      }

    } catch (error) {
      structuredLogger.error('Failed to fetch sports news from database', {
        error: error instanceof Error ? error.message : String(error),
        params
      })

      return {
        success: false,
        data: [],
        meta: {
          source: 'database',
          count: 0,
          ...(params.sport && params.sport !== 'all' && { sport: params.sport }),
          refreshed: false,
          timestamp: new Date().toISOString()
        },
        error: error instanceof Error ? error.message : String(error)
      }
    }
  }
}

export const databaseFirstApiClient = DatabaseFirstApiClient.getInstance()
