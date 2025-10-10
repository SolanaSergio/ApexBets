/**
 * Enhanced Rate Limiter
 * Comprehensive rate limiting with database persistence and provider-specific limits
 */

import { productionSupabaseClient } from '../supabase/production-client'

export interface RateLimitConfig {
  provider: string
  requestsPerMinute: number
  requestsPerDay: number
  burstLimit: number
  windowSizeMs: number
}

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetTime: number
  retryAfter?: number
}

export class EnhancedRateLimiter {
  private static instance: EnhancedRateLimiter
  private configs: Map<string, RateLimitConfig> = new Map()
  private memoryCache: Map<string, { count: number; windowStart: number }> = new Map()

  private constructor() {
    this.initializeConfigs()
  }

  static getInstance(): EnhancedRateLimiter {
    if (!EnhancedRateLimiter.instance) {
      EnhancedRateLimiter.instance = new EnhancedRateLimiter()
    }
    return EnhancedRateLimiter.instance
  }

  private initializeConfigs() {
    // Load rate limit configurations from environment or defaults
    const configs: RateLimitConfig[] = [
      {
        provider: 'thesportsdb',
        requestsPerMinute: 30, // Official limit: 30 requests per minute
        requestsPerDay: 10000, // Official limit: 10,000 requests per day
        burstLimit: 5,
        windowSizeMs: 60000
      },
      {
        provider: 'nba-stats',
        requestsPerMinute: 20, // More conservative due to server errors
        requestsPerDay: 10000, // Reasonable daily limit
        burstLimit: 5, // Reduced burst limit
        windowSizeMs: 60000
      },
      {
        provider: 'mlb-stats',
        requestsPerMinute: 60,
        requestsPerDay: Number.MAX_SAFE_INTEGER,
        burstLimit: 20,
        windowSizeMs: 60000
      },
      {
        provider: 'nhl',
        requestsPerMinute: 60,
        requestsPerDay: Number.MAX_SAFE_INTEGER,
        burstLimit: 20,
        windowSizeMs: 60000
      },
      {
        provider: 'espn',
        requestsPerMinute: 60,
        requestsPerDay: Number.MAX_SAFE_INTEGER,
        burstLimit: 15,
        windowSizeMs: 60000
      },
      {
        provider: 'balldontlie',
        requestsPerMinute: 5, // Official limit: 5 requests per minute
        requestsPerDay: 7200, // 5 * 60 * 24 hours
        burstLimit: 1, // No burst allowed on free tier
        windowSizeMs: 60000
      },
      {
        provider: 'api-sports',
        requestsPerMinute: (() => { const v = process.env.API_SPORTS_REQUESTS_PER_MINUTE; if (!v) { throw new Error('Missing API_SPORTS_REQUESTS_PER_MINUTE'); } return parseInt(v); })(),
        requestsPerDay: (() => { const v = process.env.API_SPORTS_REQUESTS_PER_DAY; if (!v) { throw new Error('Missing API_SPORTS_REQUESTS_PER_DAY'); } return parseInt(v); })(),
        burstLimit: (() => { const v = process.env.API_SPORTS_BURST_LIMIT; if (!v) { throw new Error('Missing API_SPORTS_BURST_LIMIT'); } return parseInt(v); })(),
        windowSizeMs: 60000
      },
      {
        provider: 'odds-api',
        requestsPerMinute: 10, // Official limit: 10 requests per minute
        requestsPerDay: 100, // Official limit: 100 requests per day
        burstLimit: 5,
        windowSizeMs: 60000
      },
      {
        provider: 'optimized-api',
        requestsPerMinute: 1000,
        requestsPerDay: Number.MAX_SAFE_INTEGER,
        burstLimit: 100,
        windowSizeMs: 60000
      },
      {
        provider: 'rapidapi',
        requestsPerMinute: 100,
        requestsPerDay: 10000,
        burstLimit: 10,
        windowSizeMs: 60000
      },
      {
        provider: 'player-stats',
        requestsPerMinute: 30,
        requestsPerDay: 1000,
        burstLimit: 5,
        windowSizeMs: 60000
      },
      {
        provider: 'team-stats',
        requestsPerMinute: 30,
        requestsPerDay: 1000,
        burstLimit: 5,
        windowSizeMs: 60000
      },
      {
        provider: 'predictions',
        requestsPerMinute: 20,
        requestsPerDay: 500,
        burstLimit: 3,
        windowSizeMs: 60000
      },
      {
        provider: 'analytics',
        requestsPerMinute: 60,
        requestsPerDay: 2000,
        burstLimit: 10,
        windowSizeMs: 60000
      },
      {
        provider: 'tennis',
        requestsPerMinute: 30,
        requestsPerDay: 1000,
        burstLimit: 5,
        windowSizeMs: 60000
      },
      {
        provider: 'golf',
        requestsPerMinute: 30,
        requestsPerDay: 1000,
        burstLimit: 5,
        windowSizeMs: 60000
      }
    ]

    configs.forEach(config => {
      this.configs.set(config.provider, config)
    })
  }

