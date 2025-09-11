/**
 * BASE SERVICE
 * Core functionality shared across all services
 */

import { cacheService } from '../cache-service'
import { rateLimiter } from '../rate-limiter'
import { errorHandlingService } from '../error-handling-service'
import { apiRateLimiter } from '@/lib/rules/api-rate-limiter'

export interface ServiceConfig {
  name: string
  cacheTTL: number
  rateLimitService: string
  retryAttempts: number
  retryDelay: number
}

export abstract class BaseService {
  protected config: ServiceConfig

  constructor(config: ServiceConfig) {
    this.config = config
  }

  protected async getCachedOrFetch<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    // Check cache first
    const cached = cacheService.get<T>(key)
    if (cached) {
      return cached
    }

    // Check API rate limit with retry logic
    const canProceed = await apiRateLimiter.checkRateLimitWithRetry(this.config.rateLimitService as any)
    if (!canProceed) {
      // Instead of throwing an error, return empty data and log warning
      console.warn(`Rate limit exceeded for ${this.config.name}: Returning empty data`)
      return [] as T
    }

    // Wait for rate limit
    await rateLimiter.waitForRateLimit(this.config.rateLimitService)

    // Make request with error handling and retry
    const startTime = Date.now()
    try {
      const data = await errorHandlingService.withRetry(
        fetchFn,
        this.config.retryAttempts,
        this.config.retryDelay
      )

      const responseTime = Date.now() - startTime
      rateLimiter.recordRequest(this.config.rateLimitService, responseTime, false)
      
      // Record successful API request
      apiRateLimiter.recordRequest(this.config.rateLimitService as any)

      // Cache the result
      cacheService.set(key, data, ttl || this.config.cacheTTL)
      return data
    } catch (error) {
      const responseTime = Date.now() - startTime
      rateLimiter.recordRequest(this.config.rateLimitService, responseTime, true)
      
      // Instead of throwing, log error and return empty data
      console.warn(`Error fetching data for ${this.config.name}:`, error)
      return [] as T
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
    cacheService.clear()
  }

  getCacheStats() {
    return cacheService.getStats()
  }
}
