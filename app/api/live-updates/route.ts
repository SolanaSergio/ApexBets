import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { espnClient } from "@/lib/sports-apis/espn-client"
import { ballDontLieClient } from "@/lib/sports-apis/balldontlie-client"
import { sportsDBClient } from "@/lib/sports-apis/sportsdb-client"
import { normalizeGameData, normalizeTeamData } from "@/lib/utils/data-utils"

// Simple in-memory cache to reduce API calls
const liveDataCache = new Map<string, { data: any, timestamp: number }>()
const CACHE_TTL = 30000 // 30 seconds cache

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sport = searchParams.get("sport") || "all"
    const league = searchParams.get("league") || "all"
    const useRealData = searchParams.get("real") === "true"

    // If requesting real data, prioritize live APIs
    if (useRealData) {
      return await getLiveDataFromAPIs(sport, league)
    }

    const supabase = await createClient()
    
    if (!supabase) {
      return NextResponse.json({ 
        success: false,
        error: "Database connection failed",
        live: [],
        recent: [],
        upcoming: [],
        summary: {
          totalLive: 0,
          totalRecent: 0,
          totalUpcoming: 0,
          lastUpdated: new Date().toISOString()
        }
      }, { status: 500 })
    }
    
    // Get live games from database with strict live status filtering - ONLY truly live games
    let liveGamesQuery = supabase
      .from('games')
      .select(`
        *,
        home_team_data:teams!games_home_team_id_fkey(name, logo_url, abbreviation),
        away_team_data:teams!games_away_team_id_fkey(name, logo_url, abbreviation)
      `)
      .in('status', ['live', 'in_progress', 'in progress'])
      .not('home_score', 'is', null)
      .not('away_score', 'is', null)
      .or('home_score.gt.0,away_score.gt.0') // At least one team must have scored
      .order('game_date', { ascending: true })

    // Add sport filter only if not "all"
    if (sport !== "all") {
      liveGamesQuery = liveGamesQuery.eq('sport', sport)
    }

    const { data: liveGames, error: liveGamesError } = await liveGamesQuery

    if (liveGamesError) {
      console.error('Live games error:', liveGamesError)
      return NextResponse.json({ 
        success: false,
        error: "Failed to fetch live games",
        details: liveGamesError.message,
        live: [],
        recent: [],
        upcoming: [],
        summary: {
          totalLive: 0,
          totalRecent: 0,
          totalUpcoming: 0,
          lastUpdated: new Date().toISOString()
        }
      }, { status: 500 })
    }

    // Get recent finished games for context (last 24 hours)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    let recentGamesQuery = supabase
      .from('games')
      .select(`
        *,
        home_team_data:teams!games_home_team_id_fkey(name, logo_url, abbreviation),
        away_team_data:teams!games_away_team_id_fkey(name, logo_url, abbreviation)
      `)
      .in('status', ['finished', 'completed', 'final'])
      .gte('game_date', oneDayAgo)
      .order('game_date', { ascending: false })
      .limit(10)

    // Add sport filter only if not "all"
    if (sport !== "all") {
      recentGamesQuery = recentGamesQuery.eq('sport', sport)
    }

    const { data: recentGames, error: recentGamesError } = await recentGamesQuery

    if (recentGamesError) {
      console.error('Recent games error:', recentGamesError)
      // Continue with empty recent games rather than failing completely
    }

    // Get upcoming games (next 7 days)
    const now = new Date().toISOString()
    const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    let upcomingGamesQuery = supabase
      .from('games')
      .select(`
        *,
        home_team_data:teams!games_home_team_id_fkey(name, logo_url, abbreviation),
        away_team_data:teams!games_away_team_id_fkey(name, logo_url, abbreviation)
      `)
      .in('status', ['scheduled', 'not_started', 'upcoming'])
      .gte('game_date', now)
      .lte('game_date', nextWeek)
      .order('game_date', { ascending: true })
      .limit(10)

    // Add sport filter only if not "all"
    if (sport !== "all") {
      upcomingGamesQuery = upcomingGamesQuery.eq('sport', sport)
    }

    const { data: upcomingGames, error: upcomingGamesError } = await upcomingGamesQuery

    if (upcomingGamesError) {
      console.error('Upcoming games error:', upcomingGamesError)
      // Continue with empty upcoming games rather than failing completely
    }

    // Format live games with enhanced data - NO hardcoded sport values
    const formattedLiveGames = (liveGames || []).map(game => {
      const homeTeam = game.home_team_data || { name: game.home_team || 'Visiting Team', logo_url: null, abbreviation: null }
      const awayTeam = game.away_team_data || { name: game.away_team || 'Visiting Team', logo_url: null, abbreviation: null }
      
      // Normalize team data
      const normalizedHomeTeam = normalizeTeamData(homeTeam, sport, game.league)
      const normalizedAwayTeam = normalizeTeamData(awayTeam, sport, game.league)
      
      const gameData = {
        id: game.id,
        home_team_id: game.home_team_id,
        away_team_id: game.away_team_id,
        game_date: game.game_date,
        season: game.season,
        week: game.week,
        home_score: game.home_score,
        away_score: game.away_score,
        status: game.status,
        venue: game.venue,
        league: game.league,
        sport: game.sport,
        broadcast: game.broadcast,
        attendance: game.attendance,
        game_time: game.game_time,
        time_remaining: game.time_remaining,
        quarter: game.quarter,
        period: game.period,
        possession: game.possession,
        last_play: game.last_play,
        home_team: normalizedHomeTeam,
        away_team: normalizedAwayTeam,
        created_at: game.created_at,
        updated_at: game.updated_at
      }
      
      // Normalize and return the game data
      return normalizeGameData(gameData, sport, game.league)
    })

    // Format recent games with enhanced data
    const formattedRecentGames = (recentGames || []).map(game => {
      const homeTeam = game.home_team_data || { name: game.home_team || 'Visiting Team', logo_url: null, abbreviation: null }
      const awayTeam = game.away_team_data || { name: game.away_team || 'Visiting Team', logo_url: null, abbreviation: null }
      
      // Normalize team data
      const normalizedHomeTeam = normalizeTeamData(homeTeam, sport, game.league)
      const normalizedAwayTeam = normalizeTeamData(awayTeam, sport, game.league)
      
      const gameData = {
        id: game.id,
        home_team_id: game.home_team_id,
        away_team_id: game.away_team_id,
        game_date: game.game_date,
        season: game.season,
        week: game.week,
        home_score: game.home_score,
        away_score: game.away_score,
        status: game.status,
        venue: game.venue,
        league: game.league,
        sport: game.sport,
        broadcast: game.broadcast,
        attendance: game.attendance,
        game_time: game.game_time,
        time_remaining: game.time_remaining,
        quarter: game.quarter,
        period: game.period,
        possession: game.possession,
        last_play: game.last_play,
        home_team: normalizedHomeTeam,
        away_team: normalizedAwayTeam,
        created_at: game.created_at,
        updated_at: game.updated_at
      }
      
      // Normalize and return the game data
      return normalizeGameData(gameData, sport, game.league)
    })

    // Format upcoming games with enhanced data
    const formattedUpcomingGames = (upcomingGames || []).map(game => {
      const homeTeam = game.home_team_data || { name: game.home_team || 'Visiting Team', logo_url: null, abbreviation: null }
      const awayTeam = game.away_team_data || { name: game.away_team || 'Visiting Team', logo_url: null, abbreviation: null }
      
      // Normalize team data
      const normalizedHomeTeam = normalizeTeamData(homeTeam, sport, game.league)
      const normalizedAwayTeam = normalizeTeamData(awayTeam, sport, game.league)
      
      const gameData = {
        id: game.id,
        home_team_id: game.home_team_id,
        away_team_id: game.away_team_id,
        game_date: game.game_date,
        season: game.season,
        week: game.week,
        home_score: game.home_score,
        away_score: game.away_score,
        status: game.status,
        venue: game.venue,
        league: game.league,
        sport: game.sport,
        broadcast: game.broadcast,
        attendance: game.attendance,
        game_time: game.game_time,
        time_remaining: game.time_remaining,
        quarter: game.quarter,
        period: game.period,
        possession: game.possession,
        last_play: game.last_play,
        home_team: normalizedHomeTeam,
        away_team: normalizedAwayTeam,
        created_at: game.created_at,
        updated_at: game.updated_at
      }
      
      // Normalize and return the game data
      return normalizeGameData(gameData, sport, game.league)
    })

    // Get live odds for live games
    const liveGameIds = formattedLiveGames.map(game => game.id)
    let liveOdds = []
    
    if (liveGameIds.length > 0) {
      const { data: odds, error: oddsError } = await supabase
        .from('odds')
        .select('*')
        .in('game_id', liveGameIds)
        .eq('sport', sport)

      if (!oddsError) {
        liveOdds = odds || []
      }
    }

    // Group odds by game
    const oddsByGame = liveOdds.reduce((acc, odd) => {
      if (!acc[odd.game_id]) {
        acc[odd.game_id] = []
      }
      acc[odd.game_id].push({
        betType: odd.bet_type,
        side: odd.side,
        odds: odd.odds,
        bookmaker: odd.bookmaker || "Unknown"
      })
      return acc
    }, {} as Record<string, any[]>)

    // Add odds to live games
    const liveGamesWithOdds = formattedLiveGames.map(game => ({
      ...game,
      odds: oddsByGame[game.id] || []
    }))

    return NextResponse.json({
      success: true,
      live: liveGamesWithOdds,
      recent: formattedRecentGames,
      upcoming: formattedUpcomingGames,
      summary: {
        totalLive: formattedLiveGames.length,
        totalRecent: formattedRecentGames.length,
        totalUpcoming: formattedUpcomingGames.length,
        lastUpdated: new Date().toISOString(),
        dataSource: "database"
      },
      sport,
      league
    })

  } catch (error) {
    console.error("Live updates API error:", error)
    return NextResponse.json({
      success: false,
      error: "Internal server error",
      live: [],
      recent: [],
      upcoming: [],
      summary: {
        totalLive: 0,
        totalRecent: 0,
        totalUpcoming: 0,
        lastUpdated: new Date().toISOString(),
        dataSource: "error"
      }
    }, { status: 500 })
  }
}