  async checkRateLimit(
    provider: string,
    endpoint: string = 'default'
  ): Promise<RateLimitResult> {
    const config = this.configs.get(provider)
    if (!config) {
      return {
        allowed: true,
        remaining: Number.MAX_SAFE_INTEGER,
        resetTime: Date.now() + 60000
      }
    }

    const now = Date.now()
    const windowStart = Math.floor(now / config.windowSizeMs) * config.windowSizeMs
    const key = `${provider}:${endpoint}:${windowStart}`

    try {
      // Check database rate limits first
      const dbResult = await this.checkDatabaseRateLimit(provider, endpoint, config)
      if (!dbResult.allowed) {
        return dbResult
      }

      // Check memory cache for additional burst protection
      const memoryResult = this.checkMemoryRateLimit(key, config)
      if (!memoryResult.allowed) {
        return memoryResult
      }

      // Update counters
      await this.updateRateLimitCounters(provider, endpoint, config)

      return {
        allowed: true,
        remaining: Math.max(0, config.requestsPerMinute - (dbResult.remaining || 0)),
        resetTime: windowStart + config.windowSizeMs
      }
    } catch (error) {
      console.error('Rate limit check failed:', error)
      // Fallback to memory-only rate limiting
      return this.checkMemoryRateLimit(key, config)
    }
  }

  private async checkDatabaseRateLimit(
    provider: string,
    endpoint: string,
    config: RateLimitConfig
  ): Promise<RateLimitResult> {
    try {
      const now = new Date()
      const windowStart = new Date(Math.floor(now.getTime() / config.windowSizeMs) * config.windowSizeMs)
      const today = now.toISOString().split('T')[0]

      // Check minute-based rate limit
      const minuteQuery = `
        SELECT requests_count, window_start
        FROM api_rate_limits
        WHERE provider = '${provider}' 
        AND endpoint = '${endpoint}'
        AND window_start = '${windowStart.toISOString()}'
      `

      const minuteResult = await productionSupabaseClient.executeSQL(minuteQuery)
      const currentMinuteRequests = minuteResult.success && minuteResult.data && minuteResult.data[0] ? minuteResult.data[0].requests_count || 0 : 0

      if (currentMinuteRequests >= config.requestsPerMinute) {
        return {
          allowed: false,
          remaining: 0,
          resetTime: windowStart.getTime() + config.windowSizeMs,
          retryAfter: Math.ceil((windowStart.getTime() + config.windowSizeMs - now.getTime()) / 1000)
        }
      }

      // Check daily rate limit
      const dailyQuery = `
        SELECT daily_requests
        FROM api_rate_limits
        WHERE provider = '${provider}'
        AND daily_reset_date = '${today}'
        ORDER BY created_at DESC
        LIMIT 1
      `

      const dailyResult = await productionSupabaseClient.executeSQL(dailyQuery)
      const currentDailyRequests = dailyResult.success && dailyResult.data && dailyResult.data[0] ? dailyResult.data[0].daily_requests || 0 : 0

      if (currentDailyRequests >= config.requestsPerDay) {
        const tomorrow = new Date(now)
        tomorrow.setDate(tomorrow.getDate() + 1)
        tomorrow.setHours(0, 0, 0, 0)

        return {
          allowed: false,
          remaining: 0,
          resetTime: tomorrow.getTime(),
          retryAfter: Math.ceil((tomorrow.getTime() - now.getTime()) / 1000)
        }
      }

      return {
        allowed: true,
        remaining: Math.max(0, config.requestsPerMinute - currentMinuteRequests),
        resetTime: windowStart.getTime() + config.windowSizeMs
      }
    } catch (error) {
      console.error('Database rate limit check failed:', error)
      // Fallback to allowing the request
      return {
        allowed: true,
        remaining: config.requestsPerMinute,
        resetTime: Date.now() + config.windowSizeMs
      }
    }
  }

