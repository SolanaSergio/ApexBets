import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { DataValidationService } from '@/lib/services/data-validation-service'

export async function POST() {
  try {
    const supabase = await createClient()
    
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

    // Run validation on remaining live games
    const validationService = new DataValidationService()
    const { data: liveGames } = await supabase
      .from('games')
      .select('*')
      .in('status', ['live', 'in_progress', 'in progress'])

    const validationResult = validationService.validateLiveGames(
      liveGames || [],
      { graceWindowMinutes: 15 } // Default grace window
    )

    return NextResponse.json({
      success: true,
      message: `Completed ${completedCount} stale live games`,
      data: {
        completed_count: completedCount,
        sport_summary: sportSummary,
        validation_warnings: validationResult.warnings,
        remaining_live_count: liveGames?.length || 0
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

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const sport = searchParams.get('sport')
    const daysBack = parseInt(searchParams.get('days_back') || '30')

    // Get historical games for predictions
    const { data, error } = await supabase.rpc('get_historical_games_for_predictions', {
      target_sport: sport,
      days_back: daysBack
    })

    if (error) {
      console.error('Error fetching historical games:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    // Get completion stats
    const { data: stats } = await supabase
      .from('games')
      .select('sport, completion_reason')
      .not('completed_at', 'is', null)
      .gte('completed_at', new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000).toISOString())

    const completionStats = stats?.reduce((acc: any, game: any) => {
      if (!acc[game.sport]) {
        acc[game.sport] = { total: 0, auto_completed: 0, manual: 0 }
      }
      acc[game.sport].total++
      if (game.completion_reason === 'auto_completed_stale') {
        acc[game.sport].auto_completed++
      } else {
        acc[game.sport].manual++
      }
      return acc
    }, {}) || {}

    return NextResponse.json({
      success: true,
      data: {
        historical_games: data || [],
        completion_stats: completionStats,
        total_historical: data?.length || 0
      }
    })

  } catch (error) {
    console.error('Historical games error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
