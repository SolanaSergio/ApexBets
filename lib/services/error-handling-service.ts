/**
 * Enhanced Error Handling Service
 * Centralized error handling, logging, rate limiting, and provider-specific recovery
 */

import { structuredLogger as logger } from './structured-logger'
import { apiCostTracker } from './api-cost-tracker'

interface ErrorContext {
  userId?: string
  requestId: string
  timestamp: string
  endpoint: string
  method: string
  userAgent?: string
  ip?: string
  provider?: string
  operation?: string
  sport?: string
  dataType?: string
}

interface RateLimitInfo {
  limit: number
  remaining: number
  resetTime: number
  retryAfter?: number
}

interface RecoveryStrategy {
  type: 'retry' | 'fallback' | 'cache' | 'circuit_breaker' | 'degrade'
  maxAttempts?: number
  delay?: number
  fallbackProvider?: string
  cacheKey?: string
}

interface ApiError extends Error {
  statusCode: number
  code: string
  context?: ErrorContext
  retryable: boolean
  rateLimitInfo?: RateLimitInfo | undefined
  recoveryStrategy?: RecoveryStrategy | undefined
  provider?: string
  originalError?: Error
}

export class EnhancedErrorHandlingService {
  private rateLimitStore = new Map<string, { count: number; resetTime: number }>()
  private readonly DEFAULT_RATE_LIMIT = 100 // requests per minute
  private readonly RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute in milliseconds
  private providerRetryDelays = new Map<string, number>()
  private providerFailureCounts = new Map<string, number>()

  // Provider-specific error handling configurations
  private readonly providerConfigs = {
    'api-sports': {
      maxRetries: 2,
      baseDelay: 2000,
      maxDelay: 120000,
      retryableStatuses: [429, 500, 502, 503, 504],
      fallbackProviders: ['thesportsdb', 'espn']
    },
    'odds-api': {
      maxRetries: 2,
      baseDelay: 2000,
      maxDelay: 120000,
      retryableStatuses: [429, 500, 502, 503],
      fallbackProviders: [] // No fallback for odds data
    },
    'thesportsdb': {
      maxRetries: 2,
      baseDelay: 500,
      maxDelay: 30000,
      retryableStatuses: [429, 500, 502, 503, 504],
      fallbackProviders: ['nba-stats', 'mlb-stats', 'nhl', 'espn']
    },
    'espn': {
      maxRetries: 2,
      baseDelay: 1000,
      maxDelay: 30000,
      retryableStatuses: [429, 500, 502, 503, 504],
      fallbackProviders: ['thesportsdb']
    },
    'balldontlie': {
      maxRetries: 3,
      baseDelay: 600,
      maxDelay: 60000,
      retryableStatuses: [429, 500, 502, 503, 504],
      fallbackProviders: ['nba-stats', 'thesportsdb', 'espn']
    },
    'nba-stats': {
      maxRetries: 2,
      baseDelay: 1000,
      maxDelay: 30000,
      retryableStatuses: [429, 500, 502, 503, 504, 403],
      fallbackProviders: ['balldontlie', 'thesportsdb', 'espn']
    },
    'mlb-stats': {
      maxRetries: 2,
      baseDelay: 1000,
      maxDelay: 30000,
      retryableStatuses: [429, 500, 502, 503, 504],
      fallbackProviders: ['thesportsdb', 'espn']
    },
    'nhl': {
      maxRetries: 2,
      baseDelay: 1000,
      maxDelay: 30000,
      retryableStatuses: [429, 500, 502, 503, 504],
      fallbackProviders: ['thesportsdb', 'espn']
    }
  }

  // Rate limiting
  checkRateLimit(identifier: string, limit: number = this.DEFAULT_RATE_LIMIT): RateLimitInfo {
    const now = Date.now()
    const key = `rate_limit:${identifier}`
    const stored = this.rateLimitStore.get(key)

    if (!stored || now > stored.resetTime) {
      // Reset or create new entry
      this.rateLimitStore.set(key, {
        count: 1,
        resetTime: now + this.RATE_LIMIT_WINDOW
      })
      return {
        limit,
        remaining: limit - 1,
        resetTime: now + this.RATE_LIMIT_WINDOW
      }
    }

    if (stored.count >= limit) {
      // Rate limit exceeded
      return {
        limit,
        remaining: 0,
        resetTime: stored.resetTime,
        retryAfter: Math.ceil((stored.resetTime - now) / 1000)
      }
    }

    // Increment count
    stored.count++
    this.rateLimitStore.set(key, stored)

    return {
      limit,
      remaining: limit - stored.count,
      resetTime: stored.resetTime
    }
  }

