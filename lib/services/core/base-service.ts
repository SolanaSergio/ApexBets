/**
 * BASE SERVICE
 * Core functionality shared across all services
 */

import { unifiedCacheService } from '../unified-cache-service'
import { enhancedRateLimiter } from '../enhanced-rate-limiter'
import { errorHandlingService } from '../error-handling-service'

export interface ServiceConfig {
  name: string
  cacheTTL: number
  rateLimitService: string
  retryAttempts: number
  retryDelay: number
}

export abstract class BaseService {
  protected config: ServiceConfig
  private static inFlightRequests: Map<string, Promise<unknown>> = new Map()

  constructor(config: ServiceConfig) {
    this.config = config
  }

  protected async getCachedOrFetch<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttl?: number,
    options?: { dbOnly?: boolean }
  ): Promise<T> {
    // Deduplicate concurrent identical requests
    const existing = BaseService.inFlightRequests.get(key) as Promise<T> | undefined
    if (existing) {
      return existing
    }
    // Check unified cache first
    const cached = await unifiedCacheService.get<T>(key)
    if (cached) {
      return cached
    }

    // Build in-flight promise
    const inFlightPromise = (async () => {
      const isDbOnly = options?.dbOnly === true
      // Check rate limit before making external requests
      if (!isDbOnly) {
        const rateLimitResult = await enhancedRateLimiter.checkRateLimit(
          this.config.rateLimitService,
          'default'
        )
        if (!rateLimitResult.allowed) {
          console.warn(`Rate limit exceeded for ${this.config.name}: Returning empty data`)
          return [] as T
        }
      }

      // Make request with error handling and retry
      // Removed unused startTime variable
      try {
        const data = await errorHandlingService.withCircuitBreaker(
          () =>
            errorHandlingService.withRetry(fetchFn, {
              maxRetries: this.config.retryAttempts,
              baseDelay: this.config.retryDelay,
              maxDelay: this.config.retryDelay * 10,
              backoffMultiplier: 2,
            }),
          this.config.name,
          {
            failureThreshold: 5,
            recoveryTimeout: 60000,
            monitoringPeriod: 300000,
          }
        )

        // Removed unused responseTime variable
        // Rate limiting tracking is now handled by the centralized enhanced rate limiter

        // Cache the result using unified cache
        await unifiedCacheService.set(key, data, ttl || this.config.cacheTTL, {
          priority: 'medium',
          dataType: this.config.name,
        })

        return data
      } catch (error) {
        // Removed unused responseTime variable
        // Rate limiting tracking is now handled by the centralized enhanced rate limiter

        console.warn(`Error fetching data for ${this.config.name}:`, error)
        return [] as T
      }
    })()

    BaseService.inFlightRequests.set(key, inFlightPromise)
    try {
      return await inFlightPromise
    } finally {
      BaseService.inFlightRequests.delete(key)
    }
  }

  protected getCacheKey(prefix: string, ...params: (string | number)[]): string {
    return `${this.config.name}:${prefix}:${params.join(':')}`
  }

  async healthCheck(): Promise<boolean> {
    try {
      // Override in subclasses for specific health checks
      return true
    } catch (error) {
      return false
    }
  }

  clearCache(): void {
    unifiedCacheService.clear()
  }

  getCacheStats() {
    return unifiedCacheService.getStats()
  }
}
