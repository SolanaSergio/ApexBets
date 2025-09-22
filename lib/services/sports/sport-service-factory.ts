/**
 * Sport Service Factory
 * Dynamic, configuration-driven sport service dispatcher
 * No hardcoded sport-specific logic
 */

import { envValidator } from '../../config/env-validator'
import { structuredLogger } from '../structured-logger'

export interface SportService {
  getGames(params: any): Promise<any[]>
  getTeams(params: any): Promise<any[]>
  getPlayers(params: any): Promise<any[]>
  getStandings(league?: string): Promise<any[]>
  getOdds(params: any): Promise<any[]>
  healthCheck(): Promise<boolean>
}

export interface SportConfig {
  name: string
  displayName: string
  isActive: boolean
  apiProviders: string[]
  defaultLeague?: string
  supportedLeagues: string[]
}

class SportServiceFactory {
  private static instance: SportServiceFactory
  private sportConfigs: Map<string, SportConfig> = new Map()
  private sportServices: Map<string, SportService> = new Map()

  public static getInstance(): SportServiceFactory {
    if (!SportServiceFactory.instance) {
      SportServiceFactory.instance = new SportServiceFactory()
    }
    return SportServiceFactory.instance
  }

  /**
   * Initialize sport configurations from database
   * No hardcoded sports - all loaded dynamically
   */
  async initialize(): Promise<void> {
    try {
      // Load sport configurations from database
      await this.loadSportConfigurations()
      
      // Initialize sport services dynamically
      await this.initializeSportServices()
      
      structuredLogger.info('Sport service factory initialized', {
        supportedSports: Array.from(this.sportConfigs.keys()),
        totalServices: this.sportServices.size
      })
    } catch (error) {
      structuredLogger.error('Failed to initialize sport service factory', {
        error: error instanceof Error ? error.message : String(error)
      })
      throw error
    }
  }

  /**
   * Get sport service by name
   * Returns null if sport not supported or not configured
   */
  getSportService(sport: string): SportService | null {
    if (!envValidator.isSportSupported(sport)) {
      structuredLogger.warn('Sport not supported', { sport })
      return null
    }

    const service = this.sportServices.get(sport)
    if (!service) {
      structuredLogger.warn('Sport service not found', { sport })
      return null
    }

    return service
  }

  /**
   * Get all supported sports
   */
  getSupportedSports(): string[] {
    return Array.from(this.sportConfigs.keys())
  }

  /**
   * Get sport configuration
   */
  getSportConfig(sport: string): SportConfig | null {
    return this.sportConfigs.get(sport) || null
  }

  /**
   * Check if sport is active and supported
   */
  isSportActive(sport: string): boolean {
    const config = this.sportConfigs.get(sport)
    return config ? config.isActive : false
  }

  private async loadSportConfigurations(): Promise<void> {
    try {
      // Import database service
      const { databaseService } = await import('../database-service')
      
      const query = `
        SELECT 
          name,
          display_name,
          is_active,
          api_providers,
          default_league,
          supported_leagues
        FROM sport_configurations
        WHERE is_active = true
        ORDER BY display_name
      `
      
      const result = await databaseService.executeSQL(query)
      
      if (!result.success) {
        throw new Error(`Failed to load sport configurations: ${result.error}`)
      }

      // Clear existing configs
      this.sportConfigs.clear()

      // Load configurations from database
      for (const row of result.data || []) {
        const config: SportConfig = {
          name: row.name,
          displayName: row.display_name,
          isActive: row.is_active,
          apiProviders: Array.isArray(row.api_providers) ? row.api_providers : [],
          defaultLeague: row.default_league,
          supportedLeagues: Array.isArray(row.supported_leagues) ? row.supported_leagues : []
        }
        
        this.sportConfigs.set(config.name, config)
      }

      structuredLogger.info('Loaded sport configurations from database', {
        count: this.sportConfigs.size,
        sports: Array.from(this.sportConfigs.keys())
      })

    } catch (error) {
      structuredLogger.error('Failed to load sport configurations', {
        error: error instanceof Error ? error.message : String(error)
      })
      
      // If database fails, fall back to environment-based configuration
      await this.loadFromEnvironment()
    }
  }

  private async loadFromEnvironment(): Promise<void> {
    const supportedSports = envValidator.getSupportedSports()
    
    if (supportedSports.length === 0) {
      structuredLogger.warn('No sports configured in environment')
      return
    }

    // Create basic configurations from environment
    for (const sport of supportedSports) {
      const config: SportConfig = {
        name: sport,
        displayName: sport.charAt(0).toUpperCase() + sport.slice(1),
        isActive: true,
        apiProviders: ['sportsdb'], // Default provider
        supportedLeagues: []
      }
      
      this.sportConfigs.set(sport, config)
    }

    structuredLogger.info('Loaded sport configurations from environment', {
      count: this.sportConfigs.size,
      sports: Array.from(this.sportConfigs.keys())
    })
  }

  private async initializeSportServices(): Promise<void> {
    for (const [sportName, config] of this.sportConfigs) {
      try {
        // Dynamically import sport service based on configuration
        const service = await this.createSportService(sportName, config)
        this.sportServices.set(sportName, service)
        
        structuredLogger.debug('Initialized sport service', { sport: sportName })
      } catch (error) {
        structuredLogger.error('Failed to initialize sport service', {
          sport: sportName,
          error: error instanceof Error ? error.message : String(error)
        })
      }
    }
  }

  private async createSportService(sportName: string, config: SportConfig): Promise<SportService> {
    // Create a generic sport service that uses the configured API providers
    const self = this
    return {
      async getGames(params: any): Promise<any[]> {
        return self.executeSportRequest(sportName, 'games', params, config)
      },
      
      async getTeams(params: any): Promise<any[]> {
        return self.executeSportRequest(sportName, 'teams', params, config)
      },
      
      async getPlayers(params: any): Promise<any[]> {
        return self.executeSportRequest(sportName, 'players', params, config)
      },
      
      async getStandings(league?: string): Promise<any[]> {
        return self.executeSportRequest(sportName, 'standings', { league }, config)
      },
      
      async getOdds(params: any): Promise<any[]> {
        return self.executeSportRequest(sportName, 'odds', params, config)
      },
      
      async healthCheck(): Promise<boolean> {
        try {
          await self.executeSportRequest(sportName, 'health', {}, config)
          return true
        } catch {
          return false
        }
      }
    }
  }

  private async executeSportRequest(sport: string, dataType: string, params: any, config: SportConfig): Promise<any[]> {
    try {
      // Import API fallback strategy
      const { APIFallbackStrategy } = await import('../api-fallback-strategy')
      const apiStrategy = APIFallbackStrategy.getInstance()
      
      // Use configured API providers
      const requestParams = {
        sport,
        dataType: dataType as any,
        params,
        providers: config.apiProviders,
        priority: 'medium' as const
      }
      
      const result = await apiStrategy.executeRequest(requestParams)
      return Array.isArray(result.data) ? result.data : []
      
    } catch (error) {
      structuredLogger.error('Sport request failed', {
        sport,
        dataType,
        params,
        error: error instanceof Error ? error.message : String(error)
      })
      return []
    }
  }
}

export const sportServiceFactory = SportServiceFactory.getInstance()
