/**
 * SPORT-SPECIFIC PLAYER STATISTICS API - DATABASE-FIRST APPROACH
 * Get player statistics for a specific sport from database
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { structuredLogger } from '@/lib/services/structured-logger'

export async function GET(request: NextRequest, { params }: { params: { sport: string } }) {
  try {
    const { sport } = params
    const { searchParams } = new URL(request.url)
    const league = searchParams.get('league')
    const season = searchParams.get('season')
    const teamId = searchParams.get('team_id')
    const gameId = searchParams.get('game_id')
    const limit = Number.parseInt(searchParams.get('limit') || '100')

    // Validate sport parameter
    if (!sport) {
      return NextResponse.json(
        {
          success: false,
          error: 'Sport parameter is required',
        },
        { status: 400 }
      )
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

    // Determine the correct player stats table based on sport
    let statsTable = 'player_stats' // Default for basketball
    switch (sport) {
      case 'football':
        statsTable = 'football_player_stats'
        break
      case 'baseball':
        statsTable = 'baseball_player_stats'
        break
      case 'hockey':
        statsTable = 'hockey_player_stats'
        break
      case 'soccer':
        statsTable = 'soccer_player_stats'
        break
      case 'tennis':
        statsTable = 'tennis_match_stats'
        break
      case 'golf':
        statsTable = 'golf_tournament_stats'
        break
      default:
        statsTable = 'player_stats'
    }

    // Build query with proper filtering
    let query = supabase.from(statsTable).select('*').order('created_at', { ascending: false })

    // Apply filters
    if (teamId) {
      query = query.eq('team_id', teamId)
    }

    if (gameId) {
      query = query.eq('game_id', gameId)
    }

    if (limit > 0) {
      query = query.limit(limit)
    }

    const { data: playerStats, error } = await query

    if (error) {
      structuredLogger.error('Player stats API database error', {
        error: error.message,
        sport,
        statsTable,
        league,
        teamId,
        gameId,
      })
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to fetch player statistics from database',
        },
        { status: 500 }
      )
    }

    // Process and format player stats data
    const processedStats = (playerStats || []).map(stat => ({
      ...stat,
      team_name: stat.team?.name ?? null,
      team_abbreviation: stat.team?.abbreviation || '',
      team_logo: stat.team?.logo_url || null,
      team_city: stat.team?.city || '',
      game_date: stat.game?.game_date || null,
      game_status: stat.game?.status || null,
      game_sport: stat.game?.sport || sport,
    }))

    // Calculate summary statistics
    const summary = {
      total: processedStats.length,
      byTeam: processedStats.reduce(
        (acc, stat) => {
          const teamName = stat.team_name
          acc[teamName] = (acc[teamName] || 0) + 1
          return acc
        },
        {} as Record<string, number>
      ),
      byGame: processedStats.reduce(
        (acc, stat) => {
          const gameId = stat.game_id
          acc[gameId] = (acc[gameId] || 0) + 1
          return acc
        },
        {} as Record<string, number>
      ),
    }

    structuredLogger.info('Player stats API request processed', {
      sport,
      statsTable,
      league,
      teamId,
      gameId,
      count: processedStats.length,
      source: 'database',
    })

    return NextResponse.json({
      success: true,
      data: processedStats,
      meta: {
        timestamp: new Date().toISOString(),
        sport,
        league: league || 'all',
        season: season || 'current',
        count: processedStats.length,
        summary,
        source: 'database',
      },
    })
  } catch (error) {
    structuredLogger.error('Player stats API error', {
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
