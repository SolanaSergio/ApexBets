/**
 * DATABASE-FIRST GAMES API
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
    const status = searchParams.get("status") as "scheduled" | "live" | "completed" | "postponed" | "cancelled" | undefined
    const dateFrom = searchParams.get("date_from")
    const dateTo = searchParams.get("date_to")
    const limitRaw = Number.parseInt(searchParams.get("limit") || "100")
    const limit = Math.max(1, Math.min(1000, Number.isFinite(limitRaw) ? limitRaw : 100))
    const league = searchParams.get("league")

    // Use database-first API client - no external API calls
    const result = await databaseFirstApiClient.getGames({
      sport,
      ...(status && { status }),
      ...(dateFrom && { dateFrom }),
      ...(dateTo && { dateTo }),
      limit,
      ...(league && { league })
    })

    structuredLogger.info('Games API request processed', {
      sport,
      status,
      count: result.data.length,
      source: result.meta.source
    })

    return NextResponse.json(result)

  } catch (error) {
    structuredLogger.error('Database-first games API error', {
      error: error instanceof Error ? error.message : String(error)
    })
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch games',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

