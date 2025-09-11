/**
 * SPORT CONFIGURATION
 * Centralized sport configuration without hardcoding
 */

export interface SportConfig {
  name: string
  leagues: string[]
  defaultLeague: string
  icon: string
  color: string
  apiKey: string
  dataSource: 'balldontlie' | 'sportsdb' | 'odds' | 'custom'
  positions: string[]
  rateLimits: {
    requestsPerMinute: number
    requestsPerHour: number
    requestsPerDay: number
    burstLimit: number
  }
  updateFrequency: number // minutes
}

export interface LeagueConfig {
  name: string
  displayName: string
  sport: string
  apiKey?: string
  dataSource: string
  season: string
  active: boolean
}

export class SportConfigManager {
  private static configs: Record<string, SportConfig> = {
    basketball: {
      name: 'Basketball',
      leagues: ['NBA', 'WNBA', 'NCAA', 'EuroLeague'],
      defaultLeague: 'NBA',
      icon: '🏀',
      color: 'text-orange-500',
      apiKey: 'BALLDONTLIE_API_KEY',
      dataSource: 'balldontlie',
      positions: ['PG', 'SG', 'SF', 'PF', 'C', 'G', 'F'],
      rateLimits: {
        requestsPerMinute: parseInt(process.env.BASKETBALL_RATE_LIMIT_MINUTE || '100'),
        requestsPerHour: parseInt(process.env.BASKETBALL_RATE_LIMIT_HOUR || '1000'),
        requestsPerDay: parseInt(process.env.BASKETBALL_RATE_LIMIT_DAY || '10000'),
        burstLimit: parseInt(process.env.BASKETBALL_BURST_LIMIT || '10')
      },
      updateFrequency: parseInt(process.env.BASKETBALL_UPDATE_FREQUENCY || '15')
    },
    football: {
      name: 'Football',
      leagues: ['NFL', 'NCAA', 'CFL'],
      defaultLeague: 'NFL',
      icon: '🏈',
      color: 'text-green-500',
      apiKey: 'SPORTSDB_API_KEY',
      dataSource: 'sportsdb',
      positions: ['QB', 'RB', 'WR', 'TE', 'OL', 'DL', 'LB', 'CB', 'S', 'K', 'P'],
      rateLimits: {
        requestsPerMinute: parseInt(process.env.FOOTBALL_RATE_LIMIT_MINUTE || '30'),
        requestsPerHour: parseInt(process.env.FOOTBALL_RATE_LIMIT_HOUR || '500'),
        requestsPerDay: parseInt(process.env.FOOTBALL_RATE_LIMIT_DAY || '5000'),
        burstLimit: parseInt(process.env.FOOTBALL_BURST_LIMIT || '5')
      },
      updateFrequency: parseInt(process.env.FOOTBALL_UPDATE_FREQUENCY || '30')
    },
    baseball: {
      name: 'Baseball',
      leagues: ['MLB', 'MiLB', 'NPB', 'KBO'],
      defaultLeague: 'MLB',
      icon: '⚾',
      color: 'text-blue-500',
      apiKey: 'SPORTSDB_API_KEY',
      dataSource: 'sportsdb',
      positions: ['P', 'C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF', 'DH'],
      rateLimits: {
        requestsPerMinute: parseInt(process.env.BASEBALL_RATE_LIMIT_MINUTE || '60'),
        requestsPerHour: parseInt(process.env.BASEBALL_RATE_LIMIT_HOUR || '1000'),
        requestsPerDay: parseInt(process.env.BASEBALL_RATE_LIMIT_DAY || '10000'),
        burstLimit: parseInt(process.env.BASEBALL_BURST_LIMIT || '8')
      },
      updateFrequency: parseInt(process.env.BASEBALL_UPDATE_FREQUENCY || '60')
    },
    hockey: {
      name: 'Hockey',
      leagues: ['NHL', 'AHL', 'KHL', 'SHL'],
      defaultLeague: 'NHL',
      icon: '🏒',
      color: 'text-red-500',
      apiKey: 'SPORTSDB_API_KEY',
      dataSource: 'sportsdb',
      positions: ['C', 'LW', 'RW', 'D', 'G'],
      rateLimits: {
        requestsPerMinute: parseInt(process.env.HOCKEY_RATE_LIMIT_MINUTE || '40'),
        requestsPerHour: parseInt(process.env.HOCKEY_RATE_LIMIT_HOUR || '800'),
        requestsPerDay: parseInt(process.env.HOCKEY_RATE_LIMIT_DAY || '8000'),
        burstLimit: parseInt(process.env.HOCKEY_BURST_LIMIT || '6')
      },
      updateFrequency: parseInt(process.env.HOCKEY_UPDATE_FREQUENCY || '30')
    },
    soccer: {
      name: 'Soccer',
      leagues: ['Premier League', 'La Liga', 'Bundesliga', 'Serie A', 'Ligue 1', 'Champions League'],
      defaultLeague: 'Premier League',
      icon: '⚽',
      color: 'text-emerald-500',
      apiKey: 'SPORTSDB_API_KEY',
      dataSource: 'sportsdb',
      positions: ['GK', 'CB', 'LB', 'RB', 'CDM', 'CM', 'CAM', 'LW', 'RW', 'ST'],
      rateLimits: {
        requestsPerMinute: parseInt(process.env.SOCCER_RATE_LIMIT_MINUTE || '50'),
        requestsPerHour: parseInt(process.env.SOCCER_RATE_LIMIT_HOUR || '1000'),
        requestsPerDay: parseInt(process.env.SOCCER_RATE_LIMIT_DAY || '10000'),
        burstLimit: parseInt(process.env.SOCCER_BURST_LIMIT || '7')
      },
      updateFrequency: parseInt(process.env.SOCCER_UPDATE_FREQUENCY || '60')
    }
  }

