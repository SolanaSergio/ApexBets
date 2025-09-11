import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const useExternalApi = searchParams.get("external") === "true"
    
    if (useExternalApi) {
      // Use external APIs for real-time team data
      const sport = searchParams.get("sport")
      
      if (!sport) {
        return NextResponse.json({
          success: false,
          error: "Sport parameter is required"
        }, { status: 400 })
      }
      const teams: any[] = []
      
      try {
        // Use the unified API client for all sports
        const { cachedUnifiedApiClient } = await import("@/lib/services/api/cached-unified-api-client")
        
        // Get teams for the specified sport
        const sportTeams = await cachedUnifiedApiClient.getTeams(sport as any, { limit: 100 })
        
        teams.push(...sportTeams.map((team: any) => ({
          id: team.id?.toString() || team.teamId?.toString() || Math.random().toString(),
          name: team.name || team.full_name || team.teamName,
          city: team.city || team.homeTeam || '',
          league: team.league || 'Unknown',
          sport: sport,
          abbreviation: team.abbreviation || team.abbr || team.teamAbbreviation || '',
          logo_url: team.logo_url || team.logoUrl || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })))
      } catch (error) {
        console.error('External API error:', error)
        // Fall through to database fallback
      }
      
      return NextResponse.json({
        data: teams,
        meta: {
          fromCache: false,
          responseTime: 0,
          source: "external_apis"
        }
      })
    }

    // Fallback to Supabase for stored data
    const supabase = await createClient()
    const league = searchParams.get("league")
    const sport = searchParams.get("sport")

    if (!supabase) {
      return NextResponse.json({ error: "Database connection failed" }, { status: 500 })
    }

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

    return NextResponse.json({
      data: teams,
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

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    if (!supabase) {
      return NextResponse.json({ error: "Database connection failed" }, { status: 500 })
    }
    
    const teamData = await request.json()

    // Validate required fields
    if (!teamData.name || !teamData.sport) {
      return NextResponse.json({ error: "Missing required fields: name, sport" }, { status: 400 })
    }

    const { data: team, error } = await supabase
      .from("teams")
      .insert([{
        name: teamData.name,
        city: teamData.city || teamData.homeTeam || '',
        league: teamData.league || 'Unknown',
        sport: teamData.sport,
        abbreviation: teamData.abbreviation || teamData.abbr || '',
        logo_url: teamData.logo_url || null
      }])
      .select()
      .single()

    if (error) {
      console.error("Error inserting team:", error)
      return NextResponse.json({ error: "Failed to insert team" }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: team })
  } catch (error) {
    console.error("API Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}