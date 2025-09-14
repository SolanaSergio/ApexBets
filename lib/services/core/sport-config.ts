/**
 * SPORT CONFIGURATION
 * Dynamic sport configuration loaded from database
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
  scoringFields?: {
    primary: string
    for: string
    against: string
  }
  bettingMarkets?: {
    id: string
    name: string
    description: string
  }[]
  seasonConfig?: {
    startMonth: number // 0-11 (January = 0)
    endMonth: number // 0-11 (December = 11)
    seasonYearOffset?: number // How many months before January to start season
  }
  rateLimits: {
    requestsPerMinute: number
    requestsPerHour: number
    requestsPerDay: number
    burstLimit: number
  }
  updateFrequency: number // minutes
}

export type SupportedSport = string

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
  private static configs: Record<string, SportConfig> = {}
  private static initialized = false

  /**
   * Initialize sport configurations from database
   */
  static async initialize(): Promise<void> {
    if (this.initialized) return

    try {
      // Load from database via API endpoint
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
      const response = await fetch(`${baseUrl}/api/sports`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const result = await response.json()
        
        if (result.data && result.data.length > 0) {
          for (const sport of result.data) {
            this.configs[sport.name] = {
              name: sport.display_name || sport.name,
              leagues: [], // Will be loaded separately
              defaultLeague: '', // Will be set from leagues
              icon: sport.icon || '🏆',
              color: sport.color || 'text-gray-500',
              apiKey: sport.api_key || '',
              dataSource: sport.data_source || 'sportsdb',
              positions: sport.positions || [],
              scoringFields: sport.scoring_fields || {},
              bettingMarkets: sport.betting_markets || [],
              seasonConfig: sport.season_config || {},
              rateLimits: sport.rate_limits || {
                requestsPerMinute: 30,
                requestsPerHour: 500,
                requestsPerDay: 5000,
                burstLimit: 5
              },
              updateFrequency: sport.update_frequency || 30
            }
          }
        } else {
          // Fallback to environment variables if no database data
          console.warn('No sports found in database, falling back to environment variables')
          const sports = process.env.SUPPORTED_SPORTS?.split(',') || ['basketball', 'soccer', 'football', 'baseball', 'hockey']
          
          for (const sport of sports) {
            const config = await this.loadSportConfigFromEnvironment(sport)
            if (config) {
              this.configs[sport] = config
            }
          }
        }
      } else {
        // Fallback to environment variables if API fails
        console.warn('Failed to load sports from API, falling back to environment variables')
        const sports = process.env.SUPPORTED_SPORTS?.split(',') || ['basketball', 'soccer', 'football', 'baseball', 'hockey']
        
        for (const sport of sports) {
          const config = await this.loadSportConfigFromEnvironment(sport)
          if (config) {
            this.configs[sport] = config
          }
        }
      }
      
      this.initialized = true
    } catch (error) {
      console.error('Failed to initialize sport configurations:', error)
      // Fallback to environment variables
      try {
        const sports = process.env.SUPPORTED_SPORTS?.split(',') || ['basketball', 'soccer', 'football', 'baseball', 'hockey']
        
        for (const sport of sports) {
          const config = await this.loadSportConfigFromEnvironment(sport)
          if (config) {
            this.configs[sport] = config
          }
        }
        this.initialized = true
      } catch (fallbackError) {
        console.error('Fallback initialization also failed:', fallbackError)
        throw error
      }
    }
  }

  /**
   * Synchronous initialization for React components
   * This is a fallback that uses environment variables when database is not available
   */
  static initializeSync(): void {
    if (this.initialized) return

    try {
      // Load basic configs synchronously from environment as fallback
      const sports = process.env.SUPPORTED_SPORTS?.split(',') || []
      
      for (const sport of sports) {
        const sportUpper = sport.toUpperCase()
        
        this.configs[sport] = {
          name: process.env[`${sportUpper}_NAME`] || sport.charAt(0).toUpperCase() + sport.slice(1),
          leagues: process.env[`${sportUpper}_LEAGUES`]?.split(',') || [],
          defaultLeague: process.env[`${sportUpper}_DEFAULT_LEAGUE`] || '',
          icon: process.env[`${sportUpper}_ICON`] || '🏆',
          color: process.env[`${sportUpper}_COLOR`] || 'text-gray-500',
          apiKey: process.env[`${sportUpper}_API_KEY`] || '',
          dataSource: (process.env[`${sportUpper}_DATA_SOURCE`] as any) || 'sportsdb',
          positions: process.env[`${sportUpper}_POSITIONS`]?.split(',') || [],
          rateLimits: {
            requestsPerMinute: parseInt(process.env[`${sportUpper}_RATE_LIMIT_MINUTE`] || '30'),
            requestsPerHour: parseInt(process.env[`${sportUpper}_RATE_LIMIT_HOUR`] || '500'),
            requestsPerDay: parseInt(process.env[`${sportUpper}_RATE_LIMIT_DAY`] || '5000'),
            burstLimit: parseInt(process.env[`${sportUpper}_BURST_LIMIT`] || '5')
          },
          updateFrequency: parseInt(process.env[`${sportUpper}_UPDATE_FREQUENCY`] || '30')
        }
      }
      
      this.initialized = true
    } catch (error) {
      console.error('Failed to initialize sport configurations synchronously:', error)
      // Don't throw, just log the error
    }
  }

  /**
   * Load sport configuration from environment variables
   */
  private static async loadSportConfigFromEnvironment(sport: string): Promise<SportConfig | null> {
    const sportUpper = sport.toUpperCase()
    
    return {
      name: process.env[`${sportUpper}_NAME`] || sport.charAt(0).toUpperCase() + sport.slice(1),
      leagues: process.env[`${sportUpper}_LEAGUES`]?.split(',') || [],
      defaultLeague: process.env[`${sportUpper}_DEFAULT_LEAGUE`] || '',
      icon: process.env[`${sportUpper}_ICON`] || '🏆',
      color: process.env[`${sportUpper}_COLOR`] || 'text-gray-500',
      apiKey: process.env[`${sportUpper}_API_KEY`] || '',
      dataSource: (process.env[`${sportUpper}_DATA_SOURCE`] as any) || 'sportsdb',
      positions: process.env[`${sportUpper}_POSITIONS`]?.split(',') || [],
      rateLimits: {
        requestsPerMinute: parseInt(process.env[`${sportUpper}_RATE_LIMIT_MINUTE`] || '30'),
        requestsPerHour: parseInt(process.env[`${sportUpper}_RATE_LIMIT_HOUR`] || '500'),
        requestsPerDay: parseInt(process.env[`${sportUpper}_RATE_LIMIT_DAY`] || '5000'),
        burstLimit: parseInt(process.env[`${sportUpper}_BURST_LIMIT`] || '5')
      },
      updateFrequency: parseInt(process.env[`${sportUpper}_UPDATE_FREQUENCY`] || '30')
    }
  }

  static getSportConfig(sport: string): SportConfig | null {
    if (!this.initialized) {
      // Initialize synchronously for React components
      this.initializeSync()
    }
    return this.configs[sport] || null
  }

  static async getSportConfigAsync(sport: string): Promise<SportConfig | null> {
    await this.initialize()
    return this.configs[sport] || null
  }

  static async getAllSports(): Promise<string[]> {
    await this.initialize()
    return Object.keys(this.configs)
  }

  static getAllSportsSync(): string[] {
    if (!this.initialized) {
      this.initializeSync()
    }
    return Object.keys(this.configs)
  }

  static getSupportedSports(): string[] {
    return this.getAllSportsSync()
  }

  static async getLeaguesForSport(sport: string): Promise<string[]> {
    await this.initialize()
    return this.configs[sport]?.leagues || []
  }

  static async getDefaultLeague(sport: string): Promise<string> {
    await this.initialize()
    return this.configs[sport]?.defaultLeague || 'Unknown'
  }

  static async getPositionsForSport(sport: string): Promise<string[]> {
    await this.initialize()
    return this.configs[sport]?.positions || []
  }

  static async isSportSupported(sport: string): Promise<boolean> {
    await this.initialize()
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
  static async getRateLimits(sport: string) {
    await this.initialize()
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
  static async getUpdateFrequency(sport: string): Promise<number> {
    await this.initialize()
    return this.configs[sport]?.updateFrequency || 30
  }

  /**
   * Get all rate limit configurations
   */
  static async getAllRateLimits(): Promise<Record<string, any>> {
    await this.initialize()
    const limits: Record<string, any> = {}
    for (const [sport, config] of Object.entries(this.configs)) {
      limits[sport] = config.rateLimits
    }
    return limits
  }

  /**
   * Get all update frequencies
   */
  static async getAllUpdateFrequencies(): Promise<Record<string, number>> {
    await this.initialize()
    const frequencies: Record<string, number> = {}
    for (const [sport, config] of Object.entries(this.configs)) {
      frequencies[sport] = config.updateFrequency
    }
    return frequencies
  }

  /**
   * Get betting markets for a specific sport
   */
  static async getBettingMarkets(sport: string): Promise<{ id: string; name: string; description: string }[]> {
    await this.initialize()
    return this.configs[sport]?.bettingMarkets || []
  }

  /**
   * Get season configuration for a specific sport
   */
  static async getSeasonConfig(sport: string): Promise<{ startMonth: number; endMonth: number; seasonYearOffset?: number } | null> {
    await this.initialize()
    return this.configs[sport]?.seasonConfig || null
  }

  /**
   * Calculate current season for a sport based on its configuration
   */
  static async getCurrentSeason(sport: string): Promise<string> {
    const seasonConfig = await this.getSeasonConfig(sport)
    const year = new Date().getFullYear()
    const month = new Date().getMonth()

    if (!seasonConfig) {
      return year.toString()
    }

    const { startMonth, seasonYearOffset = 0 } = seasonConfig
    
    // If current month is before start month, we're in the previous year's season
    if (month < startMonth) {
      return (year - 1 + seasonYearOffset).toString()
    }
    
    return (year + seasonYearOffset).toString()
  }

  /**
   * Get all betting markets for all sports
   */
  static async getAllBettingMarkets(): Promise<Record<string, { id: string; name: string; description: string }[]>> {
    await this.initialize()
    const markets: Record<string, { id: string; name: string; description: string }[]> = {}
    for (const [sport, config] of Object.entries(this.configs)) {
      markets[sport] = config.bettingMarkets || []
    }
    return markets
  }
}
