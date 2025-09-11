import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
// import { enhancedApiClient } from "@/lib/services/enhanced-api-client" // Module not available

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const useExternalApi = searchParams.get("external") === "true"
    
    if (useExternalApi) {
      // Use direct API calls to avoid circular dependencies
      const sport = searchParams.get("sport")
      
      if (!sport) {
        return NextResponse.json({ error: "Sport parameter is required" }, { status: 400 })
      }
      const status = searchParams.get("status") as "scheduled" | "live" | "finished" | undefined
      const date = searchParams.get("date") || new Date().toISOString().split('T')[0]
      
      const games: any[] = []
      
      try {
        // Use the unified API client for all sports
        const { cachedUnifiedApiClient } = await import("@/lib/services/api/cached-unified-api-client")
        
        // Get games for the specified sport and date
        const sportGames = await cachedUnifiedApiClient.getGames(sport as any, { 
          date: date,
          limit: 50
        })
        
        games.push(...sportGames.map((game: any) => ({
          id: game.id?.toString() || game.gameId?.toString() || Math.random().toString(),
          home_team_id: game.home_team_id || 'external_home',
          away_team_id: game.away_team_id || 'external_away',
          game_date: game.game_date || game.date || game.startTime || new Date().toISOString(),
          season: game.season || '2024-25',
          home_score: game.home_score || game.homeTeamScore || null,
          away_score: game.away_score || game.awayTeamScore || null,
          status: game.status || 'scheduled',
          venue: game.venue || game.location || null,
          home_team: { 
            name: game.home_team?.name || game.homeTeam?.name || 'Home Team', 
            abbreviation: game.home_team?.abbreviation || game.homeTeam?.abbreviation || 'HT' 
          },
          away_team: { 
            name: game.away_team?.name || game.awayTeam?.name || 'Away Team', 
            abbreviation: game.away_team?.abbreviation || game.awayTeam?.abbreviation || 'AT' 
          }
        })))
      } catch (error) {
        console.error('Unified API error:', error)
        // Fall through to database fallback
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
    const search = searchParams.get("search")
    const limit = Number.parseInt(searchParams.get("limit") || "50")

    if (!supabase) {
      return NextResponse.json({ error: "Supabase client initialization failed" }, { status: 500 })
    }
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

    // Filter by search term if provided
    let filteredGames = games || []
    if (search) {
      const searchLower = search.toLowerCase()
      filteredGames = filteredGames.filter(game => 
        game.home_team?.name?.toLowerCase().includes(searchLower) ||
        game.away_team?.name?.toLowerCase().includes(searchLower) ||
        game.home_team?.abbreviation?.toLowerCase().includes(searchLower) ||
        game.away_team?.abbreviation?.toLowerCase().includes(searchLower)
      )
    }

    if (error) {
      console.error("Error fetching games:", error)
      return NextResponse.json({ error: "Failed to fetch games" }, { status: 500 })
    }

    return NextResponse.json({
      data: filteredGames,
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
    if (!supabase) {
      return NextResponse.json({ error: "Supabase client initialization failed" }, { status: 500 })
    }
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

    if (!homeTeam) {
      return NextResponse.json({ error: "Home team not found in database" }, { status: 400 })
    }

    const { data: awayTeam } = await supabase
      .from("teams")
      .select("id")
      .eq("name", gameData.awayTeam)
      .single()

    if (!awayTeam) {
      return NextResponse.json({ error: "Away team not found in database" }, { status: 400 })
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