  private checkMemoryRateLimit(key: string, config: RateLimitConfig): RateLimitResult {
    const now = Date.now()
    const windowStart = Math.floor(now / config.windowSizeMs) * config.windowSizeMs
    const memoryKey = `${key}:memory`

    const entry = this.memoryCache.get(memoryKey)
    if (!entry || entry.windowStart !== windowStart) {
      // New window, reset counter
      this.memoryCache.set(memoryKey, { count: 1, windowStart })
      return {
        allowed: true,
        remaining: config.requestsPerMinute - 1,
        resetTime: windowStart + config.windowSizeMs
      }
    }

    if (entry.count >= config.burstLimit) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: windowStart + config.windowSizeMs,
        retryAfter: Math.ceil((windowStart + config.windowSizeMs - now) / 1000)
      }
    }

    entry.count++
    return {
      allowed: true,
      remaining: config.requestsPerMinute - entry.count,
      resetTime: windowStart + config.windowSizeMs
    }
  }

  private async updateRateLimitCounters(
    provider: string,
    endpoint: string,
    config: RateLimitConfig
  ): Promise<void> {
    try {
      const now = new Date()
      const windowStart = new Date(Math.floor(now.getTime() / config.windowSizeMs) * config.windowSizeMs)
      const today = now.toISOString().split('T')[0]

      // Update minute-based counter
      const updateMinuteQuery = `
        INSERT INTO api_rate_limits (provider, endpoint, requests_count, window_start, daily_requests, daily_reset_date)
        VALUES ('${provider}', '${endpoint}', 1, '${windowStart.toISOString()}', 1, '${today}')
        ON CONFLICT (provider, endpoint, window_start)
        DO UPDATE SET 
          requests_count = api_rate_limits.requests_count + 1,
          updated_at = NOW()
      `

      await productionSupabaseClient.executeSQL(updateMinuteQuery)

      // Update daily counter
      const updateDailyQuery = `
        INSERT INTO api_rate_limits (provider, endpoint, requests_count, window_start, daily_requests, daily_reset_date)
        VALUES ('${provider}', '${endpoint}', 1, '${windowStart.toISOString()}', 1, '${today}')
        ON CONFLICT (provider, endpoint, window_start)
        DO UPDATE SET 
          daily_requests = api_rate_limits.daily_requests + 1,
          updated_at = NOW()
      `

      await productionSupabaseClient.executeSQL(updateDailyQuery)
    } catch (error) {
      console.error('Failed to update rate limit counters:', error)
    }
  }

  async getRateLimitStatus(provider: string): Promise<{
    provider: string
    currentMinuteRequests: number
    currentDailyRequests: number
    minuteLimit: number
    dailyLimit: number
    resetTime: number
  }> {
    const config = this.configs.get(provider)
    if (!config) {
      throw new Error(`No rate limit config found for provider: ${provider}`)
    }

    try {
      const now = new Date()
      const windowStart = new Date(Math.floor(now.getTime() / config.windowSizeMs) * config.windowSizeMs)

      const query = `
        SELECT 
          COALESCE(SUM(requests_count), 0) as minute_requests,
          COALESCE(SUM(daily_requests), 0) as daily_requests
        FROM api_rate_limits
        WHERE provider = '${provider}'
        AND window_start = '${windowStart.toISOString()}'
      `

      const result = await productionSupabaseClient.executeSQL(query)
      const data = result.success && result.data && result.data[0] ? result.data[0] : { minute_requests: 0, daily_requests: 0 }

      return {
        provider,
        currentMinuteRequests: parseInt(data.minute_requests) || 0,
        currentDailyRequests: parseInt(data.daily_requests) || 0,
        minuteLimit: config.requestsPerMinute,
        dailyLimit: config.requestsPerDay,
        resetTime: windowStart.getTime() + config.windowSizeMs
      }
    } catch (error) {
      console.error('Failed to get rate limit status:', error)
      return {
        provider,
        currentMinuteRequests: 0,
        currentDailyRequests: 0,
        minuteLimit: config.requestsPerMinute,
        dailyLimit: config.requestsPerDay,
        resetTime: Date.now() + config.windowSizeMs
      }
    }
  }

  async resetRateLimits(provider?: string): Promise<void> {
    try {
      if (provider) {
        const query = `DELETE FROM api_rate_limits WHERE provider = '${provider}'`
        await productionSupabaseClient.executeSQL(query)
        console.log(`Rate limits reset for provider: ${provider}`)
      } else {
        const query = 'DELETE FROM api_rate_limits'
        await productionSupabaseClient.executeSQL(query)
        console.log('All rate limits reset')
      }
    } catch (error) {
      console.error('Failed to reset rate limits:', error)
    }
  }

  getConfig(provider: string): RateLimitConfig | undefined {
    return this.configs.get(provider)
  }

  getAllConfigs(): Map<string, RateLimitConfig> {
    return new Map(this.configs)
  }
}

export const enhancedRateLimiter = EnhancedRateLimiter.getInstance()

// Backward-compatible facade used by API Status route
export const intelligentRateLimiter = {
  getProviderStatus(provider: string) {
    const cfg = enhancedRateLimiter.getConfig(provider)
    const now = Date.now()
    const minute = { used: 0, limit: cfg?.requestsPerMinute || 0, resetIn: 60000 }
    const hour = { used: 0, limit: (cfg?.requestsPerMinute || 0) * 60, resetIn: 60 * 60000 }
    const day = { used: 0, limit: cfg?.requestsPerDay || 0, resetIn: 24 * 60 * 60000 }
    return { minute, hour, day, now }
  },
  getRecommendedDelay(_provider: string) {
    return 0
  }
}