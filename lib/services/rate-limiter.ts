/**
 * Enhanced Rate Limiter Service
 * Provides API-specific rate limiting with burst protection and usage tracking
 */

interface RateLimitConfig {
  requestsPerMinute: number
  requestsPerHour: number
  requestsPerDay: number
  burstLimit: number
  burstWindow: number // in milliseconds
}

interface RateLimitState {
  requests: number[]
  burstRequests: number[]
  lastReset: number
  isBlocked: boolean
  blockUntil?: number
  errors: number
}

interface UsageStats {
  totalRequests: number
  requestsToday: number
  requestsThisHour: number
  requestsThisMinute: number
  lastRequestTime: number
  averageResponseTime: number
  errorRate: number
  isBlocked?: boolean
  blockUntil?: number
}

class RateLimiter {
  private limits: Map<string, RateLimitConfig> = new Map()
  private states: Map<string, RateLimitState> = new Map()
  private usageStats: Map<string, UsageStats> = new Map()
  private responseTimes: Map<string, number[]> = new Map()

  constructor() {
    this.initializeLimits()
  }

  private initializeLimits(): void {
    // RapidAPI (API-SPORTS) - Premium tier limits
    this.limits.set('rapidapi', {
      requestsPerMinute: 100,
      requestsPerHour: 1000,
      requestsPerDay: 10000,
      burstLimit: 10,
      burstWindow: 10000 // 10 seconds
    })

    // The Odds API - Free tier limits
    this.limits.set('odds', {
      requestsPerMinute: 10,
      requestsPerHour: 100,
      requestsPerDay: 100,
      burstLimit: 5,
      burstWindow: 60000 // 1 minute
    })

    // TheSportsDB - Free tier limits
    this.limits.set('sportsdb', {
      requestsPerMinute: 30,
      requestsPerHour: 1000,
      requestsPerDay: 10000,
      burstLimit: 5,
      burstWindow: 10000 // 10 seconds
    })

    // BALLDONTLIE - Free tier limits (official documentation)
    this.limits.set('balldontlie', {
      requestsPerMinute: 5, // Free tier: 5 requests per minute (official limit)
      requestsPerHour: 300, // 5 * 60 minutes
      requestsPerDay: 7200, // 5 * 60 * 24 hours
      burstLimit: 1, // No burst allowed on free tier
      burstWindow: 12000 // 12 seconds between requests
    })

    // Initialize states
    for (const [service] of this.limits) {
      this.states.set(service, {
        requests: [],
        burstRequests: [],
        lastReset: Date.now(),
        isBlocked: false,
        errors: 0
      })

      this.usageStats.set(service, {
        totalRequests: 0,
        requestsToday: 0,
        requestsThisHour: 0,
        requestsThisMinute: 0,
        lastRequestTime: 0,
        averageResponseTime: 0,
        errorRate: 0
      })

      this.responseTimes.set(service, [])
    }
  }

  private getState(service: string): RateLimitState {
    let state = this.states.get(service)
    if (!state) {
      state = {
        requests: [],
        burstRequests: [],
        lastReset: Date.now(),
        isBlocked: false,
        errors: 0
      }
      this.states.set(service, state)
    }
    return state
  }

  private getStats(service: string): UsageStats {
    let stats = this.usageStats.get(service)
    if (!stats) {
      stats = {
        totalRequests: 0,
        requestsToday: 0,
        requestsThisHour: 0,
        requestsThisMinute: 0,
        lastRequestTime: 0,
        averageResponseTime: 0,
        errorRate: 0
      }
      this.usageStats.set(service, stats)
    }
    return stats
  }


  private cleanupOldRequests(service: string): void {
    const state = this.getState(service)
    const config = this.limits.get(service)!
    const now = Date.now()

    // Clean up requests older than 1 minute
    state.requests = state.requests.filter(time => now - time < 60000)
    
    // Clean up burst requests older than burst window
    state.burstRequests = state.burstRequests.filter(time => now - time < config.burstWindow)
  }

  private canMakeRequest(service: string): { allowed: boolean; waitTime?: number; reason?: string } {
    const config = this.limits.get(service)
    if (!config) {
      return { allowed: false, reason: 'Service not configured' }
    }

    const state = this.getState(service)
    const now = Date.now()

    // Check if service is blocked
    if (state.isBlocked && state.blockUntil && now < state.blockUntil) {
      return { 
        allowed: false, 
        waitTime: state.blockUntil - now,
        reason: 'Service temporarily blocked due to rate limit violations'
      }
    }

    // Reset block if time has passed
    if (state.isBlocked && (!state.blockUntil || now >= state.blockUntil)) {
      state.isBlocked = false
      state.blockUntil = undefined
    }

    this.cleanupOldRequests(service)

    // Check burst limit
    if (state.burstRequests.length >= config.burstLimit) {
      const oldestBurst = Math.min(...state.burstRequests)
      const waitTime = config.burstWindow - (now - oldestBurst)
      if (waitTime > 0) {
        return { 
          allowed: false, 
          waitTime,
          reason: 'Burst limit exceeded'
        }
      }
    }

    // Check minute limit
    if (state.requests.length >= config.requestsPerMinute) {
      const oldestRequest = Math.min(...state.requests)
      const waitTime = 60000 - (now - oldestRequest)
      return { 
        allowed: false, 
        waitTime,
        reason: 'Minute limit exceeded'
      }
    }

    return { allowed: true }
  }

