import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)

    const league = searchParams.get("league")
    const sport = searchParams.get("sport")

    let query = supabase.from("teams").select("*")

    if (league) {
      query = query.eq("league", league)
    }

    if (sport) {
      query = query.eq("sport", sport)
    }

    const { data: teams, error } = await query.order("name")

    if (error) {
      console.error("Error fetching teams:", error)
      return NextResponse.json({ error: "Failed to fetch teams" }, { status: 500 })
    }

    return NextResponse.json(teams)
  } catch (error) {
    console.error("API Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
