/**
 * Data Validation Service
 * Ensures all components have access to the historical data they need
 */

import { createClient } from "@/lib/supabase/server"

export interface DataValidationResult {
  component: string
  hasRequiredData: boolean
  missingData: string[]
  recommendations: string[]
  dataQuality: 'excellent' | 'good' | 'fair' | 'poor'
}

export class DataValidationService {
  private supabase: any = null

  constructor() {
    this.initializeSupabase()
  }

  private async initializeSupabase() {
    this.supabase = await createClient()
  }

  async validateComponentDataAccess(component: string, params: any = {}): Promise<DataValidationResult> {
    const result: DataValidationResult = {
      component,
      hasRequiredData: true,
      missingData: [],
      recommendations: [],
      dataQuality: 'excellent'
    }

    try {
      switch (component) {
        case 'PlayerStats':
          await this.validatePlayerStatsData(result, params)
          break
        case 'PlayerTrends':
          await this.validatePlayerTrendsData(result, params)
          break
        case 'PlayerComparison':
          await this.validatePlayerComparisonData(result, params)
          break
        case 'TeamPerformanceChart':
          await this.validateTeamPerformanceData(result, params)
          break
        case 'PlayerAnalytics':
          await this.validatePlayerAnalyticsData(result, params)
          break
        case 'TrendAnalysis':
          await this.validateTrendAnalysisData(result, params)
          break
        case 'OddsAnalysisChart':
          await this.validateOddsAnalysisData(result, params)
          break
        case 'DashboardOverview':
          await this.validateDashboardData(result, params)
          break
        default:
          result.missingData.push('Unknown component')
          result.hasRequiredData = false
      }
    } catch (error) {
      result.missingData.push(`Validation error: ${error}`)
      result.hasRequiredData = false
      result.dataQuality = 'poor'
    }

    return result
  }

  private async validatePlayerStatsData(result: DataValidationResult, params: any) {
    if (!this.supabase) {
      result.missingData.push('Database connection')
      result.hasRequiredData = false
      return
    }

    const { playerId, sport = 'basketball' } = params

    // Check if player exists
    if (playerId) {
      const { data: playerStats, error } = await this.supabase
        .from('player_stats')
        .select('id')
        .eq('player_id', playerId)
        .limit(1)

      if (error || !playerStats || playerStats.length === 0) {
        result.missingData.push('Player statistics')
        result.recommendations.push('Populate player stats data')
      }
    }

    // Check if sport-specific data exists
    const { data: sportStats, error: sportError } = await this.supabase
      .from(this.getStatsTableName(sport))
      .select('id')
      .limit(1)

    if (sportError || !sportStats || sportStats.length === 0) {
      result.missingData.push(`${sport} player statistics`)
      result.recommendations.push(`Populate ${sport} player stats data`)
    }

    // Check data recency
    const { data: recentStats, error: recentError } = await this.supabase
      .from(this.getStatsTableName(sport))
      .select('created_at')
      .order('created_at', { ascending: false })
      .limit(1)

    if (recentStats && recentStats.length > 0) {
      const lastUpdate = new Date(recentStats[0].created_at)
      const daysSinceUpdate = (Date.now() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24)
      
      if (daysSinceUpdate > 7) {
        result.recommendations.push('Update player stats data (last update > 7 days ago)')
        result.dataQuality = result.dataQuality === 'excellent' ? 'good' : result.dataQuality
      }
    }

    if (result.missingData.length > 0) {
      result.hasRequiredData = false
      result.dataQuality = 'poor'
    }
  }

  private async validatePlayerTrendsData(result: DataValidationResult, params: any) {
    if (!this.supabase) {
      result.missingData.push('Database connection')
      result.hasRequiredData = false
      return
    }

    const { playerId, playerName, sport = 'basketball' } = params

    // Check if player has enough historical data for trends
    const { data: playerStats, error } = await this.supabase
      .from(this.getStatsTableName(sport))
      .select('id, created_at')
      .or(`player_id.eq.${playerId},player_name.ilike.%${playerName}%`)
      .order('created_at', { ascending: false })

    if (error || !playerStats || playerStats.length < 5) {
      result.missingData.push('Sufficient player historical data for trend analysis')
      result.recommendations.push('Need at least 5 games of data for trend analysis')
      result.hasRequiredData = false
    }

    if (playerStats && playerStats.length < 10) {
      result.recommendations.push('More historical data recommended for better trend analysis')
      result.dataQuality = result.dataQuality === 'excellent' ? 'good' : result.dataQuality
    }
  }

