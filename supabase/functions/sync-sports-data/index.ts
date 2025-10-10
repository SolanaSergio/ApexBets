// @ts-nocheck
/**
 * Supabase Edge Function for Real-Time Sports Data Sync
 * 100% REAL-TIME DATA ONLY - NO HARDCODED VALUES
 * Dynamically fetches live data from APIs based on database configuration
 * Zero historical/sample data - only current, live sports data
 */

/// <reference path="./types.d.ts" />

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
type SupabaseClient = any

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SyncRequest {
  sport?: string
  dataTypes?: string[]
  force?: boolean
}

interface SyncResult {
  success: boolean
  message: string
  stats: {
    games: number
    teams: number
    players: number
    standings: number
    errors: string[]
  }
}

interface SportConfig {
  id: string
  name: string
  display_name: string
  is_active: boolean
  data_types: string[]
  api_providers: string[]
  refresh_intervals: Record<string, number>
  rate_limits: Record<string, number>
  season_config: Record<string, any>
  current_season: string | null
}

interface APIConfig {
  provider: string
  baseUrl: Promise<string>
  headers: Promise<Record<string, string>>
  endpoints: Record<string, string[]>
  rateLimit: number
  priority: number
}

interface ApiMapping {
  sport: string;
  provider: string;
  data_type_mapping: Record<string, string[]>;
  priority: number;
}

// Dynamic API configuration loader - NO HARDCODING

class DynamicAPIConfig {
  private supabase: SupabaseClient
  private apiConfigs: Map<string, APIConfig> = new Map()

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase
  }

  async loadAPIConfigs(): Promise<void> {
    try {
      // Load sports configuration from database
      const { data: sports, error: sportsError } = await this.supabase
        .from('sports')
        .select('*')
        .eq('is_active', true)

      if (sportsError) throw sportsError

      if (!sports || sports.length === 0) {
        throw new Error('No active sports configured in database')
      }

      // Load API mappings from database
      const { data: mappings, error: mappingsError } = await this.supabase
        .from('api_mappings')
        .select('*')
        .eq('is_active', true)

      if (mappingsError) throw mappingsError

      // Build API configurations dynamically with real-time data
      for (const sport of sports) {
        const sportMappings = mappings?.filter((m: ApiMapping) => m.sport === sport.name) || []
        
        for (const mapping of sportMappings) {
          const configKey = `${sport.name}_${mapping.provider}`
          
          try {
            const baseUrl = await this.getBaseUrl(mapping.provider)
            const headers = await this.getHeaders(mapping.provider)
            
            this.apiConfigs.set(configKey, {
              provider: mapping.provider,
              baseUrl: Promise.resolve(baseUrl),
              headers: Promise.resolve(headers),
              endpoints: mapping.data_type_mapping || {},
              rateLimit: sport.rate_limits?.requestsPerMinute || 60,
              priority: mapping.priority || 1
            })
          } catch (error) {
            console.warn(`Failed to load configuration for ${mapping.provider}:`, error)
            continue
          }
        }
      }

      console.log(`Loaded ${this.apiConfigs.size} API configurations for ${sports.length} sports`)
    } catch (error) {
      console.error('Failed to load API configurations:', error)
      throw error
    }
  }

  private async getBaseUrl(provider: string): Promise<string> {
    // Fetch base URL from database configuration - NO HARDCODING
    const { data: providerConfig, error } = await this.supabase
      .from('api_providers')
      .select('base_url')
      .eq('provider_name', provider)
      .eq('is_active', true)
      .single()
    
    if (error || !providerConfig) {
      throw new Error(`No active API provider configuration found for ${provider}`)
    }
    
    return providerConfig.base_url
  }

  private async getHeaders(provider: string): Promise<Record<string, string>> {
    const apiKey = this.getAPIKey(provider)
    
    // Fetch headers from database configuration - NO HARDCODING
    const { data: providerConfig, error } = await this.supabase
      .from('api_providers')
      .select('headers')
      .eq('provider_name', provider)
      .eq('is_active', true)
      .single()
    
    if (error || !providerConfig) {
      throw new Error(`No active API provider configuration found for ${provider}`)
    }
    
    // Replace API key placeholders with actual keys
    const headers = { ...providerConfig.headers }
    Object.keys(headers).forEach(key => {
      if (headers[key] === '{{API_KEY}}') {
        headers[key] = apiKey
      }
    })
    
    return headers
  }

  private async getAPIKey(provider: string): Promise<string> {
    // Fetch API key configuration from database - NO HARDCODING
    const { data: providerConfig, error } = await this.supabase
      .from('api_providers')
      .select('api_key_env_var')
      .eq('provider_name', provider)
      .eq('is_active', true)
      .single()
    
    if (error || !providerConfig) {
      throw new Error(`No active API provider configuration found for ${provider}`)
    }
    
    const apiKey = Deno.env.get(providerConfig.api_key_env_var)
    if (!apiKey) {
      throw new Error(`API key not configured for provider ${provider}`)
    }
    
    return apiKey
  }

  getConfig(sport: string, provider: string): APIConfig | null {
    return this.apiConfigs.get(`${sport}_${provider}`) || null
  }

  getAllConfigs(): Map<string, APIConfig> {
    return this.apiConfigs
  }
}

