import { NextRequest, NextResponse } from 'next/server';
import { SportPredictionService } from '@/lib/services/predictions/sport-prediction-service';
import { serviceFactory, SupportedSport } from '@/lib/services/core/service-factory';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sport = searchParams.get('sport');
    
    if (!sport) {
      return NextResponse.json({
        success: false,
        error: "Sport parameter is required"
      }, { status: 400 });
    }
    const league = searchParams.get('league') || undefined;
    const limit = parseInt(searchParams.get('limit') || '5');
    const minValue = parseFloat(searchParams.get('minValue') || '0.1');
    
    // Validate sport
    if (!serviceFactory.isSportSupported(sport as SupportedSport)) {
      return NextResponse.json({
        success: false,
        error: `Unsupported sport: ${sport}. Supported sports: ${serviceFactory.getSupportedSports().join(', ')}`,
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    // Use real prediction service - NO MOCK DATA
    const predictionService = new SportPredictionService(sport as SupportedSport, league);
    
    // Get real predictions, value bets, and model performance
    const [predictions, valueBets, modelPerformance] = await Promise.all([
      predictionService.getPredictions({ limit }),
      predictionService.getValueBettingOpportunities({ minValue, limit: 5 }),
      predictionService.getModelPerformance()
    ]);
    
    return NextResponse.json({
      success: true,
      sport,
      league: league || serviceFactory.getDefaultLeague(sport as SupportedSport),
      predictions: {
        count: predictions.length,
        data: predictions
      },
      valueBets: {
        count: valueBets.length,
        data: valueBets
      },
      modelPerformance,
      meta: {
        timestamp: new Date().toISOString(),
        dataSource: 'real_ml_models',
        sportSupported: true,
        leagueSupported: true
      }
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
