/**
 * ODDS POPULATION API ENDPOINT
 * Populates odds_history table with data from The Odds API
 */

import { NextRequest, NextResponse } from 'next/server'
import { oddsHistoryService } from '@/lib/services/odds/odds-history-service'

export async function POST(request: NextRequest) {
  try {
    const { sport, regions = ['us'] } = await request.json()

    if (!sport) {
      return NextResponse.json(
        { error: 'Sport parameter is required' },
        { status: 400 }
      )
    }

    // Validate sport parameter
    const supportedSports = await oddsHistoryService.getSupportedSports()
    if (!supportedSports.includes(sport)) {
      return NextResponse.json(
        { error: `Unsupported sport: ${sport}` },
        { status: 400 }
      )
    }

    // Fetch odds data from The Odds API
    const oddsData = await oddsHistoryService.fetchOddsFromApi(sport, regions)
    
    if (oddsData.length === 0) {
      return NextResponse.json(
        { message: 'No odds data available for the specified sport' },
        { status: 200 }
      )
    }

    // Store odds data in database
    await oddsHistoryService.storeOddsData(oddsData)

    return NextResponse.json({
      message: `Successfully populated odds data for ${sport}`,
      gamesProcessed: oddsData.length,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error populating odds data:', error)
    
    if (error instanceof Error) {
      if (error.message.includes('API request failed')) {
        return NextResponse.json(
          { error: 'Failed to fetch data from The Odds API' },
          { status: 502 }
        )
      }
      
      if (error.message.includes('THE_ODDS_API_KEY')) {
        return NextResponse.json(
          { error: 'Odds API key not configured' },
          { status: 500 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sport = searchParams.get('sport')

    if (!sport) {
      return NextResponse.json(
        { error: 'Sport parameter is required' },
        { status: 400 }
      )
    }

    // Get supported sports
    const supportedSports = await oddsHistoryService.getSupportedSports()
    
    return NextResponse.json({
      supportedSports,
      currentSport: sport,
      isSupported: supportedSports.includes(sport)
    })

  } catch (error) {
    console.error('Error getting supported sports:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
