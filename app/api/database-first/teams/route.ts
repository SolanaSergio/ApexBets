/**
 * DATABASE-FIRST TEAMS API
 * Serves data exclusively from database - no external API calls during user requests
 * Background sync service handles external API updates
 */

import { NextRequest, NextResponse } from 'next/server'
import { productionSupabaseClient } from '@/lib/supabase/production-client'
import { structuredLogger } from '@/lib/services/structured-logger'
import { databaseCacheService } from '@/lib/services/database-cache-service'

const CACHE_TTL = 60 // 1 minute cache

// Explicitly set runtime to suppress warnings
export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sport = searchParams.get('sport') || 'all'
    const league = searchParams.get('league')
    const limitRaw = Number.parseInt(searchParams.get('limit') || '100')
    const limit = Math.max(1, Math.min(1000, Number.isFinite(limitRaw) ? limitRaw : 100))

    // Check cache first
    const cacheKey = `teams-${sport}-${league || 'all'}-${limit}`
    const cached = await databaseCacheService.get(cacheKey)
    if (cached) {
      return NextResponse.json(cached)
    }

    // Check if Supabase client is available
    if (!productionSupabaseClient.isConnected()) {
      structuredLogger.error('Supabase client not available', {
        service: 'teams-api',
        step: 'client-check',
      })
      return NextResponse.json(
        {
          success: false,
          error: 'Database service unavailable',
          details: 'Supabase client not initialized',
        },
        { status: 503 }
      )
    }

    // Use production Supabase client directly - no external API calls
    const teams = await productionSupabaseClient.getTeams(sport, league || undefined)

    const result = {
      success: true,
      data: teams.slice(0, limit),
      meta: {
        source: 'database',
        count: teams.length,
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
