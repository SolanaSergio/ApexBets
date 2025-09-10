import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
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
        data: [],
        meta: {
          fromCache: false,
          responseTime: 0,
          source: "supabase",
          error: "Database connection failed"
        }
      })
    }

    // Get predictions with results
    const { data: predictionsData, error: predictionsError } = await supabase
      .from("predictions")
      .select(`
        *,
        game:games(
          id,
          home_team:teams!games_home_team_id_fkey(name, abbreviation),
          away_team:teams!games_away_team_id_fkey(name, abbreviation),
          game_date,
          home_score,
          away_score,
          status
        )
      `)
      .gte("created_at", startDate.toISOString())
      .lte("created_at", endDate.toISOString())
      .not("is_correct", "is", null)

    if (predictionsError) {
      console.error("Error fetching predictions data:", predictionsError)
      return NextResponse.json({
        data: [],
        meta: {
          fromCache: false,
          responseTime: 0,
          source: "supabase",
          error: "Failed to fetch predictions data"
        }
      })
    }

    // Process predictions data into chart format
    const processedData = processAccuracyData(predictionsData || [], timeRange)
    
    return NextResponse.json({
      data: processedData,
      meta: {
        fromCache: false,
        responseTime: 0,
        source: "supabase",
        total: processedData.length
      }
    })
  } catch (error) {
    console.error("API Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

function processAccuracyData(predictionsData: any[], timeRange: string) {
  // Group predictions by date
  const groupedData: Record<string, any> = {}
  
  predictionsData.forEach(prediction => {
    if (!prediction.game) return
    
    const date = new Date(prediction.created_at).toISOString().split('T')[0]
    
    if (!groupedData[date]) {
      groupedData[date] = {
        date,
        gameWinner: { correct: 0, total: 0 },
        spread: { correct: 0, total: 0 },
        total: { correct: 0, total: 0 },
        overall: { correct: 0, total: 0 }
      }
    }
    
    // Count correct predictions by type
    if (prediction.prediction_type === 'winner') {
      groupedData[date].gameWinner.total++
      if (prediction.is_correct) {
        groupedData[date].gameWinner.correct++
      }
    } else if (prediction.prediction_type === 'spread') {
      groupedData[date].spread.total++
      if (prediction.is_correct) {
        groupedData[date].spread.correct++
      }
    } else if (prediction.prediction_type === 'total') {
      groupedData[date].total.total++
      if (prediction.is_correct) {
        groupedData[date].total.correct++
      }
    }
    
    // Overall accuracy
    groupedData[date].overall.total++
    if (prediction.is_correct) {
      groupedData[date].overall.correct++
    }
  })
  
  // Convert to percentage format
  const result = Object.values(groupedData).map((data: any) => ({
    date: data.date,
    gameWinner: data.gameWinner.total > 0 ? data.gameWinner.correct / data.gameWinner.total : 0,
    spread: data.spread.total > 0 ? data.spread.correct / data.spread.total : 0,
    total: data.total.total > 0 ? data.total.correct / data.total.total : 0,
    overall: data.overall.total > 0 ? data.overall.correct / data.overall.total : 0
  }))
  
  // Sort by date
  return result.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
}
