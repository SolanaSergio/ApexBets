import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)

    const gameId = searchParams.get("game_id")
    const sport = searchParams.get("sport")
    const model = searchParams.get("model")
    const limit = Number.parseInt(searchParams.get("limit") || "50")

    let query = supabase
      .from("predictions")
      .select(`
        *,
        game:games(
          id,
          home_team:teams!games_home_team_id_fkey(name, abbreviation),
          away_team:teams!games_away_team_id_fkey(name, abbreviation),
          game_date,
          status,
          home_score,
          away_score
        )
      `)

    if (gameId) {
      query = query.eq("game_id", gameId)
    }

    if (sport) {
      query = query.eq("sport", sport)
    }

    if (model) {
      query = query.eq("model", model)
    }

    const { data: predictions, error } = await query
      .order("created_at", { ascending: false })
      .limit(limit)

    if (error) {
      console.error("Error fetching predictions:", error)
      return NextResponse.json({ error: "Failed to fetch predictions" }, { status: 500 })
    }

    return NextResponse.json({
      data: predictions || [],
      meta: {
        fromCache: false,
        responseTime: 0,
        source: "supabase",
        total: predictions?.length || 0,
        game_id: gameId || 'all',
        sport: sport || 'all',
        model: model || 'all'
      }
    })
  } catch (error) {
    console.error("API Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const predictionData = await request.json()

    // Validate required fields
    if (!predictionData.game_id || !predictionData.predicted_winner) {
      return NextResponse.json({ 
        error: "Missing required fields: game_id, predicted_winner" 
      }, { status: 400 })
    }

    // Verify game exists
    const { data: game, error: gameError } = await supabase
      .from("games")
      .select("id, status")
      .eq("id", predictionData.game_id)
      .single()

    if (gameError || !game) {
      return NextResponse.json({ 
        error: "Game not found" 
      }, { status: 404 })
    }

    if (game.status === 'completed') {
      return NextResponse.json({ 
        error: "Cannot create prediction for completed game" 
      }, { status: 400 })
    }

    // Create prediction
    const { data: prediction, error } = await supabase
      .from("predictions")
      .insert([{
        game_id: predictionData.game_id,
        model: predictionData.model || 'default',
        predicted_winner: predictionData.predicted_winner,
        confidence: predictionData.confidence || 0.5,
        predicted_score: predictionData.predicted_score || null,
        predicted_spread: predictionData.predicted_spread || null,
        predicted_total: predictionData.predicted_total || null,
        reasoning: predictionData.reasoning || null,
        sport: predictionData.sport || 'basketball',
        league: predictionData.league || 'NBA',
        metadata: predictionData.metadata || null
      }])
      .select()
      .single()

    if (error) {
      console.error("Error creating prediction:", error)
      return NextResponse.json({ 
        error: "Failed to create prediction" 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      data: prediction 
    })
  } catch (error) {
    console.error("API Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}