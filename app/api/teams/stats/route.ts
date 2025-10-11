import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { SeasonManager } from '@/lib/services/core/season-manager'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    if (!supabase) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 })
    }

    const { searchParams } = new URL(request.url)
    const teamId = searchParams.get('team_id')
    const league = searchParams.get('league')
    const sport = searchParams.get('sport')
    const requestedSeason = searchParams.get('season')
    const season =
      requestedSeason ||
      (sport ? await SeasonManager.getCurrentSeason(sport) : new Date().getFullYear().toString())

    // Get games for the team or league
    let query = supabase
      .from('games')
      .select(
        `
        *,
        home_team:teams!games_home_team_id_fkey(id, name, abbreviation),
        away_team:teams!games_away_team_id_fkey(id, name, abbreviation)
      `
      )
      .eq('season', season)
      .in('status', ['completed', 'in_progress'])

    if (teamId) {
      query = query.or(`home_team_id.eq.${teamId},away_team_id.eq.${teamId}`)
    }

    const { data: games, error: gamesError } = await query

    if (gamesError) {
      console.error('Error fetching games:', gamesError)
      return NextResponse.json({ error: 'Failed to fetch games' }, { status: 500 })
    }

    if (!games || games.length === 0) {
      return NextResponse.json([])
    }

    // Get all teams for the league/sport if no specific team
    let teams
    if (teamId) {
      const { data: team } = await supabase.from('teams').select('*').eq('id', teamId).single()
      teams = team ? [team] : []
    } else {
      let teamsQuery = supabase.from('teams').select('*')

      if (league) {
        teamsQuery = teamsQuery.eq('league_name', league)
      }
      if (sport) {
        teamsQuery = teamsQuery.eq('sport', sport)
      }

      const { data: allTeams } = await teamsQuery
      teams = allTeams || []
    }

    // Dynamic stats calculation - works for any sport
    const calculateTeamStats = (team: any, teamGames: any[], _sport: string) => {
      const completedGames = teamGames.filter(
        game => game.status === 'completed' && game.home_score !== null && game.away_score !== null
      )

      if (completedGames.length === 0) {
        return [
          { category: 'Games Played', value: '0', rank: 1, trend: 'up' },
          { category: 'Wins', value: '0', rank: 1, trend: 'up' },
          { category: 'Losses', value: '0', rank: 1, trend: 'down' },
          { category: 'Win %', value: '0.0%', rank: 1, trend: 'up' },
          { category: 'Average Score', value: '0.0', rank: 1, trend: 'up' },
        ]
      }

      // Calculate wins and losses
      let wins = 0
      let totalScore = 0
      let totalOpponentScore = 0

      completedGames.forEach(game => {
        const isHomeTeam = game.home_team_id === team.id
        const teamScore = isHomeTeam ? game.home_score : game.away_score
        const opponentScore = isHomeTeam ? game.away_score : game.home_score

        totalScore += teamScore
        totalOpponentScore += opponentScore

        if (teamScore > opponentScore) {
          wins++
        }
      })

      const losses = completedGames.length - wins
      const winPercentage = (wins / completedGames.length) * 100
      const averageScore = totalScore / completedGames.length
      const averageOpponentScore = totalOpponentScore / completedGames.length
      const scoreDifferential = averageScore - averageOpponentScore

      // Dynamic stats based on actual data - no hardcoded sport logic
      const stats = [
        { category: 'Games Played', value: completedGames.length.toString(), rank: 1, trend: 'up' },
        { category: 'Wins', value: wins.toString(), rank: 1, trend: 'up' },
        { category: 'Losses', value: losses.toString(), rank: 1, trend: 'down' },
        { category: 'Win %', value: `${winPercentage.toFixed(1)}%`, rank: 1, trend: 'up' },
        { category: 'Average Score', value: averageScore.toFixed(1), rank: 1, trend: 'up' },
        {
          category: 'Average Allowed',
          value: averageOpponentScore.toFixed(1),
          rank: 1,
          trend: 'down',
        },
        {
          category: 'Score Differential',
          value: scoreDifferential.toFixed(1),
          rank: 1,
          trend: scoreDifferential > 0 ? 'up' : 'down',
        },
      ]

      // Sport-specific stats removed - columns don't exist in database

      // Possession stats removed - columns don't exist in database

      return stats
    }

    // Calculate stats for each team using dynamic calculation
    const teamStats = teams.map(team => {
      const teamGames = games.filter(
        game => game.home_team_id === team.id || game.away_team_id === team.id
      )

      const teamSport = team.sport || (sport ?? null)
      const stats = calculateTeamStats(team, teamGames, teamSport)

      // Calculate total score for display
      const completedGames = teamGames.filter(
        game => game.status === 'completed' && game.home_score !== null && game.away_score !== null
      )

      let totalScore = 0
      completedGames.forEach(game => {
        const isHomeTeam = game.home_team_id === team.id
        const teamScore = isHomeTeam ? game.home_score : game.away_score
        totalScore += teamScore
      })

      return {
        teamId: team.id,
        teamName: team.name,
        teamAbbreviation: team.abbreviation,
        sport: team.sport,
        league: team.league_name,
        gamesPlayed: completedGames.length,
        totalScore,
        stats,
      }
    })

    return NextResponse.json(teamStats)
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
