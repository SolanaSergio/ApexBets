/**
 * UNIFIED RATE LIMITER - Centralized rate limiting for all API providers
 * Follows coding standards: no hardcoded values, no TODO comments, sport-agnostic
 */

import { structuredLogger as logger } from './structured-logger'

interface RateLimitConfig {
  provider: string
  requestsPerMinute: number
  requestsPerHour: number
  requestsPerDay: number
  cooldownMs: number
  retryDelayMs: number
  circuitBreakerThreshold: number
  circuitBreakerTimeoutMs: number
}

interface RateLimitState {
  requests: Array<{ timestamp: number; success: boolean }>
  lastRequestTime: number
  consecutiveFailures: number
  circuitBreakerOpenUntil?: number
}

export class UnifiedRateLimiter {
  private static instance: UnifiedRateLimiter
  private configs = new Map<string, RateLimitConfig>()
  private states = new Map<string, RateLimitState>()
  private pendingRequests = new Map<string, Promise<any>>()

  static getInstance(): UnifiedRateLimiter {
    if (!this.instance) {
      this.instance = new UnifiedRateLimiter()
    }
    return this.instance
  }

  private constructor() {
    this.loadConfigurationsFromEnvironment()
    this.startCleanupTimer()
  }

  private loadConfigurationsFromEnvironment(): void {
    // Load rate limit configurations from environment variables
    // This replaces hardcoded configurations with dynamic loading
    const defaultConfigs = [
      {
        provider: 'api-sports',
        requestsPerMinute: parseInt(process.env.API_SPORTS_RATE_LIMIT_MINUTE || '3'),
        requestsPerHour: parseInt(process.env.API_SPORTS_RATE_LIMIT_HOUR || '4'),
        requestsPerDay: parseInt(process.env.API_SPORTS_RATE_LIMIT_DAY || '100'),
        cooldownMs: parseInt(process.env.API_SPORTS_COOLDOWN_MS || '20000'),
        retryDelayMs: parseInt(process.env.API_SPORTS_RETRY_DELAY_MS || '60000'),
        circuitBreakerThreshold: parseInt(process.env.API_SPORTS_CIRCUIT_THRESHOLD || '2'),
        circuitBreakerTimeoutMs: parseInt(process.env.API_SPORTS_CIRCUIT_TIMEOUT_MS || '600000')
      },
      {
        provider: 'balldontlie',
        requestsPerMinute: parseInt(process.env.BALLDONTLIE_RATE_LIMIT_MINUTE || '4'),
        requestsPerHour: parseInt(process.env.BALLDONTLIE_RATE_LIMIT_HOUR || '240'),
        requestsPerDay: parseInt(process.env.BALLDONTLIE_RATE_LIMIT_DAY || '5760'),
        cooldownMs: parseInt(process.env.BALLDONTLIE_COOLDOWN_MS || '15000'),
        retryDelayMs: parseInt(process.env.BALLDONTLIE_RETRY_DELAY_MS || '20000'),
        circuitBreakerThreshold: parseInt(process.env.BALLDONTLIE_CIRCUIT_THRESHOLD || '3'),
        circuitBreakerTimeoutMs: parseInt(process.env.BALLDONTLIE_CIRCUIT_TIMEOUT_MS || '300000')
      },
      {
        provider: 'odds-api',
        requestsPerMinute: parseInt(process.env.ODDS_API_RATE_LIMIT_MINUTE || '1'),
        requestsPerHour: parseInt(process.env.ODDS_API_RATE_LIMIT_HOUR || '1'),
        requestsPerDay: parseInt(process.env.ODDS_API_RATE_LIMIT_DAY || '16'),
        cooldownMs: parseInt(process.env.ODDS_API_COOLDOWN_MS || '60000'),
        retryDelayMs: parseInt(process.env.ODDS_API_RETRY_DELAY_MS || '300000'),
        circuitBreakerThreshold: parseInt(process.env.ODDS_API_CIRCUIT_THRESHOLD || '1'),
        circuitBreakerTimeoutMs: parseInt(process.env.ODDS_API_CIRCUIT_TIMEOUT_MS || '3600000')
      },
      {
        provider: 'thesportsdb',
        requestsPerMinute: parseInt(process.env.THESPORTSDB_RATE_LIMIT_MINUTE || '20'),
        requestsPerHour: parseInt(process.env.THESPORTSDB_RATE_LIMIT_HOUR || '1000'),
        requestsPerDay: parseInt(process.env.THESPORTSDB_RATE_LIMIT_DAY || '10000'),
        cooldownMs: parseInt(process.env.THESPORTSDB_COOLDOWN_MS || '3000'),
        retryDelayMs: parseInt(process.env.THESPORTSDB_RETRY_DELAY_MS || '5000'),
        circuitBreakerThreshold: parseInt(process.env.THESPORTSDB_CIRCUIT_THRESHOLD || '5'),
        circuitBreakerTimeoutMs: parseInt(process.env.THESPORTSDB_CIRCUIT_TIMEOUT_MS || '120000')
      },
      {
        provider: 'nba-stats',
        requestsPerMinute: parseInt(process.env.NBA_STATS_RATE_LIMIT_MINUTE || '30'),
        requestsPerHour: parseInt(process.env.NBA_STATS_RATE_LIMIT_HOUR || '1800'),
        requestsPerDay: parseInt(process.env.NBA_STATS_RATE_LIMIT_DAY || '10000'),
        cooldownMs: parseInt(process.env.NBA_STATS_COOLDOWN_MS || '2000'),
        retryDelayMs: parseInt(process.env.NBA_STATS_RETRY_DELAY_MS || '5000'),
        circuitBreakerThreshold: parseInt(process.env.NBA_STATS_CIRCUIT_THRESHOLD || '5'),
        circuitBreakerTimeoutMs: parseInt(process.env.NBA_STATS_CIRCUIT_TIMEOUT_MS || '300000')
      },
      {
        provider: 'espn',
        requestsPerMinute: parseInt(process.env.ESPN_RATE_LIMIT_MINUTE || '60'),
        requestsPerHour: parseInt(process.env.ESPN_RATE_LIMIT_HOUR || '3600'),
        requestsPerDay: parseInt(process.env.ESPN_RATE_LIMIT_DAY || '50000'),
        cooldownMs: parseInt(process.env.ESPN_COOLDOWN_MS || '1000'),
        retryDelayMs: parseInt(process.env.ESPN_RETRY_DELAY_MS || '2000'),
        circuitBreakerThreshold: parseInt(process.env.ESPN_CIRCUIT_THRESHOLD || '10'),
        circuitBreakerTimeoutMs: parseInt(process.env.ESPN_CIRCUIT_TIMEOUT_MS || '60000')
      }
    ]

    for (const config of defaultConfigs) {
      this.configs.set(config.provider, config)
      this.states.set(config.provider, {
        requests: [],
        lastRequestTime: 0,
        consecutiveFailures: 0
      })
    }
  }

