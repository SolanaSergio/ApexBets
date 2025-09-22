import { type NextRequest, NextResponse } from "next/server"
import { productionSupabaseClient } from "@/lib/supabase/production-client"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const externalAllowed = process.env.ALLOW_EXTERNAL_FETCH === 'true'
    const useExternalApi = externalAllowed && searchParams.get("external") === "true"
    
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
        const { normalizeTeamData, deduplicateTeams } = await import("@/lib/utils/data-utils")

        // Get teams for the specified sport
        const sportTeams = await cachedUnifiedApiClient.getTeams(sport as any, { limit: 100 })

        // Normalize and deduplicate with consistent IDs and no mock data
        const normalized = sportTeams
          .filter((t: any) => t)
          .map((t: any) => normalizeTeamData(t, sport as string))
        const uniqueTeams = deduplicateTeams(normalized)

        teams.push(...uniqueTeams)
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

    // Use production Supabase client for DB reads
    const league = searchParams.get("league") || undefined
    const sport = searchParams.get("sport")

    if (!sport) {
      return NextResponse.json({
        success: false,
        error: "Sport parameter is required"
      }, { status: 400 })
    }

    const teams = await productionSupabaseClient.getTeams(sport, league)

    return NextResponse.json({
      data: teams,
      meta: {
        fromCache: false,
        responseTime: 0,
        source: "database"
      }
    })
  } catch (error) {
    console.error("API Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    if (!body?.name || !body?.sport) {
      return NextResponse.json({ error: "Missing required fields: name, sport" }, { status: 400 })
    }

    // Persist via production Supabase client
    const teamData = {
      id: body.id || `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: body.name,
      sport: body.sport,
      league: body.league || 'default',
      abbreviation: body.abbreviation || '',
      city: body.city || '',
      logo_url: body.logo_url || null,
      conference: body.conference || null,
      division: body.division || null,
      country: body.country || null,
      is_active: body.is_active !== false,
      last_updated: new Date().toISOString()
    }

    const { data: inserted, error } = await productionSupabaseClient.supabase
      .from('teams')
      .upsert([teamData], { onConflict: 'id' })
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to store team: ${error.message}`)
    }

    return NextResponse.json({ success: true, data: inserted })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}