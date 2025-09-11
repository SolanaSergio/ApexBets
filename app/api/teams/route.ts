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
        // Get NBA teams from BallDontLie
        if (sport === 'basketball') {
          const { ballDontLieClient } = await import("@/lib/sports-apis/balldontlie-client")
          const nbaTeams = await ballDontLieClient.getTeams()
          teams.push(...nbaTeams.data.map((team: any) => ({
            id: team.id.toString(),
            name: team.full_name,
            city: team.city,
            league: 'NBA',
            sport: 'basketball',
            abbreviation: team.abbreviation,
            logo_url: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })))
        }
        
        // Add other sports teams as needed
        // For now, return NBA teams for basketball
        if (sport !== 'basketball') {
          // Return empty array for other sports until we implement their APIs
          return NextResponse.json({
            data: [],
            meta: {
              fromCache: false,
              responseTime: 0,
              source: "external_apis",
              note: `No external API implemented for ${sport} teams yet`
            }
          })
        }
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
        league: teamData.league || 'NBA',
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