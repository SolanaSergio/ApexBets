/**
 * PLAYER ANALYTICS API
 * Provides player analytics data for charts and analytics
 * Sport-agnostic implementation using the split service architecture
 */

import { NextRequest, NextResponse } from 'next/server'
import { serviceFactory, SupportedSport } from '@/lib/services/core/service-factory'
import { SportAnalyticsService } from '@/lib/services/analytics/sport-analytics-service'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sport = searchParams.get('sport') as SupportedSport
    const league = searchParams.get('league') || undefined
    const team = searchParams.get('team') || undefined
    const timeRange = searchParams.get('timeRange') || '7d'
    const limit = parseInt(searchParams.get('limit') || '20')

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

    const analyticsService = new SportAnalyticsService(sport, league)
    
    // Get player performance data using the sport-specific service
    const playerAnalytics = await analyticsService.getPlayerPerformance()
    
    // Transform data for chart display - sport-agnostic
    const players = playerAnalytics.map((player: any, index: number) => ({
      id: player.playerId,
      name: player.playerName,
      team: player.team,
      position: player.position,
      points: player.averageStats?.points || 0,
      rebounds: player.averageStats?.rebounds || 0,
      assists: player.averageStats?.assists || 0,
      steals: player.averageStats?.steals || 0,
      blocks: player.averageStats?.blocks || 0,
      gamesPlayed: player.gamesPlayed || 0,
      minutesPerGame: player.averageStats?.minutes || 0,
      efficiency: player.averageStats?.efficiency || 0,
      rank: index + 1
    }))

    return NextResponse.json({
      success: true,
      players,
      meta: {
        sport,
        league: league || serviceFactory.getDefaultLeague(sport),
        team,
        timeRange,
        count: players.length,
        timestamp: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('Player analytics API error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch player analytics data',
        players: []
      },
      { status: 500 }
    )
  }
}