  async waitForRateLimit(service: string): Promise<void> {
    const check = this.canMakeRequest(service)
    
    if (!check.allowed && check.waitTime) {
      console.log(`Rate limit hit for ${service}, waiting ${check.waitTime}ms`)
      await new Promise(resolve => setTimeout(resolve, check.waitTime!))
    }
  }

  recordRequest(service: string, responseTime: number, isError: boolean = false): void {
    const state = this.getState(service)
    const stats = this.getStats(service)
    const now = Date.now()

    // Record the request
    state.requests.push(now)
    state.burstRequests.push(now)
    stats.totalRequests++
    stats.lastRequestTime = now

    // Update response time tracking
    const responseTimes = this.responseTimes.get(service) || []
    responseTimes.push(responseTime)
    
    // Keep only last 100 response times for average calculation
    if (responseTimes.length > 100) {
      responseTimes.shift()
    }
    
    this.responseTimes.set(service, responseTimes)
    stats.averageResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length

    // Update error rate
    if (isError) {
      state.errors++
      const recentRequests = state.requests.filter(time => now - time < 300000) // Last 5 minutes
      stats.errorRate = state.errors / Math.max(recentRequests.length, 1)
    }

    // Check if we should block the service due to high error rate
    if (stats.errorRate > 0.5 && state.requests.length > 10) {
      state.isBlocked = true
      state.blockUntil = now + 300000 // Block for 5 minutes
      console.warn(`Service ${service} blocked due to high error rate: ${stats.errorRate}`)
    }
  }

  getUsageStats(service: string): UsageStats {
    const state = this.getState(service)
    const stats = this.getStats(service)
    const now = Date.now()

    // Calculate time-based counters
    const requestsThisMinute = state.requests.filter(time => now - time < 60000).length
    const requestsThisHour = state.requests.filter(time => now - time < 3600000).length
    const requestsToday = state.requests.filter(time => now - time < 86400000).length

    return {
      totalRequests: stats.totalRequests,
      requestsToday,
      requestsThisHour,
      requestsThisMinute,
      lastRequestTime: stats.lastRequestTime,
      averageResponseTime: stats.averageResponseTime,
      errorRate: state.errors / Math.max(state.requests.length, 1),
      isBlocked: state.blockUntil ? state.blockUntil > now : false,
      blockUntil: state.blockUntil
    }
  }

  getAllUsageStats(): Record<string, UsageStats> {
    const result: Record<string, UsageStats> = {}
    for (const [service] of this.limits) {
      result[service] = this.getUsageStats(service)
    }
    return result
  }

  resetUsageStats(service?: string): void {
    if (service) {
      this.usageStats.set(service, {
        totalRequests: 0,
        requestsToday: 0,
        requestsThisHour: 0,
        requestsThisMinute: 0,
        lastRequestTime: 0,
        averageResponseTime: 0,
        errorRate: 0
      })
      this.responseTimes.set(service, [])
    } else {
      for (const [serviceName] of this.limits) {
        this.resetUsageStats(serviceName)
      }
    }
  }

  getRateLimitStatus(service: string): {
    canMakeRequest: boolean
    waitTime?: number
    reason?: string
    usage: UsageStats
    limits: RateLimitConfig
  } {
    const check = this.canMakeRequest(service)
    const usage = this.getUsageStats(service)
    const limits = this.limits.get(service)!

    return {
      canMakeRequest: check.allowed,
      waitTime: check.waitTime,
      reason: check.reason,
      usage,
      limits
    }
  }

  // Get recommended delay for optimal API usage
  getRecommendedDelay(service: string): number {
    const config = this.limits.get(service)!
    const usage = this.getUsageStats(service)
    
    // If we're close to limits, increase delay
    if (usage.requestsThisMinute > config.requestsPerMinute * 0.8) {
      return 6000 // 6 seconds
    } else if (usage.requestsThisMinute > config.requestsPerMinute * 0.5) {
      return 3000 // 3 seconds
    } else {
      return 1000 // 1 second
    }
  }
}

export const rateLimiter = new RateLimiter()
export type { RateLimitConfig, RateLimitState, UsageStats }