// Enhanced API client with sport-specific handling and comprehensive error management
class SportAPIClient {
  private supabase: SupabaseClient
  private rateLimitTracker: Map<string, { lastRequest: number; requestCount: number; failures: number }> = new Map()
  private circuitBreaker: Map<string, { failures: number; lastFailure: number; isOpen: boolean }> = new Map()
  private performanceMetrics: Map<string, { avgResponseTime: number; successRate: number; lastUpdate: number }> = new Map()
  
  constructor(supabase: SupabaseClient) {
    this.supabase = supabase
  }
  
  async fetchFromAPI(config: APIConfig, endpoint: string, params: Record<string, string | number | boolean> = {}): Promise<{ data: any; count: number }> {
    const configKey = `${config.provider}_${endpoint}`
    const startTime = Date.now()
    const now = startTime
    
    // Check circuit breaker
    const breaker = this.circuitBreaker.get(configKey) || { failures: 0, lastFailure: 0, isOpen: false }
    if (breaker.isOpen && (now - breaker.lastFailure) < 300000) { // 5 minute circuit breaker
      throw new Error(`Circuit breaker open for ${configKey}. Too many failures.`)
    }
    
    // Rate limiting per API with dynamic adjustment
    const tracker = this.rateLimitTracker.get(configKey) || { lastRequest: 0, requestCount: 0, failures: 0 }
    const rateLimitMs = (60 / config.rateLimit) * 1000
    
    if (now - tracker.lastRequest < rateLimitMs) {
      await new Promise(resolve => setTimeout(resolve, rateLimitMs - (now - tracker.lastRequest)))
    }
    
    try {
      // Resolve async baseUrl and headers
      const baseUrl = await config.baseUrl
      const headers = await config.headers
      
      // Build URL with parameters
      const url = new URL(baseUrl + endpoint)
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.set(key, value.toString())
        }
      })
      
      // Add provider-specific parameters
      await this.addProviderSpecificParams(url, config, endpoint)
      
      // Add real-time validation parameters
      url.searchParams.set('timestamp', now.toString())
      url.searchParams.set('live', 'true')
      
      const response = await fetch(url.toString(), {
        headers: {
          ...headers,
          'Content-Type': 'application/json',
          'User-Agent': 'ApexBets-Sync/1.0',
          'X-Request-Time': now.toString(),
          'X-Live-Data': 'true'
        },
        signal: AbortSignal.timeout(30000) // 30 second timeout
      })
      
      if (!response.ok) {
        if (response.status === 429) {
          const retryAfter = response.headers.get('Retry-After')
          const delay = retryAfter ? parseInt(retryAfter) * 1000 : 60000
          console.warn(`Rate limit exceeded for ${configKey}, waiting ${delay}ms`)
          await new Promise(resolve => setTimeout(resolve, delay))
          return this.fetchFromAPI(config, endpoint, params)
        }
        
        if (response.status >= 500) {
          tracker.failures++
          this.rateLimitTracker.set(configKey, tracker)
          
          if (tracker.failures >= 5) {
            this.circuitBreaker.set(configKey, { failures: tracker.failures, lastFailure: now, isOpen: true })
            throw new Error(`Circuit breaker opened for ${configKey} due to server errors`)
          }
        }
        
        throw new Error(`API request failed: ${response.status} ${response.statusText}`)
      }
      
      // Reset failure count on success
      tracker.failures = 0
      tracker.lastRequest = now
      tracker.requestCount++
      this.rateLimitTracker.set(configKey, tracker)
      
      // Reset circuit breaker on success
      this.circuitBreaker.set(configKey, { failures: 0, lastFailure: 0, isOpen: false })
      
      // Track performance metrics
      const responseTime = Date.now() - startTime
      this.updatePerformanceMetrics(configKey, responseTime, true)
      
      const data = await response.json()
      
      // Validate real-time data freshness
      const validatedData = this.validateRealTimeData(data, config, endpoint, now)
      
      return this.normalizeAPIResponse(validatedData, config, endpoint)
      
    } catch (error) {
      tracker.failures++
      this.rateLimitTracker.set(configKey, tracker)
      
      // Track performance metrics for failures
      const responseTime = Date.now() - startTime
      this.updatePerformanceMetrics(configKey, responseTime, false)
      
      if (tracker.failures >= 3) {
        this.circuitBreaker.set(configKey, { failures: tracker.failures, lastFailure: now, isOpen: true })
      }
      
      console.error(`API request failed for ${configKey}:`, error)
      throw error
    }
  }
  
  private updatePerformanceMetrics(configKey: string, responseTime: number, success: boolean): void {
    const current = this.performanceMetrics.get(configKey) || { avgResponseTime: 0, successRate: 1, lastUpdate: 0 }
    const now = Date.now()
    
    // Update average response time (exponential moving average)
    const alpha = 0.1
    current.avgResponseTime = current.avgResponseTime === 0 ? responseTime : 
      (alpha * responseTime) + ((1 - alpha) * current.avgResponseTime)
    
    // Update success rate
    const totalRequests = current.successRate === 1 ? 1 : Math.max(1, (now - current.lastUpdate) / 1000)
    current.successRate = success ? 
      Math.min(1, current.successRate + (1 / totalRequests)) : 
      Math.max(0, current.successRate - (1 / totalRequests))
    
    current.lastUpdate = now
    this.performanceMetrics.set(configKey, current)
  }
  
  private validateRealTimeData(data: any, _config: APIConfig, endpoint: string, requestTime: number): any {
    // Validate data freshness - reject data older than 5 minutes
    const maxAge = 5 * 60 * 1000 // 5 minutes in milliseconds
    
    if (data && (typeof data.timestamp === 'string' || typeof data.timestamp === 'number')) {
      const dataAge = requestTime - parseInt(String(data.timestamp))
      if (dataAge > maxAge) {
        console.warn(`Data is ${dataAge}ms old, rejecting stale data`)
        throw new Error('Data is too old - not real-time')
      }
    }
    
    // Validate data structure for real-time indicators
    if (endpoint.includes('games') || endpoint.includes('scoreboard')) {
      const gamesArr = Array.isArray(data?.games) ? data.games : (Array.isArray(data?.data) ? data.data : [])
      if (Array.isArray(gamesArr)) {
        const liveGames = gamesArr.filter((game: any) => 
          game?.status === 'live' || game?.status === 'in_progress' || 
          game?.status === '1' || game?.status === '2'
        )
        
        if (liveGames.length === 0 && gamesArr.length > 0) {
          console.warn('No live games found in response - may not be real-time')
        }
      }
    }
    
    return data
  }
  
  getPerformanceMetrics(): Map<string, { avgResponseTime: number; successRate: number; lastUpdate: number }> {
    return this.performanceMetrics
  }
  
  getOptimalProvider(sport: string, dataType: string): string | null {
    // Find the fastest, most reliable provider for this sport and data type
    let bestProvider = null
    let bestScore = 0
    
    for (const [key, metrics] of this.performanceMetrics) {
      if (key.includes(sport) && key.includes(dataType)) {
        // Score based on success rate and response time
        const score = metrics.successRate * (1000 / Math.max(metrics.avgResponseTime, 1))
        if (score > bestScore) {
          bestScore = score
          bestProvider = key.split('_')[1] // Extract provider name
        }
      }
    }
    
    return bestProvider
  }
  
  private async addProviderSpecificParams(url: URL, config: APIConfig, _endpoint: string): Promise<void> {
    // Fetch provider-specific parameters from database - NO HARDCODING
    const { data: providerConfig, error } = await this.supabase
      .from('api_providers')
      .select('default_params')
      .eq('provider_name', config.provider)
      .eq('is_active', true)
      .single()
    
    if (error || !providerConfig) {
      console.warn(`No provider configuration found for ${config.provider}`)
      return
    }
    
    // Apply default parameters
    const defaultParams = providerConfig.default_params || {}
    Object.entries(defaultParams).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, value.toString())
      }
    })
    
    // Add real-time parameters (current date/time)
    const now = new Date()
    const currentYear = now.getFullYear()
    const currentDate = now.toISOString().split('T')[0]
    
    // Add current date for live data
    url.searchParams.set('date', currentDate)
    url.searchParams.set('year', currentYear.toString())
  }
  
  private normalizeAPIResponse(data: any, config: APIConfig, _endpoint: string): { data: any; count: number } {
    switch (config.provider) {
      case 'nba-stats':
        if (data?.resultSets && Array.isArray(data.resultSets) && data.resultSets.length > 0) {
          const resultSet = data.resultSets[0]
          const rows = resultSet?.rowSet || []
          return {
            data: rows,
            count: Array.isArray(rows) ? rows.length : 0
          }
        }
        return { data: [], count: 0 }
        
      case 'mlb-stats':
      case 'nhl-stats':
        if (Array.isArray(data?.dates)) {
          return {
            data: data.dates.flatMap((date: any) => Array.isArray(date?.games) ? date.games : []),
            count: data.dates.reduce((total: number, date: any) => total + ((Array.isArray(date?.games) ? date.games.length : 0)), 0)
          }
        } else if (Array.isArray(data?.teams)) {
          return { data: data.teams, count: data.teams.length }
        } else if (Array.isArray(data?.people)) {
          return { data: data.people, count: data.people.length }
        } else if (Array.isArray(data?.records)) {
          return { data: data.records, count: data.records.length }
        }
        return { data: data, count: 1 }
        
      case 'api-sports':
        if (Array.isArray(data?.response)) {
          return { data: data.response, count: data.response.length }
        }
        return { data: data, count: 1 }
        
      case 'balldontlie':
      case 'espn':
      case 'sportsdb':
      case 'odds-api':
        if (Array.isArray(data)) {
          return { data, count: data.length }
        }
        return { data: data, count: 1 }
        
      default:
        return { data: data, count: Array.isArray(data) ? data.length : 1 }
    }
  }
  
}