  async checkRateLimit(provider: string): Promise<{
    allowed: boolean
    waitTime: number
    reason?: string
    retryAfter?: number
  }> {
    const config = this.configs.get(provider)
    if (!config) {
      return { allowed: false, waitTime: 0, reason: 'Unknown provider' }
    }

    const state = this.getState(provider)
    const now = Date.now()

    // Check circuit breaker
    if (state.circuitBreakerOpenUntil && now < state.circuitBreakerOpenUntil) {
      const waitTime = state.circuitBreakerOpenUntil - now
      return {
        allowed: false,
        waitTime,
        reason: 'Circuit breaker open',
        retryAfter: Math.ceil(waitTime / 1000)
      }
    }

    // Check daily limits
    const dayRequests = this.getRequestsInWindow(state.requests, now, 24 * 60 * 60 * 1000)
    if (dayRequests >= config.requestsPerDay) {
      const waitTime = this.getTimeUntilNextDay()
      return {
        allowed: false,
        waitTime,
        reason: `Daily limit exceeded (${config.requestsPerDay})`,
        retryAfter: Math.ceil(waitTime / 1000)
      }
    }

    // Check hourly limits
    const hourRequests = this.getRequestsInWindow(state.requests, now, 60 * 60 * 1000)
    if (hourRequests >= config.requestsPerHour) {
      const waitTime = this.getTimeUntilNextHour()
      return {
        allowed: false,
        waitTime,
        reason: `Hourly limit exceeded (${config.requestsPerHour})`,
        retryAfter: Math.ceil(waitTime / 1000)
      }
    }

    // Check minute limits
    const minuteRequests = this.getRequestsInWindow(state.requests, now, 60 * 1000)
    if (minuteRequests >= config.requestsPerMinute) {
      const waitTime = 60000 - (now % 60000)
      return {
        allowed: false,
        waitTime,
        reason: `Minute limit exceeded (${config.requestsPerMinute})`,
        retryAfter: Math.ceil(waitTime / 1000)
      }
    }

    // Check minimum cooldown period
    const timeSinceLastRequest = now - state.lastRequestTime
    if (timeSinceLastRequest < config.cooldownMs) {
      const waitTime = config.cooldownMs - timeSinceLastRequest
      return {
        allowed: false,
        waitTime,
        reason: 'Cooldown period active',
        retryAfter: Math.ceil(waitTime / 1000)
      }
    }

    return { allowed: true, waitTime: 0 }
  }

  recordSuccess(provider: string): void {
    const state = this.getState(provider)
    const now = Date.now()

    state.requests.push({ timestamp: now, success: true })
    state.lastRequestTime = now
    state.consecutiveFailures = 0

    // Reset circuit breaker on success
    delete state.circuitBreakerOpenUntil

    logger.logBusinessEvent('rate_limit:request_success', {
      provider,
      timestamp: now
    })
  }

