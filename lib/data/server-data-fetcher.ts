/**
 * Server-Side Data Fetcher - Optimized Version
 * Fetches initial data server-side with pagination, parallel queries, and caching
 */

import { createClient } from '@/lib/supabase/server'
import { dynamicSportConfigService } from '@/lib/services/dynamic-sport-config-service'
import { databaseCacheService } from '@/lib/services/database-cache-service'
import { structuredLogger } from '@/lib/services/structured-logger'
import type { Game, Prediction, BettingOdds, LeagueStanding, Player } from '@/types/api-responses'

export interface ServerInitialData {
  games: Game[]
  predictions: Prediction[]
  odds: BettingOdds[]
  standings: LeagueStanding[]
  players: Player[]
  sportsData: Record<string, any>
  supportedSports: string[]
  meta: {
    timestamp: string
    totalCount: number
    loadTime: number
    cached: boolean
  }
}

interface DataFetchOptions {
  limit?: number
  useCache?: boolean
  cacheTTL?: number
}

const DEFAULT_LIMITS = {
  games: 20,      // Further reduced for faster initial load
  predictions: 10, // Minimal predictions for initial load
  odds: 50,       // Reduced odds for faster loading
  standings: 50,  // Reduced standings
  players: 100    // Reduced players
}

const CACHE_TTL = 300 // 5 minutes

export async function fetchServerInitialData(options: DataFetchOptions = {}): Promise<ServerInitialData> {
  const startTime = Date.now()
  const requestId = crypto.randomUUID()
  
  try {
    // Check cache first if enabled
    if (options.useCache !== false) {
      const cacheKey = `server-initial-data-${JSON.stringify(options)}`
      const cached = await databaseCacheService.get(cacheKey) as ServerInitialData | null
      if (cached) {
        structuredLogger.info('Server initial data cache hit', { requestId, cacheKey })
        return {
          ...cached,
          meta: {
            ...cached.meta,
            cached: true,
            loadTime: Date.now() - startTime
          }
        }
      }
    }

    // Initialize sport configuration
    await dynamicSportConfigService.initialize()
    const supportedSports = dynamicSportConfigService.getAllSports()
      .filter(sport => sport.is_active)
      .map(sport => sport.name)

    if (supportedSports.length === 0) {
      return createEmptyResponse(startTime)
    }

    // Fetch data in parallel with optimized limits
    const limits = {
      games: options.limit || DEFAULT_LIMITS.games,
      predictions: options.limit || DEFAULT_LIMITS.predictions,
      odds: options.limit || DEFAULT_LIMITS.odds,
      standings: options.limit || DEFAULT_LIMITS.standings,
      players: options.limit || DEFAULT_LIMITS.players
    }

    const [gamesData, predictionsData, oddsData, standingsData, playersData] = await Promise.allSettled([
      fetchGamesData(supportedSports, limits.games, requestId),
      fetchPredictionsData(supportedSports, limits.predictions, requestId),
      fetchOddsData(supportedSports, limits.odds, requestId),
      fetchStandingsData(supportedSports, limits.standings, requestId),
      fetchPlayersData(supportedSports, limits.players, requestId)
    ])

    // Process results and handle partial failures
    const games = gamesData.status === 'fulfilled' ? gamesData.value : []
    const predictions = predictionsData.status === 'fulfilled' ? predictionsData.value : []
    const odds = oddsData.status === 'fulfilled' ? oddsData.value : []
    const standings = standingsData.status === 'fulfilled' ? standingsData.value : []
    const players = playersData.status === 'fulfilled' ? playersData.value : []

    // Log any failures
    const failures = [gamesData, predictionsData, oddsData, standingsData, playersData]
      .filter(result => result.status === 'rejected')
      .map(result => (result as PromiseRejectedResult).reason)

    if (failures.length > 0) {
      structuredLogger.warn('Partial data fetch failures', { 
        requestId, 
        failureCount: failures.length,
        failures: failures.map(f => f.message)
      })
    }

    const totalCount = games.length + predictions.length + odds.length + standings.length + players.length
    const loadTime = Date.now() - startTime

    const result: ServerInitialData = {
      games,
      predictions,
      odds,
      standings,
      players,
      sportsData: {},
      supportedSports,
      meta: {
        timestamp: new Date().toISOString(),
        totalCount,
        loadTime,
        cached: false
      }
    }

    // Cache the result if caching is enabled
    if (options.useCache !== false) {
      const cacheKey = `server-initial-data-${JSON.stringify(options)}`
      await databaseCacheService.set(cacheKey, result, options.cacheTTL || CACHE_TTL)
    }

    structuredLogger.info('Server initial data fetched successfully', {
      requestId,
      totalCount,
      loadTime,
      gamesCount: games.length,
      predictionsCount: predictions.length,
      oddsCount: odds.length,
      standingsCount: standings.length,
      playersCount: players.length
    })

    return result
  } catch (error) {
    structuredLogger.error('Failed to fetch server initial data', {
      requestId,
      error: error instanceof Error ? error.message : String(error),
      loadTime: Date.now() - startTime
    })
    return createEmptyResponse(startTime)
  }
}

