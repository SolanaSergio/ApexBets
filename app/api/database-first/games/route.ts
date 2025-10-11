/**
 * DATABASE-FIRST GAMES API
 * Serves data exclusively from database - no external API calls during user requests
 * Background sync service handles external API updates
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { structuredLogger } from '@/lib/services/structured-logger'
import { databaseCacheService } from '@/lib/services/database-cache-service'

const CACHE_TTL = 60 // 1 minute

// Explicitly set runtime to suppress warnings
export const runtime = 'nodejs'

// Helper functions for timezone-aware date comparison
function isToday(date: Date, timezone: string): boolean {
  const now = new Date()
  const todayInTimezone = new Date(now.toLocaleString('en-US', { timeZone: timezone }))
  const gameDateInTimezone = new Date(date.toLocaleString('en-US', { timeZone: timezone }))

  return todayInTimezone.toDateString() === gameDateInTimezone.toDateString()
}

function isTomorrow(date: Date, timezone: string): boolean {
  const now = new Date()
  const tomorrowInTimezone = new Date(now.toLocaleString('en-US', { timeZone: timezone }))
  tomorrowInTimezone.setDate(tomorrowInTimezone.getDate() + 1)

  const gameDateInTimezone = new Date(date.toLocaleString('en-US', { timeZone: timezone }))

  return tomorrowInTimezone.toDateString() === gameDateInTimezone.toDateString()
}

export async function GET(request: NextRequest) {
  const requestId = crypto.randomUUID()

  try {
    structuredLogger.info('Games API request received', {
      service: 'games-api',
      requestId,
      step: 'request-start',
    })

    const { searchParams } = new URL(request.url)
    const sport = searchParams.get('sport') || 'all'
    const status = searchParams.get('status') as
      | 'scheduled'
      | 'live'
      | 'completed'
      | 'postponed'
      | 'cancelled'
      | undefined
    const dateFrom = searchParams.get('date_from')
    const dateTo = searchParams.get('date_to')
    const limitRaw = Number.parseInt(searchParams.get('limit') || '100')
    const limit = Math.max(1, Math.min(1000, Number.isFinite(limitRaw) ? limitRaw : 100))
    const league = searchParams.get('league')
    const timezone = searchParams.get('timezone') || 'UTC'

    structuredLogger.info('Games API parameters parsed', {
      service: 'games-api',
      requestId,
      sport,
      status,
      dateFrom,
      dateTo,
      limit,
      league,
      timezone,
    })

    const cacheKey = `database-first-games-${sport}-${status}-${dateFrom}-${dateTo}-${limit}-${league}-${timezone}`

    structuredLogger.info('Checking cache for games', {
      service: 'games-api',
      requestId,
      cacheKey,
    })

    const cached = await databaseCacheService.get(cacheKey)
    if (cached) {
      structuredLogger.info('Games cache hit', {
        service: 'games-api',
        requestId,
        cacheKey,
      })
      return NextResponse.json(cached)
    }

    structuredLogger.info('Querying games from database', {
      service: 'games-api',
      requestId,
      sport,
      league,
      status,
    })

    // Query games with team data included
    const supabase = await createClient()
    let query = supabase
      .from('games')
      .select(`
        *,
        home_team:teams!home_team_id(
          id,
          name,
          abbreviation,
          logo_url,
          sport,
          league
        ),
        away_team:teams!away_team_id(
          id,
          name,
          abbreviation,
          logo_url,
          sport,
          league
        )
      `)
      .order('game_date', { ascending: true })

    if (sport !== 'all') {
      query = query.eq('sport', sport)
    }
    if (league) {
      query = query.eq('league', league)
    }
    if (status) {
      query = query.eq('status', status)
    }
    if (dateFrom) {
      query = query.gte('game_date', dateFrom)
    }
    if (dateTo) {
      query = query.lte('game_date', dateTo)
    }

    const { data: games, error } = await query.limit(limit)

    if (error) {
      structuredLogger.error('Database query failed', {
        service: 'games-api',
        requestId,
        error: error.message,
      })
      return NextResponse.json(
        {
          success: false,
          error: 'Database query failed',
          details: error.message,
          requestId,
        },
        { status: 500 }
      )
    }

    const result = {
      success: true,
      data: games || [],
      meta: {
        source: 'database',
        count: games?.length || 0,
        sport,
        status,
        league: league || 'all',
        limit,
        timezone,
        refreshed: true,
        timestamp: new Date().toISOString(),
      },
    }

    // Convert game dates to user's timezone
    if (result.success && result.data) {
      result.data = result.data.map((game: any) => {
        if (game.game_date) {
          const utcDate = new Date(game.game_date)
          const localDate = new Date(utcDate.toLocaleString('en-US', { timeZone: timezone }))

          return {
            ...game,
            game_date: game.game_date, // Keep original UTC date
            game_date_local: localDate.toISOString(), // Add local timezone date
            game_date_formatted: localDate.toLocaleString('en-US', {
              timeZone: timezone,
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              hour: 'numeric',
              minute: '2-digit',
              hour12: true,
            }),
            is_today: isToday(utcDate, timezone),
            is_tomorrow: isTomorrow(utcDate, timezone),
          }
        }
        return game
      })
    }

    structuredLogger.info('Games API request processed', {
      sport,
      status,
      count: result.data.length,
      source: result.meta.source,
      timezone,
    })

    await databaseCacheService.set(cacheKey, result, CACHE_TTL)

    return NextResponse.json(result)
  } catch (error) {
    structuredLogger.error('Database-first games API error', {
      service: 'games-api',
      requestId,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      step: 'error-handling',
    })

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch games',
        details: error instanceof Error ? error.message : 'Unknown error',
        requestId,
      },
      { status: 500 }
    )
  }
}