/**
 * Get live data directly from APIs instead of database
 */
async function getLiveDataFromAPIs(sport: string, league: string) {
  try {
    // Check cache first
    const cacheKey = `live-data-${sport}-${league}`
    const cached = liveDataCache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      console.log(`Returning cached data for ${sport}`)
      return NextResponse.json(cached.data)
    }

    const liveGames: any[] = []
    const recentGames: any[] = []
    const upcomingGames: any[] = []

    // Get all active sports from database
    const supabase = await createClient()
    const { data: activeSports } = await supabase
      .from('sports')
      .select('name, display_name, data_source, update_frequency')
      .eq('is_active', true)
      .order('name')

    const sportsToCheck = sport === "all" ? activeSports?.map(s => s.name) || [] : [sport]

    // Try to get live data from multiple sources for each sport
    for (const currentSport of sportsToCheck) {
      const sportConfig = activeSports?.find(s => s.name === currentSport)
      if (!sportConfig) continue

      try {
        await getLiveDataForSport(currentSport, sportConfig, liveGames, recentGames, upcomingGames)
      } catch (error) {
        console.warn(`Failed to get live data for ${currentSport}:`, error)
      }
    }

    const responseData = {
      success: true,
      live: liveGames,
      recent: recentGames.slice(0, 10),
      upcoming: upcomingGames.slice(0, 10),
      summary: {
        totalLive: liveGames.length,
        totalRecent: recentGames.length,
        totalUpcoming: upcomingGames.length,
        lastUpdated: new Date().toISOString(),
        dataSource: "live_apis",
        sportsChecked: sportsToCheck
      },
      sport,
      league
    }

    // Cache the response
    liveDataCache.set(cacheKey, { data: responseData, timestamp: Date.now() })

    return NextResponse.json(responseData)
  } catch (error) {
    console.error('Live API data fetch failed:', error)
    return NextResponse.json({
      success: false,
      error: "Failed to fetch live data",
      live: [],
      recent: [],
      upcoming: [],
      summary: {
        totalLive: 0,
        totalRecent: 0,
        totalUpcoming: 0,
        lastUpdated: new Date().toISOString(),
        dataSource: "error"
      }
    }, { status: 500 })
  }
}

