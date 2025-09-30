import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(_request: NextRequest) {
  try {
    const supabase = await createClient()
    
    if (!supabase) {
      return NextResponse.json({ error: "Supabase client initialization failed" }, { status: 500 })
    }
    const { data: alerts, error } = await supabase
      .from("user_alerts")
      .select(`
        *,
        team:teams(id, name, abbreviation)
      `)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching alerts:", error)
      return NextResponse.json({ error: "Failed to fetch alerts" }, { status: 500 })
    }

    return NextResponse.json({ alerts: alerts || [] })
  } catch (error) {
    console.error("API Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    if (!supabase) {
      return NextResponse.json({ error: "Supabase client initialization failed" }, { status: 500 })
    }
    const body = await request.json()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: alert, error } = await supabase
      .from("user_alerts")
      .insert([{
        type: body.type,
        team_id: body.team_id || null,
        threshold: body.threshold || null,
        enabled: body.enabled ?? true,
        user_id: user.id
      }])
      .select(`
        *,
        team:teams(id, name, abbreviation)
      `)
      .single()

    if (error) {
      console.error("Error creating alert:", error)
      return NextResponse.json({ error: "Failed to create alert" }, { status: 500 })
    }

    return NextResponse.json({ alert })
  } catch (error) {
    console.error("API Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
