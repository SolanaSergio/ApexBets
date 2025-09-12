import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { cacheManager } from "@/lib/cache"
import { SportConfigManager } from "@/lib/services/core/sport-config"

async function getDefaultLeagueFromDatabase(sport: string): Promise<string> {
  try {
    const config = await SportConfigManager.getSportConfigAsync(sport)
    return config?.defaultLeague || 'Unknown League'
  } catch (error) {
    console.error('Error getting default league for sport:', sport, error)
    return 'Unknown League'
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sport = searchParams.get("sport")
    
    if (!sport) {
      return NextResponse.json({
        success: false,
        error: "Sport parameter is required"
      }, { status: 400 })
    }
    const finalSport = sport
    const status = searchParams.get("status") || "live"
    
    // Get league from database or use provided league
    const league = searchParams.get("league") || await getDefaultLeagueFromDatabase(finalSport)

    // Generate cache key
    const cacheKey = `live_scores:${finalSport}:${league}:${status}`
    
    // Check cache first
    const cached = cacheManager.get(cacheKey)
    if (cached) {
      return NextResponse.json(cached)
    }

    const supabase = await createClient()
    
    // Get live games based on status
    if (!supabase) {
      return NextResponse.json({ error: "Supabase client initialization failed" }, { status: 500 })
    }
    let query = supabase
      .from('games')
      .select(`
        *,
        home_team_data:teams!games_home_team_id_fkey(name, logo_url, city),
        away_team_data:teams!games_away_team_id_fkey(name, logo_url, city)
      `)
      .eq('sport', finalSport)

    // Apply status filter
    if (status === 'live') {
      query = query.eq('status', 'live')
    } else if (status === 'finished') {
      query = query.eq('status', 'finished')
    } else if (status === 'scheduled') {
      query = query.eq('status', 'scheduled')
    } else if (status === 'all') {
      // No status filter
    } else {
      query = query.in('status', ['live', 'finished', 'scheduled'])
    }

    const { data: games, error: gamesError } = await query
      .order('game_date', { ascending: status === 'scheduled' })

    if (gamesError) {
      return NextResponse.json({ error: "Failed to fetch games" }, { status: 500 })
    }

    // Format games with additional data
    const formattedGames = (games || []).map(game => {
      const homeTeam = game.home_team_data || { name: game.home_team, logo_url: null, city: null }
      const awayTeam = game.away_team_data || { name: game.away_team, logo_url: null, city: null }

      return {
        id: game.id,
        homeTeam: {
          name: homeTeam.name,
          city: homeTeam.city,
          logo: homeTeam.logo_url,
          score: game.home_score,
          id: game.home_team_id
        },
        awayTeam: {
          name: awayTeam.name,
          city: awayTeam.city,
          logo: awayTeam.logo_url,
          score: game.away_score,
          id: game.away_team_id
        },
        status: game.status,
        period: game.period,
        timeRemaining: game.time_remaining,
        date: game.game_date,
        league: game.league,
        venue: game.venue,
        attendance: game.attendance,
        weather: game.weather
      }
    })

    // Get live odds for live games
    const liveGameIds = formattedGames
      .filter(game => game.status === 'live')
      .map(game => game.id)

    let liveOdds = []
    if (liveGameIds.length > 0) {
      const { data: odds, error: oddsError } = await supabase
        .from('odds')
        .select('*')
        .in('game_id', liveGameIds)
        .eq('sport', finalSport)

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
        bookmaker: odd.bookmaker || "Unknown",
        updatedAt: odd.updated_at
      })
      return acc
    }, {} as Record<string, any[]>)

    // Add odds to live games
    const gamesWithOdds = formattedGames.map(game => ({
      ...game,
      odds: oddsByGame[game.id] || []
    }))

    // Calculate summary statistics
    const liveCount = gamesWithOdds.filter(g => g.status === 'live').length
    const finishedCount = gamesWithOdds.filter(g => g.status === 'finished').length
    const scheduledCount = gamesWithOdds.filter(g => g.status === 'scheduled').length

    // Get top performers for finished games
    const finishedGames = gamesWithOdds.filter(g => g.status === 'finished')
    const topPerformers = finishedGames
      .map(game => ({
        game: `${game.awayTeam.name} @ ${game.homeTeam.name}`,
        winner: game.homeTeam.score > game.awayTeam.score ? game.homeTeam.name : game.awayTeam.name,
        score: `${game.awayTeam.score}-${game.homeTeam.score}`,
        margin: Math.abs(game.homeTeam.score - game.awayTeam.score),
        date: game.date
      }))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5)

    const response = {
      games: gamesWithOdds,
      summary: {
        total: gamesWithOdds.length,
        live: liveCount,
        finished: finishedCount,
        scheduled: scheduledCount,
        lastUpdated: new Date().toISOString()
      },
      topPerformers,
      filters: {
        sport: finalSport,
        league,
        status
      }
    }

    // Cache the response for 2 minutes (live data changes frequently)
    const cacheTtl = status === 'live' ? 120000 : 300000 // 2 min for live, 5 min for others
    cacheManager.set(cacheKey, response, cacheTtl)

    return NextResponse.json(response)

  } catch (error) {
    console.error("Live scores API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
