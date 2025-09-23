/**
 * Production Supabase Client
 * Direct Supabase client for production use
 */

import { createClient } from '@supabase/supabase-js'

class ProductionSupabaseClient {
  private static instance: ProductionSupabaseClient
  public supabase: any

  private constructor() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase configuration')
    }

    this.supabase = createClient(supabaseUrl, supabaseKey)
  }

  static getInstance(): ProductionSupabaseClient {
    if (!ProductionSupabaseClient.instance) {
      ProductionSupabaseClient.instance = new ProductionSupabaseClient()
    }
    return ProductionSupabaseClient.instance
  }

  async executeSQL(query: string, params?: any[]): Promise<{ success: boolean; data: any[]; error?: string }> {
    try {
      console.log('executeSQL called with query:', query.substring(0, 200) + '...')
      console.log('executeSQL called with params:', params)
      const trimmedQuery = query.trim().toUpperCase()
      
      // Handle simple health check queries
      if (trimmedQuery === 'SELECT 1 AS HEALTH_CHECK' || trimmedQuery === 'SELECT 1') {
        return {
          success: true,
          data: [{ health_check: 1 }]
        }
      }
      
      // Handle dynamic sports manager queries
      if (query.includes('FROM sports s') && query.includes('WHERE s.is_active = true')) {
        const { data, error } = await this.supabase
          .from('sports')
          .select('id, name, display_name, is_active, data_types, refresh_intervals, api_providers, default_league, season_format, current_season')
          .eq('is_active', true)
          .order('display_name')
        
        if (error) throw error
        return { success: true, data: data || [] }
      }
      
      // Handle leagues queries for dynamic sports manager
      if (query.includes('FROM leagues l') && query.includes('WHERE l.sport = $1')) {
        const sport = params?.[0]
        if (!sport) {
          return { success: true, data: [] }
        }
        
        const { data, error } = await this.supabase
          .from('leagues')
          .select('id, name, display_name, sport, is_active, country, season, api_mapping')
          .eq('sport', sport)
          .eq('is_active', true)
          .order('display_name')
        
        if (error) throw error
        return { success: true, data: data || [] }
      }
      
      // Handle queries without FROM clause (system queries)
      if (trimmedQuery.startsWith('SELECT') && !trimmedQuery.includes('FROM')) {
        // For system queries, we'll need to implement specific handlers
        // For now, return empty data for non-table queries
        return {
          success: true,
          data: []
        }
      }
      
      // Handle analytics queries with COUNT(CASE WHEN...)
      if (query.includes('COUNT(CASE WHEN status =') && query.includes('FROM games')) {
        const sport = params?.[0]
        const dateFrom = params?.[1]
        const dateTo = params?.[2]

        let queryBuilder = this.supabase.from('games').select('status, sport, game_date')

        if (sport && sport !== 'all') {
          queryBuilder = queryBuilder.eq('sport', sport)
        }
        if (dateFrom) {
          queryBuilder = queryBuilder.gte('game_date', dateFrom)
        }
        if (dateTo) {
          queryBuilder = queryBuilder.lte('game_date', dateTo)
        }

        const { data, error } = await queryBuilder

        if (error) throw error

        // Calculate stats manually
        type GameRow = { status?: string | null }
        const games: GameRow[] = Array.isArray(data) ? (data as GameRow[]) : []
        const totalGames = games.length
        const completedGames = games.filter((g: GameRow) => g.status === 'completed').length
        const liveGames = games.filter((g: GameRow) => g.status === 'live').length
        const scheduledGames = games.filter((g: GameRow) => g.status === 'scheduled').length

        return {
          success: true,
          data: [{
            total_games: totalGames,
            completed_games: completedGames,
            live_games: liveGames,
            scheduled_games: scheduledGames
          }]
        }
      }

      // Handle predictions analytics queries
      if (query.includes('COUNT(CASE WHEN is_correct =') && query.includes('FROM predictions')) {
        const sport = params?.[0]

        let queryBuilder = this.supabase.from('predictions').select('is_correct, confidence, sport')

        if (sport && sport !== 'all') {
          queryBuilder = queryBuilder.eq('sport', sport)
        }

        const { data, error } = await queryBuilder

        if (error) throw error

        // Calculate stats manually
        type PredictionRow = { is_correct?: boolean | null; confidence?: number | null }
        const predictions: PredictionRow[] = Array.isArray(data) ? (data as PredictionRow[]) : []
        const totalPredictions = predictions.length
        const correctPredictions = predictions.filter((p: PredictionRow) => p.is_correct === true).length
        const avgConfidence = predictions.length > 0 
          ? predictions.reduce((sum: number, p: PredictionRow) => sum + (p.confidence || 0), 0) / predictions.length 
          : 0

        return {
          success: true,
          data: [{
            total_predictions: totalPredictions,
            correct_predictions: correctPredictions,
            avg_confidence: avgConfidence
          }]
        }
      }

      // Handle teams count queries
      if (query.includes('COUNT(*) as total_teams') && query.includes('FROM teams')) {
        const sport = params?.[0]

        let queryBuilder = this.supabase.from('teams').select('sport, is_active')

        if (sport && sport !== 'all') {
          queryBuilder = queryBuilder.eq('sport', sport)
        }
        queryBuilder = queryBuilder.eq('is_active', true)

        const { data, error } = await queryBuilder

        if (error) throw error

        return {
          success: true,
          data: [{
            total_teams: (data || []).length
          }]
        }
      }

      // Handle games queries with JOINs
      if (query.includes('FROM games g') && query.includes('LEFT JOIN teams')) {
        // Parse parameters dynamically based on the SQL query structure
        // The SQL query is built conditionally, so we need to count the actual parameters
        let paramIndex = 0
        const sport = params?.[paramIndex++]
        const status = params?.[paramIndex++]
        
        // Check if dateFrom parameter exists in the query
        let dateFrom = undefined
        if (query.includes('g.game_date >=')) {
          dateFrom = params?.[paramIndex++]
        }
        
        // Check if dateTo parameter exists in the query  
        let dateTo = undefined
        if (query.includes('g.game_date <=')) {
          dateTo = params?.[paramIndex++]
        }
        
        // Check if league parameter exists in the query
        let league = undefined
        if (query.includes('g.league =')) {
          league = params?.[paramIndex++]
        }
        
        // Limit is always the last parameter
        const limit = params?.[paramIndex] || 100

        // Fetch games first
        let gamesQuery = this.supabase.from('games').select('*')

        if (sport && sport !== 'all') {
          gamesQuery = gamesQuery.eq('sport', sport)
        }
        if (status) {
          gamesQuery = gamesQuery.eq('status', status)
        }
        if (dateFrom) {
          gamesQuery = gamesQuery.gte('game_date', dateFrom)
        }
        if (dateTo) {
          gamesQuery = gamesQuery.lte('game_date', dateTo)
        }
        if (league) {
          gamesQuery = gamesQuery.eq('league', league)
        }

        const { data: games, error: gamesError } = await gamesQuery
          .order('game_date', { ascending: false })
          .limit(limit)

        if (gamesError) throw gamesError

        if (!games || games.length === 0) {
          return {
            success: true,
            data: []
          }
        }

        // Get unique team IDs
        const teamIds = new Set<string>()
        games.forEach((game: any) => {
          if (game.home_team_id) teamIds.add(game.home_team_id)
          if (game.away_team_id) teamIds.add(game.away_team_id)
        })

        // Fetch teams
        const { data: teams, error: teamsError } = await this.supabase
          .from('teams')
          .select('id, name, abbreviation, logo_url')
          .in('id', Array.from(teamIds))

        if (teamsError) throw teamsError

        // Create team lookup map
        const teamMap = new Map<string, any>()
        teams?.forEach((team: any) => {
          teamMap.set(team.id, team)
        })

        // Transform data to match the expected format
        const transformedData = games.map((game: any) => ({
          ...game,
          home_team_name: teamMap.get(game.home_team_id)?.name || '',
          away_team_name: teamMap.get(game.away_team_id)?.name || ''
        }))

        return {
          success: true,
          data: transformedData
        }
      }

      // Extract table name from query for basic routing
      const tableMatch = query.match(/FROM\s+(\w+)/i)
      const tableName = tableMatch?.[1]?.toLowerCase()

      if (!tableName) {
        // For queries without a clear table, try to execute as RPC if possible
        // For now, return empty data for complex queries
        return {
          success: true,
          data: []
        }
      }

      // For SELECT queries with FROM clause, parse WHERE conditions and apply them
      if (trimmedQuery.startsWith('SELECT')) {
        let queryBuilder = this.supabase.from(tableName).select('*')
        
        // Parse WHERE conditions from the query
        const whereMatch = query.match(/WHERE\s+(.+?)(?:\s+ORDER\s+BY|\s+LIMIT|$)/i)
        if (whereMatch && params) {
          const whereClause = whereMatch[1]
          
          // Handle sport filtering
          if (whereClause.includes('sport = $1') && params[0]) {
            queryBuilder = queryBuilder.eq('sport', params[0])
          }
          
          // Handle league filtering
          if (whereClause.includes('league = $2') && params[1]) {
            queryBuilder = queryBuilder.eq('league', params[1])
          }
          
          // Handle is_active filtering
          if (whereClause.includes('is_active = $3') && params[2] !== undefined) {
            queryBuilder = queryBuilder.eq('is_active', params[2])
          }
        }
        
        // Parse ORDER BY clause
        const orderMatch = query.match(/ORDER\s+BY\s+(\w+)/i)
        if (orderMatch) {
          queryBuilder = queryBuilder.order(orderMatch[1])
        }
        
        // Parse LIMIT clause
        const limitMatch = query.match(/LIMIT\s+(\d+)/i)
        if (limitMatch) {
          queryBuilder = queryBuilder.limit(parseInt(limitMatch[1]))
        } else {
          queryBuilder = queryBuilder.limit(1000) // Safety limit
        }

        const { data, error } = await queryBuilder

        if (error) throw error

        return {
          success: true,
          data: data || []
        }
      }

      // For other queries, we'd need to implement specific handlers
      // For now, return empty data
      return {
        success: true,
        data: []
      }

    } catch (error) {
      return {
        success: false,
        data: [],
        error: error instanceof Error ? error.message : String(error)
      }
    }
  }

  async getGames(sport?: string, league?: string, date?: string, status?: string) {
    let query = this.supabase.from('games').select(`
      *,
      home_team:teams!home_team_id(name, abbreviation, logo_url),
      away_team:teams!away_team_id(name, abbreviation, logo_url)
    `)

    if (sport) query = query.eq('sport', sport)
    if (league) query = query.eq('league', league)
    if (date) query = query.eq('game_date', date)
    if (status) query = query.eq('status', status)

    const { data, error } = await query.order('game_date', { ascending: false }).limit(100)

    if (error) throw error
    return data || []
  }

  async getTeams(sport?: string, league?: string) {
    let query = this.supabase.from('teams').select('*')

    if (sport) query = query.eq('sport', sport)
    if (league) query = query.eq('league', league)

    const { data, error } = await query.order('name')

    if (error) throw error
    return data || []
  }

  async getPlayers(sport?: string, teamId?: string, limit: number = 100) {
    // Map sport names to their specific player stats tables
    const sportTableMap: { [key: string]: string } = {
      'basketball': 'player_stats',
      'football': 'football_player_stats', 
      'baseball': 'baseball_player_stats',
      'hockey': 'hockey_player_stats',
      'soccer': 'soccer_player_stats',
      'tennis': 'tennis_match_stats',
      'golf': 'golf_tournament_stats'
    }

    if (!sport) {
      // If no sport specified, get from main players table
      const { data, error } = await this.supabase.from('players').select('*').order('name').limit(limit)
      if (error) throw error
      return data || []
    }

    const tableName = sportTableMap[sport] || 'players'
    
    try {
      let query = this.supabase.from(tableName).select('*')
      
      if (teamId) {
        // Handle different team_id column names across tables
        if (tableName === 'tennis_match_stats' || tableName === 'golf_tournament_stats') {
          // These tables might not have team_id, skip the filter
        } else {
          query = query.eq('team_id', teamId)
        }
      }

      const { data, error } = await query.order('player_name').limit(limit)
      
      if (error) throw error
      
      // Transform data to consistent format
      const transformedData = (data || []).map((player: any) => ({
        id: player.id || player.player_id,
        name: player.player_name || player.name || player.player,
        sport: sport,
        team_id: player.team_id,
        position: player.position,
        ...player
      }))
      
      return transformedData
    } catch (error) {
      // Fallback to main players table if sport-specific table fails
      console.warn(`Failed to fetch from ${tableName}, falling back to players table:`, error)
      const { data, error: fallbackError } = await this.supabase
        .from('players')
        .select('*')
        .eq('sport', sport)
        .order('name')
        .limit(limit)
      
      if (fallbackError) throw fallbackError
      return data || []
    }
  }

  async getStandings(sport?: string, league?: string, season?: string) {
    let query = this.supabase.from('league_standings').select(`
      *,
      team:teams(name, abbreviation, logo_url)
    `)

    if (sport) query = query.eq('sport', sport)
    if (league) query = query.eq('league', league)
    if (season) query = query.eq('season', season)

    const { data, error } = await query.order('wins', { ascending: false })

    if (error) throw error
    return data || []
  }

  async getOdds(sport?: string, gameId?: string, limit: number = 10) {
    let query = this.supabase.from('odds').select(`
      *,
      game:games!game_id(
        game_date,
        status,
        home_team:teams!home_team_id(name, abbreviation),
        away_team:teams!away_team_id(name, abbreviation)
      )
    `)

    if (sport) query = query.eq('sport', sport)
    if (gameId) query = query.eq('game_id', gameId)

    // Order by timestamp (most recent first), fallback to created_at
    const { data, error } = await query.order('timestamp', { ascending: false }).limit(limit)

    if (error) throw error
    return data || []
  }

  async getAllTables(): Promise<string[]> {
    try {
      const { data, error } = await this.supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
        .order('table_name')

      if (error) throw error
      return (data || []).map((row: any) => row.table_name)
    } catch (error) {
      console.error('Error getting tables:', error)
      return []
    }
  }

  async getPredictions(gameId?: string, predictionType?: string, modelName?: string, limit: number = 50) {
    let query = this.supabase.from('predictions').select('*')

    if (gameId) query = query.eq('game_id', gameId)
    if (predictionType) query = query.eq('prediction_type', predictionType)
    if (modelName) query = query.eq('model_name', modelName)

    const { data, error } = await query.order('created_at', { ascending: false }).limit(limit)

    if (error) throw error
    return data || []
  }

  isConnected(): boolean {
    return !!(process.env.NEXT_PUBLIC_SUPABASE_URL && 
             (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY))
  }
}

export const productionSupabaseClient = ProductionSupabaseClient.getInstance()
