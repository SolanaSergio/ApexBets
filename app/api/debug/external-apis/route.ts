import { NextRequest, NextResponse } from "next/server"
import { sportsDataService } from "@/lib/services/sports-data-service"
import { oddsApiClient } from "@/lib/sports-apis/odds-api-client"
import { sportsDBClient } from "@/lib/sports-apis/sportsdb-client"

export async function GET(request: NextRequest) {
  try {
    const results: any = {}
    
    // Test SportsDB (should work with free key)
    try {
      const sportsDBEvents = await sportsDBClient.getEventsByDate(
        new Date().toISOString().split('T')[0],
        'basketball'
      )
      results.sportsdb = {
        status: 'success',
        data: sportsDBEvents.slice(0, 3), // First 3 events
        count: sportsDBEvents.length
      }
    } catch (error) {
      results.sportsdb = {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
    
    // Test Odds API (requires API key)
    try {
      const oddsData = await oddsApiClient.getOdds({
        sport: 'basketball_nba',
        markets: 'h2h'
      })
      results.odds = {
        status: 'success',
        data: oddsData.slice(0, 2), // First 2 events
        count: oddsData.length
      }
    } catch (error) {
      results.odds = {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
    
    // Test Sports Data Service
    try {
      const games = await sportsDataService.getGames({ sport: 'basketball' })
      results.sportsDataService = {
        status: 'success',
        data: games.slice(0, 3), // First 3 games
        count: games.length
      }
    } catch (error) {
      results.sportsDataService = {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
    
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      results
    })
  } catch (error) {
    console.error("Debug API Error:", error)
    return NextResponse.json({
      error: "Debug API failed",
      message: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}
