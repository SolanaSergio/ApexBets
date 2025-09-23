/**
 * Supabase Edge Function for Sports Data Sync
 * Fully sport-agnostic data synchronization with proper API handling
 * Handles automatic data fetching and database updates for all sports
 */

/// <reference path="./types.d.ts" />

// @ts-ignore - Deno imports
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
// @ts-ignore - Deno imports
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

interface SportAPIConfig {
  name: string
  displayName: string
  apiProvider: string
  apiKey: string
  baseUrl: string
  headers: Record<string, string>
  endpoints: {
    games: string[]
    teams: string[]
    players: string[]
    standings: string[]
  }
  leagues: string[]
  rateLimit: number
  priority: number
  isActive: boolean
}

// Comprehensive sports API configuration with proper endpoints for each sport
const getSportsAPIConfig = (): Record<string, SportAPIConfig> => {
  const config: Record<string, SportAPIConfig> = {}
  
  // Get supported sports from environment
  const supportedSports = Deno.env.get('SUPPORTED_SPORTS')?.split(',').map(s => s.trim()).filter(Boolean) || []
  
  // If no sports configured, try to detect from available API keys
  const sportsToCheck = supportedSports.length > 0 ? supportedSports : 
    ['basketball', 'football', 'baseball', 'soccer', 'hockey', 'tennis', 'golf']
  
  for (const sport of sportsToCheck) {
    const sportKey = sport.toUpperCase()
    
    // Get sport-specific configuration
    const apiKey = Deno.env.get(`${sportKey}_API_KEY`) || 
                   Deno.env.get('RAPIDAPI_KEY') || 
                   Deno.env.get('NEXT_PUBLIC_RAPIDAPI_KEY') ||
                   Deno.env.get('SPORTSDB_API_KEY') ||
                   Deno.env.get('NEXT_PUBLIC_SPORTSDB_API_KEY') ||
                   Deno.env.get('BALLDONTLIE_API_KEY') ||
                   Deno.env.get('NEXT_PUBLIC_BALLDONTLIE_API_KEY')
    
    if (!apiKey || apiKey === 'your_api_key_here' || apiKey === '') {
      console.warn(`No valid API key found for ${sport}, skipping...`)
      continue
    }
    
    // Sport-specific API configurations
    const sportConfigs: Record<string, Partial<SportAPIConfig>> = {
      basketball: {
        name: 'basketball',
        displayName: 'Basketball',
        apiProvider: 'nba-stats',
        baseUrl: 'https://stats.nba.com/stats',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Referer': 'https://www.nba.com/',
          'Origin': 'https://www.nba.com'
        },
        endpoints: {
          games: ['/scoreboardV2', '/leaguegamefinder'],
          teams: ['/commonteamyears'],
          players: ['/commonallplayers'],
          standings: ['/leaguestandingsv3']
        }
      },
      football: {
        name: 'football',
        displayName: 'NFL Football',
        apiProvider: 'nfl-rapidapi',
        baseUrl: 'https://api-nfl-v1.p.rapidapi.com',
        headers: {
          'X-RapidAPI-Key': apiKey,
          'X-RapidAPI-Host': 'api-nfl-v1.p.rapidapi.com'
        },
        endpoints: {
          games: ['/games', '/schedule'],
          teams: ['/teams'],
          players: ['/players'],
          standings: ['/standings']
        }
      },
      baseball: {
        name: 'baseball',
        displayName: 'MLB Baseball',
        apiProvider: 'mlb-stats',
        baseUrl: 'https://statsapi.mlb.com/api/v1',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'ApexBets/1.0'
        },
        endpoints: {
          games: ['/schedule'],
          teams: ['/teams'],
          players: ['/people'],
          standings: ['/standings']
        }
      },
      soccer: {
        name: 'soccer',
        displayName: 'Soccer',
        apiProvider: 'api-sports',
        baseUrl: 'https://api-football-v1.p.rapidapi.com/v3',
        headers: {
          'X-RapidAPI-Key': apiKey,
          'X-RapidAPI-Host': 'api-football-v1.p.rapidapi.com'
        },
        endpoints: {
          games: ['/fixtures'],
          teams: ['/teams'],
          players: ['/players'],
          standings: ['/standings']
        }
      },
      hockey: {
        name: 'hockey',
        displayName: 'NHL Hockey',
        apiProvider: 'nhl-stats',
        baseUrl: 'https://statsapi.web.nhl.com/api/v1',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'ApexBets/1.0'
        },
        endpoints: {
          games: ['/schedule'],
          teams: ['/teams'],
          players: ['/people'],
          standings: ['/standings']
        }
      },
      tennis: {
        name: 'tennis',
        displayName: 'Tennis',
        apiProvider: 'tennis-rapidapi',
        baseUrl: 'https://tennis-live-data.p.rapidapi.com',
        headers: {
          'X-RapidAPI-Key': apiKey,
          'X-RapidAPI-Host': 'tennis-live-data.p.rapidapi.com'
        },
        endpoints: {
          games: ['/matches'],
          teams: ['/players'],
          players: ['/players'],
          standings: ['/rankings']
        }
      },
      golf: {
        name: 'golf',
        displayName: 'Golf',
        apiProvider: 'golf-rapidapi',
        baseUrl: 'https://golf-leaderboard-data.p.rapidapi.com',
        headers: {
          'X-RapidAPI-Key': apiKey,
          'X-RapidAPI-Host': 'golf-leaderboard-data.p.rapidapi.com'
        },
        endpoints: {
          games: ['/tournaments'],
          teams: ['/players'],
          players: ['/players'],
          standings: ['/leaderboard']
        }
      }
    }
    
    const sportConfig = sportConfigs[sport]
    if (!sportConfig) {
      console.warn(`No configuration found for sport: ${sport}`)
      continue
    }
    
    const leagues = Deno.env.get(`${sportKey}_LEAGUES`)?.split(',') || []
    const rateLimit = parseInt(Deno.env.get(`${sportKey}_RATE_LIMIT`) || '60')
    const priority = parseInt(Deno.env.get(`${sportKey}_PRIORITY`) || '1')
    const isActive = Deno.env.get(`${sportKey}_ACTIVE`) !== 'false'
    
    config[sport] = {
      name: sportConfig.name!,
      displayName: sportConfig.displayName!,
      apiProvider: sportConfig.apiProvider!,
      apiKey,
      baseUrl: sportConfig.baseUrl!,
      headers: sportConfig.headers!,
      endpoints: sportConfig.endpoints!,
      leagues,
      rateLimit,
      priority,
      isActive
    }
  }
  
  return config
}

