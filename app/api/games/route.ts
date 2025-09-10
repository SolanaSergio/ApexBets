import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { enhancedApiClient } from "@/lib/services/enhanced-api-client"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const useExternalApi = searchParams.get("external") === "true"
    
    if (useExternalApi) {
      // Use direct API calls to avoid circular dependencies
      const sport = searchParams.get("sport") || "basketball"
      const status = searchParams.get("status") as "scheduled" | "live" | "finished" | undefined
      const date = searchParams.get("date") || new Date().toISOString().split('T')[0]
      
      const games: any[] = []
      
      try {
        // Get data from SportsDB (most reliable)
        const { sportsDBClient } = await import("@/lib/sports-apis/sportsdb-client")
        const events = await sportsDBClient.getEventsByDate(date, sport)
        games.push(...events.map((event: any) => ({
          id: event.idEvent,
          home_team_id: 'external_home',
          away_team_id: 'external_away',
          game_date: event.dateEvent + (event.strTime ? 'T' + event.strTime : ''),
          season: '2024-25',
          home_score: event.intHomeScore ? parseInt(event.intHomeScore) : null,
          away_score: event.intAwayScore ? parseInt(event.intAwayScore) : null,
          status: event.strStatus === 'FT' ? 'completed' : event.strStatus === 'LIVE' ? 'in_progress' : 'scheduled',
          venue: event.strVenue,
          home_team: { name: event.strHomeTeam, abbreviation: event.strHomeTeam.substring(0, 3).toUpperCase() },
          away_team: { name: event.strAwayTeam, abbreviation: event.strAwayTeam.substring(0, 3).toUpperCase() }
        })))
      } catch (error) {
        console.error('SportsDB error:', error)
      }
      
      // Add NBA data if basketball
      if (sport === 'basketball') {
        try {
          const { ballDontLieClient } = await import("@/lib/sports-apis/balldontlie-client")
          const nbaGames = await ballDontLieClient.getGames({
            start_date: date,
            end_date: date
          })
          games.push(...nbaGames.data.map((game: any) => ({
            id: game.id.toString(),
            home_team_id: 'nba_home',
            away_team_id: 'nba_away',
            game_date: game.date + (game.time ? 'T' + game.time : ''),
            season: game.season.toString(),
            home_score: game.home_team_score,
            away_score: game.visitor_team_score,
            status: game.status === 'Final' ? 'completed' : game.status === 'In Progress' ? 'in_progress' : 'scheduled',
            venue: undefined,
            home_team: { name: game.home_team.full_name, abbreviation: game.home_team.abbreviation },
            away_team: { name: game.visitor_team.full_name, abbreviation: game.visitor_team.abbreviation }
          })))
        } catch (error) {
          console.error('BALLDONTLIE error:', error)
        }
      }
      
      return NextResponse.json({
        data: games,
        meta: {
          fromCache: false,
          responseTime: 0,
          source: "direct_apis"
        }
      })
    }

    // Fallback to Supabase for stored data
    const supabase = await createClient()
    const dateFrom = searchParams.get("date_from")
    const dateTo = searchParams.get("date_to")
    const status = searchParams.get("status")
    const teamId = searchParams.get("team_id")
    const limit = Number.parseInt(searchParams.get("limit") || "50")

    let query = supabase.from("games").select(`
        *,
        home_team:teams!games_home_team_id_fkey(id, name, abbreviation),
        away_team:teams!games_away_team_id_fkey(id, name, abbreviation)
      `)

    if (dateFrom) {
      query = query.gte("game_date", dateFrom)
    }

    if (dateTo) {
      query = query.lte("game_date", dateTo)
    }

    if (status) {
      query = query.eq("status", status)
    }

    if (teamId) {
      query = query.or(`home_team_id.eq.${teamId},away_team_id.eq.${teamId}`)
    }

    const { data: games, error } = await query.order("game_date", { ascending: false }).limit(limit)

    if (error) {
      console.error("Error fetching games:", error)
      return NextResponse.json({ error: "Failed to fetch games" }, { status: 500 })
    }

    return NextResponse.json({
      data: games,
      meta: {
        fromCache: false,
        responseTime: 0,
        source: "supabase"
      }
    })
  } catch (error) {
    console.error("API Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const gameData = await request.json()

    // Validate required fields
    if (!gameData.homeTeam || !gameData.awayTeam) {
      return NextResponse.json({ error: "Missing required fields: homeTeam, awayTeam" }, { status: 400 })
    }

    // Find team IDs by name
    const { data: homeTeam } = await supabase
      .from("teams")
      .select("id")
      .eq("name", gameData.homeTeam)
      .single()

    const { data: awayTeam } = await supabase
      .from("teams")
      .select("id")
      .eq("name", gameData.awayTeam)
      .single()

    if (!homeTeam || !awayTeam) {
      return NextResponse.json({ error: "Teams not found in database" }, { status: 400 })
    }

    const { data: game, error } = await supabase
      .from("games")
      .insert([{
        home_team_id: homeTeam.id,
        away_team_id: awayTeam.id,
        game_date: gameData.date ? new Date(gameData.date).toISOString() : new Date().toISOString(),
        season: gameData.season || '2024-25',
        status: gameData.status || 'scheduled',
        home_score: gameData.homeScore || null,
        away_score: gameData.awayScore || null,
        venue: gameData.venue || null
      }])
      .select()
      .single()

    if (error) {
      console.error("Error inserting game:", error)
      return NextResponse.json({ error: "Failed to insert game" }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: game })
  } catch (error) {
    console.error("API Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}