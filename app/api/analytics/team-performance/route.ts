import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { sportsAPI } from "@/lib/api/sports-api"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const team = searchParams.get("team") || ""
    const sport = searchParams.get("sport") || "basketball"
    const league = searchParams.get("league") || "NBA"
    const timeRange = searchParams.get("timeRange") || "30"

    const supabase = await createClient()
    
    if (!supabase) {
      return NextResponse.json({ error: "Database connection failed" }, { status: 500 })
    }
    
    // Get team performance data from database
    const { data: teamData, error: teamError } = await supabase
      .from('teams')
      .select('*')
      .eq('name', team)
      .eq('sport', sport)
      .single()

    if (teamError || !teamData) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 })
    }

    // Get recent games for this team
    const { data: games, error: gamesError } = await supabase
      .from('games')
      .select('*')
      .or(`home_team_id.eq.${teamData.id},away_team_id.eq.${teamData.id}`)
      .eq('sport', sport)
      .order('date', { ascending: false })
      .limit(parseInt(timeRange))

    if (gamesError) {
      return NextResponse.json({ error: "Failed to fetch games" }, { status: 500 })
    }

    // Calculate performance metrics
    const performance = games?.map(game => {
      const isHome = game.home_team_id === teamData.id
      const teamScore = isHome ? game.home_score : game.away_score
      const opponentScore = isHome ? game.away_score : game.home_score
      const won = teamScore > opponentScore
      
      return {
        date: game.date,
        opponent: isHome ? game.away_team : game.home_team,
        score: `${teamScore}-${opponentScore}`,
        won,
        points: teamScore,
        opponentPoints: opponentScore,
        margin: teamScore - opponentScore
      }
    }) || []

    // Calculate team stats
    const wins = performance.filter(p => p.won).length
    const losses = performance.length - wins
    const winPercentage = performance.length > 0 ? (wins / performance.length) * 100 : 0
    const avgPoints = performance.length > 0 ? 
      performance.reduce((sum, p) => sum + p.points, 0) / performance.length : 0
    const avgOpponentPoints = performance.length > 0 ? 
      performance.reduce((sum, p) => sum + p.opponentPoints, 0) / performance.length : 0

    return NextResponse.json({
      team: teamData,
      performance,
      stats: {
        wins,
        losses,
        winPercentage: Math.round(winPercentage * 100) / 100,
        avgPoints: Math.round(avgPoints * 100) / 100,
        avgOpponentPoints: Math.round(avgOpponentPoints * 100) / 100,
        pointDifferential: Math.round((avgPoints - avgOpponentPoints) * 100) / 100
      },
      timeRange: parseInt(timeRange)
    })

  } catch (error) {
    console.error("Team performance API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}