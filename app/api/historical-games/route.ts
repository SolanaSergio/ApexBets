import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const sport = searchParams.get('sport')
    const daysBack = parseInt(searchParams.get('days_back') || '30')
    const limit = parseInt(searchParams.get('limit') || '100')

    // Build query for historical games
    let query = supabase
      .from('games')
      .select(`
        id,
        sport,
        home_team_name,
        away_team_name,
        home_score,
        away_score,
        game_date,
        completed_at,
        league_name,
        season,
        venue,
        game_type,
        status,
        completion_reason
      `)
      .eq('status', 'completed')
      .eq('is_historical', true)
      .not('completed_at', 'is', null)
      .gte('completed_at', new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000).toISOString())
      .order('completed_at', { ascending: false })
      .limit(limit)

    if (sport) {
      query = query.eq('sport', sport)
    }

    const { data: historicalGames, error } = await query

    if (error) {
      console.error('Error fetching historical games:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    // Get team performance stats for predictions
    const teamStats = historicalGames?.reduce((acc: any, game: any) => {
      const homeTeam = game.home_team_name
      const awayTeam = game.away_team_name
      
      if (!acc[homeTeam]) {
        acc[homeTeam] = { wins: 0, losses: 0, total_games: 0, avg_score: 0, total_score: 0 }
      }
      if (!acc[awayTeam]) {
        acc[awayTeam] = { wins: 0, losses: 0, total_games: 0, avg_score: 0, total_score: 0 }
      }

      // Update home team stats
      acc[homeTeam].total_games++
      acc[homeTeam].total_score += game.home_score || 0
      acc[homeTeam].avg_score = acc[homeTeam].total_score / acc[homeTeam].total_games
      if ((game.home_score || 0) > (game.away_score || 0)) {
        acc[homeTeam].wins++
      } else {
        acc[homeTeam].losses++
      }

      // Update away team stats
      acc[awayTeam].total_games++
      acc[awayTeam].total_score += game.away_score || 0
      acc[awayTeam].avg_score = acc[awayTeam].total_score / acc[awayTeam].total_games
      if ((game.away_score || 0) > (game.home_score || 0)) {
        acc[awayTeam].wins++
      } else {
        acc[awayTeam].losses++
      }

      return acc
    }, {}) || {}

    // Calculate win rates
    Object.keys(teamStats).forEach(team => {
      const stats = teamStats[team]
      stats.win_rate = stats.total_games > 0 ? stats.wins / stats.total_games : 0
    })

    return NextResponse.json({
      success: true,
      data: {
        historical_games: historicalGames || [],
        team_performance: teamStats,
        total_games: historicalGames?.length || 0,
        date_range: {
          from: new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000).toISOString(),
          to: new Date().toISOString()
        }
      }
    })

  } catch (error) {
    console.error('Historical data error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { gameIds, completionReason = 'manual_completion' } = await request.json()

    if (!gameIds || !Array.isArray(gameIds)) {
      return NextResponse.json(
        { success: false, error: 'gameIds array is required' },
        { status: 400 }
      )
    }

    // Mark games as completed and historical
    const { data, error } = await supabase
      .from('games')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        completion_reason: completionReason,
        is_historical: true,
        updated_at: new Date().toISOString()
      })
      .in('id', gameIds)
      .select('id, sport, home_team_name, away_team_name')

    if (error) {
      console.error('Error completing games:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `Completed ${data?.length || 0} games`,
      data: {
        completed_games: data || [],
        completion_reason: completionReason
      }
    })

  } catch (error) {
    console.error('Manual completion error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
