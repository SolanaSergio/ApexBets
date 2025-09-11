/**
 * VALUE BETS API
 * Provides value betting opportunities for analytics
 * Sport-agnostic implementation using the split service architecture
 */

import { NextRequest, NextResponse } from 'next/server'
import { serviceFactory, SupportedSport } from '@/lib/services/core/service-factory'
import { SportPredictionService } from '@/lib/services/predictions/sport-prediction-service'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sport = searchParams.get('sport') as SupportedSport
    const league = searchParams.get('league') || undefined
    const timeRange = searchParams.get('timeRange') || '7d'
    const minValue = parseFloat(searchParams.get('minValue') || '0.1')
    const limit = parseInt(searchParams.get('limit') || '10')

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

    const predictionService = new SportPredictionService(sport, league)
    
    // Get value betting opportunities using the sport-specific service
    const valueBets = await predictionService.getValueBettingOpportunities({
      minValue,
      limit
    })
    
    // Transform data for display - sport-agnostic
    const opportunities = valueBets.map((bet) => ({
      gameId: bet.gameId,
      homeTeam: bet.homeTeam,
      awayTeam: bet.awayTeam,
      betType: bet.market,
      side: bet.selection,
      odds: bet.odds,
      value: bet.value,
      recommendation: bet.recommendation,
      bookmakers: ['Multiple'],
      analysis: `Value bet with ${(bet.value * 100).toFixed(1)}% edge`,
      confidence: bet.confidence,
      expectedValue: bet.predictedProbability * bet.odds - 1,
      lastUpdated: new Date().toISOString()
    }))

    return NextResponse.json({
      success: true,
      opportunities,
      meta: {
        sport,
        league: league || serviceFactory.getDefaultLeague(sport),
        timeRange,
        minValue,
        count: opportunities.length,
        timestamp: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('Value bets API error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch value betting opportunities',
        opportunities: []
      },
      { status: 500 }
    )
  }
}