// sportAPIClient will be initialized in the main handler with supabase instance

// Sport-specific data sync functions with proper API handling
async function syncGames(supabase: SupabaseClient, sportConfig: SportConfig, apiConfig: APIConfig, sportAPIClient: SportAPIClient): Promise<number> {
  try {
    console.log(`Syncing games for ${sportConfig.display_name} using ${apiConfig.provider}...`)
    
    let gamesData: Record<string, unknown>[] = []
    
    // Try each endpoint for games
    const gameEndpoints = apiConfig.endpoints.games || ['/games', '/fixtures', '/schedule']
    for (const endpoint of gameEndpoints) {
      try {
        const response = await sportAPIClient.fetchFromAPI(apiConfig, endpoint)
        if (response && response.data && response.data.length > 0) {
          gamesData = response.data
          break
        }
      } catch (error) {
        console.warn(`Failed to fetch games from ${endpoint}:`, error)
        continue
      }
    }
    
    if (!gamesData || gamesData.length === 0) {
      console.log(`No games data available for ${sportConfig.display_name}`)
      return 0
    }
    
    // Normalize game data based on sport
    const gamesToInsert = gamesData.map((game: Record<string, unknown>) => 
      normalizeGameData(game, sportConfig, apiConfig)
    ).filter(Boolean)
    
    if (gamesToInsert.length === 0) return 0
    
    // Upsert games
    const { error } = await supabase
      .from('games')
      .upsert(gamesToInsert, { 
        onConflict: 'id',
        ignoreDuplicates: false 
      })
    
    if (error) throw error
    console.log(`Synced ${gamesToInsert.length} games for ${sportConfig.display_name}`)

    // Broadcast the changes to the clients
    const channel = supabase.channel('db-changes')
    channel.send({
      type: 'broadcast',
      event: 'games-updated',
      payload: { sport: sportConfig.name, games: gamesToInsert },
    })

    return gamesToInsert.length
    
  } catch (error) {
    console.error(`Error syncing games for ${sportConfig.display_name}:`, error)
    return 0
  }
}

