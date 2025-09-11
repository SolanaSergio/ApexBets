/**
 * TREND ANALYSIS API
 * Provides trend analysis data for charts and analytics
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
    
    // Get team performance data for trend analysis
    const teamPerformance = await analyticsService.getTeamPerformance(team)
    
    // Transform data for chart display - sport-agnostic
    const trendData = teamPerformance.map((performance, index) => ({
      date: new Date(Date.now() - (teamPerformance.length - index) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      volume: performance.wins + performance.losses, // Total games as volume
      value: performance.winPercentage * 100, // Win percentage as value
      accuracy: performance.winPercentage * 100, // Same as value for consistency
      teamName: performance.teamName,
      pointDifferential: performance.pointDifferential,
      homeRecord: performance.homeRecord,
      awayRecord: performance.awayRecord
    }))

    return NextResponse.json({
      success: true,
      trends: trendData,
      meta: {
        sport,
        league: league || serviceFactory.getDefaultLeague(sport),
        team,
        timeRange,
        count: trendData.length,
        timestamp: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('Trend analysis API error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch trend analysis data',
        trends: []
      },
      { status: 500 }
    )
  }
}