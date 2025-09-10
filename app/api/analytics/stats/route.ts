import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { analyticsService } from "@/lib/services/analytics-service"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const useExternalApi = searchParams.get("external") === "true"
    
    if (useExternalApi) {
      // Use enhanced analytics service
      try {
        const overview = await analyticsService.getAnalyticsOverview()
        const performance = await analyticsService.getPerformanceMetrics()
        const predictionAccuracy = await analyticsService.getPredictionAccuracy()
        const valueBettingStats = await analyticsService.getValueBettingStats()
        
        return NextResponse.json({
          data: {
            overview,
            performance,
            predictionAccuracy,
            valueBettingStats
          },
          meta: {
            fromCache: false,
            responseTime: 0,
            source: "analytics_service"
          }
        })
      } catch (error) {
        console.error("Analytics service error:", error)
        return NextResponse.json({
          data: null,
          meta: {
            fromCache: false,
            responseTime: 0,
            source: "analytics_service",
            error: "Analytics service unavailable"
          }
        })
      }
    }

    // Fallback to Supabase for basic stats
    const supabase = await createClient()

    // Get total games
    const { count: totalGames } = await supabase.from("games").select("*", { count: "exact", head: true })

    // Get total predictions
    const { count: totalPredictions } = await supabase.from("predictions").select("*", { count: "exact", head: true })

    // Get total teams
    const { count: totalTeams } = await supabase.from("teams").select("*", { count: "exact", head: true })

    // Get accuracy statistics
    const { data: accuracyData } = await supabase
      .from("predictions")
      .select("prediction_type, is_correct")
      .not("is_correct", "is", null)

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

    const { data: recentPredictions } = await supabase
      .from("predictions")
      .select("created_at, is_correct")
      .gte("created_at", thirtyDaysAgo.toISOString())
      .not("is_correct", "is", null)

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

    return NextResponse.json({
      data: {
        total_games: totalGames || 0,
        total_predictions: totalPredictions || 0,
        total_teams: totalTeams || 0,
        accuracy_rate: overallAccuracy,
        recent_performance: {
          accuracy_by_type: accuracyByType,
          daily_stats: dailyStatsArray,
        },
      },
      meta: {
        fromCache: false,
        responseTime: 0,
        source: "supabase"
      }
    })
  } catch (error) {
    console.error("API Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
