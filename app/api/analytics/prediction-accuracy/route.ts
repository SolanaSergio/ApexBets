/**
 * PREDICTION ACCURACY API
 * Provides prediction accuracy data for charts and analytics
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
    const team = searchParams.get('team') || undefined
    const timeRange = searchParams.get('timeRange') || '7d'
    const limit = parseInt(searchParams.get('limit') || '30')

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
    
    // Get model performance data for accuracy analysis
    const modelPerformance = await predictionService.getModelPerformance()
    
    // Get prediction accuracy for the specified time range
    const accuracyData = await predictionService.getPredictionAccuracy({
      startDate: timeRange === '7d' ? new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : undefined,
      endDate: new Date().toISOString().split('T')[0]
    })
    
    // Transform data for chart display - sport-agnostic
    const chartData = Array.from({ length: Math.min(limit, 30) }, (_, index) => ({
      date: new Date(Date.now() - (limit - index) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      accuracy: accuracyData.accuracy * 100, // Convert to percentage
      target: 75, // Target accuracy percentage
      totalPredictions: accuracyData.totalPredictions,
      correctPredictions: accuracyData.correctPredictions
    }))

    return NextResponse.json({
      success: true,
      accuracy: chartData,
      meta: {
        sport,
        league: league || serviceFactory.getDefaultLeague(sport),
        team,
        timeRange,
        count: chartData.length,
        modelPerformance: modelPerformance[0] || null,
        timestamp: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('Prediction accuracy API error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch prediction accuracy data',
        accuracy: []
      },
      { status: 500 }
    )
  }
}