  // Error creation
  createError(
    message: string,
    statusCode: number = 500,
    code: string = 'INTERNAL_ERROR',
    context?: Partial<ErrorContext>,
    retryable: boolean = false,
    rateLimitInfo?: RateLimitInfo
  ): ApiError {
    const error = new Error(message) as ApiError
    error.statusCode = statusCode
    error.code = code
    error.context = {
      requestId: this.generateRequestId(),
      timestamp: new Date().toISOString(),
      endpoint: context?.endpoint || 'unknown',
      method: context?.method || 'unknown',
      ...context
    }
    error.retryable = retryable
    error.rateLimitInfo = rateLimitInfo
    return error
  }

  // Enhanced error creation with provider-specific recovery strategies
  createProviderError(
    provider: string,
    originalError: any,
    context?: Partial<ErrorContext>
  ): ApiError {
    const config = this.providerConfigs[provider as keyof typeof this.providerConfigs]
    let message = `API Error from ${provider}`
    let statusCode = 500
    let code = 'API_ERROR'
    let retryable = false
    let recoveryStrategy: RecoveryStrategy | undefined

    // Log the error with structured logging
    logger.logApiRequest(
      provider,
      context?.endpoint || 'unknown',
      context?.method || 'GET',
      0, // responseTime
      originalError.status || 500,
      false, // success
      false, // cached
      0 // cost
    )

    if (originalError.status === 429) {
      message = `Rate limit exceeded for ${provider}`
      statusCode = 429
      code = 'RATE_LIMIT_EXCEEDED'
      retryable = true
      
      // Exponential backoff strategy
      const currentDelay = this.providerRetryDelays.get(provider) || config?.baseDelay || 1000
      const nextDelay = Math.min(currentDelay * 2, config?.maxDelay || 60000)
      this.providerRetryDelays.set(provider, nextDelay)
      
      recoveryStrategy = {
        type: 'retry',
        maxAttempts: config?.maxRetries || 2,
        delay: nextDelay
      }
      
      // If rate limited and has fallback providers, suggest fallback
      if (config?.fallbackProviders?.length) {
        recoveryStrategy = {
          type: 'fallback',
          fallbackProvider: config.fallbackProviders[0]
        }
      }
    } else if (originalError.status === 401) {
      message = `Authentication failed for ${provider}`
      statusCode = 401
      code = 'AUTHENTICATION_ERROR'
      
      // For authentication errors, try fallback providers immediately
      if (config?.fallbackProviders?.length) {
        recoveryStrategy = {
          type: 'fallback',
          fallbackProvider: config.fallbackProviders[0]
        }
      }
    } else if (originalError.status === 403) {
      message = `Access forbidden for ${provider}`
      statusCode = 403
      code = 'FORBIDDEN_ERROR'
      
      recoveryStrategy = {
        type: 'fallback',
        fallbackProvider: config?.fallbackProviders?.[0]
      }
    } else if (config?.retryableStatuses?.includes(originalError.status)) {
      message = `Server error from ${provider}: ${originalError.message}`
      statusCode = originalError.status
      code = 'SERVER_ERROR'
      retryable = true
      
      recoveryStrategy = {
        type: 'retry',
        maxAttempts: config.maxRetries,
        delay: config.baseDelay
      }
    } else if (originalError.code === 'ENOTFOUND' || originalError.code === 'ECONNREFUSED') {
      message = `Network error connecting to ${provider}`
      statusCode = 503
      code = 'NETWORK_ERROR'
      retryable = true
      
      // Increment failure count for circuit breaker
      const failures = this.providerFailureCounts.get(provider) || 0
      this.providerFailureCounts.set(provider, failures + 1)
      
      if (failures >= 3) {
        recoveryStrategy = {
          type: 'circuit_breaker',
          fallbackProvider: config?.fallbackProviders?.[0]
        }
      } else {
        recoveryStrategy = {
          type: 'retry',
          maxAttempts: 2,
          delay: 5000
        }
      }
    }

    const error = this.createError(
      message,
      statusCode,
      code,
      {
        ...context,
        provider,
        operation: context?.operation || 'api_request'
      },
      retryable
    ) as ApiError
    
    error.provider = provider
    error.originalError = originalError
    error.recoveryStrategy = recoveryStrategy
    
    // Track API costs even for failures
    apiCostTracker.trackRequest(
      provider,
      context?.endpoint || 'unknown',
      0, // responseTime for failed requests
      false, // success
      false // cached
    )
    
    return error
  }

  // Validation errors
  createValidationError(
    field: string,
    rule: string,
    context?: Partial<ErrorContext>
  ): ApiError {
    return this.createError(
      `Validation failed for field '${field}': ${rule}`,
      400,
      'VALIDATION_ERROR',
      context,
      false
    )
  }

  // Rate limit errors
  createRateLimitError(
    identifier: string,
    limit: number,
    retryAfter: number,
    context?: Partial<ErrorContext>
  ): ApiError {
    return this.createError(
      `Rate limit exceeded for ${identifier}. Limit: ${limit} requests per minute`,
      429,
      'RATE_LIMIT_EXCEEDED',
      context,
      true,
      {
        limit,
        remaining: 0,
        resetTime: Date.now() + (retryAfter * 1000),
        retryAfter
      }
    )
  }

