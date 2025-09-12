/**
 * CLIENT-SIDE HEALTH SERVICE
 * Service for checking API health status without server dependencies
 */

import { CLIENT_CONFIG } from '@/lib/config/client-config'

export interface HealthStatus {
  [service: string]: boolean
}

export interface ServiceHealth {
  name: string
  status: 'healthy' | 'degraded' | 'unhealthy'
  lastChecked: Date
  responseTime?: number
}

class ClientHealthService {
  private healthCache = new Map<string, ServiceHealth>()
  private checkInterval?: NodeJS.Timeout

  /**
   * Check health status of all services
   */
  async checkAllServices(): Promise<HealthStatus> {
    const services = CLIENT_CONFIG.SPORTS.SUPPORTED
    const healthChecks = await Promise.allSettled(
      services.map(service => this.checkServiceHealth(service))
    )

    const status: HealthStatus = {}
    
    healthChecks.forEach((result, index) => {
      const service = services[index]
      if (result.status === 'fulfilled') {
        status[service] = result.value.status === 'healthy'
      } else {
        status[service] = false
        console.warn(`Health check failed for ${service}:`, result.reason)
      }
    })

    return status
  }

  /**
   * Check health of a specific service
   */
  async checkServiceHealth(service: string): Promise<ServiceHealth> {
    const startTime = Date.now()
    
    try {
      const response = await fetch(`${CLIENT_CONFIG.API_BASE_URL}/health?service=${service}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(CLIENT_CONFIG.ERROR.TIMEOUT),
      })

      const responseTime = Date.now() - startTime
      const isHealthy = response.ok

      const health: ServiceHealth = {
        name: service,
        status: isHealthy ? 'healthy' : 'unhealthy',
        lastChecked: new Date(),
        responseTime,
      }

      this.healthCache.set(service, health)
      return health
    } catch (error) {
      const health: ServiceHealth = {
        name: service,
        status: 'unhealthy',
        lastChecked: new Date(),
      }

      this.healthCache.set(service, health)
      console.error(`Health check failed for ${service}:`, error)
      return health
    }
  }

  /**
   * Get cached health status
   */
  getCachedHealth(service: string): ServiceHealth | undefined {
    return this.healthCache.get(service)
  }

  /**
   * Get all cached health statuses
   */
  getAllCachedHealth(): ServiceHealth[] {
    return Array.from(this.healthCache.values())
  }

  /**
   * Start periodic health checks
   */
  startPeriodicChecks(intervalMs: number = CLIENT_CONFIG.UI.REFRESH_INTERVAL): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval)
    }

    this.checkInterval = setInterval(() => {
      this.checkAllServices().catch(console.error)
    }, intervalMs)

    // Initial check
    this.checkAllServices().catch(console.error)
  }

  /**
   * Stop periodic health checks
   */
  stopPeriodicChecks(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval)
      this.checkInterval = undefined
    }
  }

  /**
   * Check if a service is healthy
   */
  isServiceHealthy(service: string): boolean {
    const health = this.healthCache.get(service)
    return health?.status === 'healthy'
  }

  /**
   * Get overall system health
   */
  getOverallHealth(): 'healthy' | 'degraded' | 'unhealthy' {
    const allHealth = this.getAllCachedHealth()
    
    if (allHealth.length === 0) {
      return 'unhealthy'
    }

    const healthyCount = allHealth.filter(h => h.status === 'healthy').length
    const totalCount = allHealth.length

    if (healthyCount === totalCount) {
      return 'healthy'
    } else if (healthyCount > totalCount / 2) {
      return 'degraded'
    } else {
      return 'unhealthy'
    }
  }
}

export const clientHealthService = new ClientHealthService()
