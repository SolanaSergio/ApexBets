import { type NextRequest, NextResponse } from "next/server"
import { predictionService } from "@/lib/services/prediction-service"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const gameId = searchParams.get("game_id")
    const limit = Number.parseInt(searchParams.get("limit") || "10")
    
    if (gameId) {
      try {
        // Generate predictions for a specific game
        const prediction = await predictionService.generatePredictions(gameId)
        
        if (!prediction) {
          return NextResponse.json({
            data: null,
            meta: {
              fromCache: false,
              responseTime: 0,
              source: "prediction_service",
              error: "No prediction available for this game"
            }
          })
        }

        return NextResponse.json({
          data: prediction,
          meta: {
            fromCache: false,
            responseTime: 0,
            source: "prediction_service"
          }
        })
      } catch (error) {
        console.error("Prediction generation error:", error)
        return NextResponse.json({
          data: null,
          meta: {
            fromCache: false,
            responseTime: 0,
            source: "prediction_service",
            error: "Failed to generate prediction"
          }
        })
      }
    } else {
      // Return recent predictions without game_id
      const supabase = await createClient()
      
      const { data: predictions, error } = await supabase
        .from("predictions")
        .select(`
          *,
          game:games(
            id,
            home_team:teams!games_home_team_id_fkey(name, abbreviation),
            away_team:teams!games_away_team_id_fkey(name, abbreviation),
            game_date,
            status
          )
        `)
        .order("created_at", { ascending: false })
        .limit(limit)

      if (error) {
        console.error("Error fetching predictions:", error)
        return NextResponse.json({ error: "Failed to fetch predictions" }, { status: 500 })
      }

      return NextResponse.json({
        data: predictions,
        meta: {
          fromCache: false,
          responseTime: 0,
          source: "supabase"
        }
      })
    }
  } catch (error) {
    console.error("API Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const predictionData = await request.json()

    // Validate required fields
    if (!predictionData.game_id || !predictionData.predicted_winner) {
      return NextResponse.json({ error: "Missing required fields: game_id, predicted_winner" }, { status: 400 })
    }

    try {
      const supabase = await createClient()
      const { data: prediction, error } = await supabase
        .from("predictions")
        .insert([{
          game_id: predictionData.game_id,
          predicted_winner: predictionData.predicted_winner,
          confidence: predictionData.confidence || 0.5,
          prediction_type: predictionData.prediction_type || 'winner',
          reasoning: predictionData.reasoning || 'AI-generated prediction',
          status: predictionData.status || 'pending'
        }])
        .select()
        .single()

      if (error) {
        console.error("Error inserting prediction:", error)
        return NextResponse.json({ 
          success: false, 
          error: "Failed to create prediction",
          details: error.message 
        }, { status: 500 })
      }

      return NextResponse.json({ success: true, data: prediction })
    } catch (dbError) {
      console.error("Database error:", dbError)
      return NextResponse.json({ 
        success: false, 
        error: "Database unavailable",
        details: dbError.message 
      }, { status: 500 })
    }
  } catch (error) {
    console.error("API Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}