/**
 * Get live data for a specific sport - FULLY DYNAMIC
 */
async function getLiveDataForSport(sport: string, sportConfig: any, liveGames: any[], recentGames: any[], upcomingGames: any[]) {
  const dataSource = sportConfig.data_source || 'sportsdb'
  
  try {
    // Try primary data source first
    await tryDataSource(sport, dataSource, liveGames, recentGames, upcomingGames)
    
    // If no live games found, try fallback sources
    if (liveGames.length === 0) {
      await tryFallbackSources(sport, liveGames, recentGames, upcomingGames)
    }
  } catch (error) {
    console.warn(`Failed to get live data for ${sport} from ${dataSource}:`, error)
  }
}

/**
 * Try a specific data source for live data
 */
async function tryDataSource(sport: string, dataSource: string, liveGames: any[], recentGames: any[], upcomingGames: any[]) {
  switch (dataSource) {
    case 'espn':
      await tryESPN(sport, liveGames, recentGames, upcomingGames)
      break
    case 'sportsdb':
      await trySportsDB(sport, liveGames, recentGames, upcomingGames)
      break
    case 'balldontlie':
      if (sport === 'basketball') {
        await tryBallDontLie(sport, liveGames, recentGames, upcomingGames)
      }
      break
    default:
      // Try SportsDB as universal fallback
      await trySportsDB(sport, liveGames, recentGames, upcomingGames)
  }
}

