import { NextRequest, NextResponse } from 'next/server'
import { serviceFactory, SupportedSport } from '@/lib/services/core/service-factory'
import { SportAnalyticsService } from '@/lib/services/analytics/sport-analytics-service'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sport = searchParams.get('sport')
    const league = searchParams.get('league')
    const team = searchParams.get('team')
    const timeRange = searchParams.get('timeRange') || '30d'
    
    if (!sport) {
      return NextResponse.json({ error: "Sport parameter is required" }, { status: 400 })
    }

    if (!serviceFactory.isSportSupported(sport as SupportedSport)) {
      return NextResponse.json({
        success: false,
        error: `Unsupported sport: ${sport}. Supported sports: ${(await serviceFactory.getSupportedSports()).join(', ')}`
      }, { status: 400 })
    }

    const analyticsService = new SportAnalyticsService(sport as SupportedSport, league || undefined)
    
    // Get prediction accuracy data - using team performance data
    const teamPerformance = await analyticsService.getTeamPerformance(team || undefined)
    
    const accuracyData = teamPerformance.map((team, index) => ({
      date: new Date(Date.now() - (30 - index) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      accuracy: team.winPercentage * 100, // Use win percentage as accuracy proxy
      target: 70 // Target accuracy
    }))

    return NextResponse.json({
      success: true,
      accuracy: accuracyData,
      meta: {
        sport,
        league: league || serviceFactory.getDefaultLeague(sport as SupportedSport),
        team: team || 'all',
        timeRange,
        count: accuracyData.length,
        timestamp: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('Prediction accuracy API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch prediction accuracy data',
      accuracy: []
    }, { status: 500 })
  }
}