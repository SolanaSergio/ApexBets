/**
 * Comprehensive Error Handler Service
 * Centralized error handling with proper categorization and recovery strategies
 */

import { structuredLogger } from './structured-logger'

export interface ErrorContext {
  service: string
  operation: string
  endpoint?: string
  sport?: string
  additionalData?: Record<string, any>
}

export interface ErrorRecoveryStrategy {
  shouldRetry: boolean
  retryAfterMs?: number
  fallbackAction?: string
  circuitBreak?: boolean
  logLevel: 'debug' | 'info' | 'warn' | 'error'
}

export class ComprehensiveErrorHandler {
  private static instance: ComprehensiveErrorHandler
  private errorCounts: Map<string, number> = new Map()
  private lastErrorTimes: Map<string, number> = new Map()

  private constructor() {}

  static getInstance(): ComprehensiveErrorHandler {
    if (!ComprehensiveErrorHandler.instance) {
      ComprehensiveErrorHandler.instance = new ComprehensiveErrorHandler()
    }
    return ComprehensiveErrorHandler.instance
  }

  async handleError(
    error: Error,
    context: ErrorContext
  ): Promise<ErrorRecoveryStrategy> {
    const errorKey = `${context.service}:${context.operation}`
    const now = Date.now()
    
    // Track error frequency
    const errorCount = this.errorCounts.get(errorKey) || 0
    this.errorCounts.set(errorKey, errorCount + 1)
    this.lastErrorTimes.set(errorKey, now)

    // Categorize error
    const errorCategory = this.categorizeError(error)
    
    // Get recovery strategy based on error category and context
    const strategy = this.getRecoveryStrategy(errorCategory, context, errorCount)
    
    // Log error with appropriate level
    this.logError(error, context, errorCategory, strategy)
    
    return strategy
  }

  private categorizeError(error: Error): string {
    const message = error.message.toLowerCase()
    
    // Network errors
    if (message.includes('fetch') || message.includes('network') || message.includes('timeout')) {
      return 'network'
    }
    
    // Rate limiting errors
    if (message.includes('rate limit') || message.includes('429') || message.includes('too many requests')) {
      return 'rate_limit'
    }
    
    // Authentication errors
    if (message.includes('401') || message.includes('unauthorized') || message.includes('invalid api key')) {
      return 'authentication'
    }
    
    // Authorization errors
    if (message.includes('403') || message.includes('forbidden') || message.includes('access denied')) {
      return 'authorization'
    }
    
    // Server errors
    if (message.includes('500') || message.includes('502') || message.includes('503') || message.includes('504')) {
      return 'server_error'
    }
    
    // Data errors
    if (message.includes('invalid json') || message.includes('parse error') || message.includes('malformed')) {
      return 'data_error'
    }
    
    // Database errors
    if (message.includes('database') || message.includes('connection') || message.includes('query')) {
      return 'database'
    }
    
    // Validation errors
    if (message.includes('validation') || message.includes('invalid') || message.includes('required')) {
      return 'validation'
    }
    
    return 'unknown'
  }

  private getRecoveryStrategy(
    errorCategory: string,
    _context: ErrorContext,
    errorCount: number
  ): ErrorRecoveryStrategy {

    switch (errorCategory) {
      case 'network':
        return {
          shouldRetry: errorCount < 3,
          retryAfterMs: Math.min(1000 * Math.pow(2, errorCount), 30000), // Exponential backoff, max 30s
          logLevel: errorCount > 1 ? 'warn' : 'error'
        }

      case 'rate_limit':
        return {
          shouldRetry: true,
          retryAfterMs: 60000, // Wait 1 minute for rate limits
          logLevel: 'warn'
        }

      case 'authentication':
        return {
          shouldRetry: false,
          fallbackAction: 'rotate_api_key',
          circuitBreak: true,
          logLevel: 'error'
        }

      case 'authorization':
        return {
          shouldRetry: errorCount < 2,
          retryAfterMs: 5000,
          fallbackAction: 'use_fallback_api',
          logLevel: 'warn'
        }

      case 'server_error':
        return {
          shouldRetry: errorCount < 3,
          retryAfterMs: Math.min(2000 * Math.pow(2, errorCount), 60000), // Exponential backoff, max 1min
          fallbackAction: 'use_fallback_api',
          logLevel: errorCount > 1 ? 'warn' : 'error'
        }

      case 'data_error':
        return {
          shouldRetry: false,
          fallbackAction: 'return_empty_data',
          logLevel: 'warn'
        }

      case 'database':
        return {
          shouldRetry: errorCount < 2,
          retryAfterMs: 5000,
          fallbackAction: 'use_cached_data',
          logLevel: 'error'
        }

      case 'validation':
        return {
          shouldRetry: false,
          logLevel: 'warn'
        }

      default:
        return {
          shouldRetry: errorCount < 1,
          retryAfterMs: 5000,
          logLevel: 'error'
        }
    }
  }