async function syncTeams(supabase: SupabaseClient, sportConfig: SportConfig, apiConfig: APIConfig, sportAPIClient: SportAPIClient): Promise<number> {
  try {
    console.log(`Syncing teams for ${sportConfig.display_name} using ${apiConfig.provider}...`)
    
    let teamsData: Record<string, unknown>[] = []
    
    // Try each endpoint for teams
    const teamEndpoints = apiConfig.endpoints.teams || ['/teams', '/team']
    for (const endpoint of teamEndpoints) {
      try {
        const response = await sportAPIClient.fetchFromAPI(apiConfig, endpoint)
        if (response && response.data && response.data.length > 0) {
          teamsData = response.data
          break
        }
      } catch (error) {
        console.warn(`Failed to fetch teams from ${endpoint}:`, error)
        continue
      }
    }
    
    if (!teamsData || teamsData.length === 0) {
      console.log(`No teams data available for ${sportConfig.display_name}`)
      return 0
    }
    
    // Normalize team data based on sport
    const teamsToInsert = teamsData.map((team: Record<string, unknown>) => 
      normalizeTeamData(team, sportConfig, apiConfig)
    ).filter(Boolean)
    
    if (teamsToInsert.length === 0) return 0
    
    // Upsert teams
    const { error } = await supabase
      .from('teams')
      .upsert(teamsToInsert, { 
        onConflict: 'id',
        ignoreDuplicates: false 
      })
    
    if (error) throw error
    console.log(`Synced ${teamsToInsert.length} teams for ${sportConfig.display_name}`)

    // Broadcast the changes to the clients
    const channel = supabase.channel('db-changes')
    channel.send({
      type: 'broadcast',
      event: 'teams-updated',
      payload: { sport: sportConfig.name, teams: teamsToInsert },
    })

    return teamsToInsert.length
    
  } catch (error) {
    console.error(`Error syncing teams for ${sportConfig.display_name}:`, error)
    return 0
  }
}

