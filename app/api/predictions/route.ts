import { type NextRequest, NextResponse } from "next/server"
import { predictionService } from "@/lib/services/prediction-service"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const gameId = searchParams.get("game_id")
    const limit = Number.parseInt(searchParams.get("limit") || "10")
    
    if (gameId) {
      // Generate predictions for a specific game
      const prediction = await predictionService.generatePredictions(gameId)
      
      if (!prediction) {
        return NextResponse.json({ error: "Failed to generate predictions" }, { status: 500 })
      }

      return NextResponse.json(prediction)
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

      return NextResponse.json({ data: predictions })
    }
  } catch (error) {
    console.error("API Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}