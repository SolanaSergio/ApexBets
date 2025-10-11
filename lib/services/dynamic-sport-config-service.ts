/**
 * Dynamic Sport Configuration Service
 * Loads ALL sport configurations from database with NO hardcoded values
 * Provides type-safe access to sport metadata
 */

export interface SportConfig {
  id: string
  name: string
  display_name: string
  is_active: boolean
  data_types: string[]
  api_providers: string[]
  refresh_intervals: Record<string, number>
  rate_limits: Record<string, number>
  season_config: Record<string, any>
  current_season: string | null
  leagues: LeagueConfig[]
}

export interface LeagueConfig {
  id: string
  name: string
  sport: string
  display_name: string
  is_active: boolean
  api_mappings: ApiMapping[]
  season_config: Record<string, any>
  rapidApiId?: number
  teamSuffixes?: string[]
}

export interface ApiMapping {
  id: string
  sport: string
  league: string
  provider: string
  data_type_mapping: Record<string, string[]>
  priority: number
  is_active: boolean
}

class DynamicSportConfigService {
  private static instance: DynamicSportConfigService
  private configs: Map<string, SportConfig> = new Map()
  private leagues: Map<string, LeagueConfig[]> = new Map()
  private apiMappings: Map<string, ApiMapping[]> = new Map()
  private lastUpdate: Date = new Date(0)
  private cacheTTL: number = 5 * 60 * 1000 // 5 minutes
  private initialized: boolean = false

  public static getInstance(): DynamicSportConfigService {
    if (!DynamicSportConfigService.instance) {
      DynamicSportConfigService.instance = new DynamicSportConfigService()
    }
    return DynamicSportConfigService.instance
  }

