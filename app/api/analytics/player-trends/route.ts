import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const playerId = searchParams.get("playerId")
    const playerName = searchParams.get("playerName")
    const teamId = searchParams.get("teamId")
    const sport = searchParams.get("sport") || "basketball"
    const timeRange = searchParams.get("timeRange") || "30d"
    
    if (!playerId && !playerName) {
      return NextResponse.json({ error: "Player ID or name is required" }, { status: 400 })
    }
    
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
        trends: [],
        meta: {
          fromCache: false,
          responseTime: 0,
          source: "supabase",
          error: "Database connection failed"
        }
      })
    }

    // Get player stats based on sport
    let tableName = "player_stats"
    let statsColumns = `
      player_name,
      position,
      points,
      rebounds,
      assists,
      steals,
      blocks,
      field_goals_made,
      field_goals_attempted,
      three_pointers_made,
      three_pointers_attempted,
      free_throws_made,
      free_throws_attempted,
      minutes_played,
      created_at
    `
    
    switch (sport) {
      case "football":
        tableName = "football_player_stats"
        statsColumns = `
          player_name,
          position,
          passing_yards,
          passing_touchdowns,
          rushing_yards,
          rushing_touchdowns,
          receiving_yards,
          receiving_touchdowns,
          receptions,
          tackles,
          sacks,
          interceptions,
          created_at
        `
        break
      case "baseball":
        tableName = "baseball_player_stats"
        statsColumns = `
          player_name,
          position,
          at_bats,
          hits,
          runs,
          rbi,
          home_runs,
          doubles,
          triples,
          walks,
          strikeouts,
          batting_average,
          created_at
        `
        break
      case "hockey":
        tableName = "hockey_player_stats"
        statsColumns = `
          player_name,
          position,
          goals,
          assists,
          points,
          plus_minus,
          penalty_minutes,
          shots,
          hits,
          blocked_shots,
          created_at
        `
        break
      case "soccer":
        tableName = "soccer_player_stats"
        statsColumns = `
          player_name,
          position,
          goals,
          assists,
          shots,
          shots_on_target,
          passes,
          passes_completed,
          tackles,
          interceptions,
          created_at
        `
        break
    }

    let query = supabase
      .from(tableName)
      .select(`
        ${statsColumns},
        team_id,
        game_id,
        games!inner(
          game_date,
          home_team:teams!games_home_team_id_fkey(name, abbreviation),
          away_team:teams!games_away_team_id_fkey(name, abbreviation)
        )
      `)
      .gte("created_at", startDate.toISOString())
      .lte("created_at", endDate.toISOString())

    if (playerId) {
      query = query.eq("player_id", playerId)
    } else if (playerName) {
      query = query.ilike("player_name", `%${playerName}%`)
    }

    if (teamId) {
      query = query.eq("team_id", teamId)
    }

    const { data: playerStats, error: statsError } = await query.order("created_at", { ascending: true })

    if (statsError) {
      console.error("Error fetching player stats:", statsError)
      return NextResponse.json({
        trends: [],
        meta: {
          fromCache: false,
          responseTime: 0,
          source: "supabase",
          error: "Failed to fetch player stats"
        }
      })
    }

    // Process player trends
    const trends = processPlayerTrends(playerStats || [], sport)
    
    return NextResponse.json({
      trends,
      meta: {
        fromCache: false,
        responseTime: 0,
        source: "supabase",
        total: trends.length
      }
    })
  } catch (error) {
    console.error("API Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

function processPlayerTrends(playerStats: any[], sport: string) {
  if (playerStats.length === 0) return []
  
  const trends = []
  const recentGames = playerStats.slice(-10) // Last 10 games
  const previousGames = playerStats.slice(-20, -10) // Previous 10 games
  
  if (recentGames.length === 0) return []
  
  // Calculate trends based on sport
  switch (sport) {
    case "basketball":
      trends.push(...calculateBasketballTrends(recentGames, previousGames))
      break
    case "football":
      trends.push(...calculateFootballTrends(recentGames, previousGames))
      break
    case "baseball":
      trends.push(...calculateBaseballTrends(recentGames, previousGames))
      break
    case "hockey":
      trends.push(...calculateHockeyTrends(recentGames, previousGames))
      break
    case "soccer":
      trends.push(...calculateSoccerTrends(recentGames, previousGames))
      break
  }
  
  return trends
}

function calculateBasketballTrends(recent: any[], previous: any[]) {
  const trends = []
  
  // Points trend
  const recentPoints = recent.reduce((sum, game) => sum + (game.points || 0), 0) / recent.length
  const previousPoints = previous.length > 0 ? previous.reduce((sum, game) => sum + (game.points || 0), 0) / previous.length : recentPoints
  const pointsChange = ((recentPoints - previousPoints) / previousPoints) * 100
  
  trends.push({
    metric: "Points",
    current: recentPoints.toFixed(1),
    previous: previousPoints.toFixed(1),
    change: pointsChange.toFixed(1),
    trend: pointsChange > 0 ? "up" : pointsChange < 0 ? "down" : "neutral",
    confidence: Math.min(0.95, 0.5 + Math.abs(pointsChange) / 50)
  })
  
  // Rebounds trend
  const recentRebounds = recent.reduce((sum, game) => sum + (game.rebounds || 0), 0) / recent.length
  const previousRebounds = previous.length > 0 ? previous.reduce((sum, game) => sum + (game.rebounds || 0), 0) / previous.length : recentRebounds
  const reboundsChange = ((recentRebounds - previousRebounds) / previousRebounds) * 100
  
  trends.push({
    metric: "Rebounds",
    current: recentRebounds.toFixed(1),
    previous: previousRebounds.toFixed(1),
    change: reboundsChange.toFixed(1),
    trend: reboundsChange > 0 ? "up" : reboundsChange < 0 ? "down" : "neutral",
    confidence: Math.min(0.95, 0.5 + Math.abs(reboundsChange) / 50)
  })
  
  // Assists trend
  const recentAssists = recent.reduce((sum, game) => sum + (game.assists || 0), 0) / recent.length
  const previousAssists = previous.length > 0 ? previous.reduce((sum, game) => sum + (game.assists || 0), 0) / previous.length : recentAssists
  const assistsChange = ((recentAssists - previousAssists) / previousAssists) * 100
  
  trends.push({
    metric: "Assists",
    current: recentAssists.toFixed(1),
    previous: previousAssists.toFixed(1),
    change: assistsChange.toFixed(1),
    trend: assistsChange > 0 ? "up" : assistsChange < 0 ? "down" : "neutral",
    confidence: Math.min(0.95, 0.5 + Math.abs(assistsChange) / 50)
  })
  
  // Field Goal Percentage trend
  const recentFGM = recent.reduce((sum, game) => sum + (game.field_goals_made || 0), 0)
  const recentFGA = recent.reduce((sum, game) => sum + (game.field_goals_attempted || 0), 0)
  const recentFGPercent = recentFGA > 0 ? (recentFGM / recentFGA) * 100 : 0
  
  const previousFGM = previous.length > 0 ? previous.reduce((sum, game) => sum + (game.field_goals_made || 0), 0) : recentFGM
  const previousFGA = previous.length > 0 ? previous.reduce((sum, game) => sum + (game.field_goals_attempted || 0), 0) : recentFGA
  const previousFGPercent = previousFGA > 0 ? (previousFGM / previousFGA) * 100 : recentFGPercent
  const fgChange = recentFGPercent - previousFGPercent
  
  trends.push({
    metric: "Field Goal %",
    current: recentFGPercent.toFixed(1),
    previous: previousFGPercent.toFixed(1),
    change: fgChange.toFixed(1),
    trend: fgChange > 0 ? "up" : fgChange < 0 ? "down" : "neutral",
    confidence: Math.min(0.95, 0.5 + Math.abs(fgChange) / 10)
  })
  
  return trends
}

function calculateFootballTrends(recent: any[], previous: any[]) {
  const trends = []
  
  // Passing yards trend
  const recentPassing = recent.reduce((sum, game) => sum + (game.passing_yards || 0), 0) / recent.length
  const previousPassing = previous.length > 0 ? previous.reduce((sum, game) => sum + (game.passing_yards || 0), 0) / previous.length : recentPassing
  const passingChange = ((recentPassing - previousPassing) / previousPassing) * 100
  
  trends.push({
    metric: "Passing Yards",
    current: recentPassing.toFixed(1),
    previous: previousPassing.toFixed(1),
    change: passingChange.toFixed(1),
    trend: passingChange > 0 ? "up" : passingChange < 0 ? "down" : "neutral",
    confidence: Math.min(0.95, 0.5 + Math.abs(passingChange) / 50)
  })
  
  // Rushing yards trend
  const recentRushing = recent.reduce((sum, game) => sum + (game.rushing_yards || 0), 0) / recent.length
  const previousRushing = previous.length > 0 ? previous.reduce((sum, game) => sum + (game.rushing_yards || 0), 0) / previous.length : recentRushing
  const rushingChange = ((recentRushing - previousRushing) / previousRushing) * 100
  
  trends.push({
    metric: "Rushing Yards",
    current: recentRushing.toFixed(1),
    previous: previousRushing.toFixed(1),
    change: rushingChange.toFixed(1),
    trend: rushingChange > 0 ? "up" : rushingChange < 0 ? "down" : "neutral",
    confidence: Math.min(0.95, 0.5 + Math.abs(rushingChange) / 50)
  })
  
  return trends
}

function calculateBaseballTrends(recent: any[], previous: any[]) {
  const trends = []
  
  // Batting average trend
  const recentHits = recent.reduce((sum, game) => sum + (game.hits || 0), 0)
  const recentAB = recent.reduce((sum, game) => sum + (game.at_bats || 0), 0)
  const recentAvg = recentAB > 0 ? recentHits / recentAB : 0
  
  const previousHits = previous.length > 0 ? previous.reduce((sum, game) => sum + (game.hits || 0), 0) : recentHits
  const previousAB = previous.length > 0 ? previous.reduce((sum, game) => sum + (game.at_bats || 0), 0) : recentAB
  const previousAvg = previousAB > 0 ? previousHits / previousAB : recentAvg
  const avgChange = ((recentAvg - previousAvg) / previousAvg) * 100
  
  trends.push({
    metric: "Batting Average",
    current: recentAvg.toFixed(3),
    previous: previousAvg.toFixed(3),
    change: avgChange.toFixed(1),
    trend: avgChange > 0 ? "up" : avgChange < 0 ? "down" : "neutral",
    confidence: Math.min(0.95, 0.5 + Math.abs(avgChange) / 20)
  })
  
  return trends
}

function calculateHockeyTrends(recent: any[], previous: any[]) {
  const trends = []
  
  // Points trend
  const recentPoints = recent.reduce((sum, game) => sum + (game.points || 0), 0) / recent.length
  const previousPoints = previous.length > 0 ? previous.reduce((sum, game) => sum + (game.points || 0), 0) / previous.length : recentPoints
  const pointsChange = ((recentPoints - previousPoints) / previousPoints) * 100
  
  trends.push({
    metric: "Points",
    current: recentPoints.toFixed(1),
    previous: previousPoints.toFixed(1),
    change: pointsChange.toFixed(1),
    trend: pointsChange > 0 ? "up" : pointsChange < 0 ? "down" : "neutral",
    confidence: Math.min(0.95, 0.5 + Math.abs(pointsChange) / 50)
  })
  
  return trends
}

function calculateSoccerTrends(recent: any[], previous: any[]) {
  const trends = []
  
  // Goals trend
  const recentGoals = recent.reduce((sum, game) => sum + (game.goals || 0), 0) / recent.length
  const previousGoals = previous.length > 0 ? previous.reduce((sum, game) => sum + (game.goals || 0), 0) / previous.length : recentGoals
  const goalsChange = ((recentGoals - previousGoals) / previousGoals) * 100
  
  trends.push({
    metric: "Goals",
    current: recentGoals.toFixed(1),
    previous: previousGoals.toFixed(1),
    change: goalsChange.toFixed(1),
    trend: goalsChange > 0 ? "up" : goalsChange < 0 ? "down" : "neutral",
    confidence: Math.min(0.95, 0.5 + Math.abs(goalsChange) / 50)
  })
  
  return trends
}
