import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const team = searchParams.get("team") || "all"
    const timeRange = searchParams.get("timeRange") || "30d"
    
    // Calculate date range
    const endDate = new Date()
    const startDate = new Date()
    
    switch (timeRange) {
      case "7d":
        startDate.setDate(endDate.getDate() - 7)
        break
      case "30d":
        startDate.setDate(endDate.getDate() - 30)
        break
      case "90d":
        startDate.setDate(endDate.getDate() - 90)
        break
      case "1y":
        startDate.setFullYear(endDate.getFullYear() - 1)
        break
      default:
        startDate.setDate(endDate.getDate() - 30)
    }

    const supabase = await createClient()
    
    if (!supabase) {
      return NextResponse.json({
        performance: [],
        meta: {
          fromCache: false,
          responseTime: 0,
          source: "supabase",
          error: "Database connection failed"
        }
      })
    }

    // Get team performance data
    let query = supabase
      .from("games")
      .select(`
        *,
        home_team:teams!games_home_team_id_fkey(name, abbreviation, sport, league),
        away_team:teams!games_away_team_id_fkey(name, abbreviation, sport, league)
      `)
      .gte("game_date", startDate.toISOString())
      .lte("game_date", endDate.toISOString())
      .not("home_score", "is", null)
      .not("away_score", "is", null)

    if (team !== "all") {
      query = query.or(`home_team.name.ilike.%${team}%,away_team.name.ilike.%${team}%`)
    }

    const { data: gamesData, error: gamesError } = await query

    if (gamesError) {
      console.error("Error fetching games data:", gamesError)
      return NextResponse.json({
        performance: [],
        meta: {
          fromCache: false,
          responseTime: 0,
          source: "supabase",
          error: "Failed to fetch games data"
        }
      })
    }

    // Process performance data
    const performance = processTeamPerformance(gamesData || [], team)
    
    return NextResponse.json({
      performance,
      meta: {
        fromCache: false,
        responseTime: 0,
        source: "supabase",
        total: performance.length
      }
    })
  } catch (error) {
    console.error("API Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

function processTeamPerformance(gamesData: any[], team: string) {
  const teamStats: Record<string, any> = {}
  
  gamesData.forEach(game => {
    const homeTeam = game.home_team?.name
    const awayTeam = game.away_team?.name
    
    if (!homeTeam || !awayTeam) return
    
    // Process home team
    if (!teamStats[homeTeam]) {
      teamStats[homeTeam] = {
        team: homeTeam,
        sport: game.home_team?.sport || 'basketball',
        league: game.home_team?.league || 'NBA',
        games: 0,
        wins: 0,
        losses: 0,
        pointsFor: 0,
        pointsAgainst: 0,
        homeWins: 0,
        homeLosses: 0,
        awayWins: 0,
        awayLosses: 0,
        winStreak: 0,
        avgPointsFor: 0,
        avgPointsAgainst: 0,
        pointDifferential: 0
      }
    }
    
    // Process away team
    if (!teamStats[awayTeam]) {
      teamStats[awayTeam] = {
        team: awayTeam,
        sport: game.away_team?.sport || 'basketball',
        league: game.away_team?.league || 'NBA',
        games: 0,
        wins: 0,
        losses: 0,
        pointsFor: 0,
        pointsAgainst: 0,
        homeWins: 0,
        homeLosses: 0,
        awayWins: 0,
        awayLosses: 0,
        winStreak: 0,
        avgPointsFor: 0,
        avgPointsAgainst: 0,
        pointDifferential: 0
      }
    }
    
    // Update home team stats
    teamStats[homeTeam].games++
    teamStats[homeTeam].pointsFor += game.home_score || 0
    teamStats[homeTeam].pointsAgainst += game.away_score || 0
    
    if (game.home_score > game.away_score) {
      teamStats[homeTeam].wins++
      teamStats[homeTeam].homeWins++
    } else {
      teamStats[homeTeam].losses++
      teamStats[homeTeam].homeLosses++
    }
    
    // Update away team stats
    teamStats[awayTeam].games++
    teamStats[awayTeam].pointsFor += game.away_score || 0
    teamStats[awayTeam].pointsAgainst += game.home_score || 0
    
    if (game.away_score > game.home_score) {
      teamStats[awayTeam].wins++
      teamStats[awayTeam].awayWins++
    } else {
      teamStats[awayTeam].losses++
      teamStats[awayTeam].awayLosses++
    }
  })
  
  // Calculate derived stats
  Object.values(teamStats).forEach((stats: any) => {
    stats.avgPointsFor = stats.games > 0 ? (stats.pointsFor / stats.games).toFixed(1) : 0
    stats.avgPointsAgainst = stats.games > 0 ? (stats.pointsAgainst / stats.games).toFixed(1) : 0
    stats.pointDifferential = stats.pointsFor - stats.pointsAgainst
    stats.winPercentage = stats.games > 0 ? (stats.wins / stats.games).toFixed(3) : 0
  })
  
  // Filter by team if specified
  let result = Object.values(teamStats)
  if (team !== "all") {
    result = result.filter((stats: any) => 
      stats.team.toLowerCase().includes(team.toLowerCase())
    )
  }
  
  // Sort by win percentage
  return result.sort((a: any, b: any) => parseFloat(b.winPercentage) - parseFloat(a.winPercentage))
}
