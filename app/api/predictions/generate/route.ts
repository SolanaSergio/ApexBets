import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const url = new URL(request.url)

    let parsedBody: any = null
    try {
      parsedBody = await request.json()
    } catch (_) {
      // Ignore parse errors; we'll fall back to query params
      parsedBody = null
    }

    const sport: string | null = (parsedBody && typeof parsedBody === 'object' ? parsedBody.sport : null) ?? url.searchParams.get('sport')
    const features = (parsedBody && typeof parsedBody === 'object' ? parsedBody.features : null) ?? null

    if (!sport) {
      return NextResponse.json(
        { success: false, error: 'Sport is required' },
        { status: 400 }
      )
    }

    // Get historical games for the sport
    const { data: historicalGames, error } = await supabase
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
        game_type
      `)
      .eq('sport', sport)
      .eq('status', 'completed')
      .eq('is_historical', true)
      .not('completed_at', 'is', null)
      .gte('completed_at', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()) // Last 90 days
      .order('completed_at', { ascending: false })

    if (error) {
      console.error('Error fetching historical games:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    if (!historicalGames || historicalGames.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No historical data available for predictions',
        data: {
          predictions: [],
          training_data_count: 0,
          features_used: features || []
        }
      })
    }

    // Calculate team performance metrics
    const teamStats = historicalGames.reduce((acc: any, game: any) => {
      const homeTeam = game.home_team_name
      const awayTeam = game.away_team_name
      
      if (!acc[homeTeam]) {
        acc[homeTeam] = {
          total_games: 0,
          wins: 0,
          losses: 0,
          total_score: 0,
          avg_score: 0,
          home_games: 0,
          away_games: 0,
          recent_form: []
        }
      }
      if (!acc[awayTeam]) {
        acc[awayTeam] = {
          total_games: 0,
          wins: 0,
          losses: 0,
          total_score: 0,
          avg_score: 0,
          home_games: 0,
          away_games: 0,
          recent_form: []
        }
      }

      // Update home team stats
      acc[homeTeam].total_games++
      acc[homeTeam].home_games++
      acc[homeTeam].total_score += game.home_score || 0
      acc[homeTeam].avg_score = acc[homeTeam].total_score / acc[homeTeam].total_games
      if ((game.home_score || 0) > (game.away_score || 0)) {
        acc[homeTeam].wins++
        acc[homeTeam].recent_form.push('W')
      } else {
        acc[homeTeam].losses++
        acc[homeTeam].recent_form.push('L')
      }

      // Update away team stats
      acc[awayTeam].total_games++
      acc[awayTeam].away_games++
      acc[awayTeam].total_score += game.away_score || 0
      acc[awayTeam].avg_score = acc[awayTeam].total_score / acc[awayTeam].total_games
      if ((game.away_score || 0) > (game.home_score || 0)) {
        acc[awayTeam].wins++
        acc[awayTeam].recent_form.push('W')
      } else {
        acc[awayTeam].losses++
        acc[awayTeam].recent_form.push('L')
      }

      return acc
    }, {})

    // Calculate win rates and recent form
    Object.keys(teamStats).forEach(team => {
      const stats = teamStats[team]
      stats.win_rate = stats.total_games > 0 ? stats.wins / stats.total_games : 0
      stats.recent_form = stats.recent_form.slice(-5) // Last 5 games
      stats.recent_form_str = stats.recent_form.join('')
    })

    // Get upcoming games for predictions
    const { data: upcomingGames, error: upcomingError } = await supabase
      .from('games')
      .select(`
        id,
        sport,
        home_team_name,
        away_team_name,
        game_date,
        league_name,
        season,
        venue
      `)
      .eq('sport', sport)
      .eq('status', 'scheduled')
      .gte('game_date', new Date().toISOString())
      .order('game_date', { ascending: true })
      .limit(10)

    if (upcomingError) {
      console.error('Error fetching upcoming games:', upcomingError)
      return NextResponse.json(
        { success: false, error: upcomingError.message },
        { status: 500 }
      )
    }

    // Generate predictions for upcoming games
    const predictions = upcomingGames?.map((game: any) => {
      const homeStats = teamStats[game.home_team_name] || {
        win_rate: 0.5,
        avg_score: 0,
        recent_form: [],
        home_games: 0,
        total_games: 0
      }
      
      const awayStats = teamStats[game.away_team_name] || {
        win_rate: 0.5,
        avg_score: 0,
        recent_form: [],
        away_games: 0,
        total_games: 0
      }

      // Simple prediction algorithm (can be enhanced with ML)
      const homeAdvantage = 0.05 // 5% home advantage
      const homeWinProbability = (homeStats.win_rate + homeAdvantage) / 
        (homeStats.win_rate + awayStats.win_rate + homeAdvantage)
      
      const predictedHomeScore = Math.round(homeStats.avg_score * 0.8 + awayStats.avg_score * 0.2)
      const predictedAwayScore = Math.round(awayStats.avg_score * 0.8 + homeStats.avg_score * 0.2)

      return {
        game_id: game.id,
        sport: game.sport,
        home_team: game.home_team_name,
        away_team: game.away_team_name,
        game_date: game.game_date,
        prediction: {
          home_win_probability: Math.round(homeWinProbability * 100) / 100,
          away_win_probability: Math.round((1 - homeWinProbability) * 100) / 100,
          predicted_home_score: predictedHomeScore,
          predicted_away_score: predictedAwayScore,
          confidence: Math.min(homeStats.total_games + awayStats.total_games, 20) / 20 // Based on data availability
        },
        team_analysis: {
          home_team_stats: {
            win_rate: homeStats.win_rate,
            avg_score: homeStats.avg_score,
            recent_form: homeStats.recent_form_str,
            total_games: homeStats.total_games
          },
          away_team_stats: {
            win_rate: awayStats.win_rate,
            avg_score: awayStats.avg_score,
            recent_form: awayStats.recent_form_str,
            total_games: awayStats.total_games
          }
        }
      }
    }) || []

    return NextResponse.json({
      success: true,
      data: {
        predictions,
        training_data_count: historicalGames.length,
        team_stats_count: Object.keys(teamStats).length,
        features_used: features || ['win_rate', 'avg_score', 'recent_form', 'home_advantage'],
        prediction_confidence: predictions.length > 0 ? 
          predictions.reduce((sum: number, p: any) => sum + p.prediction.confidence, 0) / predictions.length : 0
      }
    })

  } catch (error) {
    console.error('Prediction error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}