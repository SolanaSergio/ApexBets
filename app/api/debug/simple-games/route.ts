import { NextRequest, NextResponse } from "next/server"
import { sportsDBClient } from "@/lib/sports-apis/sportsdb-client"
import { ballDontLieClient } from "@/lib/sports-apis/balldontlie-client"

export async function GET(request: NextRequest) {
  try {
    const results: any = {}
    
    // Test SportsDB directly
    try {
      const events = await sportsDBClient.getEventsByDate(
        new Date().toISOString().split('T')[0],
        'basketball'
      )
      
      results.sportsdb = {
        status: 'success',
        count: events.length,
        sample: events.slice(0, 2)
      }
    } catch (error) {
      results.sportsdb = {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
    
    // Test BALLDONTLIE directly
    try {
      const nbaGames = await ballDontLieClient.getGames({
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date().toISOString().split('T')[0]
      })
      
      results.balldontlie = {
        status: 'success',
        count: nbaGames.data.length,
        sample: nbaGames.data.slice(0, 2)
      }
    } catch (error) {
      results.balldontlie = {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
    
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      results
    })
  } catch (error) {
    console.error("Simple Games API Error:", error)
    return NextResponse.json({
      error: "Simple Games API failed",
      message: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}