  private async validatePlayerComparisonData(result: DataValidationResult, params: any) {
    if (!this.supabase) {
      result.missingData.push('Database connection')
      result.hasRequiredData = false
      return
    }

    const { player1Id, player2Id, sport = 'basketball' } = params

    // Check if both players have data
    const [player1Stats, player2Stats] = await Promise.all([
      this.supabase.from(this.getStatsTableName(sport)).select('id').eq('player_id', player1Id).limit(1),
      this.supabase.from(this.getStatsTableName(sport)).select('id').eq('player_id', player2Id).limit(1)
    ])

    if (!player1Stats.data || player1Stats.data.length === 0) {
      result.missingData.push('Player 1 statistics')
    }
    if (!player2Stats.data || player2Stats.data.length === 0) {
      result.missingData.push('Player 2 statistics')
    }

    if (result.missingData.length > 0) {
      result.hasRequiredData = false
      result.dataQuality = 'poor'
    }
  }

  private async validateTeamPerformanceData(result: DataValidationResult, params: any) {
    if (!this.supabase) {
      result.missingData.push('Database connection')
      result.hasRequiredData = false
      return
    }

    const { team, sport = 'basketball' } = params

    // Check if team has games data
    const { data: games, error } = await this.supabase
      .from('games')
      .select('id, home_score, away_score')
      .eq('sport', sport)
      .or(`home_team.name.ilike.%${team}%,away_team.name.ilike.%${team}%`)
      .not('home_score', 'is', null)
      .not('away_score', 'is', null)

    if (error || !games || games.length === 0) {
      result.missingData.push('Team game results')
      result.recommendations.push('Populate completed games data')
      result.hasRequiredData = false
    }

    if (games && games.length < 5) {
      result.recommendations.push('More game data recommended for accurate performance analysis')
      result.dataQuality = result.dataQuality === 'excellent' ? 'good' : result.dataQuality
    }
  }

  private async validatePlayerAnalyticsData(result: DataValidationResult, params: any) {
    if (!this.supabase) {
      result.missingData.push('Database connection')
      result.hasRequiredData = false
      return
    }

    const { team, sport = 'basketball' } = params

    // Check if team has player stats
    const { data: playerStats, error } = await this.supabase
      .from(this.getStatsTableName(sport))
      .select('id, player_name')
      .eq('team_id', team)

    if (error || !playerStats || playerStats.length === 0) {
      result.missingData.push('Team player statistics')
      result.recommendations.push('Populate player stats for the team')
      result.hasRequiredData = false
    }

    if (playerStats && playerStats.length < 3) {
      result.recommendations.push('More players needed for meaningful analytics')
      result.dataQuality = result.dataQuality === 'excellent' ? 'good' : result.dataQuality
    }
  }

  private async validateTrendAnalysisData(result: DataValidationResult, params: any) {
    if (!this.supabase) {
      result.missingData.push('Database connection')
      result.hasRequiredData = false
      return
    }

    const { team, sport = 'basketball' } = params

    // Check if there's enough historical data for trend analysis
    const { data: games, error } = await this.supabase
      .from('games')
      .select('id, game_date, home_score, away_score')
      .eq('sport', sport)
      .not('home_score', 'is', null)
      .not('away_score', 'is', null)
      .order('game_date', { ascending: false })

    if (error || !games || games.length < 10) {
      result.missingData.push('Sufficient historical game data for trend analysis')
      result.recommendations.push('Need at least 10 completed games for trend analysis')
      result.hasRequiredData = false
    }

    if (games && games.length < 20) {
      result.recommendations.push('More historical data recommended for better trend analysis')
      result.dataQuality = result.dataQuality === 'excellent' ? 'good' : result.dataQuality
    }
  }

