/**
 * DYNAMIC API MAPPER
 * Maps sports to their correct API endpoints dynamically without hardcoded values
 */

export interface ApiMapping {
  provider: string
  endpoint: string
  sportName: string
  dataTypeMapping: Record<string, string>
}

export class DynamicApiMapper {
  private static mappings: Map<string, Map<string, ApiMapping>> = new Map()

  /**
   * Initialize API mappings from configuration
   */
  static async initialize(): Promise<void> {
    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()

      if (supabase) {
        const { data: apiMappings, error } = await supabase
          .from('api_mappings')
          .select('*')
          .eq('is_active', true)

        if (!error && apiMappings) {
          apiMappings.forEach((mapping: any) => {
            if (!this.mappings.has(mapping.sport)) {
              this.mappings.set(mapping.sport, new Map())
            }
            
            this.mappings.get(mapping.sport)?.set(mapping.provider, {
              provider: mapping.provider,
              endpoint: mapping.endpoint,
              sportName: mapping.sport_name,
              dataTypeMapping: mapping.data_type_mapping || {}
            })
          })  
        }
      }
    } catch (error) {
      console.warn('Failed to load API mappings from database, using defaults:', error)
      this.loadDefaultMappings()
    }
  }

  /**
   * Load default mappings as fallback
   */
  private static loadDefaultMappings(): void {
    console.warn('Loading fallback API mappings - database unavailable')

    const supportedSports = process.env.SUPPORTED_SPORTS?.split(',') || ['basketball', 'football', 'baseball', 'hockey', 'soccer']
    const providers = ['thesportsdb', 'rapidapi', 'espn']

    const defaultMappings = []

    // Generate dynamic mappings from environment variables
    for (const sport of supportedSports) {
      for (const provider of providers) {
        const sportUpper = sport.toUpperCase()
        const providerUpper = provider.toUpperCase()

        defaultMappings.push({
          sport: sport.trim(),
          provider: provider,
          endpoint: process.env[`${providerUpper}_${sportUpper}_ENDPOINT`] || sport,
          sportName: process.env[`${providerUpper}_${sportUpper}_NAME`] || sport,
          dataTypeMapping: {
            games: process.env[`${providerUpper}_GAMES_MAPPING`] || 'events',
            teams: process.env[`${providerUpper}_TEAMS_MAPPING`] || 'teams',
            players: process.env[`${providerUpper}_PLAYERS_MAPPING`] || 'players',
            standings: process.env[`${providerUpper}_STANDINGS_MAPPING`] || 'table'
          }
        })
      }
    }

    defaultMappings.forEach(mapping => {
      if (!this.mappings.has(mapping.sport)) {
        this.mappings.set(mapping.sport, new Map())
      }
      this.mappings.get(mapping.sport)!.set(mapping.provider, mapping)
    })
  }

  /**
   * Get mapping for a specific sport and provider
   */
  static getMapping(sport: string, provider: string): ApiMapping | null {
    return this.mappings.get(sport)?.get(provider) || null
  }

  /**
   * Get all mappings for a sport
   */
  static getSportMappings(sport: string): Map<string, ApiMapping> | null {
    return this.mappings.get(sport) || null
  }

  /**
   * Get all available providers for a sport
   */
  static getProviders(sport: string): string[] {
    const sportMappings = this.mappings.get(sport)
    return sportMappings ? Array.from(sportMappings.keys()) : []
  }

  /**
   * Get all supported sports
   */
  static getSupportedSports(): string[] {
    return Array.from(this.mappings.keys())
  }

  /**
   * Get endpoint for a specific sport and provider
   */
  static getEndpoint(sport: string, provider: string): string | null {
    const mapping = this.getMapping(sport, provider)
    return mapping?.endpoint || null
  }

  /**
   * Get sport name for API calls
   */
  static getSportName(sport: string, provider: string): string | null {
    const mapping = this.getMapping(sport, provider)
    return mapping?.sportName || null
  }

  /**
   * Get data type mapping for a specific sport, provider, and data type
   */
  static getDataTypeMapping(sport: string, provider: string, dataType: string): string | null {
    const mapping = this.getMapping(sport, provider)
    return mapping?.dataTypeMapping[dataType] || null
  }
}

// Initialize mappings on module load
DynamicApiMapper.initialize()