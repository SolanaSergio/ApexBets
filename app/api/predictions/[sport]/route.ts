/**
 * SPORT-SPECIFIC PREDICTIONS API ROUTE
 * Handles prediction requests for specific sports using the split service architecture
 */

import { NextRequest, NextResponse } from 'next/server'
import { serviceFactory, SupportedSport } from '@/lib/services/core/service-factory'
import { SportPredictionService } from '@/lib/services/predictions/sport-prediction-service'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ sport: string }> }
) {
  const { params } = context;
  const resolvedParams = await params;
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action') || 'predictions'
    const league = searchParams.get('league') || undefined
    const gameId = searchParams.get('gameId') || undefined
    const date = searchParams.get('date') || undefined
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

    const predictionService = new SportPredictionService(sport, league)
    let data: any = null
    const meta: any = {
      timestamp: new Date().toISOString(),
      sport,
      league: league || serviceFactory.getDefaultLeague(sport),
      action
    }

    switch (action) {
      case 'predictions':
        data = await predictionService.getPredictions({ gameId, date, limit })
        meta.count = data.length
        break

      case 'value-bets':
        data = await predictionService.getValueBettingOpportunities({ minValue, limit })
        meta.count = data.length
        break

      case 'model-performance':
        data = await predictionService.getModelPerformance()
        meta.count = data.length
        break

      case 'accuracy':
        data = await predictionService.getPredictionAccuracy({
          startDate: searchParams.get('startDate') || undefined,
          endDate: searchParams.get('endDate') || undefined,
          model: searchParams.get('model') || undefined
        })
        break

      case 'health':
        data = await predictionService.healthCheck()
        break

      default:
        return NextResponse.json(
          { error: `Invalid action: ${action}. Supported actions: predictions, value-bets, model-performance, accuracy, health` },
          { status: 400 }
        )
    }

    return NextResponse.json({
      success: true,
      data,
      meta
    })

  } catch (error) {
    console.error(`Predictions API error for ${resolvedParams.sport}:`, error)
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

    const predictionService = new SportPredictionService(sport, requestData?.league)
    let result: any = null
    const meta: any = {
      timestamp: new Date().toISOString(),
      sport,
      action
    }

    switch (action) {
      case 'refresh':
        // Refresh prediction data
        const [predictions, valueBets] = await Promise.all([
          predictionService.getPredictions({ limit: 10 }),
          predictionService.getValueBettingOpportunities({ limit: 5 })
        ])
        
        result = {
          sport,
          predictions: predictions.length,
          valueBets: valueBets.length
        }
        break

      case 'generate-prediction':
        if (!requestData?.gameId) {
          return NextResponse.json(
            { error: 'gameId is required for generate-prediction' },
            { status: 400 }
          )
        }
        
        const gamePredictions = await predictionService.getPredictions({ 
          gameId: requestData.gameId
        })
        result = gamePredictions[0] || null
        break

      case 'health-check':
        result = await predictionService.healthCheck()
        break

      default:
        return NextResponse.json(
          { error: `Invalid action: ${action}. Supported actions: refresh, generate-prediction, health-check` },
          { status: 400 }
        )
    }

    return NextResponse.json({
      success: true,
      data: result,
      meta
    })

  } catch (error) {
    console.error(`Predictions API POST error for ${resolvedParams.sport}:`, error)
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
