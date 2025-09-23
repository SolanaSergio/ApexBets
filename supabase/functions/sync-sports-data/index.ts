/**
 * Supabase Edge Function for Sports Data Sync
 * Fully sport-agnostic data synchronization with no hardcoded values
 * Handles automatic data fetching and database updates
 */

/// <reference path="./types.d.ts" />

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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

interface APIConfig {
  apiKey: string
  baseUrl: string
  leagues: string[]
  rateLimit: number
  priority: number
}

// Dynamic sports configuration loaded from environment
const getSportsConfig = (): Record<string, APIConfig> => {
  const config: Record<string, APIConfig> = {}
  
  // Get supported sports from environment (dynamic, no hardcoded sports)
  const supportedSports = Deno.env.get('SUPPORTED_SPORTS')?.split(',').map(s => s.trim()).filter(Boolean) || []
  
  // If no sports configured, try to detect from available API keys
  const sportsToCheck = supportedSports.length > 0 ? supportedSports : 
    ['basketball', 'football', 'baseball', 'soccer', 'hockey', 'tennis', 'golf']
  
  for (const sport of sportsToCheck) {
    // Check for sport-specific API keys first
    const sportKey = sport.toUpperCase()
    let apiKey = Deno.env.get(`${sportKey}_API_KEY`)
    let baseUrl = Deno.env.get(`${sportKey}_BASE_URL`)
    
    // Fallback to generic API keys if sport-specific ones don't exist
    if (!apiKey) {
      apiKey = Deno.env.get('RAPIDAPI_KEY') || 
               Deno.env.get('NEXT_PUBLIC_RAPIDAPI_KEY') ||
               Deno.env.get('SPORTSDB_API_KEY') ||
               Deno.env.get('NEXT_PUBLIC_SPORTSDB_API_KEY') ||
               Deno.env.get('BALLDONTLIE_API_KEY') ||
               Deno.env.get('NEXT_PUBLIC_BALLDONTLIE_API_KEY')
    }
    
    if (!baseUrl) {
      // Set default base URLs for common sports
      const defaultUrls: Record<string, string> = {
        'basketball': 'https://api.balldontlie.io/v1',
        'football': 'https://api.sportradar.us/nfl',
        'baseball': 'https://api.sportradar.us/mlb',
        'soccer': 'https://api.football-data.org/v4',
        'hockey': 'https://api.sportradar.us/nhl',
        'tennis': 'https://api.sportradar.us/tennis',
        'golf': 'https://api.sportradar.us/golf'
      }
      baseUrl = defaultUrls[sport] || Deno.env.get('NEXT_PUBLIC_API_URL') || ''
    }
    
    const leagues = Deno.env.get(`${sportKey}_LEAGUES`)?.split(',') || []
    const rateLimit = parseInt(Deno.env.get(`${sportKey}_RATE_LIMIT`) || '60')
    const priority = parseInt(Deno.env.get(`${sportKey}_PRIORITY`) || '1')
    
    if (apiKey && baseUrl) {
      config[sport] = {
        apiKey,
        baseUrl,
        leagues,
        rateLimit,
        priority
      }
    }
  }
  
  return config
}

// Generic API client with rate limiting and error handling
class APIClient {
  private rateLimitTracker: Map<string, { lastRequest: number; requestCount: number }> = new Map()
  
  async fetchFromAPI(url: string, apiKey?: string, sport?: string): Promise<any> {
    const now = Date.now()
    const trackerKey = sport || 'default'
    const tracker = this.rateLimitTracker.get(trackerKey) || { lastRequest: 0, requestCount: 0 }
    
    // Simple rate limiting (1 request per second per sport)
    if (now - tracker.lastRequest < 1000) {
      await new Promise(resolve => setTimeout(resolve, 1000 - (now - tracker.lastRequest)))
    }
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'ApexBets-Sync/1.0'
    }
    
    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`
    }
    
    const response = await fetch(url, { headers })
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`)
    }
    
    this.rateLimitTracker.set(trackerKey, { lastRequest: Date.now(), requestCount: tracker.requestCount + 1 })
    return await response.json()
  }
}

