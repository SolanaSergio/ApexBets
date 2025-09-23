/**
 * DATABASE-FIRST PREDICTIONS API
 * Serves data exclusively from database - no external API calls during user requests
 * Background sync service handles external API updates
 */

import { NextRequest, NextResponse } from 'next/server'
import { databaseFirstApiClient } from '@/lib/services/api/database-first-api-client'
import { structuredLogger } from '@/lib/services/structured-logger'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sport = searchParams.get("sport") || "all"
    const gameId = searchParams.get("gameId")
    const modelName = searchParams.get("modelName")
    const predictionType = searchParams.get("predictionType")
    const limitRaw = Number.parseInt(searchParams.get("limit") || "50")
    const limit = Math.max(1, Math.min(1000, Number.isFinite(limitRaw) ? limitRaw : 50))

    // Use database-first API client - no external API calls
    const result = await databaseFirstApiClient.getPredictions({
      sport,
      ...(gameId && { gameId }),
      ...(modelName && { modelName }),
      ...(predictionType && { predictionType }),
      limit
    })

    structuredLogger.info('Predictions API request processed', {
      sport,
      gameId,
      modelName,
      predictionType,
      count: result.data.length,
      source: result.meta.source
    })

    return NextResponse.json(result)

  } catch (error) {
    structuredLogger.error('Database-first predictions API error', {
      error: error instanceof Error ? error.message : String(error)
    })
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch predictions',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}