import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // Execute the auto-complete function
    const { data, error } = await supabase.rpc('auto_complete_stale_live_games')
    
    if (error) {
      console.error('Error completing stale games:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    const result = data?.[0]
    const completedCount = result?.completed_count || 0
    const sportSummary = result?.sport_summary || {}

    return NextResponse.json({
      success: true,
      message: `Completed ${completedCount} stale live games`,
      data: {
        completed_count: completedCount,
        sport_summary: sportSummary
      }
    })

  } catch (error) {
    console.error('Cleanup error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
