/**
 * Supabase Edge Function for Sports Data Sync
 * Handles automatic data fetching and database updates
 * Runs on Supabase's infrastructure with direct DB access
 */

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

// Sports API configuration
const SPORTS_CONFIG = {
  basketball: {
    apiKey: Deno.env.get('BASKETBALL_API_KEY'),
    baseUrl: 'https://api.balldontlie.io/v1',
    leagues: ['NBA', 'WNBA']
  },
  football: {
    apiKey: Deno.env.get('FOOTBALL_API_KEY'),
    baseUrl: 'https://api.sportradar.us/nfl',
    leagues: ['NFL']
  },
  baseball: {
    apiKey: Deno.env.get('BASEBALL_API_KEY'),
    baseUrl: 'https://api.sportradar.us/mlb',
    leagues: ['MLB']
  },
  soccer: {
    apiKey: Deno.env.get('SOCCER_API_KEY'),
    baseUrl: 'https://api.football-data.org/v4',
    leagues: ['Premier League', 'La Liga', 'Bundesliga']
  },
  hockey: {
    apiKey: Deno.env.get('HOCKEY_API_KEY'),
    baseUrl: 'https://api.sportradar.us/nhl',
    leagues: ['NHL']
  }
}

async function fetchFromAPI(url: string, apiKey?: string): Promise<any> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  
  if (apiKey) {
    headers['Authorization'] = `Bearer ${apiKey}`
  }

  const response = await fetch(url, { headers })
  
  if (!response.ok) {
    throw new Error(`API request failed: ${response.status} ${response.statusText}`)
  }
  
  return await response.json()
}

