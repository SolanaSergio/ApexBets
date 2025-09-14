/**
 * DYNAMIC SPORT CONFIGURATION SERVICE
 * Replaces all hardcoded sport-specific logic with dynamic database-driven configuration
 */

// Note: This will be replaced with actual Supabase MCP integration
// For now, we'll use a placeholder that will be implemented with the actual MCP tools

export interface DynamicSportConfig {
  id: string
  name: string
  displayName: string
  icon: string
  color: string
  isActive: boolean
  dataSource: string
  apiKey?: string
  playerStatsTable: string
  positions: string[]
  scoringFields: {
    primary: string
    for: string
    against: string
  }
  bettingMarkets: {
    id: string
    name: string
    description: string
  }[]
  seasonConfig: {
    startMonth: number
    endMonth: number
    seasonYearOffset?: number
  }
  rateLimits: {
    requestsPerMinute: number
    requestsPerHour: number
    requestsPerDay: number
    burstLimit: number
  }
  updateFrequency: number
}

export interface SportStatsColumns {
  tableName: string
  columns: string
  primaryStat: string
  statFields: Record<string, string>
}

export class DynamicSportConfigService {
  private static configs: Map<string, DynamicSportConfig> = new Map()
  private static initialized = false
  private static projectId: string | null = null

  /**
   * Initialize the service with Supabase project ID
   */
  static async initialize(projectId: string): Promise<void> {
    if (this.initialized && this.projectId === projectId) return
    
    this.projectId = projectId
    await this.loadConfigurations()
    this.initialized = true
  }