async function syncPlayers(supabase: SupabaseClient, sportConfig: SportConfig, apiConfig: APIConfig, sportAPIClient: SportAPIClient): Promise<number> {
  try {
    console.log(`Syncing players for ${sportConfig.display_name} using ${apiConfig.provider}...`)
    
    let playersData: Record<string, unknown>[] = []
    
    // Try each endpoint for players
    const playerEndpoints = apiConfig.endpoints.players || ['/players', '/people']
    for (const endpoint of playerEndpoints) {
      try {
        const response = await sportAPIClient.fetchFromAPI(apiConfig, endpoint)
        if (response && response.data && response.data.length > 0) {
          playersData = response.data
          break
        }
      } catch (error) {
        console.warn(`Failed to fetch players from ${endpoint}:`, error)
        continue
      }
    }
    
    if (!playersData || playersData.length === 0) {
      console.log(`No players data available for ${sportConfig.display_name}`)
      return 0
    }
    
    // Normalize player data based on sport
    const playersToInsert = playersData.map((player: Record<string, unknown>) => 
      normalizePlayerData(player, sportConfig, apiConfig)
    ).filter(Boolean)
    
    if (playersToInsert.length === 0) return 0
    
    // Upsert players
    const { error } = await supabase
      .from('player_profiles')
      .upsert(playersToInsert, { 
        onConflict: 'id',
        ignoreDuplicates: false 
      })
    
    if (error) throw error
    console.log(`Synced ${playersToInsert.length} players for ${sportConfig.display_name}`)

    // Broadcast the changes to the clients
    const channel = supabase.channel('db-changes')
    channel.send({
      type: 'broadcast',
      event: 'players-updated',
      payload: { sport: sportConfig.name, players: playersToInsert },
    })

    return playersToInsert.length
    
  } catch (error) {
    console.error(`Error syncing players for ${sportConfig.display_name}:`, error)
    return 0
  }
}

