import { NextRequest, NextResponse } from "next/server"
import { serviceFactory, SupportedSport } from "@/lib/services/core/service-factory"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sport = searchParams.get("sport") || "basketball"
    const league = searchParams.get("league") || "NBA"
    const team = searchParams.get("team") || ""
    const search = searchParams.get("search") || ""
    const limit = parseInt(searchParams.get("limit") || "50")

    // Validate sport
    if (!serviceFactory.isSportSupported(sport as SupportedSport)) {
      return NextResponse.json(
        { error: `Unsupported sport: ${sport}` },
        { status: 400 }
      )
    }

    // Get the appropriate service for the sport
    const service = serviceFactory.getService(sport as SupportedSport, league)
    
    // Get players using the service
    const players = await service.getPlayers({
      teamId: team || undefined,
      search: search || undefined
    })

    // Apply limit
    const limitedPlayers = players.slice(0, limit)

    // Return the players data from the service
    return NextResponse.json({
      success: true,
      data: limitedPlayers,
      meta: {
        total: players.length,
        returned: limitedPlayers.length,
        limit,
        sport,
        league,
        team: team || null,
        search: search || null
      },
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error("Players API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