async function syncGames(supabase: any, sport: string, league: string): Promise<number> {
  const config = SPORTS_CONFIG[sport as keyof typeof SPORTS_CONFIG]
  if (!config?.apiKey) {
    console.log(`No API key for ${sport}, skipping games`)
    return 0
  }

  try {
    // Fetch games (this is a simplified example - adjust based on your actual API)
    const gamesData = await fetchFromAPI(`${config.baseUrl}/games`, config.apiKey)
    const games = Array.isArray(gamesData) ? gamesData : gamesData.games || []

    if (games.length === 0) return 0

    // Prepare games for database
    const gamesToInsert = games.map((game: any) => ({
      id: game.id || `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      sport,
      league,
      season: game.season || getCurrentSeason(sport),
      home_team_id: game.home_team?.id || null,
      away_team_id: game.away_team?.id || null,
      game_date: game.date || game.scheduled || new Date().toISOString(),
      status: game.status || 'scheduled',
      home_score: game.home_score || null,
      away_score: game.away_score || null,
      venue: game.venue?.name || null,
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
    return gamesToInsert.length

  } catch (error) {
    console.error(`Error syncing games for ${sport}:`, error)
    return 0
  }
}

async function syncTeams(supabase: any, sport: string, league: string): Promise<number> {
  const config = SPORTS_CONFIG[sport as keyof typeof SPORTS_CONFIG]
  if (!config?.apiKey) {
    console.log(`No API key for ${sport}, skipping teams`)
    return 0
  }

  try {
    // Fetch teams
    const teamsData = await fetchFromAPI(`${config.baseUrl}/teams`, config.apiKey)
    const teams = Array.isArray(teamsData) ? teamsData : teamsData.teams || []

    if (teams.length === 0) return 0

    // Prepare teams for database
    const teamsToInsert = teams.map((team: any) => ({
      id: team.id || `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: team.name || team.full_name || '',
      sport,
      league,
      abbreviation: team.abbreviation || team.abbr || '',
      city: team.city || team.location || '',
      logo_url: team.logo_url || team.logo || null,
      conference: team.conference || null,
      division: team.division || null,
      founded_year: team.founded_year || team.founded || null,
      stadium_name: team.stadium?.name || team.venue?.name || null,
      stadium_capacity: team.stadium?.capacity || team.venue?.capacity || null,
      primary_color: team.primary_color || team.colors?.primary || null,
      secondary_color: team.secondary_color || team.colors?.secondary || null,
      country: team.country || null,
      is_active: team.is_active !== false,
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
    return teamsToInsert.length

  } catch (error) {
    console.error(`Error syncing teams for ${sport}:`, error)
    return 0
  }
}

async function syncPlayers(supabase: any, sport: string, league: string): Promise<number> {
  const config = SPORTS_CONFIG[sport as keyof typeof SPORTS_CONFIG]
  if (!config?.apiKey) {
    console.log(`No API key for ${sport}, skipping players`)
    return 0
  }

  try {
    // Fetch players
    const playersData = await fetchFromAPI(`${config.baseUrl}/players`, config.apiKey)
    const players = Array.isArray(playersData) ? playersData : playersData.players || []

    if (players.length === 0) return 0

    // Prepare players for database
    const playersToInsert = players.map((player: any) => ({
      id: player.id || `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: player.name || player.full_name || '',
      sport,
      position: player.position || null,
      team_id: player.team?.id || player.team_id || null,
      team_name: player.team?.name || player.team_name || null,
      height: player.height || null,
      weight: player.weight || null,
      age: player.age || null,
      experience_years: player.experience || player.years_pro || null,
      college: player.college || null,
      country: player.country || player.nationality || null,
      jersey_number: player.jersey_number || player.number || null,
      is_active: player.is_active !== false,
      headshot_url: player.headshot_url || player.image_url || null,
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
    return playersToInsert.length

  } catch (error) {
    console.error(`Error syncing players for ${sport}:`, error)
    return 0
  }
}

async function syncStandings(supabase: any, sport: string, league: string): Promise<number> {
  const config = SPORTS_CONFIG[sport as keyof typeof SPORTS_CONFIG]
  if (!config?.apiKey) {
    console.log(`No API key for ${sport}, skipping standings`)
    return 0
  }

  try {
    // Fetch standings
    const standingsData = await fetchFromAPI(`${config.baseUrl}/standings`, config.apiKey)
    const standings = Array.isArray(standingsData) ? standingsData : standingsData.standings || []

    if (standings.length === 0) return 0

    // Prepare standings for database
    const standingsToInsert = standings.map((standing: any, index: number) => ({
      id: standing.id || `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      sport,
      league,
      season: standing.season || getCurrentSeason(sport),
      team_id: standing.team?.id || standing.team_id || null,
      team_name: standing.team?.name || standing.team_name || standing.name,
      position: standing.position || standing.rank || index + 1,
      wins: standing.wins || standing.w || 0,
      losses: standing.losses || standing.l || 0,
      ties: standing.ties || standing.t || 0,
      win_percentage: standing.win_percentage || standing.win_pct || null,
      games_behind: standing.games_behind || standing.gb || null,
      points_for: standing.points_for || standing.pf || 0,
      points_against: standing.points_against || standing.pa || 0,
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
    return standingsToInsert.length

  } catch (error) {
    console.error(`Error syncing standings for ${sport}:`, error)
    return 0
  }
}

function getCurrentSeason(sport: string): string {
  const year = new Date().getFullYear()
  const month = new Date().getMonth()
  
  // Most sports seasons start in fall/winter
  if (month >= 8) {
    return `${year}-${(year + 1).toString().slice(-2)}`
  } else {
    return `${year - 1}-${year.toString().slice(-2)}`
  }
}

serve(async (req) => {
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

    const supportedSports = Object.keys(SPORTS_CONFIG)
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

      const config = SPORTS_CONFIG[sportToSync as keyof typeof SPORTS_CONFIG]
      const leagues = config?.leagues || ['default']

      for (const league of leagues) {
        try {
          if (dataTypes.includes('games')) {
            const count = await syncGames(supabase, sportToSync, league)
            result.stats.games += count
          }

          if (dataTypes.includes('teams')) {
            const count = await syncTeams(supabase, sportToSync, league)
            result.stats.teams += count
          }

          if (dataTypes.includes('players')) {
            const count = await syncPlayers(supabase, sportToSync, league)
            result.stats.players += count
          }

          if (dataTypes.includes('standings')) {
            const count = await syncStandings(supabase, sportToSync, league)
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
        message: 'Edge function failed',
        error: error instanceof Error ? error.message : String(error),
        stats: { games: 0, teams: 0, players: 0, standings: 0, errors: [] }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})
