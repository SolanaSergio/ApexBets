/**
 * SPORTS NEWS API
 * Serves sports news exclusively from database - no external API calls during user requests
 * Background news service handles external news aggregation
 */

import { NextRequest, NextResponse } from 'next/server'
import { databaseFirstApiClient } from '@/lib/services/api/database-first-api-client'
import { structuredLogger } from '@/lib/services/structured-logger'
import { databaseCacheService } from '@/lib/services/database-cache-service'

const CACHE_TTL = 60 * 5 // 5 minutes

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sport = searchParams.get('sport') || 'all'
    const league = searchParams.get('league') ?? undefined
    const teamId = searchParams.get('teamId') ?? undefined
    const playerId = searchParams.get('playerId') ?? undefined
    const newsType = searchParams.get('newsType') ?? undefined
    const source = searchParams.get('source') ?? undefined
    const limit = Number.parseInt(searchParams.get('limit') || '20')
    const hours = Number.parseInt(searchParams.get('hours') || '24')

    const cacheKey = `sports-news-${sport}-${league}-${teamId}-${playerId}-${newsType}-${source}-${limit}-${hours}`
    const cached = await databaseCacheService.get(cacheKey)
    if (cached) {
      return NextResponse.json(cached)
    }

    // Use database-first API client - no external API calls
    const result = await databaseFirstApiClient.getSportsNews({
      sport,
      ...(league && { league }),
      ...(source && { newsSource: source }),
      limit,
      hours,
    })

    if (!result.success) {
      structuredLogger.error('Sports news API error', {
        error: result.error,
        sport,
        league,
        teamId,
        playerId,
        newsType,
        source,
        limit,
        hours,
      })

      return NextResponse.json(
        {
          success: false,
          error: 'Failed to fetch sports news',
          details: result.error,
        },
        { status: 500 }
      )
    }

    structuredLogger.info('Sports news API success', {
      sport,
      league,
      teamId,
      playerId,
      newsType,
      source,
      limit,
      hours,
      count: result.data?.length || 0,
    })

    const response = {
      success: true,
      data: result.data,
      meta: {
        source: 'database',
        count: result.data?.length || 0,
        sport,
        league,
        teamId,
        playerId,
        newsType,
        newsSource: source,
        limit,
        hours,
        refreshed: false,
        timestamp: new Date().toISOString(),
      },
    }

    await databaseCacheService.set(cacheKey, response, CACHE_TTL)

    return NextResponse.json(response)
  } catch (error) {
    structuredLogger.error('Sports news API unexpected error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    })

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
