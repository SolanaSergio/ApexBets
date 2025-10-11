/**
 * PLAYER COMPARISON API
 * Compare multiple players across various statistics
 */

import { NextRequest, NextResponse } from 'next/server'
import { serviceFactory } from '@/lib/services/core/service-factory'
import { SportPlayerStatsService } from '@/lib/services/player-stats/sport-player-stats-service'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { playerIds, sport, league, season } = body

    // Validate required parameters
    if (!playerIds || !Array.isArray(playerIds) || playerIds.length < 2) {
      return NextResponse.json(
        { error: 'playerIds array with at least 2 players is required' },
        { status: 400 }
      )
    }

    if (!sport) {
      return NextResponse.json({ error: 'Sport parameter is required' }, { status: 400 })
    }

    if (!serviceFactory.isSportSupported(sport)) {
      return NextResponse.json(
        {
          error: `Unsupported sport: ${sport}. Supported sports: ${(await serviceFactory.getSupportedSports()).join(', ')}`,
        },
        { status: 400 }
      )
    }

    // Limit to maximum 5 players for comparison
    if (playerIds.length > 5) {
      return NextResponse.json(
        { error: 'Maximum 5 players allowed for comparison' },
        { status: 400 }
      )
    }

    const playerStatsService = new SportPlayerStatsService(sport, league)

    // Compare players
    const comparison = await playerStatsService.comparePlayers(playerIds, season)

    if (!comparison) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unable to compare players - insufficient data available',
          data: null,
        },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: comparison,
      meta: {
        sport,
        league: league || serviceFactory.getDefaultLeague(sport),
        season: season || 'current',
        playerCount: playerIds.length,
        timestamp: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error('Player comparison API error:', error)

    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to compare players',
        details: errorMessage,
        data: null,
      },
      { status: 500 }
    )
  }
}