  private logError(
    error: Error,
    context: ErrorContext,
    errorCategory: string,
    strategy: ErrorRecoveryStrategy
  ): void {
    const logData = {
      error: error.message,
      stack: error.stack,
      category: errorCategory,
      service: context.service,
      operation: context.operation,
      endpoint: context.endpoint,
      sport: context.sport,
      shouldRetry: strategy.shouldRetry,
      retryAfterMs: strategy.retryAfterMs,
      fallbackAction: strategy.fallbackAction,
      ...context.additionalData
    }

    switch (strategy.logLevel) {
      case 'debug':
        structuredLogger.debug(`Error in ${context.service}:${context.operation}`, logData)
        break
      case 'info':
        structuredLogger.info(`Error in ${context.service}:${context.operation}`, logData)
        break
      case 'warn':
        structuredLogger.warn(`Error in ${context.service}:${context.operation}`, logData)
        break
      case 'error':
        structuredLogger.error(`Error in ${context.service}:${context.operation}`, logData)
        break
    }
  }

  async executeWithErrorHandling<T>(
    operation: () => Promise<T>,
    context: ErrorContext,
    maxRetries: number = 3
  ): Promise<T | null> {
    let lastError: Error | null = null
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const result = await operation()
        
        // Reset error count on success
        const errorKey = `${context.service}:${context.operation}`
        this.errorCounts.delete(errorKey)
        
        return result
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error))
        
        const strategy = await this.handleError(lastError, {
          ...context,
          additionalData: { attempt, maxRetries }
        })
        
        if (!strategy.shouldRetry || attempt >= maxRetries) {
          break
        }
        
        if (strategy.retryAfterMs) {
          await new Promise(resolve => setTimeout(resolve, strategy.retryAfterMs))
        }
      }
    }
    
    // If we get here, all retries failed
    structuredLogger.error(`Operation failed after ${maxRetries} retries`, {
      service: context.service,
      operation: context.operation,
      lastError: lastError?.message,
      errorCount: this.errorCounts.get(`${context.service}:${context.operation}`)
    })
    
    return null
  }

  getErrorStats(service?: string): Record<string, any> {
    const stats: Record<string, any> = {}
    
    for (const [key, count] of this.errorCounts.entries()) {
      const [svc, op] = key.split(':')
      
      if (service && svc !== service) continue
      
      if (!stats[svc]) {
        stats[svc] = {}
      }
      
      stats[svc][op] = {
        errorCount: count,
        lastErrorTime: this.lastErrorTimes.get(key)
      }
    }
    
    return stats
  }

  resetErrorStats(service?: string): void {
    if (service) {
      // Reset stats for specific service
      for (const key of this.errorCounts.keys()) {
        if (key.startsWith(`${service}:`)) {
          this.errorCounts.delete(key)
          this.lastErrorTimes.delete(key)
        }
      }
    } else {
      // Reset all stats
      this.errorCounts.clear()
      this.lastErrorTimes.clear()
    }
  }

  isServiceHealthy(service: string, operation: string): boolean {
    const errorKey = `${service}:${operation}`
    const errorCount = this.errorCounts.get(errorKey) || 0
    const lastErrorTime = this.lastErrorTimes.get(errorKey) || 0
    
    // Consider service healthy if:
    // 1. No errors in the last 5 minutes, OR
    // 2. Less than 5 errors total
    const fiveMinutesAgo = Date.now() - (5 * 60 * 1000)
    return errorCount < 5 || lastErrorTime < fiveMinutesAgo
  }
}

export const comprehensiveErrorHandler = ComprehensiveErrorHandler.getInstance()
