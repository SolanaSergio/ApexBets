/**
 * PLAYER STATISTICS API
 * Comprehensive player statistics for all sports
 */

import { NextRequest, NextResponse } from 'next/server'
import { serviceFactory, SupportedSport } from '@/lib/services/core/service-factory'
import { SportPlayerStatsService } from '@/lib/services/player-stats/sport-player-stats-service'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sport = searchParams.get('sport') as SupportedSport
    const league = searchParams.get('league') || undefined
    const teamId = searchParams.get('teamId') || undefined
    const position = searchParams.get('position') || undefined
    const season = searchParams.get('season') || undefined
    const minGames = searchParams.get('minGames') ? parseInt(searchParams.get('minGames')!) : undefined
    const sortBy = searchParams.get('sortBy') || undefined
    const sortOrder = (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc'
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 50

    // Validate sport parameter
    if (!sport) {
      return NextResponse.json(
        { error: 'Sport parameter is required' },
        { status: 400 }
      )
    }

    if (!serviceFactory.isSportSupported(sport)) {
      return NextResponse.json(
        { error: `Unsupported sport: ${sport}. Supported sports: ${serviceFactory.getSupportedSports().join(', ')}` },
        { status: 400 }
      )
    }

    const playerStatsService = new SportPlayerStatsService(sport, league)
    
    // Get player statistics
    const playerStats = await playerStatsService.getPlayerStats({
      teamId,
      position,
      season,
      minGames,
      sortBy,
      sortOrder,
      limit
    })

    return NextResponse.json({
      success: true,
      data: playerStats,
      meta: {
        sport,
        league: league || serviceFactory.getDefaultLeague(sport),
        season: season || 'current',
        filters: {
          teamId,
          position,
          minGames,
          sortBy,
          sortOrder
        },
        count: playerStats.length,
        timestamp: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('Player stats API error:', error)
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch player statistics',
        details: errorMessage,
        data: []
      },
      { status: 500 }
    )
  }
}
