/**
 * API-Specific Error Handlers
 * Each API has unique rate limits, authentication, and error patterns
 * Based on Comprehensive Free Sports Data APIs Report
 */

import { structuredLogger as logger } from './structured-logger'

interface ApiConfig {
  name: string
  rateLimit: {
    requestsPerMinute?: number
    requestsPerDay?: number
    requestsPerMonth?: number
  }
  authentication: 'api_key' | 'none' | 'header'
  retryStrategy: {
    maxRetries: number
    baseDelay: number
    maxDelay: number
    backoffMultiplier: number
  }
  circuitBreaker: {
    failureThreshold: number
    timeoutMs: number
  }
  fallbackApis?: string[]
}

interface ApiErrorResult {
  shouldRetry: boolean
  retryAfterMs?: number
  shouldCircuitBreak: boolean
  fallbackApi?: string | undefined
  error: string
}

class ApiSpecificErrorHandler {
  private configs: Map<string, ApiConfig> = new Map()
  private failureCounts: Map<string, number> = new Map()
  private lastFailureTimes: Map<string, number> = new Map()
  private circuitBreakerStates: Map<string, 'closed' | 'open' | 'half-open'> = new Map()
  private requestCounts: Map<string, { minute: number, day: number, month: number, lastReset: number }> = new Map()

  constructor() {
    this.initializeConfigs()
  }

  private initializeConfigs(): void {
    // The Odds API - Very limited free tier
    this.configs.set('odds-api', {
      name: 'The Odds API',
      rateLimit: {
        requestsPerMonth: 500 // Free tier
      },
      authentication: 'api_key',
      retryStrategy: {
        maxRetries: 2, // Conservative due to low limits
        baseDelay: 5000, // 5 seconds
        maxDelay: 60000, // 1 minute
        backoffMultiplier: 3
      },
      circuitBreaker: {
        failureThreshold: 2,
        timeoutMs: 300000 // 5 minutes
      },
      fallbackApis: []
    })

    // API-Football - Strict rate limits
    this.configs.set('api-sports', {
      name: 'API-Football',
      rateLimit: {
        requestsPerMinute: 10,
        requestsPerDay: 100
      },
      authentication: 'header',
      retryStrategy: {
        maxRetries: 2,
        baseDelay: 6000, // 6 seconds (10 req/min = 6s between)
        maxDelay: 120000, // 2 minutes
        backoffMultiplier: 2
      },
      circuitBreaker: {
        failureThreshold: 3,
        timeoutMs: 600000 // 10 minutes
      },
      fallbackApis: ['espn', 'sportsdb']
    })

    // BallDontLie - Moderate rate limits
    this.configs.set('balldontlie', {
      name: 'BallDontLie',
      rateLimit: {
        requestsPerMinute: 60
      },
      authentication: 'none',
      retryStrategy: {
        maxRetries: 3,
        baseDelay: 1000, // 1 second
        maxDelay: 30000, // 30 seconds
        backoffMultiplier: 2
      },
      circuitBreaker: {
        failureThreshold: 5,
        timeoutMs: 120000 // 2 minutes
      },
      fallbackApis: ['nba-stats', 'espn']
    })

    // ESPN - Unlimited but unofficial
    this.configs.set('espn', {
      name: 'ESPN Hidden API',
      rateLimit: {}, // Unlimited
      authentication: 'none',
      retryStrategy: {
        maxRetries: 4,
        baseDelay: 500, // Fast retry
        maxDelay: 15000, // 15 seconds
        backoffMultiplier: 2
      },
      circuitBreaker: {
        failureThreshold: 10, // More tolerant
        timeoutMs: 60000 // 1 minute
      },
      fallbackApis: ['sportsdb']
    })

    // MLB Stats - Unlimited official
    this.configs.set('mlb-stats', {
      name: 'MLB Stats API',
      rateLimit: {}, // Unlimited
      authentication: 'none',
      retryStrategy: {
        maxRetries: 3,
        baseDelay: 1000,
        maxDelay: 20000,
        backoffMultiplier: 2
      },
      circuitBreaker: {
        failureThreshold: 5,
        timeoutMs: 120000
      },
      fallbackApis: ['espn', 'sportsdb']
    })

    // NHL API - Unlimited official
    this.configs.set('nhl', {
      name: 'NHL API',
      rateLimit: {}, // Unlimited
      authentication: 'none',
      retryStrategy: {
        maxRetries: 3,
        baseDelay: 1000,
        maxDelay: 20000,
        backoffMultiplier: 2
      },
      circuitBreaker: {
        failureThreshold: 5,
        timeoutMs: 120000
      },
      fallbackApis: ['espn', 'sportsdb']
    })

    // NBA Stats - Unofficial, needs careful handling
    this.configs.set('nba-stats', {
      name: 'NBA Stats',
      rateLimit: {
        requestsPerMinute: 30 // Conservative estimate
      },
      authentication: 'none',
      retryStrategy: {
        maxRetries: 2,
        baseDelay: 2000, // 2 seconds
        maxDelay: 60000, // 1 minute
        backoffMultiplier: 3
      },
      circuitBreaker: {
        failureThreshold: 3,
        timeoutMs: 300000 // 5 minutes
      },
      fallbackApis: ['balldontlie', 'espn']
    })

    // SportsDB - Free tier with rate limits
    this.configs.set('sportsdb', {
      name: 'TheSportsDB',
      rateLimit: {
        requestsPerMinute: 60
      },
      authentication: 'api_key',
      retryStrategy: {
        maxRetries: 2,
        baseDelay: 2000, // 2 seconds
        maxDelay: 60000, // 1 minute
        backoffMultiplier: 2
      },
      circuitBreaker: {
        failureThreshold: 3,
        timeoutMs: 180000 // 3 minutes
      },
      fallbackApis: ['espn']
    })

    // Initialize circuit breaker states
    for (const apiName of this.configs.keys()) {
      this.circuitBreakerStates.set(apiName, 'closed')
      this.failureCounts.set(apiName, 0)
      this.requestCounts.set(apiName, {
        minute: 0,
        day: 0,
        month: 0,
        lastReset: Date.now()
      })
    }
  }

