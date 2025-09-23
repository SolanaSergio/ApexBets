/**
 * TODAY'S GAMES API
 * Returns games scheduled for today in the user's timezone
 */

import { NextRequest, NextResponse } from 'next/server'
import { databaseFirstApiClient } from '@/lib/services/api/database-first-api-client'
import { structuredLogger } from '@/lib/services/structured-logger'

// Helper function to get timezone offset in minutes
function getTimezoneOffset(timezone: string): number {
  const now = new Date()
  const utc = new Date(now.toLocaleString("en-US", { timeZone: "UTC" }))
  const local = new Date(now.toLocaleString("en-US", { timeZone: timezone }))
  return (local.getTime() - utc.getTime()) / (1000 * 60)
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sport = searchParams.get("sport") || "all"
    const timezone = searchParams.get("timezone") || "UTC"
    const limitRaw = Number.parseInt(searchParams.get("limit") || "50")
    const limit = Math.max(1, Math.min(1000, Number.isFinite(limitRaw) ? limitRaw : 50))

    // Get today's date range in the user's timezone
    const now = new Date()
    
    // Get today's date in the user's timezone (YYYY-MM-DD format)
    const todayInUserTimezone = new Intl.DateTimeFormat('en-CA', { 
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit', 
      day: '2-digit'
    }).format(now)
    
    // For now, let's use a simpler approach - just get all games for today
    // and filter them in the response based on timezone
    const todayStartUTC = new Date(`${todayInUserTimezone}T00:00:00Z`)
    const todayEndUTC = new Date(`${todayInUserTimezone}T23:59:59Z`)

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

    return NextResponse.json({
      ...result,
      meta: {
        ...result.meta,
        timezone,
        date_range: {
          start: todayStartUTC.toISOString(),
          end: todayEndUTC.toISOString()
        }
      }
    })

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
