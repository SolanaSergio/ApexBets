/**
 * SPORT-SPECIFIC ODDS API ROUTE
 * Handles odds requests for specific sports using the split service architecture
 */

import { NextRequest, NextResponse } from 'next/server'
import { serviceFactory, SupportedSport } from '@/lib/services/core/service-factory'
import { SportOddsService } from '@/lib/services/odds/sport-odds-service'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ sport: string }> }
) {
  const { params } = context;
  const resolvedParams = await params;
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action') || 'odds'
    const league = searchParams.get('league') || undefined
    const gameId = searchParams.get('gameId') || undefined
    const date = searchParams.get('date') || undefined
    const markets = searchParams.get('markets')?.split(',') || undefined
    const limit = parseInt(searchParams.get('limit') || '10')
    const minValue = parseFloat(searchParams.get('minValue') || '0.1')

    const sport = resolvedParams.sport as SupportedSport

    // Validate sport
    if (!serviceFactory.isSportSupported(sport)) {
      return NextResponse.json(
        { error: `Unsupported sport: ${sport}` },
        { status: 400 }
      )
    }

    const oddsService = new SportOddsService(sport, league)
    let data: any = null
    let meta: any = {
      timestamp: new Date().toISOString(),
      sport,
      league: league || serviceFactory.getDefaultLeague(sport),
      action
    }

    switch (action) {
      case 'odds':
        data = await oddsService.getOdds({ gameId, date, markets, limit })
        meta.count = data.length
        break

      case 'live-odds':
        data = await oddsService.getLiveOdds()
        meta.count = data.length
        break

      case 'markets':
        data = await oddsService.getBettingMarkets()
        meta.count = data.length
        break

      case 'value-analysis':
        data = await oddsService.getValueBettingAnalysis({ minValue, limit })
        meta.count = data.length
        break

      case 'comparison':
        if (!gameId) {
          return NextResponse.json(
            { error: 'gameId is required for comparison' },
            { status: 400 }
          )
        }
        data = await oddsService.getOddsComparison(gameId)
        break

      case 'health':
        data = await oddsService.healthCheck()
        break

      default:
        return NextResponse.json(
          { error: `Invalid action: ${action}. Supported actions: odds, live-odds, markets, value-analysis, comparison, health` },
          { status: 400 }
        )
    }

    return NextResponse.json({
      success: true,
      data,
      meta
    })

  } catch (error) {
    console.error(`Odds API error for ${resolvedParams.sport}:`, error)
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

    const oddsService = new SportOddsService(sport, requestData?.league)
    let result: any = null
    let meta: any = {
      timestamp: new Date().toISOString(),
      sport,
      action
    }

    switch (action) {
      case 'refresh':
        // Refresh odds data
        const [odds, liveOdds] = await Promise.all([
          oddsService.getOdds({ limit: 10 }),
          oddsService.getLiveOdds()
        ])
        
        result = {
          sport,
          odds: odds.length,
          liveOdds: liveOdds.length
        }
        break

      case 'value-analysis':
        result = await oddsService.getValueBettingAnalysis({
          minValue: requestData?.minValue || 0.1,
          limit: requestData?.limit || 10
        })
        break

      case 'health-check':
        result = await oddsService.healthCheck()
        break

      default:
        return NextResponse.json(
          { error: `Invalid action: ${action}. Supported actions: refresh, value-analysis, health-check` },
          { status: 400 }
        )
    }

    return NextResponse.json({
      success: true,
      data: result,
      meta
    })

  } catch (error) {
    console.error(`Odds API POST error for ${resolvedParams.sport}:`, error)
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
