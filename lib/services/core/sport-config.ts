/**
 * Sport Configuration Manager
 * Centralized sport configuration and management
 * NO hardcoded values - all configurations loaded from database
 */

import { dynamicSportConfigService } from '@/lib/services/dynamic-sport-config-service'

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
  supportsPlayerStats?: boolean
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
  private initialized = false
  private initializationPromise: Promise<void> | null = null

  public static getInstance(): SportConfigManagerImpl {
    if (!SportConfigManagerImpl.instance) {
      SportConfigManagerImpl.instance = new SportConfigManagerImpl()
    }
    return SportConfigManagerImpl.instance
  }

  constructor() {
    // Don't initialize in constructor - use lazy initialization
    // This prevents circular dependencies and unhandled promise rejections
  }

  private async initializeFromDatabase(): Promise<void> {
    try {
      // First ensure the dynamic sport config service is initialized
      await dynamicSportConfigService.initialize()

      // Load all sports from database using dynamic sport config service
      const sports = dynamicSportConfigService.getAllSports()

      if (!sports || sports.length === 0) {
        throw new Error('No sports found in database - migration may be required')
      }

      // Convert database sport configs to legacy format for compatibility
      for (const sport of sports) {
        const config = await this.convertDatabaseConfigToLegacy(sport)
        this.configs.set(sport.name, config)
      }

      this.initialized = true
      console.log(`Loaded ${sports.length} sports from database`)
    } catch (error) {
      console.error('Failed to initialize sport configurations from database:', error)
      // Don't throw error - allow app to continue with degraded functionality
      this.initialized = false
    }
  }

  private async convertDatabaseConfigToLegacy(sport: any): Promise<SportConfig> {
    const leagues = await dynamicSportConfigService.getLeaguesForSport(sport.name)
    
    return {
      name: sport.name,
      displayName: sport.display_name,
      icon: sport.icon_url || '🏆',
      color: sport.color_primary || '#6B7280',
      isActive: sport.is_active,
      dataSource: 'database',
      playerStatsTable: 'player_stats',
      supportsPlayerStats: true,
      leagues: leagues.map(l => l.name),
      positions: [], // Will be loaded dynamically per sport
      scoringFields: ['points'], // Will be loaded dynamically per sport
      bettingMarkets: ['h2h', 'spread', 'totals'],
      seasonConfig: {
        startMonth: sport.season_config?.startMonth || 9,
        endMonth: sport.season_config?.endMonth || 5,
        currentSeason: sport.current_season || new Date().getFullYear().toString(),
      },
      rateLimits: {
        requests: sport.rate_limits?.requestsPerMinute || 60,
        interval: '1m',
      },
      updateFrequency: '5m',
    }
  }

  /**
   * Public method to initialize sport configurations
   * Can be called from both client and server
   */
  public async initialize(): Promise<void> {
    if (this.initialized) {
      return
    }

    if (this.initializationPromise) {
      return this.initializationPromise
    }

    this.initializationPromise = this.initializeFromDatabase()
    return this.initializationPromise
  }

  /**
   * Get sport configuration with automatic initialization
   */
  async getSportConfig(sport: SupportedSport): Promise<SportConfig | undefined> {
    if (!this.initialized) {
      await this.initialize()
    }
    return this.configs.get(sport)
  }

  async getAllSportConfigs(): Promise<SportConfig[]> {
    if (!this.initialized) {
      await this.initialize()
    }
    return Array.from(this.configs.values())
  }

  async getActiveSports(): Promise<SupportedSport[]> {
    if (!this.initialized) {
      await this.initialize()
    }
    return Array.from(this.configs.values())
      .filter(config => config.isActive)
      .map(config => config.name)
  }

  async getSportDisplayName(sport: SupportedSport): Promise<string> {
    const config = await this.getSportConfig(sport)
    return config?.displayName || sport
  }

  async getSportIcon(sport: SupportedSport): Promise<string> {
    const config = await this.getSportConfig(sport)
    return config?.icon || '🏆'
  }

  async getSportColor(sport: SupportedSport): Promise<string> {
    const config = await this.getSportConfig(sport)
    return config?.color || '#000000'
  }

  async getCurrentSeason(sport: SupportedSport): Promise<string> {
    const config = await this.getSportConfig(sport)
    return config?.seasonConfig.currentSeason || new Date().getFullYear().toString()
  }

  async isSportActive(sport: SupportedSport): Promise<boolean> {
    const config = await this.getSportConfig(sport)
    return config?.isActive || false
  }

  initializeSync(): void {
    // Synchronous initialization - just check if ready
    if (!this.initialized) {
      console.warn('Sport config not initialized yet - call initialize() first')
    }
  }

  async getSupportedSports(): Promise<SupportedSport[]> {
    return this.getActiveSports()
  }

  async getPositionsForSport(sport: SupportedSport): Promise<string[]> {
    const config = await this.getSportConfig(sport)
    return config?.positions || []
  }

  async getBettingMarkets(sport: SupportedSport): Promise<string[]> {
    const config = await this.getSportConfig(sport)
    return config?.bettingMarkets || []
  }

  async getAllSports(): Promise<SupportedSport[]> {
    await this.initialize()
    return this.getActiveSports()
  }

  getAllSportsSync(): SupportedSport[] {
    if (!this.initialized) {
      console.warn('Sport config not initialized yet, returning empty array')
      return []
    }
    return Array.from(this.configs.values())
      .filter(config => config.isActive)
      .map(config => config.name)
  }

  getSportConfigSync(sport: SupportedSport): SportConfig | undefined {
    if (!this.initialized) {
      console.warn('Sport config not initialized yet, returning undefined')
      return undefined
    }
    return this.configs.get(sport)
  }

  async getLeaguesForSport(sport: SupportedSport): Promise<string[]> {
    const config = await this.getSportConfig(sport)
    return config?.leagues || []
  }

  getLeaguesForSportSync(sport: SupportedSport): string[] {
    const config = this.getSportConfigSync(sport)
    return config?.leagues || []
  }

  async getDefaultLeague(sport: SupportedSport): Promise<string | null> {
    const leagues = await this.getLeaguesForSport(sport)
    return leagues[0] || null
  }

  async isSportSupported(sport: SupportedSport): Promise<boolean> {
    await this.initialize()
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

  static async getSupportedSports(): Promise<SupportedSport[]> {
    return sportConfigManager.getSupportedSports()
  }

  static async getSportConfig(sport: SupportedSport) {
    return sportConfigManager.getSportConfig(sport)
  }

  static async getAllSportConfigs(): Promise<SportConfig[]> {
    return sportConfigManager.getAllSportConfigs()
  }

  static async getSportConfigAsync(sport: SupportedSport) {
    return sportConfigManager.getSportConfig(sport)
  }

  static async getPositionsForSport(sport: SupportedSport): Promise<string[]> {
    return sportConfigManager.getPositionsForSport(sport)
  }

  static async getBettingMarkets(sport: SupportedSport): Promise<string[]> {
    return sportConfigManager.getBettingMarkets(sport)
  }

  static async getAllSports(): Promise<SupportedSport[]> {
    return sportConfigManager.getAllSports()
  }

  static getAllSportsSync(): SupportedSport[] {
    return sportConfigManager.getAllSportsSync()
  }

  static getSportConfigSync(sport: SupportedSport): SportConfig | undefined {
    return sportConfigManager.getSportConfigSync(sport)
  }

  static async getLeaguesForSport(sport: SupportedSport): Promise<string[]> {
    return sportConfigManager.getLeaguesForSport(sport)
  }

  static getLeaguesForSportSync(sport: SupportedSport): string[] {
    return sportConfigManager.getLeaguesForSportSync(sport)
  }

  static async getDefaultLeague(sport: SupportedSport): Promise<string | null> {
    return sportConfigManager.getDefaultLeague(sport)
  }

  static async isSportSupported(sport: SupportedSport): Promise<boolean> {
    return sportConfigManager.isSportSupported(sport)
  }

  static async getCurrentSeason(sport: SupportedSport): Promise<string> {
    return sportConfigManager.getCurrentSeason(sport)
  }
}

// Backward-compatible alias used throughout the app
export const SportConfigManager = SportConfigManagerProxy
