/**
 * TEAM STATISTICS API
 * Comprehensive team statistics for all sports
 */

import { NextRequest, NextResponse } from 'next/server'
import { serviceFactory, SupportedSport } from '@/lib/services/core/service-factory'
import { SportTeamStatsService } from '@/lib/services/team-stats/sport-team-stats-service'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sport = searchParams.get('sport') as SupportedSport
    const league = searchParams.get('league') || undefined
    const season = searchParams.get('season') || undefined
    const type = searchParams.get('type') || 'standings' // standings, performance, leaders

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

    const teamStatsService = new SportTeamStatsService(sport, league)
    
    let data: any = null

    switch (type) {
      case 'standings':
        data = await teamStatsService.getTeamStandings(season)
        break
      case 'leaders':
        const stat = searchParams.get('stat')
        const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 10
        if (!stat) {
          return NextResponse.json(
            { error: 'Stat parameter is required for leaders type' },
            { status: 400 }
          )
        }
        data = await teamStatsService.getLeagueLeaders(stat, season, limit)
        break
      default:
        return NextResponse.json(
          { error: 'Invalid type. Must be standings, performance, or leaders' },
          { status: 400 }
        )
    }

    if (!data) {
      return NextResponse.json(
        { 
          success: false,
          error: 'No data available',
          data: null
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
        type,
        timestamp: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('Team stats API error:', error)
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch team statistics',
        details: errorMessage,
        data: null
      },
      { status: 500 }
    )
  }
}
