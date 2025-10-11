import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const team = searchParams.get('team') || 'all'
    const sport = searchParams.get('sport')

    if (!sport) {
      return NextResponse.json({ error: 'Sport parameter is required' }, { status: 400 })
    }
    const league = searchParams.get('league')
    const timeRange = searchParams.get('timeRange') || '30d'

    // Calculate date range
    const endDate = new Date()
    const startDate = new Date()

    switch (timeRange) {
      case '7d':
        startDate.setDate(endDate.getDate() - 7)
        break
      case '30d':
        startDate.setDate(endDate.getDate() - 30)
        break
      case '90d':
        startDate.setDate(endDate.getDate() - 90)
        break
      case '1y':
        startDate.setFullYear(endDate.getFullYear() - 1)
        break
      default:
        startDate.setDate(endDate.getDate() - 30)
    }

    const supabase = await createClient()

    if (!supabase) {
      return NextResponse.json({
        trends: [],
        meta: {
          fromCache: false,
          responseTime: 0,
          source: 'supabase',
          error: 'Database connection failed',
        },
      })
    }

    // Get team trends data
    let query = supabase
      .from('games')
      .select(
        `
        *,
        home_team:teams!games_home_team_id_fkey(name, abbreviation, sport, league),
        away_team:teams!games_away_team_id_fkey(name, abbreviation, sport, league)
      `
      )
      .gte('game_date', startDate.toISOString())
      .lte('game_date', endDate.toISOString())
      .not('home_score', 'is', null)
      .not('away_score', 'is', null)

    if (sport) {
      query = query.eq('sport', sport)
    }

    if (league) {
      query = query.eq('league', league)
    }

    const { data: gamesData, error: gamesError } = await query

    if (gamesError) {
      console.error('Error fetching games data:', gamesError)
      return NextResponse.json({
        trends: [],
        meta: {
          fromCache: false,
          responseTime: 0,
          source: 'supabase',
          error: 'Failed to fetch games data',
        },
      })
    }

    // Process team trends
    const trends = processTeamTrends(gamesData || [], team, sport)

    return NextResponse.json({
      trends,
      meta: {
        fromCache: false,
        responseTime: 0,
        source: 'supabase',
        total: trends.length,
      },
    })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function processTeamTrends(gamesData: any[], team: string, sport: string) {
  const trends = []

  // Home vs Away Performance
  const homeGames = gamesData.filter(
    game => team === 'all' || game.home_team?.name?.toLowerCase().includes(team.toLowerCase())
  )

  if (homeGames.length > 0) {
    const homeWins = homeGames.filter(game => game.home_score > game.away_score).length
    const homeWinRate = homeWins / homeGames.length
    const expectedHomeWinRate = 0.5
    const homeAdvantage = ((homeWinRate - expectedHomeWinRate) * 100).toFixed(1)

    trends.push({
      category: 'Home Advantage',
      trend: parseFloat(homeAdvantage) > 0 ? 'up' : 'down',
      value: `${homeAdvantage}%`,
      description: `Home teams are performing ${Math.abs(parseFloat(homeAdvantage))}% ${parseFloat(homeAdvantage) > 0 ? 'above' : 'below'} expected`,
      confidence: Math.min(0.95, 0.5 + Math.abs(parseFloat(homeAdvantage)) / 100),
    })
  }

  // Over/Under Analysis
  const totalGames = gamesData.filter(game => game.home_score && game.away_score)
  if (totalGames.length > 0) {
    const totalScores = totalGames.map(game => game.home_score + game.away_score)
    const avgTotal = totalScores.reduce((a, b) => a + b, 0) / totalScores.length
    const expectedTotal = calculateExpectedTotal(sport, totalScores)
    const totalVariance = (((avgTotal - expectedTotal) / expectedTotal) * 100).toFixed(1)

    trends.push({
      category: 'Scoring Trends',
      trend:
        Math.abs(parseFloat(totalVariance)) < 5
          ? 'neutral'
          : parseFloat(totalVariance) > 0
            ? 'up'
            : 'down',
      value: `${totalVariance}%`,
      description: `Games averaging ${avgTotal.toFixed(1)} ${getScoreUnit(sport)} (${parseFloat(totalVariance) > 0 ? 'above' : 'below'} expected)`,
      confidence: Math.min(0.9, 0.6 + Math.abs(parseFloat(totalVariance)) / 50),
    })
  }

  // Recent Form Analysis
  const recentGames = gamesData.slice(-10)
  if (recentGames.length >= 5) {
    const recentWins = recentGames.filter(game => {
      if (team === 'all') return true
      const isHome = game.home_team?.name?.toLowerCase().includes(team.toLowerCase())
      return (
        (isHome && game.home_score > game.away_score) ||
        (!isHome && game.away_score > game.home_score)
      )
    }).length

    const recentWinRate = (recentWins / recentGames.length) * 100
    const formTrend = recentWinRate > 60 ? 'up' : recentWinRate < 40 ? 'down' : 'neutral'

    trends.push({
      category: 'Recent Form',
      trend: formTrend,
      value: `${recentWinRate.toFixed(1)}%`,
      description: `Win rate in last ${recentGames.length} games`,
      confidence: Math.min(0.9, 0.6 + Math.abs(recentWinRate - 50) / 50),
    })
  }

  // Divisional Performance (if applicable)
  const divisionalGames = gamesData.filter(
    game =>
      game.home_team?.division &&
      game.away_team?.division &&
      game.home_team.division === game.away_team.division
  )

  if (divisionalGames.length > 0) {
    const divHomeWins = divisionalGames.filter(game => game.home_score > game.away_score).length
    const divHomeWinRate = divHomeWins / divisionalGames.length
    const divPerformance = ((divHomeWinRate - 0.5) * 100).toFixed(1)

    trends.push({
      category: 'Divisional Games',
      trend:
        Math.abs(parseFloat(divPerformance)) < 5
          ? 'neutral'
          : parseFloat(divPerformance) > 0
            ? 'up'
            : 'down',
      value: `${divPerformance}%`,
      description: `Divisional home advantage: ${Math.abs(parseFloat(divPerformance))}% ${parseFloat(divPerformance) > 0 ? 'above' : 'below'} expected`,
      confidence: Math.min(0.9, 0.6 + Math.abs(parseFloat(divPerformance)) / 20),
    })
  }

  // Streak Analysis
  if (gamesData.length > 0) {
    const streaks = calculateStreaks(gamesData, team)
    if (streaks.currentStreak > 1) {
      trends.push({
        category: 'Current Streak',
        trend: streaks.streakType === 'win' ? 'up' : 'down',
        value: `${streaks.streakType.toUpperCase()} ${streaks.currentStreak}`,
        description: `Currently on a ${streaks.currentStreak}-game ${streaks.streakType} streak`,
        confidence: Math.min(0.95, 0.7 + (streaks.currentStreak - 1) * 0.1),
      })
    }
  }

  return trends
}