async function fetchGamesData(supportedSports: string[], limit: number, requestId: string): Promise<Game[]> {
  try {
    const supabase = await createClient()
    if (!supabase) return []

    const { data: games, error } = await supabase
      .from('games')
      .select(`
        *,
        home_team:teams!games_home_team_id_fkey(
          id, name, abbreviation, logo_url, city, league_name
        ),
        away_team:teams!games_away_team_id_fkey(
          id, name, abbreviation, logo_url, city, league_name
        )
      `)
      .in('sport', supportedSports)
      .order('game_date', { ascending: false })
      .limit(limit)

    if (error) {
      structuredLogger.error('Error fetching games data', { requestId, error: error.message })
      return []
    }

    return games || []
  } catch (error) {
    structuredLogger.error('Failed to fetch games data', { 
      requestId, 
      error: error instanceof Error ? error.message : String(error) 
    })
    return []
  }
}

async function fetchPredictionsData(supportedSports: string[], limit: number, requestId: string): Promise<Prediction[]> {
  try {
    const supabase = await createClient()
    if (!supabase) return []

    const { data: predictions, error } = await supabase
      .from('predictions')
      .select(`
        *,
        game:games(
          id, sport, home_team_name, away_team_name, game_date, status
        )
      `)
      .in('sport', supportedSports)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      structuredLogger.error('Error fetching predictions data', { requestId, error: error.message })
      return []
    }

    return predictions || []
  } catch (error) {
    structuredLogger.error('Failed to fetch predictions data', { 
      requestId, 
      error: error instanceof Error ? error.message : String(error) 
    })
    return []
  }
}

async function fetchOddsData(supportedSports: string[], limit: number, requestId: string): Promise<BettingOdds[]> {
  try {
    const supabase = await createClient()
    if (!supabase) return []

    const { data: odds, error } = await supabase
      .from('betting_odds')
      .select('*')
      .in('sport', supportedSports)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      structuredLogger.error('Error fetching odds data', { requestId, error: error.message })
      return []
    }

    return odds || []
  } catch (error) {
    structuredLogger.error('Failed to fetch odds data', { 
      requestId, 
      error: error instanceof Error ? error.message : String(error) 
    })
    return []
  }
}

async function fetchStandingsData(supportedSports: string[], limit: number, requestId: string): Promise<LeagueStanding[]> {
  try {
    const supabase = await createClient()
    if (!supabase) return []

    const { data: standings, error } = await supabase
      .from('league_standings')
      .select('*')
      .in('sport', supportedSports)
      .order('position', { ascending: true })
      .limit(limit)

    if (error) {
      structuredLogger.error('Error fetching standings data', { requestId, error: error.message })
      return []
    }

    return standings || []
  } catch (error) {
    structuredLogger.error('Failed to fetch standings data', { 
      requestId, 
      error: error instanceof Error ? error.message : String(error) 
    })
    return []
  }
}

async function fetchPlayersData(supportedSports: string[], limit: number, requestId: string): Promise<Player[]> {
  try {
    const supabase = await createClient()
    if (!supabase) return []

    const { data: players, error } = await supabase
      .from('player_profiles')
      .select('*')
      .in('sport', supportedSports)
      .order('name', { ascending: true })
      .limit(limit)

    if (error) {
      structuredLogger.error('Error fetching players data', { requestId, error: error.message })
      return []
    }

    return players || []
  } catch (error) {
    structuredLogger.error('Failed to fetch players data', { 
      requestId, 
      error: error instanceof Error ? error.message : String(error) 
    })
    return []
  }
}

function createEmptyResponse(startTime: number): ServerInitialData {
  return {
    games: [],
    predictions: [],
    odds: [],
    standings: [],
    players: [],
    sportsData: {},
    supportedSports: [],
    meta: {
      timestamp: new Date().toISOString(),
      totalCount: 0,
      loadTime: Date.now() - startTime,
      cached: false
    }
  }
}