  // Error logging
  logError(error: ApiError, additionalContext?: any): void {
    const logData = {
      error: {
        message: error.message,
        code: error.code,
        statusCode: error.statusCode,
        stack: error.stack,
        retryable: error.retryable
      },
      context: error.context,
      additionalContext,
      timestamp: new Date().toISOString()
    }

    // In production, you would send this to a logging service
    console.error('API Error:', logData)

    // You could also send to external services like:
    // - Sentry
    // - LogRocket
    // - DataDog
    // - CloudWatch
  }

  // Error response formatting
  formatErrorResponse(error: ApiError): {
    error: {
      code: string
      message: string
      statusCode: number
      retryable: boolean
      requestId: string
      timestamp: string
      rateLimitInfo?: RateLimitInfo | undefined
    }
  } {
    const response: {
      error: {
        code: string
        message: string
        statusCode: number
        retryable: boolean
        requestId: string
        timestamp: string
        rateLimitInfo?: RateLimitInfo | undefined
      }
    } = {
      error: {
        code: error.code,
        message: error.message,
        statusCode: error.statusCode,
        retryable: error.retryable,
        requestId: error.context?.requestId || 'unknown',
        timestamp: error.context?.timestamp || new Date().toISOString()
      }
    }
    
    if (error.rateLimitInfo) {
      response.error.rateLimitInfo = error.rateLimitInfo
    }
    
    return response
  }

  // Retry logic
  async withRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000,
    context?: Partial<ErrorContext>
  ): Promise<T> {
    let lastError: ApiError

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation()
      } catch (error) {
        lastError = this.createProviderError('retry_operation', error, context)
        
        if (!lastError.retryable || attempt === maxRetries) {
          throw lastError
        }

        // Exponential backoff with jitter
        const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000
        await this.sleep(delay)
      }
    }

    throw lastError!
  }

  // Circuit breaker pattern
  private circuitBreakerState = new Map<string, {
    state: 'closed' | 'open' | 'half-open'
    failureCount: number
    lastFailureTime: number
    successCount: number
  }>()

  async withCircuitBreaker<T>(
    operation: () => Promise<T>,
    serviceName: string,
    failureThreshold: number = 5,
    timeout: number = 60000,
    context?: Partial<ErrorContext>
  ): Promise<T> {
    const now = Date.now()
    const state = this.circuitBreakerState.get(serviceName) || {
      state: 'closed',
      failureCount: 0,
      lastFailureTime: 0,
      successCount: 0
    }

    // Check if circuit is open and timeout has passed
    if (state.state === 'open' && now - state.lastFailureTime > timeout) {
      state.state = 'half-open'
      state.successCount = 0
    }

    // If circuit is open, throw error immediately
    if (state.state === 'open') {
      throw this.createError(
        `Circuit breaker is open for ${serviceName}`,
        503,
        'CIRCUIT_BREAKER_OPEN',
        context,
        true
      )
    }

    try {
      const result = await operation()
      
      // Reset on success
      if (state.state === 'half-open') {
        state.successCount++
        if (state.successCount >= 3) {
          state.state = 'closed'
          state.failureCount = 0
        }
      } else {
        state.failureCount = 0
      }
      
      this.circuitBreakerState.set(serviceName, state)
      return result
    } catch (error) {
      state.failureCount++
      state.lastFailureTime = now
      
      if (state.failureCount >= failureThreshold) {
        state.state = 'open'
      }
      
      this.circuitBreakerState.set(serviceName, state)
      throw this.createProviderError(serviceName, error, context)
    }
  }

  // Utility methods
  private generateRequestId(): string {
    return Math.random().toString(36).substr(2, 9)
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  // Cleanup expired rate limit entries
  cleanup(): void {
    const now = Date.now()
    for (const [key, value] of this.rateLimitStore.entries()) {
      if (now > value.resetTime) {
        this.rateLimitStore.delete(key)
      }
    }
  }

  // Get rate limit info for a specific identifier
  getRateLimitInfo(identifier: string): RateLimitInfo | null {
    const stored = this.rateLimitStore.get(`rate_limit:${identifier}`)
    if (!stored) return null

    const now = Date.now()
    if (now > stored.resetTime) {
      this.rateLimitStore.delete(`rate_limit:${identifier}`)
      return null
    }

    return {
      limit: this.DEFAULT_RATE_LIMIT,
      remaining: this.DEFAULT_RATE_LIMIT - stored.count,
      resetTime: stored.resetTime
    }
  }
}

export const errorHandlingService = new EnhancedErrorHandlingService()

// Cleanup every 5 minutes
setInterval(() => {
  errorHandlingService.cleanup()
}, 5 * 60 * 1000)
