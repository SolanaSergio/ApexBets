import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { apiFallbackStrategy } from "@/lib/services/api-fallback-strategy"
import { espnClient } from "@/lib/sports-apis/espn-client"
import { ballDontLieClient } from "@/lib/sports-apis/balldontlie-client"
import { sportsDBClient } from "@/lib/sports-apis/sportsdb-client"

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
      const homeTeam = game.home_team_data || { name: game.home_team || 'TBD', logo_url: null, abbreviation: null }
      const awayTeam = game.away_team_data || { name: game.away_team || 'TBD', logo_url: null, abbreviation: null }
      
      return {
        id: game.id,
        homeTeam: homeTeam.name,
        awayTeam: awayTeam.name,
        homeScore: game.home_score,
        awayScore: game.away_score,
        status: game.status,
        period: game.period,
        timeRemaining: game.time_remaining,
        date: game.game_date,
        homeTeamLogo: homeTeam.logo_url,
        awayTeamLogo: awayTeam.logo_url,
        homeTeamAbbr: homeTeam.abbreviation,
        awayTeamAbbr: awayTeam.abbreviation,
        league: game.league,
        venue: game.venue,
        dataSource: 'database'
      }
    })

    // Format recent games with enhanced data
    const formattedRecentGames = (recentGames || []).map(game => {
      const homeTeam = game.home_team_data || { name: game.home_team || 'TBD', logo_url: null, abbreviation: null }
      const awayTeam = game.away_team_data || { name: game.away_team || 'TBD', logo_url: null, abbreviation: null }
      
      return {
        id: game.id,
        homeTeam: homeTeam.name,
        awayTeam: awayTeam.name,
        homeScore: game.home_score,
        awayScore: game.away_score,
        status: game.status,
        date: game.game_date,
        homeTeamLogo: homeTeam.logo_url,
        awayTeamLogo: awayTeam.logo_url,
        homeTeamAbbr: homeTeam.abbreviation,
        awayTeamAbbr: awayTeam.abbreviation,
        league: game.league,
        venue: game.venue,
        dataSource: 'database'
      }
    })

    // Format upcoming games with enhanced data
    const formattedUpcomingGames = (upcomingGames || []).map(game => {
      const homeTeam = game.home_team_data || { name: game.home_team || 'TBD', logo_url: null, abbreviation: null }
      const awayTeam = game.away_team_data || { name: game.away_team || 'TBD', logo_url: null, abbreviation: null }
      
      return {
        id: game.id,
        homeTeam: homeTeam.name,
        awayTeam: awayTeam.name,
        status: game.status,
        date: game.game_date,
        homeTeamLogo: homeTeam.logo_url,
        awayTeamLogo: awayTeam.logo_url,
        homeTeamAbbr: homeTeam.abbreviation,
        awayTeamAbbr: awayTeam.abbreviation,
        league: game.league,
        venue: game.venue,
        dataSource: 'database'
      }
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
              league: "NBA",
              venue: game.competitions[0]?.venue?.fullName,
              homeTeamLogo: game.competitions[0]?.competitors.find(c => c.homeAway === 'home')?.team?.logo,
              awayTeamLogo: game.competitions[0]?.competitors.find(c => c.homeAway === 'away')?.team?.logo,
              dataSource: "ESPN"
            }

            // Only add to appropriate arrays based on ACTUAL status and scores
            if (formattedGame.status === 'live' && game.status.type.state === 'in' && 
               (formattedGame.homeScore > 0 || formattedGame.awayScore > 0)) {
              liveGames.push(formattedGame)
            } else if (formattedGame.status === 'finished' && game.status.type.completed) {
              recentGames.push(formattedGame)
            } else if (formattedGame.status === 'scheduled' && !game.status.type.completed && game.status.type.state !== 'in') {
              upcomingGames.push(formattedGame)
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
            const formattedGame = {
              id: game.id.toString(),
              homeTeam: game.home_team.full_name,
              awayTeam: game.visitor_team.full_name,
              homeScore: game.home_team_score,
              awayScore: game.visitor_team_score,
              status: game.status === 'Final' ? 'finished' : 
                     game.status.includes('Q') && (game.home_team_score > 0 || game.visitor_team_score > 0) ? 'live' : 'scheduled',
              period: game.period ? `${game.period}Q` : null,
              timeRemaining: game.time || null,
              date: game.date,
              league: "NBA",
              venue: null,
              dataSource: "BallDontLie"
            }

            // Only add truly live games (with actual scores)
            if (formattedGame.status === 'live' && (formattedGame.homeScore > 0 || formattedGame.awayScore > 0)) {
              liveGames.push(formattedGame)
            } else if (formattedGame.status === 'finished') {
              recentGames.push(formattedGame)
            } else {
              upcomingGames.push(formattedGame)
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
          const formattedGame = {
            id: event.idEvent,
            homeTeam: event.strHomeTeam,
            awayTeam: event.strAwayTeam,
            homeScore: event.intHomeScore ? parseInt(event.intHomeScore) : null,
            awayScore: event.intAwayScore ? parseInt(event.intAwayScore) : null,
            status: event.strStatus?.toLowerCase().includes('live') ? 'live' : 
                   event.strStatus?.toLowerCase().includes('finished') ? 'finished' : 'scheduled',
            period: null,
            timeRemaining: event.strTime,
            date: event.dateEvent,
            league: event.strLeague,
            venue: event.strVenue,
            dataSource: "TheSportsDB"
          }

          if (formattedGame.status === 'live') {
            liveGames.push(formattedGame)
          } else if (formattedGame.status === 'finished') {
            recentGames.push(formattedGame)
          } else {
            upcomingGames.push(formattedGame)
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