/**
 * DATABASE-FIRST ODDS API
 * Serves data exclusively from database - no external API calls during user requests
 * Background sync service handles external API updates
 */

import { NextRequest, NextResponse } from 'next/server'
import { edgeFunctionClient } from '@/lib/services/edge-function-client'
import { structuredLogger } from '@/lib/services/structured-logger'

// Explicitly set runtime to suppress warnings
export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  const requestId = crypto.randomUUID()

  try {
    structuredLogger.info('Odds API request received', {
      service: 'odds-api',
      requestId,
      step: 'request-start',
    })

    const { searchParams } = new URL(request.url)
    const sport = searchParams.get('sport') || 'all'
    const gameId = searchParams.get('gameId')
    const source = searchParams.get('source')
    const limitRaw = Number.parseInt(searchParams.get('limit') || '100')
    const limit = Math.max(1, Math.min(1000, Number.isFinite(limitRaw) ? limitRaw : 100))
    const liveOnly = searchParams.get('liveOnly') === 'true'

    structuredLogger.info('Odds API parameters parsed', {
      service: 'odds-api',
      requestId,
      sport,
      gameId,
      source,
      limit,
      liveOnly,
    })

    structuredLogger.info('Calling Edge Function query-odds', {
      service: 'odds-api',
      requestId,
      sport,
      gameId,
      limit,
    })

    // Use Edge Function instead of direct Supabase client
    const edgeResponse = await edgeFunctionClient.queryOdds({
      sport,
      ...(gameId && { gameId }),
      limit: limit,
      offset: 0,
    })

    if (!edgeResponse.success) {
      structuredLogger.error('Edge Function query-odds failed', {
        service: 'odds-api',
        requestId,
        error: edgeResponse.error,
      })
      return NextResponse.json(
        {
          success: false,
          error: 'Database service unavailable',
          details: edgeResponse.error,
          requestId,
        },
        { status: 503 }
      )
    }

    const odds = edgeResponse.data

    const result = {
      success: true,
      data: odds,
      meta: {
        source: source || 'edge-function',
        count: odds.length,
        sport,
        gameId: gameId || 'all',
        limit,
        liveOnly,
        refreshed: true,
        timestamp: new Date().toISOString(),
      },
    }

    structuredLogger.info('Odds API request processed', {
      sport,
      gameId,
      source,
      count: result.data.length,
      dataSource: result.meta.source,
    })

    return NextResponse.json(result)
  } catch (error) {
    structuredLogger.error('Database-first odds API error', {
      service: 'odds-api',
      requestId,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      step: 'error-handling',
    })

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch odds',
        details: error instanceof Error ? error.message : 'Unknown error',
        requestId,
      },
      { status: 500 }
    )
  }
}