  static getSportConfig(sport: string): SportConfig | null {
    return this.configs[sport] || null
  }

  static getAllSports(): string[] {
    return Object.keys(this.configs)
  }

  static getLeaguesForSport(sport: string): string[] {
    return this.configs[sport]?.leagues || []
  }

  static getDefaultLeague(sport: string): string {
    return this.configs[sport]?.defaultLeague || 'Unknown'
  }

  static getPositionsForSport(sport: string): string[] {
    return this.configs[sport]?.positions || []
  }

  static isSportSupported(sport: string): boolean {
    return sport in this.configs
  }

  static addSportConfig(sport: string, config: SportConfig): void {
    this.configs[sport] = config
  }

  static updateSportConfig(sport: string, updates: Partial<SportConfig>): void {
    if (this.configs[sport]) {
      this.configs[sport] = { ...this.configs[sport], ...updates }
    }
  }

  /**
   * Get rate limits for a specific sport
   */
  static getRateLimits(sport: string) {
    return this.configs[sport]?.rateLimits || {
      requestsPerMinute: 30,
      requestsPerHour: 500,
      requestsPerDay: 5000,
      burstLimit: 5
    }
  }

  /**
   * Get update frequency for a specific sport
   */
  static getUpdateFrequency(sport: string): number {
    return this.configs[sport]?.updateFrequency || 30
  }

  /**
   * Get all rate limit configurations
   */
  static getAllRateLimits(): Record<string, any> {
    const limits: Record<string, any> = {}
    for (const [sport, config] of Object.entries(this.configs)) {
      limits[sport] = config.rateLimits
    }
    return limits
  }

  /**
   * Get all update frequencies
   */
  static getAllUpdateFrequencies(): Record<string, number> {
    const frequencies: Record<string, number> = {}
    for (const [sport, config] of Object.entries(this.configs)) {
      frequencies[sport] = config.updateFrequency
    }
    return frequencies
  }
}
