/**
 * GAMES API - DATABASE-FIRST APPROACH
 * Serves games data exclusively from database with proper caching
 * Background sync service handles external API updates
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { structuredLogger } from '@/lib/services/structured-logger'
import { databaseCacheService } from '@/lib/services/database-cache-service'

const CACHE_TTL = 60 // 1 minute

export async function GET(request: NextRequest) {
  try {
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
    const limit = Number.parseInt(searchParams.get('limit') || '100')
    const league = searchParams.get('league')

    const cacheKey = `games-${sport}-${status}-${dateFrom}-${dateTo}-${limit}-${league}`
    const cached = await databaseCacheService.get(cacheKey)
    if (cached) {
      return NextResponse.json(cached)
    }

    const supabase = await createClient()

    if (!supabase) {
      return NextResponse.json(
        {
          success: false,
          error: 'Database connection failed',
        },
        { status: 500 }
      )
    }

    // Build query with proper filtering
    let query = supabase
      .from('games')
      .select(
        `
        *,
        home_team:teams!games_home_team_id_fkey(
          id, name, abbreviation, logo_url, city, league
        ),
        away_team:teams!games_away_team_id_fkey(
          id, name, abbreviation, logo_url, city, league
        )
      `
      )
      .order('game_date', { ascending: false })

    // Apply filters
    if (sport !== 'all') {
      query = query.eq('sport', sport)
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

    if (league) {
      query = query.eq('league_name', league)
    }

    if (limit > 0) {
      query = query.limit(limit)
    }

    const { data: games, error } = await query

    if (error) {
      structuredLogger.error('Games API database error', {
        error: error.message,
        sport,
        status,
      })
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to fetch games from database',
        },
        { status: 500 }
      )
    }

    // Process and format games data
    const processedGames = (games || []).map(game => ({
      ...game,
      home_team_name: game.home_team?.name ?? null,
      away_team_name: game.away_team?.name ?? null,
      home_team_abbreviation: game.home_team?.abbreviation || '',
      away_team_abbreviation: game.away_team?.abbreviation || '',
      home_team_logo: game.home_team?.logo_url || null,
      away_team_logo: game.away_team?.logo_url || null,
      home_team_city: game.home_team?.city || '',
      away_team_city: game.away_team?.city || '',
    }))

    // Calculate summary statistics
    const summary = {
      total: processedGames.length,
      live: processedGames.filter(g => g.status === 'live').length,
      completed: processedGames.filter(g => g.status === 'completed').length,
      scheduled: processedGames.filter(g => g.status === 'scheduled').length,
      recent: processedGames.filter(g => {
        const gameDate = new Date(g.game_date)
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        return gameDate >= weekAgo
      }).length,
    }

    structuredLogger.info('Games API request processed', {
      sport,
      status,
      league,
      count: processedGames.length,
      summary,
      source: 'database',
    })

    const result = {
      success: true,
      data: processedGames,
      meta: {
        timestamp: new Date().toISOString(),
        sport,
        status,
        league,
        count: processedGames.length,
        summary,
        source: 'database',
      },
    }

    await databaseCacheService.set(cacheKey, result, CACHE_TTL)

    return NextResponse.json(result)
  } catch (error) {
    structuredLogger.error('Games API error', {
      error: error instanceof Error ? error.message : String(error),
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
