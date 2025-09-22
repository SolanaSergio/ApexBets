/**
 * DATABASE-FIRST STANDINGS API
 * Always checks database first, only uses external APIs when database is stale/empty
 */

import { NextRequest, NextResponse } from 'next/server'
import { productionSupabaseClient } from '@/lib/supabase/production-client'
import { cachedUnifiedApiClient } from '@/lib/services/api/cached-unified-api-client'
import { structuredLogger } from '@/lib/services/structured-logger'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const sport = searchParams.get("sport")
  const league = searchParams.get("league")
  const season = searchParams.get("season")
  const forceRefresh = searchParams.get("forceRefresh") === "true"

  try {
    if (!sport) {
      return NextResponse.json({
        success: false,
        error: "Sport parameter is required"
      }, { status: 400 })
    }

    // STEP 1: Check database first
    let standings = await productionSupabaseClient.getStandings(sport, league || undefined, season || undefined)
    let dataSource = 'database'
    let needsRefresh = false

    // STEP 2: Check if data is stale or empty
    if (standings.length === 0 || forceRefresh) {
      needsRefresh = true
      structuredLogger.info('Database data is stale or empty, fetching from external API', {
        sport,
        league,
        season,
        standingsCount: standings.length,
        forceRefresh
      })
    } else {
      // Check if data is stale (older than 1 hour for standings)
      const oldestStanding = standings.reduce((oldest: any, standing: any) => {
        const standingTime = new Date(standing.last_updated || standing.updated_at || 0).getTime()
        const oldestTime = new Date(oldest.last_updated || oldest.updated_at || 0).getTime()
        return standingTime < oldestTime ? standing : oldest
      })

      const dataAge = Date.now() - new Date(oldestStanding.last_updated || oldestStanding.updated_at || 0).getTime()
      const maxAge = 60 * 60 * 1000 // 1 hour for standings

      if (dataAge > maxAge) {
        needsRefresh = true
        structuredLogger.info('Database data is stale, refreshing from external API', {
          sport,
          league,
          season,
          dataAgeMinutes: Math.round(dataAge / 60000),
          maxAgeMinutes: Math.round(maxAge / 60000)
        })
      }
    }

    // STEP 3: Fetch from external API if needed
    if (needsRefresh) {
      try {
        const externalStandings = await cachedUnifiedApiClient.getStandings(sport as any, { 
          ...(league && { league }),
          ...(season && { season })
        })

        if (externalStandings && externalStandings.length > 0) {
          // Update database with fresh data
          await updateDatabaseWithExternalData(sport, externalStandings)
          
          // Get updated data from database
          standings = await productionSupabaseClient.getStandings(sport, league || undefined, season || undefined)
          dataSource = 'external_api_refreshed'
          
          structuredLogger.info('Successfully refreshed data from external API', {
            sport,
            league,
            season,
            standingsCount: standings.length
          })
        } else {
          structuredLogger.warn('External API returned no data, using database fallback', {
            sport,
            league,
            season
          })
          dataSource = 'database_fallback'
        }
      } catch (error) {
        structuredLogger.error('Failed to fetch from external API, using database fallback', {
          sport,
          league,
          season,
          error: error instanceof Error ? error.message : String(error)
        })
        dataSource = 'database_fallback'
      }
    }

    return NextResponse.json({
      success: true,
      data: standings,
      meta: {
        source: dataSource,
        count: standings.length,
        sport,
        league,
        season,
        refreshed: needsRefresh,
        timestamp: new Date().toISOString()
      }
    })

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    const errorStack = error instanceof Error ? error.stack : undefined
    
    structuredLogger.error('Database-first standings API error', {
      error: errorMessage,
      stack: errorStack,
      sport,
      league,
      season
    })
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch standings',
        details: errorMessage,
        sport,
        league,
        season
      },
      { status: 500 }
    )
  }
}

/**
 * Update database with external API data
 */
async function updateDatabaseWithExternalData(sport: string, externalStandings: any[]): Promise<void> {
  try {
    // Get existing standings to avoid duplicates
    const existingStandings = await productionSupabaseClient.getStandings(sport)
    const existingStandingMap = new Map(existingStandings.map((s: any) => [s.team?.name || s.team_name, s]))

    // Get teams to resolve team IDs
    const teams = await productionSupabaseClient.getTeams(sport)
    const teamMap = new Map(teams.map((team: any) => [team.name, team.id]))

    const standingsToUpsert = externalStandings.map(externalStanding => {
      const existingStanding = existingStandingMap.get(externalStanding.teamName)
      const teamId = teamMap.get(externalStanding.teamName) || externalStanding.teamId
      
      return {
        id: (existingStanding as any)?.id || `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        sport: sport,
        league: externalStanding.league || 'default',
        season: externalStanding.season || '2024-25',
        team_id: teamId || null,
        wins: externalStanding.wins || 0,
        losses: externalStanding.losses || 0,
        ties: externalStanding.ties || 0,
        win_percentage: externalStanding.winPercentage || 0,
        games_back: externalStanding.gamesBehind || 0,
        points_for: externalStanding.pointsFor || 0,
        points_against: externalStanding.pointsAgainst || 0,
        last_updated: new Date().toISOString()
      }
    })

    // Upsert standings
    await productionSupabaseClient.supabase
      .from('league_standings')
      .upsert(standingsToUpsert, { onConflict: 'id' })

    structuredLogger.info('Successfully updated database with external data', {
      sport,
      standingsCount: standingsToUpsert.length
    })

  } catch (error) {
    structuredLogger.error('Failed to update database with external data', {
      sport,
      error: error instanceof Error ? error.message : String(error)
    })
    throw error
  }
}
