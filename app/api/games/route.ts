import { type NextRequest, NextResponse } from "next/server"
import { productionSupabaseClient } from "@/lib/supabase/production-client"
import { apiFallbackStrategy } from "@/lib/services/api-fallback-strategy"
import { structuredLogger } from "@/lib/services/structured-logger"

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

    // Use database service for database reads
    const dateFrom = searchParams.get("date_from")
    const dateTo = searchParams.get("date_to")
    const status = searchParams.get("status") as "scheduled" | "live" | "finished" | "in_progress" | "in progress" | undefined
    const teamId = searchParams.get("team_id")
    const search = searchParams.get("search")
    const sport = searchParams.get("sport")
    const limit = Number.parseInt(searchParams.get("limit") || "50")

    if (!sport) {
      return NextResponse.json({ error: "Sport parameter is required" }, { status: 400 })
    }

    try {
      // Use production Supabase client to get games
      let games = await productionSupabaseClient.getGames(sport, undefined, dateFrom || undefined, status)

      // Apply additional filters
      if (dateTo) {
        games = games.filter((game: any) => new Date(game.game_date) <= new Date(dateTo))
      }

      if (teamId) {
        games = games.filter((game: any) => 
          game.home_team_id === teamId || game.away_team_id === teamId
        )
      }

      if (search) {
        const searchLower = search.toLowerCase()
        games = games.filter((game: any) => 
          game.home_team_name?.toLowerCase().includes(searchLower) ||
          game.away_team_name?.toLowerCase().includes(searchLower) ||
          game.home_team_abbr?.toLowerCase().includes(searchLower) ||
          game.away_team_abbr?.toLowerCase().includes(searchLower)
        )
      }

      // Apply limit
      games = games.slice(0, limit)

      // If requesting live games, filter to only show actually live ones
      if (status === 'live' || status === 'in_progress' || status === 'in progress') {
        const liveGames = filterLiveGamesLocal(
          games.map((game: any) => ({
            id: game.id,
            game_date: game.game_date,
            status: game.status,
            sport: game.sport,
            home_score: game.home_score,
            away_score: game.away_score
          }))
        )
        games = games.filter((game: any) => 
          liveGames.some(liveGame => liveGame.id === game.id)
        )
      }

      return NextResponse.json({
        data: games,
        meta: {
          fromCache: false,
          responseTime: 0,
          source: 'database'
        }
      })
    } catch (error) {
      structuredLogger.error('Failed to fetch games from storage', {
        error: error instanceof Error ? error.message : String(error),
        sport,
        status
      })
      return NextResponse.json({ error: "Failed to fetch games" }, { status: 500 })
    }
  } catch (error) {
    console.error("API Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const gameData = await request.json()

    if (!gameData.homeTeam || !gameData.awayTeam || !gameData.sport) {
      return NextResponse.json({ error: "Missing required fields: homeTeam, awayTeam, sport" }, { status: 400 })
    }

    // Get teams to find IDs
    const teams = await productionSupabaseClient.getTeams(gameData.sport)
    
    const homeTeam = teams.find((t: any) => t.name === gameData.homeTeam)
    const awayTeam = teams.find((t: any) => t.name === gameData.awayTeam)

    if (!homeTeam) {
      return NextResponse.json({ error: "Home team not found in database" }, { status: 400 })
    }

    if (!awayTeam) {
      return NextResponse.json({ error: "Away team not found in database" }, { status: 400 })
    }

    // Create game data for storage
    const game = {
      id: gameData.id || crypto.randomUUID(),
      home_team_id: homeTeam.id,
      away_team_id: awayTeam.id,
      game_date: gameData.date ? new Date(gameData.date).toISOString() : new Date().toISOString(),
      season: gameData.season || '2024-25',
      status: gameData.status || 'scheduled',
      home_score: gameData.homeScore || null,
      away_score: gameData.awayScore || null,
      venue: gameData.venue || null
    }

    // Store via production Supabase client (direct insert)
    const { error } = await productionSupabaseClient.supabase
      .from('games')
      .insert([game])
    
    if (error) {
      throw new Error(`Failed to store game: ${error.message}`)
    }

    return NextResponse.json({ success: true, data: game })
  } catch (error) {
    structuredLogger.error('Failed to create game', {
      error: error instanceof Error ? error.message : String(error)
    })
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
