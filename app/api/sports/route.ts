import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = await createClient()
    
    if (!supabase) {
      return NextResponse.json({ error: "Database connection failed" }, { status: 500 })
    }

    const { data: sports, error } = await supabase
      .from("sports")
      .select(`
        name,
        display_name,
        icon,
        color,
        is_active,
        data_source,
        api_key,
        player_stats_table,
        positions,
        scoring_fields,
        betting_markets,
        season_config,
        rate_limits,
        update_frequency
      `)
      .eq("is_active", true)
      .order("name")

    if (error) {
      console.error("Error fetching sports:", error)
      return NextResponse.json({ error: "Failed to fetch sports" }, { status: 500 })
    }

    return NextResponse.json({
      data: sports || [],
      meta: {
        fromCache: false,
        responseTime: 0,
        source: "supabase"
      }
    })
  } catch (error) {
    console.error("API Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}