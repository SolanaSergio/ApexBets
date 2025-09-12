/**
 * Intelligent Rate Limiter
 * Based on comprehensive sports data API guide recommendations
 */

export interface ApiLimits {
  requestsPerMinute: number
  requestsPerHour: number
  requestsPerDay: number
  burstLimit: number
  cooldownMs: number
}

export interface ProviderLimits {
  [provider: string]: ApiLimits
}

export class IntelligentRateLimiter {
  private requestCounts = new Map<string, {
    minute: { count: number; reset: number }
    hour: { count: number; reset: number }
    day: { count: number; reset: number }
    burst: { count: number; reset: number }
  }>()

  // Based on comprehensive guide recommendations
  private providerLimits: ProviderLimits = {
    'thesportsdb': {
      requestsPerMinute: 30,
      requestsPerHour: 1800,
      requestsPerDay: Number.MAX_SAFE_INTEGER,
      burstLimit: 10,
      cooldownMs: 2000
    },
    'nba-stats': {
      requestsPerMinute: 60,
      requestsPerHour: 3600,
      requestsPerDay: Number.MAX_SAFE_INTEGER,
      burstLimit: 20,
      cooldownMs: 1000
    },
    'mlb-stats': {
      requestsPerMinute: 60,
      requestsPerHour: 3600,
      requestsPerDay: Number.MAX_SAFE_INTEGER,
      burstLimit: 20,
      cooldownMs: 1000
    },
    'nhl': {
      requestsPerMinute: 60,
      requestsPerHour: 3600,
      requestsPerDay: Number.MAX_SAFE_INTEGER,
      burstLimit: 20,
      cooldownMs: 1000
    },
    'espn': {
      requestsPerMinute: 60,
      requestsPerHour: 3600,
      requestsPerDay: Number.MAX_SAFE_INTEGER,
      burstLimit: 30,
      cooldownMs: 1000
    },
    'balldontlie': {
      requestsPerMinute: 5, // Free tier: 5 requests per minute (strict limit)
      requestsPerHour: 300, // 5 * 60 minutes
      requestsPerDay: 7200, // 5 * 60 * 24 hours
      burstLimit: 1, // No burst allowed on free tier
      cooldownMs: 12000 // 12 seconds between requests
    },
    'api-sports': {
      requestsPerMinute: 80, // Within free tier
      requestsPerHour: 100, // Daily limit split across hours
      requestsPerDay: 100,
      burstLimit: 10,
      cooldownMs: 750
    },
    'odds-api': {
      requestsPerMinute: 10, // Very conservative for expensive API
      requestsPerHour: 50,
      requestsPerDay: 500, // Free tier limit
      burstLimit: 3,
      cooldownMs: 6000
    }
  }

  async checkRateLimit(provider: string): Promise<{ allowed: boolean; waitTime: number; reason?: string }> {
    const limits = this.providerLimits[provider]
    if (!limits) {
      return { allowed: true, waitTime: 0 }
    }

    const now = Date.now()
    const counts = this.getOrCreateCounts(provider, now)

    // Check burst limit (immediate requests)
    if (counts.burst.count >= limits.burstLimit) {
      const waitTime = counts.burst.reset - now
      if (waitTime > 0) {
        return { 
          allowed: false, 
          waitTime, 
          reason: `Burst limit exceeded (${limits.burstLimit} requests)` 
        }
      }
    }

    // Check minute limit
    if (counts.minute.count >= limits.requestsPerMinute) {
      const waitTime = counts.minute.reset - now
      if (waitTime > 0) {
        return { 
          allowed: false, 
          waitTime, 
          reason: `Minute limit exceeded (${limits.requestsPerMinute}/min)` 
        }
      }
    }

    // Check hour limit
    if (counts.hour.count >= limits.requestsPerHour) {
      const waitTime = counts.hour.reset - now
      if (waitTime > 0) {
        return { 
          allowed: false, 
          waitTime, 
          reason: `Hour limit exceeded (${limits.requestsPerHour}/hour)` 
        }
      }
    }

    // Check day limit
    if (counts.day.count >= limits.requestsPerDay) {
      const waitTime = counts.day.reset - now
      if (waitTime > 0) {
        return { 
          allowed: false, 
          waitTime, 
          reason: `Daily limit exceeded (${limits.requestsPerDay}/day)` 
        }
      }
    }

    return { allowed: true, waitTime: 0 }
  }

  async recordRequest(provider: string): Promise<void> {
    const now = Date.now()
    const counts = this.getOrCreateCounts(provider, now)
    
    // Increment all counters
    counts.burst.count++
    counts.minute.count++
    counts.hour.count++
    counts.day.count++
  }

  private getOrCreateCounts(provider: string, now: number) {
    if (!this.requestCounts.has(provider)) {
      this.requestCounts.set(provider, {
        burst: { count: 0, reset: now + 10000 }, // 10 second burst window
        minute: { count: 0, reset: now + 60000 },
        hour: { count: 0, reset: now + 3600000 },
        day: { count: 0, reset: now + 86400000 }
      })
    }

    const counts = this.requestCounts.get(provider)!

    // Reset counters if time windows have passed
    if (now >= counts.burst.reset) {
      counts.burst = { count: 0, reset: now + 10000 }
    }
    if (now >= counts.minute.reset) {
      counts.minute = { count: 0, reset: now + 60000 }
    }
    if (now >= counts.hour.reset) {
      counts.hour = { count: 0, reset: now + 3600000 }
    }
    if (now >= counts.day.reset) {
      counts.day = { count: 0, reset: now + 86400000 }
    }

    return counts
  }

  getProviderStatus(provider: string): {
    minute: { used: number; limit: number; resetIn: number }
    hour: { used: number; limit: number; resetIn: number }
    day: { used: number; limit: number; resetIn: number }
  } {
    const limits = this.providerLimits[provider]
    const counts = this.requestCounts.get(provider)
    const now = Date.now()

    if (!limits || !counts) {
      return {
        minute: { used: 0, limit: 0, resetIn: 0 },
        hour: { used: 0, limit: 0, resetIn: 0 },
        day: { used: 0, limit: 0, resetIn: 0 }
      }
    }

    return {
      minute: { 
        used: counts.minute.count, 
        limit: limits.requestsPerMinute,
        resetIn: Math.max(0, counts.minute.reset - now)
      },
      hour: { 
        used: counts.hour.count, 
        limit: limits.requestsPerHour,
        resetIn: Math.max(0, counts.hour.reset - now)
      },
      day: { 
        used: counts.day.count, 
        limit: limits.requestsPerDay,
        resetIn: Math.max(0, counts.day.reset - now)
      }
    }
  }

  // Get recommended delay between requests for a provider
  getRecommendedDelay(provider: string): number {
    const limits = this.providerLimits[provider]
    return limits?.cooldownMs || 1000
  }
}

export const intelligentRateLimiter = new IntelligentRateLimiter()