/**
 * ANALYTICS STATS API
 * Serves analytics data exclusively from database - no external API calls
 * Background sync service handles external API updates
 */

import { NextRequest, NextResponse } from 'next/server'
import { databaseFirstApiClient } from '@/lib/services/api/database-first-api-client'
import { structuredLogger } from '@/lib/services/structured-logger'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sport = searchParams.get("sport") || "all"
    const dateFrom = searchParams.get("dateFrom")
    const dateTo = searchParams.get("dateTo")

    // Use database-first API client - no external API calls
    const result = await databaseFirstApiClient.getAnalyticsStats({
      sport,
      ...(dateFrom && { dateFrom }),
      ...(dateTo && { dateTo })
    })

    structuredLogger.info('Analytics stats API request processed', {
      sport,
      count: result.data ? 1 : 0,
      source: result.meta.source
    })

    return NextResponse.json(result)

  } catch (error) {
    structuredLogger.error('Analytics stats API error', {
      error: error instanceof Error ? error.message : String(error)
    })
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch analytics stats',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}