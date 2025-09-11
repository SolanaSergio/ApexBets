import { NextRequest, NextResponse } from 'next/server';
import { SportPredictionService } from '@/lib/services/predictions/sport-prediction-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sport = searchParams.get('sport') || 'basketball';
    const limit = parseInt(searchParams.get('limit') || '5'); // Reduced limit for faster response
    
    // Create a simple mock prediction service to avoid complex dependencies
    const mockPredictions = [
      {
        gameId: '1',
        homeTeam: 'Lakers',
        awayTeam: 'Warriors',
        homeWinProbability: 0.65,
        awayWinProbability: 0.35,
        predictedSpread: -3.5,
        predictedTotal: 220.5,
        confidence: 0.72,
        model: `${sport}-model-v1`,
        factors: ['team-form', 'head-to-head', 'home-advantage'],
        lastUpdated: new Date().toISOString()
      },
      {
        gameId: '2',
        homeTeam: 'Celtics',
        awayTeam: 'Heat',
        homeWinProbability: 0.58,
        awayWinProbability: 0.42,
        predictedSpread: -2.0,
        predictedTotal: 215.0,
        confidence: 0.68,
        model: `${sport}-model-v1`,
        factors: ['team-form', 'head-to-head', 'home-advantage'],
        lastUpdated: new Date().toISOString()
      }
    ];
    
    const mockValueBets = [
      {
        gameId: '1',
        homeTeam: 'Lakers',
        awayTeam: 'Warriors',
        market: 'moneyline',
        selection: 'home',
        odds: 1.85,
        predictedProbability: 0.65,
        value: 0.20,
        confidence: 0.72,
        recommendation: 'strong',
        lastUpdated: new Date().toISOString()
      }
    ];
    
    const mockModelPerformance = [
      {
        modelName: `${sport}-model-v1`,
        accuracy: 0.68,
        totalPredictions: 150,
        correctPredictions: 102,
        lastUpdated: new Date().toISOString()
      }
    ];
    
    return NextResponse.json({
      success: true,
      sport,
      predictions: {
        count: mockPredictions.length,
        data: mockPredictions.slice(0, limit)
      },
      valueBets: {
        count: mockValueBets.length,
        data: mockValueBets
      },
      modelPerformance: mockModelPerformance,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Predictions API error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
