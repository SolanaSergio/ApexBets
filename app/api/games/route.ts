import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { apiFallbackStrategy } from "@/lib/services/api-fallback-strategy"

// Local helper to validate live games dynamically without hardcodes
function filterLiveGamesLocal(games: Array<{ id: string; game_date?: string; status?: string; sport?: string; home_score?: number | null; away_score?: number | null }>): Array<{ id: string }> {
  return games
    .filter(g => {
      const status = (g.status || '').toLowerCase()
      return status.includes('live') || status.includes('in_progress') || status.includes('in progress')
    })
    .map(g => ({ id: g.id }))
}
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const externalAllowed = process.env.ALLOW_EXTERNAL_FETCH === 'true'
    const useExternalApi = externalAllowed && searchParams.get("external") === "true"
    
    if (useExternalApi) {
      // Use API fallback strategy for real-time data
      const sport = searchParams.get("sport")
      
      if (!sport) {
        return NextResponse.json({ error: "Sport parameter is required" }, { status: 400 })
      }
      
      const status = searchParams.get("status") as "scheduled" | "live" | "finished" | "in_progress" | "in progress" | undefined
      const date = searchParams.get("date") || new Date().toISOString().split('T')[0]
      
      try {
        // Use the API fallback strategy to get games
        const fallbackResult = await apiFallbackStrategy.executeWithFallback({
          sport,
          dataType: 'games',
          params: { date, status },
          priority: 'medium'
        })
        
        if (fallbackResult.success && fallbackResult.data) {
          // Normalize the data to our expected format - use real team data
          const { normalizeGameData, deduplicateGames } = await import("@/lib/utils/data-utils")
          const normalizedGames = Array.isArray(fallbackResult.data)
            ? fallbackResult.data
                .filter((g: any) => g)
                .map((g: any) => normalizeGameData(g, sport as string))
            : []
          
          // Filter out null games (games with missing team names) and remove duplicates
          const validGames = normalizedGames.filter((game: any) => game && game.home_team && game.away_team)
          const deduplicatedGames = deduplicateGames(validGames)
          
          // If requesting live games, filter to only show actually live ones
          let finalGames = deduplicatedGames
          if (status === 'live' || status === 'in_progress' || status === 'in progress') {
            const liveGames = filterLiveGamesLocal(
              deduplicatedGames.map(game => ({
                id: game.id,
                game_date: game.game_date,
                status: game.status,
                sport: sport,
                home_score: game.home_score,
                away_score: game.away_score
              }))
            )
            finalGames = deduplicatedGames.filter(game => 
              liveGames.some(liveGame => liveGame.id === game.id)
            )
          }
          
          // If we have no valid games from external API, log this for debugging
          if (finalGames.length === 0) {
            console.warn(`No valid games found from external API for sport: ${sport}. All games had missing team names or were filtered out.`)
          }
          
          return NextResponse.json({
            data: finalGames,
            meta: {
              fromCache: fallbackResult.cached,
              responseTime: fallbackResult.responseTime,
              source: `api_fallback_${fallbackResult.provider}`,
              fallbacksUsed: fallbackResult.fallbacksUsed,
              originalCount: normalizedGames.length,
              deduplicatedCount: deduplicatedGames.length,
              liveFilteredCount: finalGames.length
            }
          })
        } else {
          console.warn('API fallback failed:', fallbackResult.error)
          return NextResponse.json({
            data: [],
            meta: {
              fromCache: false,
              responseTime: fallbackResult.responseTime,
              source: "api_fallback_failed",
              error: fallbackResult.error
            }
          })
        }
      } catch (error) {
        console.error('External API error:', error)
        return NextResponse.json({
          data: [],
          meta: {
            fromCache: false,
            responseTime: 0,
            source: "external_api_error",
            error: error instanceof Error ? error.message : 'Unknown error'
          }
        })
      }
    }

    // Fallback to Supabase for stored data
    const supabase = await createClient()
    const dateFrom = searchParams.get("date_from")
    const dateTo = searchParams.get("date_to")
    const status = searchParams.get("status") as "scheduled" | "live" | "finished" | "in_progress" | "in progress" | undefined
    const teamId = searchParams.get("team_id")
    const search = searchParams.get("search")
    const sport = searchParams.get("sport")
    const limit = Number.parseInt(searchParams.get("limit") || "50")

    if (!supabase) {
      return NextResponse.json({ error: "Supabase client initialization failed" }, { status: 500 })
    }
    let query = supabase.from("games").select(`
        *,
        home_team:teams!games_home_team_id_fkey(id, name, abbreviation, logo_url),
        away_team:teams!games_away_team_id_fkey(id, name, abbreviation, logo_url)
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

    if (sport) {
      query = query.eq("sport", sport)
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

    // If requesting live games, filter to only show actually live ones
    if (status === 'live' || status === 'in_progress' || status === 'in progress') {
      const liveGames = filterLiveGamesLocal(
        filteredGames.map(game => ({
          id: game.id,
          game_date: game.game_date,
          status: game.status,
          sport: game.sport,
          home_score: game.home_score,
          away_score: game.away_score
        }))
      )
      filteredGames = filteredGames.filter(game => 
        liveGames.some(liveGame => liveGame.id === game.id)
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
