import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { SupportedSport, SportConfigManager } from "@/lib/services/core/sport-config"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const team = searchParams.get("team") || ""
    const sport = searchParams.get("sport")
    const league = searchParams.get("league")
    
    // Validate sport parameter dynamically
    const supportedSports: SupportedSport[] = SportConfigManager.getSupportedSports()
    if (!sport || !supportedSports.includes(sport as SupportedSport)) {
      return NextResponse.json({ 
        error: `Sport parameter is required and must be one of: ${supportedSports.join(', ')}` 
      }, { status: 400 })
    }
    const finalSport = sport as SupportedSport
    const timeRange = searchParams.get("timeRange") || "30"

    const supabase = await createClient()
    
    if (!supabase) {
      return NextResponse.json({ error: "Database connection failed" }, { status: 500 })
    }
    
    // Get team performance data from database
    let teamQuery = supabase
      .from('teams')
      .select('*')
      .eq('sport', finalSport)
    
    if (team && team !== 'all') {
      teamQuery = teamQuery.eq('name', team)
    }
    
    if (league) {
      teamQuery = teamQuery.eq('league', league)
    }

    const { data: teamData, error: teamError } = await teamQuery.single()
    
    if (teamError || !teamData) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 })
    }

    // Get recent games for this team from database
    let gamesQuery = supabase
      .from('games')
      .select('*')
      .or(`home_team_id.eq.${teamData.id},away_team_id.eq.${teamData.id}`)
      .eq('sport', finalSport)
      .order('game_date', { ascending: false })
      .limit(parseInt(timeRange))
    
    if (league) {
      gamesQuery = gamesQuery.eq('league', league)
    }

    const { data: games, error: gamesError } = await gamesQuery

    if (gamesError) {
      return NextResponse.json({ error: "Failed to fetch games" }, { status: 500 })
    }

    // Calculate performance metrics from database data
    const performance = games?.map(game => {
      const isHome = game.home_team_id === teamData.id
      const teamScore = isHome ? (game.home_score || 0) : (game.away_score || 0)
      const opponentScore = isHome ? (game.away_score || 0) : (game.home_score || 0)
      const won = teamScore > opponentScore
      
      return {
        date: game.game_date || new Date().toISOString(),
        opponent: isHome ? (game.away_team?.name || 'Away Team') : (game.home_team?.name || 'Home Team'),
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