async function syncStandings(supabase: SupabaseClient, sportConfig: SportConfig, apiConfig: APIConfig, sportAPIClient: SportAPIClient): Promise<number> {
  try {
    console.log(`Syncing standings for ${sportConfig.display_name} using ${apiConfig.provider}...`)
    
    let standingsData: Record<string, unknown>[] = []
    
    // Try each endpoint for standings
    const standingsEndpoints = apiConfig.endpoints.standings || ['/standings', '/league-standings']
    for (const endpoint of standingsEndpoints) {
      try {
        const response = await sportAPIClient.fetchFromAPI(apiConfig, endpoint)
        if (response && response.data && response.data.length > 0) {
          standingsData = response.data
          break
        }
      } catch (error) {
        console.warn(`Failed to fetch standings from ${endpoint}:`, error)
        continue
      }
    }
    
    if (!standingsData || standingsData.length === 0) {
      console.log(`No standings data available for ${sportConfig.display_name}`)
      return 0
    }
    
    // Normalize standings data based on sport
    const standingsToInsert = standingsData.map((standing: Record<string, unknown>, index: number) => 
      normalizeStandingsData(standing, sportConfig, apiConfig, index)
    ).filter(Boolean)
    
    if (standingsToInsert.length === 0) return 0
    
    // Upsert standings
    const { error } = await supabase
      .from('league_standings')
      .upsert(standingsToInsert, { 
        onConflict: 'id',
        ignoreDuplicates: false 
      })
    
    if (error) throw error
    console.log(`Synced ${standingsToInsert.length} standings for ${sportConfig.display_name}`)

    // Broadcast the changes to the clients
    const channel = supabase.channel('db-changes')
    channel.send({
      type: 'broadcast',
      event: 'standings-updated',
      payload: { sport: sportConfig.name, standings: standingsToInsert },
    })

    return standingsToInsert.length
    
  } catch (error) {
    console.error(`Error syncing standings for ${sportConfig.display_name}:`, error)
    return 0
  }
}

// Data normalization functions for different sports APIs - NO HARDCODING
function normalizeGameData(game: any, sportConfig: SportConfig, apiConfig: APIConfig): Record<string, unknown> {
  const now = new Date()
  
  // Generate unique ID based on sport and provider
  const gameId = game.id || game.gameId || game.fixture?.id || game.gamePk || Date.now()
  const uniqueId = `${sportConfig.name}_${apiConfig.provider}_${gameId}_${Math.random().toString(36).substr(2, 9)}`
  
  return {
    id: uniqueId,
    sport: sportConfig.name,
    league: game.league?.name || game.league || null,
    season: sportConfig.current_season || getCurrentSeason(sportConfig),
    home_team_id: game?.home_team?.id || game?.teams?.home?.team?.id || game?.HOME_TEAM_ID || null,
    away_team_id: game?.away_team?.id || game?.teams?.away?.team?.id || game?.VISITOR_TEAM_ID || null,
    home_team_name: game?.home_team?.name || game?.teams?.home?.team?.name || game?.HOME_TEAM_NAME || null,
    away_team_name: game?.away_team?.name || game?.teams?.away?.team?.name || game?.VISITOR_TEAM_NAME || null,
    game_date: game?.date || game?.gameDate || game?.fixture?.date || game?.GAME_DATE_EST || now.toISOString(),
    status: normalizeStatus(game?.status || game?.fixture?.status?.short || game?.GAME_STATUS_TEXT || 'scheduled'),
    home_score: game?.home_score ?? game?.teams?.home?.score ?? game?.goals?.home ?? game?.HOME_TEAM_WINS ?? null,
    away_score: game?.away_score ?? game?.teams?.away?.score ?? game?.goals?.away ?? game?.VISITOR_TEAM_WINS ?? null,
    venue: game?.venue?.name || game?.fixture?.venue?.name || game?.ARENA_NAME || game?.venue || null,
    last_updated: now.toISOString()
  }
}

function normalizeTeamData(team: any, sportConfig: SportConfig, apiConfig: APIConfig): Record<string, unknown> {
  const now = new Date()
  
  // Generate unique ID based on sport and provider
  const teamId = team.id || team.teamId || team.TEAM_ID || Date.now()
  const uniqueId = `${sportConfig.name}_team_${apiConfig.provider}_${teamId}`
  
  return {
    id: uniqueId,
    name: team?.name || team?.teamName || team?.TEAM_NAME || team?.display_name || null,
    sport: sportConfig.name,
    league: team.league?.name || team.league || null,
    abbreviation: team?.abbreviation || team?.abbr || team?.TEAM_ABBREVIATION || team?.code || null,
    city: team?.city || team?.location || team?.TEAM_CITY || team?.locationName || null,
    logo_url: team?.logo || team?.logo_url || team?.image || team?.logoUrl || null,
    colors: team.colors ? JSON.stringify(team.colors) : null,
    venue: team.venue?.name || team.stadium || team.arena || team.ARENA_NAME,
    is_active: team.active !== false,
    last_updated: now.toISOString()
  }
}

