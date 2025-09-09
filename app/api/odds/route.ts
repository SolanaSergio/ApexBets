import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)

    const gameId = searchParams.get("game_id")
    const source = searchParams.get("source")
    const limit = Number.parseInt(searchParams.get("limit") || "100")

    let query = supabase.from("odds").select("*")

    if (gameId) {
      query = query.eq("game_id", gameId)
    }

    if (source) {
      query = query.eq("source", source)
    }

    const { data: odds, error } = await query.order("timestamp", { ascending: false }).limit(limit)

    if (error) {
      console.error("Error fetching odds:", error)
      return NextResponse.json({ error: "Failed to fetch odds" }, { status: 500 })
    }

    return NextResponse.json(odds)
  } catch (error) {
    console.error("API Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
