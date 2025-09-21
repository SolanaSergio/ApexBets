/**
 * Retry Mechanism Service
 * Provides robust retry logic for API failures and database operations
 */

export interface RetryConfig {
  maxAttempts: number;
  baseDelay: number; // milliseconds
  maxDelay: number; // milliseconds
  backoffMultiplier: number;
  jitter: boolean;
  retryCondition?: (error: any) => boolean;
}

export interface RetryResult<T> {
  success: boolean;
  data?: T;
  error?: any;
  attempts: number;
  totalTime: number;
}

export class RetryMechanismService {
  private static instance: RetryMechanismService;
  private defaultConfig: RetryConfig = {
    maxAttempts: 3,
    baseDelay: 1000,
    maxDelay: 10000,
    backoffMultiplier: 2,
    jitter: true,
    retryCondition: (error) => {
      // Retry on network errors, timeouts, and 5xx server errors
      if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT' || error.code === 'ENOTFOUND') {
        return true;
      }
      if (error.status >= 500 && error.status < 600) {
        return true;
      }
      if (error.message?.includes('timeout') || error.message?.includes('network')) {
        return true;
      }
      return false;
    }
  };

  static getInstance(): RetryMechanismService {
    if (!RetryMechanismService.instance) {
      RetryMechanismService.instance = new RetryMechanismService();
    }
    return RetryMechanismService.instance;
  }

  /**
   * Execute a function with retry logic
   */
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    config: Partial<RetryConfig> = {}
  ): Promise<RetryResult<T>> {
    const finalConfig = { ...this.defaultConfig, ...config };
    const startTime = Date.now();
    let lastError: any;

    for (let attempt = 1; attempt <= finalConfig.maxAttempts; attempt++) {
      try {
        const result = await operation();
        return {
          success: true,
          data: result,
          attempts: attempt,
          totalTime: Date.now() - startTime
        };
      } catch (error) {
        lastError = error;

        // Check if we should retry
        if (attempt === finalConfig.maxAttempts || !this.shouldRetry(error, finalConfig)) {
          break;
        }

        // Calculate delay with exponential backoff and jitter
        const delay = this.calculateDelay(attempt, finalConfig);
        console.log(`Attempt ${attempt} failed, retrying in ${delay}ms:`, error instanceof Error ? error.message : String(error));
        
        await this.sleep(delay);
      }
    }

    return {
      success: false,
      error: lastError,
      attempts: finalConfig.maxAttempts,
      totalTime: Date.now() - startTime
    };
  }

  /**
   * Execute multiple operations in parallel with retry
   */
  async executeBatchWithRetry<T>(
    operations: Array<() => Promise<T>>,
    config: Partial<RetryConfig> = {}
  ): Promise<Array<RetryResult<T>>> {
    const promises = operations.map(operation => 
      this.executeWithRetry(operation, config)
    );
    
    return Promise.all(promises);
  }

  /**
   * Execute operations sequentially with retry
   */
  async executeSequentialWithRetry<T>(
    operations: Array<() => Promise<T>>,
    config: Partial<RetryConfig> = {}
  ): Promise<Array<RetryResult<T>>> {
    const results: Array<RetryResult<T>> = [];
    
    for (const operation of operations) {
      const result = await this.executeWithRetry(operation, config);
      results.push(result);
      
      // Stop on first failure if configured to do so
      if (!result.success && (config as any).stopOnFirstFailure) {
        break;
      }
    }
    
    return results;
  }

  /**
   * Execute with circuit breaker pattern
   */
  async executeWithCircuitBreaker<T>(
    operation: () => Promise<T>,
    circuitConfig: {
      failureThreshold: number;
      recoveryTimeout: number;
      monitoringWindow: number;
    } = {
      failureThreshold: 5,
      recoveryTimeout: 60000, // 1 minute
      monitoringWindow: 300000 // 5 minutes
    },
    retryConfig: Partial<RetryConfig> = {}
  ): Promise<RetryResult<T>> {
    const circuitKey = 'default';
    const now = Date.now();
    
    // Check if circuit is open
    if (this.isCircuitOpen(circuitKey, circuitConfig, now)) {
      return {
        success: false,
        error: new Error('Circuit breaker is open'),
        attempts: 0,
        totalTime: 0
      };
    }

    // Execute with retry
    const result = await this.executeWithRetry(operation, retryConfig);
    
    // Update circuit breaker state
    this.updateCircuitBreaker(circuitKey, result.success, now);
    
    return result;
  }

  /**
   * Execute with timeout
   */
  async executeWithTimeout<T>(
    operation: () => Promise<T>,
    timeoutMs: number,
    retryConfig: Partial<RetryConfig> = {}
  ): Promise<RetryResult<T>> {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Operation timed out')), timeoutMs);
    });

    const operationWithTimeout = () => Promise.race([operation(), timeoutPromise]);
    
    return this.executeWithRetry(operationWithTimeout, retryConfig);
  }

  /**
   * Execute with exponential backoff
   */
  async executeWithExponentialBackoff<T>(
    operation: () => Promise<T>,
    config: {
      maxAttempts: number;
      initialDelay: number;
      maxDelay: number;
      backoffMultiplier: number;
    } = {
      maxAttempts: 5,
      initialDelay: 1000,
      maxDelay: 30000,
      backoffMultiplier: 2
    }
  ): Promise<RetryResult<T>> {
    return this.executeWithRetry(operation, {
      maxAttempts: config.maxAttempts,
      baseDelay: config.initialDelay,
      maxDelay: config.maxDelay,
      backoffMultiplier: config.backoffMultiplier,
      jitter: true
    });
  }

  private shouldRetry(error: any, config: RetryConfig): boolean {
    if (!config.retryCondition) {
      return true;
    }
    return config.retryCondition(error);
  }

  private calculateDelay(attempt: number, config: RetryConfig): number {
    let delay = config.baseDelay * Math.pow(config.backoffMultiplier, attempt - 1);
    delay = Math.min(delay, config.maxDelay);
    
    if (config.jitter) {
      // Add jitter to prevent thundering herd
      delay = delay * (0.5 + Math.random() * 0.5);
    }
    
    return Math.floor(delay);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private circuitBreakerState = new Map<string, {
    failures: number;
    lastFailureTime: number;
    state: 'closed' | 'open' | 'half-open';
  }>();

  private isCircuitOpen(
    circuitKey: string, 
    config: { failureThreshold: number; recoveryTimeout: number }, 
    now: number
  ): boolean {
    const state = this.circuitBreakerState.get(circuitKey);
    
    if (!state) {
      return false;
    }
    
    if (state.state === 'open') {
      if (now - state.lastFailureTime > config.recoveryTimeout) {
        state.state = 'half-open';
        return false;
      }
      return true;
    }
    
    return false;
  }

  private updateCircuitBreaker(circuitKey: string, success: boolean, now: number): void {
    let state = this.circuitBreakerState.get(circuitKey);
    
    if (!state) {
      state = {
        failures: 0,
        lastFailureTime: 0,
        state: 'closed'
      };
      this.circuitBreakerState.set(circuitKey, state);
    }
    
    if (success) {
      if (state.state === 'half-open') {
        state.state = 'closed';
        state.failures = 0;
      }
    } else {
      state.failures++;
      state.lastFailureTime = now;
      
      if (state.failures >= 5) { // failureThreshold
        state.state = 'open';
      }
    }
  }

  /**
   * Get circuit breaker status
   */
  getCircuitBreakerStatus(circuitKey: string = 'default'): {
    state: 'closed' | 'open' | 'half-open';
    failures: number;
    lastFailureTime: number;
  } | null {
    const state = this.circuitBreakerState.get(circuitKey);
    return state || null;
  }

  /**
   * Reset circuit breaker
   */
  resetCircuitBreaker(circuitKey: string = 'default'): void {
    this.circuitBreakerState.delete(circuitKey);
  }

  /**
   * Get retry statistics
   */
  getRetryStats(): {
    totalOperations: number;
    successfulOperations: number;
    failedOperations: number;
    averageAttempts: number;
    averageTime: number;
  } {
    // This would track statistics in a real implementation
    return {
      totalOperations: 0,
      successfulOperations: 0,
      failedOperations: 0,
      averageAttempts: 0,
      averageTime: 0
    };
  }
}

export const retryMechanismService = RetryMechanismService.getInstance();
