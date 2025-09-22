/**
 * Sport Configuration Manager
 * Centralized sport configuration and management
 */

export type SupportedSport = string

export interface SportConfig {
  name: SupportedSport
  displayName: string
  icon: string
  color: string
  isActive: boolean
  dataSource: string
  apiKey?: string
  playerStatsTable?: string
  leagues?: string[]
  positions: string[]
  scoringFields: string[] | { primary: string; for: string; against: string }
  bettingMarkets: string[]
  seasonConfig: {
    startMonth: number
    endMonth: number
    currentSeason: string
  }
  rateLimits: {
    requests: number
    interval: string
  }
  updateFrequency: string
}

class SportConfigManagerImpl {
  private static instance: SportConfigManagerImpl
  private configs: Map<SupportedSport, SportConfig> = new Map()

  public static getInstance(): SportConfigManagerImpl {
    if (!SportConfigManagerImpl.instance) {
      SportConfigManagerImpl.instance = new SportConfigManagerImpl()
    }
    return SportConfigManagerImpl.instance
  }

  constructor() {
    this.initializeConfigs()
  }

  private initializeConfigs(): void {
    // Basketball config
    this.configs.set('basketball', {
      name: 'basketball',
      displayName: 'Basketball',
      icon: '🏀',
      color: '#FF6B35',
      isActive: true,
      dataSource: 'rapidapi',
      playerStatsTable: 'player_stats',
      positions: ['PG', 'SG', 'SF', 'PF', 'C'],
      scoringFields: ['points', 'assists', 'rebounds', 'steals', 'blocks'],
      bettingMarkets: ['h2h', 'spread', 'totals', 'props'],
      seasonConfig: {
        startMonth: 10,
        endMonth: 6,
        currentSeason: '2024-25'
      },
      rateLimits: {
        requests: 100,
        interval: '1m'
      },
      updateFrequency: '5m'
    })

    // Football config
    this.configs.set('football', {
      name: 'football',
      displayName: 'Football',
      icon: '🏈',
      color: '#4A90E2',
      isActive: true,
      dataSource: 'rapidapi',
      playerStatsTable: 'player_stats',
      positions: ['QB', 'RB', 'WR', 'TE', 'K', 'DEF'],
      scoringFields: ['passing_yards', 'rushing_yards', 'receiving_yards', 'touchdowns'],
      bettingMarkets: ['h2h', 'spread', 'totals', 'props'],
      seasonConfig: {
        startMonth: 9,
        endMonth: 2,
        currentSeason: '2024-25'
      },
      rateLimits: {
        requests: 100,
        interval: '1m'
      },
      updateFrequency: '5m'
    })

    // Soccer config
    this.configs.set('soccer', {
      name: 'soccer',
      displayName: 'Soccer',
      icon: '⚽',
      color: '#2ECC71',
      isActive: true,
      dataSource: 'rapidapi',
      playerStatsTable: 'player_stats',
      positions: ['GK', 'DEF', 'MID', 'FWD'],
      scoringFields: ['goals', 'assists', 'yellow_cards', 'red_cards'],
      bettingMarkets: ['h2h', 'spread', 'totals', 'both_teams_score'],
      seasonConfig: {
        startMonth: 8,
        endMonth: 5,
        currentSeason: '2024-25'
      },
      rateLimits: {
        requests: 100,
        interval: '1m'
      },
      updateFrequency: '5m'
    })
  }

  getSportConfig(sport: SupportedSport): SportConfig | undefined {
    return this.configs.get(sport)
  }

  getAllSportConfigs(): SportConfig[] {
    return Array.from(this.configs.values())
  }

  getActiveSports(): SupportedSport[] {
    return Array.from(this.configs.values())
      .filter(config => config.isActive)
      .map(config => config.name)
  }

  getSportDisplayName(sport: SupportedSport): string {
    const config = this.configs.get(sport)
    return config?.displayName || sport
  }

  getSportIcon(sport: SupportedSport): string {
    const config = this.configs.get(sport)
    return config?.icon || '🏆'
  }

  getSportColor(sport: SupportedSport): string {
    const config = this.configs.get(sport)
    return config?.color || '#000000'
  }

  getCurrentSeason(sport: SupportedSport): string {
    const config = this.configs.get(sport)
    return config?.seasonConfig.currentSeason || '2024'
  }

  isSportActive(sport: SupportedSport): boolean {
    const config = this.configs.get(sport)
    return config?.isActive || false
  }

  // Additional methods needed by components
  async initialize(): Promise<void> {
    // Initialize any async operations
  }

  initializeSync(): void {
    // Initialize sync operations
  }

  getSupportedSports(): SupportedSport[] {
    return this.getActiveSports()
  }

  async getSportConfigAsync(sport: SupportedSport): Promise<SportConfig | undefined> {
    return this.getSportConfig(sport)
  }

  getPositionsForSport(sport: SupportedSport): string[] {
    const config = this.getSportConfig(sport)
    return config?.positions || []
  }

  getBettingMarkets(sport: SupportedSport): string[] {
    const config = this.getSportConfig(sport)
    return config?.bettingMarkets || []
  }

  async getAllSports(): Promise<SupportedSport[]> {
    return this.getActiveSports()
  }

  getAllSportsSync(): SupportedSport[] {
    return this.getActiveSports()
  }

  async getLeaguesForSport(sport: SupportedSport): Promise<string[]> {
    const config = this.getSportConfig(sport)
    return config?.leagues || []
  }

  async getDefaultLeague(sport: SupportedSport): Promise<string> {
    const leagues = await this.getLeaguesForSport(sport)
    return leagues[0] || 'default'
  }

  async isSportSupported(sport: SupportedSport): Promise<boolean> {
    return this.isSportActive(sport)
  }
}

export const sportConfigManager = SportConfigManagerImpl.getInstance()

// Static proxy methods for compatibility across the app
export class SportConfigManagerProxy {
  static async initialize(): Promise<void> {
    await sportConfigManager.initialize()
  }

  static initializeSync(): void {
    sportConfigManager.initializeSync()
  }

  static getSupportedSports(): SupportedSport[] {
    return sportConfigManager.getSupportedSports()
  }

  static getSportConfig(sport: SupportedSport) {
    return sportConfigManager.getSportConfig(sport)
  }

  static async getSportConfigAsync(sport: SupportedSport) {
    return sportConfigManager.getSportConfigAsync(sport)
  }

  static getPositionsForSport(sport: SupportedSport): string[] {
    return sportConfigManager.getPositionsForSport(sport)
  }

  static getBettingMarkets(sport: SupportedSport): string[] {
    return sportConfigManager.getBettingMarkets(sport)
  }

  static async getAllSports(): Promise<SupportedSport[]> {
    return sportConfigManager.getAllSports()
  }

  static getAllSportsSync(): SupportedSport[] {
    return sportConfigManager.getAllSportsSync()
  }

  static async getLeaguesForSport(sport: SupportedSport): Promise<string[]> {
    return sportConfigManager.getLeaguesForSport(sport)
  }

  static async getDefaultLeague(sport: SupportedSport): Promise<string> {
    return sportConfigManager.getDefaultLeague(sport)
  }

  static async isSportSupported(sport: SupportedSport): Promise<boolean> {
    return sportConfigManager.isSportSupported(sport)
  }

  static getCurrentSeason(sport: SupportedSport): string {
    return sportConfigManager.getCurrentSeason(sport)
  }
}

// Backward-compatible alias used throughout the app
export const SportConfigManager = SportConfigManagerProxy