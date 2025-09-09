import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)

    const gameId = searchParams.get("game_id")
    const predictionType = searchParams.get("prediction_type")
    const modelName = searchParams.get("model_name")
    const limit = Number.parseInt(searchParams.get("limit") || "100")

    let query = supabase.from("predictions").select("*")

    if (gameId) {
      query = query.eq("game_id", gameId)
    }

    if (predictionType) {
      query = query.eq("prediction_type", predictionType)
    }

    if (modelName) {
      query = query.eq("model_name", modelName)
    }

    const { data: predictions, error } = await query.order("created_at", { ascending: false }).limit(limit)

    if (error) {
      console.error("Error fetching predictions:", error)
      return NextResponse.json({ error: "Failed to fetch predictions" }, { status: 500 })
    }

    return NextResponse.json(predictions)
  } catch (error) {
    console.error("API Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
