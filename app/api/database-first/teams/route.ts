/**
 * DATABASE-FIRST TEAMS API
 * Serves data exclusively from database - no external API calls during user requests
 * Background sync service handles external API updates
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { structuredLogger } from '@/lib/services/structured-logger'
import { databaseCacheService } from '@/lib/services/database-cache-service'

const CACHE_TTL = 60 // 1 minute cache

// Explicitly set runtime to suppress warnings
export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sport = searchParams.get('sport') || 'all'
    const league = searchParams.get('league') || undefined
    const limitRaw = Number.parseInt(searchParams.get('limit') || '100')
    const limit = Math.max(1, Math.min(1000, Number.isFinite(limitRaw) ? limitRaw : 100))
    const requestId = crypto.randomUUID()

    // Check cache first
    const cacheKey = `teams-${sport}-${league || 'all'}-${limit}`
    const cached = await databaseCacheService.get(cacheKey)
    if (cached) {
      return NextResponse.json(cached)
    }

    structuredLogger.info('Querying teams from database', {
      service: 'teams-api',
      requestId,
      sport,
      league,
    })

    // Query teams directly from database
    const supabase = await createClient()
    let query = supabase
      .from('teams')
      .select('*')
      .order('name', { ascending: true })

    if (sport !== 'all') {
      query = query.eq('sport', sport)
    }
    if (league) {
      query = query.eq('league', league)
    }

    const { data: teams, error } = await query.limit(limit)

    if (error) {
      structuredLogger.error('Database query failed', {
        service: 'teams-api',
        requestId,
        error: error.message,
      })
      return NextResponse.json(
        {
          success: false,
          error: 'Database query failed',
          details: error.message,
          requestId,
        },
        { status: 500 }
      )
    }

    const result = {
      success: true,
      data: teams || [],
      meta: {
        source: 'database',
        count: teams?.length || 0,
        sport,
        league: league || 'all',
        limit,
        refreshed: true,
        timestamp: new Date().toISOString(),
      },
    }

    // Cache the result
    await databaseCacheService.set(cacheKey, result, CACHE_TTL)

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
      error: error instanceof Error ? error.message : String(error),
    })

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch teams',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