  /**
   * Load all sport configurations from database
   */
  private static async loadConfigurations(): Promise<void> {
    if (!this.projectId) {
      throw new Error('Project ID not set. Call initialize() first.')
    }

    try {
      // This will be implemented with actual MCP tools in the calling context
      // For now, we'll use a fallback configuration
      this.configs.clear()
      
      // Default configurations for supported sports
      const defaultConfigs: DynamicSportConfig[] = [
        {
          id: 'basketball',
          name: 'basketball',
          displayName: 'Basketball',
          icon: 'activity',
          color: 'text-cyan-500',
          isActive: true,
          dataSource: 'sportsdb',
          playerStatsTable: 'player_stats',
          positions: ['PG', 'SG', 'SF', 'PF', 'C'],
          scoringFields: { primary: 'points', for: 'points', against: 'points' },
          bettingMarkets: [
            { id: 'moneyline', name: 'Moneyline', description: 'Win/Loss' },
            { id: 'spread', name: 'Point Spread', description: 'Point difference' },
            { id: 'total', name: 'Total Points', description: 'Over/Under points' }
          ],
          seasonConfig: { startMonth: 9, endMonth: 5, seasonYearOffset: 0 },
          rateLimits: { requestsPerMinute: 30, requestsPerHour: 500, requestsPerDay: 5000, burstLimit: 5 },
          updateFrequency: 30
        },
        {
          id: 'football',
          name: 'football',
          displayName: 'American Football',
          icon: 'zap',
          color: 'text-purple-600',
          isActive: true,
          dataSource: 'sportsdb',
          playerStatsTable: 'football_player_stats',
          positions: ['QB', 'RB', 'WR', 'TE', 'OL', 'DL', 'LB', 'CB', 'S', 'K', 'P'],
          scoringFields: { primary: 'points', for: 'points', against: 'points' },
          bettingMarkets: [
            { id: 'moneyline', name: 'Moneyline', description: 'Win/Loss' },
            { id: 'spread', name: 'Point Spread', description: 'Point difference' },
            { id: 'total', name: 'Total Points', description: 'Over/Under points' }
          ],
          seasonConfig: { startMonth: 8, endMonth: 1, seasonYearOffset: 0 },
          rateLimits: { requestsPerMinute: 30, requestsPerHour: 500, requestsPerDay: 5000, burstLimit: 5 },
          updateFrequency: 30
        },
        {
          id: 'baseball',
          name: 'baseball',
          displayName: 'Baseball',
          icon: 'target',
          color: 'text-green-600',
          isActive: true,
          dataSource: 'sportsdb',
          playerStatsTable: 'baseball_player_stats',
          positions: ['C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF', 'P', 'DH'],
          scoringFields: { primary: 'runs', for: 'runs', against: 'runs' },
          bettingMarkets: [
            { id: 'moneyline', name: 'Moneyline', description: 'Win/Loss' },
            { id: 'runline', name: 'Run Line', description: 'Run difference' },
            { id: 'total', name: 'Total Runs', description: 'Over/Under runs' }
          ],
          seasonConfig: { startMonth: 2, endMonth: 10, seasonYearOffset: 0 },
          rateLimits: { requestsPerMinute: 30, requestsPerHour: 500, requestsPerDay: 5000, burstLimit: 5 },
          updateFrequency: 30
        },
        {
          id: 'hockey',
          name: 'hockey',
          displayName: 'Ice Hockey',
          icon: 'gamepad-2',
          color: 'text-blue-500',
          isActive: true,
          dataSource: 'sportsdb',
          playerStatsTable: 'hockey_player_stats',
          positions: ['C', 'LW', 'RW', 'D', 'G'],
          scoringFields: { primary: 'goals', for: 'goals', against: 'goals' },
          bettingMarkets: [
            { id: 'moneyline', name: 'Moneyline', description: 'Win/Loss' },
            { id: 'puckline', name: 'Puck Line', description: 'Goal difference' },
            { id: 'total', name: 'Total Goals', description: 'Over/Under goals' }
          ],
          seasonConfig: { startMonth: 9, endMonth: 5, seasonYearOffset: 0 },
          rateLimits: { requestsPerMinute: 30, requestsPerHour: 500, requestsPerDay: 5000, burstLimit: 5 },
          updateFrequency: 30
        },
        {
          id: 'soccer',
          name: 'soccer',
          displayName: 'Soccer',
          icon: 'trophy',
          color: 'text-emerald-500',
          isActive: true,
          dataSource: 'sportsdb',
          playerStatsTable: 'soccer_player_stats',
          positions: ['GK', 'CB', 'LB', 'RB', 'CDM', 'CM', 'CAM', 'LW', 'RW', 'ST'],
          scoringFields: { primary: 'goals', for: 'goals', against: 'goals' },
          bettingMarkets: [
            { id: 'moneyline', name: 'Moneyline', description: 'Win/Loss/Draw' },
            { id: 'spread', name: 'Asian Handicap', description: 'Goal difference' },
            { id: 'total', name: 'Total Goals', description: 'Over/Under goals' }
          ],
          seasonConfig: { startMonth: 7, endMonth: 5, seasonYearOffset: 0 },
          rateLimits: { requestsPerMinute: 30, requestsPerHour: 500, requestsPerDay: 5000, burstLimit: 5 },
          updateFrequency: 30
        }
      ]

      for (const config of defaultConfigs) {
        this.configs.set(config.name, config)
      }
    } catch (error) {
      console.error('Failed to load sport configurations:', error)
      throw error
    }
  }

  /**
   * Get sport configuration by name
   */
  static getSportConfig(sport: string): DynamicSportConfig | null {
    if (!this.initialized) {
      throw new Error('Service not initialized. Call initialize() first.')
    }
    return this.configs.get(sport) || null
  }

  /**
   * Get all active sports
   */
  static getAllSports(): string[] {
    if (!this.initialized) {
      throw new Error('Service not initialized. Call initialize() first.')
    }
    return Array.from(this.configs.keys())
  }

  /**
   * Get sport configuration for stats columns
   */
  static getSportStatsColumns(sport: string): SportStatsColumns {
    const config = this.getSportConfig(sport)
    if (!config) {
      throw new Error(`Sport '${sport}' not found or not active`)
    }

    // Get dynamic column configuration based on sport
    const statFields = this.getStatFieldsForSport(sport)
    const columns = this.buildColumnsString(statFields)
    const primaryStat = config.scoringFields.primary

    return {
      tableName: config.playerStatsTable,
      columns,
      primaryStat,
      statFields
    }
  }

