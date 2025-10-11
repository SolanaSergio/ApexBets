/**
 * Production Supabase Client
 * Direct Supabase client for production use
 */

import { createClient } from '@supabase/supabase-js'
import { structuredLogger } from '@/lib/services/structured-logger'

class ProductionSupabaseClient {
  private static instance: ProductionSupabaseClient
  public supabase: any
  private initialized: boolean = false

  private constructor() {
    // Server-side only - prevent browser instantiation
    if (typeof window !== 'undefined') {
      throw new Error('ProductionSupabaseClient can only be instantiated on the server side')
    }

    // Don't initialize during build phase or when environment variables are not available
    if (process.env.NEXT_PHASE === 'phase-production-build') {
      this.supabase = null
      this.initialized = false
      return
    }

    try {
      structuredLogger.info('Initializing ProductionSupabaseClient', {
        service: 'supabase-client',
        step: 'constructor-start',
      })

      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseKey =
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

      // Log environment variable presence (not values for security)
      structuredLogger.info('Checking Supabase environment variables', {
        service: 'supabase-client',
        hasUrl: !!supabaseUrl,
        hasServiceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        usingServiceRole: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      })

      if (!supabaseUrl || !supabaseKey) {
        const missingVars = []
        if (!supabaseUrl) missingVars.push('NEXT_PUBLIC_SUPABASE_URL')
        if (!supabaseKey)
          missingVars.push('SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY')

        structuredLogger.error('Missing Supabase configuration', {
          service: 'supabase-client',
          missingVariables: missingVars,
        })
        this.supabase = null
        this.initialized = false
        return
      }

      structuredLogger.info('Creating Supabase client', {
        service: 'supabase-client',
        urlLength: supabaseUrl.length,
        keyLength: supabaseKey.length,
      })

      this.supabase = createClient(supabaseUrl, supabaseKey)
      this.initialized = true

      structuredLogger.info('ProductionSupabaseClient initialized successfully', {
        service: 'supabase-client',
        step: 'constructor-complete',
      })
    } catch (error) {
      structuredLogger.error('Failed to initialize ProductionSupabaseClient', {
        service: 'supabase-client',
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      })
      this.supabase = null
      this.initialized = false
    }
  }

  static getInstance(): ProductionSupabaseClient {
    if (!ProductionSupabaseClient.instance) {
      ProductionSupabaseClient.instance = new ProductionSupabaseClient()
    }
    return ProductionSupabaseClient.instance
  }

  private ensureInitialized(): void {
    if (!this.initialized || !this.supabase) {
      throw new Error(
        'Supabase client not initialized. This may occur during build phase or when environment variables are not available.'
      )
    }
  }