/**
 * Try ESPN API for live data
 */
async function tryESPN(sport: string, liveGames: any[], recentGames: any[], upcomingGames: any[]) {
  try {
    let espnGames: any[] = []
    
    // Dynamically call the appropriate ESPN method based on sport
    switch (sport) {
      case 'basketball':
        espnGames = await espnClient.getNBAScoreboard()
        break
      case 'football':
        espnGames = await espnClient.getNFLScoreboard()
        break
      // Add more sports as needed
      default:
        return // ESPN doesn't support this sport
    }
    
    if (espnGames && espnGames.length > 0) {
      espnGames.forEach(game => {
        const formattedGame = formatESPNGame(game, sport)
        const normalizedGame = normalizeGameData(formattedGame, sport, formattedGame.league)
        
        // Categorize games based on status
        if (normalizedGame.status === 'live' && (normalizedGame.home_score > 0 || normalizedGame.away_score > 0)) {
          liveGames.push(normalizedGame)
        } else if (normalizedGame.status === 'finished') {
          recentGames.push(normalizedGame)
        } else if (normalizedGame.status === 'scheduled') {
          upcomingGames.push(normalizedGame)
        }
      })
    }
  } catch (error) {
    console.warn(`ESPN ${sport} data fetch failed:`, error)
  }
}

/**
 * Try SportsDB API for live data
 */
async function trySportsDB(sport: string, liveGames: any[], recentGames: any[], upcomingGames: any[]) {
  try {
    // Check if SportsDB is available before making request
    const rateLimitStatus = sportsDBClient.getRateLimitStatus()
    if (!rateLimitStatus.isAvailable) {
      console.warn(`SportsDB rate limit exceeded for ${sport}, skipping`)
      return
    }

    const today = new Date().toISOString().split('T')[0]
    const events = await sportsDBClient.getEventsByDate(today, sport)

    if (events && Array.isArray(events)) {
      events.forEach(event => {
        try {
          const formattedGame = formatSportsDBGame(event, sport)
          const normalizedGame = normalizeGameData(formattedGame, sport, event.strLeague)

          if (normalizedGame.status === 'live') {
            liveGames.push(normalizedGame)
          } else if (normalizedGame.status === 'finished') {
            recentGames.push(normalizedGame)
          } else {
            upcomingGames.push(normalizedGame)
          }
        } catch (formatError) {
          console.warn(`Failed to format SportsDB game for ${sport}:`, formatError)
        }
      })
    }
  } catch (error) {
    // Handle rate limiting more gracefully
    if (error instanceof Error && error.message.includes('Rate limit')) {
      console.warn(`SportsDB ${sport} rate limited, will retry later`)
    } else if (error instanceof Error && error.message.includes('temporarily unavailable')) {
      console.warn(`SportsDB ${sport} temporarily unavailable`)
    } else {
      console.warn(`SportsDB ${sport} data fetch failed:`, error)
    }
  }
}

/**
 * Try Ball Don't Lie API (basketball only)
 */
async function tryBallDontLie(sport: string, liveGames: any[], recentGames: any[], upcomingGames: any[]) {
  if (sport !== 'basketball' || !ballDontLieClient.isConfigured()) return
  
  try {
    const todaysGames = await ballDontLieClient.getTodaysGames()
    todaysGames.forEach(game => {
      const formattedGame = formatBallDontLieGame(game, sport)
      const normalizedGame = normalizeGameData(formattedGame, sport, 'NBA')
      
      if (normalizedGame.status === 'live' && (normalizedGame.home_score > 0 || normalizedGame.away_score > 0)) {
        liveGames.push(normalizedGame)
      } else if (normalizedGame.status === 'finished') {
        recentGames.push(normalizedGame)
      } else {
        upcomingGames.push(normalizedGame)
      }
    })
  } catch (error) {
    console.warn(`Ball Don't Lie data fetch failed:`, error)
  }
}

/**
 * Try fallback sources when primary fails
 */
async function tryFallbackSources(sport: string, liveGames: any[], recentGames: any[], upcomingGames: any[]) {
  // Check if we already have some data before trying SportsDB
  const hasData = liveGames.length > 0 || recentGames.length > 0 || upcomingGames.length > 0

  if (!hasData) {
    // Only try SportsDB if we have no data at all
    await trySportsDB(sport, liveGames, recentGames, upcomingGames)
  } else {
    console.log(`Skipping SportsDB fallback for ${sport} - already have data`)
  }
}