  private async validateOddsAnalysisData(result: DataValidationResult, params: any) {
    if (!this.supabase) {
      result.missingData.push('Database connection')
      result.hasRequiredData = false
      return
    }

    const { team, sport = 'basketball' } = params

    // Check if odds data exists
    const { data: odds, error } = await this.supabase
      .from('odds')
      .select('id, timestamp')
      .eq('sport', sport)
      .order('timestamp', { ascending: false })

    if (error || !odds || odds.length === 0) {
      result.missingData.push('Odds data')
      result.recommendations.push('Populate odds data for analysis')
      result.hasRequiredData = false
    }

    if (odds && odds.length < 5) {
      result.recommendations.push('More odds data recommended for better analysis')
      result.dataQuality = result.dataQuality === 'excellent' ? 'good' : result.dataQuality
    }
  }

  private async validateDashboardData(result: DataValidationResult, params: any) {
    if (!this.supabase) {
      result.missingData.push('Database connection')
      result.hasRequiredData = false
      return
    }

    // Check if there are upcoming games
    const { data: upcomingGames, error: upcomingError } = await this.supabase
      .from('games')
      .select('id, game_date, status')
      .eq('status', 'scheduled')
      .gte('game_date', new Date().toISOString())

    if (upcomingError || !upcomingGames || upcomingGames.length === 0) {
      result.missingData.push('Upcoming games data')
      result.recommendations.push('Populate upcoming games schedule')
    }

    // Check if there are live games
    const { data: liveGames, error: liveError } = await this.supabase
      .from('games')
      .select('id, status')
      .eq('status', 'in_progress')

    if (liveError || !liveGames) {
      result.missingData.push('Live games data')
      result.recommendations.push('Implement live game updates')
    }

    if (result.missingData.length > 0) {
      result.hasRequiredData = false
      result.dataQuality = 'fair'
    }
  }

  private getStatsTableName(sport: string): string {
    switch (sport) {
      case 'football':
        return 'football_player_stats'
      case 'baseball':
        return 'baseball_player_stats'
      case 'hockey':
        return 'hockey_player_stats'
      case 'soccer':
        return 'soccer_player_stats'
      case 'tennis':
        return 'tennis_match_stats'
      case 'golf':
        return 'golf_tournament_stats'
      default:
        return 'player_stats'
    }
  }

  async validateAllComponents(): Promise<DataValidationResult[]> {
    const components = [
      'PlayerStats',
      'PlayerTrends',
      'PlayerComparison',
      'TeamPerformanceChart',
      'PlayerAnalytics',
      'TrendAnalysis',
      'OddsAnalysisChart',
      'DashboardOverview'
    ]

    const results = await Promise.all(
      components.map(component => this.validateComponentDataAccess(component))
    )

    return results
  }

  async getDataPopulationRecommendations(): Promise<string[]> {
    const recommendations: string[] = []
    
    if (!this.supabase) {
      recommendations.push('Initialize database connection')
      return recommendations
    }

    // Check each sport for data completeness
    const sports = ['basketball', 'football', 'baseball', 'hockey', 'soccer', 'tennis', 'golf']
    
    for (const sport of sports) {
      const { data: teams } = await this.supabase
        .from('teams')
        .select('id')
        .eq('sport', sport)
        .limit(1)

      if (!teams || teams.length === 0) {
        recommendations.push(`Populate ${sport} teams data`)
      }

      const { data: games } = await this.supabase
        .from('games')
        .select('id')
        .eq('sport', sport)
        .limit(1)

      if (!games || games.length === 0) {
        recommendations.push(`Populate ${sport} games data`)
      }

      const statsTable = this.getStatsTableName(sport)
      const { data: stats } = await this.supabase
        .from(statsTable)
        .select('id')
        .limit(1)

      if (!stats || stats.length === 0) {
        recommendations.push(`Populate ${sport} player statistics`)
      }
    }

    return recommendations
  }
}

// Lazy-loaded service to avoid build-time initialization
let _dataValidationService: DataValidationService | null = null

export function getDataValidationService(): DataValidationService {
  if (!_dataValidationService) {
    _dataValidationService = new DataValidationService()
  }
  return _dataValidationService
}
