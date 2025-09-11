import { NextRequest, NextResponse } from 'next/server'
import { serviceFactory, SupportedSport } from '@/lib/services/core/service-factory'
import { SportOddsService } from '@/lib/services/odds/sport-odds-service'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sport = searchParams.get('sport')
    const league = searchParams.get('league')
    const team = searchParams.get('team')
    const timeRange = searchParams.get('timeRange') || '30d'
    
    if (!sport) {
      return NextResponse.json({ error: "Sport parameter is required" }, { status: 400 })
    }

    if (!serviceFactory.isSportSupported(sport as SupportedSport)) {
      return NextResponse.json({
        success: false,
        error: `Unsupported sport: ${sport}. Supported sports: ${serviceFactory.getSupportedSports().join(', ')}`
      }, { status: 400 })
    }

    const oddsService = new SportOddsService(sport as SupportedSport)
    
    // Get odds analysis data - using real odds data
    const odds = await oddsService.getOdds({ limit: 30 })
    const oddsData = odds.map((odd, index) => ({
      date: odd.lastUpdated ? new Date(odd.lastUpdated).toISOString().split('T')[0] : new Date(Date.now() - (30 - index) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      homeOdds: odd.markets.moneyline?.home || 0,
      awayOdds: odd.markets.moneyline?.away || 0,
      total: odd.markets.total?.line || 0,
      homeTeam: odd.homeTeam || 'Home',
      awayTeam: odd.awayTeam || 'Away'
    }))

    return NextResponse.json({
      success: true,
      odds: oddsData,
      meta: {
        sport,
        league: league || serviceFactory.getDefaultLeague(sport as SupportedSport),
        team: team || 'all',
        timeRange,
        count: oddsData.length,
        timestamp: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('Odds analysis API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch odds analysis data',
      odds: []
    }, { status: 500 })
  }
}