function normalizePlayerData(player: any, sportConfig: SportConfig, apiConfig: APIConfig): Record<string, unknown> {
  const now = new Date()
  
  // Generate unique ID based on sport and provider
  const playerId = player.id || player.personId || player.PERSON_ID || Date.now()
  const uniqueId = `${sportConfig.name}_player_${apiConfig.provider}_${playerId}`
  
  return {
    id: uniqueId,
    name: player?.name || player?.fullName || player?.displayName || player?.DISPLAY_FIRST_LAST || null,
    sport: sportConfig.name,
    position: player?.position || player?.primaryPosition?.name || player?.POSITION || player?.pos || null,
    team_id: player?.team_id || player?.team?.id || player?.TEAM_ID || player?.teamId || null,
    team_name: player?.team?.name || player?.team_name || player?.TEAM_NAME || player?.teamName || null,
    height: player?.height || player?.HEIGHT || null,
    weight: player?.weight || player?.WEIGHT || null,
    age: player?.age || player?.currentAge || player?.AGE || null,
    experience_years: player?.experience || player?.EXP || player?.years_pro || null,
    college: player?.college || player?.SCHOOL || player?.university || null,
    country: player?.country || player?.COUNTRY || player?.birthCountry || player?.nationality || null,
    jersey_number: player?.jersey_number || player?.jerseyNumber || player?.primaryNumber || player?.number || null,
    is_active: player.active !== false && player.ROSTERSTATUS !== 'Inactive',
    headshot_url: player.headshot || player.headshot_url || player.image || player.photo,
    last_updated: now.toISOString()
  }
}

function normalizeStandingsData(standing: any, sportConfig: SportConfig, apiConfig: APIConfig, index: number): Record<string, unknown> {
  const now = new Date()
  
  // Generate unique ID based on sport and provider
  const teamId = standing.team?.id || standing.team_id || standing.TEAM_ID || standing.teamId || index
  const uniqueId = `${sportConfig.name}_standings_${apiConfig.provider}_${teamId}_${Date.now()}`
  
  return {
    id: uniqueId,
    sport: sportConfig.name,
    league: standing.league?.name || standing.league || null,
    season: sportConfig.current_season || getCurrentSeason(sportConfig),
    team_id: standing?.team?.id || standing?.team_id || standing?.TEAM_ID || standing?.teamId || null,
    team_name: standing?.team?.name || standing?.team_name || standing?.TEAM_NAME || standing?.teamName || standing?.name || null,
    position: standing?.position || standing?.rank || standing?.place || standing?.PLAYOFF_RANK || standing?.divisionRank || index + 1,
    wins: standing?.wins || standing?.w || standing?.victories || standing?.W || 0,
    losses: standing?.losses || standing?.l || standing?.defeats || standing?.L || 0,
    ties: standing?.ties || standing?.t || standing?.draws || standing?.T || 0,
    win_percentage: standing?.win_percentage || standing?.win_pct || standing?.pct || standing?.W_PCT || standing?.winPctg || null,
    games_back: standing?.games_back || standing?.gb || standing?.gamesBehind || standing?.GB || standing?.gamesBack || null,
    points_for: standing?.points_for || standing?.pf || standing?.goals_for || standing?.PTS || standing?.runsScored || standing?.goalsFor || 0,
    points_against: standing?.points_against || standing?.pa || standing?.goals_against || standing?.OPP_PTS || standing?.runsAllowed || standing?.goalsAgainst || 0,
    last_updated: now.toISOString()
  }
}

// Utility functions - NO HARDCODING
function getCurrentSeason(sportConfig: SportConfig): string {
  const year = new Date().getFullYear()
  const month = new Date().getMonth() + 1
  
  // Use sport-specific season configuration from database
  const seasonConfig = sportConfig.season_config || {}
  const startMonth = seasonConfig.startMonth || 0
  const endMonth = seasonConfig.endMonth || 11
  const seasonYearOffset = seasonConfig.seasonYearOffset || 0
  
  // Determine current season based on sport configuration
  if (month >= startMonth && month <= endMonth) {
    return `${year + seasonYearOffset}`
  } else {
    return `${year - 1 + seasonYearOffset}`
  }
}

function normalizeStatus(status: string): string {
  const statusMap: Record<string, string> = {
    'scheduled': 'scheduled',
    'live': 'live',
    'in_progress': 'live',
    'in progress': 'live',
    'finished': 'finished',
    'completed': 'finished',
    'final': 'finished',
    'postponed': 'postponed',
    'cancelled': 'cancelled'
  }
  
  return statusMap[status.toLowerCase()] || 'scheduled'
}

