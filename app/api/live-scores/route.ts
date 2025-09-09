import { type NextRequest, NextResponse } from "next/server"
import { sportsDataService } from "@/lib/services/sports-data-service"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sport = searchParams.get("sport") || "basketball"

    const liveGames = await sportsDataService.getLiveScores(sport)
    
    return NextResponse.json({
      games: liveGames,
      total: liveGames.length,
      lastUpdated: new Date().toISOString()
    })
  } catch (error) {
    console.error("API Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
