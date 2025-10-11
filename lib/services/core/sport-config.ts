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
  private fallbackSports: SupportedSport[] = [
    'basketball',
    'football',
    'baseball',
    'hockey',
    'soccer',
  ]

  public static getInstance(): SportConfigManagerImpl {
    if (!SportConfigManagerImpl.instance) {
      SportConfigManagerImpl.instance = new SportConfigManagerImpl()
    }
    return SportConfigManagerImpl.instance
  }

  constructor() {
    // Immediate sync initialization with fallbacks
    this.initializeFallbackConfigs()
    // Async enhancement (non-blocking)
    if (typeof window === 'undefined') {
      this.loadDynamicConfigs().catch(error => {
        console.warn('Failed to load dynamic sport configurations:', error)
      })
    }
  }

  private initializeFallbackConfigs(): void {
    this.fallbackSports.forEach(sport => {
      this.configs.set(sport, this.createDefaultConfig(sport))
    })
  }

  private createDefaultConfig(sport: SupportedSport): SportConfig {
    const sportUpper = sport.toUpperCase()

    return {
      name: sport,
      displayName:
        process.env[`${sportUpper}_DISPLAY_NAME`] || sport.charAt(0).toUpperCase() + sport.slice(1),
      icon: process.env[`${sportUpper}_ICON`] || '🏆',
      color: process.env[`${sportUpper}_COLOR`] || '#6B7280',
      isActive: process.env[`${sportUpper}_ACTIVE`] !== 'false',
      dataSource: process.env[`${sportUpper}_DATA_SOURCE`] || 'rapidapi',
      playerStatsTable: process.env[`${sportUpper}_STATS_TABLE`] || 'player_stats',
      positions: process.env[`${sportUpper}_POSITIONS`]?.split(',') || [],
      scoringFields: process.env[`${sportUpper}_SCORING_FIELDS`]?.split(',') || ['points'],
      bettingMarkets: process.env[`${sportUpper}_BETTING_MARKETS`]?.split(',') || [
        'h2h',
        'spread',
        'totals',
      ],
      seasonConfig: {
        startMonth: parseInt(process.env[`${sportUpper}_START_MONTH`] || '9'),
        endMonth: parseInt(process.env[`${sportUpper}_END_MONTH`] || '5'),
        currentSeason:
          process.env[`${sportUpper}_CURRENT_SEASON`] || new Date().getFullYear().toString(),
      },
      rateLimits: {
        requests: parseInt(process.env[`${sportUpper}_RATE_LIMIT`] || '100'),
        interval: process.env[`${sportUpper}_RATE_INTERVAL`] || '1m',
      },
      updateFrequency: process.env[`${sportUpper}_UPDATE_FREQUENCY`] || '5m',
    }
  }

  private async loadDynamicConfigs(): Promise<void> {
    // Load additional sports from database (additive to fallback configs)
    if (typeof window !== 'undefined') {
      return
    }
    try {
      // Use the production Supabase client instead of creating a new one
      const { productionSupabaseClient } = await import('@/lib/supabase/production-client')

      const { data: sports, error } = await productionSupabaseClient.supabase
        .from('sports')
        .select('name, display_name, is_active')
        .eq('is_active', true)
        .order('name')

      if (error) {
        console.warn('Failed to load sports from database:', error)
        return
      }

      const supportedSports = sports?.map((sport: any) => sport.name) || []

      // Load configuration for each sport dynamically (additive)
      supportedSports.forEach((sport: SupportedSport) => {
        // Only add if not already in configs (from fallbacks)
        if (!this.configs.has(sport)) {
          this.configs.set(sport, this.createDefaultConfig(sport))
        }
      })
    } catch (error) {
      console.warn('Failed to load sports configuration from database:', error)
      // Fallback configs are already loaded, so this is non-critical
    }
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
    return config?.seasonConfig.currentSeason || new Date().getFullYear().toString()
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

  async getDefaultLeague(sport: SupportedSport): Promise<string | null> {
    const leagues = await this.getLeaguesForSport(sport)
    return leagues[0] || null
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

  static async getDefaultLeague(sport: SupportedSport): Promise<string | null> {
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
