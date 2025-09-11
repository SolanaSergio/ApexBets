/**
 * SPORT-SPECIFIC API ROUTE
 * Handles requests for specific sports using the split service architecture
 */

import { NextRequest, NextResponse } from 'next/server'
import { serviceFactory, SupportedSport } from '@/lib/services/core/service-factory'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ sport: string }> }
) {
  const { params } = context;
  const resolvedParams = await params;
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action') || 'games'
    const league = searchParams.get('league') || undefined
    const limit = parseInt(searchParams.get('limit') || '10')
    const date = searchParams.get('date') || undefined
    const status = searchParams.get('status') as 'scheduled' | 'live' | 'finished' || undefined

    const sport = resolvedParams.sport as SupportedSport

    // Validate sport
    if (!serviceFactory.isSportSupported(sport)) {
      return NextResponse.json(
        { error: `Unsupported sport: ${sport}` },
        { status: 400 }
      )
    }

    const service = serviceFactory.getService(sport, league)
    let data: any = null
    let meta: any = {
      timestamp: new Date().toISOString(),
      sport,
      league: league || serviceFactory.getDefaultLeague(sport),
      action
    }

    switch (action) {
      case 'games':
        data = await service.getGames({ date, status, limit })
        meta.count = data.length
        break

      case 'live-games':
        data = await service.getLiveGames()
        meta.count = data.length
        break

      case 'teams':
        data = await service.getTeams({ league, limit })
        meta.count = data.length
        break

      case 'players':
        data = await service.getPlayers({ limit })
        meta.count = data.length
        break

      case 'standings':
        data = await service.getStandings()
        meta.count = data.length
        break

      case 'odds':
        data = await service.getOdds({ limit })
        meta.count = data.length
        break

      case 'health':
        data = await service.healthCheck()
        break

      default:
        return NextResponse.json(
          { error: `Invalid action: ${action}. Supported actions: games, live-games, teams, players, standings, odds, health` },
          { status: 400 }
        )
    }

    return NextResponse.json({
      success: true,
      data,
      meta
    })

  } catch (error) {
    console.error(`Sport API error for ${resolvedParams.sport}:`, error)
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

    const service = serviceFactory.getService(sport, requestData?.league)
    let result: any = null
    let meta: any = {
      timestamp: new Date().toISOString(),
      sport,
      action
    }

    switch (action) {
      case 'refresh':
        // Refresh sport data
        const [games, teams, players] = await Promise.all([
          service.getGames({ limit: 10 }),
          service.getTeams({ limit: 10 }),
          service.getPlayers({ limit: 10 })
        ])
        
        result = {
          sport,
          games: games.length,
          teams: teams.length,
          players: players.length
        }
        break

      case 'health-check':
        result = await service.healthCheck()
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
    console.error(`Sport API POST error for ${resolvedParams.sport}:`, error)
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
