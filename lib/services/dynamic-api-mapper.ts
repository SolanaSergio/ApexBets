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
    const defaultMappings = [
      // TheSportsDB mappings
      {
        sport: 'basketball',
        provider: 'thesportsdb',
        endpoint: 'basketball',
        sportName: 'basketball',
        dataTypeMapping: {
          games: 'events',
          teams: 'teams',
          players: 'players',
          standings: 'table'
        }
      },
      {
        sport: 'football',
        provider: 'thesportsdb',
        endpoint: 'americanfootball',
        sportName: 'americanfootball',
        dataTypeMapping: {
          games: 'events',
          teams: 'teams',
          players: 'players',
          standings: 'table'
        }
      },
      {
        sport: 'baseball',
        provider: 'thesportsdb',
        endpoint: 'baseball',
        sportName: 'baseball',
        dataTypeMapping: {
          games: 'events',
          teams: 'teams',
          players: 'players',
          standings: 'table'
        }
      },
      {
        sport: 'hockey',
        provider: 'thesportsdb',
        endpoint: 'icehockey',
        sportName: 'icehockey',
        dataTypeMapping: {
          games: 'events',
          teams: 'teams',
          players: 'players',
          standings: 'table'
        }
      },
      {
        sport: 'soccer',
        provider: 'thesportsdb',
        endpoint: 'soccer',
        sportName: 'soccer',
        dataTypeMapping: {
          games: 'events',
          teams: 'teams',
          players: 'players',
          standings: 'table'
        }
      },
      // ESPN mappings
      {
        sport: 'basketball',
        provider: 'espn',
        endpoint: 'basketball',
        sportName: 'mens-college-basketball',
        dataTypeMapping: {
          games: 'scoreboard',
          teams: 'teams',
          standings: 'standings'
        }
      },
      {
        sport: 'football',
        provider: 'espn',
        endpoint: 'football',
        sportName: 'nfl',
        dataTypeMapping: {
          games: 'scoreboard',
          teams: 'teams',
          standings: 'standings'
        }
      },
      // NBA Stats API
      {
        sport: 'basketball',
        provider: 'nba-stats',
        endpoint: 'basketball',
        sportName: 'nba',
        dataTypeMapping: {
          games: 'scoreboard',
          teams: 'teams',
          players: 'players',
          stats: 'playerstats',
          standings: 'standings'
        }
      },
      // MLB Stats API
      {
        sport: 'baseball',
        provider: 'mlb-stats',
        endpoint: 'baseball',
        sportName: 'mlb',
        dataTypeMapping: {
          games: 'schedule',
          teams: 'teams',
          players: 'roster',
          stats: 'stats',
          standings: 'standings'
        }
      },
      // NHL API
      {
        sport: 'hockey',
        provider: 'nhl',
        endpoint: 'hockey',
        sportName: 'nhl',
        dataTypeMapping: {
          games: 'schedule',
          teams: 'teams',
          players: 'roster',
          stats: 'stats',
          standings: 'standings'
        }
      },
      // Ball Don't Lie (basketball only)
      {
        sport: 'basketball',
        provider: 'balldontlie',
        endpoint: 'basketball',
        sportName: 'nba',
        dataTypeMapping: {
          games: 'games',
          teams: 'teams',
          players: 'players',
          stats: 'stats'
        }
      },
      // API-Sports (RapidAPI)
      {
        sport: 'basketball',
        provider: 'api-sports',
        endpoint: 'basketball',
        sportName: 'basketball',
        dataTypeMapping: {
          games: 'games',
          teams: 'teams',
          standings: 'standings',
          odds: 'odds'
        }
      },
      {
        sport: 'football',
        provider: 'api-sports',
        endpoint: 'football',
        sportName: 'football',
        dataTypeMapping: {
          games: 'fixtures',
          teams: 'teams',
          standings: 'standings',
          odds: 'odds'
        }
      },
      {
        sport: 'baseball',
        provider: 'api-sports',
        endpoint: 'baseball',
        sportName: 'baseball',
        dataTypeMapping: {
          games: 'games',
          teams: 'teams',
          standings: 'standings'
        }
      },
      {
        sport: 'hockey',
        provider: 'api-sports',
        endpoint: 'hockey',
        sportName: 'hockey',
        dataTypeMapping: {
          games: 'games',
          teams: 'teams',
          standings: 'standings'
        }
      },
      {
        sport: 'soccer',
        provider: 'api-sports',
        endpoint: 'soccer',
        sportName: 'football',
        dataTypeMapping: {
          games: 'fixtures',
          teams: 'teams',
          standings: 'standings',
          odds: 'odds'
        }
      }
    ]

    defaultMappings.forEach(mapping => {
      if (!this.mappings.has(mapping.sport)) {
        this.mappings.set(mapping.sport, new Map())
      }
      
      this.mappings.get(mapping.sport)?.set(mapping.provider, {
        provider: mapping.provider,
        endpoint: mapping.endpoint,
        sportName: mapping.sportName,
        dataTypeMapping: mapping.dataTypeMapping
      })
    })
  }

  /**
   * Get API mapping for a specific sport and provider
   */
  static getMapping(sport: string, provider: string): ApiMapping | null {
    return this.mappings.get(sport.toLowerCase())?.get(provider.toLowerCase()) || null
  }

  /**
   * Get sport name for API provider
   */
  static getSportName(sport: string, provider: string): string {
    const mapping = this.getMapping(sport, provider)
    return mapping?.sportName || sport
  }

  /**
   * Get endpoint name for API provider
   */
  static getEndpoint(sport: string, provider: string): string {
    const mapping = this.getMapping(sport, provider)
    return mapping?.endpoint || sport
  }

  /**
   * Get data type mapping for API provider
   */
  static getDataTypeMapping(sport: string, provider: string, dataType: string): string {
    const mapping = this.getMapping(sport, provider)
    return mapping?.dataTypeMapping[dataType] || dataType
  }

  /**
   * Check if provider supports sport
   */
  static supportsSpot(sport: string, provider: string): boolean {
    return this.mappings.get(sport.toLowerCase())?.has(provider.toLowerCase()) || false
  }

  /**
   * Get all providers for a sport
   */
  static getProvidersForSport(sport: string): string[] {
    const sportMappings = this.mappings.get(sport.toLowerCase())
    return sportMappings ? Array.from(sportMappings.keys()) : []
  }

  /**
   * Get all supported sports
   */
  static getSupportedSports(): string[] {
    return Array.from(this.mappings.keys())
  }
}

// Initialize mappings on module load
DynamicApiMapper.initialize()