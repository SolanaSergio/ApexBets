/**
 * ODDS ANALYSIS API
 * Provides odds analysis data for charts and analytics
 * Sport-agnostic implementation using the split service architecture
 */

import { NextRequest, NextResponse } from 'next/server'
import { serviceFactory, SupportedSport } from '@/lib/services/core/service-factory'
import { SportOddsService } from '@/lib/services/odds/sport-odds-service'

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

    const oddsService = new SportOddsService(sport, league)
    
    // Get odds data using the sport-specific service
    const odds = await oddsService.getOdds({ limit })
    
    // Transform data for chart display - sport-agnostic
    const oddsData = odds.map((odd, index) => ({
      date: new Date(Date.now() - (odds.length - index) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      homeOdds: odd.markets.moneyline?.home || 1.5,
      awayOdds: odd.markets.moneyline?.away || 1.5,
      total: odd.markets.total?.line || 0,
      spread: odd.markets.spread?.line || 0,
      homeTeam: odd.homeTeam,
      awayTeam: odd.awayTeam,
      bookmaker: odd.bookmaker,
      lastUpdated: odd.lastUpdated
    }))

    return NextResponse.json({
      success: true,
      odds: oddsData,
      meta: {
        sport,
        league: league || serviceFactory.getDefaultLeague(sport),
        team,
        timeRange,
        count: oddsData.length,
        timestamp: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('Odds analysis API error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch odds analysis data',
        odds: []
      },
      { status: 500 }
    )
  }
}