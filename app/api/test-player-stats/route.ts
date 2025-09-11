/**
 * Test player stats endpoint with detailed error logging
 */

import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    console.log('Testing player stats service...')
    
    const { searchParams } = new URL(request.url)
    const sport = searchParams.get('sport') || 'basketball'
    const limit = parseInt(searchParams.get('limit') || '5')
    
    console.log(`Testing player stats for sport: ${sport}, limit: ${limit}`)
    
    // Import the service
    const { SportPlayerStatsService } = await import('@/lib/services/player-stats/sport-player-stats-service')
    
    console.log('Creating player stats service...')
    const service = new SportPlayerStatsService(sport as any)
    
    console.log('Calling getPlayerStats...')
    const stats = await service.getPlayerStats({ limit })
    
    console.log(`Retrieved ${stats.length} player stats`)
    
    return NextResponse.json({
      success: true,
      data: {
        count: stats.length,
        sample: stats[0] || null,
        all: stats
      }
    })
    
  } catch (error) {
    console.error('Player stats test failed:', error)
    return NextResponse.json({
      success: false,
      error: 'Player stats test failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}