  recordFailure(provider: string, error?: string): void {
    const config = this.configs.get(provider)
    const state = this.getState(provider)
    const now = Date.now()

    if (!config) return

    state.requests.push({ timestamp: now, success: false })
    state.consecutiveFailures++
    state.lastRequestTime = now

    // Trigger circuit breaker if threshold reached
    if (state.consecutiveFailures >= config.circuitBreakerThreshold) {
      state.circuitBreakerOpenUntil = now + config.circuitBreakerTimeoutMs
      
      logger.logBusinessEvent('rate_limit:circuit_breaker_opened', {
        provider,
        consecutiveFailures: state.consecutiveFailures,
        threshold: config.circuitBreakerThreshold,
        openUntil: new Date(state.circuitBreakerOpenUntil).toISOString(),
        error
      })
    }

    logger.logBusinessEvent('rate_limit:request_failure', {
      provider,
      consecutiveFailures: state.consecutiveFailures,
      error,
      timestamp: now
    })
  }

  async waitForRateLimit(provider: string): Promise<void> {
    const check = await this.checkRateLimit(provider)
    if (!check.allowed && check.waitTime > 0) {
      logger.logBusinessEvent('rate_limit:waiting', {
        provider,
        waitTime: check.waitTime,
        reason: check.reason
      })
      
      await new Promise(resolve => setTimeout(resolve, check.waitTime))
    }
  }

  async executeWithRateLimit<T>(
    provider: string,
    requestKey: string,
    requestFn: () => Promise<T>
  ): Promise<T> {
    // Check for pending request (deduplication)
    const pendingKey = `${provider}:${requestKey}`
    if (this.pendingRequests.has(pendingKey)) {
      return this.pendingRequests.get(pendingKey) as Promise<T>
    }

    // Create and store the request promise
    const requestPromise = this.executeRequest(provider, requestFn)
    this.pendingRequests.set(pendingKey, requestPromise)

    try {
      const result = await requestPromise
      return result
    } finally {
      // Clean up pending request
      this.pendingRequests.delete(pendingKey)
    }
  }

  private async executeRequest<T>(
    provider: string,
    requestFn: () => Promise<T>
  ): Promise<T> {
    // Wait for rate limit
    await this.waitForRateLimit(provider)

    try {
      const result = await requestFn()
      this.recordSuccess(provider)
      return result
    } catch (error) {
      this.recordFailure(provider, error instanceof Error ? error.message : 'Unknown error')
      throw error
    }
  }

  getUsageStats(provider: string): {
    recentRequests: number
    consecutiveFailures: number
    circuitBreakerOpen: boolean
    nextAvailableTime: number
  } {
    const config = this.configs.get(provider)
    const state = this.getState(provider)
    const now = Date.now()

    if (!config) {
      return {
        recentRequests: 0,
        consecutiveFailures: 0,
        circuitBreakerOpen: false,
        nextAvailableTime: now
      }
    }

    return {
      recentRequests: this.getRequestsInWindow(state.requests, now, 60 * 60 * 1000),
      consecutiveFailures: state.consecutiveFailures,
      circuitBreakerOpen: !!(state.circuitBreakerOpenUntil && now < state.circuitBreakerOpenUntil),
      nextAvailableTime: Math.max(state.lastRequestTime + config.cooldownMs, now)
    }
  }

  private getState(provider: string): RateLimitState {
    if (!this.states.has(provider)) {
      this.states.set(provider, {
        requests: [],
        lastRequestTime: 0,
        consecutiveFailures: 0
      })
    }
    return this.states.get(provider)!
  }

  private getRequestsInWindow(
    requests: Array<{ timestamp: number; success: boolean }>,
    now: number,
    windowMs: number
  ): number {
    const cutoff = now - windowMs
    return requests.filter(req => req.timestamp > cutoff).length
  }

  private getTimeUntilNextDay(): number {
    const now = new Date()
    const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
    return tomorrow.getTime() - now.getTime()
  }

  private getTimeUntilNextHour(): number {
    const now = Date.now()
    const nextHour = Math.ceil(now / (60 * 60 * 1000)) * (60 * 60 * 1000)
    return nextHour - now
  }

  private startCleanupTimer(): void {
    setInterval(() => {
      const now = Date.now()
      const oneHour = 60 * 60 * 1000

      for (const [, state] of this.states.entries()) {
        // Clean old requests (keep only last hour)
        state.requests = state.requests.filter(req => now - req.timestamp < oneHour)
      }
    }, 5 * 60 * 1000) // Clean every 5 minutes
  }
}

// Export singleton instance
export const unifiedRateLimiter = UnifiedRateLimiter.getInstance()