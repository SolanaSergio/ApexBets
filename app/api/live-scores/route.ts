import { type NextRequest, NextResponse } from "next/server"
import { sportsDataService } from "@/lib/services/sports-data-service"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sport = searchParams.get("sport") || "basketball"

    const liveGames: any[] = []
    
    try {
      // Get live games from SportsDB
      const { sportsDBClient } = await import("@/lib/sports-apis/sportsdb-client")
      const liveEvents = await sportsDBClient.getLiveEvents(sport)
      liveGames.push(...liveEvents.map((event: any) => ({
        id: event.idEvent,
        homeTeam: event.strHomeTeam,
        awayTeam: event.strAwayTeam,
        date: event.dateEvent,
        time: event.strTime,
        status: event.strStatus,
        homeScore: event.intHomeScore ? parseInt(event.intHomeScore) : undefined,
        awayScore: event.intAwayScore ? parseInt(event.intAwayScore) : undefined,
        league: event.strLeague,
        sport: event.strSport,
        venue: event.strVenue
      })))
    } catch (error) {
      console.error('SportsDB live scores error:', error)
    }
    
    return NextResponse.json({
      data: liveGames,
      meta: {
        fromCache: false,
        responseTime: 0,
        source: "sportsdb",
        total: liveGames.length,
        lastUpdated: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error("API Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
