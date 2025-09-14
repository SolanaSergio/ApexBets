import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { dataValidationService } from "@/lib/services/data-validation-service"
import { normalizeGameData, normalizeTeamData } from "@/lib/utils/data-utils"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const useRealData = searchParams.get("real") === "true"
    // const includeInactive = searchParams.get("include_inactive") === "true"

    const supabase = await createClient()
    
    if (!supabase) {
      return NextResponse.json({ 
        success: false,
        error: "Database connection failed",
        sports: {},
        summary: {
          totalSports: 0,
          totalLiveGames: 0,
          lastUpdated: new Date().toISOString()
        }
      }, { status: 500 })
    }

    // Get all active sports from database
    const { data: activeSports, error: sportsError } = await supabase
      .from('sports')
      .select('name, display_name, icon, color, is_active, update_frequency')
      .eq('is_active', true)
      .order('name')

    if (sportsError) {
      console.error('Error fetching sports:', sportsError)
      return NextResponse.json({ 
        success: false,
        error: "Failed to fetch sports data",
        sports: {},
        summary: {
          totalSports: 0,
          totalLiveGames: 0,
          lastUpdated: new Date().toISOString()
        }
      }, { status: 500 })
    }

    if (!activeSports || activeSports.length === 0) {
      return NextResponse.json({
        success: true,
        sports: {},
        summary: {
          totalSports: 0,
          totalLiveGames: 0,
          lastUpdated: new Date().toISOString()
        }
      })
    }

    const sportsData: Record<string, any> = {}
    let totalLiveGames = 0

    // Process each sport dynamically
    for (const sport of activeSports) {
      try {
        const sportData = await getSportLiveData(supabase, sport.name, useRealData)
        sportsData[sport.name] = {
          ...sportData,
          sportInfo: {
            name: sport.name,
            displayName: sport.display_name,
            icon: sport.icon,
            color: sport.color,
            updateFrequency: sport.update_frequency
          }
        }
        totalLiveGames += sportData.live.length
      } catch (error) {
        console.error(`Error processing ${sport.name}:`, error)
        sportsData[sport.name] = {
          live: [],
          recent: [],
          upcoming: [],
          error: error instanceof Error ? error.message : String(error),
          sportInfo: {
            name: sport.name,
            displayName: sport.display_name,
            icon: sport.icon,
            color: sport.color,
            updateFrequency: sport.update_frequency
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      sports: sportsData,
      summary: {
        totalSports: activeSports.length,
        totalLiveGames,
        lastUpdated: new Date().toISOString(),
        dataSource: useRealData ? "live_apis" : "database"
      }
    })

  } catch (error) {
    console.error("All sports live updates API error:", error)
    return NextResponse.json({ 
      success: false,
      error: "Internal server error",
      sports: {},
      summary: {
        totalSports: 0,
        totalLiveGames: 0,
        lastUpdated: new Date().toISOString()
      }
    }, { status: 500 })
  }
}

/**
 * Get live data for a specific sport
 */
async function getSportLiveData(supabase: any, sport: string, _useRealData: boolean) {
  // Get live games from database
  const { data: liveGames, error: liveGamesError } = await supabase
    .from('games')
    .select(`
      *,
      home_team_data:teams!games_home_team_id_fkey(name, logo_url, abbreviation),
      away_team_data:teams!games_away_team_id_fkey(name, logo_url, abbreviation)
    `)
    .eq('sport', sport)
    .in('status', ['live', 'in_progress', 'in progress'])
    .order('game_date', { ascending: true })

  if (liveGamesError) {
    throw new Error(`Failed to fetch live games for ${sport}: ${liveGamesError.message}`)
  }

  // Get recent games (last 24 hours)
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const { data: recentGames } = await supabase
    .from('games')
    .select(`
      *,
      home_team_data:teams!games_home_team_id_fkey(name, logo_url, abbreviation),
      away_team_data:teams!games_away_team_id_fkey(name, logo_url, abbreviation)
    `)
    .eq('sport', sport)
    .in('status', ['finished', 'completed', 'final'])
    .gte('game_date', oneDayAgo)
    .order('game_date', { ascending: false })
    .limit(5)

  // Get upcoming games (next 7 days)
  const now = new Date().toISOString()
  const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
  const { data: upcomingGames } = await supabase
    .from('games')
    .select(`
      *,
      home_team_data:teams!games_home_team_id_fkey(name, logo_url, abbreviation),
      away_team_data:teams!games_away_team_id_fkey(name, logo_url, abbreviation)
    `)
    .eq('sport', sport)
    .in('status', ['scheduled', 'not_started', 'upcoming'])
    .gte('game_date', now)
    .lte('game_date', nextWeek)
    .order('game_date', { ascending: true })
    .limit(5)

  // Normalize and validate data
  const normalizedLiveGames = normalizeGames(liveGames || [], sport)
  const normalizedRecentGames = normalizeGames(recentGames || [], sport)
  const normalizedUpcomingGames = normalizeGames(upcomingGames || [], sport)

  // Validate live games
  const validatedLiveGames = dataValidationService.validateLiveGames(normalizedLiveGames)

  return {
    live: validatedLiveGames,
    recent: normalizedRecentGames,
    upcoming: normalizedUpcomingGames,
    summary: {
      totalLive: validatedLiveGames.length,
      totalRecent: normalizedRecentGames.length,
      totalUpcoming: normalizedUpcomingGames.length,
      lastUpdated: new Date().toISOString()
    }
  }
}

/**
 * Normalize games data for a specific sport
 */
function normalizeGames(games: any[], sport: string): any[] {
  return games.map(game => {
    const homeTeam = game.home_team_data || { 
      name: game.home_team || 'Home Team', 
      logo_url: null, 
      abbreviation: null 
    }
    const awayTeam = game.away_team_data || { 
      name: game.away_team || 'Away Team', 
      logo_url: null, 
      abbreviation: null 
    }
    
    // Normalize team data with sport context
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
    
    // Normalize and return the game data with sport-specific normalization
    return normalizeGameData(gameData, sport, game.league)
  })
}
