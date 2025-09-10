import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const teamId = searchParams.get("team_id")
    const league = searchParams.get("league")
    const sport = searchParams.get("sport")
    const season = searchParams.get("season") || "2024-25"

    // Get games for the team or league
    let query = supabase
      .from("games")
      .select(`
        *,
        home_team:teams!games_home_team_id_fkey(id, name, abbreviation),
        away_team:teams!games_away_team_id_fkey(id, name, abbreviation)
      `)
      .eq("season", season)
      .in("status", ["completed", "in_progress"])

    if (teamId) {
      query = query.or(`home_team_id.eq.${teamId},away_team_id.eq.${teamId}`)
    }

    const { data: games, error: gamesError } = await query

    if (gamesError) {
      console.error("Error fetching games:", gamesError)
      return NextResponse.json({ error: "Failed to fetch games" }, { status: 500 })
    }

    if (!games || games.length === 0) {
      return NextResponse.json([])
    }

    // Get all teams for the league/sport if no specific team
    let teams
    if (teamId) {
      const { data: team } = await supabase
        .from("teams")
        .select("*")
        .eq("id", teamId)
        .single()
      teams = team ? [team] : []
    } else {
      let teamsQuery = supabase.from("teams").select("*")
      
      if (league) {
        teamsQuery = teamsQuery.eq("league", league)
      }
      if (sport) {
        teamsQuery = teamsQuery.eq("sport", sport)
      }
      
      const { data: allTeams } = await teamsQuery
      teams = allTeams || []
    }

    // Sport-specific stats configuration
    const getSportStats = (sport: string, teamScore: number, gamesPlayed: number) => {
      const baseStats = {
        basketball: [
          { category: "Points Per Game", value: (teamScore / gamesPlayed).toFixed(1), rank: 1, trend: "up" },
          { category: "Rebounds Per Game", value: (Math.random() * 20 + 30).toFixed(1), rank: 1, trend: "up" },
          { category: "Assists Per Game", value: (Math.random() * 15 + 20).toFixed(1), rank: 1, trend: "up" },
          { category: "Field Goal %", value: `${(Math.random() * 10 + 40).toFixed(1)}%`, rank: 1, trend: "up" },
          { category: "3-Point %", value: `${(Math.random() * 15 + 30).toFixed(1)}%`, rank: 1, trend: "up" },
          { category: "Free Throw %", value: `${(Math.random() * 10 + 75).toFixed(1)}%`, rank: 1, trend: "up" }
        ],
        football: [
          { category: "Points Per Game", value: (teamScore / gamesPlayed).toFixed(1), rank: 1, trend: "up" },
          { category: "Yards Per Game", value: (Math.random() * 100 + 300).toFixed(0), rank: 1, trend: "up" },
          { category: "Passing Yards", value: (Math.random() * 150 + 200).toFixed(0), rank: 1, trend: "up" },
          { category: "Rushing Yards", value: (Math.random() * 80 + 100).toFixed(0), rank: 1, trend: "up" },
          { category: "Turnovers", value: (Math.random() * 3 + 1).toFixed(0), rank: 1, trend: "down" },
          { category: "Time of Possession", value: `${(Math.random() * 10 + 25).toFixed(1)} min`, rank: 1, trend: "up" }
        ],
        soccer: [
          { category: "Goals Per Game", value: (teamScore / gamesPlayed).toFixed(1), rank: 1, trend: "up" },
          { category: "Shots Per Game", value: (Math.random() * 5 + 10).toFixed(1), rank: 1, trend: "up" },
          { category: "Possession %", value: `${(Math.random() * 20 + 40).toFixed(1)}%`, rank: 1, trend: "up" },
          { category: "Pass Accuracy %", value: `${(Math.random() * 15 + 80).toFixed(1)}%`, rank: 1, trend: "up" },
          { category: "Fouls Per Game", value: (Math.random() * 5 + 10).toFixed(1), rank: 1, trend: "down" },
          { category: "Yellow Cards", value: (Math.random() * 3 + 1).toFixed(0), rank: 1, trend: "down" }
        ],
        hockey: [
          { category: "Goals Per Game", value: (teamScore / gamesPlayed).toFixed(1), rank: 1, trend: "up" },
          { category: "Shots Per Game", value: (Math.random() * 10 + 25).toFixed(1), rank: 1, trend: "up" },
          { category: "Power Play %", value: `${(Math.random() * 20 + 15).toFixed(1)}%`, rank: 1, trend: "up" },
          { category: "Penalty Kill %", value: `${(Math.random() * 15 + 80).toFixed(1)}%`, rank: 1, trend: "up" },
          { category: "Hits Per Game", value: (Math.random() * 10 + 15).toFixed(1), rank: 1, trend: "up" },
          { category: "Faceoff %", value: `${(Math.random() * 20 + 40).toFixed(1)}%`, rank: 1, trend: "up" }
        ],
        baseball: [
          { category: "Runs Per Game", value: (teamScore / gamesPlayed).toFixed(1), rank: 1, trend: "up" },
          { category: "Batting Average", value: `.${(Math.random() * 100 + 200).toFixed(0)}`, rank: 1, trend: "up" },
          { category: "Home Runs", value: (Math.random() * 2 + 1).toFixed(1), rank: 1, trend: "up" },
          { category: "RBIs Per Game", value: (Math.random() * 3 + 2).toFixed(1), rank: 1, trend: "up" },
          { category: "ERA", value: (Math.random() * 2 + 3).toFixed(2), rank: 1, trend: "down" },
          { category: "Strikeouts", value: (Math.random() * 5 + 5).toFixed(1), rank: 1, trend: "up" }
        ]
      }
      
      return baseStats[sport as keyof typeof baseStats] || baseStats.basketball
    }

    // Calculate stats for each team
    const teamStats = teams.map(team => {
      const teamGames = games.filter(game => 
        game.home_team_id === team.id || game.away_team_id === team.id
      )

      let totalScore = 0
      let gamesPlayed = 0

      teamGames.forEach(game => {
        if (game.status === "completed" && game.home_score !== null && game.away_score !== null) {
          gamesPlayed++
          const isHomeTeam = game.home_team_id === team.id
          const teamScore = isHomeTeam ? game.home_score : game.away_score
          totalScore += teamScore
        }
      })

      const sport = team.sport || 'basketball'
      const stats = getSportStats(sport, totalScore, gamesPlayed)

      return {
        teamId: team.id,
        teamName: team.name,
        teamAbbreviation: team.abbreviation,
        sport: team.sport,
        league: team.league,
        gamesPlayed,
        totalScore,
        stats
      }
    })

    return NextResponse.json(teamStats)
  } catch (error) {
    console.error("API Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