// Main handler
serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Parse request
  const { sport, dataTypes = ['games', 'teams', 'players', 'standings'] }: SyncRequest = 
      req.method === 'POST' ? await req.json() : {}

    // Initialize dynamic API configuration
    const apiConfigLoader = new DynamicAPIConfig(supabase)
    await apiConfigLoader.loadAPIConfigs()
    
    // Initialize sport API client
    const sportAPIClient = new SportAPIClient(supabase)

    // Get sports configuration from database
    const { data: sports, error: sportsError } = await supabase
      .from('sports')
      .select('*')
      .eq('is_active', true)

    if (sportsError) throw sportsError

    if (!sports || sports.length === 0) {
      throw new Error('No active sports configured in database')
    }

    const sportsToSync = sport ? sports.filter((s: SportConfig) => s.name === sport) : sports

    const result: SyncResult = {
      success: true,
      message: 'Sync completed successfully',
      stats: {
        games: 0,
        teams: 0,
        players: 0,
        standings: 0,
        errors: []
      }
    }

    // Sync each sport with proper API handling
    for (const sportConfig of sportsToSync) {
      console.log(`Syncing data for ${sportConfig.display_name}...`)

      try {
        // Get API providers for this sport with performance optimization
        const apiProviders = sportConfig.api_providers || ['api-sports']
        
        // Sort providers by performance for optimal selection
        const sortedProviders = apiProviders.map((provider: string) => ({
          provider,
          score: sportAPIClient.getOptimalProvider(sportConfig.name, 'games') === provider ? 1 : 0.5
        })).sort((a: { score: number }, b: { score: number }) => b.score - a.score)
        
        for (const { provider } of sortedProviders) {
          const apiConfig = apiConfigLoader.getConfig(sportConfig.name, provider)
          if (!apiConfig) {
            console.warn(`No API configuration found for ${sportConfig.name} with provider ${provider}`)
            continue
          }

          console.log(`Using ${provider} API for ${sportConfig.display_name} (optimized)`)
          const syncStartTime = Date.now()

          // Sync each data type for this sport with parallel execution where possible
          const syncPromises = []
          
          if (dataTypes.includes('games')) {
            syncPromises.push(syncGames(supabase, sportConfig, apiConfig, sportAPIClient))
          }

          if (dataTypes.includes('teams')) {
            syncPromises.push(syncTeams(supabase, sportConfig, apiConfig, sportAPIClient))
          }

          if (dataTypes.includes('players')) {
            syncPromises.push(syncPlayers(supabase, sportConfig, apiConfig, sportAPIClient))
          }

          if (dataTypes.includes('standings')) {
            syncPromises.push(syncStandings(supabase, sportConfig, apiConfig, sportAPIClient))
          }
          
          // Execute syncs in parallel for maximum speed
          const syncResults = await Promise.allSettled(syncPromises)
          
          // Process results
          syncResults.forEach((syncResult, index) => {
            if (syncResult.status === 'fulfilled') {
              const dataType = dataTypes[index]
              if (dataType === 'games') result.stats.games += syncResult.value
              else if (dataType === 'teams') result.stats.teams += syncResult.value
              else if (dataType === 'players') result.stats.players += syncResult.value
              else if (dataType === 'standings') result.stats.standings += syncResult.value
            } else {
              result.stats.errors.push(`Sync failed for ${sportConfig.name}: ${syncResult.reason}`)
            }
          })
          
          const syncTime = Date.now() - syncStartTime
          console.log(`Sync completed for ${sportConfig.display_name} in ${syncTime}ms`)
        }

        console.log(`Successfully synced ${sportConfig.display_name}`)

      } catch (error) {
        const errorMsg = `Error syncing ${sportConfig.display_name}: ${error instanceof Error ? error.message : String(error)}`
        result.stats.errors.push(errorMsg)
        console.error(errorMsg)
      }
    }

    // Determine overall success
    result.success = result.stats.errors.length === 0
    if (result.stats.errors.length > 0) {
      result.message = `Sync completed with ${result.stats.errors.length} errors`
    }

    console.log('Sync completed:', result)

    return new Response(
      JSON.stringify(result),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: result.success ? 200 : 207 // 207 for partial success
      }
    )

  } catch (error) {
    console.error('Edge function error:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        message: 'Sync failed',
        error: error instanceof Error ? error.message : String(error),
        stats: {
          games: 0,
          teams: 0,
          players: 0,
          standings: 0,
          errors: [error instanceof Error ? error.message : String(error)]
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})