  handleError(apiName: string, error: Error, statusCode?: number): ApiErrorResult {
    const config = this.configs.get(apiName)
    if (!config) {
      return {
        shouldRetry: false,
        shouldCircuitBreak: false,
        error: `Unknown API: ${apiName}`
      }
    }

    // Check circuit breaker state
    const circuitState = this.circuitBreakerStates.get(apiName)
    if (circuitState === 'open') {
      return {
        shouldRetry: false,
        shouldCircuitBreak: true,
        fallbackApi: config.fallbackApis?.[0],
        error: `${config.name}: Circuit breaker is open`
      }
    }

    // Handle specific error types
    if (statusCode === 429 || error.message.includes('rate limit')) {
      return this.handleRateLimitError(apiName, config)
    }

    if (statusCode === 401 || statusCode === 403) {
      return this.handleAuthError(apiName, config)
    }

    if (statusCode && statusCode >= 500) {
      return this.handleServerError(apiName, config)
    }

    if (error.message.includes('ENOTFOUND') || error.message.includes('timeout')) {
      return this.handleNetworkError(apiName, config)
    }

    // Generic error
    return this.handleGenericError(apiName, config, error)
  }

  private handleRateLimitError(apiName: string, config: ApiConfig): ApiErrorResult {
    const retryAfter = this.calculateRateLimitDelay(config)
    
    logger.logBusinessEvent('api_rate_limit_hit', {
      api: apiName,
      retryAfterMs: retryAfter
    })

    return {
      shouldRetry: true,
      retryAfterMs: retryAfter,
      shouldCircuitBreak: false,
      error: `${config.name}: Rate limit exceeded, retry after ${retryAfter}ms`
    }
  }

