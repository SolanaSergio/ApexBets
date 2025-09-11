/**
 * API Rate Limiting Rules Enforcement
 * Enforces rate limits based on environment configuration
 */

interface RateLimit {
  requestsPerMinute: number
  requestsPerDay: number
  burstLimit: number
}

interface ApiConfig {
  rapidapi: RateLimit
  odds: RateLimit
  sportsdb: RateLimit
  balldontlie: RateLimit
  espn: RateLimit
}

export class ApiRateLimiter {
  private static instance: ApiRateLimiter
  private requestCounts: Map<string, { minute: number; day: number; lastReset: number }> = new Map()
  private burstCounts: Map<string, number> = new Map()

  static getInstance(): ApiRateLimiter {
    if (!ApiRateLimiter.instance) {
      ApiRateLimiter.instance = new ApiRateLimiter()
    }
    return ApiRateLimiter.instance
  }

  private getApiConfig(): ApiConfig {
    return {
      rapidapi: {
        // RapidAPI API-SPORTS: 100 requests/minute, 10,000 requests/day (free tier)
        requestsPerMinute: 100,
        requestsPerDay: 10000,
        burstLimit: 10
      },
      odds: {
        // The Odds API: 10 requests/minute, 100 requests/day (free tier)
        requestsPerMinute: 10,
        requestsPerDay: 100,
        burstLimit: 2
      },
      sportsdb: {
        // TheSportsDB: 30 requests/minute, 10,000 requests/day (free tier)
        requestsPerMinute: 30,
        requestsPerDay: 10000,
        burstLimit: 5
      },
      balldontlie: {
        // BALLDONTLIE: 6 requests/minute, 10,000 requests/day (free tier) - very conservative
        requestsPerMinute: 3, // Even more conservative
        requestsPerDay: 10000,
        burstLimit: 1
      },
      espn: {
        // ESPN API: No official rate limits, but conservative approach
        requestsPerMinute: 60,
        requestsPerDay: 10000,
        burstLimit: 10
      }
    }
  }

  /**
   * Check if API request is allowed
   * Throws error if rate limit exceeded
   */
  checkRateLimit(apiName: keyof ApiConfig): void {
    const config = this.getApiConfig()[apiName]
    const now = Date.now()
    const key = `${apiName}_${Math.floor(now / 60000)}` // minute key
    const dayKey = `${apiName}_${Math.floor(now / 86400000)}` // day key

    // Initialize counters if not exists
    if (!this.requestCounts.has(key)) {
      this.requestCounts.set(key, { minute: 0, day: 0, lastReset: now })
    }
    if (!this.requestCounts.has(dayKey)) {
      this.requestCounts.set(dayKey, { minute: 0, day: 0, lastReset: now })
    }

    const minuteCount = this.requestCounts.get(key)!
    const dayCount = this.requestCounts.get(dayKey)!

    // Check minute limit
    if (minuteCount.minute >= config.requestsPerMinute) {
      throw new Error(`Rate limit exceeded for ${apiName}: ${config.requestsPerMinute} requests per minute`)
    }

    // Check day limit
    if (dayCount.day >= config.requestsPerDay) {
      throw new Error(`Rate limit exceeded for ${apiName}: ${config.requestsPerDay} requests per day`)
    }

    // Check burst limit
    const burstKey = `${apiName}_burst`
    const burstCount = this.burstCounts.get(burstKey) || 0
    if (burstCount >= config.burstLimit) {
      throw new Error(`Burst limit exceeded for ${apiName}: ${config.burstLimit} requests in burst`)
    }

    // Increment counters
    minuteCount.minute++
    dayCount.day++
    this.burstCounts.set(burstKey, burstCount + 1)

    // Reset burst counter after 1 second
    setTimeout(() => {
      this.burstCounts.delete(burstKey)
    }, 1000)
  }

  /**
   * Check if API request is allowed with retry logic
   * Returns true if request is allowed, false if should retry later
   */
  async checkRateLimitWithRetry(apiName: keyof ApiConfig, maxRetries: number = 3): Promise<boolean> {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        this.checkRateLimit(apiName)
        return true
      } catch (error) {
        if (error instanceof Error && error.message.includes('Rate limit exceeded')) {
          // Wait with exponential backoff for rate limit
          const config = this.getApiConfig()[apiName]
          const delay = Math.min(60000 / config.requestsPerMinute * 1000, 30000) // Wait based on rate limit
          console.log(`Rate limit hit for ${apiName}, waiting ${delay}ms`)
          await new Promise(resolve => setTimeout(resolve, delay))
          continue
        } else if (error instanceof Error && error.message.includes('Burst limit exceeded')) {
          // Wait with exponential backoff for burst limit
          const delay = Math.min(2000 * Math.pow(2, attempt), 10000) // Max 10 seconds
          console.log(`Burst limit hit for ${apiName}, waiting ${delay}ms`)
          await new Promise(resolve => setTimeout(resolve, delay))
          continue
        }
        throw error
      }
    }
    return false
  }

  /**
   * Record successful API request
   */
  recordRequest(apiName: keyof ApiConfig): void {
    // Counters already incremented in checkRateLimit
  }

  /**
   * Get current usage for API
   */
  getUsage(apiName: keyof ApiConfig): { minute: number; day: number; burst: number } {
    const now = Date.now()
    const key = `${apiName}_${Math.floor(now / 60000)}`
    const dayKey = `${apiName}_${Math.floor(now / 86400000)}`
    const burstKey = `${apiName}_burst`

    const minuteCount = this.requestCounts.get(key) || { minute: 0, day: 0, lastReset: now }
    const dayCount = this.requestCounts.get(dayKey) || { minute: 0, day: 0, lastReset: now }
    const burstCount = this.burstCounts.get(burstKey) || 0

    return {
      minute: minuteCount.minute,
      day: dayCount.day,
      burst: burstCount
    }
  }

  /**
   * Reset all counters (for testing)
   */
  reset(): void {
    this.requestCounts.clear()
    this.burstCounts.clear()
  }
}

export const apiRateLimiter = ApiRateLimiter.getInstance()
