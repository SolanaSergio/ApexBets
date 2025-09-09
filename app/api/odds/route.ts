import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { enhancedApiClient } from "@/lib/services/enhanced-api-client"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const useExternalApi = searchParams.get("external") === "true"
    
    if (useExternalApi) {
      // Use enhanced API client for external data
      const sport = searchParams.get("sport") || "basketball_nba"
      const gameId = searchParams.get("game_id")
      const markets = searchParams.get("markets")?.split(",") || ["h2h", "spreads", "totals"]
      
      const response = await enhancedApiClient.getOdds({
        sport,
        gameId,
        markets,
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
    const gameId = searchParams.get("game_id")
    const source = searchParams.get("source")
    const limit = Number.parseInt(searchParams.get("limit") || "100")

    let query = supabase.from("odds").select("*")

    if (gameId) {
      query = query.eq("game_id", gameId)
    }

    if (source) {
      query = query.eq("source", source)
    }

    const { data: odds, error } = await query.order("timestamp", { ascending: false }).limit(limit)

    if (error) {
      console.error("Error fetching odds:", error)
      return NextResponse.json({ error: "Failed to fetch odds" }, { status: 500 })
    }

    return NextResponse.json({
      data: odds,
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