  /**
   * Get stat fields configuration for a sport
   */
  private static getStatFieldsForSport(sport: string): Record<string, string> {
    const config = this.getSportConfig(sport)
    if (!config) {
      return {}
    }

    // Return sport-specific stat field mappings
    switch (sport) {
      case 'basketball':
        return {
          points: 'points',
          rebounds: 'rebounds',
          assists: 'assists',
          steals: 'steals',
          blocks: 'blocks',
          fgm: 'field_goals_made',
          fga: 'field_goals_attempted',
          fg3m: 'three_pointers_made',
          fg3a: 'three_pointers_attempted',
          ftm: 'free_throws_made',
          fta: 'free_throws_attempted',
          minutes: 'minutes_played'
        }
      case 'football':
        return {
          passingYards: 'passing_yards',
          passingTDs: 'passing_touchdowns',
          rushingYards: 'rushing_yards',
          rushingTDs: 'rushing_touchdowns',
          receivingYards: 'receiving_yards',
          receivingTDs: 'receiving_touchdowns',
          receptions: 'receptions',
          tackles: 'tackles',
          sacks: 'sacks',
          interceptions: 'interceptions'
        }
      case 'baseball':
        return {
          atBats: 'at_bats',
          hits: 'hits',
          runs: 'runs',
          rbi: 'rbi',
          homeRuns: 'home_runs',
          doubles: 'doubles',
          triples: 'triples',
          walks: 'walks',
          strikeouts: 'strikeouts',
          battingAvg: 'batting_average'
        }
      case 'hockey':
        return {
          goals: 'goals',
          assists: 'assists',
          points: 'points',
          plusMinus: 'plus_minus',
          penaltyMinutes: 'penalty_minutes',
          shots: 'shots',
          hits: 'hits',
          blockedShots: 'blocked_shots'
        }
      case 'soccer':
        return {
          goals: 'goals',
          assists: 'assists',
          shots: 'shots',
          shotsOnTarget: 'shots_on_target',
          passes: 'passes',
          passesCompleted: 'passes_completed',
          tackles: 'tackles',
          interceptions: 'interceptions'
        }
      default:
        return {}
    }
  }

  /**
   * Build columns string for SQL query
   */
  private static buildColumnsString(statFields: Record<string, string>): string {
    const baseColumns = ['player_name', 'position', 'created_at']
    const statColumns = Object.values(statFields)
    return [...baseColumns, ...statColumns].join(',\n      ')
  }

  /**
   * Get positions for a sport
   */
  static getPositionsForSport(sport: string): string[] {
    const config = this.getSportConfig(sport)
    return config?.positions || []
  }

  /**
   * Get betting markets for a sport
   */
  static getBettingMarkets(sport: string): { id: string; name: string; description: string }[] {
    const config = this.getSportConfig(sport)
    return config?.bettingMarkets || []
  }

  /**
   * Get current season for a sport
   */
  static getCurrentSeason(sport: string): string {
    const config = this.getSportConfig(sport)
    if (!config) {
      return new Date().getFullYear().toString()
    }

    const { startMonth, seasonYearOffset = 0 } = config.seasonConfig
    const year = new Date().getFullYear()
    const month = new Date().getMonth()
    
    // If current month is before start month, we're in the previous year's season
    if (month < startMonth) {
      return (year - 1 + seasonYearOffset).toString()
    }
    
    return (year + seasonYearOffset).toString()
  }

  /**
   * Get rate limits for a sport
   */
  static getRateLimits(sport: string): { requestsPerMinute: number; requestsPerHour: number; requestsPerDay: number; burstLimit: number } {
    const config = this.getSportConfig(sport)
    return config?.rateLimits || {
      requestsPerMinute: 30,
      requestsPerHour: 500,
      requestsPerDay: 5000,
      burstLimit: 5
    }
  }

  /**
   * Get update frequency for a sport
   */
  static getUpdateFrequency(sport: string): number {
    const config = this.getSportConfig(sport)
    return config?.updateFrequency || 30
  }

  /**
   * Check if sport is supported
   */
  static isSportSupported(sport: string): boolean {
    return this.configs.has(sport)
  }

  /**
   * Refresh configurations from database
   */
  static async refresh(): Promise<void> {
    if (!this.projectId) {
      throw new Error('Project ID not set. Call initialize() first.')
    }
    await this.loadConfigurations()
  }

  /**
   * Get all sport configurations
   */
  static getAllConfigs(): DynamicSportConfig[] {
    if (!this.initialized) {
      throw new Error('Service not initialized. Call initialize() first.')
    }
    return Array.from(this.configs.values())
  }
}
