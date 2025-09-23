/**
 * DATABASE-FIRST TEAMS API
 * Always checks database first, only uses external APIs when database is stale/empty
 */

import { NextRequest, NextResponse } from 'next/server'
import { productionSupabaseClient } from '@/lib/supabase/production-client'
import { cachedUnifiedApiClient } from '@/lib/services/api/cached-unified-api-client'
import { structuredLogger } from '@/lib/services/structured-logger'
import { staleDataDetector } from '@/lib/services/stale-data-detector'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sport = searchParams.get("sport")
    const league = searchParams.get("league")
    const forceRefresh = searchParams.get("forceRefresh") === "true"

    if (!sport) {
      return NextResponse.json({
        success: false,
        error: "Sport parameter is required"
      }, { status: 400 })
    }

    // STEP 1: Check database first
    let teams = await productionSupabaseClient.getTeams(sport, league || undefined)
    let dataSource = 'database'
    let needsRefresh = false

    // STEP 2: Check if data is stale or empty using centralized detector
    if (forceRefresh) {
      needsRefresh = true
      structuredLogger.info('Force refresh requested', {
        sport,
        league,
        teamCount: teams.length
      })
    } else {
      const freshnessResult = await staleDataDetector.checkDataFreshness(
        'teams',
        teams,
        sport || undefined,
        { league }
      )

      if (freshnessResult.needsRefresh) {
        needsRefresh = true
        structuredLogger.info('Database data needs refresh', {
          sport,
          league,
          reason: freshnessResult.reason,
          dataAgeMinutes: Math.round(freshnessResult.dataAge / 60000),
          maxAgeMinutes: Math.round(freshnessResult.maxAge / 60000)
        })
      }
    }

    // STEP 3: Fetch from external API if needed
    if (needsRefresh) {
      try {
        const externalTeams = await cachedUnifiedApiClient.getTeams(sport as any, { 
          limit: 100,
          ...(league && { league })
        })

        if (externalTeams && externalTeams.length > 0) {
          // Update database with fresh data
          await updateDatabaseWithExternalData(sport, externalTeams)
          
          // Get updated data from database
          teams = await productionSupabaseClient.getTeams(sport, league ?? undefined)
          dataSource = 'external_api_refreshed'
          
          structuredLogger.info('Successfully refreshed data from external API', {
            sport,
            league,
            teamCount: teams.length
          })
        } else {
          structuredLogger.warn('External API returned no data, using database fallback', {
            sport,
            league
          })
          dataSource = 'database_fallback'
        }
      } catch (error) {
        structuredLogger.error('Failed to fetch from external API, using database fallback', {
          sport,
          league,
          error: error instanceof Error ? error.message : String(error)
        })
        dataSource = 'database_fallback'
      }
    }

    return NextResponse.json({
      success: true,
      data: teams,
      meta: {
        source: dataSource,
        count: teams.length,
        sport,
        league,
        refreshed: needsRefresh,
        timestamp: new Date().toISOString()
      }
    })

  } catch (error) {
    structuredLogger.error('Database-first teams API error', {
      error: error instanceof Error ? error.message : String(error)
    })
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch teams',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * Update database with external API data
 */
async function updateDatabaseWithExternalData(sport: string, externalTeams: any[]): Promise<void> {
  try {
    // Get existing teams to avoid duplicates
    const existingTeams = await productionSupabaseClient.getTeams(sport)
    const existingTeamMap = new Map(existingTeams.map((t: any) => [t.name, t]))

    const teamsToUpsert = externalTeams.map(externalTeam => {
      const existingTeam = existingTeamMap.get(externalTeam.name)
      
      return {
        id: (existingTeam as any)?.id || `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: externalTeam.name,
        sport: sport,
        league: externalTeam.league || 'default',
        abbreviation: externalTeam.abbreviation || '',
        city: externalTeam.city || '',
        logo_url: externalTeam.logo_url || null,
        conference: externalTeam.conference || null,
        division: externalTeam.division || null,
        country: externalTeam.country || null,
        is_active: true,
        last_updated: new Date().toISOString()
      }
    })

    // Upsert teams
    await productionSupabaseClient.supabase
      .from('teams')
      .upsert(teamsToUpsert, { onConflict: 'id' })

    structuredLogger.info('Successfully updated database with external data', {
      sport,
      teamCount: teamsToUpsert.length
    })

  } catch (error) {
    structuredLogger.error('Failed to update database with external data', {
      sport,
      error: error instanceof Error ? error.message : String(error)
    })
    throw error
  }
}
