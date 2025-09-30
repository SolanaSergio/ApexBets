/**
 * DATABASE-FIRST TEAMS API
 * Serves data exclusively from database - no external API calls during user requests
 * Background sync service handles external API updates
 */

import { NextRequest, NextResponse } from 'next/server'
import { databaseFirstApiClient } from '@/lib/services/api/database-first-api-client'
import { structuredLogger } from '@/lib/services/structured-logger'
import { getCache, setCache } from '@/lib/redis'


const CACHE_TTL = 60 // 1 minute cache

// Explicitly set runtime to suppress warnings
export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sport = searchParams.get("sport") || "all"
    const league = searchParams.get("league")
    const limitRaw = Number.parseInt(searchParams.get("limit") || "100")
    const limit = Math.max(1, Math.min(1000, Number.isFinite(limitRaw) ? limitRaw : 100))

    // Check cache first
    const cacheKey = `teams-${sport}-${league || 'all'}-${limit}`
    const cached = await getCache(cacheKey)
    if (cached) {
      return NextResponse.json(cached)
    }

    // Use database-first API client - no external API calls
    const result = await databaseFirstApiClient.getTeams({
      sport,
      ...(league && { league }),
      limit
    })

    // Cache the result
    await setCache(cacheKey, result, CACHE_TTL)

    // Reduce logging frequency
    // structuredLogger.info('Teams API request processed', {
    //   sport,
    //   league,
    //   count: result.data.length,
    //   source: result.meta.source
    // })

    return NextResponse.json(result)

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