  private handleAuthError(apiName: string, config: ApiConfig): ApiErrorResult {
    this.recordFailure(apiName)
    
    return {
      shouldRetry: false,
      shouldCircuitBreak: true,
      fallbackApi: config.fallbackApis?.[0],
      error: `${config.name}: Authentication failed`
    }
  }

  private handleServerError(apiName: string, config: ApiConfig): ApiErrorResult {
    this.recordFailure(apiName)
    const failures = this.failureCounts.get(apiName) || 0
    
    if (failures >= config.circuitBreaker.failureThreshold) {
      this.openCircuitBreaker(apiName)
      return {
        shouldRetry: false,
        shouldCircuitBreak: true,
        fallbackApi: config.fallbackApis?.[0],
        error: `${config.name}: Circuit breaker opened due to server errors`
      }
    }

    return {
      shouldRetry: true,
      retryAfterMs: this.calculateRetryDelay(config, failures),
      shouldCircuitBreak: false,
      error: `${config.name}: Server error, retrying`
    }
  }

  private handleNetworkError(apiName: string, config: ApiConfig): ApiErrorResult {
    this.recordFailure(apiName)
    const failures = this.failureCounts.get(apiName) || 0
    
    return {
      shouldRetry: failures < config.retryStrategy.maxRetries,
      retryAfterMs: this.calculateRetryDelay(config, failures),
      shouldCircuitBreak: failures >= config.circuitBreaker.failureThreshold,
      fallbackApi: config.fallbackApis?.[0],
      error: `${config.name}: Network error`
    }
  }

  private handleGenericError(apiName: string, config: ApiConfig, error: Error): ApiErrorResult {
    this.recordFailure(apiName)
    const failures = this.failureCounts.get(apiName) || 0
    
    return {
      shouldRetry: failures < config.retryStrategy.maxRetries,
      retryAfterMs: this.calculateRetryDelay(config, failures),
      shouldCircuitBreak: false,
      error: `${config.name}: ${error.message}`
    }
  }

  private calculateRateLimitDelay(config: ApiConfig): number {
    // Calculate delay based on rate limits
    if (config.rateLimit.requestsPerMinute) {
      return Math.ceil(60000 / config.rateLimit.requestsPerMinute) * 2 // Double the minimum interval
    }
    if (config.rateLimit.requestsPerDay) {
      return Math.ceil(86400000 / config.rateLimit.requestsPerDay) * 2
    }
    return config.retryStrategy.baseDelay * 5 // Default to 5x base delay
  }

  private calculateRetryDelay(config: ApiConfig, attempt: number): number {
    const delay = config.retryStrategy.baseDelay * Math.pow(config.retryStrategy.backoffMultiplier, attempt)
    return Math.min(delay, config.retryStrategy.maxDelay)
  }

  private recordFailure(apiName: string): void {
    const current = this.failureCounts.get(apiName) || 0
    this.failureCounts.set(apiName, current + 1)
    this.lastFailureTimes.set(apiName, Date.now())
  }

  private openCircuitBreaker(apiName: string): void {
    this.circuitBreakerStates.set(apiName, 'open')
    const config = this.configs.get(apiName)
    
    if (config) {
      setTimeout(() => {
        this.circuitBreakerStates.set(apiName, 'half-open')
      }, config.circuitBreaker.timeoutMs)
    }
  }

  resetFailures(apiName: string): void {
    this.failureCounts.set(apiName, 0)
    this.circuitBreakerStates.set(apiName, 'closed')
  }

  getApiStats(apiName: string) {
    const config = this.configs.get(apiName)
    const failures = this.failureCounts.get(apiName) || 0
    const circuitState = this.circuitBreakerStates.get(apiName)
    const requestCount = this.requestCounts.get(apiName)
    
    return {
      name: config?.name || apiName,
      failures,
      circuitState,
      requestCount,
      rateLimit: config?.rateLimit
    }
  }
}

export const apiSpecificErrorHandler = new ApiSpecificErrorHandler()
