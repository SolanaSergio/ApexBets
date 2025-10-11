/**
 * PLAYERS API
 * Serves player data from database
 */

import { NextRequest, NextResponse } from 'next/server'
import { productionSupabaseClient } from '@/lib/supabase/production-client'
import { structuredLogger } from '@/lib/services/structured-logger'
import { databaseCacheService } from '@/lib/services/database-cache-service'

const CACHE_TTL = 60 // 1 minute

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  const requestId = crypto.randomUUID()

  try {
    structuredLogger.info('Players API request received', {
      service: 'players-api',
      requestId,
      step: 'request-start',
    })

    const { searchParams } = new URL(request.url)
    const sport = searchParams.get('sport') || 'all'
    const teamId = searchParams.get('team_id')
    const limitRaw = Number.parseInt(searchParams.get('limit') || '100')
    const limit = Math.max(1, Math.min(1000, Number.isFinite(limitRaw) ? limitRaw : 100))

    structuredLogger.info('Players API parameters parsed', {
      service: 'players-api',
      requestId,
      sport,
      teamId,
      limit,
    })

    const cacheKey = `players-${sport}-${teamId || 'all'}-${limit}`

    structuredLogger.info('Checking cache for players', {
      service: 'players-api',
      requestId,
      cacheKey,
    })

    const cached = await databaseCacheService.get(cacheKey)
    if (cached) {
      structuredLogger.info('Players cache hit', {
        service: 'players-api',
        requestId,
        cacheKey,
      })
      return NextResponse.json(cached)
    }

    structuredLogger.info('Calling productionSupabaseClient.getPlayers', {
      service: 'players-api',
      requestId,
      sport,
      teamId,
      limit,
    })

    // Use production Supabase client directly
    const players = await productionSupabaseClient.getPlayers(sport, teamId || undefined, limit)

    const result = {
      success: true,
      data: players,
      meta: {
        source: 'database',
        count: players.length,
        sport,
        teamId: teamId || 'all',
        limit,
        refreshed: true,
        timestamp: new Date().toISOString(),
      },
    }

    await databaseCacheService.set(cacheKey, result, CACHE_TTL)

    structuredLogger.info('Players API request processed', {
      sport,
      teamId,
      count: players.length,
    })

    return NextResponse.json(result)
  } catch (error) {
    structuredLogger.error('Players API error', {
      service: 'players-api',
      requestId,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      step: 'error-handling',
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
