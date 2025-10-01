/**
 * TEAMS API
 * Serves team data exclusively from database - no external API calls during user requests
 * Background sync service handles external API updates
 */

import { NextRequest, NextResponse } from 'next/server'
import { databaseFirstApiClient } from '@/lib/services/api/database-first-api-client'
import { structuredLogger } from '@/lib/services/structured-logger'
import { databaseCacheService } from '@/lib/services/database-cache-service'

const CACHE_TTL = 60 * 5 // 5 minutes

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sport = searchParams.get("sport") || "all"
    const league = searchParams.get("league")
    const limit = Number.parseInt(searchParams.get("limit") || "100")
    const isActive = searchParams.get("isActive") !== "false"

    const cacheKey = `teams-${sport}-${league}-${limit}-${isActive}`
    const cached = await databaseCacheService.get(cacheKey)
    if (cached) {
      return NextResponse.json(cached)
    }

    // Use database-first API client - no external API calls
    const result = await databaseFirstApiClient.getTeams({
      sport,
      ...(league && { league }),
      limit,
      isActive
    })

    structuredLogger.info('Teams API request processed', {
      sport,
      league,
      count: result.data.length,
      source: result.meta.source
    })

    await databaseCacheService.set(cacheKey, result, CACHE_TTL)

    return NextResponse.json(result)

  } catch (error) {
    structuredLogger.error('Teams API error', {
      error: error instanceof Error ? error.message : String(error)
    })
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch teams',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    if (!body?.name || !body?.sport) {
      return NextResponse.json({ 
        success: false,
        error: "Missing required fields: name, sport" 
      }, { status: 400 })
    }

    // This would typically be handled by a team management service
    // For now, return a not implemented response
    return NextResponse.json({ 
      success: false,
      error: "Team creation not implemented - use background sync service" 
    }, { status: 501 })

  } catch (error) {
    structuredLogger.error('Teams POST API error', {
      error: error instanceof Error ? error.message : String(error)
    })
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create team',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}