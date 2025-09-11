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
    const limit = parseInt(searchParams.get('limit') || '30')

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
    const dataService = serviceFactory.getService(sport, league)
    
    // Get player performance data using analytics service
    const playerPerformance = await analyticsService.getPlayerPerformance()
    
    // Get additional player data from data service
    const players = await dataService.getPlayers({ 
      team, 
      limit 
    })
    
    // Transform data for chart display - sport-agnostic
    const playerData = playerPerformance.slice(0, limit).map((performance, index) => {
      const player = players.find(p => p.id === performance.playerId)
      return {
        name: performance.playerName,
        points: performance.averageStats.points || 0,
        rebounds: performance.averageStats.rebounds || 0,
        assists: performance.averageStats.assists || 0,
        team: performance.team,
        position: performance.position,
        gamesPlayed: performance.gamesPlayed,
        seasonHighs: performance.seasonHighs
      }
    })

    return NextResponse.json({
      success: true,
      players: playerData,
      meta: {
        sport,
        league: league || serviceFactory.getDefaultLeague(sport),
        team,
        timeRange,
        count: playerData.length,
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