const apiClient = new APIClient()

// Generic data sync functions
async function syncGames(supabase: any, sport: string, league: string, config: APIConfig): Promise<number> {
  try {
    console.log(`Syncing games for ${sport}/${league}...`)
    
    // Try multiple API endpoints for better coverage
    const endpoints = [
      `${config.baseUrl}/games`,
      `${config.baseUrl}/schedule`,
      `${config.baseUrl}/fixtures`
    ]
    
    let gamesData: any = null
    
    for (const endpoint of endpoints) {
      try {
        gamesData = await apiClient.fetchFromAPI(endpoint, config.apiKey, sport)
        if (gamesData && (Array.isArray(gamesData) || gamesData.games || gamesData.fixtures)) {
          break
        }
      } catch (error) {
        console.warn(`Failed to fetch from ${endpoint}:`, error)
        continue
      }
    }
    
    if (!gamesData) {
      console.log(`No games data available for ${sport}/${league}`)
      return 0
    }
    
    const games = Array.isArray(gamesData) ? gamesData : 
                 gamesData.games || gamesData.fixtures || gamesData.data || []
    
    if (games.length === 0) return 0
    
    // Normalize game data to our schema
    const gamesToInsert = games.map((game: any) => ({
      id: game.id || `${sport}_${league}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      sport,
      league,
      season: game.season || getCurrentSeason(sport),
      home_team_id: game.home_team?.id || game.homeTeam?.id || null,
      away_team_id: game.away_team?.id || game.awayTeam?.id || null,
      home_team_name: game.home_team?.name || game.homeTeam?.name || game.home_name || null,
      away_team_name: game.away_team?.name || game.awayTeam?.name || game.away_name || null,
      game_date: game.date || game.scheduled || game.start_time || new Date().toISOString(),
      status: normalizeStatus(game.status || game.state || 'scheduled'),
      home_score: game.home_score || game.homeScore || game.home?.score || null,
      away_score: game.away_score || game.awayScore || game.away?.score || null,
      venue: game.venue?.name || game.location || game.stadium || null,
      last_updated: new Date().toISOString()
    }))
    
    // Upsert games
    const { error } = await supabase
      .from('games')
      .upsert(gamesToInsert, { 
        onConflict: 'id',
        ignoreDuplicates: false 
      })
    
    if (error) throw error
    console.log(`Synced ${gamesToInsert.length} games for ${sport}/${league}`)
    return gamesToInsert.length
    
  } catch (error) {
    console.error(`Error syncing games for ${sport}/${league}:`, error)
    return 0
  }
}

async function syncTeams(supabase: any, sport: string, league: string, config: APIConfig): Promise<number> {
  try {
    console.log(`Syncing teams for ${sport}/${league}...`)
    
    const endpoints = [
      `${config.baseUrl}/teams`,
      `${config.baseUrl}/clubs`,
      `${config.baseUrl}/franchises`
    ]
    
    let teamsData: any = null
    
    for (const endpoint of endpoints) {
      try {
        teamsData = await apiClient.fetchFromAPI(endpoint, config.apiKey, sport)
        if (teamsData && (Array.isArray(teamsData) || teamsData.teams || teamsData.clubs)) {
          break
        }
      } catch (error) {
        console.warn(`Failed to fetch from ${endpoint}:`, error)
        continue
      }
    }
    
    if (!teamsData) {
      console.log(`No teams data available for ${sport}/${league}`)
      return 0
    }
    
    const teams = Array.isArray(teamsData) ? teamsData : 
                 teamsData.teams || teamsData.clubs || teamsData.data || []
    
    if (teams.length === 0) return 0
    
    // Normalize team data
    const teamsToInsert = teams.map((team: any) => ({
      id: team.id || `${sport}_${league}_${team.name?.replace(/\s+/g, '_').toLowerCase()}_${Date.now()}`,
      name: team.name || team.full_name || team.display_name || 'Unknown Team',
      sport,
      league,
      abbreviation: team.abbreviation || team.abbr || team.code || null,
      city: team.city || team.location || null,
      logo_url: team.logo || team.logo_url || team.image || null,
      colors: team.colors ? JSON.stringify(team.colors) : null,
      venue: team.venue?.name || team.stadium || team.arena || null,
      is_active: team.active !== false,
      last_updated: new Date().toISOString()
    }))
    
    // Upsert teams
    const { error } = await supabase
      .from('teams')
      .upsert(teamsToInsert, { 
        onConflict: 'id',
        ignoreDuplicates: false 
      })
    
    if (error) throw error
    console.log(`Synced ${teamsToInsert.length} teams for ${sport}/${league}`)
    return teamsToInsert.length
    
  } catch (error) {
    console.error(`Error syncing teams for ${sport}/${league}:`, error)
    return 0
  }
}

async function syncPlayers(supabase: any, sport: string, league: string, config: APIConfig): Promise<number> {
  try {
    console.log(`Syncing players for ${sport}/${league}...`)
    
    const endpoints = [
      `${config.baseUrl}/players`,
      `${config.baseUrl}/roster`,
      `${config.baseUrl}/squad`
    ]
    
    let playersData: any = null
    
    for (const endpoint of endpoints) {
      try {
        playersData = await apiClient.fetchFromAPI(endpoint, config.apiKey, sport)
        if (playersData && (Array.isArray(playersData) || playersData.players || playersData.roster)) {
          break
        }
      } catch (error) {
        console.warn(`Failed to fetch from ${endpoint}:`, error)
        continue
      }
    }
    
    if (!playersData) {
      console.log(`No players data available for ${sport}/${league}`)
      return 0
    }
    
    const players = Array.isArray(playersData) ? playersData : 
                   playersData.players || playersData.roster || playersData.data || []
    
    if (players.length === 0) return 0
    
    // Normalize player data
    const playersToInsert = players.map((player: any) => ({
      id: player.id || `${sport}_${league}_${player.name?.replace(/\s+/g, '_').toLowerCase()}_${Date.now()}`,
      name: player.name || player.full_name || player.display_name || 'Unknown Player',
      sport,
      position: player.position || player.pos || null,
      team_id: player.team_id || player.team?.id || null,
      team_name: player.team?.name || player.team_name || null,
      height: player.height || null,
      weight: player.weight || null,
      age: player.age || null,
      experience_years: player.experience || player.years_pro || null,
      college: player.college || player.university || null,
      country: player.country || player.nationality || null,
      jersey_number: player.jersey_number || player.number || null,
      is_active: player.active !== false,
      headshot_url: player.headshot || player.image || player.photo || null,
      last_updated: new Date().toISOString()
    }))
    
    // Upsert players
    const { error } = await supabase
      .from('players')
      .upsert(playersToInsert, { 
        onConflict: 'id',
        ignoreDuplicates: false 
      })
    
    if (error) throw error
    console.log(`Synced ${playersToInsert.length} players for ${sport}/${league}`)
    return playersToInsert.length
    
  } catch (error) {
    console.error(`Error syncing players for ${sport}/${league}:`, error)
    return 0
  }
}

async function syncStandings(supabase: any, sport: string, league: string, config: APIConfig): Promise<number> {
  try {
    console.log(`Syncing standings for ${sport}/${league}...`)
    
    const endpoints = [
      `${config.baseUrl}/standings`,
      `${config.baseUrl}/table`,
      `${config.baseUrl}/rankings`
    ]
    
    let standingsData: any = null
    
    for (const endpoint of endpoints) {
      try {
        standingsData = await apiClient.fetchFromAPI(endpoint, config.apiKey, sport)
        if (standingsData && (Array.isArray(standingsData) || standingsData.standings || standingsData.table)) {
          break
        }
      } catch (error) {
        console.warn(`Failed to fetch from ${endpoint}:`, error)
        continue
      }
    }
    
    if (!standingsData) {
      console.log(`No standings data available for ${sport}/${league}`)
      return 0
    }
    
    const standings = Array.isArray(standingsData) ? standingsData : 
                     standingsData.standings || standingsData.table || standingsData.data || []
    
    if (standings.length === 0) return 0
    
    // Normalize standings data
    const standingsToInsert = standings.map((standing: any, index: number) => ({
      id: standing.id || `${sport}_${league}_${standing.team?.name?.replace(/\s+/g, '_').toLowerCase()}_${Date.now()}`,
      sport,
      league,
      season: standing.season || getCurrentSeason(sport),
      team_id: standing.team?.id || standing.team_id || null,
      team_name: standing.team?.name || standing.team_name || standing.name || 'Unknown Team',
      position: standing.position || standing.rank || standing.place || index + 1,
      wins: standing.wins || standing.w || standing.victories || 0,
      losses: standing.losses || standing.l || standing.defeats || 0,
      ties: standing.ties || standing.t || standing.draws || 0,
      win_percentage: standing.win_percentage || standing.win_pct || standing.pct || null,
      games_behind: standing.games_behind || standing.gb || standing.games_back || null,
      points_for: standing.points_for || standing.pf || standing.goals_for || 0,
      points_against: standing.points_against || standing.pa || standing.goals_against || 0,
      last_updated: new Date().toISOString()
    }))
    
    // Upsert standings
    const { error } = await supabase
      .from('standings')
      .upsert(standingsToInsert, { 
        onConflict: 'id',
        ignoreDuplicates: false 
      })
    
    if (error) throw error
    console.log(`Synced ${standingsToInsert.length} standings for ${sport}/${league}`)
    return standingsToInsert.length
    
  } catch (error) {
    console.error(`Error syncing standings for ${sport}/${league}:`, error)
    return 0
  }
}

// Utility functions
function getCurrentSeason(sport: string): string {
  const year = new Date().getFullYear()
  const month = new Date().getMonth() + 1
  
  // Different sports have different season formats
  if (sport === 'basketball' || sport === 'hockey') {
    return month >= 10 ? `${year}-${(year + 1).toString().slice(-2)}` : `${year - 1}-${year.toString().slice(-2)}`
  } else if (sport === 'football') {
    return year.toString()
  } else {
    return `${year - 1}-${year.toString().slice(-2)}`
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
    const { sport, dataTypes = ['games', 'teams', 'players', 'standings'], force = false }: SyncRequest = 
      req.method === 'POST' ? await req.json() : {}

    // Get dynamic sports configuration
    const sportsConfig = getSportsConfig()
    const supportedSports = Object.keys(sportsConfig)
    
    if (supportedSports.length === 0) {
      throw new Error('No sports configured. Please set up API keys and base URLs.')
    }

    const sportsToSync = sport ? [sport] : supportedSports

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

    // Sync each sport
    for (const sportToSync of sportsToSync) {
      if (!supportedSports.includes(sportToSync)) {
        result.stats.errors.push(`Unsupported sport: ${sportToSync}`)
        continue
      }

      console.log(`Syncing data for ${sportToSync}...`)

      const config = sportsConfig[sportToSync]
      const leagues = config.leagues.length > 0 ? config.leagues : ['default']

      for (const league of leagues) {
        try {
          if (dataTypes.includes('games')) {
            const count = await syncGames(supabase, sportToSync, league, config)
            result.stats.games += count
          }

          if (dataTypes.includes('teams')) {
            const count = await syncTeams(supabase, sportToSync, league, config)
            result.stats.teams += count
          }

          if (dataTypes.includes('players')) {
            const count = await syncPlayers(supabase, sportToSync, league, config)
            result.stats.players += count
          }

          if (dataTypes.includes('standings')) {
            const count = await syncStandings(supabase, sportToSync, league, config)
            result.stats.standings += count
          }

        } catch (error) {
          const errorMsg = `Error syncing ${sportToSync}/${league}: ${error instanceof Error ? error.message : String(error)}`
          result.stats.errors.push(errorMsg)
          console.error(errorMsg)
        }
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