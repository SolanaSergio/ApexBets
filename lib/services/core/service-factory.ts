/**
 * SERVICE FACTORY
 * Dynamic service instantiation and unified interface
 */

import { SportSpecificService } from './sport-specific-service'
import { SportConfigManager } from './sport-config'
import { ServiceRegistry } from './service-registry'

export type SupportedSport = string

export interface ServiceFactoryConfig {
  defaultLeague?: string
  enableCaching?: boolean
  enableRateLimiting?: boolean
}

export class ServiceFactory {
  private services: Map<string, SportSpecificService> = new Map()
  private config: ServiceFactoryConfig
  private serviceRegistry: Map<string, new (league: string) => SportSpecificService> = new Map()

  constructor(config: ServiceFactoryConfig = {}) {
    this.config = {
      enableCaching: true,
      enableRateLimiting: true,
      ...config
    }
  }

  /**
   * Register a service class for a sport
   */
  registerService(sport: string, serviceClass: new (league: string) => SportSpecificService): void {
    this.serviceRegistry.set(sport, serviceClass)
  }

  /**
   * Get a sport-specific service
   */
  async getService(sport: SupportedSport, league?: string): Promise<SportSpecificService> {
    // Ensure service registry is initialized
    if (!ServiceRegistry.isInitialized()) {
      await ServiceRegistry.initialize()
    }

    const actualLeague = league || await this.getDefaultLeague(sport)
    const key = `${sport}:${actualLeague}`
    
    if (!this.services.has(key)) {
      const service = await this.createService(sport, actualLeague)
      this.services.set(key, service)
    }

    return this.services.get(key)!
  }

  /**
   * Get all supported sports
   */
  async getSupportedSports(): Promise<SupportedSport[]> {
    return await SportConfigManager.getAllSports()
  }

  /**
   * Get all supported sports synchronously (for React components)
   */
  getSupportedSportsSync(): SupportedSport[] {
    return SportConfigManager.getAllSportsSync()
  }

  /**
   * Get leagues for a specific sport
   */
  async getLeaguesForSport(sport: SupportedSport): Promise<string[]> {
    return await SportConfigManager.getLeaguesForSport(sport)
  }

  /**
   * Get default league for a sport
   */
  async getDefaultLeague(sport: SupportedSport): Promise<string> {
    return await SportConfigManager.getDefaultLeague(sport)
  }

  /**
   * Check if a sport is supported
   */
  async isSportSupported(sport: string): Promise<boolean> {
    return await SportConfigManager.isSportSupported(sport)
  }

  /**
   * Get service health status for all services
   * Performs health checks sequentially to respect API burst limits
   */
  async getHealthStatus(): Promise<Record<string, boolean>> {
    const status: Record<string, boolean> = {}
    
    // Perform health checks sequentially to respect burst limits
    for (const [key, service] of Array.from(this.services.entries())) {
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
    for (const service of Array.from(this.services.values())) {
      service.clearCache()
    }
  }

  /**
   * Clear health check cache for all services
   */
  clearAllHealthCheckCaches(): void {
    for (const service of Array.from(this.services.values())) {
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
    
    for (const [key, service] of Array.from(this.services.entries())) {
      stats[key] = service.getCacheStats()
    }

    return stats
  }

  /**
   * Create a new service instance
   */
  private async createService(sport: SupportedSport, league: string): Promise<SportSpecificService> {
    const ServiceClass = this.serviceRegistry.get(sport)
    
    if (!ServiceClass) {
      throw new Error(`No service registered for sport: ${sport}`)
    }

    return new ServiceClass(league)
  }

  /**
   * Warm up services by pre-loading common data
   */
  async warmupServices(sports: SupportedSport[] = []): Promise<void> {
    const warmupPromises = sports.map(async (sport) => {
      try {
        const service = await this.getService(sport)
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
