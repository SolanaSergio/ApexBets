/**
 * SPORT-SPECIFIC ODDS API ROUTE
 * Handles odds requests for specific sports using the split service architecture
 */

import { NextRequest, NextResponse } from 'next/server'
import { serviceFactory, SupportedSport } from '@/lib/services/core/service-factory'
import { SportOddsService } from '@/lib/services/odds/sport-odds-service'

export async function GET(
  request: NextRequest,
  { params }: { params: { sport: string } }
) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action') || 'odds'
    const league = searchParams.get('league') || undefined
    const gameId = searchParams.get('gameId') || undefined
    const date = searchParams.get('date') || undefined
    const markets = searchParams.get('markets')?.split(',') || undefined
    const limit = parseInt(searchParams.get('limit') || '10')
    const minValue = parseFloat(searchParams.get('minValue') || '0.1')

    const sport = params.sport as SupportedSport

    // Handle "all" sport parameter - get odds for all supported sports
    if (sport === 'all') {
      const supportedSports = await serviceFactory.getSupportedSports();
      const allOdds: any[] = [];
      const allLiveOdds: any[] = [];
      const allMarkets: any[] = [];
      const allValueAnalysis: any[] = [];
      
      for (const supportedSport of supportedSports) {
        try {
          const oddsService = new SportOddsService(supportedSport, league);
          
          switch (action) {
            case 'odds':
              const odds = await oddsService.getOdds({ 
                ...(gameId && { gameId }), 
                ...(date && { date }), 
                ...(markets && { markets }), 
                limit: Math.ceil(limit / supportedSports.length)
              });
              allOdds.push(...odds);
              break;
            case 'live-odds':
              const liveOdds = await oddsService.getLiveOdds();
              allLiveOdds.push(...liveOdds);
              break;
            case 'markets':
              const sportMarkets = await oddsService.getBettingMarkets();
              allMarkets.push(...sportMarkets);
              break;
            case 'value-analysis':
              const valueAnalysis = await oddsService.getValueBettingAnalysis({ 
                minValue, 
                limit: Math.ceil(limit / supportedSports.length) 
              });
              allValueAnalysis.push(...valueAnalysis);
              break;
          }
        } catch (error) {
          console.warn(`Failed to get odds for ${supportedSport}:`, error);
        }
      }
      
      let data: any = null;
      switch (action) {
        case 'odds':
          data = allOdds;
          break;
        case 'live-odds':
          data = allLiveOdds;
          break;
        case 'markets':
          data = allMarkets;
          break;
        case 'value-analysis':
          data = allValueAnalysis;
          break;
        default:
          return NextResponse.json(
            { error: `Invalid action: ${action}. Supported actions: odds, live-odds, markets, value-analysis, comparison, health` },
            { status: 400 }
          );
      }
      
      return NextResponse.json({
        success: true,
        data,
        meta: {
          timestamp: new Date().toISOString(),
          sport: 'all',
          league: 'all',
          action,
          count: data.length,
          sportsIncluded: supportedSports
        }
      });
    }

    // Validate sport for individual sport requests
    if (!serviceFactory.isSportSupported(sport)) {
      return NextResponse.json(
        { error: `Unsupported sport: ${sport}` },
        { status: 400 }
      )
    }

    const oddsService = new SportOddsService(sport, league)
    let data: any = null
    const meta: any = {
      timestamp: new Date().toISOString(),
      sport,
      league: league || serviceFactory.getDefaultLeague(sport),
      action
    }

    switch (action) {
      case 'odds':
        data = await oddsService.getOdds({ 
          ...(gameId && { gameId }), 
          ...(date && { date }), 
          ...(markets && { markets }), 
          limit 
        })
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
    console.error(`Odds API error for ${params.sport}:`, error)
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        sport: params.sport
      },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { sport: string } }
) {
  try {
    const body = await request.json()
    const { action, data: requestData } = body
    const sport = params.sport as SupportedSport

    // Validate sport
    if (!serviceFactory.isSportSupported(sport)) {
      return NextResponse.json(
        { error: `Unsupported sport: ${sport}` },
        { status: 400 }
      )
    }

    const oddsService = new SportOddsService(sport, requestData?.league)
    let result: any = null
    const meta: any = {
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
    console.error(`Odds API POST error for ${params.sport}:`, error)
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        sport: params.sport
      },
      { status: 500 }
    )
  }
}
