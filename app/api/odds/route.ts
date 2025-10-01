/**
 * ODDS API
 * Serves odds data exclusively from database - no external API calls during user requests
 * Background sync service handles external API updates
 */

import { NextRequest, NextResponse } from 'next/server'
import { databaseFirstApiClient } from '@/lib/services/api/database-first-api-client'
import { structuredLogger } from '@/lib/services/structured-logger'
import { databaseCacheService } from '@/lib/services/database-cache-service'

const CACHE_TTL = 60 // 1 minute

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sport = searchParams.get("sport") || "all"
    const gameId = searchParams.get("gameId")
    const source = searchParams.get("source")
    const limit = Number.parseInt(searchParams.get("limit") || "100")
    const liveOnly = searchParams.get("liveOnly") === "true"

    const cacheKey = `odds-${sport}-${gameId}-${source}-${limit}-${liveOnly}`
    const cached = await databaseCacheService.get(cacheKey)
    if (cached) {
      return NextResponse.json(cached)
    }

    // Use database-first API client - no external API calls
    const result = await databaseFirstApiClient.getOdds({
      sport,
      ...(gameId && { gameId }),
      ...(source && { source }),
      limit,
      liveOnly
    })

    structuredLogger.info('Odds API request processed', {
      sport,
      gameId,
      source,
      count: result.data.length,
      dataSource: result.meta.source
    })

    await databaseCacheService.set(cacheKey, result, CACHE_TTL)

    return NextResponse.json(result)

  } catch (error) {
    structuredLogger.error('Odds API error', {
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
