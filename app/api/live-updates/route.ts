import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { sportsAPI } from "@/lib/api/sports-api"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sport = searchParams.get("sport") || "basketball"
    const league = searchParams.get("league") || "NBA"

    const supabase = await createClient()
    
    if (!supabase) {
      return NextResponse.json({ error: "Database connection failed" }, { status: 500 })
    }
    
    // Get live games from database
    const { data: liveGames, error: liveGamesError } = await supabase
      .from('games')
      .select(`
        *,
        home_team_data:teams!games_home_team_id_fkey(name, logo_url),
        away_team_data:teams!games_away_team_id_fkey(name, logo_url)
      `)
      .eq('sport', sport)
      .eq('status', 'live')
      .order('date', { ascending: true })

    if (liveGamesError) {
      return NextResponse.json({ error: "Failed to fetch live games" }, { status: 500 })
    }

    // Get recent finished games for context
    const { data: recentGames, error: recentGamesError } = await supabase
      .from('games')
      .select(`
        *,
        home_team_data:teams!games_home_team_id_fkey(name, logo_url),
        away_team_data:teams!games_away_team_id_fkey(name, logo_url)
      `)
      .eq('sport', sport)
      .eq('status', 'finished')
      .order('date', { ascending: false })
      .limit(10)

    if (recentGamesError) {
      return NextResponse.json({ error: "Failed to fetch recent games" }, { status: 500 })
    }

    // Get upcoming games
    const { data: upcomingGames, error: upcomingGamesError } = await supabase
      .from('games')
      .select(`
        *,
        home_team_data:teams!games_home_team_id_fkey(name, logo_url),
        away_team_data:teams!games_away_team_id_fkey(name, logo_url)
      `)
      .eq('sport', sport)
      .eq('status', 'scheduled')
      .order('date', { ascending: true })
      .limit(10)

    if (upcomingGamesError) {
      return NextResponse.json({ error: "Failed to fetch upcoming games" }, { status: 500 })
    }

    // Format live games with additional data
    const formattedLiveGames = (liveGames || []).map(game => ({
      id: game.id,
      homeTeam: game.home_team_data?.name || game.home_team,
      awayTeam: game.away_team_data?.name || game.away_team,
      homeScore: game.home_score,
      awayScore: game.away_score,
      status: game.status,
      period: game.period || "1st",
      timeRemaining: game.time_remaining || "12:00",
      date: game.date,
      homeTeamLogo: game.home_team_data?.logo_url,
      awayTeamLogo: game.away_team_data?.logo_url,
      league: game.league,
      venue: game.venue
    }))

    // Format recent games
    const formattedRecentGames = (recentGames || []).map(game => ({
      id: game.id,
      homeTeam: game.home_team_data?.name || game.home_team,
      awayTeam: game.away_team_data?.name || game.away_team,
      homeScore: game.home_score,
      awayScore: game.away_score,
      status: game.status,
      date: game.date,
      homeTeamLogo: game.home_team_data?.logo_url,
      awayTeamLogo: game.away_team_data?.logo_url,
      league: game.league,
      venue: game.venue
    }))

    // Format upcoming games
    const formattedUpcomingGames = (upcomingGames || []).map(game => ({
      id: game.id,
      homeTeam: game.home_team_data?.name || game.home_team,
      awayTeam: game.away_team_data?.name || game.away_team,
      status: game.status,
      date: game.date,
      homeTeamLogo: game.home_team_data?.logo_url,
      awayTeamLogo: game.away_team_data?.logo_url,
      league: game.league,
      venue: game.venue
    }))

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
        lastUpdated: new Date().toISOString()
      },
      sport,
      league
    })

  } catch (error) {
    console.error("Live updates API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}