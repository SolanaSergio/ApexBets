/**
 * VALUE BETTING OPPORTUNITIES API
 * Serves value betting opportunities exclusively from database - no external API calls during user requests
 * Background ML service handles value calculations and updates
 */

import { NextRequest, NextResponse } from 'next/server'
import { databaseFirstApiClient } from '@/lib/services/api/database-first-api-client'
import { structuredLogger } from '@/lib/services/structured-logger'
import { getCache, setCache } from '@/lib/redis'

const CACHE_TTL = 60 * 5 // 5 minutes

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sport = searchParams.get("sport") || "all"
    const league = searchParams.get("league") ?? undefined
    const betType = searchParams.get("betType") ?? undefined
    const recommendation = searchParams.get("recommendation") ?? undefined
    const minValue = searchParams.get("minValue")
    const limit = Number.parseInt(searchParams.get("limit") || "50")
    const activeOnly = searchParams.get("activeOnly") !== "false"

    const cacheKey = `value-bets-${sport}-${league}-${betType}-${recommendation}-${minValue}-${limit}-${activeOnly}`
    const cached = await getCache(cacheKey)
    if (cached) {
      return NextResponse.json(cached)
    }

    // Use database-first API client - no external API calls
    const valueBetsParams: {
      sport?: string
      league?: string
      betType?: string
      recommendation?: string
      minValue?: number
      limit?: number
      activeOnly?: boolean
    } = {}

    if (sport) valueBetsParams.sport = sport
    if (league) valueBetsParams.league = league
    if (betType) valueBetsParams.betType = betType
    if (recommendation) valueBetsParams.recommendation = recommendation
    if (minValue) valueBetsParams.minValue = Number.parseFloat(minValue)
    if (limit) valueBetsParams.limit = limit
    if (typeof activeOnly === 'boolean') valueBetsParams.activeOnly = activeOnly

    const result = await databaseFirstApiClient.getValueBets(valueBetsParams)

    if (!result.success) {
      structuredLogger.error('Value bets API error', {
        error: result.error,
        sport,
        league,
        betType,
        recommendation,
        minValue,
        limit
      })
      
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch value betting opportunities',
        details: result.error
      }, { status: 500 })
    }

    structuredLogger.info('Value bets API success', {
      sport,
      league,
      betType,
      recommendation,
      minValue,
      limit,
      count: result.data?.length || 0
    })

    const response = {
      success: true,
      data: result.data,
      meta: {
        source: 'database',
        count: result.data?.length || 0,
        sport,
        league,
        betType,
        recommendation,
        minValue,
        activeOnly,
        refreshed: false,
        timestamp: new Date().toISOString()
      }
    }

    await setCache(cacheKey, response, CACHE_TTL)

    return NextResponse.json(response)

  } catch (error) {
    structuredLogger.error('Value bets API unexpected error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })

    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
