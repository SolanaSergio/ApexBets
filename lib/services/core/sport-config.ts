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
      dataSource: 'balldontlie'
    },
    football: {
      name: 'Football',
      leagues: ['NFL', 'NCAA', 'CFL'],
      defaultLeague: 'NFL',
      icon: '🏈',
      color: 'text-green-500',
      apiKey: 'SPORTSDB_API_KEY',
      dataSource: 'sportsdb'
    },
    baseball: {
      name: 'Baseball',
      leagues: ['MLB', 'MiLB', 'NPB', 'KBO'],
      defaultLeague: 'MLB',
      icon: '⚾',
      color: 'text-blue-500',
      apiKey: 'SPORTSDB_API_KEY',
      dataSource: 'sportsdb'
    },
    hockey: {
      name: 'Hockey',
      leagues: ['NHL', 'AHL', 'KHL', 'SHL'],
      defaultLeague: 'NHL',
      icon: '🏒',
      color: 'text-red-500',
      apiKey: 'SPORTSDB_API_KEY',
      dataSource: 'sportsdb'
    },
    soccer: {
      name: 'Soccer',
      leagues: ['Premier League', 'La Liga', 'Bundesliga', 'Serie A', 'Ligue 1', 'Champions League'],
      defaultLeague: 'Premier League',
      icon: '⚽',
      color: 'text-emerald-500',
      apiKey: 'SPORTSDB_API_KEY',
      dataSource: 'sportsdb'
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
}
