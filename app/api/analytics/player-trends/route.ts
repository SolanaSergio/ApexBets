import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { DynamicSportProcessor } from "@/lib/services/core/dynamic-sport-processor"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const playerId = searchParams.get("playerId")
    const playerName = searchParams.get("playerName")
    const teamId = searchParams.get("teamId")
    const sport = searchParams.get("sport")
    
    if (!sport) {
      return NextResponse.json({ error: "Sport parameter is required" }, { status: 400 })
    }

    // Initialize dynamic sport processor
    await DynamicSportProcessor.initialize("luehhafpitbluxvwxczl")
    
    // Validate sport configuration
    if (!DynamicSportProcessor.validateSportConfig(sport)) {
      return NextResponse.json({ 
        error: `Sport '${sport}' is not supported or not active` 
      }, { status: 400 })
    }

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

    // Get dynamic sport configuration
    const sportConfig = DynamicSportProcessor.getSportStatConfig(sport)
    const tableName = sportConfig.tableName
    const statsColumns = sportConfig.statFields

    // Build dynamic columns string
    const columnsString = Object.values(statsColumns).join(',\n      ')

    let query = supabase
      .from(tableName)
      .select(`
        ${columnsString},
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

    // Process player trends using dynamic processor
    const trends = DynamicSportProcessor.processPlayerTrends(playerStats || [], sport)
    
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