  /**
   * Initialize the service by loading all configurations from database
   * Throws error if database sports config not found
   */
  async initialize(): Promise<void> {
    if (this.initialized && this.isCacheValid()) {
      return
    }

    try {
      // Use proper Supabase client for database operations
      const { createClient } = await import('@supabase/supabase-js')
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )

      // Load sports configuration
      const { data: sports, error: sportsError } = await supabase
        .from('sports')
        .select('*')
        .eq('is_active', true)
        .order('name')

      if (sportsError) {
        throw new Error(`Failed to load sports configuration: ${sportsError.message}`)
      }

      if (!sports || sports.length === 0) {
        throw new Error('No active sports configured in database - migration required')
      }

      // Load leagues for each sport
      const { data: leagues, error: leaguesError } = await supabase
        .from('leagues')
        .select('*')
        .eq('is_active', true)
        .order('sport')
        .order('name')

      if (leaguesError) {
        console.warn(`Failed to load leagues configuration: ${leaguesError.message}`)
      }

      // Load API mappings
      const { data: mappings, error: mappingsError } = await supabase
        .from('api_mappings')
        .select('*')
        .eq('is_active', true)
        .order('sport')
        .order('league')
        .order('priority')

      if (mappingsError) {
        console.warn(`Failed to load API mappings: ${mappingsError.message}`)
      }

      // Process and cache configurations
      this.processConfigurations(sports, leagues || [], mappings || [])

      this.lastUpdate = new Date()
      this.initialized = true

      console.log(`DynamicSportConfigService initialized with ${sports.length} sports`)
    } catch (error) {
      console.error('Failed to initialize DynamicSportConfigService:', error)
      throw new Error(`Sport configuration initialization failed: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  private processConfigurations(sports: any[], leagues: any[], mappings: any[]): void {
    // Clear existing configs
    this.configs.clear()
    this.leagues.clear()
    this.apiMappings.clear()

    // Process sports
    sports.forEach(sport => {
      const sportConfig: SportConfig = {
        id: sport.id,
        name: sport.name,
        display_name: sport.display_name,
        is_active: sport.is_active,
        data_types: sport.data_types || [],
        api_providers: sport.api_providers || [],
        refresh_intervals: sport.refresh_intervals || {},
        rate_limits: sport.rate_limits || {},
        season_config: sport.season_config || {},
        current_season: sport.current_season,
        leagues: [],
      }
      this.configs.set(sport.name, sportConfig)
    })

    // Process leagues
    leagues.forEach(league => {
      const leagueConfig: LeagueConfig = {
        id: league.id,
        name: league.name,
        sport: league.sport,
        display_name: league.display_name,
        is_active: league.is_active,
        api_mappings: [],
        season_config: league.season_config || {},
      }

      // Add to sport's leagues
      const sportConfig = this.configs.get(league.sport)
      if (sportConfig) {
        sportConfig.leagues.push(leagueConfig)
      }

      // Store in leagues map
      if (!this.leagues.has(league.sport)) {
        this.leagues.set(league.sport, [])
      }
      this.leagues.get(league.sport)!.push(leagueConfig)
    })

    // Process API mappings
    mappings.forEach(mapping => {
      const apiMapping: ApiMapping = {
        id: mapping.id,
        sport: mapping.sport,
        league: mapping.league,
        provider: mapping.provider,
        data_type_mapping: mapping.data_type_mapping || {},
        priority: mapping.priority || 1,
        is_active: mapping.is_active,
      }

      // Add to league's API mappings
      const leagueConfigs = this.leagues.get(mapping.sport) || []
      const leagueConfig = leagueConfigs.find(l => l.name === mapping.league)
      if (leagueConfig) {
        leagueConfig.api_mappings.push(apiMapping)
      }

      // Store in API mappings map
      const key = `${mapping.sport}_${mapping.league}`
      if (!this.apiMappings.has(key)) {
        this.apiMappings.set(key, [])
      }
      this.apiMappings.get(key)!.push(apiMapping)
    })
  }

  private isCacheValid(): boolean {
    return Date.now() - this.lastUpdate.getTime() < this.cacheTTL
  }

  /**
   * Get all sports configurations
   */
  getAllSports(): SportConfig[] {
    if (!this.initialized) {
      throw new Error('DynamicSportConfigService not initialized. Call initialize() first.')
    }
    return Array.from(this.configs.values())
  }

  /**
   * Get sport configuration by name
   */
  getSportConfig(sport: string): SportConfig | null {
    if (!this.initialized) {
      throw new Error('DynamicSportConfigService not initialized. Call initialize() first.')
    }
    return this.configs.get(sport) || null
  }

  /**
   * Get all active sport configurations
   */
  getAllSportConfigs(): SportConfig[] {
    if (!this.initialized) {
      throw new Error('DynamicSportConfigService not initialized. Call initialize() first.')
    }
    return Array.from(this.configs.values()).filter(config => config.is_active)
  }

  /**
   * Get leagues for a sport
   */
  getLeaguesForSport(sport: string): LeagueConfig[] {
    if (!this.initialized) {
      throw new Error('DynamicSportConfigService not initialized. Call initialize() first.')
    }
    return this.leagues.get(sport) || []
  }

  /**
   * Get API mappings for a sport and league
   */
  getApiMappings(sport: string, league?: string): ApiMapping[] {
    if (!this.initialized) {
      throw new Error('DynamicSportConfigService not initialized. Call initialize() first.')
    }
    
    if (league) {
      return this.apiMappings.get(`${sport}_${league}`) || []
    }
    
    // Return all mappings for sport
    const allMappings: ApiMapping[] = []
    for (const [key, mappings] of this.apiMappings) {
      if (key.startsWith(`${sport}_`)) {
        allMappings.push(...mappings)
      }
    }
    return allMappings
  }

  /**
   * Check if sport is supported
   */
  isSportSupported(sport: string): boolean {
    if (!this.initialized) {
      throw new Error('DynamicSportConfigService not initialized. Call initialize() first.')
    }
    const config = this.configs.get(sport)
    return config ? config.is_active : false
  }

  /**
   * Get current season for sport
   */
  getCurrentSeason(sport: string): string | null {
    if (!this.initialized) {
      throw new Error('DynamicSportConfigService not initialized. Call initialize() first.')
    }
    const config = this.configs.get(sport)
    return config ? config.current_season : null
  }

  /**
   * Get sport display name
   */
  getSportDisplayName(sport: string): string {
    if (!this.initialized) {
      throw new Error('DynamicSportConfigService not initialized. Call initialize() first.')
    }
    const config = this.configs.get(sport)
    return config ? config.display_name : sport
  }

  /**
   * Get league configuration for a specific sport and league
   */
  getLeagueConfig(sport: string, league?: string): LeagueConfig | null {
    if (!this.initialized) {
      throw new Error('DynamicSportConfigService not initialized. Call initialize() first.')
    }
    
    const leagues = this.leagues.get(sport) || []
    if (!league) {
      // Return the first active league if no specific league requested
      return leagues.find(l => l.is_active) || null
    }
    
    return leagues.find(l => l.name === league && l.is_active) || null
  }


  /**
   * Force refresh configurations from database
   */
  async refresh(): Promise<void> {
    this.initialized = false
    await this.initialize()
  }

  /**
   * Get configuration status
   */
  getStatus(): {
    initialized: boolean
    lastUpdate: Date
    sportCount: number
    leagueCount: number
    mappingCount: number
  } {
    return {
      initialized: this.initialized,
      lastUpdate: this.lastUpdate,
      sportCount: this.configs.size,
      leagueCount: Array.from(this.leagues.values()).flat().length,
      mappingCount: Array.from(this.apiMappings.values()).flat().length,
    }
  }
}

// Export singleton instance
export const dynamicSportConfigService = DynamicSportConfigService.getInstance()

// Export convenience functions
export const getSportConfig = (sport: string) => dynamicSportConfigService.getSportConfig(sport)
export const getAllSportConfigs = () => dynamicSportConfigService.getAllSportConfigs()
export const getLeaguesForSport = (sport: string) => dynamicSportConfigService.getLeaguesForSport(sport)
export const getApiMappings = (sport: string, league?: string) => dynamicSportConfigService.getApiMappings(sport, league)
export const isSportSupported = (sport: string) => dynamicSportConfigService.isSportSupported(sport)
export const getCurrentSeason = (sport: string) => dynamicSportConfigService.getCurrentSeason(sport)
export const getSportDisplayName = (sport: string) => dynamicSportConfigService.getSportDisplayName(sport)
