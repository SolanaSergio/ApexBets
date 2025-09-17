/**
 * Comprehensive Error Recovery System
 * Implements circuit breakers, fallback strategies, and graceful degradation
 */

import { structuredLogger as logger } from './structured-logger'

interface RecoveryConfig {
  serviceName: string
  primaryApi: string
  fallbackApis: string[]
  cacheStrategy: {
    enabled: boolean
    ttl: number
    staleWhileRevalidate: boolean
  }
  circuitBreaker: {
    enabled: boolean
    failureThreshold: number
    timeoutMs: number
    halfOpenRetryDelay: number
  }
  gracefulDegradation: {
    enabled: boolean
    fallbackData: any
  }
}

export class ComprehensiveErrorRecovery {
  private recoveryConfigs: Map<string, RecoveryConfig> = new Map()
  private circuitStates: Map<string, 'closed' | 'open' | 'half-open'> = new Map()
  private failureCounts: Map<string, number> = new Map()
  private lastFailureTimes: Map<string, number> = new Map()
  private cache: Map<string, { data: any, timestamp: number, ttl: number }> = new Map()

  constructor() {
    this.initializeRecoveryConfigs()
  }

  private initializeRecoveryConfigs(): void {
    // Basketball service recovery
    this.recoveryConfigs.set('basketball', {
      serviceName: 'Basketball Service',
      primaryApi: 'balldontlie',
      fallbackApis: ['nba-stats', 'espn', 'sportsdb'],
      cacheStrategy: {
        enabled: true,
        ttl: 5 * 60 * 1000, // 5 minutes
        staleWhileRevalidate: true
      },
      circuitBreaker: {
        enabled: true,
        failureThreshold: 3,
        timeoutMs: 2 * 60 * 1000, // 2 minutes
        halfOpenRetryDelay: 30 * 1000 // 30 seconds
      },
      gracefulDegradation: {
        enabled: true,
        fallbackData: {
          games: [],
          teams: [],
          message: 'Basketball data temporarily unavailable'
        }
      }
    })

    // Soccer service recovery
    this.recoveryConfigs.set('soccer', {
      serviceName: 'Soccer Service',
      primaryApi: 'api-sports',
      fallbackApis: ['espn', 'sportsdb'],
      cacheStrategy: {
        enabled: true,
        ttl: 10 * 60 * 1000, // 10 minutes
        staleWhileRevalidate: true
      },
      circuitBreaker: {
        enabled: true,
        failureThreshold: 2, // More sensitive due to rate limits
        timeoutMs: 10 * 60 * 1000, // 10 minutes
        halfOpenRetryDelay: 60 * 1000 // 1 minute
      },
      gracefulDegradation: {
        enabled: true,
        fallbackData: {
          games: [],
          teams: [],
          message: 'Soccer data temporarily unavailable'
        }
      }
    })

    // Odds service recovery
    this.recoveryConfigs.set('odds', {
      serviceName: 'Odds Service',
      primaryApi: 'odds-api',
      fallbackApis: [], // No good fallbacks for odds
      cacheStrategy: {
        enabled: true,
        ttl: 2 * 60 * 1000, // 2 minutes
        staleWhileRevalidate: false // Odds need to be fresh
      },
      circuitBreaker: {
        enabled: true,
        failureThreshold: 1, // Very sensitive due to low limits
        timeoutMs: 30 * 60 * 1000, // 30 minutes
        halfOpenRetryDelay: 5 * 60 * 1000 // 5 minutes
      },
      gracefulDegradation: {
        enabled: true,
        fallbackData: {
          odds: [],
          message: 'Betting odds temporarily unavailable'
        }
      }
    })

    // Initialize circuit breaker states
    for (const serviceName of this.recoveryConfigs.keys()) {
      this.circuitStates.set(serviceName, 'closed')
      this.failureCounts.set(serviceName, 0)
    }
  }

  /**
   * Execute operation with comprehensive error recovery
   */
  async executeWithRecovery<T>(
    serviceName: string,
    operation: () => Promise<T>,
    cacheKey?: string
  ): Promise<T> {
    const config = this.recoveryConfigs.get(serviceName)
    if (!config) {
      // No recovery config, execute directly
      return await operation()
    }

    // Check cache first
    if (config.cacheStrategy.enabled && cacheKey) {
      const cached = this.getFromCache(cacheKey)
      if (cached) {
        // Return cached data and optionally refresh in background
        if (config.cacheStrategy.staleWhileRevalidate) {
          this.refreshInBackground(serviceName, operation, cacheKey)
        }
        return cached
      }
    }

    // Check circuit breaker
    const circuitState = this.circuitStates.get(serviceName)
    if (circuitState === 'open') {
      return await this.handleOpenCircuit(serviceName, config, cacheKey)
    }

    try {
      // Execute primary operation
      const result = await operation()
      
      // Cache successful result
      if (config.cacheStrategy.enabled && cacheKey) {
        this.setCache(cacheKey, result, config.cacheStrategy.ttl)
      }
      
      // Reset circuit breaker on success
      this.resetCircuitBreaker(serviceName)
      
      return result
    } catch (error) {
      return await this.handleOperationFailure(serviceName, config, error as Error, cacheKey)
    }
  }

