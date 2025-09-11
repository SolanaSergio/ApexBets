/**
 * SERVICE FACTORY
 * Manages service instantiation and provides a unified interface
 */

import { BasketballService } from '../sports/basketball/basketball-service'
import { FootballService } from '../sports/football/football-service'
import { BaseballService } from '../sports/baseball/baseball-service'
import { HockeyService } from '../sports/hockey/hockey-service'
import { SoccerService } from '../sports/soccer/soccer-service'
import { SportSpecificService } from './sport-specific-service'
import { SportConfigManager } from './sport-config'

export type SupportedSport = 'basketball' | 'football' | 'baseball' | 'hockey' | 'soccer' | 'tennis' | 'golf'

export interface ServiceFactoryConfig {
  defaultLeague?: string
  enableCaching?: boolean
  enableRateLimiting?: boolean
}

export class ServiceFactory {
  private services: Map<string, SportSpecificService> = new Map()
  private config: ServiceFactoryConfig

  constructor(config: ServiceFactoryConfig = {}) {
    this.config = {
      defaultLeague: 'NBA',
      enableCaching: true,
      enableRateLimiting: true,
      ...config
    }
  }

  /**
   * Get a sport-specific service
   */
  getService(sport: SupportedSport, league?: string): SportSpecificService {
    const key = `${sport}:${league || this.getDefaultLeague(sport)}`
    
    if (!this.services.has(key)) {
      const service = this.createService(sport, league)
      this.services.set(key, service)
    }

    return this.services.get(key)!
  }

  /**
   * Get all supported sports
   */
  getSupportedSports(): SupportedSport[] {
    return SportConfigManager.getAllSports() as SupportedSport[]
  }

  /**
   * Get leagues for a specific sport
   */
  getLeaguesForSport(sport: SupportedSport): string[] {
    return SportConfigManager.getLeaguesForSport(sport)
  }

  /**
   * Get default league for a sport
   */
  getDefaultLeague(sport: SupportedSport): string {
    return SportConfigManager.getDefaultLeague(sport)
  }

  /**
   * Check if a sport is supported
   */
  isSportSupported(sport: string): sport is SupportedSport {
    return SportConfigManager.isSportSupported(sport)
  }

  /**
   * Get service health status for all services
   * Performs health checks sequentially to respect API burst limits
   */
  async getHealthStatus(): Promise<Record<string, boolean>> {
    const status: Record<string, boolean> = {}
    
    // Perform health checks sequentially to respect burst limits
    for (const [key, service] of this.services) {
      try {
        status[key] = await service.healthCheck()
        
        // Add a small delay between health checks to respect burst limits
        await new Promise(resolve => setTimeout(resolve, 100))
      } catch (error) {
        console.warn(`Health check failed for ${key}:`, error)
        status[key] = false
      }
    }

    return status
  }

  /**
   * Clear cache for all services
   */
  clearAllCaches(): void {
    for (const service of this.services.values()) {
      service.clearCache()
    }
  }

  /**
   * Clear health check cache for all services
   */
  clearAllHealthCheckCaches(): void {
    for (const service of this.services.values()) {
      if ('clearHealthCheckCache' in service) {
        (service as any).clearHealthCheckCache()
      }
    }
  }

  /**
   * Get cache statistics for all services
   */
  getAllCacheStats(): Record<string, any> {
    const stats: Record<string, any> = {}
    
    for (const [key, service] of this.services) {
      stats[key] = service.getCacheStats()
    }

    return stats
  }

  /**
   * Create a new service instance
   */
  private createService(sport: SupportedSport, league?: string): SportSpecificService {
    const actualLeague = league || this.getDefaultLeague(sport)

    switch (sport) {
      case 'basketball':
        return new BasketballService(actualLeague)
      case 'football':
        return new FootballService(actualLeague)
      case 'baseball':
        return new BaseballService(actualLeague)
      case 'hockey':
        return new HockeyService(actualLeague)
      case 'soccer':
        return new SoccerService(actualLeague)
      default:
        throw new Error(`Unsupported sport: ${sport}`)
    }
  }

  /**
   * Warm up services by pre-loading common data
   */
  async warmupServices(sports: SupportedSport[] = ['basketball', 'football']): Promise<void> {
    const warmupPromises = sports.map(async (sport) => {
      try {
        const service = this.getService(sport)
        await service.getTeams({ limit: 5 })
        await service.getGames({ limit: 5 })
      } catch (error) {
        console.warn(`Failed to warmup ${sport} service:`, error)
      }
    })

    await Promise.allSettled(warmupPromises)
  }
}

// Export singleton instance
export const serviceFactory = new ServiceFactory()
