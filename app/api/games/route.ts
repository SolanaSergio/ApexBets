import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { enhancedApiClient } from "@/lib/services/enhanced-api-client"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const useExternalApi = searchParams.get("external") === "true"
    
    if (useExternalApi) {
      // Use enhanced API client for external data
      const sport = searchParams.get("sport") || "basketball"
      const status = searchParams.get("status") as "scheduled" | "live" | "finished" | undefined
      const date = searchParams.get("date")
      const teamId = searchParams.get("team_id")
      
      const response = await enhancedApiClient.getGames({
        sport,
        status,
        date,
        teamId,
        external: true
      })
      
      return NextResponse.json({
        data: response.data,
        meta: {
          fromCache: response.fromCache,
          responseTime: response.responseTime,
          rateLimitInfo: response.rateLimitInfo
        }
      })
    }

    // Fallback to Supabase for stored data
    const supabase = await createClient()
    const dateFrom = searchParams.get("date_from")
    const dateTo = searchParams.get("date_to")
    const status = searchParams.get("status")
    const teamId = searchParams.get("team_id")
    const limit = Number.parseInt(searchParams.get("limit") || "50")

    let query = supabase.from("games").select(`
        *,
        home_team:teams!games_home_team_id_fkey(id, name, abbreviation),
        away_team:teams!games_away_team_id_fkey(id, name, abbreviation)
      `)

    if (dateFrom) {
      query = query.gte("game_date", dateFrom)
    }

    if (dateTo) {
      query = query.lte("game_date", dateTo)
    }

    if (status) {
      query = query.eq("status", status)
    }

    if (teamId) {
      query = query.or(`home_team_id.eq.${teamId},away_team_id.eq.${teamId}`)
    }

    const { data: games, error } = await query.order("game_date", { ascending: false }).limit(limit)

    if (error) {
      console.error("Error fetching games:", error)
      return NextResponse.json({ error: "Failed to fetch games" }, { status: 500 })
    }

    return NextResponse.json({
      data: games,
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
