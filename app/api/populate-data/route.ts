/**
 * API endpoint to populate all missing data
 */

import { NextRequest, NextResponse } from 'next/server'
import { getComprehensiveDataPopulationService } from '@/lib/services/comprehensive-data-population-service'

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Starting data population via API...')
    
    // Check if this is a valid request
    let populate = false
    
    try {
      const body = await request.json()
      populate = body.populate
    } catch (jsonError) {
      // If no JSON body or invalid JSON, treat as a simple trigger request
      console.log('No JSON body provided, treating as trigger request')
      populate = true
    }
    
    if (!populate) {
      return NextResponse.json(
        { error: 'Missing populate parameter' },
        { status: 400 }
      )
    }
    
    // Start the comprehensive data population
    const service = getComprehensiveDataPopulationService()
    const stats = await service.populateAllData()
    
    return NextResponse.json({
      success: true,
      message: 'Data population completed successfully',
      stats: stats
    })
    
  } catch (error) {
    console.error('❌ Error in data population API:', error)
    
    return NextResponse.json(
      { 
        error: 'Data population failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    // Return current database status
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()
    
    // Get counts for each table
    if (!supabase) {
      return NextResponse.json({ error: "Supabase client initialization failed" }, { status: 500 })
    }
    const [teams, games, playerStats, odds, predictions, standings] = await Promise.all([
      supabase.from('teams').select('*', { count: 'exact', head: true }),
      supabase.from('games').select('*', { count: 'exact', head: true }),
      supabase.from('player_stats').select('*', { count: 'exact', head: true }),
      supabase.from('odds').select('*', { count: 'exact', head: true }),
      supabase.from('predictions').select('*', { count: 'exact', head: true }),
      supabase.from('league_standings').select('*', { count: 'exact', head: true })
    ])
    
    return NextResponse.json({
      success: true,
      currentData: {
        teams: teams.count || 0,
        games: games.count || 0,
        playerStats: playerStats.count || 0,
        odds: odds.count || 0,
        predictions: predictions.count || 0,
        standings: standings.count || 0
      },
      message: 'Database status retrieved successfully'
    })
    
  } catch (error) {
    console.error('❌ Error getting database status:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to get database status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
