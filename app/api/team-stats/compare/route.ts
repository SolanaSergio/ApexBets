/**
 * TEAM COMPARISON API
 * Compare multiple teams across various statistics
 */

import { NextRequest, NextResponse } from 'next/server'
import { serviceFactory, SupportedSport } from '@/lib/services/core/service-factory'
import { SportTeamStatsService } from '@/lib/services/team-stats/sport-team-stats-service'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { teamIds, sport, league, season } = body

    // Validate required parameters
    if (!teamIds || !Array.isArray(teamIds) || teamIds.length < 2) {
      return NextResponse.json(
        { error: 'teamIds array with at least 2 teams is required' },
        { status: 400 }
      )
    }

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

    // Limit to maximum 5 teams for comparison
    if (teamIds.length > 5) {
      return NextResponse.json(
        { error: 'Maximum 5 teams allowed for comparison' },
        { status: 400 }
      )
    }

    const teamStatsService = new SportTeamStatsService(sport, league)
    
    // Compare teams
    const comparison = await teamStatsService.compareTeams(teamIds, season)

    if (!comparison) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Unable to compare teams - insufficient data available',
          data: null
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
        teamCount: teamIds.length,
        timestamp: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('Team comparison API error:', error)
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to compare teams',
        details: errorMessage,
        data: null
      },
      { status: 500 }
    )
  }
}
