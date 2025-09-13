/**
 * REAL TEAM STATS API
 * Provides actual team statistics instead of random generation
 */

import { NextRequest, NextResponse } from 'next/server'
import { serviceFactory, SupportedSport } from '@/lib/services/core/service-factory'
import { SeasonManager } from '@/lib/services/core/season-manager'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const teamId = searchParams.get("teamId")
    const sport = searchParams.get("sport")
    
    if (!sport) {
      return NextResponse.json({
        success: false,
        error: "Sport parameter is required"
      }, { status: 400 })
    }
    const season = searchParams.get("season") || (await SeasonManager.getCurrentSeason(sport))
    const league = searchParams.get("league") || undefined
    
    if (!teamId) {
      return NextResponse.json({ 
        success: false,
        error: "Team ID is required" 
      }, { status: 400 })
    }

    // Validate sport
    if (!serviceFactory.isSportSupported(sport as SupportedSport)) {
      return NextResponse.json({
        success: false,
        error: `Unsupported sport: ${sport}. Supported sports: ${(await serviceFactory.getSupportedSports()).join(', ')}`
      }, { status: 400 })
    }

    // Get sport-specific service
    const sportService = await serviceFactory.getService(sport as SupportedSport, league)
    
    // Get real team data and stats
    const [team, games, players] = await Promise.all([
      sportService.getTeamById?.(teamId) || Promise.resolve(null),
      sportService.getGames({ 
        teamId, 
        season, 
        limit: 50,
        status: 'completed' 
      }),
      sportService.getPlayers?.({ teamId, limit: 20 }) || Promise.resolve([])
    ])

    if (!team) {
      return NextResponse.json({
        success: false,
        error: "Team not found"
      }, { status: 404 })
    }

    // Calculate real team statistics dynamically
    const stats = await calculateTeamStats(sport, team, games, players)
    
    return NextResponse.json({
      success: true,
      team: {
        id: team.id,
        name: team.name,
        abbreviation: team.abbreviation,
        city: team.city,
        logo: (team as any).logo_url || (team as any).logo || null
      },
      sport,
      season,
      stats,
      meta: {
        games_analyzed: games.length,
        players_analyzed: players.length,
        season_active: await SeasonManager.isSeasonActive(sport, await season),
        last_updated: new Date().toISOString()
      }
    })
    
  } catch (error) {
    console.error('Real team stats API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch team stats'
    }, { status: 500 })
  }
}

/**
 * Calculate real team statistics based on actual data dynamically
 */
async function calculateTeamStats(sport: string, team: any, games: any[], players: any[]) {
  const completedGames = games.filter(g => g.status === 'completed')
  const wins = completedGames.filter(g => {
    if (g.home_team_id === team.id) {
      return g.home_score > g.away_score
    } else {
      return g.away_score > g.home_score
    }
  }).length
  
  const losses = completedGames.length - wins
  const winPercentage = completedGames.length > 0 ? (wins / completedGames.length) * 100 : 0
  
  // Get sport configuration to determine statistics to calculate
  try {
    const { SportConfigManager } = await import('@/lib/services/core/sport-config')
    const sportConfig = await SportConfigManager.getSportConfigAsync(sport)
    
    if (sportConfig?.scoringFields) {
      return calculateSportSpecificStats(team, completedGames, players, wins, losses, winPercentage, sportConfig.scoringFields)
    }
  } catch (error) {
    console.error(`Error getting sport config for ${sport}:`, error)
  }
  
  // Fallback to generic statistics
  return calculateGenericStats(team, completedGames, players, wins, losses, winPercentage)
}

/**
 * Calculate sport-specific statistics based on configuration
 */
function calculateSportSpecificStats(team: any, games: any[], _players: any[], wins: number, losses: number, winPercentage: number, scoringFields: any) {
  const primaryField = scoringFields.primary || 'score'
  const forField = scoringFields.for || `${primaryField}For`
  const againstField = scoringFields.against || `${primaryField}Against`
  
  const totalFor = games.reduce((sum, game) => {
    if (game.home_team_id === team.id) {
      return sum + (game.home_score || 0)
    } else {
      return sum + (game.away_score || 0)
    }
  }, 0)
  
  const totalAgainst = games.reduce((sum, game) => {
    if (game.home_team_id === team.id) {
      return sum + (game.away_score || 0)
    } else {
      return sum + (game.home_score || 0)
    }
  }, 0)
  
  const avgFor = games.length > 0 ? totalFor / games.length : 0
  const avgAgainst = games.length > 0 ? totalAgainst / games.length : 0
  const differential = avgFor - avgAgainst
  
  return [
    { category: "Wins", value: wins.toString(), rank: 1, trend: "up" },
    { category: "Losses", value: losses.toString(), rank: 1, trend: "down" },
    { category: "Win %", value: `${winPercentage.toFixed(1)}%`, rank: 1, trend: "up" },
    { category: `${forField} Per Game`, value: avgFor.toFixed(1), rank: 1, trend: "up" },
    { category: `${againstField} Per Game`, value: avgAgainst.toFixed(1), rank: 1, trend: "down" },
    { category: "Differential", value: differential.toFixed(1), rank: 1, trend: differential > 0 ? "up" : "down" }
  ]
}


function calculateGenericStats(_team: any, games: any[], players: any[], wins: number, losses: number, winPercentage: number) {
  return [
    { category: "Wins", value: wins.toString(), rank: 1, trend: "up" },
    { category: "Losses", value: losses.toString(), rank: 1, trend: "down" },
    { category: "Win %", value: `${winPercentage.toFixed(1)}%`, rank: 1, trend: "up" },
    { category: "Games Played", value: games.length.toString(), rank: 1, trend: "up" },
    { category: "Players", value: players.length.toString(), rank: 1, trend: "up" }
  ]
}