// Enhanced API client with sport-specific handling and comprehensive error management
class SportAPIClient {
  private rateLimitTracker: Map<string, { lastRequest: number; requestCount: number; failures: number }> = new Map()
  private circuitBreaker: Map<string, { failures: number; lastFailure: number; isOpen: boolean }> = new Map()
  
  async fetchFromAPI(config: SportAPIConfig, endpoint: string, params: Record<string, any> = {}): Promise<any> {
    const sportKey = config.name
    const now = Date.now()
    
    // Check circuit breaker
    const breaker = this.circuitBreaker.get(sportKey) || { failures: 0, lastFailure: 0, isOpen: false }
    if (breaker.isOpen && (now - breaker.lastFailure) < 300000) { // 5 minute circuit breaker
      throw new Error(`Circuit breaker open for ${sportKey}. Too many failures.`)
    }
    
    // Rate limiting per sport
    const tracker = this.rateLimitTracker.get(sportKey) || { lastRequest: 0, requestCount: 0, failures: 0 }
    const rateLimitMs = (60 / config.rateLimit) * 1000 // Convert requests per minute to ms between requests
    
    if (now - tracker.lastRequest < rateLimitMs) {
      await new Promise(resolve => setTimeout(resolve, rateLimitMs - (now - tracker.lastRequest)))
    }
    
    try {
      // Build URL with parameters
      const url = new URL(config.baseUrl + endpoint)
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.set(key, value.toString())
        }
      })
      
      // Add sport-specific parameters
      this.addSportSpecificParams(url, config, endpoint)
      
      const response = await fetch(url.toString(), {
        headers: {
          ...config.headers,
          'Content-Type': 'application/json',
          'User-Agent': 'ApexBets-Sync/1.0'
        },
        signal: AbortSignal.timeout(30000) // 30 second timeout
      })
      
      if (!response.ok) {
        if (response.status === 429) {
          const retryAfter = response.headers.get('Retry-After')
          const delay = retryAfter ? parseInt(retryAfter) * 1000 : 60000
          console.warn(`Rate limit exceeded for ${sportKey}, waiting ${delay}ms`)
          await new Promise(resolve => setTimeout(resolve, delay))
          return this.fetchFromAPI(config, endpoint, params)
        }
        
        if (response.status >= 500) {
          // Server error - increment failure count
          tracker.failures++
          this.rateLimitTracker.set(sportKey, tracker)
          
          if (tracker.failures >= 5) {
            this.circuitBreaker.set(sportKey, { failures: tracker.failures, lastFailure: now, isOpen: true })
            throw new Error(`Circuit breaker opened for ${sportKey} due to server errors`)
          }
        }
        
        throw new Error(`API request failed: ${response.status} ${response.statusText}`)
      }
      
      // Reset failure count on success
      tracker.failures = 0
      tracker.lastRequest = now
      tracker.requestCount++
      this.rateLimitTracker.set(sportKey, tracker)
      
      // Reset circuit breaker on success
      this.circuitBreaker.set(sportKey, { failures: 0, lastFailure: 0, isOpen: false })
      
      const data = await response.json()
      return this.normalizeAPIResponse(data, config, endpoint)
      
    } catch (error) {
      // Increment failure count
      tracker.failures++
      this.rateLimitTracker.set(sportKey, tracker)
      
      if (tracker.failures >= 3) {
        this.circuitBreaker.set(sportKey, { failures: tracker.failures, lastFailure: now, isOpen: true })
      }
      
      console.error(`API request failed for ${sportKey}:`, error)
      throw error
    }
  }
  
  private addSportSpecificParams(url: URL, config: SportAPIConfig, endpoint: string): void {
    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth() + 1
    
    switch (config.apiProvider) {
      case 'nba-stats':
        // NBA Stats API requires specific parameters
        if (endpoint.includes('scoreboard')) {
          const gameDate = now.toISOString().split('T')[0].replace(/-/g, '')
          url.searchParams.set('GameDate', gameDate)
          url.searchParams.set('LeagueID', '00')
          url.searchParams.set('DayOffset', '0')
        } else if (endpoint.includes('commonallplayers')) {
          url.searchParams.set('IsOnlyCurrentSeason', '1')
          url.searchParams.set('LeagueID', '00')
          url.searchParams.set('Season', this.getNBASeason())
        } else if (endpoint.includes('leaguestandings')) {
          url.searchParams.set('LeagueID', '00')
          url.searchParams.set('Season', this.getNBASeason())
          url.searchParams.set('SeasonType', 'Regular Season')
        }
        break
        
      case 'mlb-stats':
        // MLB Stats API requires sportId
        url.searchParams.set('sportId', '1')
        if (endpoint.includes('schedule')) {
          const today = now.toISOString().split('T')[0]
          url.searchParams.set('startDate', today)
          url.searchParams.set('endDate', today)
        }
        break
        
      case 'nhl-stats':
        // NHL Stats API season format
        if (endpoint.includes('standings') || endpoint.includes('schedule')) {
          url.searchParams.set('season', this.getNHLSeason())
        }
        break
        
      case 'api-sports':
        // API-Sports requires league and season parameters
        if (config.leagues.length > 0) {
          url.searchParams.set('league', config.leagues[0])
          url.searchParams.set('season', currentYear.toString())
        }
        break
        
      case 'nfl-rapidapi':
        // NFL API season parameter
        url.searchParams.set('season', currentYear.toString())
        break
    }
  }
  
  private normalizeAPIResponse(data: any, config: SportAPIConfig, endpoint: string): any {
    // Normalize different API response formats to a common structure
    switch (config.apiProvider) {
      case 'nba-stats':
        if (data.resultSets && data.resultSets.length > 0) {
          const resultSet = data.resultSets[0]
          return {
            data: resultSet.rowSet || [],
            headers: resultSet.headers || [],
            count: resultSet.rowSet?.length || 0
          }
        }
        return { data: [], count: 0 }
        
      case 'mlb-stats':
      case 'nhl-stats':
        if (data.dates && Array.isArray(data.dates)) {
          // Schedule data
          return {
            data: data.dates.flatMap((date: any) => date.games || []),
            count: data.dates.reduce((total: number, date: any) => total + (date.games?.length || 0), 0)
          }
        } else if (data.teams) {
          return { data: data.teams, count: data.teams.length }
        } else if (data.people) {
          return { data: data.people, count: data.people.length }
        } else if (data.records) {
          return { data: data.records, count: data.records.length }
        }
        return { data: data, count: 1 }
        
      case 'api-sports':
        if (data.response) {
          return { data: data.response, count: data.response.length }
        }
        return { data: data, count: 1 }
        
      default:
        return { data: data, count: Array.isArray(data) ? data.length : 1 }
    }
  }
  
  private getNBASeason(): string {
    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth() + 1
    return month >= 10 ? `${year}-${(year + 1).toString().slice(-2)}` : `${year - 1}-${year.toString().slice(-2)}`
  }
  
  private getNHLSeason(): string {
    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth() + 1
    const seasonStartYear = month >= 10 ? year : year - 1
    return `${seasonStartYear}${seasonStartYear + 1}`
  }
}

