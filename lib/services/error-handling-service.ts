/**
 * Error Handling Service
 * Centralized error handling with circuit breaker and retry logic
 */

import { structuredLogger } from './structured-logger'

export interface CircuitBreakerConfig {
  failureThreshold: number
  recoveryTimeout: number
  monitoringPeriod: number
}

export interface RetryConfig {
  maxRetries: number
  baseDelay: number
  maxDelay: number
  backoffMultiplier: number
}

export class ErrorHandlingService {
  private static instance: ErrorHandlingService
  private circuitBreakers: Map<string, {
    failures: number
    lastFailure: Date | null
    state: 'closed' | 'open' | 'half-open'
  }> = new Map()

  public static getInstance(): ErrorHandlingService {
    if (!ErrorHandlingService.instance) {
      ErrorHandlingService.instance = new ErrorHandlingService()
    }
    return ErrorHandlingService.instance
  }

  async withCircuitBreaker<T>(
    operation: () => Promise<T>,
    serviceName: string = 'default',
    config: CircuitBreakerConfig = {
      failureThreshold: 5,
      recoveryTimeout: 60000, // 1 minute
      monitoringPeriod: 300000 // 5 minutes
    }
  ): Promise<T> {
    const circuitBreaker = this.getCircuitBreaker(serviceName)
    
    if (circuitBreaker.state === 'open') {
      if (Date.now() - (circuitBreaker.lastFailure?.getTime() || 0) > config.recoveryTimeout) {
        circuitBreaker.state = 'half-open'
        structuredLogger.info('Circuit breaker moved to half-open state', { serviceName })
      } else {
        throw new Error(`Circuit breaker is open for service: ${serviceName}`)
      }
    }

    try {
      const result = await operation()
      
      if (circuitBreaker.state === 'half-open') {
        circuitBreaker.state = 'closed'
        circuitBreaker.failures = 0
        structuredLogger.info('Circuit breaker closed after successful operation', { serviceName })
      }
      
      return result
    } catch (error) {
      circuitBreaker.failures++
      circuitBreaker.lastFailure = new Date()
      
      if (circuitBreaker.failures >= config.failureThreshold) {
        circuitBreaker.state = 'open'
        structuredLogger.error('Circuit breaker opened due to failures', {
          serviceName,
          failures: circuitBreaker.failures,
          threshold: config.failureThreshold
        })
      }
      
      throw error
    }
  }

  async withRetry<T>(
    operation: () => Promise<T>,
    config: RetryConfig = {
      maxRetries: 3,
      baseDelay: 1000,
      maxDelay: 10000,
      backoffMultiplier: 2
    }
  ): Promise<T> {
    let lastError: Error | null = null
    
    for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
      try {
        return await operation()
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error))
        
        if (attempt === config.maxRetries) {
          structuredLogger.error('Max retries exceeded', {
            maxRetries: config.maxRetries,
            error: lastError.message
          })
          throw lastError
        }
        
        const delay = Math.min(
          config.baseDelay * Math.pow(config.backoffMultiplier, attempt),
          config.maxDelay
        )
        
        structuredLogger.warn('Operation failed, retrying', {
          attempt: attempt + 1,
          maxRetries: config.maxRetries,
          delay,
          error: lastError.message
        })
        
        await this.delay(delay)
      }
    }
    
    throw lastError || new Error('Unknown error')
  }

  private getCircuitBreaker(serviceName: string) {
    if (!this.circuitBreakers.has(serviceName)) {
      this.circuitBreakers.set(serviceName, {
        failures: 0,
        lastFailure: null,
        state: 'closed'
      })
    }
    return this.circuitBreakers.get(serviceName)!
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  getCircuitBreakerState(serviceName: string): string {
    const circuitBreaker = this.getCircuitBreaker(serviceName)
    return circuitBreaker.state
  }

  resetCircuitBreaker(serviceName: string): void {
    const circuitBreaker = this.getCircuitBreaker(serviceName)
    circuitBreaker.failures = 0
    circuitBreaker.lastFailure = null
    circuitBreaker.state = 'closed'
    structuredLogger.info('Circuit breaker reset', { serviceName })
  }

  getAllCircuitBreakerStates(): Record<string, string> {
    const states: Record<string, string> = {}
    for (const [serviceName, circuitBreaker] of this.circuitBreakers.entries()) {
      states[serviceName] = circuitBreaker.state
    }
    return states
  }

  logError(error: any, context?: any): void {
    structuredLogger.error('Error occurred', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      context
    })
  }
}

export const errorHandlingService = ErrorHandlingService.getInstance()
