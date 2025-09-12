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
    const defaults: SportConfiguration[] = [
      {
        name: 'basketball',
        defaultPeriodFormat: 'Quarter',
        defaultTimeFormat: '12:00',
        defaultLeague: 'NBA',
        apiMapping: {
          sportsdb: 'basketball',
          rapidapi: 'basketball',
          espn: 'basketball'
        },
        statusMapping: {
          'live': 'live',
          'in_progress': 'live',
          'finished': 'finished',
          'final': 'finished'
        },
        periodMapping: {
          '1': '1st Quarter',
          '2': '2nd Quarter',
          '3': '3rd Quarter',
          '4': '4th Quarter'
        }
      },
      {
        name: 'football',
        defaultPeriodFormat: 'Quarter',
        defaultTimeFormat: '15:00',
        defaultLeague: 'NFL',
        apiMapping: {
          sportsdb: 'americanfootball',
          rapidapi: 'football',
          espn: 'football'
        },
        statusMapping: {
          'live': 'live',
          'in_progress': 'live',
          'finished': 'finished',
          'final': 'finished'
        },
        periodMapping: {
          '1': '1st Quarter',
          '2': '2nd Quarter',
          '3': '3rd Quarter',
          '4': '4th Quarter'
        }
      },
      {
        name: 'baseball',
        defaultPeriodFormat: 'Inning',
        defaultTimeFormat: '∞',
        defaultLeague: 'MLB',
        apiMapping: {
          sportsdb: 'baseball',
          rapidapi: 'baseball',
          espn: 'baseball'
        },
        statusMapping: {
          'live': 'live',
          'in_progress': 'live',
          'finished': 'finished',
          'final': 'finished'
        },
        periodMapping: {
          '1': '1st Inning',
          '2': '2nd Inning',
          '3': '3rd Inning',
          '4': '4th Inning',
          '5': '5th Inning',
          '6': '6th Inning',
          '7': '7th Inning',
          '8': '8th Inning',
          '9': '9th Inning'
        }
      },
      {
        name: 'hockey',
        defaultPeriodFormat: 'Period',
        defaultTimeFormat: '20:00',
        defaultLeague: 'NHL',
        apiMapping: {
          sportsdb: 'icehockey',
          rapidapi: 'hockey',
          espn: 'hockey'
        },
        statusMapping: {
          'live': 'live',
          'in_progress': 'live',
          'finished': 'finished',
          'final': 'finished'
        },
        periodMapping: {
          '1': '1st Period',
          '2': '2nd Period',
          '3': '3rd Period',
          'OT': 'Overtime'
        }
      },
      {
        name: 'soccer',
        defaultPeriodFormat: 'Half',
        defaultTimeFormat: '45:00',
        defaultLeague: 'MLS',
        apiMapping: {
          sportsdb: 'soccer',
          rapidapi: 'soccer',
          espn: 'soccer'
        },
        statusMapping: {
          'live': 'live',
          'in_progress': 'live',
          'finished': 'finished',
          'final': 'finished'
        },
        periodMapping: {
          '1': '1st Half',
          '2': '2nd Half',
          'ET': 'Extra Time'
        }
      }
    ]

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
                         (homeScore > 0 || awayScore > 0)

    return hasLiveStatus && hasRealScores
  }
}

// Initialize configurations on module load
DynamicSportService.initialize()