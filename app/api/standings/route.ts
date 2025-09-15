import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// Enhanced multi-layer cache for standings
const standingsCache = new Map<string, { data: any, timestamp: number }>()
const CACHE_TTL = 10 * 60 * 1000 // 10 minutes (increased for better API conservation)
const MAX_CACHE_ENTRIES = 100 // Prevent memory bloat

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    const sport = searchParams.get("sport")
    const league = searchParams.get("league")
    const season = searchParams.get("season") || "2024-25"
    const limit = Number.parseInt(searchParams.get("limit") || "50")

    // Create cache key
    const cacheKey = `${sport}-${league}-${season}-${limit}`

    // Check cache first
    const cached = standingsCache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return NextResponse.json({
        ...cached.data,
        meta: {
          ...cached.data.meta,
          fromCache: true,
          cacheAge: Date.now() - cached.timestamp
        }
      })
    }

    const supabase = await createClient()
    if (!supabase) {
      return NextResponse.json({ error: "Supabase client initialization failed" }, { status: 500 })
    }

    // Get teams with their game statistics
    let query = supabase
      .from("teams")
      .select(`
        *,
        home_games:games!games_home_team_id_fkey(
          id,
          home_score,
          away_score,
          status,
          game_date
        ),
        away_games:games!games_away_team_id_fkey(
          id,
          home_score,
          away_score,
          status,
          game_date
        )
      `)

    if (sport) {
      query = query.eq("sport", sport)
    }

    if (league) {
      query = query.eq("league", league)
    }

    const { data: teams, error } = await query.limit(limit)

    if (error) {
      console.error("Error fetching standings:", error)
      return NextResponse.json({ error: "Failed to fetch standings" }, { status: 500 })
    }

    // Calculate standings for each team
    const standings = teams?.map(team => {
      const allGames = [
        ...(team.home_games || []).map((game: any) => ({
          ...game,
          isHome: true,
          teamScore: game.home_score,
          opponentScore: game.away_score
        })),
        ...(team.away_games || []).map((game: any) => ({
          ...game,
          isHome: false,
          teamScore: game.away_score,
          opponentScore: game.home_score
        }))
      ].filter(game => game.status === 'completed' && game.teamScore !== null && game.opponentScore !== null)

      const wins = allGames.filter(game => game.teamScore > game.opponentScore).length
      const losses = allGames.filter(game => game.teamScore < game.opponentScore).length
      const ties = allGames.filter(game => game.teamScore === game.opponentScore).length
      const totalGames = wins + losses + ties
      const winPercentage = totalGames > 0 ? (wins + ties * 0.5) / totalGames : 0

      const pointsFor = allGames.reduce((sum, game) => sum + (game.teamScore || 0), 0)
      const pointsAgainst = allGames.reduce((sum, game) => sum + (game.opponentScore || 0), 0)
      const pointDifferential = pointsFor - pointsAgainst

      return {
        team_id: team.id,
        team_name: team.name,
        team_abbreviation: team.abbreviation,
        city: team.city,
        league: team.league,
        sport: team.sport,
        conference: team.conference,
        division: team.division,
        wins,
        losses,
        ties,
        total_games: totalGames,
        win_percentage: Math.round(winPercentage * 1000) / 1000,
        points_for: pointsFor,
        points_against: pointsAgainst,
        point_differential: pointDifferential,
        home_record: {
          wins: allGames.filter(game => game.isHome && game.teamScore > game.opponentScore).length,
          losses: allGames.filter(game => game.isHome && game.teamScore < game.opponentScore).length,
          ties: allGames.filter(game => game.isHome && game.teamScore === game.opponentScore).length
        },
        away_record: {
          wins: allGames.filter(game => !game.isHome && game.teamScore > game.opponentScore).length,
          losses: allGames.filter(game => !game.isHome && game.teamScore < game.opponentScore).length,
          ties: allGames.filter(game => !game.isHome && game.teamScore === game.opponentScore).length
        },
        last_10: allGames
          .sort((a, b) => new Date(b.game_date).getTime() - new Date(a.game_date).getTime())
          .slice(0, 10)
          .map(game => game.teamScore > game.opponentScore ? 'W' : game.teamScore < game.opponentScore ? 'L' : 'T')
          .join(''),
        streak: calculateStreak(allGames),
        season
      }
    }) || []

    // Sort standings by win percentage, then by point differential
    standings.sort((a, b) => {
      if (b.win_percentage !== a.win_percentage) {
        return b.win_percentage - a.win_percentage
      }
      return b.point_differential - a.point_differential
    })

    // Add rank to each team
    standings.forEach((team: any, index) => {
      team.rank = index + 1
    })

    const responseData = {
      data: standings,
      meta: {
        fromCache: false,
        responseTime: 0,
        source: "supabase",
        total: standings.length,
        season,
        sport: sport || 'all',
        league: league || 'all'
      }
    }

    // Cache the response
    standingsCache.set(cacheKey, {
      data: responseData,
      timestamp: Date.now()
    })

    // Clean up old cache entries (keep only last MAX_CACHE_ENTRIES)
    if (standingsCache.size > MAX_CACHE_ENTRIES) {
      const entries = Array.from(standingsCache.entries())
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp)
      const toDelete = entries.slice(0, entries.length - MAX_CACHE_ENTRIES)
      toDelete.forEach(([key]) => standingsCache.delete(key))

      console.log(`Standings cache: Cleaned up ${toDelete.length} old entries`)
    }

    return NextResponse.json(responseData)
  } catch (error) {
    console.error("API Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

function calculateStreak(games: any[]): string {
  if (games.length === 0) return ''
  
  const sortedGames = games.sort((a, b) => new Date(b.game_date).getTime() - new Date(a.game_date).getTime())
  let streak = 0
  const lastResult = sortedGames[0].teamScore > sortedGames[0].opponentScore ? 'W' : 
                    sortedGames[0].teamScore < sortedGames[0].opponentScore ? 'L' : 'T'
  
  for (const game of sortedGames) {
    const result = game.teamScore > game.opponentScore ? 'W' : 
                  game.teamScore < game.opponentScore ? 'L' : 'T'
    if (result === lastResult) {
      streak++
    } else {
      break
    }
  }
  
  return `${lastResult}${streak}`
}
