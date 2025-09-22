/**
 * DATABASE-FIRST GAMES API
 * Always checks database first, only uses external APIs when database is stale/empty
 */

import { NextRequest, NextResponse } from 'next/server'
import { productionSupabaseClient } from '@/lib/supabase/production-client'
import { cachedUnifiedApiClient } from '@/lib/services/api/cached-unified-api-client'
import { structuredLogger } from '@/lib/services/structured-logger'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sport = searchParams.get("sport")
    const status = searchParams.get("status") as "scheduled" | "live" | "finished" | "in_progress" | undefined
    const dateFrom = searchParams.get("date_from")
    const dateTo = searchParams.get("date_to")
    const limit = Number.parseInt(searchParams.get("limit") || "50")
    const forceRefresh = searchParams.get("forceRefresh") === "true"

    if (!sport) {
      return NextResponse.json({
        success: false,
        error: "Sport parameter is required"
      }, { status: 400 })
    }

    // STEP 1: Check database first
    let games = await productionSupabaseClient.getGames(sport, undefined, dateFrom || undefined, status)
    let dataSource = 'database'
    let needsRefresh = false

    // Apply additional filters
    if (dateTo) {
      games = games.filter((game: any) => new Date(game.game_date) <= new Date(dateTo))
    }

    // Apply limit
    games = games.slice(0, limit)

    // STEP 2: Check if data is stale or empty
    if (games.length === 0 || forceRefresh) {
      needsRefresh = true
      structuredLogger.info('Database data is stale or empty, fetching from external API', {
        sport,
        status,
        gameCount: games.length,
        forceRefresh
      })
    } else {
      // Check if data is stale (older than 15 minutes for games)
      const oldestGame = games.reduce((oldest: any, game: any) => {
        const gameTime = new Date(game.last_updated || game.updated_at || 0).getTime()
        const oldestTime = new Date(oldest.last_updated || oldest.updated_at || 0).getTime()
        return gameTime < oldestTime ? game : oldest
      })

      const dataAge = Date.now() - new Date(oldestGame.last_updated || oldestGame.updated_at || 0).getTime()
      const maxAge = 15 * 60 * 1000 // 15 minutes for games (more frequent than teams)

      if (dataAge > maxAge) {
        needsRefresh = true
        structuredLogger.info('Database data is stale, refreshing from external API', {
          sport,
          status,
          dataAgeMinutes: Math.round(dataAge / 60000),
          maxAgeMinutes: Math.round(maxAge / 60000)
        })
      }
    }

    // STEP 3: Fetch from external API if needed
    if (needsRefresh) {
      try {
        const externalGames = await cachedUnifiedApiClient.getGames(sport as any, { 
          limit: 100,
          ...(status && { status }),
          ...(dateFrom && { date: dateFrom })
        })

        if (externalGames && externalGames.length > 0) {
          // Update database with fresh data
          await updateDatabaseWithExternalData(sport, externalGames)
          
          // Get updated data from database
          games = await productionSupabaseClient.getGames(sport, undefined, dateFrom || undefined, status)
          
          // Apply filters again
          if (dateTo) {
            games = games.filter((game: any) => new Date(game.game_date) <= new Date(dateTo))
          }
          games = games.slice(0, limit)
          
          dataSource = 'external_api_refreshed'
          
          structuredLogger.info('Successfully refreshed data from external API', {
            sport,
            status,
            gameCount: games.length
          })
        } else {
          structuredLogger.warn('External API returned no data, using database fallback', {
            sport,
            status
          })
          dataSource = 'database_fallback'
        }
      } catch (error) {
        structuredLogger.error('Failed to fetch from external API, using database fallback', {
          sport,
          status,
          error: error instanceof Error ? error.message : String(error)
        })
        dataSource = 'database_fallback'
      }
    }

    return NextResponse.json({
      success: true,
      data: games,
      meta: {
        source: dataSource,
        count: games.length,
        sport,
        status,
        refreshed: needsRefresh,
        timestamp: new Date().toISOString()
      }
    })

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

/**
 * Update database with external API data
 */
async function updateDatabaseWithExternalData(sport: string, externalGames: any[]): Promise<void> {
  try {
    // Get existing games to avoid duplicates
    const existingGames = await productionSupabaseClient.getGames(sport)
    const existingGameMap = new Map(existingGames.map((g: any) => [g.id, g]))

    const gamesToUpsert = externalGames.map(externalGame => {
      const existingGame = existingGameMap.get(externalGame.id)
      
      return {
        id: (existingGame as any)?.id || externalGame.id || `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        home_team_id: externalGame.home_team_id || null,
        away_team_id: externalGame.away_team_id || null,
        game_date: externalGame.game_date || new Date().toISOString(),
        season: externalGame.season || '2024-25',
        status: externalGame.status || 'scheduled',
        home_score: externalGame.home_score || null,
        away_score: externalGame.away_score || null,
        venue: externalGame.venue || null,
        sport: sport,
        league: externalGame.league || 'default',
        last_updated: new Date().toISOString()
      }
    })

    // Upsert games
    await productionSupabaseClient.supabase
      .from('games')
      .upsert(gamesToUpsert, { onConflict: 'id' })

    structuredLogger.info('Successfully updated database with external data', {
      sport,
      gameCount: gamesToUpsert.length
    })

  } catch (error) {
    structuredLogger.error('Failed to update database with external data', {
      sport,
      error: error instanceof Error ? error.message : String(error)
    })
    throw error
  }
}
