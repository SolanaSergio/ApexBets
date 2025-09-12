import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { SportAnalyticsService } from "@/lib/services/analytics/sport-analytics-service"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sport = searchParams.get("sport")
    const league = searchParams.get("league")
    const useExternalApi = searchParams.get("external") === "true"
    
    // Fallback to Supabase for basic stats
    const supabase = await createClient()

    if (!supabase) {
      return NextResponse.json({ error: "Database connection failed" }, { status: 500 })
    }

    // If no sport is provided, return aggregated stats for all sports
    if (!sport) {
      // Get counts for all sports
      const { count: totalGames } = await supabase.from("games").select("*", { count: "exact", head: true })
      const { count: totalPredictions } = await supabase.from("predictions").select("*", { count: "exact", head: true })
      const { count: totalTeams } = await supabase.from("teams").select("*", { count: "exact", head: true })

      // Get overall accuracy
      const { data: accuracyData } = await supabase
        .from("predictions")
        .select("prediction_type, is_correct")
        .not("is_correct", "is", null)
      
      let overallAccuracy = 0
      if (accuracyData && accuracyData.length > 0) {
        const correct = accuracyData.filter(p => p.is_correct).length
        overallAccuracy = correct / accuracyData.length
      }

      return NextResponse.json({
        data: {
          total_games: totalGames || 0,
          total_predictions: totalPredictions || 0,
          total_teams: totalTeams || 0,
          accuracy_rate: overallAccuracy,
          recent_predictions: totalPredictions || 0,
          recent_performance: {
            accuracy_by_type: {},
            daily_stats: []
          }
        },
        meta: {
          fromCache: false,
          responseTime: 0,
          source: "supabase",
          sport: "all",
          league: "all"
        }
      })
    }
    
    // Use external analytics service if requested
    if (useExternalApi) {
      try {
        const analyticsService = new SportAnalyticsService(sport as any, league || undefined)
        const analyticsData = await analyticsService.getSportAnalytics()
        return NextResponse.json({
          data: analyticsData,
          meta: {
            fromCache: false,
            responseTime: 0,
            source: "analytics_service",
            sport,
            league: league || "default"
          }
        })
      } catch (error) {
        console.error('Analytics service error:', error)
        return NextResponse.json({ error: "Analytics service unavailable" }, { status: 503 })
      }
    }

    // Build sport-specific queries
    let gamesQuery = supabase.from("games").select("*", { count: "exact", head: true })
    let predictionsQuery = supabase.from("predictions").select("*", { count: "exact", head: true })
    let teamsQuery = supabase.from("teams").select("*", { count: "exact", head: true })

    // Filter by sport if provided
    if (sport) {
      gamesQuery = gamesQuery.eq("sport", sport)
      predictionsQuery = predictionsQuery.eq("sport", sport)
      teamsQuery = teamsQuery.eq("sport", sport)
    }

    // Filter by league if provided
    if (league) {
      gamesQuery = gamesQuery.eq("league", league)
      predictionsQuery = predictionsQuery.eq("league", league)
      teamsQuery = teamsQuery.eq("league", league)
    }

    // Get total games
    const { count: totalGames } = await gamesQuery

    // Get total predictions
    const { count: totalPredictions } = await predictionsQuery

    // Get total teams
    const { count: totalTeams } = await teamsQuery

    // Get accuracy statistics
    let accuracyQuery = supabase
      .from("predictions")
      .select("prediction_type, is_correct")
      .not("is_correct", "is", null)
    
    if (sport) {
      accuracyQuery = accuracyQuery.eq("sport", sport)
    }
    if (league) {
      accuracyQuery = accuracyQuery.eq("league", league)
    }
    
    const { data: accuracyData } = await accuracyQuery

    // Calculate accuracy by type
    const accuracyByType: Record<string, number> = {}
    let totalCorrect = 0
    let totalWithResults = 0

    if (accuracyData) {
      const typeStats: Record<string, { correct: number; total: number }> = {}

      accuracyData.forEach((pred) => {
        if (!typeStats[pred.prediction_type]) {
          typeStats[pred.prediction_type] = { correct: 0, total: 0 }
        }
        typeStats[pred.prediction_type].total++
        totalWithResults++

        if (pred.is_correct) {
          typeStats[pred.prediction_type].correct++
          totalCorrect++
        }
      })

      Object.entries(typeStats).forEach(([type, stats]) => {
        accuracyByType[type] = stats.total > 0 ? stats.correct / stats.total : 0
      })
    }

    const overallAccuracy = totalWithResults > 0 ? totalCorrect / totalWithResults : 0

    // Get recent performance (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    let recentPredictionsQuery = supabase
      .from("predictions")
      .select("created_at, is_correct")
      .gte("created_at", thirtyDaysAgo.toISOString())
      .not("is_correct", "is", null)
    
    if (sport) {
      recentPredictionsQuery = recentPredictionsQuery.eq("sport", sport)
    }
    if (league) {
      recentPredictionsQuery = recentPredictionsQuery.eq("league", league)
    }
    
    const { data: recentPredictions } = await recentPredictionsQuery

    // Group by date
    const dailyStats: Record<string, { predictions_made: number; correct_predictions: number }> = {}

    if (recentPredictions) {
      recentPredictions.forEach((pred) => {
        const date = new Date(pred.created_at).toISOString().split("T")[0]
        if (!dailyStats[date]) {
          dailyStats[date] = { predictions_made: 0, correct_predictions: 0 }
        }
        dailyStats[date].predictions_made++
        if (pred.is_correct) {
          dailyStats[date].correct_predictions++
        }
      })
    }

    const dailyStatsArray = Object.entries(dailyStats)
      .map(([date, stats]) => ({
        date,
        ...stats,
      }))
      .sort((a, b) => b.date.localeCompare(a.date))

    // Calculate recent predictions (last 30 days)
    const recentPredictionsCount = dailyStatsArray.reduce((sum, day) => sum + day.predictions_made, 0)

    return NextResponse.json({
      data: {
        total_games: totalGames || 0,
        total_predictions: totalPredictions || 0,
        total_teams: totalTeams || 0,
        accuracy_rate: overallAccuracy,
        recent_predictions: recentPredictionsCount,
        recent_performance: {
          accuracy_by_type: accuracyByType,
          daily_stats: dailyStatsArray,
        },
      },
      meta: {
        fromCache: false,
        responseTime: 0,
        source: "supabase",
        sport: sport || "all",
        league: league || "all"
      }
    })
  } catch (error) {
    console.error("API Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
