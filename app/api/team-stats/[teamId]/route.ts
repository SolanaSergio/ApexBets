/**
 * INDIVIDUAL TEAM STATISTICS API
 * Get detailed statistics for a specific team
 */

import { NextRequest, NextResponse } from 'next/server'
import { serviceFactory, SupportedSport } from '@/lib/services/core/service-factory'
import { SportTeamStatsService } from '@/lib/services/team-stats/sport-team-stats-service'

export async function GET(request: NextRequest, { params }: { params: { teamId: string } }) {
  try {
    const { searchParams } = new URL(request.url)
    const sport = searchParams.get('sport') as SupportedSport
    const league = searchParams.get('league') || undefined
    const season = searchParams.get('season') || undefined
    const type = searchParams.get('type') || 'stats' // stats, performance

    // Validate sport parameter
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

    const teamStatsService = new SportTeamStatsService(sport, league)
    const { teamId } = params

    let data: any = null

    switch (type) {
      case 'stats':
        data = await teamStatsService.getTeamStats(teamId, season)
        break
      case 'performance':
        data = await teamStatsService.getTeamPerformance(teamId, season)
        break
      default:
        return NextResponse.json(
          { error: 'Invalid type. Must be stats or performance' },
          { status: 400 }
        )
    }

    if (!data) {
      return NextResponse.json(
        {
          success: false,
          error: 'Team not found or no statistics available',
          data: null,
        },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data,
      meta: {
        sport,
        league: league || serviceFactory.getDefaultLeague(sport),
        season: season || 'current',
        teamId: teamId,
        type,
        timestamp: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error('Team stats API error:', error)

    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch team statistics',
        details: errorMessage,
        data: null,
      },
      { status: 500 }
    )
  }
}
