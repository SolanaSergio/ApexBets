import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    if (!supabase) {
      return NextResponse.json({ error: "Database connection failed" }, { status: 500 })
    }

    // Get a sample game to see what columns exist
    const { data: games, error: gamesError } = await supabase
      .from('games')
      .select('*')
      .limit(1)

    if (gamesError) {
      return NextResponse.json({ 
        error: "Error fetching games", 
        details: gamesError 
      }, { status: 500 })
    }

    if (games && games.length > 0) {
      const game = games[0]
      const columns = Object.keys(game).map(key => ({
        name: key,
        type: typeof game[key],
        value: game[key],
        isNull: game[key] === null
      }))

      return NextResponse.json({
        success: true,
        table: 'games',
        columns: columns,
        totalColumns: columns.length
      })
    } else {
      return NextResponse.json({
        success: true,
        table: 'games',
        message: 'No games found in database',
        columns: []
      })
    }

  } catch (error) {
    console.error('Schema check error:', error)
    return NextResponse.json({ 
      error: "Internal server error", 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