/**
 * Format ESPN game data
 */
function formatESPNGame(game: any, sport: string) {
  const homeTeamData = game.competitions[0]?.competitors.find((c: any) => c.homeAway === 'home')?.team || {}
  const awayTeamData = game.competitions[0]?.competitors.find((c: any) => c.homeAway === 'away')?.team || {}
  
  const homeTeam = {
    name: homeTeamData.displayName || 'Home Team',
    logo_url: homeTeamData.logo,
    abbreviation: homeTeamData.abbreviation
  }
  
  const awayTeam = {
    name: awayTeamData.displayName || 'Away Team',
    logo_url: awayTeamData.logo,
    abbreviation: awayTeamData.abbreviation
  }
  
  // Determine league dynamically based on sport
  const league = getLeagueForSport(sport)
  
  return {
    id: game.id,
    home_team_id: `espn_home_${game.id}`,
    away_team_id: `espn_away_${game.id}`,
    game_date: game.date,
    season: new Date().getFullYear().toString(),
    home_score: parseInt(game.competitions[0]?.competitors.find((c: any) => c.homeAway === 'home')?.score || '0'),
    away_score: parseInt(game.competitions[0]?.competitors.find((c: any) => c.homeAway === 'away')?.score || '0'),
    status: game.status.type.state === 'in' ? 'live' : 
           game.status.type.completed ? 'finished' : 'scheduled',
    period: game.status.period ? `${game.status.period}Q` : null,
    time_remaining: game.status.displayClock || null,
    league: league,
    venue: game.competitions[0]?.venue?.fullName,
    sport: sport,
    home_team: homeTeam,
    away_team: awayTeam
  }
}

/**
 * Format SportsDB game data
 */
function formatSportsDBGame(event: any, sport: string) {
  const homeTeam = {
    name: event.strHomeTeam,
    logo_url: null,
    abbreviation: null
  }
  
  const awayTeam = {
    name: event.strAwayTeam,
    logo_url: null,
    abbreviation: null
  }
  
  return {
    id: `tsdb_${event.idEvent}`,
    home_team_id: `tsdb_home_${event.idEvent}`,
    away_team_id: `tsdb_away_${event.idEvent}`,
    game_date: event.dateEvent,
    season: new Date().getFullYear().toString(),
    home_score: event.intHomeScore ? parseInt(event.intHomeScore) : null,
    away_score: event.intAwayScore ? parseInt(event.intAwayScore) : null,
    status: event.strStatus?.toLowerCase().includes('live') ? 'live' : 
           event.strStatus?.toLowerCase().includes('finished') ? 'finished' : 'scheduled',
    period: null,
    time_remaining: event.strTime,
    league: event.strLeague,
    sport: sport,
    home_team: homeTeam,
    away_team: awayTeam
  }
}

/**
 * Format Ball Don't Lie game data
 */
function formatBallDontLieGame(game: any, sport: string) {
  const homeTeam = {
    name: game.home_team.full_name,
    logo_url: null,
    abbreviation: game.home_team.abbreviation
  }
  
  const awayTeam = {
    name: game.visitor_team.full_name,
    logo_url: null,
    abbreviation: game.visitor_team.abbreviation
  }
  
  return {
    id: `bdl_${game.id}`,
    home_team_id: `bdl_home_${game.id}`,
    away_team_id: `bdl_away_${game.id}`,
    game_date: game.date,
    season: new Date().getFullYear().toString(),
    home_score: game.home_team_score,
    away_score: game.visitor_team_score,
    status: game.status === 'Final' ? 'finished' : 
           game.status.includes('Q') && (game.home_team_score > 0 || game.visitor_team_score > 0) ? 'live' : 'scheduled',
    period: game.period ? `${game.period}Q` : null,
    time_remaining: game.time || null,
    league: 'NBA',
    sport: sport,
    home_team: homeTeam,
    away_team: awayTeam
  }
}

/**
 * Get league for sport dynamically
 */
function getLeagueForSport(sport: string): string {
  const leagueMap: Record<string, string> = {
    'basketball': 'NBA',
    'football': 'NFL',
    'baseball': 'MLB',
    'hockey': 'NHL',
    'soccer': 'MLS',
    'tennis': 'ATP',
    'golf': 'PGA'
  }
  return leagueMap[sport] || sport.toUpperCase()
}