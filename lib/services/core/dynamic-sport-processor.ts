/**
 * DYNAMIC SPORT PROCESSOR
 * Handles sport-specific data processing without hardcoded sport names
 */

import { DynamicSportConfigService } from './dynamic-sport-config'

export interface PlayerPerformance {
  name: string
  position: string
  games: number
  stats: Record<string, number>
  averages: Record<string, string>
  totalStats: Record<string, number>
  team: string
}

export interface PlayerTrend {
  playerName: string
  stat: string
  currentValue: number
  previousValue: number
  change: number
  changePercentage: number
  trend: 'up' | 'down' | 'stable'
}

export class DynamicSportProcessor {
  // private static projectId: string | null = null

  /**
   * Initialize with project ID
   */
  static async initialize(projectId: string): Promise<void> {
    this.projectId = projectId
    await DynamicSportConfigService.initialize(projectId)
  }

  /**
   * Process player performance data dynamically based on sport configuration
   */
  static processPlayerPerformance(playerStats: any[], sport: string): PlayerPerformance[] {
    const config = DynamicSportConfigService.getSportConfig(sport)
    if (!config) {
      console.warn(`Sport '${sport}' not found in configuration`)
      return []
    }

    const playerMap: Record<string, any> = {}
    
    playerStats.forEach(stat => {
      const playerName = stat.player_name
      if (!playerName) return
      
      if (!playerMap[playerName]) {
        playerMap[playerName] = {
          name: playerName,
          position: stat.position,
          games: 0,
          stats: {},
          team: stat.games?.home_team?.name || stat.games?.away_team?.name || 'Unknown'
        }
      }
      
      playerMap[playerName].games++
      
      // Aggregate stats using dynamic field mapping
      const statFields = DynamicSportConfigService.getSportStatsColumns(sport).statFields
      this.aggregatePlayerStats(playerMap[playerName], stat, statFields)
    })
    
    // Calculate averages and format results
    return Object.values(playerMap).map((player: any) => {
      const games = player.games
      const stats = player.stats
      
      const averages = this.calculateAverages(stats, games, sport)
      
      return {
        ...player,
        averages,
        totalStats: stats
      }
    }).sort((a: any, b: any) => {
      // Sort by primary stat
      const primaryStat = DynamicSportConfigService.getSportStatsColumns(sport).primaryStat
      const aValue = parseFloat(a.averages?.[primaryStat] || '0')
      const bValue = parseFloat(b.averages?.[primaryStat] || '0')
      return bValue - aValue
    }).slice(0, 20) // Top 20 performers
  }

  /**
   * Aggregate player statistics using dynamic field mapping
   */
  private static aggregatePlayerStats(player: any, stat: any, statFields: Record<string, string>): void {
    Object.entries(statFields).forEach(([displayName, dbField]) => {
      const value = stat[dbField] || 0
      player.stats[displayName] = (player.stats[displayName] || 0) + value
    })
  }

  /**
   * Calculate averages based on sport configuration
   */
  private static calculateAverages(stats: Record<string, number>, games: number, sport: string): Record<string, string> {
    const averages: Record<string, string> = {}
    
    if (games === 0) {
      return averages
    }

    // const statFields = DynamicSportConfigService.getSportStatsColumns(sport).statFields
    
    Object.entries(stats).forEach(([statName, total]) => {
      if (statName === 'battingAvg' || statName === 'onBasePercentage' || statName === 'sluggingPercentage') {
        // These are already percentages, don't divide by games
        averages[statName] = total.toFixed(3)
      } else if (statName.includes('Pct') || statName.includes('Percentage')) {
        // Percentage stats
        averages[statName] = total.toFixed(1)
      } else {
        // Regular stats - calculate per game average
        averages[statName] = (total / games).toFixed(1)
      }
    })

    return averages
  }

  /**
   * Process player trends dynamically
   */
  static processPlayerTrends(playerStats: any[], sport: string): PlayerTrend[] {
    if (playerStats.length === 0) return []
    
    const config = DynamicSportConfigService.getSportConfig(sport)
    if (!config) return []
    
    const trends: PlayerTrend[] = []
    const recentGames = playerStats.slice(-10) // Last 10 games
    const previousGames = playerStats.slice(-20, -10) // Previous 10 games
    
    if (recentGames.length === 0) return []
    
    const statFields = DynamicSportConfigService.getSportStatsColumns(sport).statFields
    
    // Calculate trends for each stat field
    Object.entries(statFields).forEach(([displayName, dbField]) => {
      const recentAvg = this.calculateAverageForStat(recentGames, dbField)
      const previousAvg = this.calculateAverageForStat(previousGames, dbField)
      
      if (recentAvg > 0 || previousAvg > 0) {
        const change = recentAvg - previousAvg
        const changePercentage = previousAvg > 0 ? (change / previousAvg) * 100 : 0
        const trend: 'up' | 'down' | 'stable' = 
          changePercentage > 5 ? 'up' : 
          changePercentage < -5 ? 'down' : 'stable'
        
        trends.push({
          playerName: recentGames[0]?.player_name || 'Unknown',
          stat: displayName,
          currentValue: recentAvg,
          previousValue: previousAvg,
          change,
          changePercentage,
          trend
        })
      }
    })
    
    return trends
  }

  /**
   * Calculate average for a specific stat across games
   */
  private static calculateAverageForStat(games: any[], statField: string): number {
    if (games.length === 0) return 0
    
    const total = games.reduce((sum, game) => sum + (game[statField] || 0), 0)
    return total / games.length
  }

  /**
   * Get sport-specific stat processing configuration
   */
  static getSportStatConfig(sport: string): {
    primaryStat: string
    statFields: Record<string, string>
    tableName: string
  } {
    const config = DynamicSportConfigService.getSportStatsColumns(sport)
    return {
      primaryStat: config.primaryStat,
      statFields: config.statFields,
      tableName: config.tableName
    }
  }

  /**
   * Validate sport configuration
   */
  static validateSportConfig(sport: string): boolean {
    return DynamicSportConfigService.isSportSupported(sport)
  }

  /**
   * Get all supported sports
   */
  static getSupportedSports(): string[] {
    return DynamicSportConfigService.getAllSports()
  }

  /**
   * Get sport display information
   */
  static getSportDisplayInfo(sport: string): {
    displayName: string
    icon: string
    color: string
  } | null {
    const config = DynamicSportConfigService.getSportConfig(sport)
    if (!config) return null
    
    return {
      displayName: config.displayName,
      icon: config.icon,
      color: config.color
    }
  }
}
