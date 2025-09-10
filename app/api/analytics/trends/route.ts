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
      default:
        startDate.setDate(endDate.getDate() - 30)
    }

    const supabase = await createClient()
    
    if (!supabase) {
      return NextResponse.json({
        trends: [],
        stats: null,
        meta: {
          fromCache: false,
          responseTime: 0,
          source: "supabase",
          error: "Database connection failed"
        }
      })
    }

    // Get games data for trend analysis
    const { data: gamesData, error: gamesError } = await supabase
      .from("games")
      .select(`
        *,
        home_team:teams!games_home_team_id_fkey(name, abbreviation),
        away_team:teams!games_away_team_id_fkey(name, abbreviation)
      `)
      .gte("game_date", startDate.toISOString())
      .lte("game_date", endDate.toISOString())
      .not("home_score", "is", null)
      .not("away_score", "is", null)

    if (gamesError) {
      console.error("Error fetching games data:", gamesError)
      return NextResponse.json({
        trends: [],
        stats: null,
        meta: {
          fromCache: false,
          responseTime: 0,
          source: "supabase",
          error: "Failed to fetch games data"
        }
      })
    }

    // Analyze trends
    const trends = analyzeTrends(gamesData || [], team)
    const stats = calculateTrendStats(gamesData || [])
    
    return NextResponse.json({
      trends,
      stats,
      meta: {
        fromCache: false,
        responseTime: 0,
        source: "supabase",
        total: gamesData?.length || 0
      }
    })
  } catch (error) {
    console.error("API Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

function analyzeTrends(gamesData: any[], team: string) {
  const trends = []
  
  // Home Performance Analysis
  const homeGames = gamesData.filter(game => 
    team === "all" || 
    game.home_team?.name?.toLowerCase().includes(team.toLowerCase()) ||
    game.away_team?.name?.toLowerCase().includes(team.toLowerCase())
  )
  
  if (homeGames.length > 0) {
    const homeWins = homeGames.filter(game => game.home_score > game.away_score).length
    const homeWinRate = homeWins / homeGames.length
    const expectedHomeWinRate = 0.5 // Simplified assumption
    const homePerformance = ((homeWinRate - expectedHomeWinRate) * 100).toFixed(1)
    
    const homePerformanceNum = parseFloat(homePerformance)
    trends.push({
      category: "Home Performance",
      trend: homePerformanceNum > 0 ? "up" : "down",
      value: `${homePerformanceNum > 0 ? '+' : ''}${homePerformance}%`,
      description: `Home teams are ${Math.abs(homePerformanceNum)}% ${homePerformanceNum > 0 ? 'above' : 'below'} expected performance`,
      confidence: Math.min(0.95, 0.5 + Math.abs(homePerformanceNum) / 100)
    })
  }
  
  // Over/Under Analysis
  const totalGames = gamesData.filter(game => game.home_score && game.away_score)
  if (totalGames.length > 0) {
    const totalScores = totalGames.map(game => game.home_score + game.away_score)
    const avgTotal = totalScores.reduce((a, b) => a + b, 0) / totalScores.length
    
    // Calculate expected totals based on historical data
    const sport = gamesData[0]?.sport || 'basketball'
    const expectedTotal = calculateExpectedTotal(sport, totalScores)
    const totalVariance = ((avgTotal - expectedTotal) / expectedTotal * 100).toFixed(1)
    
    const varianceNum = parseFloat(totalVariance)
    trends.push({
      category: "Over/Under Totals",
      trend: Math.abs(varianceNum) < 5 ? "neutral" : varianceNum > 0 ? "up" : "down",
      value: `${varianceNum > 0 ? '+' : ''}${totalVariance}%`,
      description: `Games are averaging ${avgTotal.toFixed(1)} ${sport === 'basketball' ? 'points' : sport === 'football' ? 'points' : sport === 'baseball' ? 'runs' : sport === 'hockey' ? 'goals' : 'units'} (${varianceNum > 0 ? 'above' : 'below'} expected)`,
      confidence: Math.min(0.9, 0.6 + Math.abs(varianceNum) / 50)
    })
  }
  
  // Divisional Games Analysis (if we have division data)
  const divisionalGames = gamesData.filter(game => 
    game.home_team?.division && game.away_team?.division &&
    game.home_team.division === game.away_team.division
  )
  
  if (divisionalGames.length > 0) {
    const homeWins = divisionalGames.filter(game => game.home_score > game.away_score).length
    const homeWinRate = homeWins / divisionalGames.length
    const expectedHomeWinRate = 0.5
    const divisionalPerformance = ((homeWinRate - expectedHomeWinRate) * 100).toFixed(1)
    const divisionalPerformanceNum = parseFloat(divisionalPerformance)
    
    trends.push({
      category: "Divisional Games",
      trend: Math.abs(divisionalPerformanceNum) < 5 ? "neutral" : divisionalPerformanceNum > 0 ? "up" : "down",
      value: `${divisionalPerformanceNum > 0 ? '+' : ''}${divisionalPerformance}%`,
      description: `Divisional games showing ${Math.abs(divisionalPerformanceNum)}% ${divisionalPerformanceNum > 0 ? 'above' : 'below'} expected performance`,
      confidence: Math.min(0.9, 0.6 + Math.abs(divisionalPerformanceNum) / 20)
    })
  }
  
  // Rest Advantage Analysis - only include if we have actual rest data
  // This would require additional data from the database
  // For now, we'll skip this analysis until rest data is available
  
  return trends
}

function calculateExpectedTotal(sport: string, totalScores: number[]) {
  // Calculate expected total based on historical data
  if (totalScores.length === 0) {
    // Fallback values if no data available
    const fallbackTotals = {
      basketball: 220,
      football: 45,
      baseball: 8.5,
      hockey: 5.5,
      soccer: 2.5,
      tennis: 20,
      golf: 70
    }
    return fallbackTotals[sport as keyof typeof fallbackTotals] || 220
  }
  
  // Use historical average as expected total
  return totalScores.reduce((a, b) => a + b, 0) / totalScores.length
}

function calculateTrendStats(gamesData: any[]) {
  const totalGames = gamesData.length
  
  // Calculate actual profitable trends based on home performance
  const homeGames = gamesData.filter(game => game.home_score && game.away_score)
  let profitableTrends = 0
  let totalEdge = 0
  
  if (homeGames.length > 0) {
    const homeWins = homeGames.filter(game => game.home_score > game.away_score).length
    const homeWinRate = homeWins / homeGames.length
    const expectedHomeWinRate = 0.5
    const homeEdge = Math.abs(homeWinRate - expectedHomeWinRate) * 100
    
    // Count as profitable if home teams are performing significantly different from expected
    if (homeEdge > 5) {
      profitableTrends = Math.round(homeEdge)
    }
    
    totalEdge = homeEdge
  }
  
  return {
    profitableTrends: Math.min(100, profitableTrends), // Cap at 100%
    averageEdge: totalEdge > 0 ? `+${totalEdge.toFixed(1)}%` : "±0%",
    gamesAnalyzed: totalGames
  }
}
