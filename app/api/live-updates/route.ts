import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { espnClient } from "@/lib/sports-apis/espn-client"
import { ballDontLieClient } from "@/lib/sports-apis/balldontlie-client"
import { sportsDBClient } from "@/lib/sports-apis/sportsdb-client"
import { normalizeGameData, normalizeTeamData } from "@/lib/utils/data-utils"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sport = searchParams.get("sport") || "basketball"
    const league = searchParams.get("league") || "NBA"
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
    const { data: liveGames, error: liveGamesError } = await supabase
      .from('games')
      .select(`
        *,
        home_team_data:teams!games_home_team_id_fkey(name, logo_url, abbreviation),
        away_team_data:teams!games_away_team_id_fkey(name, logo_url, abbreviation)
      `)
      .eq('sport', sport)
      .in('status', ['live', 'in_progress', 'in progress'])
      .not('home_score', 'is', null)
      .not('away_score', 'is', null)
      .or('home_score.gt.0,away_score.gt.0') // At least one team must have scored
      .order('game_date', { ascending: true })

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
    const { data: recentGames, error: recentGamesError } = await supabase
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
      .limit(10)

    if (recentGamesError) {
      console.error('Recent games error:', recentGamesError)
      // Continue with empty recent games rather than failing completely
    }

    // Get upcoming games (next 7 days)
    const now = new Date().toISOString()
    const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    const { data: upcomingGames, error: upcomingGamesError } = await supabase
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
      .limit(10)

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
    const liveGames: any[] = []
    const recentGames: any[] = []
    const upcomingGames: any[] = []

    // Try to get live data from multiple sources
    if (sport === "basketball") {
      try {
        // Try ESPN first for NBA
        const espnGames = await espnClient.getNBAScoreboard()
        if (espnGames && espnGames.length > 0) {
          espnGames.forEach(game => {
            const homeTeamData = game.competitions[0]?.competitors.find(c => c.homeAway === 'home')?.team || {}
            const awayTeamData = game.competitions[0]?.competitors.find(c => c.homeAway === 'away')?.team || {}
            
            const homeTeam = {
              name: (homeTeamData as any).displayName || 'Home Team',
              logo_url: (homeTeamData as any).logo,
              abbreviation: (homeTeamData as any).abbreviation
            }
            
            const awayTeam = {
              name: (awayTeamData as any).displayName || 'Away Team',
              logo_url: (awayTeamData as any).logo,
              abbreviation: (awayTeamData as any).abbreviation
            }
            
            const formattedGame = {
              id: game.id,
              home_team_id: `espn_home_${game.id}`,
              away_team_id: `espn_away_${game.id}`,
              game_date: game.date,
              season: new Date().getFullYear().toString(),
              home_score: parseInt(game.competitions[0]?.competitors.find(c => c.homeAway === 'home')?.score || '0'),
              away_score: parseInt(game.competitions[0]?.competitors.find(c => c.homeAway === 'away')?.score || '0'),
              status: game.status.type.state === 'in' ? 'live' : 
                     game.status.type.completed ? 'finished' : 'scheduled',
              period: game.status.period ? `${game.status.period}Q` : null,
              time_remaining: game.status.displayClock || null,
              league: "NBA",
              venue: game.competitions[0]?.venue?.fullName,
              sport: "basketball",
              home_team: homeTeam,
              away_team: awayTeam
            }

            // Normalize the game data
            const normalizedGame = normalizeGameData(formattedGame, "basketball", "NBA")

            // Only add to appropriate arrays based on ACTUAL status and scores
            if (normalizedGame.status === 'live' && game.status.type.state === 'in' && 
               (normalizedGame.home_score > 0 || normalizedGame.away_score > 0)) {
              liveGames.push(normalizedGame)
            } else if (normalizedGame.status === 'finished' && game.status.type.completed) {
              recentGames.push(normalizedGame)
            } else if (normalizedGame.status === 'scheduled' && !game.status.type.completed && game.status.type.state !== 'in') {
              upcomingGames.push(normalizedGame)
            }
          })
        }
      } catch (error) {
        console.warn('ESPN NBA data fetch failed:', error)
      }

      // Try Ball Don't Lie as fallback for NBA
      if (liveGames.length === 0 && ballDontLieClient.isConfigured()) {
        try {
          const todaysGames = await ballDontLieClient.getTodaysGames()
          todaysGames.forEach(game => {
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
            
            const formattedGame = {
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
              league: "NBA",
              sport: "basketball",
              home_team: homeTeam,
              away_team: awayTeam
            }

            // Normalize the game data
            const normalizedGame = normalizeGameData(formattedGame, "basketball", "NBA")

            // Only add truly live games (with actual scores)
            if (normalizedGame.status === 'live' && (normalizedGame.home_score > 0 || normalizedGame.away_score > 0)) {
              liveGames.push(normalizedGame)
            } else if (normalizedGame.status === 'finished') {
              recentGames.push(normalizedGame)
            } else {
              upcomingGames.push(normalizedGame)
            }
          })
        } catch (error) {
          console.warn('Ball Don\'t Lie data fetch failed:', error)
        }
      }
    }

    // Try other sports with ESPN
    if (sport === "football" && league === "NFL") {
      try {
        const espnGames = await espnClient.getNFLScoreboard()
        if (espnGames && espnGames.length > 0) {
          espnGames.forEach(game => {
            const formattedGame = {
              id: game.id,
              homeTeam: game.competitions[0]?.competitors.find(c => c.homeAway === 'home')?.team?.displayName || 'TBD',
              awayTeam: game.competitions[0]?.competitors.find(c => c.homeAway === 'away')?.team?.displayName || 'TBD',
              homeScore: parseInt(game.competitions[0]?.competitors.find(c => c.homeAway === 'home')?.score || '0'),
              awayScore: parseInt(game.competitions[0]?.competitors.find(c => c.homeAway === 'away')?.score || '0'),
              status: game.status.type.state === 'in' ? 'live' : 
                     game.status.type.completed ? 'finished' : 'scheduled',
              period: game.status.period ? `${game.status.period}Q` : null,
              timeRemaining: game.status.displayClock || null,
              date: game.date,
              league: "NFL",
              venue: game.competitions[0]?.venue?.fullName,
              dataSource: "ESPN"
            }

            if (formattedGame.status === 'live') {
              liveGames.push(formattedGame)
            } else if (formattedGame.status === 'finished') {
              recentGames.push(formattedGame)
            } else {
              upcomingGames.push(formattedGame)
            }
          })
        }
      } catch (error) {
        console.warn('ESPN NFL data fetch failed:', error)
      }
    }

    // Try TheSportsDB as universal fallback
    if (liveGames.length === 0 && recentGames.length === 0) {
      try {
        const today = new Date().toISOString().split('T')[0]
        const events = await sportsDBClient.getEventsByDate(today, sport)
        
        events.forEach(event => {
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
          
          const formattedGame = {
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

          // Normalize the game data
          const normalizedGame = normalizeGameData(formattedGame, sport, event.strLeague)

          if (normalizedGame.status === 'live') {
            liveGames.push(normalizedGame)
          } else if (normalizedGame.status === 'finished') {
            recentGames.push(normalizedGame)
          } else {
            upcomingGames.push(normalizedGame)
          }
        })
      } catch (error) {
        console.warn('TheSportsDB data fetch failed:', error)
      }
    }

    return NextResponse.json({
      live: liveGames,
      recent: recentGames.slice(0, 10),
      upcoming: upcomingGames.slice(0, 10),
      summary: {
        totalLive: liveGames.length,
        totalRecent: recentGames.length,
        totalUpcoming: upcomingGames.length,
        lastUpdated: new Date().toISOString(),
        dataSource: "live_apis"
      },
      sport,
      league
    })
  } catch (error) {
    console.error('Live API data fetch failed:', error)
    return NextResponse.json({
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