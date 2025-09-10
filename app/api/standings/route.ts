import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)

    const sport = searchParams.get("sport")
    const league = searchParams.get("league")
    const season = searchParams.get("season") || "2024-25"
    const limit = Number.parseInt(searchParams.get("limit") || "50")

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
        ...(team.home_games || []).map(game => ({
          ...game,
          isHome: true,
          teamScore: game.home_score,
          opponentScore: game.away_score
        })),
        ...(team.away_games || []).map(game => ({
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
    standings.forEach((team, index) => {
      team.rank = index + 1
    })

    return NextResponse.json({
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
    })
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