  async rpc(name: string, params: any): Promise<{ success: boolean; data: any[]; error?: string }> {
    try {
      this.ensureInitialized()

      // Add timeout to prevent hanging
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('RPC timeout after 10 seconds')), 10000)
      })

      const rpcPromise = this.supabase
        .rpc(name, params)
        .then(({ data, error }: { data: any; error: any }) => {
          if (error) throw error
          return { success: true, data: data || [] }
        })

      return await Promise.race([rpcPromise, timeoutPromise])
    } catch (error) {
      return {
        success: false,
        data: [],
        error: error instanceof Error ? error.message : String(error),
      }
    }
  }

  async raw(
    query: string,
    params?: any[]
  ): Promise<{ success: boolean; data: any[]; error?: string }> {
    try {
      this.ensureInitialized()

      // Use Supabase client methods instead of raw SQL
      if (query.trim().toLowerCase().startsWith('select')) {
        return await this.fallbackSelectQuery(query, params)
      }

      // For non-SELECT queries, use appropriate Supabase methods
      // This should be replaced with proper Supabase Edge Function calls
      console.warn('Raw SQL queries should be replaced with Supabase Edge Functions')
      return {
        success: false,
        data: [],
        error: 'Raw SQL queries are not supported. Use Supabase Edge Functions instead.',
      }
    } catch (error) {
      return {
        success: false,
        data: [],
        error: error instanceof Error ? error.message : String(error),
      }
    }
  }

  private async fallbackSelectQuery(
    query: string,
    params?: any[]
  ): Promise<{ success: boolean; data: any[]; error?: string }> {
    try {
      this.ensureInitialized()

      // Handle common SELECT query patterns

      // Sports queries
      if (query.includes('FROM sports')) {
        if (query.includes('is_active = true')) {
          const { data, error } = await this.supabase
            .from('sports')
            .select('*')
            .eq('is_active', true)
            .order('name')

          if (error) throw error
          return { success: true, data: data || [] }
        }

        // Generic sports query
        const { data, error } = await this.supabase.from('sports').select('*').order('name')

        if (error) throw error
        return { success: true, data: data || [] }
      }

      // Teams queries
      if (query.includes('FROM teams')) {
        let teamsQuery = this.supabase.from('teams').select('*')

        // Handle name and sport parameters (for specific team lookup)
        if (
          params &&
          params.length >= 2 &&
          query.includes('name = $1') &&
          query.includes('sport = $2')
        ) {
          teamsQuery = teamsQuery.eq('name', params[0]).eq('sport', params[1])
        }
        // Handle sport parameter only
        else if (params && params.length > 0 && query.includes('sport = $1')) {
          teamsQuery = teamsQuery.eq('sport', params[0])
        }

        // Handle is_active parameter
        if (query.includes('is_active = true')) {
          teamsQuery = teamsQuery.eq('is_active', true)
        }

        // Handle LIMIT
        if (query.includes('LIMIT 1')) {
          teamsQuery = teamsQuery.limit(1)
        }

        const { data, error } = await teamsQuery.order('name')
        if (error) throw error
        return { success: true, data: data || [] }
      }

      // Games queries
      if (query.includes('FROM games')) {
        let gamesQuery = this.supabase.from('games').select('*')

        // Handle sport parameter
        if (params && params.length > 0 && query.includes('sport = $1')) {
          gamesQuery = gamesQuery.eq('sport', params[0])
        }

        // Handle status parameter
        if (params && params.length > 1 && query.includes('status = $2')) {
          gamesQuery = gamesQuery.eq('status', params[1])
        }

        const { data, error } = await gamesQuery.order('game_date', { ascending: false })
        if (error) throw error
        return { success: true, data: data || [] }
      }

      // Generic fallback - return empty result for unsupported queries
      return { success: true, data: [] }
    } catch (error) {
      return {
        success: false,
        data: [],
        error: error instanceof Error ? error.message : String(error),
      }
    }
  }

  // Backward compatibility method - maps to raw function
  async executeSQL(
    query: string,
    params?: any[]
  ): Promise<{ success: boolean; data: any[]; error?: string }> {
    try {
      this.ensureInitialized()
      const result = await this.raw(query, params)
      return result
    } catch (error) {
      console.error('executeSQL error:', error)
      return {
        success: false,
        data: [],
        error: error instanceof Error ? error.message : String(error),
      }
    }
  }

  async getGames(sport?: string, league?: string, date?: string, status?: string) {
    try {
      this.ensureInitialized()

      structuredLogger.info('Executing getGames query', {
        service: 'supabase-client',
        method: 'getGames',
        sport,
        league,
        date,
        status,
      })

      // Add timeout to prevent hanging
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('getGames timeout after 10 seconds')), 10000)
      })

      const queryPromise = (async () => {
        let query = this.supabase.from('games').select(`
          *,
          home_team:teams!home_team_id(name, abbreviation, logo_url),
          away_team:teams!away_team_id(name, abbreviation, logo_url)
        `)

        if (sport) query = query.eq('sport', sport)
        if (league) query = query.eq('league_name', league)
        if (date) query = query.eq('game_date', date)
        if (status) query = query.eq('status', status)

        const { data, error } = await query.order('game_date', { ascending: false }).limit(100)

        if (error) {
          structuredLogger.error('getGames query failed', {
            service: 'supabase-client',
            method: 'getGames',
            error: error.message,
            code: error.code,
            details: error.details,
            hint: error.hint,
          })
          throw error
        }

        structuredLogger.info('getGames query successful', {
          service: 'supabase-client',
          method: 'getGames',
          resultCount: data?.length || 0,
        })

        return data || []
      })()

      return await Promise.race([queryPromise, timeoutPromise])
    } catch (error) {
      structuredLogger.error('getGames method failed', {
        service: 'supabase-client',
        method: 'getGames',
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      })
      throw error
    }
  }

  async getTeams(sport?: string, league?: string) {
    this.ensureInitialized()
    let query = this.supabase.from('teams').select('*')

    if (sport) query = query.eq('sport', sport)
    if (league) query = query.eq('league_name', league)

    const { data, error } = await query.order('name')

    if (error) throw error
    return data || []
  }

  async getPlayers(sport?: string, teamId?: string, limit: number = 100) {
    this.ensureInitialized()
    // Map sport names to their specific player tables
    const sportTableMap: { [key: string]: string } = {
      basketball: 'player_profiles',
      football: 'player_profiles',
      baseball: 'player_profiles',
      hockey: 'player_profiles',
      soccer: 'player_profiles',
      tennis: 'player_profiles',
      golf: 'player_profiles',
    }

    if (!sport) {
      // If no sport specified, get from main players table
      const { data, error } = await this.supabase
        .from('players')
        .select('*')
        .order('name')
        .limit(limit)
      if (error) throw error
      return data || []
    }

    const tableName = sportTableMap[sport] || 'players'

    try {
      let query = this.supabase.from(tableName).select(`
        *,
        team:teams!player_profiles_team_id_fkey(
          id, name, abbreviation, logo_url, city, league_name, sport
        )
      `)

      // Always filter by sport for player_profiles table
      if (tableName === 'player_profiles') {
        query = query.eq('sport', sport)
      }

      if (teamId) {
        // Handle different team_id column names across tables
        if (tableName === 'tennis_match_stats' || tableName === 'golf_tournament_stats') {
          // These tables might not have team_id, skip the filter
        } else {
          query = query.eq('team_id', teamId)
        }
      }

      const { data, error } = await query.order('name').limit(limit)

      if (error) throw error

      // Transform data to consistent format
      const transformedData = (data || []).map((player: any) => ({
        id: player.id || player.player_id,
        name: player.player_name || player.name || player.player,
        sport: sport,
        team_id: player.team_id,
        position: player.position,
        team_name: player.team?.name || null,
        team_abbreviation: player.team?.abbreviation || '',
        team_logo: player.team?.logo_url || null,
        team_city: player.team?.city || '',
        team_league: player.team?.league_name || '',
        team_sport: player.team?.sport || sport,
        ...player,
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
    this.ensureInitialized()
    let query = this.supabase.from('league_standings').select(`
      *,
      team:teams(name, abbreviation, logo_url)
    `)

    if (sport) query = query.eq('sport', sport)
    if (league) query = query.eq('league_name', league)
    if (season) query = query.eq('season', season)

    const { data, error } = await query.order('wins', { ascending: false })

    if (error) throw error
    return data || []
  }

  async getOdds(sport?: string, gameId?: string, limit: number = 10) {
    this.ensureInitialized()
    let query = this.supabase.from('betting_odds').select(`
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
    const { data, error } = await query.order('last_updated', { ascending: false }).limit(limit)

    if (error) throw error
    return data || []
  }

  async getAllTables(): Promise<string[]> {
    try {
      this.ensureInitialized()
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

  async getPredictions(
    gameId?: string,
    predictionType?: string,
    modelName?: string,
    limit: number = 50
  ) {
    this.ensureInitialized()
    let query = this.supabase.from('predictions').select('*')

    if (gameId) query = query.eq('game_id', gameId)
    if (predictionType) query = query.eq('prediction_type', predictionType)
    if (modelName) query = query.eq('model_name', modelName)

    const { data, error } = await query.order('created_at', { ascending: false }).limit(limit)

    if (error) throw error
    return data || []
  }

  isConnected(): boolean {
    return (
      this.initialized &&
      !!(
        process.env.NEXT_PUBLIC_SUPABASE_URL &&
        (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
      )
    )
  }

  async invoke(functionName: string, body: any): Promise<{ success: boolean; data: any; error?: string }> {
    try {
      this.ensureInitialized()

      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error(`Edge function '${functionName}' timeout after 15 seconds`)), 15000)
      })

      const invokePromise = this.supabase.functions.invoke(functionName, { body })

      const { data, error } = await Promise.race([invokePromise, timeoutPromise])

      if (error) {
        throw error
      }

      return { success: true, data }
    } catch (error) {
      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : String(error),
      }
    }
  }
}

export const productionSupabaseClient = ProductionSupabaseClient.getInstance()
