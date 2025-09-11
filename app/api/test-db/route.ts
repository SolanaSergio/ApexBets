/**
 * Test database connection endpoint
 */

import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    console.log('Testing database connection...')
    
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()
    
    if (!supabase) {
      console.error('Database connection failed - no client returned')
      return NextResponse.json({
        success: false,
        error: 'Database connection failed'
      }, { status: 500 })
    }
    
    console.log('Database client created successfully')
    
    // Test player stats query
    const { data: playerData, error: playerError } = await supabase
      .from('player_stats')
      .select('*')
      .limit(5)
    
    if (playerError) {
      console.error('Player stats query failed:', playerError)
      return NextResponse.json({
        success: false,
        error: 'Player stats query failed',
        details: playerError.message
      }, { status: 500 })
    }
    
    // Test team stats query
    const { data: teamData, error: teamError } = await supabase
      .from('league_standings')
      .select('*')
      .limit(5)
    
    if (teamError) {
      console.error('Team stats query failed:', teamError)
      return NextResponse.json({
        success: false,
        error: 'Team stats query failed',
        details: teamError.message
      }, { status: 500 })
    }
    
    return NextResponse.json({
      success: true,
      data: {
        playerStats: {
          count: playerData?.length || 0,
          sample: playerData?.[0] || null
        },
        teamStats: {
          count: teamData?.length || 0,
          sample: teamData?.[0] || null
        }
      }
    })
    
  } catch (error) {
    console.error('Database test failed:', error)
    return NextResponse.json({
      success: false,
      error: 'Database test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
