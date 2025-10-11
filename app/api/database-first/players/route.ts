import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { structuredLogger } from '@/lib/services/structured-logger'
import { databaseCacheService } from '@/lib/services/database-cache-service'

const CACHE_TTL = 60 * 5 // 5 minutes

export async function GET(request: NextRequest) {
  const requestId = crypto.randomUUID()

  try {
    structuredLogger.info('Database-first players API request received', {
      service: 'database-first-players-api',
      requestId,
      step: 'request-start',
    })

    const { searchParams } = new URL(request.url)
    const sport = searchParams.get('sport') || 'all'
    const teamId = searchParams.get('team_id') || undefined
    const limitRaw = Number.parseInt(searchParams.get('limit') || '100')
    const limit = Math.max(1, Math.min(1000, Number.isFinite(limitRaw) ? limitRaw : 100))

    structuredLogger.info('Database-first players API parameters parsed', {
      service: 'database-first-players-api',
      requestId,
      sport,
      teamId,
      limit,
    })

    const cacheKey = `database-first-players-${sport}-${teamId || 'all'}-${limit}`

    structuredLogger.info('Checking cache for database-first players', {
      service: 'database-first-players-api',
      requestId,
      cacheKey,
    })

    const cached = await databaseCacheService.get(cacheKey)
    if (cached) {
      structuredLogger.info('Database-first players cache hit', {
        service: 'database-first-players-api',
        requestId,
        cacheKey,
      })
      return NextResponse.json(cached)
    }

    // Direct database query using server client
    const supabase = await createClient()
    
    let query = supabase
      .from('player_profiles')
      .select('*')
      .eq('is_active', true)
      .order('name')
      .limit(limit)

    // Sport-agnostic: only filter by sport if not 'all'
    if (sport !== 'all') {
      query = query.eq('sport', sport)
    }

    if (teamId) {
      query = query.eq('team_id', teamId)
    }

    const { data: players, error } = await query

    if (error) {
      structuredLogger.error('Database-first players query error', {
        service: 'database-first-players-api',
        requestId,
        error: error.message,
      })
      throw error
    }

    const result = {
      success: true,
      data: players || [],
      meta: {
        source: 'database-direct',
        count: players?.length || 0,
        sport,
        teamId: teamId || 'all',
        limit,
        refreshed: true,
        timestamp: new Date().toISOString(),
      },
    }

    structuredLogger.info('Database-first players API request processed', {
      service: 'database-first-players-api',
      requestId,
      sport,
      teamId,
      count: players?.length || 0,
    })

    await databaseCacheService.set(cacheKey, result, CACHE_TTL)

    return NextResponse.json(result)
  } catch (error) {
    structuredLogger.error('Database-first players API error', {
      service: 'database-first-players-api',
      requestId,
      error: error instanceof Error ? error.message : String(error),
    })

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch players',
        details: error instanceof Error ? error.message : 'Unknown error',
        requestId,
      },
      { status: 500 }
    )
  }
}
