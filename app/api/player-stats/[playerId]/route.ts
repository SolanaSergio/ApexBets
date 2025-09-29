/**
 * INDIVIDUAL PLAYER STATISTICS API
 * Get detailed statistics for a specific player
 */

import { NextRequest, NextResponse } from 'next/server'
import { serviceFactory, SupportedSport } from '@/lib/services/core/service-factory'
import { SportPlayerStatsService } from '@/lib/services/player-stats/sport-player-stats-service'

export async function GET(
  request: NextRequest,
  { params }: { params: { playerId: string } }
) {
  try {
    const { searchParams } = new URL(request.url)
    const sport = searchParams.get('sport') as SupportedSport
    const league = searchParams.get('league') || undefined
    const season = searchParams.get('season') || undefined

    // Validate sport parameter
    if (!sport) {
      return NextResponse.json(
        { error: 'Sport parameter is required' },
        { status: 400 }
      )
    }

    if (!serviceFactory.isSportSupported(sport)) {
      return NextResponse.json(
        { error: `Unsupported sport: ${sport}. Supported sports: ${(await serviceFactory.getSupportedSports()).join(', ')}` },
        { status: 400 }
      )
    }

    const playerStatsService = new SportPlayerStatsService(sport, league)
    
    // Get player statistics
    const { playerId } = params
    const playerStats = await playerStatsService.getPlayerStatsById(playerId, season)

    if (!playerStats) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Player not found or no statistics available',
          data: null
        },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: playerStats,
      meta: {
        sport,
        league: league || serviceFactory.getDefaultLeague(sport),
        season: season || 'current',
        playerId: playerId,
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
        data: null
      },
      { status: 500 }
    )
  }
}
