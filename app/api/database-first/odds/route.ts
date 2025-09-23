/**
 * DATABASE-FIRST ODDS API
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
    const gameId = searchParams.get("gameId")
    const source = searchParams.get("source")
    const limit = Number.parseInt(searchParams.get("limit") || "10")
    const forceRefresh = searchParams.get("forceRefresh") === "true"

    if (!sport) {
      return NextResponse.json({
        success: false,
        error: "Sport parameter is required"
      }, { status: 400 })
    }

    // STEP 1: Check database first
    let odds = await productionSupabaseClient.getOdds(sport, gameId || undefined, limit)
    let dataSource = 'database'
    let needsRefresh = false

    // Apply additional filters
    if (source) {
      odds = odds.filter((odd: any) => odd.source === source)
    }

    // STEP 2: Check if data is stale or empty using centralized detector
    if (forceRefresh) {
      needsRefresh = true
      structuredLogger.info('Force refresh requested', {
        sport,
        gameId,
        source,
        oddsCount: odds.length
      })
    } else {
      const freshnessResult = await staleDataDetector.checkDataFreshness(
        'odds',
        odds,
        sport || undefined,
        { gameId, source }
      )

      if (freshnessResult.needsRefresh) {
        needsRefresh = true
        structuredLogger.info('Database data needs refresh', {
          sport,
          gameId,
          source,
          reason: freshnessResult.reason,
          dataAgeMinutes: Math.round(freshnessResult.dataAge / 60000),
          maxAgeMinutes: Math.round(freshnessResult.maxAge / 60000)
        })
      }
    }

    // STEP 3: Fetch from external API if needed
    if (needsRefresh) {
      try {
        const externalOdds = await cachedUnifiedApiClient.getOdds(sport as any, { 
          limit: 100,
          ...(gameId && { gameId }),
          ...(source && { source })
        })

        if (externalOdds && externalOdds.length > 0) {
          // Update database with fresh data
          await updateDatabaseWithExternalData(sport, externalOdds)
          
          // Get updated data from database
          odds = await productionSupabaseClient.getOdds(sport, gameId || undefined, limit)
          
          // Apply filters again
          if (source) {
            odds = odds.filter((odd: any) => odd.source === source)
          }
          
          dataSource = 'external_api_refreshed'
          
          structuredLogger.info('Successfully refreshed data from external API', {
            sport,
            gameId,
            source,
            oddsCount: odds.length
          })
        } else {
          structuredLogger.warn('External API returned no data, using database fallback', {
            sport,
            gameId,
            source
          })
          dataSource = 'database_fallback'
        }
      } catch (error) {
        structuredLogger.error('Failed to fetch from external API, using database fallback', {
          sport,
          gameId,
          source,
          error: error instanceof Error ? error.message : String(error)
        })
        dataSource = 'database_fallback'
      }
    }

    return NextResponse.json({
      success: true,
      data: odds,
      meta: {
        source: dataSource,
        count: odds.length,
        sport,
        gameId,
        sourceFilter: source,
        refreshed: needsRefresh,
        timestamp: new Date().toISOString()
      }
    })

  } catch (error) {
    structuredLogger.error('Database-first odds API error', {
      error: error instanceof Error ? error.message : String(error)
    })
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch odds',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * Update database with external API data
 */
async function updateDatabaseWithExternalData(sport: string, externalOdds: any[]): Promise<void> {
  try {
    // Get existing odds to avoid duplicates
    const existingOdds = await productionSupabaseClient.getOdds(sport)
    const existingOddMap = new Map(existingOdds.map((o: any) => [o.id, o]))

    const oddsToUpsert = externalOdds.map(externalOdd => {
      const existingOdd = existingOddMap.get(externalOdd.id)
      
      return {
        id: (existingOdd as any)?.id || externalOdd.id || `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        sport: sport,
        game_id: externalOdd.gameId || null,
        bookmaker: externalOdd.bookmaker || '',
        market: externalOdd.market || '',
        outcome: externalOdd.outcome || '',
        price: externalOdd.price || 0,
        point: externalOdd.point || null,
        source: externalOdd.source || 'external',
        last_updated: new Date().toISOString()
      }
    })

    // Upsert odds
    await productionSupabaseClient.supabase
      .from('odds')
      .upsert(oddsToUpsert, { onConflict: 'id' })

    structuredLogger.info('Successfully updated database with external data', {
      sport,
      oddsCount: oddsToUpsert.length
    })

  } catch (error) {
    structuredLogger.error('Failed to update database with external data', {
      sport,
      error: error instanceof Error ? error.message : String(error)
    })
    throw error
  }
}
