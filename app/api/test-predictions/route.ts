/**
 * Test predictions endpoint with detailed error logging
 */

import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    console.log('Testing predictions service...')
    
    const { searchParams } = new URL(request.url)
    const sport = searchParams.get('sport') || 'basketball'
    
    console.log(`Testing predictions for sport: ${sport}`)
    
    // Import the service
    const { SportPredictionService } = await import('@/lib/services/predictions/sport-prediction-service')
    
    console.log('Creating prediction service...')
    const service = new SportPredictionService(sport as any)
    
    console.log('Calling getPredictions...')
    const predictions = await service.getPredictions({ limit: 5 })
    
    console.log(`Retrieved ${predictions.length} predictions`)
    
    return NextResponse.json({
      success: true,
      data: {
        count: predictions.length,
        sample: predictions[0] || null,
        all: predictions
      }
    })
    
  } catch (error) {
    console.error('Predictions test failed:', error)
    return NextResponse.json({
      success: false,
      error: 'Predictions test failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}
