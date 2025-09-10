import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const league = searchParams.get("league")
    const sport = searchParams.get("sport")
    const season = searchParams.get("season") || "2024-25"

    // Build query for teams
    let teamsQuery = supabase.from("teams").select("*")
    
    if (league) {
      teamsQuery = teamsQuery.eq("league", league)
    }
    if (sport) {
      teamsQuery = teamsQuery.eq("sport", sport)
    }

    const { data: teams, error: teamsError } = await teamsQuery

    if (teamsError) {
      console.error("Error fetching teams:", teamsError)
      return NextResponse.json({ error: "Failed to fetch teams" }, { status: 500 })
    }

    if (!teams || teams.length === 0) {
      return NextResponse.json([])
    }

    // Get games for the season, filtered by sport if specified
    let gamesQuery = supabase
      .from("games")
      .select(`
        *,
        home_team:teams!games_home_team_id_fkey(id, name, abbreviation, sport, league),
        away_team:teams!games_away_team_id_fkey(id, name, abbreviation, sport, league)
      `)
      .eq("season", season)
      .in("status", ["completed", "in_progress"])

    const { data: games, error: gamesError } = await gamesQuery

    if (gamesError) {
      console.error("Error fetching games:", gamesError)
      return NextResponse.json({ error: "Failed to fetch games" }, { status: 500 })
    }

    // Calculate standings for each team
    const standings = teams.map(team => {
      const teamGames = games?.filter(game => 
        (game.home_team_id === team.id || game.away_team_id === team.id) &&
        // Filter by sport if specified
        (!sport || (game.home_team?.sport === sport && game.away_team?.sport === sport))
      ) || []

      let wins = 0
      let losses = 0
      let ties = 0 // Some sports have ties

      teamGames.forEach(game => {
        if (game.status === "completed" && game.home_score !== null && game.away_score !== null) {
          const isHomeTeam = game.home_team_id === team.id
          const teamScore = isHomeTeam ? game.home_score : game.away_score
          const opponentScore = isHomeTeam ? game.away_score : game.home_score

          if (teamScore > opponentScore) {
            wins++
          } else if (teamScore < opponentScore) {
            losses++
          } else {
            ties++
          }
        }
      })

      const totalGames = wins + losses + ties
      const winRate = totalGames > 0 ? wins / totalGames : 0
      const points = wins * 2 + ties // Most sports: 2 points for win, 1 for tie, 0 for loss

      return {
        id: team.id,
        team: team.name,
        abbreviation: team.abbreviation,
        wins,
        losses,
        ties,
        points,
        winRate,
        gamesBehind: 0, // This would need more complex calculation
        league: team.league,
        sport: team.sport,
        totalGames,
        rank: 0 // Will be set after sorting
      }
    })

    // Sort by points (or win rate for sports without points), then by wins
    standings.sort((a, b) => {
      // For sports with points system (soccer, hockey), sort by points first
      if (a.sport === 'soccer' || a.sport === 'hockey') {
        if (b.points !== a.points) {
          return b.points - a.points
        }
        // Tiebreaker: goal difference, then goals for
        return b.wins - a.wins
      } else {
        // For other sports, sort by win rate, then wins
        if (b.winRate !== a.winRate) {
          return b.winRate - a.winRate
        }
        return b.wins - a.wins
      }
    })

    // Add rank
    standings.forEach((team, index) => {
      team.rank = index + 1
    })

    return NextResponse.json(standings)
  } catch (error) {
    console.error("API Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
