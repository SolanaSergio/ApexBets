/**
 * Sport Configuration Service
 * Manages sport-specific configurations dynamically from database
 * Sport-agnostic service for all sports
 */

export interface SportConfig {
  name: string
  displayName: string
  maxGameDurationHours: number
  statusMapping: Record<string, string>
  liveStatuses: string[]
  completedStatuses: string[]
  scheduledStatuses: string[]
  updateFrequency: number
  dataSource: string
  isActive: boolean
}

export class SportConfigService {
  private configCache: Map<string, SportConfig> = new Map()
  private cacheExpiry: Map<string, number> = new Map()
  private readonly CACHE_TTL = 30 * 60 * 1000 // 30 minutes

  /**
   * Get sport configuration by name
   */
  async getSportConfig(sportName: string): Promise<SportConfig | null> {
    const cacheKey = sportName.toLowerCase()
    
    // Check cache first
    if (this.isConfigCached(cacheKey)) {
      return this.configCache.get(cacheKey) || null
    }

    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      
      if (!supabase) {
        return this.getDefaultConfig(sportName)
      }

      const { data: sportData, error } = await supabase
        .from('sports')
        .select('*')
        .eq('name', sportName.toLowerCase())
        .single()

      if (error || !sportData) {
        console.warn(`Sport configuration not found for ${sportName}, using defaults`)
        return this.getDefaultConfig(sportName)
      }

      const config = this.mapDatabaseToConfig(sportData)
      
      // Cache the config
      this.configCache.set(cacheKey, config)
      this.cacheExpiry.set(cacheKey, Date.now() + this.CACHE_TTL)
      
      return config
    } catch (error) {
      console.error(`Error fetching sport config for ${sportName}:`, error)
      return this.getDefaultConfig(sportName)
    }
  }

  /**
   * Get all active sport configurations
   */
  async getAllActiveSportConfigs(): Promise<SportConfig[]> {
    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      
      if (!supabase) {
        return this.getDefaultConfigs()
      }

      const { data: sportsData, error } = await supabase
        .from('sports')
        .select('*')
        .eq('is_active', true)

      if (error || !sportsData) {
        console.warn('Error fetching active sports, using defaults')
        return this.getDefaultConfigs()
      }

      return sportsData.map(sport => this.mapDatabaseToConfig(sport))
    } catch (error) {
      console.error('Error fetching all sport configs:', error)
      return this.getDefaultConfigs()
    }
  }

  /**
   * Check if a status indicates a live game
   */
  async isLiveStatus(sportName: string, status: string): Promise<boolean> {
    const config = await this.getSportConfig(sportName)
    if (!config) return false
    
    // Ensure status is a string before calling toLowerCase
    const statusStr = typeof status === 'string' ? status : String(status || '')
    return config.liveStatuses.includes(statusStr.toLowerCase())
  }

  /**
   * Check if a status indicates a completed game
   */
  async isCompletedStatus(sportName: string, status: string): Promise<boolean> {
    const config = await this.getSportConfig(sportName)
    if (!config) return false
    
    // Ensure status is a string before calling toLowerCase
    const statusStr = typeof status === 'string' ? status : String(status || '')
    return config.completedStatuses.includes(statusStr.toLowerCase())
  }

  /**
   * Check if a status indicates a scheduled game
   */
  async isScheduledStatus(sportName: string, status: string): Promise<boolean> {
    const config = await this.getSportConfig(sportName)
    if (!config) return false
    
    // Ensure status is a string before calling toLowerCase
    const statusStr = typeof status === 'string' ? status : String(status || '')
    return config.scheduledStatuses.includes(statusStr.toLowerCase())
  }

  /**
   * Get maximum game duration for a sport
   */
  async getMaxGameDuration(sportName: string): Promise<number> {
    const config = await this.getSportConfig(sportName)
    return config?.maxGameDurationHours || 4
  }

  /**
   * Normalize status to standard format
   */
  async normalizeStatus(sportName: string, status: string): Promise<string> {
    const config = await this.getSportConfig(sportName)
    if (!config) {
      const statusStr = typeof status === 'string' ? status : String(status || '')
      return statusStr.toLowerCase()
    }
    
    const statusStr = typeof status === 'string' ? status : String(status || '')
    const normalized = config.statusMapping[statusStr.toLowerCase()]
    return normalized || statusStr.toLowerCase()
  }

  /**
   * Check if config is cached and not expired
   */
  private isConfigCached(cacheKey: string): boolean {
    const expiry = this.cacheExpiry.get(cacheKey)
    return expiry ? Date.now() < expiry : false
  }

  /**
   * Map database sport data to config object
   */
  private mapDatabaseToConfig(sportData: any): SportConfig {
    const seasonConfig = sportData.season_config || {}
    
    return {
      name: sportData.name,
      displayName: sportData.display_name || sportData.name,
      maxGameDurationHours: seasonConfig.maxGameDurationHours || this.getDefaultMaxDuration(sportData.name),
      statusMapping: seasonConfig.statusMapping || this.getDefaultStatusMapping(sportData.name),
      liveStatuses: seasonConfig.liveStatuses || this.getDefaultLiveStatuses(sportData.name),
      completedStatuses: seasonConfig.completedStatuses || this.getDefaultCompletedStatuses(sportData.name),
      scheduledStatuses: seasonConfig.scheduledStatuses || this.getDefaultScheduledStatuses(sportData.name),
      updateFrequency: sportData.update_frequency || 30,
      dataSource: sportData.data_source || 'sportsdb',
      isActive: sportData.is_active !== false
    }
  }

  /**
   * Get default configuration for a sport
   */
  private getDefaultConfig(sportName: string): SportConfig {
    return {
      name: sportName.toLowerCase(),
      displayName: sportName,
      maxGameDurationHours: this.getDefaultMaxDuration(sportName),
      statusMapping: this.getDefaultStatusMapping(sportName),
      liveStatuses: this.getDefaultLiveStatuses(sportName),
      completedStatuses: this.getDefaultCompletedStatuses(sportName),
      scheduledStatuses: this.getDefaultScheduledStatuses(sportName),
      updateFrequency: 30,
      dataSource: 'sportsdb',
      isActive: true
    }
  }

  /**
   * Get default configurations for all sports
   */
  private getDefaultConfigs(): SportConfig[] {
    const commonSports = ['basketball', 'football', 'baseball', 'hockey', 'soccer', 'tennis', 'golf']
    return commonSports.map(sport => this.getDefaultConfig(sport))
  }

  /**
   * Get default max duration by sport
   */
  private getDefaultMaxDuration(sportName: string): number {
    const durations: Record<string, number> = {
      'basketball': 3,
      'football': 4,
      'baseball': 4,
      'hockey': 3,
      'soccer': 2,
      'tennis': 4,
      'golf': 8,
      'cricket': 8,
      'rugby': 2,
      'volleyball': 2,
      'badminton': 1,
      'table_tennis': 1
    }
    return durations[sportName.toLowerCase()] || 4
  }

  /**
   * Get default status mapping by sport
   */
  private getDefaultStatusMapping(sportName: string): Record<string, string> {
    const mappings: Record<string, Record<string, string>> = {
      'basketball': {
        'live': 'live',
        'in_progress': 'live',
        'final': 'completed',
        'finished': 'completed',
        'scheduled': 'scheduled',
        'postponed': 'postponed',
        'cancelled': 'cancelled'
      },
      'football': {
        'live': 'live',
        'in_progress': 'live',
        'final': 'completed',
        'finished': 'completed',
        'scheduled': 'scheduled',
        'postponed': 'postponed',
        'cancelled': 'cancelled'
      },
      'baseball': {
        'live': 'live',
        'in_progress': 'live',
        'final': 'completed',
        'finished': 'completed',
        'scheduled': 'scheduled',
        'postponed': 'postponed',
        'cancelled': 'cancelled'
      },
      'hockey': {
        'live': 'live',
        'in_progress': 'live',
        'final': 'completed',
        'finished': 'completed',
        'scheduled': 'scheduled',
        'postponed': 'postponed',
        'cancelled': 'cancelled'
      },
      'soccer': {
        'live': 'live',
        'in_progress': 'live',
        'ft': 'completed',
        'final': 'completed',
        'finished': 'completed',
        'scheduled': 'scheduled',
        'ns': 'scheduled',
        'postponed': 'postponed',
        'cancelled': 'cancelled'
      }
    }
    return mappings[sportName.toLowerCase()] || mappings['basketball']
  }

  /**
   * Get default live statuses by sport
   */
  private getDefaultLiveStatuses(_sportName: string): string[] {
    return ['live', 'in_progress', 'in progress', 'active', 'ongoing']
  }

  /**
   * Get default completed statuses by sport
   */
  private getDefaultCompletedStatuses(sportName: string): string[] {
    const baseStatuses = ['completed', 'finished', 'final', 'done', 'ended']
    
    // Add sport-specific completed statuses
    const sportSpecific: Record<string, string[]> = {
      'soccer': ['ft', 'full time'],
      'tennis': ['won', 'lost'],
      'golf': ['won', 'lost']
    }
    
    return [...baseStatuses, ...(sportSpecific[sportName.toLowerCase()] || [])]
  }

  /**
   * Get default scheduled statuses by sport
   */
  private getDefaultScheduledStatuses(sportName: string): string[] {
    const baseStatuses = ['scheduled', 'upcoming', 'pending', 'not_started']
    
    // Add sport-specific scheduled statuses
    const sportSpecific: Record<string, string[]> = {
      'soccer': ['ns', 'not started'],
      'tennis': ['not started'],
      'golf': ['not started']
    }
    
    return [...baseStatuses, ...(sportSpecific[sportName.toLowerCase()] || [])]
  }
}

export const sportConfigService = new SportConfigService()