const sportAPIClient = new SportAPIClient()

// Sport-specific data sync functions with proper API handling
async function syncGames(supabase: any, config: SportAPIConfig): Promise<number> {
  try {
    console.log(`Syncing games for ${config.displayName}...`)
    
    let gamesData: any = null
    
    // Try each endpoint for games
    for (const endpoint of config.endpoints.games) {
      try {
        const response = await sportAPIClient.fetchFromAPI(config, endpoint)
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
      console.log(`No games data available for ${config.displayName}`)
      return 0
    }
    
    // Normalize game data based on sport
    const gamesToInsert = gamesData.map((game: any) => 
      normalizeGameData(game, config)
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
    console.log(`Synced ${gamesToInsert.length} games for ${config.displayName}`)
    return gamesToInsert.length
    
  } catch (error) {
    console.error(`Error syncing games for ${config.displayName}:`, error)
    return 0
  }
}

async function syncTeams(supabase: any, config: SportAPIConfig): Promise<number> {
  try {
    console.log(`Syncing teams for ${config.displayName}...`)
    
    let teamsData: any = null
    
    // Try each endpoint for teams
    for (const endpoint of config.endpoints.teams) {
      try {
        const response = await sportAPIClient.fetchFromAPI(config, endpoint)
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
      console.log(`No teams data available for ${config.displayName}`)
      return 0
    }
    
    // Normalize team data based on sport
    const teamsToInsert = teamsData.map((team: any) => 
      normalizeTeamData(team, config)
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
    console.log(`Synced ${teamsToInsert.length} teams for ${config.displayName}`)
    return teamsToInsert.length
    
  } catch (error) {
    console.error(`Error syncing teams for ${config.displayName}:`, error)
    return 0
  }
}

async function syncPlayers(supabase: any, config: SportAPIConfig): Promise<number> {
  try {
    console.log(`Syncing players for ${config.displayName}...`)
    
    let playersData: any = null
    
    // Try each endpoint for players
    for (const endpoint of config.endpoints.players) {
      try {
        const response = await sportAPIClient.fetchFromAPI(config, endpoint)
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
      console.log(`No players data available for ${config.displayName}`)
      return 0
    }
    
    // Normalize player data based on sport
    const playersToInsert = playersData.map((player: any) => 
      normalizePlayerData(player, config)
    ).filter(Boolean)
    
    if (playersToInsert.length === 0) return 0
    
    // Upsert players
    const { error } = await supabase
      .from('players')
      .upsert(playersToInsert, { 
        onConflict: 'id',
        ignoreDuplicates: false 
      })
    
    if (error) throw error
    console.log(`Synced ${playersToInsert.length} players for ${config.displayName}`)
    return playersToInsert.length
    
  } catch (error) {
    console.error(`Error syncing players for ${config.displayName}:`, error)
    return 0
  }
}

async function syncStandings(supabase: any, config: SportAPIConfig): Promise<number> {
  try {
    console.log(`Syncing standings for ${config.displayName}...`)
    
    let standingsData: any = null
    
    // Try each endpoint for standings
    for (const endpoint of config.endpoints.standings) {
      try {
        const response = await sportAPIClient.fetchFromAPI(config, endpoint)
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
      console.log(`No standings data available for ${config.displayName}`)
      return 0
    }
    
    // Normalize standings data based on sport
    const standingsToInsert = standingsData.map((standing: any, index: number) => 
      normalizeStandingsData(standing, config, index)
    ).filter(Boolean)
    
    if (standingsToInsert.length === 0) return 0
    
    // Upsert standings
    const { error } = await supabase
      .from('standings')
      .upsert(standingsToInsert, { 
        onConflict: 'id',
        ignoreDuplicates: false 
      })
    
    if (error) throw error
    console.log(`Synced ${standingsToInsert.length} standings for ${config.displayName}`)
    return standingsToInsert.length
    
  } catch (error) {
    console.error(`Error syncing standings for ${config.displayName}:`, error)
    return 0
  }
}

// Data normalization functions for different sports APIs
function normalizeGameData(game: any, config: SportAPIConfig): any {
  const now = new Date()
  
  switch (config.apiProvider) {
    case 'nba-stats':
      // NBA Stats API format
      return {
        id: `nba_${game.GAME_ID || game.gameId || Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        sport: 'basketball',
        league: 'NBA',
        season: getCurrentSeason('basketball'),
        home_team_id: game.HOME_TEAM_ID || game.homeTeamId,
        away_team_id: game.VISITOR_TEAM_ID || game.visitorTeamId,
        home_team_name: game.HOME_TEAM_NAME || game.homeTeamName,
        away_team_name: game.VISITOR_TEAM_NAME || game.visitorTeamName,
        game_date: game.GAME_DATE_EST || game.gameDate || now.toISOString(),
        status: normalizeStatus(game.GAME_STATUS_TEXT || game.status || 'scheduled'),
        home_score: game.HOME_TEAM_WINS || game.homeScore,
        away_score: game.VISITOR_TEAM_WINS || game.awayScore,
        venue: game.ARENA_NAME || game.venue,
        last_updated: now.toISOString()
      }
      
    case 'mlb-stats':
      // MLB Stats API format
      return {
        id: `mlb_${game.gamePk || game.id || Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        sport: 'baseball',
        league: 'MLB',
        season: getCurrentSeason('baseball'),
        home_team_id: game.teams?.home?.team?.id,
        away_team_id: game.teams?.away?.team?.id,
        home_team_name: game.teams?.home?.team?.name,
        away_team_name: game.teams?.away?.team?.name,
        game_date: game.gameDate || game.officialDate || now.toISOString(),
        status: normalizeStatus(game.status?.detailedState || game.status?.abstractGameState || 'scheduled'),
        home_score: game.teams?.home?.score,
        away_score: game.teams?.away?.score,
        venue: game.venue?.name,
        last_updated: now.toISOString()
      }
      
    case 'nhl-stats':
      // NHL Stats API format
      return {
        id: `nhl_${game.gamePk || game.id || Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        sport: 'hockey',
        league: 'NHL',
        season: getCurrentSeason('hockey'),
        home_team_id: game.teams?.home?.team?.id,
        away_team_id: game.teams?.away?.team?.id,
        home_team_name: game.teams?.home?.team?.name,
        away_team_name: game.teams?.away?.team?.name,
        game_date: game.gameDate || now.toISOString(),
        status: normalizeStatus(game.status?.detailedState || game.status?.abstractGameState || 'scheduled'),
        home_score: game.teams?.home?.score,
        away_score: game.teams?.away?.score,
        venue: game.venue?.name,
        last_updated: now.toISOString()
      }
      
    case 'api-sports':
      // API-Sports format
      return {
        id: `soccer_${game.fixture?.id || game.id || Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        sport: 'soccer',
        league: game.league?.name || 'Unknown League',
        season: game.league?.season?.toString() || getCurrentSeason('soccer'),
        home_team_id: game.teams?.home?.id,
        away_team_id: game.teams?.away?.id,
        home_team_name: game.teams?.home?.name,
        away_team_name: game.teams?.away?.name,
        game_date: game.fixture?.date || game.date || now.toISOString(),
        status: normalizeStatus(game.fixture?.status?.short || game.status || 'scheduled'),
        home_score: game.goals?.home,
        away_score: game.goals?.away,
        venue: game.fixture?.venue?.name || game.venue,
        last_updated: now.toISOString()
      }
      
    default:
      // Generic format
      return {
        id: `${config.name}_${game.id || Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        sport: config.name,
        league: game.league || 'Unknown League',
        season: getCurrentSeason(config.name),
        home_team_id: game.home_team?.id || game.homeTeam?.id,
        away_team_id: game.away_team?.id || game.awayTeam?.id,
        home_team_name: game.home_team?.name || game.homeTeam?.name || game.home_name,
        away_team_name: game.away_team?.name || game.awayTeam?.name || game.away_name,
        game_date: game.date || game.scheduled || game.start_time || now.toISOString(),
        status: normalizeStatus(game.status || game.state || 'scheduled'),
        home_score: game.home_score || game.homeScore || game.home?.score,
        away_score: game.away_score || game.awayScore || game.away?.score,
        venue: game.venue?.name || game.location || game.stadium,
        last_updated: now.toISOString()
      }
  }
}

function normalizeTeamData(team: any, config: SportAPIConfig): any {
  const now = new Date()
  
  switch (config.apiProvider) {
    case 'nba-stats':
      // NBA Stats API format
      return {
        id: `nba_team_${team.TEAM_ID || team.teamId || Date.now()}`,
        name: team.TEAM_NAME || team.teamName || 'Unknown Team',
        sport: 'basketball',
        league: 'NBA',
        abbreviation: team.TEAM_ABBREVIATION || team.abbreviation,
        city: team.TEAM_CITY || team.city,
        logo_url: team.logo || team.logoUrl,
        colors: team.colors ? JSON.stringify(team.colors) : null,
        venue: team.ARENA_NAME || team.venue,
        is_active: team.active !== false,
        last_updated: now.toISOString()
      }
      
    case 'mlb-stats':
      // MLB Stats API format
      return {
        id: `mlb_team_${team.id || Date.now()}`,
        name: team.name || 'Unknown Team',
        sport: 'baseball',
        league: 'MLB',
        abbreviation: team.abbreviation,
        city: team.locationName,
        logo_url: team.logo || team.logoUrl,
        colors: team.colors ? JSON.stringify(team.colors) : null,
        venue: team.venue?.name,
        is_active: team.active !== false,
        last_updated: now.toISOString()
      }
      
    case 'nhl-stats':
      // NHL Stats API format
      return {
        id: `nhl_team_${team.id || Date.now()}`,
        name: team.name || 'Unknown Team',
        sport: 'hockey',
        league: 'NHL',
        abbreviation: team.abbreviation,
        city: team.locationName,
        logo_url: team.logo || team.logoUrl,
        colors: team.colors ? JSON.stringify(team.colors) : null,
        venue: team.venue?.name,
        is_active: team.active !== false,
        last_updated: now.toISOString()
      }
      
    default:
      // Generic format
      return {
        id: `${config.name}_team_${team.id || team.name?.replace(/\s+/g, '_').toLowerCase()}_${Date.now()}`,
        name: team.name || team.full_name || team.display_name || 'Unknown Team',
        sport: config.name,
        league: team.league || 'Unknown League',
        abbreviation: team.abbreviation || team.abbr || team.code,
        city: team.city || team.location,
        logo_url: team.logo || team.logo_url || team.image,
        colors: team.colors ? JSON.stringify(team.colors) : null,
        venue: team.venue?.name || team.stadium || team.arena,
        is_active: team.active !== false,
        last_updated: now.toISOString()
      }
  }
}

function normalizePlayerData(player: any, config: SportAPIConfig): any {
  const now = new Date()
  
  switch (config.apiProvider) {
    case 'nba-stats':
      // NBA Stats API format
      return {
        id: `nba_player_${player.PERSON_ID || player.personId || Date.now()}`,
        name: player.DISPLAY_FIRST_LAST || player.displayName || 'Unknown Player',
        sport: 'basketball',
        position: player.POSITION || player.position,
        team_id: player.TEAM_ID || player.teamId,
        team_name: player.TEAM_NAME || player.teamName,
        height: player.HEIGHT || player.height,
        weight: player.WEIGHT || player.weight,
        age: player.AGE || player.age,
        experience_years: player.EXP || player.experience,
        college: player.SCHOOL || player.college,
        country: player.COUNTRY || player.country,
        jersey_number: player.JERSEY_NUMBER || player.jerseyNumber,
        is_active: player.ROSTERSTATUS !== 'Inactive',
        headshot_url: player.headshot || player.image,
        last_updated: now.toISOString()
      }
      
    case 'mlb-stats':
      // MLB Stats API format
      return {
        id: `mlb_player_${player.id || Date.now()}`,
        name: player.fullName || player.name || 'Unknown Player',
        sport: 'baseball',
        position: player.primaryPosition?.name || player.position,
        team_id: player.teamId,
        team_name: player.teamName,
        height: player.height,
        weight: player.weight,
        age: player.currentAge || player.age,
        experience_years: player.experience,
        college: player.college,
        country: player.birthCountry,
        jersey_number: player.primaryNumber,
        is_active: player.active !== false,
        headshot_url: player.headshot || player.image,
        last_updated: now.toISOString()
      }
      
    case 'nhl-stats':
      // NHL Stats API format
      return {
        id: `nhl_player_${player.id || Date.now()}`,
        name: player.fullName || player.name || 'Unknown Player',
        sport: 'hockey',
        position: player.primaryPosition?.name || player.position,
        team_id: player.teamId,
        team_name: player.teamName,
        height: player.height,
        weight: player.weight,
        age: player.currentAge || player.age,
        experience_years: player.experience,
        college: player.college,
        country: player.birthCountry,
        jersey_number: player.primaryNumber,
        is_active: player.active !== false,
        headshot_url: player.headshot || player.image,
        last_updated: now.toISOString()
      }
      
    default:
      // Generic format
      return {
        id: `${config.name}_player_${player.id || player.name?.replace(/\s+/g, '_').toLowerCase()}_${Date.now()}`,
        name: player.name || player.full_name || player.display_name || 'Unknown Player',
        sport: config.name,
        position: player.position || player.pos,
        team_id: player.team_id || player.team?.id,
        team_name: player.team?.name || player.team_name,
        height: player.height,
        weight: player.weight,
        age: player.age,
        experience_years: player.experience || player.years_pro,
        college: player.college || player.university,
        country: player.country || player.nationality,
        jersey_number: player.jersey_number || player.number,
        is_active: player.active !== false,
        headshot_url: player.headshot || player.image || player.photo,
        last_updated: now.toISOString()
      }
  }
}

function normalizeStandingsData(standing: any, config: SportAPIConfig, index: number): any {
  const now = new Date()
  
  switch (config.apiProvider) {
    case 'nba-stats':
      // NBA Stats API format
      return {
        id: `nba_standings_${standing.TEAM_ID || standing.teamId || index}_${Date.now()}`,
        sport: 'basketball',
        league: 'NBA',
        season: getCurrentSeason('basketball'),
        team_id: standing.TEAM_ID || standing.teamId,
        team_name: standing.TEAM_NAME || standing.teamName || 'Unknown Team',
        position: standing.PLAYOFF_RANK || standing.rank || index + 1,
        wins: standing.W || standing.wins || 0,
        losses: standing.L || standing.losses || 0,
        ties: standing.T || standing.ties || 0,
        win_percentage: standing.W_PCT || standing.winPct,
        games_behind: standing.GB || standing.gamesBehind,
        points_for: standing.PTS || standing.pointsFor || 0,
        points_against: standing.OPP_PTS || standing.pointsAgainst || 0,
        last_updated: now.toISOString()
      }
      
    case 'mlb-stats':
      // MLB Stats API format
      return {
        id: `mlb_standings_${standing.team?.id || index}_${Date.now()}`,
        sport: 'baseball',
        league: standing.league?.name || 'MLB',
        season: getCurrentSeason('baseball'),
        team_id: standing.team?.id,
        team_name: standing.team?.name || 'Unknown Team',
        position: standing.divisionRank || index + 1,
        wins: standing.wins || 0,
        losses: standing.losses || 0,
        ties: standing.ties || 0,
        win_percentage: standing.pct,
        games_behind: standing.gamesBack,
        points_for: standing.runsScored || 0,
        points_against: standing.runsAllowed || 0,
        last_updated: now.toISOString()
      }
      
    case 'nhl-stats':
      // NHL Stats API format
      return {
        id: `nhl_standings_${standing.team?.id || index}_${Date.now()}`,
        sport: 'hockey',
        league: 'NHL',
        season: getCurrentSeason('hockey'),
        team_id: standing.team?.id,
        team_name: standing.teamName?.default || standing.team?.name || 'Unknown Team',
        position: standing.divisionSequence || index + 1,
        wins: standing.wins || 0,
        losses: standing.losses || 0,
        ties: standing.ties || 0,
        win_percentage: standing.winPctg,
        games_behind: standing.gamesBack,
        points_for: standing.goalsFor || 0,
        points_against: standing.goalsAgainst || 0,
        last_updated: now.toISOString()
      }
      
    default:
      // Generic format
      return {
        id: `${config.name}_standings_${standing.team?.id || standing.team_id || index}_${Date.now()}`,
        sport: config.name,
        league: standing.league || 'Unknown League',
        season: getCurrentSeason(config.name),
        team_id: standing.team?.id || standing.team_id,
        team_name: standing.team?.name || standing.team_name || standing.name || 'Unknown Team',
        position: standing.position || standing.rank || standing.place || index + 1,
        wins: standing.wins || standing.w || standing.victories || 0,
        losses: standing.losses || standing.l || standing.defeats || 0,
        ties: standing.ties || standing.t || standing.draws || 0,
        win_percentage: standing.win_percentage || standing.win_pct || standing.pct,
        games_behind: standing.games_behind || standing.gb || standing.games_back,
        points_for: standing.points_for || standing.pf || standing.goals_for || 0,
        points_against: standing.points_against || standing.pa || standing.goals_against || 0,
        last_updated: now.toISOString()
      }
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

    // Get comprehensive sports API configuration
    const sportsConfig = getSportsAPIConfig()
    const supportedSports = Object.keys(sportsConfig).filter(sport => sportsConfig[sport].isActive)
    
    if (supportedSports.length === 0) {
      throw new Error('No active sports configured. Please set up API keys and enable sports.')
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

    // Sync each sport with proper API handling
    for (const sportToSync of sportsToSync) {
      if (!supportedSports.includes(sportToSync)) {
        result.stats.errors.push(`Unsupported sport: ${sportToSync}`)
        continue
      }

      const config = sportsConfig[sportToSync]
      if (!config || !config.isActive) {
        result.stats.errors.push(`Sport ${sportToSync} is not active or configured`)
        continue
      }

      console.log(`Syncing data for ${config.displayName} using ${config.apiProvider}...`)

      try {
        // Sync each data type for this sport
        if (dataTypes.includes('games')) {
          const count = await syncGames(supabase, config)
          result.stats.games += count
        }

        if (dataTypes.includes('teams')) {
          const count = await syncTeams(supabase, config)
          result.stats.teams += count
        }

        if (dataTypes.includes('players')) {
          const count = await syncPlayers(supabase, config)
          result.stats.players += count
        }

        if (dataTypes.includes('standings')) {
          const count = await syncStandings(supabase, config)
          result.stats.standings += count
        }

        console.log(`Successfully synced ${config.displayName}`)

      } catch (error) {
        const errorMsg = `Error syncing ${config.displayName}: ${error instanceof Error ? error.message : String(error)}`
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