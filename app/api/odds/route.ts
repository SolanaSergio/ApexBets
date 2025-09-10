import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { enhancedApiClient } from "@/lib/services/enhanced-api-client"
import { apiRateLimiter } from "@/lib/rules/api-rate-limiter"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const useExternalApi = searchParams.get("external") === "true"
    
    if (useExternalApi) {
      // Use direct API calls to avoid circular dependencies
      const sport = searchParams.get("sport") || "basketball_nba"
      const gameId = searchParams.get("game_id")
      const markets = searchParams.get("markets")?.split(",") || ["h2h", "spreads", "totals"]
      
      try {
        // Check rate limit before making request
        apiRateLimiter.checkRateLimit('odds')
        
        const { oddsApiClient } = await import("@/lib/sports-apis/odds-api-client")
        const oddsData = await oddsApiClient.getOdds({
          sport,
          markets: markets.join(','),
          regions: 'us',
          oddsFormat: 'american'
        })
        
        // Record successful request
        apiRateLimiter.recordRequest('odds')
        
        return NextResponse.json({
          data: oddsData,
          meta: {
            fromCache: false,
            responseTime: 0,
            source: "odds_api"
          }
        })
      } catch (error) {
        console.error('Odds API error:', error)
        return NextResponse.json({
          data: [],
          meta: {
            fromCache: false,
            responseTime: 0,
            source: "odds_api",
            error: error instanceof Error ? error.message : 'Unknown error'
          }
        })
      }
    }

    // Fallback to Supabase for stored data
    const supabase = await createClient()
    const gameId = searchParams.get("game_id")
    const source = searchParams.get("source")
    const sport = searchParams.get("sport")
    const limit = Number.parseInt(searchParams.get("limit") || "100")

    let query = supabase.from("odds").select("*")

    if (gameId) {
      query = query.eq("game_id", gameId)
    }

    if (source) {
      query = query.eq("source", source)
    }

    if (sport) {
      query = query.eq("sport", sport)
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
