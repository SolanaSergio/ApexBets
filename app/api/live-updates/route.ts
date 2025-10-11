import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { normalizeGameData } from '@/lib/utils/data-utils'
import { databaseOptimizer } from '@/lib/database/optimize-queries'
import { databaseCacheService } from '@/lib/services/database-cache-service'

// Explicitly set runtime to suppress warnings
export const runtime = 'nodejs'

const CACHE_TTL = 30 // 30 seconds cache

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sport = searchParams.get('sport') || 'all'
    const league = searchParams.get('league') || 'all'

    const cacheKey = `live-updates-${sport}-${league}`
    const cached = await databaseCacheService.get(cacheKey)
    if (cached) {
      return NextResponse.json(cached)
    }

    // ARCHITECTURE PATTERN: Database-First Approach
    // Only fetch from database - external APIs should only be called by background services
    const databaseResult = await getLiveDataFromDatabase(sport, league)

    // Always return database data, even if empty
    console.log(`Returning database data for ${sport}`)
    await databaseCacheService.set(cacheKey, databaseResult, CACHE_TTL)
    return NextResponse.json(databaseResult)
  } catch (error) {
    console.error('Live updates API error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        live: [],
        recent: [],
        upcoming: [],
        summary: {
          totalLive: 0,
          totalRecent: 0,
          totalUpcoming: 0,
          lastUpdated: new Date().toISOString(),
          dataSource: 'error',
        },
      },
      { status: 500 }
    )
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
      throw new Error('Failed to create Supabase client')
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
        abbreviation: null,
      }
      const awayTeam = game.away_team_data || {
        name: game.away_team || 'Visiting Team',
        logo_url: null,
        abbreviation: null,
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
        league_id: game.league_name_id,
        sport: game.sport,
        attendance: game.attendance,
        game_type: game.game_type,
        overtime_periods: game.overtime_periods,
        home_team: homeTeam,
        away_team: awayTeam,
        created_at: game.created_at,
        updated_at: game.updated_at,
      }

      return normalizeGameData(gameData, game.sport, game.league_name)
    })

    const normalizedRecentGames = (recentGames || []).map((game: any) => {
      const homeTeam = game.home_team_data || {
        name: game.home_team || 'Home Team',
        logo_url: null,
        abbreviation: null,
      }
      const awayTeam = game.away_team_data || {
        name: game.away_team || 'Visiting Team',
        logo_url: null,
        abbreviation: null,
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
        league_id: game.league_name_id,
        sport: game.sport,
        attendance: game.attendance,
        game_type: game.game_type,
        overtime_periods: game.overtime_periods,
        home_team: homeTeam,
        away_team: awayTeam,
        created_at: game.created_at,
        updated_at: game.updated_at,
      }

      return normalizeGameData(gameData, game.sport, game.league_name)
    })

    const normalizedUpcomingGames = (upcomingGames || []).map((game: any) => {
      const homeTeam = game.home_team_data || {
        name: game.home_team || 'Home Team',
        logo_url: null,
        abbreviation: null,
      }
      const awayTeam = game.away_team_data || {
        name: game.away_team || 'Visiting Team',
        logo_url: null,
        abbreviation: null,
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
        league_id: game.league_name_id,
        sport: game.sport,
        attendance: game.attendance,
        game_type: game.game_type,
        overtime_periods: game.overtime_periods,
        home_team: homeTeam,
        away_team: awayTeam,
        created_at: game.created_at,
        updated_at: game.updated_at,
      }

      return normalizeGameData(gameData, game.sport, game.league_name)
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
        dataSource: 'database',
      },
      sport,
      league,
    }
  } catch (error) {
    console.error('Database live data fetch failed:', error)
    return {
      success: false,
      live: [],
      recent: [],
      upcoming: [],
      summary: {
        totalLive: 0,
        totalRecent: 0,
        totalUpcoming: 0,
        lastUpdated: new Date().toISOString(),
        dataSource: 'error',
      },
      sport,
      league,
    }
  }
}
