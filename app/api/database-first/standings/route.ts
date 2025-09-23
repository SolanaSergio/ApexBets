/**
 * DATABASE-FIRST STANDINGS API
 * Always checks database first, only uses external APIs when database is stale/empty
 */

import { NextRequest, NextResponse } from 'next/server'
import { productionSupabaseClient } from '@/lib/supabase/production-client'
import { cachedUnifiedApiClient } from '@/lib/services/api/cached-unified-api-client'
import { structuredLogger } from '@/lib/services/structured-logger'
import crypto from 'crypto'
// Removed stale-data-detector import - service was deleted as unnecessary

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

    // STEP 2: Check if data is stale or empty using centralized detector
    if (forceRefresh) {
      needsRefresh = true
      structuredLogger.info('Force refresh requested', {
        sport,
        league,
        season,
        standingsCount: standings.length
      })
    } else {
      // Simple check: if no standings data, needs refresh
      if (standings.length === 0) {
        needsRefresh = true
        structuredLogger.info('Database data needs refresh - no standings found', {
          sport,
          league,
          season
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
          await updateDatabaseWithExternalData(
            sport,
            externalStandings,
            {
              ...(league && { league }),
              ...(season && { season })
            }
          )
          
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
async function updateDatabaseWithExternalData(
  sport: string,
  externalStandings: any[],
  options: { league?: string; season?: string } = {}
): Promise<void> {
  try {
    // Get existing standings to avoid duplicates
    const existingStandings = await productionSupabaseClient.getStandings(sport)
    const existingStandingMap = new Map(existingStandings.map((s: any) => [s.team?.name || s.team_name, s]))

    // Get teams to resolve team IDs
    const teams = await productionSupabaseClient.getTeams(sport)
    const teamMap = new Map(teams.map((team: any) => [team.name, team.id]))

    const normalized = externalStandings
      .map(externalStanding => {
        const teamName: string | undefined = externalStanding.teamName || externalStanding.team?.name || externalStanding.name
        if (!teamName) {
          return null
        }

        const existingStanding = existingStandingMap.get(teamName)
        const teamId = teamMap.get(teamName) || externalStanding.teamId || null

        const leagueValue: string | undefined = externalStanding.league || options.league
        const seasonValue: string | undefined = externalStanding.season || options.season || new Date().getFullYear().toString()

        if (!leagueValue || !seasonValue) {
          return null
        }

        const stableKey = `${sport}::${leagueValue}::${seasonValue}::${teamId || teamName}`
        const deterministicId = (existingStanding as any)?.id || crypto.createHash('sha1').update(stableKey).digest('hex').slice(0, 24)

        return {
          id: deterministicId,
          sport: sport,
          league: leagueValue,
          season: seasonValue,
          team_id: teamId,
          wins: Number(externalStanding.wins || 0),
          losses: Number(externalStanding.losses || 0),
          ties: Number(externalStanding.ties || 0),
          win_percentage: Number(externalStanding.winPercentage || 0),
          games_back: externalStanding.gamesBehind !== undefined ? Number(externalStanding.gamesBehind) : null,
          points_for: Number(externalStanding.pointsFor || 0),
          points_against: Number(externalStanding.pointsAgainst || 0),
          last_updated: new Date().toISOString()
        }
      })
      .filter((v): v is NonNullable<typeof v> => v !== null)

    if (normalized.length === 0) {
      structuredLogger.warn('No valid standings to upsert after normalization', { sport })
      return
    }

    const standingsToUpsert = normalized

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
