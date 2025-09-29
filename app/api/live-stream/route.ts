import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// Explicitly set runtime to suppress warnings
export const runtime = 'edge'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sport = searchParams.get("sport") || "all"
    
    // Simplified response - return basic live data without streaming
    const supabase = await createClient()
    if (!supabase) {
      return NextResponse.json({
        success: false,
        error: "Database connection failed"
      }, { status: 500 })
    }

    // Get live games from database
    const { data: games, error } = await supabase
      .from('games')
      .select(`
        id,
        sport,
        home_team_name,
        away_team_name,
        home_team_score,
        away_team_score,
        status,
        game_date,
        last_updated
      `)
      .eq('sport', sport)
      .eq('status', 'live')
      .order('game_date', { ascending: false })
      .limit(20)

    if (error) {
      return NextResponse.json({
        success: false,
        error: "Failed to fetch live games"
      }, { status: 500 })
    }

    const responseData = {
      success: true,
      sport,
      data: games || [],
      count: games?.length || 0,
      timestamp: new Date().toISOString(),
      message: "Live stream data (simplified for performance)"
    }
    
    return NextResponse.json(responseData)
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: "Live stream service unavailable",
      message: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}

// Simplified POST endpoint
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    return NextResponse.json({
      success: true,
      message: "Live stream updates temporarily disabled for performance optimization",
      received: body
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: "Failed to process update"
    }, { status: 500 })
  }
}