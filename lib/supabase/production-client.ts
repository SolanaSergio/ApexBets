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

  async rpc(name: string, params: any): Promise<{ success: boolean; data: any[]; error?: string }> {
    try {
      const { data, error } = await this.supabase.rpc(name, params)
      if (error) throw error
      return { success: true, data: data || [] }
    } catch (error) {
      return {
        success: false,
        data: [],
        error: error instanceof Error ? error.message : String(error)
      }
    }
  }

  async raw(query: string, params?: any[]): Promise<{ success: boolean; data: any[]; error?: string }> {
    try {
      const { data, error } = await this.supabase.rpc('execute_sql', { query, params })
      if (error) throw error
      return { success: true, data: data || [] }
    } catch (error) {
      return {
        success: false,
        data: [],
        error: error instanceof Error ? error.message : String(error)
      }
    }
  }

  // Backward compatibility method - maps to raw function
  async executeSQL(query: string, params?: any[]): Promise<{ success: boolean; data: any[]; error?: string }> {
    try {
      const result = await this.raw(query, params)
      return result
    } catch (error) {
      console.error('executeSQL error:', error)
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
