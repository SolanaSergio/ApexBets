/**
 * ANALYTICS TRENDS API
 * Provides real trend data instead of random generation
 */

import { NextRequest, NextResponse } from 'next/server'
import { serviceFactory, SupportedSport } from '@/lib/services/core/service-factory'
import { SeasonManager } from '@/lib/services/core/season-manager'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sport = searchParams.get('sport')
    
    if (!sport) {
      return NextResponse.json({
        success: false,
        error: "Sport parameter is required"
      }, { status: 400 })
    }
    const league = searchParams.get('league') || undefined
    const season = searchParams.get('season') || await SeasonManager.getCurrentSeason(sport)
    
    // Validate sport
    if (!serviceFactory.isSportSupported(sport as SupportedSport)) {
      return NextResponse.json({
        success: false,
        error: `Unsupported sport: ${sport}. Supported sports: ${(await serviceFactory.getSupportedSports()).join(', ')}`,
        timestamp: new Date().toISOString()
      }, { status: 400 })
    }

    // Get sport-specific service
    const sportService = await serviceFactory.getService(sport as SupportedSport, league)
    
    // Get comprehensive data for trend analysis
    const [games, teamsData, playersData] = await Promise.all([
      sportService.getGames({ 
        season, 
        limit: 100, // Get more games for better trend calculation
        status: 'completed' 
      }),
      sportService.getTeams({ limit: 50 }),
      sportService.getPlayers({ limit: 100 })
    ])
    
    // Get predictions if available
    let predictions: any[] = []
    try {
      if ('getPredictions' in sportService && typeof sportService.getPredictions === 'function') {
        predictions = await sportService.getPredictions({ limit: 50 })
      }
    } catch (error) {
      console.warn('Predictions not available for this sport:', error)
    }

    // Get historical data for comparison (previous season)
    const previousSeason = SeasonManager.getPreviousSeason(sport, await season)
    const [historicalGames, historicalTeams] = await Promise.all([
      sportService.getGames({ 
        season: previousSeason, 
        limit: 100,
        status: 'completed' 
      }).catch(() => []), // Gracefully handle if previous season data doesn't exist
      sportService.getTeams({ limit: 50 }).catch(() => [])
    ])

    // Calculate real trends with comprehensive data
    const trends = await calculateSportTrends(sport, games, teamsData, playersData, predictions, historicalGames, historicalTeams)
    
    return NextResponse.json({
      success: true,
      sport,
      league: league || serviceFactory.getDefaultLeague(sport as SupportedSport),
      season,
      trends: {
        volume: trends.volume,
        percentage_change: trends.percentageChange,
        trend_direction: trends.trendDirection,
        confidence: trends.confidence,
        data_points: trends.dataPoints,
        last_updated: new Date().toISOString()
      },
      meta: {
        games_analyzed: games.length,
        teams_analyzed: teamsData.length,
        players_analyzed: playersData.length,
        predictions_analyzed: predictions.length,
        historical_games: historicalGames.length,
        historical_teams: historicalTeams.length,
        season_active: await SeasonManager.isSeasonActive(sport, await season),
        previous_season: previousSeason,
        data_quality: calculateDataQuality(games, teamsData, playersData, predictions)
      }
    })
    
  } catch (error) {
    console.error('Analytics trends API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch trend data',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

/**
 * Calculate real trends based on actual data from games, teams, players, and predictions
 */
async function calculateSportTrends(
  sport: string, 
  games: any[], 
  teams: any[], 
  players: any[], 
  predictions: any[], 
  historicalGames: any[] = [],
  historicalTeams: any[] = []
) {
  // Calculate volume (total activity across all data sources)
  const volume = games.length + predictions.length + players.length
  
  // Calculate percentage change compared to historical data
  const historicalVolume = historicalGames.length + historicalTeams.length
  const percentageChange = historicalVolume > 0 
    ? ((volume - historicalVolume) / historicalVolume) * 100 
    : volume > 0 ? 100 : 0
  
  // Determine trend direction based on multiple factors
  let trendDirection: 'up' | 'down' | 'stable' = 'stable'
  
  // Factor 1: Volume change
  const volumeChange = percentageChange
  // Factor 2: Game completion rate
  const completionRate = games.length > 0 ? (games.filter(g => g.status === 'completed').length / games.length) * 100 : 0
  // Factor 3: Prediction accuracy (if available)
  const avgPredictionConfidence = predictions.length > 0 
    ? predictions.reduce((sum, p) => sum + (p.confidence || 0), 0) / predictions.length 
    : 0
  
  // Combined trend score
  const trendScore = (volumeChange * 0.4) + (completionRate * 0.3) + (avgPredictionConfidence * 0.3)
  
  if (trendScore > 10) {
    trendDirection = 'up'
  } else if (trendScore < -10) {
    trendDirection = 'down'
  }
  
  // Calculate confidence based on data quality and completeness
  const dataCompleteness = calculateDataCompleteness(games, teams, players, predictions)
  const dataConsistency = calculateDataConsistency(games, teams)
  const confidence = Math.min(95, Math.max(60, 
    (dataCompleteness * 40) + 
    (dataConsistency * 30) + 
    (Math.min(volume / 10, 30)) // Volume bonus capped at 30
  ))
  
  // Calculate comprehensive data points
  const dataPoints = {
    total_games: games.length,
    completed_games: games.filter(g => g.status === 'completed').length,
    live_games: games.filter(g => g.status === 'live').length,
    upcoming_games: games.filter(g => g.status === 'scheduled').length,
    total_predictions: predictions.length,
    total_teams: teams.length,
    total_players: players.length,
    average_confidence: avgPredictionConfidence,
    data_completeness: dataCompleteness,
    data_consistency: dataConsistency,
    historical_comparison: {
      current_volume: volume,
      historical_volume: historicalVolume,
      volume_change: percentageChange
    },
    sport_specific_metrics: calculateSportSpecificMetrics(sport, games, teams, players)
  }
  
  return {
    volume,
    percentageChange: Math.round(percentageChange * 10) / 10,
    trendDirection,
    confidence: Math.round(confidence),
    dataPoints
  }
}

/**
 * Calculate data completeness score (0-100)
 */
function calculateDataCompleteness(games: any[], teams: any[], players: any[], predictions: any[]): number {
  let completenessScore = 0
  
  if (games.length > 0) completenessScore += 25
  if (teams.length > 0) completenessScore += 25
  if (players.length > 0) completenessScore += 25
  if (predictions.length > 0) completenessScore += 25
  
  return completenessScore
}

/**
 * Calculate data consistency score (0-100)
 */
function calculateDataConsistency(games: any[], teams: any[]): number {
  let consistencyScore = 100
  
  // Check for missing required fields in games
  const gamesWithCompleteData = games.filter(game => 
    game.home_team_id && 
    game.away_team_id && 
    game.home_score !== null && 
    game.away_score !== null
  ).length
  
  if (games.length > 0) {
    const gameConsistency = (gamesWithCompleteData / games.length) * 100
    consistencyScore = Math.min(consistencyScore, gameConsistency)
  }
  
  // Check for missing required fields in teams
  const teamsWithCompleteData = teams.filter(team => 
    team.name && 
    team.sport && 
    team.league
  ).length
  
  if (teams.length > 0) {
    const teamConsistency = (teamsWithCompleteData / teams.length) * 100
    consistencyScore = Math.min(consistencyScore, teamConsistency)
  }
  
  return Math.max(0, consistencyScore)
}

/**
 * Calculate sport-specific metrics
 */
function calculateSportSpecificMetrics(sport: string, games: any[], _teams: any[], _players: any[]): any {
  const metrics: any = {
    sport,
    average_score: 0,
    total_goals: 0,
    average_attendance: 0,
    competitive_balance: 0
  }
  
  if (games.length === 0) return metrics
  
  // Calculate average score across all games
  const completedGames = games.filter(g => g.status === 'completed' && g.home_score !== null && g.away_score !== null)
  if (completedGames.length > 0) {
    const totalScore = completedGames.reduce((sum, game) => sum + game.home_score + game.away_score, 0)
    metrics.average_score = Math.round((totalScore / completedGames.length) * 10) / 10
  }
  
  // Calculate competitive balance (standard deviation of scores)
  if (completedGames.length > 1) {
    const scores = completedGames.map(g => Math.abs(g.home_score - g.away_score))
    const mean = scores.reduce((sum, score) => sum + score, 0) / scores.length
    const variance = scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length
    metrics.competitive_balance = Math.round(Math.sqrt(variance) * 10) / 10
  }
  
  return metrics
}

/**
 * Calculate overall data quality score
 */
function calculateDataQuality(games: any[], teams: any[], players: any[], predictions: any[]): number {
  const completeness = calculateDataCompleteness(games, teams, players, predictions)
  const consistency = calculateDataConsistency(games, teams)
  
  return Math.round((completeness + consistency) / 2)
}