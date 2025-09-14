/**
 * Generic API Error Handler
 * Handles errors and retries for all sports APIs in a sport-agnostic way
 */

export interface APIErrorHandlerConfig {
  maxRetries: number
  retryDelay: number
  cooldownPeriod: number
  userAgents: string[]
}

export interface APIErrorResult {
  success: boolean
  error?: string
  shouldRetry: boolean
  shouldRotateUserAgent: boolean
  cooldownUntil?: number
}

export class APIErrorHandler {
  private config: APIErrorHandlerConfig
  private failureCounts: Map<string, number> = new Map()
  private lastFailureTimes: Map<string, number> = new Map()
  private currentUserAgentIndex: number = 0

  constructor(config: Partial<APIErrorHandlerConfig> = {}) {
    this.config = {
      maxRetries: 3,
      retryDelay: 2000,
      cooldownPeriod: 5 * 60 * 1000, // 5 minutes
      userAgents: [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/121.0',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      ],
      ...config
    }
  }

  /**
   * Handle API errors in a sport-agnostic way
   */
  handleError(provider: string, error: Error, response?: Response): APIErrorResult {
    const errorMessage = error.message
    const statusCode = response?.status

    // Check if we're in cooldown period
    if (this.isInCooldown(provider)) {
      return {
        success: false,
        error: `${provider}: In cooldown period due to recent failures`,
        shouldRetry: false,
        shouldRotateUserAgent: false,
        cooldownUntil: this.getCooldownUntil(provider)
      }
    }

    // Handle different types of errors
    if (statusCode === 429) {
      return {
        success: false,
        error: `${provider}: Rate limit exceeded`,
        shouldRetry: true,
        shouldRotateUserAgent: false
      }
    }

    if (statusCode === 403) {
      this.recordFailure(provider)
      this.rotateUserAgent()
      return {
        success: false,
        error: `${provider}: Access forbidden - user agent rotated`,
        shouldRetry: true,
        shouldRotateUserAgent: true
      }
    }

    if (statusCode && statusCode >= 500) {
      this.recordFailure(provider)
      return {
        success: false,
        error: `${provider}: Server error ${statusCode}`,
        shouldRetry: true,
        shouldRotateUserAgent: false
      }
    }

    if (errorMessage.includes('timeout') || errorMessage.includes('AbortError')) {
      this.recordFailure(provider)
      return {
        success: false,
        error: `${provider}: Request timeout`,
        shouldRetry: true,
        shouldRotateUserAgent: false
      }
    }

    if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
      this.recordFailure(provider)
      return {
        success: false,
        error: `${provider}: Network error`,
        shouldRetry: true,
        shouldRotateUserAgent: false
      }
    }

    // Generic error handling
    this.recordFailure(provider)
    return {
      success: false,
      error: `${provider}: ${errorMessage}`,
      shouldRetry: this.shouldRetry(provider),
      shouldRotateUserAgent: false
    }
  }

  /**
   * Get current user agent
   */
  getCurrentUserAgent(): string {
    return this.config.userAgents[this.currentUserAgentIndex]
  }

  /**
   * Rotate to next user agent
   */
  rotateUserAgent(): void {
    this.currentUserAgentIndex = (this.currentUserAgentIndex + 1) % this.config.userAgents.length
    console.log(`Rotated user agent to index ${this.currentUserAgentIndex}`)
  }

  /**
   * Check if provider is in cooldown period
   */
  private isInCooldown(provider: string): boolean {
    const lastFailure = this.lastFailureTimes.get(provider) || 0
    return Date.now() - lastFailure < this.config.cooldownPeriod
  }

  /**
   * Get cooldown end time
   */
  private getCooldownUntil(provider: string): number {
    const lastFailure = this.lastFailureTimes.get(provider) || 0
    return lastFailure + this.config.cooldownPeriod
  }

  /**
   * Record a failure for a provider
   */
  private recordFailure(provider: string): void {
    const currentFailures = this.failureCounts.get(provider) || 0
    this.failureCounts.set(provider, currentFailures + 1)
    this.lastFailureTimes.set(provider, Date.now())
    
    if (currentFailures + 1 >= this.config.maxRetries) {
      console.warn(`${provider}: ${currentFailures + 1} consecutive failures, entering cooldown period`)
    }
  }

  /**
   * Check if we should retry based on failure count
   */
  private shouldRetry(provider: string): boolean {
    const failures = this.failureCounts.get(provider) || 0
    return failures < this.config.maxRetries
  }

  /**
   * Reset failure count for a provider (call on successful request)
   */
  resetFailureCount(provider: string): void {
    this.failureCounts.set(provider, 0)
  }

  /**
   * Get failure statistics for a provider
   */
  getProviderStats(provider: string): {
    failureCount: number
    lastFailure: number
    isInCooldown: boolean
    cooldownUntil?: number | undefined
  } {
    const isInCooldown = this.isInCooldown(provider)
    return {
      failureCount: this.failureCounts.get(provider) || 0,
      lastFailure: this.lastFailureTimes.get(provider) || 0,
      isInCooldown,
      ...(isInCooldown && { cooldownUntil: this.getCooldownUntil(provider) })
    }
  }

  /**
   * Get all provider statistics
   */
  getAllProviderStats(): Record<string, {
    failureCount: number
    lastFailure: number
    isInCooldown: boolean
    cooldownUntil?: number
  }> {
    const stats: Record<string, any> = {}
    
    for (const provider of this.failureCounts.keys()) {
      stats[provider] = this.getProviderStats(provider)
    }
    
    return stats
  }
}

// Export singleton instance
export const apiErrorHandler = new APIErrorHandler()
