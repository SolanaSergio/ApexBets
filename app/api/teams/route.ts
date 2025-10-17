import { NextRequest, NextResponse } from 'next/server'
import { queryTeams } from '@/lib/services/edge-function-client'
import { structuredLogger } from '@/lib/services/structured-logger'
import { databaseCacheService } from '@/lib/services/database-cache-service'

const CACHE_TTL = 60 * 5 // 5 minutes

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sport = searchParams.get('sport') || 'all'
    const league = searchParams.get('league')
    const limit = Number.parseInt(searchParams.get('limit') || '100')
    const isActive = searchParams.get('isActive') !== 'false'

    const cacheKey = `teams-${sport}-${league}-${limit}-${isActive}`
    const cached = await databaseCacheService.get(cacheKey)
    if (cached) {
      return NextResponse.json(cached)
    }

    // Use edge function client directly
    const result = await queryTeams({
      sport,
      ...(league && { league }),
      limit,
    })

    // Check if result is an error
    if ('error' in result) {
      throw new Error(result.error)
    }

    structuredLogger.info('Teams API request processed', {
      sport,
      league,
      count: result.data.length,
      source: result.meta.source,
    })

    await databaseCacheService.set(cacheKey, result, CACHE_TTL)

    return NextResponse.json(result)
  } catch (error) {
    structuredLogger.error('Teams API error', {
      error: error instanceof Error ? error.message : String(error),
    })

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch teams',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    if (!body?.name || !body?.sport) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: name, sport',
        },
        { status: 400 }
      )
    }

    // For now, return success as we don't have a specific create-team function
    return NextResponse.json({ success: true, data: body })
  } catch (error) {
    structuredLogger.error('Teams POST API error', {
      error: error instanceof Error ? error.message : String(error),
    })

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create team',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
