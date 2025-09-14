/**
 * DYNAMIC SPORT SERVICE
 * Eliminates all hardcoded sport-specific values and provides dynamic configuration
 */

export interface SportConfiguration {
  name: string
  defaultPeriodFormat: string
  defaultTimeFormat: string
  defaultLeague: string
  apiMapping: {
    sportsdb: string
    rapidapi?: string
    espn?: string
  }
  statusMapping: Record<string, string>
  periodMapping: Record<string, string>
}

export class DynamicSportService {
  private static configurations: Map<string, SportConfiguration> = new Map()

  /**
   * Initialize sport configurations from database
   */
  static async initialize(): Promise<void> {
    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()

      const { data: sports, error } = await supabase
        ?.from('sports')
        .select('*')
        .eq('is_active', true)

      if (!error && sports) {
        sports.forEach(sport => {
          this.configurations.set(sport.name, {
            name: sport.name,
            defaultPeriodFormat: sport.period_format || 'Period',
            defaultTimeFormat: sport.time_format || '00:00',
            defaultLeague: sport.primary_league || 'Unknown',
            apiMapping: {
              sportsdb: sport.sportsdb_name || sport.name,
              rapidapi: sport.rapidapi_name,
              espn: sport.espn_name
            },
            statusMapping: sport.status_mapping || {},
            periodMapping: sport.period_mapping || {}
          })
        })
      }
    } catch (error) {
      console.warn('Failed to initialize sport configurations:', error)
      this.loadDefaultConfigurations()
    }
  }

  /**
   * Load fallback configurations if database is unavailable
   */
  private static loadDefaultConfigurations(): void {
    console.warn('Loading fallback sport configurations - database unavailable')

    // Load from environment variables or use minimal defaults
    const getSportConfig = (sport: string) => ({
      name: sport,
      defaultPeriodFormat: process.env[`${sport.toUpperCase()}_PERIOD_FORMAT`] || 'Period',
      defaultTimeFormat: process.env[`${sport.toUpperCase()}_TIME_FORMAT`] || '00:00',
      defaultLeague: process.env[`${sport.toUpperCase()}_DEFAULT_LEAGUE`] || 'Unknown',
      apiMapping: {
        sportsdb: process.env[`${sport.toUpperCase()}_SPORTSDB_NAME`] || sport,
        rapidapi: process.env[`${sport.toUpperCase()}_RAPIDAPI_NAME`] || sport,
        espn: process.env[`${sport.toUpperCase()}_ESPN_NAME`] || sport
      },
      statusMapping: {
        'live': 'live',
        'in_progress': 'live',
        'finished': 'finished',
        'final': 'finished'
      },
      periodMapping: {}
    })

    const supportedSports = process.env.SUPPORTED_SPORTS?.split(',') || ['basketball', 'football', 'baseball', 'hockey', 'soccer']
    const defaults: SportConfiguration[] = supportedSports.map(sport => getSportConfig(sport.trim()))

    defaults.forEach(config => {
      this.configurations.set(config.name, config)
    })
  }

  /**
   * Get configuration for a specific sport
   */
  static getConfiguration(sport: string): SportConfiguration | null {
    return this.configurations.get(sport.toLowerCase()) || null
  }

  /**
   * Get all supported sports
   */
  static getSupportedSports(): string[] {
    return Array.from(this.configurations.keys())
  }

  /**
   * Get API mapping name for a specific sport and provider
   */
  static getApiName(sport: string, provider: 'sportsdb' | 'rapidapi' | 'espn'): string {
    const config = this.getConfiguration(sport)
    return config?.apiMapping[provider] || sport
  }

  /**
   * Normalize game status based on sport configuration
   */
  static normalizeStatus(sport: string, status: string): string {
    const config = this.getConfiguration(sport)
    if (!config) return status

    const normalized = status.toLowerCase()
    return config.statusMapping[normalized] || status
  }

  /**
   * Format period name based on sport configuration
   */
  static formatPeriod(sport: string, period: number | string): string {
    const config = this.getConfiguration(sport)
    if (!config) return `Period ${period}`

    const periodStr = period.toString()
    return config.periodMapping[periodStr] || `${config.defaultPeriodFormat} ${period}`
  }

  /**
   * Get default time format for a sport
   */
  static getDefaultTime(sport: string): string {
    const config = this.getConfiguration(sport)
    return config?.defaultTimeFormat || '00:00'
  }

  /**
   * Get default league for a sport
   */
  static getDefaultLeague(sport: string): string {
    const config = this.getConfiguration(sport)
    return config?.defaultLeague || 'Unknown'
  }

  /**
   * Check if a game status indicates it's truly live
   */
  static isGameLive(sport: string, status: string, homeScore?: number, awayScore?: number): boolean {
    const normalizedStatus = this.normalizeStatus(sport, status).toLowerCase()
    
    // Must have live status
    const hasLiveStatus = normalizedStatus === 'live' || 
                         normalizedStatus.includes('progress') ||
                         normalizedStatus.includes('quarter') ||
                         normalizedStatus.includes('period') ||
                         normalizedStatus.includes('inning') ||
                         normalizedStatus.includes('half')

    // Must have actual scores (not 0-0) for most sports
    const hasRealScores = (homeScore !== null && awayScore !== null) && 
                         ((homeScore ?? 0) > 0 || (awayScore ?? 0) > 0)

    return hasLiveStatus && hasRealScores
  }
}

// Initialize configurations on module load
DynamicSportService.initialize()