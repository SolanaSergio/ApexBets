/**
 * DATABASE-FIRST PREDICTIONS API
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
    structuredLogger.info('Predictions API request received', {
      service: 'predictions-api',
      requestId,
      step: 'request-start',
    })

    const { searchParams } = new URL(request.url)
    const sport = searchParams.get('sport') || 'all'
    const gameId = searchParams.get('gameId')
    const modelName = searchParams.get('modelName')
    const predictionType = searchParams.get('predictionType')
    const limitRaw = Number.parseInt(searchParams.get('limit') || '50')
    const limit = Math.max(1, Math.min(1000, Number.isFinite(limitRaw) ? limitRaw : 50))

    structuredLogger.info('Predictions API parameters parsed', {
      service: 'predictions-api',
      requestId,
      sport,
      gameId,
      modelName,
      predictionType,
      limit,
    })

    structuredLogger.info('Calling Edge Function query-predictions', {
      service: 'predictions-api',
      requestId,
      sport,
      gameId,
      limit,
    })

    // Use Edge Function instead of direct Supabase client
    const edgeResponse = await edgeFunctionClient.queryPredictions({
      sport,
      ...(gameId && { gameId }),
      limit: limit,
      offset: 0,
    })

    if (!edgeResponse.success) {
      structuredLogger.error('Edge Function query-predictions failed', {
        service: 'predictions-api',
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

    const predictions = edgeResponse.data

    // Filter by sport if specified
    const filteredPredictions =
      sport === 'all' ? predictions : predictions.filter((p: any) => p.sport === sport)

    const result = {
      success: true,
      data: filteredPredictions,
      meta: {
        source: 'database',
        count: filteredPredictions.length,
        sport,
        gameId: gameId || 'all',
        modelName: modelName || 'all',
        predictionType: predictionType || 'all',
        limit,
        refreshed: true,
        timestamp: new Date().toISOString(),
      },
    }

    structuredLogger.info('Predictions API request processed', {
      sport,
      gameId,
      modelName,
      predictionType,
      count: result.data.length,
      source: result.meta.source,
    })

    return NextResponse.json(result)
  } catch (error) {
    structuredLogger.error('Database-first predictions API error', {
      service: 'predictions-api',
      requestId,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      step: 'error-handling',
    })

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch predictions',
        details: error instanceof Error ? error.message : 'Unknown error',
        requestId,
      },
      { status: 500 }
    )
  }
}
