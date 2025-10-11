/**
 * GAMES API - DATABASE-FIRST APPROACH
 * Serves games data exclusively from database with proper caching
 * Background sync service handles external API updates
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { structuredLogger } from '@/lib/services/structured-logger'
import { databaseCacheService } from '@/lib/services/database-cache-service'
import { handleApiError, handleDatabaseError } from '@/lib/api/error-handler'
import type { ApiSuccessResponse, Game, GameFilters, GameSummary } from '@/types/api-responses'

const CACHE_TTL = 60 // 1 minute

export async function GET(request: NextRequest) {
  const requestId = crypto.randomUUID()
  
  try {
    const { searchParams } = new URL(request.url)
    const filters: GameFilters = {
      sport: searchParams.get('sport') || 'all',
      status: searchParams.get('status') as any,
      dateFrom: searchParams.get('date_from') || undefined,
      dateTo: searchParams.get('date_to') || undefined,
      league: searchParams.get('league') || undefined,
      limit: Number.parseInt(searchParams.get('limit') || '100')
    }

    const cacheKey = `games-${filters.sport}-${filters.status}-${filters.dateFrom}-${filters.dateTo}-${filters.limit}-${filters.league}`
    const cached = await databaseCacheService.get(cacheKey)
    if (cached) {
      return NextResponse.json(cached)
    }

    const supabase = await createClient()

    if (!supabase) {
      return handleApiError(
        new Error('Database connection failed'),
        requestId,
        { filters }
      )
    }

    // Build query with proper filtering
    let query = supabase
      .from('games')
      .select(
        `
        *,
        home_team:teams!games_home_team_id_fkey(
          id, name, abbreviation, logo_url, city, league_name
        ),
        away_team:teams!games_away_team_id_fkey(
          id, name, abbreviation, logo_url, city, league_name
        )
      `
      )
      .order('game_date', { ascending: false })

    // Apply filters
    if (filters.sport !== 'all') {
      query = query.eq('sport', filters.sport)
    }

    if (filters.status) {
      query = query.eq('status', filters.status)
    }

    if (filters.dateFrom) {
      query = query.gte('game_date', filters.dateFrom)
    }

    if (filters.dateTo) {
      query = query.lte('game_date', filters.dateTo)
    }

    if (filters.league) {
      query = query.eq('league_name', filters.league)
    }

    if (filters.limit && filters.limit > 0) {
      query = query.limit(filters.limit)
    }

    const { data: games, error } = await query

    if (error) {
      return handleDatabaseError(error, requestId, { filters })
    }

    // Process and format games data
    const processedGames: Game[] = (games || []).map(game => ({
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
    const summary: GameSummary = {
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
      sport: filters.sport,
      status: filters.status,
      league: filters.league,
      count: processedGames.length,
      summary,
      source: 'database',
      requestId
    })

    const result: ApiSuccessResponse<Game[]> = {
      success: true,
      data: processedGames,
      meta: {
        timestamp: new Date().toISOString(),
        sport: filters.sport,
        status: filters.status,
        league: filters.league,
        count: processedGames.length,
        summary,
        source: 'database',
        refreshed: true
      }
    }

    await databaseCacheService.set(cacheKey, result, CACHE_TTL)

    return NextResponse.json(result)
  } catch (error) {
    return handleApiError(
      error instanceof Error ? error : new Error('Unknown error'),
      requestId,
      { endpoint: 'games' }
    )
  }
}
