/**
 * SPORT-SPECIFIC ANALYTICS API ROUTE
 * Handles analytics requests for specific sports using the split service architecture
 */

import { NextRequest, NextResponse } from 'next/server'
import { serviceFactory, SupportedSport } from '@/lib/services/core/service-factory'
import { SportAnalyticsService } from '@/lib/services/analytics/sport-analytics-service'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ sport: string }> }
) {
  const { params } = context;
  const resolvedParams = await params;
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action') || 'overview'
    const league = searchParams.get('league') || undefined
    const teamId = searchParams.get('teamId') || undefined
    const playerId = searchParams.get('playerId') || undefined
    const limit = parseInt(searchParams.get('limit') || '10')

    const sport = resolvedParams.sport as SupportedSport

    // Validate sport
    if (!serviceFactory.isSportSupported(sport)) {
      return NextResponse.json(
        { error: `Unsupported sport: ${sport}` },
        { status: 400 }
      )
    }

    const analyticsService = new SportAnalyticsService(sport, league)
    let data: any = null
    let meta: any = {
      timestamp: new Date().toISOString(),
      sport,
      league: league || serviceFactory.getDefaultLeague(sport),
      action
    }

    switch (action) {
      case 'overview':
        data = await analyticsService.getSportAnalytics()
        break

      case 'team-performance':
        data = await analyticsService.getTeamPerformance(teamId)
        meta.count = data.length
        break

      case 'player-performance':
        data = await analyticsService.getPlayerPerformance(playerId)
        meta.count = data.length
        break

      case 'trending-teams':
        data = await analyticsService.getTrendingTeams(limit)
        meta.count = data.length
        break

      case 'value-bets':
        data = await analyticsService.getValueBettingOpportunities(0.1)
        meta.count = data.length
        break

      case 'health':
        data = await analyticsService.healthCheck()
        break

      default:
        return NextResponse.json(
          { error: `Invalid action: ${action}. Supported actions: overview, team-performance, player-performance, trending-teams, value-bets, health` },
          { status: 400 }
        )
    }

    return NextResponse.json({
      success: true,
      data,
      meta
    })


  } catch (error) {
    console.error(`Analytics API error for ${resolvedParams.sport}:`, error)
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        sport: resolvedParams.sport
      },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ sport: string }> }
) {
  const { params } = context;
  const resolvedParams = await params;
  try {
    const body = await request.json()
    const { action, data: requestData } = body
    const sport = resolvedParams.sport as SupportedSport

    // Validate sport
    if (!serviceFactory.isSportSupported(sport)) {
      return NextResponse.json(
        { error: `Unsupported sport: ${sport}` },
        { status: 400 }
      )
    }

    const analyticsService = new SportAnalyticsService(sport, requestData?.league)
    let result: any = null
    let meta: any = {
      timestamp: new Date().toISOString(),
      sport,
      action
    }

    switch (action) {
      case 'refresh':
        // Refresh analytics data
        const [overview, teamPerformance] = await Promise.all([
          analyticsService.getSportAnalytics(),
          analyticsService.getTeamPerformance()
        ])
        
        result = {
          sport,
          overview,
          teamPerformance: teamPerformance.length
        }
        break

      case 'health-check':
        result = await analyticsService.healthCheck()
        break

      default:
        return NextResponse.json(
          { error: `Invalid action: ${action}. Supported actions: refresh, health-check` },
          { status: 400 }
        )
    }

    return NextResponse.json({
      success: true,
      data: result,
      meta
    })

  } catch (error) {
    console.error(`Analytics API POST error for ${resolvedParams.sport}:`, error)
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        sport: resolvedParams.sport
      },
      { status: 500 }
    )
  }
}
