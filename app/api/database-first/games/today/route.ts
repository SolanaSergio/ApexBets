/**
 * TODAY'S GAMES API
 * Returns games scheduled for today in the user's timezone
 */

import { NextRequest, NextResponse } from 'next/server'
import { databaseFirstApiClient } from '@/lib/services/api/database-first-api-client'
import { structuredLogger } from '@/lib/services/structured-logger'
import { getCache, setCache } from '@/lib/redis'

const CACHE_TTL = 60 // 1 minute

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sport = searchParams.get("sport") || "all"
    const timezone = searchParams.get("timezone") || "UTC"
    const limitRaw = Number.parseInt(searchParams.get("limit") || "50")
    const limit = Math.max(1, Math.min(1000, Number.isFinite(limitRaw) ? limitRaw : 50))

    const cacheKey = `database-first-games-today-${sport}-${timezone}-${limit}`
    const cached = await getCache(cacheKey)
    if (cached) {
      return NextResponse.json(cached)
    }

    // Get today's date range in the user's timezone and convert to UTC
    const now = new Date()

    // Get today's date in target timezone (YYYY-MM-DD)
    const todayInUserTimezone = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(now)

    const [yearStr, monthStr, dayStr] = todayInUserTimezone.split('-')
    const year = Number.parseInt(yearStr, 10)
    const month = Number.parseInt(monthStr, 10)
    const day = Number.parseInt(dayStr, 10)

    // Construct UTC instants that correspond to midnight and end-of-day in the user's timezone
    const baseStartUtc = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0))
    const baseEndUtc = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999))

    const offsetMinutesAtStart = getTimezoneOffsetMinutes(baseStartUtc, timezone)
    const offsetMinutesAtEnd = getTimezoneOffsetMinutes(baseEndUtc, timezone)

    const todayStartUTC = new Date(baseStartUtc.getTime() - offsetMinutesAtStart * 60 * 1000)
    const todayEndUTC = new Date(baseEndUtc.getTime() - offsetMinutesAtEnd * 60 * 1000)

    // Fetch games for today (only scheduled games)
    const result = await databaseFirstApiClient.getGames({
      sport,
      status: 'scheduled',
      dateFrom: todayStartUTC.toISOString(),
      dateTo: todayEndUTC.toISOString(),
      limit
    })

    // Add timezone-aware formatting
    if (result.success && result.data) {
      result.data = result.data.map((game: any) => {
        if (game.game_date) {
          const utcDate = new Date(game.game_date)
          const localDate = new Date(utcDate.toLocaleString("en-US", { timeZone: timezone }))
          
          return {
            ...game,
            game_date: game.game_date, // Keep original UTC date
            game_date_local: localDate.toISOString(), // Add local timezone date
            game_date_formatted: localDate.toLocaleString("en-US", {
              timeZone: timezone,
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              hour: 'numeric',
              minute: '2-digit',
              hour12: true
            }),
            time_until_game: getTimeUntilGame(utcDate, timezone),
            is_today: true,
            is_tomorrow: false
          }
        }
        return game
      })
    }

    structuredLogger.info('Today\'s games API request processed', {
      sport,
      timezone,
      count: result.data.length,
      source: result.meta.source
    })

    const response = {
      ...result,
      meta: {
        ...result.meta,
        timezone,
        date_range: {
          start: todayStartUTC.toISOString(),
          end: todayEndUTC.toISOString()
        }
      }
    }

    await setCache(cacheKey, response, CACHE_TTL)

    return NextResponse.json(response)

  } catch (error) {
    structuredLogger.error('Today\'s games API error', {
      error: error instanceof Error ? error.message : String(error)
    })
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch today\'s games',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Returns the offset in minutes between the provided timezone and UTC at the given date
function getTimezoneOffsetMinutes(date: Date, timezone: string): number {
  const utc = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }))
  const zoned = new Date(date.toLocaleString('en-US', { timeZone: timezone }))
  return (zoned.getTime() - utc.getTime()) / (1000 * 60)
}

function getTimeUntilGame(gameDate: Date, timezone: string): string {
  const now = new Date()
  const gameTime = new Date(gameDate.toLocaleString("en-US", { timeZone: timezone }))
  const nowInTimezone = new Date(now.toLocaleString("en-US", { timeZone: timezone }))
  
  const diffMs = gameTime.getTime() - nowInTimezone.getTime()
  
  if (diffMs < 0) {
    return "Game started"
  }
  
  const hours = Math.floor(diffMs / (1000 * 60 * 60))
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`
  } else {
    return `${minutes}m`
  }
}