  private async handleOperationFailure<T>(
    serviceName: string,
    config: RecoveryConfig,
    error: Error,
    cacheKey?: string
  ): Promise<T> {
    // Record failure
    this.recordFailure(serviceName)
    
    // Log error
    logger.logBusinessEvent('service_failure', {
      service: serviceName,
      error: error.message,
      failureCount: this.failureCounts.get(serviceName)
    })

    // Check if circuit breaker should open
    const failures = this.failureCounts.get(serviceName) || 0
    if (failures >= config.circuitBreaker.failureThreshold) {
      this.openCircuitBreaker(serviceName, config)
    }

    // Try fallback strategies
    return await this.tryFallbackStrategies(serviceName, config, error, cacheKey)
  }

  private async tryFallbackStrategies<T>(
    serviceName: string,
    config: RecoveryConfig,
    originalError: Error,
    cacheKey?: string
  ): Promise<T> {
    // Strategy 1: Try stale cache
    if (config.cacheStrategy.enabled && cacheKey) {
      const staleData = this.getFromCache(cacheKey, true) // Allow stale
      if (staleData) {
        logger.logBusinessEvent('fallback_cache_used', {
          service: serviceName,
          cacheKey
        })
        return staleData
      }
    }

    // Strategy 2: Try alternative APIs
    for (const fallbackApi of config.fallbackApis) {
      try {
        // This would need to be implemented per service
        // For now, we'll log the attempt
        logger.logBusinessEvent('fallback_api_attempt', {
          service: serviceName,
          fallbackApi
        })
        
        // In a real implementation, you'd call the fallback API here
        // const result = await this.callFallbackApi(fallbackApi, ...)
        // return result
      } catch (fallbackError) {
        logger.logBusinessEvent('fallback_api_failed', {
          service: serviceName,
          fallbackApi,
          error: (fallbackError as Error).message
        })
        continue
      }
    }

    // Strategy 3: Graceful degradation
    if (config.gracefulDegradation.enabled) {
      logger.logBusinessEvent('graceful_degradation_used', {
        service: serviceName
      })
      return config.gracefulDegradation.fallbackData as T
    }

    // All strategies failed, throw original error
    throw originalError
  }

  private async handleOpenCircuit<T>(
    serviceName: string,
    config: RecoveryConfig,
    cacheKey?: string
  ): Promise<T> {
    logger.logBusinessEvent('circuit_breaker_open', {
      service: serviceName
    })

    // Try cache first
    if (config.cacheStrategy.enabled && cacheKey) {
      const cached = this.getFromCache(cacheKey, true) // Allow stale
      if (cached) {
        return cached
      }
    }

    // Return graceful degradation
    if (config.gracefulDegradation.enabled) {
      return config.gracefulDegradation.fallbackData as T
    }

    throw new Error(`${config.serviceName} is temporarily unavailable (circuit breaker open)`)
  }

  private recordFailure(serviceName: string): void {
    const current = this.failureCounts.get(serviceName) || 0
    this.failureCounts.set(serviceName, current + 1)
    this.lastFailureTimes.set(serviceName, Date.now())
  }

  private resetCircuitBreaker(serviceName: string): void {
    this.circuitStates.set(serviceName, 'closed')
    this.failureCounts.set(serviceName, 0)
  }

  private openCircuitBreaker(serviceName: string, config: RecoveryConfig): void {
    this.circuitStates.set(serviceName, 'open')
    
    // Set timer to transition to half-open
    setTimeout(() => {
      this.circuitStates.set(serviceName, 'half-open')
      logger.logBusinessEvent('circuit_breaker_half_open', {
        service: serviceName
      })
    }, config.circuitBreaker.timeoutMs)
  }

  private getFromCache(key: string, allowStale: boolean = false): any | null {
    const cached = this.cache.get(key)
    if (!cached) return null

    const now = Date.now()
    const isExpired = now - cached.timestamp > cached.ttl

    if (isExpired && !allowStale) {
      this.cache.delete(key)
      return null
    }

    return cached.data
  }

  private setCache(key: string, data: any, ttl: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    })
  }

  private async refreshInBackground(
    serviceName: string,
    operation: () => Promise<any>,
    cacheKey: string
  ): Promise<void> {
    try {
      const result = await operation()
      const config = this.recoveryConfigs.get(serviceName)
      if (config) {
        this.setCache(cacheKey, result, config.cacheStrategy.ttl)
      }
    } catch (error) {
      // Silently fail background refresh
      logger.logBusinessEvent('background_refresh_failed', {
        service: serviceName,
        cacheKey,
        error: (error as Error).message
      })
    }
  }

  /**
   * Get service health status
   */
  getServiceHealth(serviceName: string) {
    const config = this.recoveryConfigs.get(serviceName)
    const circuitState = this.circuitStates.get(serviceName)
    const failures = this.failureCounts.get(serviceName) || 0
    const lastFailure = this.lastFailureTimes.get(serviceName)

    return {
      serviceName,
      circuitState,
      failures,
      lastFailure: lastFailure ? new Date(lastFailure).toISOString() : null,
      isHealthy: circuitState === 'closed' && failures === 0,
      config
    }
  }

  /**
   * Get all services health
   */
  getAllServicesHealth() {
    const health: any = {}
    for (const serviceName of this.recoveryConfigs.keys()) {
      health[serviceName] = this.getServiceHealth(serviceName)
    }
    return health
  }

  /**
   * Manually reset a service's circuit breaker
   */
  resetService(serviceName: string): void {
    this.resetCircuitBreaker(serviceName)
    logger.logBusinessEvent('service_manually_reset', {
      service: serviceName
    })
  }
}

export const comprehensiveErrorRecovery = new ComprehensiveErrorRecovery()
