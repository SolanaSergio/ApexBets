/**
 * STANDINGS API
 * Serves standings data exclusively from database - no external API calls during user requests
 * Background sync service handles external API updates
 */

import { NextRequest, NextResponse } from 'next/server'
import { databaseFirstApiClient } from '@/lib/services/api/database-first-api-client'
import { structuredLogger } from '@/lib/services/structured-logger'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sport = searchParams.get("sport") || "all"
    const league = searchParams.get("league")
    const season = searchParams.get("season") || "2024-25"
    const limit = Number.parseInt(searchParams.get("limit") || "50")

    // Use database-first API client - no external API calls
    const result = await databaseFirstApiClient.getStandings({
      sport,
      ...(league && { league }),
      season,
      limit
    })

    structuredLogger.info('Standings API request processed', {
      sport,
      league,
      season,
      count: result.data.length,
      source: result.meta.source
    })

    return NextResponse.json(result)

  } catch (error) {
    structuredLogger.error('Standings API error', {
      error: error instanceof Error ? error.message : String(error)
    })
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch standings',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}