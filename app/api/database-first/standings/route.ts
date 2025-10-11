/**
 * DATABASE-FIRST STANDINGS API
 * Serves data exclusively from database - no external API calls during user requests
 * Background sync service handles external API updates
 */

import { NextRequest, NextResponse } from 'next/server'
import { productionSupabaseClient } from '@/lib/supabase/production-client'
import { structuredLogger } from '@/lib/services/structured-logger'

// Cache is handled at the client/service layer for database-first endpoints

// Explicitly set runtime to suppress warnings
export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  const requestId = crypto.randomUUID()

  try {
    structuredLogger.info('Standings API request received', {
      service: 'standings-api',
      requestId,
      step: 'request-start',
    })

    const { searchParams } = new URL(request.url)
    const sport = searchParams.get('sport') || 'all'
    const league = searchParams.get('league')
    const season = searchParams.get('season')
    const limitRaw = Number.parseInt(searchParams.get('limit') || '100')
    const limit = Math.max(1, Math.min(1000, Number.isFinite(limitRaw) ? limitRaw : 100))

    structuredLogger.info('Standings API parameters parsed', {
      service: 'standings-api',
      requestId,
      sport,
      league,
      season,
      limit,
    })

    // Check if Supabase client is available
    if (!productionSupabaseClient.isConnected()) {
      structuredLogger.error('Supabase client not available', {
        service: 'standings-api',
        requestId,
        step: 'client-check',
      })
      return NextResponse.json(
        {
          success: false,
          error: 'Database service unavailable',
          details: 'Supabase client not initialized',
          requestId,
        },
        { status: 503 }
      )
    }

    structuredLogger.info('Calling productionSupabaseClient.getStandings', {
      service: 'standings-api',
      requestId,
      sport,
      league,
      season,
    })

    // Use production Supabase client directly - no external API calls
    const standings = await productionSupabaseClient.getStandings(
      sport,
      league || undefined,
      season || undefined
    )

    const result = {
      success: true,
      data: standings.slice(0, limit),
      meta: {
        source: 'database',
        count: standings.length,
        sport,
        league: league || 'all',
        season: season || 'current',
        limit,
        refreshed: true,
        timestamp: new Date().toISOString(),
      },
    }

    // Reduce logging frequency
    // structuredLogger.info('Standings API request processed', {
    //   sport,
    //   league,
    //   season,
    //   count: result.data.length,
    //   source: result.meta.source
    // })

    return NextResponse.json(result)
  } catch (error) {
    structuredLogger.error('Database-first standings API error', {
      service: 'standings-api',
      requestId,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      step: 'error-handling',
    })

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch standings',
        details: error instanceof Error ? error.message : 'Unknown error',
        requestId,
      },
      { status: 500 }
    )
  }
}