function calculateExpectedTotal(sport: string, totalScores: number[]) {
  if (totalScores.length === 0) {
    const fallbackTotals = {
      basketball: 220,
      football: 45,
      baseball: 8.5,
      hockey: 5.5,
      soccer: 2.5,
      tennis: 20,
      golf: 70,
    }
    return fallbackTotals[sport as keyof typeof fallbackTotals] || 220
  }

  return totalScores.reduce((a, b) => a + b, 0) / totalScores.length
}

function getScoreUnit(sport: string) {
  const units = {
    basketball: 'points',
    football: 'points',
    baseball: 'runs',
    hockey: 'goals',
    soccer: 'goals',
    tennis: 'games',
    golf: 'strokes',
  }
  return units[sport as keyof typeof units] || 'units'
}

function calculateStreaks(gamesData: any[], team: string) {
  let currentStreak = 0
  let streakType = 'win'

  // Sort games by date (most recent first)
  const sortedGames = [...gamesData].sort(
    (a, b) => new Date(b.game_date).getTime() - new Date(a.game_date).getTime()
  )

  for (const game of sortedGames) {
    if (team !== 'all') {
      const isHome = game.home_team?.name?.toLowerCase().includes(team.toLowerCase())
      const won =
        (isHome && game.home_score > game.away_score) ||
        (!isHome && game.away_score > game.home_score)

      if (currentStreak === 0) {
        streakType = won ? 'win' : 'loss'
        currentStreak = 1
      } else if ((won && streakType === 'win') || (!won && streakType === 'loss')) {
        currentStreak++
      } else {
        break
      }
    } else {
      // For "all" teams, just count consecutive home wins
      const homeWon = game.home_score > game.away_score
      if (currentStreak === 0) {
        streakType = homeWon ? 'win' : 'loss'
        currentStreak = 1
      } else if ((homeWon && streakType === 'win') || (!homeWon && streakType === 'loss')) {
        currentStreak++
      } else {
        break
      }
    }
  }

  return { currentStreak, streakType }
}
