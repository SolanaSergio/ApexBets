import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { sportsDataService } from "@/lib/services/sports-data-service"

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
        data: [],
        meta: {
          fromCache: false,
          responseTime: 0,
          source: "supabase",
          error: "Database connection failed"
        }
      })
    }

    // Get historical odds data
    const { data: oddsData, error: oddsError } = await supabase
      .from("odds")
      .select(`
        *,
        game:games(
          id,
          home_team:teams!games_home_team_id_fkey(name, abbreviation),
          away_team:teams!games_away_team_id_fkey(name, abbreviation),
          game_date,
          home_score,
          away_score
        )
      `)
      .gte("timestamp", startDate.toISOString())
      .lte("timestamp", endDate.toISOString())
      .order("timestamp", { ascending: true })

    if (oddsError) {
      console.error("Error fetching odds data:", oddsError)
      return NextResponse.json({
        data: [],
        meta: {
          fromCache: false,
          responseTime: 0,
          source: "supabase",
          error: "Failed to fetch odds data"
        }
      })
    }

    // Process odds data into chart format
    const processedData = processOddsData(oddsData || [], team)
    
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

function processOddsData(oddsData: any[], team: string) {
  // Group by date and calculate averages
  const groupedData: Record<string, any> = {}
  
  oddsData.forEach(odds => {
    if (!odds.game) return
    
    const date = new Date(odds.timestamp).toISOString().split('T')[0]
    const game = odds.game
    
    if (!groupedData[date]) {
      groupedData[date] = {
        date,
        avgOdds: 0,
        impliedProb: 0,
        actualWin: 0,
        value: 0,
        games: 0
      }
    }
    
    // Calculate implied probability from odds
    const americanOdds = odds.home_odds || odds.away_odds || -110
    const impliedProb = americanOdds > 0 
      ? 100 / (americanOdds + 100)
      : Math.abs(americanOdds) / (Math.abs(americanOdds) + 100)
    
    // Calculate actual win rate (simplified)
    const actualWin = game.home_score && game.away_score 
      ? (game.home_score > game.away_score ? 1 : 0)
      : 0.5
    
    // Calculate value
    const value = Math.max(0, actualWin - impliedProb)
    
    groupedData[date].avgOdds = (groupedData[date].avgOdds + americanOdds) / 2
    groupedData[date].impliedProb = (groupedData[date].impliedProb + impliedProb) / 2
    groupedData[date].actualWin = (groupedData[date].actualWin + actualWin) / 2
    groupedData[date].value = (groupedData[date].value + value) / 2
    groupedData[date].games += 1
  })
  
  return Object.values(groupedData).sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  )
}
