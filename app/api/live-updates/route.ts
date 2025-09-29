import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { normalizeGameData } from "@/lib/utils/data-utils"
import { databaseOptimizer } from "@/lib/database/optimize-queries"
import { getCache, setCache } from "@/lib/redis"

// Explicitly set runtime to suppress warnings
export const runtime = 'nodejs'

const CACHE_TTL = 30 // 30 seconds cache

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sport = searchParams.get("sport") || "all"
    const league = searchParams.get("league") || "all"
    const useRealData = searchParams.get("real") === "true"

    const cacheKey = `live-updates-${sport}-${league}`;
    const cached = await getCache(cacheKey);
    if (cached) {
        return NextResponse.json(cached);
    }

    // Always check database first, even for real data requests
    // Only fall back to APIs if database has no recent data
    const databaseResult = await getLiveDataFromDatabase(sport, league)
    
    // If we have recent data from database, return it
    if (databaseResult && (databaseResult.summary.totalLive > 0 || databaseResult.summary.totalRecent > 0)) {
      console.log(`Returning database data for ${sport}`)
      await setCache(cacheKey, databaseResult, CACHE_TTL);
      return NextResponse.json(databaseResult)
    }

    // If requesting real data or no database data available, try APIs
    if (useRealData || !databaseResult) {
      console.log(`Getting live data from APIs for ${sport}`)
      const apiResult = await getLiveDataFromAPIs(sport, league)
        await setCache(cacheKey, apiResult, CACHE_TTL);
      return NextResponse.json(apiResult)
    }

    // Return database result even if empty
    console.log(`Returning empty database data for ${sport}`)
    await setCache(cacheKey, databaseResult, CACHE_TTL);
    return NextResponse.json(databaseResult)

  } catch (error) {
    console.error('Live updates API error:', error)
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
 * Get live data from database first using Supabase client
 */
async function getLiveDataFromDatabase(sport: string, league: string) {
  try {
    // Create Supabase client
    const supabase = await createClient()

    if (!supabase) {
      throw new Error("Failed to create Supabase client")
    }

    // Use optimized database queries
    const liveGames = await databaseOptimizer.getLiveGames(sport, 50)

    // Use optimized database queries
    const recentGames = await databaseOptimizer.getRecentGames(sport, 24, 50)

    // Use optimized database queries
    const upcomingGames = await databaseOptimizer.getUpcomingGames(sport, 7, 50)

    // Normalize game data
    const normalizedLiveGames = (liveGames || []).map((game: any) => {
      const homeTeam = game.home_team_data || { 
        name: game.home_team || 'Home Team', 
        logo_url: null, 
        abbreviation: null 
      }
      const awayTeam = game.away_team_data || { 
        name: game.away_team || 'Visiting Team', 
        logo_url: null, 
        abbreviation: null 
      }
      
      const gameData = {
        id: game.id,
        home_team_id: game.home_team_id,
        away_team_id: game.away_team_id,
        game_date: game.game_date,
        season: game.season,
        // // week: game.week // Column does not exist in database, // Column does not exist in database
        home_score: game.home_score,
        away_score: game.away_score,
        status: game.status,
        venue: game.venue,
        league: game.league,
        sport: game.sport,
        attendance: game.attendance,
        game_type: game.game_type,
        overtime_periods: game.overtime_periods,
        home_team: homeTeam,
        away_team: awayTeam,
        created_at: game.created_at,
        updated_at: game.updated_at
      }
      
      return normalizeGameData(gameData, game.sport, game.league)
    })
    
    const normalizedRecentGames = (recentGames || []).map((game: any) => {
      const homeTeam = game.home_team_data || { 
        name: game.home_team || 'Home Team', 
        logo_url: null, 
        abbreviation: null 
      }
      const awayTeam = game.away_team_data || { 
        name: game.away_team || 'Visiting Team', 
        logo_url: null, 
        abbreviation: null 
      }
      
      const gameData = {
        id: game.id,
        home_team_id: game.home_team_id,
        away_team_id: game.away_team_id,
        game_date: game.game_date,
        season: game.season,
        // // week: game.week // Column does not exist in database, // Not stored in database
        home_score: game.home_score,
        away_score: game.away_score,
        status: game.status,
        venue: game.venue,
        league: game.league,
        sport: game.sport,
        attendance: game.attendance,
        game_type: game.game_type,
        overtime_periods: game.overtime_periods,
        home_team: homeTeam,
        away_team: awayTeam,
        created_at: game.created_at,
        updated_at: game.updated_at
      }
      
      return normalizeGameData(gameData, game.sport, game.league)
    })
    
    const normalizedUpcomingGames = (upcomingGames || []).map((game: any) => {
      const homeTeam = game.home_team_data || { 
        name: game.home_team || 'Home Team', 
        logo_url: null, 
        abbreviation: null 
      }
      const awayTeam = game.away_team_data || { 
        name: game.away_team || 'Visiting Team', 
        logo_url: null, 
        abbreviation: null 
      }
      
      const gameData = {
        id: game.id,
        home_team_id: game.home_team_id,
        away_team_id: game.away_team_id,
        game_date: game.game_date,
        season: game.season,
        // // week: game.week // Column does not exist in database, // Not stored in database
        home_score: game.home_score,
        away_score: game.away_score,
        status: game.status,
        venue: game.venue,
        league: game.league,
        sport: game.sport,
        attendance: game.attendance,
        game_type: game.game_type,
        overtime_periods: game.overtime_periods,
        home_team: homeTeam,
        away_team: awayTeam,
        created_at: game.created_at,
        updated_at: game.updated_at
      }
      
      return normalizeGameData(gameData, game.sport, game.league)
    })

    return {
      success: true,
      live: normalizedLiveGames,
      recent: normalizedRecentGames.slice(0, 10),
      upcoming: normalizedUpcomingGames.slice(0, 10),
      summary: {
        totalLive: normalizedLiveGames.length,
        totalRecent: normalizedRecentGames.length,
        totalUpcoming: normalizedUpcomingGames.length,
        lastUpdated: new Date().toISOString(),
        dataSource: "database"
      },
      sport,
      league
    }

  } catch (error) {
    console.error('Database live data fetch failed:', error)
    return null
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

    // Get all active sports from environment configuration - NO HARDCODED SPORTS
    const supportedSports = (process.env.SUPPORTED_SPORTS || '').split(',').filter(Boolean)
    const activeSports = supportedSports.map(sportName => ({
      name: sportName,
      display_name: process.env[`${sportName.toUpperCase()}_DISPLAY_NAME`] || sportName.charAt(0).toUpperCase() + sportName.slice(1)
    }))

    const sportsToCheck = sport === "all" ? activeSports.map(s => s.name) : [sport]

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
      error: "Failed to fetch live data from APIs",
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
 * Get live data for a specific sport from APIs
 */
async function getLiveDataForSport(sport: string, sportConfig: any, liveGames: any[], recentGames: any[], upcomingGames: any[]) {
  // Implementation for getting live data from APIs for each sport
  // This would call the appropriate API based on sportConfig.data_source
  console.log(`Getting live data for ${sport} from ${sportConfig.data_source}`)
  
  // API calls implemented via service factory pattern
  // For now, this is a placeholder that doesn't populate the arrays
  // The arrays are passed by reference and would be populated by actual API calls
  
  // Suppress unused parameter warnings for placeholder function
  void liveGames
  void recentGames
  void upcomingGames
}