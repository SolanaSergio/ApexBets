/**
 * DATABASE-FIRST GAMES API
 * Serves data exclusively from database - no external API calls during user requests
 * Background sync service handles external API updates
 */

import { NextRequest, NextResponse } from 'next/server'
import { databaseFirstApiClient } from '@/lib/services/api/database-first-api-client'
import { structuredLogger } from '@/lib/services/structured-logger'
import { databaseCacheService } from '@/lib/services/database-cache-service'

const CACHE_TTL = 60 // 1 minute

// Explicitly set runtime to suppress warnings
export const runtime = 'nodejs'

// Helper functions for timezone-aware date comparison
function isToday(date: Date, timezone: string): boolean {
  const now = new Date()
  const todayInTimezone = new Date(now.toLocaleString("en-US", { timeZone: timezone }))
  const gameDateInTimezone = new Date(date.toLocaleString("en-US", { timeZone: timezone }))
  
  return todayInTimezone.toDateString() === gameDateInTimezone.toDateString()
}

function isTomorrow(date: Date, timezone: string): boolean {
  const now = new Date()
  const tomorrowInTimezone = new Date(now.toLocaleString("en-US", { timeZone: timezone }))
  tomorrowInTimezone.setDate(tomorrowInTimezone.getDate() + 1)
  
  const gameDateInTimezone = new Date(date.toLocaleString("en-US", { timeZone: timezone }))
  
  return tomorrowInTimezone.toDateString() === gameDateInTimezone.toDateString()
}

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
    const timezone = searchParams.get("timezone") || "UTC"

    const cacheKey = `database-first-games-${sport}-${status}-${dateFrom}-${dateTo}-${limit}-${league}-${timezone}`
    const cached = await databaseCacheService.get(cacheKey)
    if (cached) {
      return NextResponse.json(cached)
    }

    // Use database-first API client - no external API calls
    const result = await databaseFirstApiClient.getGames({
      sport,
      ...(status && { status }),
      ...(dateFrom && { dateFrom }),
      ...(dateTo && { dateTo }),
      limit,
      ...(league && { league })
    })

    // Convert game dates to user's timezone
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
            is_today: isToday(utcDate, timezone),
            is_tomorrow: isTomorrow(utcDate, timezone)
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
      timezone
    })

    await databaseCacheService.set(cacheKey, result, CACHE_TTL)

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

