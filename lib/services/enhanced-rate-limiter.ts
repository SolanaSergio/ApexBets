/**
 * Enhanced Rate Limiter
 * Comprehensive rate limiting with database persistence and provider-specific limits
 */

import { createClient } from '@supabase/supabase-js'

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

  private getSupabaseClient() {
    return createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
  }

  private initializeConfigs() {
    // Load rate limit configurations from verified official sources
    // These limits are enforced ONLY in background services that update the database
    // Frontend components should NEVER call external APIs directly
    const configs: RateLimitConfig[] = [
      {
        provider: 'balldontlie',
        requestsPerMinute: 5, // Official: 5/min (Free tier) - Source: balldontlie.io
        requestsPerDay: 7200, // 5 * 60 * 24 hours
        burstLimit: 1, // No burst allowed on free tier
        windowSizeMs: 60000,
        // Update frequency: Every 15s for live games, 5min for standings
      },
      {
        provider: 'api-sports',
        requestsPerMinute: 100, // Official: 100/min (Free tier) - Source: RapidAPI docs
        requestsPerDay: 100, // Conservative: ~3/day to preserve monthly quota
        burstLimit: 10, // Reasonable burst protection
        windowSizeMs: 60000,
        // Update frequency: Every 1min for live games, 10min for standings
      },
      {
        provider: 'thesportsdb',
        requestsPerMinute: 30, // Official: 30/min (Patreon tier) - Source: thesportsdb.com
        requestsPerDay: 10000, // Official: 10,000 requests per day
        burstLimit: 5,
        windowSizeMs: 60000,
        // Update frequency: Every 5min for general data
      },
      {
        provider: 'odds-api',
        requestsPerMinute: 10, // Conservative limit
        requestsPerDay: 16, // 500/month ÷ 30 days = ~16/day
        burstLimit: 5,
        windowSizeMs: 60000,
        // Update frequency: Every 2 hours (conservative to preserve monthly quota)
      },
      {
        provider: 'nba-stats',
        requestsPerMinute: 20, // Conservative limit (unofficial API)
        requestsPerDay: 10000, // Reasonable daily limit
        burstLimit: 5, // Reduced burst limit
        windowSizeMs: 60000,
        // Update frequency: Every 5s for live games, 5min for stats
      },
      {
        provider: 'mlb-stats',
        requestsPerMinute: 60, // Official MLB Stats API (unlimited)
        requestsPerDay: Number.MAX_SAFE_INTEGER,
        burstLimit: 20,
        windowSizeMs: 60000,
        // Update frequency: Every 2s for live games, 3min for stats
      },
      {
        provider: 'nhl',
        requestsPerMinute: 60, // Official NHL API (unlimited)
        requestsPerDay: Number.MAX_SAFE_INTEGER,
        burstLimit: 20,
        windowSizeMs: 60000,
        // Update frequency: Every 2s for live games, 3min for stats
      },
      {
        provider: 'espn',
        requestsPerMinute: 60, // ESPN API (unofficial, unlimited)
        requestsPerDay: Number.MAX_SAFE_INTEGER,
        burstLimit: 15,
        windowSizeMs: 60000,
        // Update frequency: Every 2s for live games, 3min for stats
      },
      {
        provider: 'rapidapi',
        requestsPerMinute: 100, // RapidAPI general limit
        requestsPerDay: 10000,
        burstLimit: 10,
        windowSizeMs: 60000,
        // Update frequency: Varies by specific API
      },
      {
        provider: 'optimized-api',
        requestsPerMinute: 1000, // Internal optimized service
        requestsPerDay: Number.MAX_SAFE_INTEGER,
        burstLimit: 100,
        windowSizeMs: 60000,
        // Update frequency: As needed for internal operations
      },
      {
        provider: 'player-stats',
        requestsPerMinute: 30, // Internal service limit
        requestsPerDay: 1000,
        burstLimit: 5,
        windowSizeMs: 60000,
        // Update frequency: Every 5min for player statistics
      },
      {
        provider: 'team-stats',
        requestsPerMinute: 30, // Internal service limit
        requestsPerDay: 1000,
        burstLimit: 5,
        windowSizeMs: 60000,
        // Update frequency: Every 5min for team statistics
      },
      {
        provider: 'predictions',
        requestsPerMinute: 20, // Internal ML service limit
        requestsPerDay: 500,
        burstLimit: 3,
        windowSizeMs: 60000,
        // Update frequency: Every 10min for predictions
      },
      {
        provider: 'analytics',
        requestsPerMinute: 60, // Internal analytics service
        requestsPerDay: 2000,
        burstLimit: 10,
        windowSizeMs: 60000,
        // Update frequency: Every 3min for analytics
      },
      {
        provider: 'tennis',
        requestsPerMinute: 30, // Internal tennis service
        requestsPerDay: 1000,
        burstLimit: 5,
        windowSizeMs: 60000,
        // Update frequency: Every 5min for tennis data
      },
      {
        provider: 'golf',
        requestsPerMinute: 30, // Internal golf service
        requestsPerDay: 1000,
        burstLimit: 5,
        windowSizeMs: 60000,
        // Update frequency: Every 5min for golf data
      },
    ]

    configs.forEach(config => {
      this.configs.set(config.provider, config)
    })

    // ARCHITECTURE PATTERN: Database-First Approach
    // ==============================================
    // 1. External APIs → Background Services (rate-limited) → Database → Frontend Components
    // 2. ONLY background services should call external APIs and respect these rate limits
    // 3. Frontend components should NEVER call external APIs directly
    // 4. All frontend data should come from the database via optimized-sports-storage
    // 5. Background services update database at optimal frequencies per API
    //
    // Note: Rate limits can be overridden at runtime by loading from database
    // This allows dynamic configuration without requiring environment variables
  }

  async checkRateLimit(provider: string, endpoint: string = 'default'): Promise<RateLimitResult> {
    const config = this.configs.get(provider)
    if (!config) {
      return {
        allowed: true,
        remaining: Number.MAX_SAFE_INTEGER,
        resetTime: Date.now() + 60000,
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
        resetTime: windowStart + config.windowSizeMs,
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
      const windowStart = new Date(
        Math.floor(now.getTime() / config.windowSizeMs) * config.windowSizeMs
      )
      const today = now.toISOString().split('T')[0]

      // Check minute-based rate limit
      const supabase = this.getSupabaseClient()
      const { data: minuteData } = await supabase
        .from('api_rate_limits')
        .select('requests_count, window_start')
        .eq('provider', provider)
        .eq('endpoint', endpoint)
        .eq('window_start', windowStart.toISOString())
        .maybeSingle()

      const currentMinuteRequests = minuteData?.requests_count || 0

      if (currentMinuteRequests >= config.requestsPerMinute) {
        return {
          allowed: false,
          remaining: 0,
          resetTime: windowStart.getTime() + config.windowSizeMs,
          retryAfter: Math.ceil(
            (windowStart.getTime() + config.windowSizeMs - now.getTime()) / 1000
          ),
        }
      }

      // Check daily rate limit
      const { data: dailyData } = await supabase
        .from('api_rate_limits')
        .select('daily_requests')
        .eq('provider', provider)
        .eq('daily_reset_date', today)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      const currentDailyRequests = dailyData?.daily_requests || 0

      if (currentDailyRequests >= config.requestsPerDay) {
        const tomorrow = new Date(now)
        tomorrow.setDate(tomorrow.getDate() + 1)
        tomorrow.setHours(0, 0, 0, 0)

        return {
          allowed: false,
          remaining: 0,
          resetTime: tomorrow.getTime(),
          retryAfter: Math.ceil((tomorrow.getTime() - now.getTime()) / 1000),
        }
      }

      return {
        allowed: true,
        remaining: Math.max(0, config.requestsPerMinute - currentMinuteRequests),
        resetTime: windowStart.getTime() + config.windowSizeMs,
      }
    } catch (error) {
      console.error('Database rate limit check failed:', error)
      // Fallback to allowing the request
      return {
        allowed: true,
        remaining: config.requestsPerMinute,
        resetTime: Date.now() + config.windowSizeMs,
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
        resetTime: windowStart + config.windowSizeMs,
      }
    }

    if (entry.count >= config.burstLimit) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: windowStart + config.windowSizeMs,
        retryAfter: Math.ceil((windowStart + config.windowSizeMs - now) / 1000),
      }
    }

    entry.count++
    return {
      allowed: true,
      remaining: config.requestsPerMinute - entry.count,
      resetTime: windowStart + config.windowSizeMs,
    }
  }

  private async updateRateLimitCounters(
    provider: string,
    endpoint: string,
    config: RateLimitConfig
  ): Promise<void> {
    try {
      const now = new Date()
      const windowStart = new Date(
        Math.floor(now.getTime() / config.windowSizeMs) * config.windowSizeMs
      )
      const today = now.toISOString().split('T')[0]

      // Update minute-based counter
      const supabase = this.getSupabaseClient()
      
      const { error: minuteError } = await supabase
        .from('api_rate_limits')
        .upsert({
          service_name: provider,
          endpoint: endpoint,
          requests_count: 1,
          window_start: windowStart.toISOString(),
          daily_requests: 1,
          daily_reset_date: today,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'service_name,endpoint,window_start',
          ignoreDuplicates: false
        })

      if (minuteError) {
        throw new Error(`Failed to update minute counter: ${minuteError.message}`)
      }

      // Update daily counter
      const { error: dailyError } = await supabase
        .from('api_rate_limits')
        .upsert({
          service_name: provider,
          endpoint: endpoint,
          requests_count: 1,
          window_start: windowStart.toISOString(),
          daily_requests: 1,
          daily_reset_date: today,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'service_name,endpoint,window_start',
          ignoreDuplicates: false
        })

      if (dailyError) {
        throw new Error(`Failed to update daily counter: ${dailyError.message}`)
      }
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
      const windowStart = new Date(
        Math.floor(now.getTime() / config.windowSizeMs) * config.windowSizeMs
      )

      const supabase = this.getSupabaseClient()
      const { data: result, error } = await supabase
        .from('api_rate_limits')
        .select('requests_count, daily_requests')
        .eq('provider', provider)
        .eq('window_start', windowStart.toISOString())

      if (error) {
        throw new Error(`Failed to get rate limit status: ${error.message}`)
      }

      const minuteRequests = result?.reduce((sum, row) => sum + (row.requests_count || 0), 0) || 0
      const dailyRequests = result?.reduce((sum, row) => sum + (row.daily_requests || 0), 0) || 0

      return {
        provider,
        currentMinuteRequests: minuteRequests,
        currentDailyRequests: dailyRequests,
        minuteLimit: config.requestsPerMinute,
        dailyLimit: config.requestsPerDay,
        resetTime: windowStart.getTime() + config.windowSizeMs,
      }
    } catch (error) {
      console.error('Failed to get rate limit status:', error)
      return {
        provider,
        currentMinuteRequests: 0,
        currentDailyRequests: 0,
        minuteLimit: config.requestsPerMinute,
        dailyLimit: config.requestsPerDay,
        resetTime: Date.now() + config.windowSizeMs,
      }
    }
  }

  async resetRateLimits(provider?: string): Promise<void> {
    try {
      const supabase = this.getSupabaseClient()
      
      if (provider) {
        const { error } = await supabase
          .from('api_rate_limits')
          .delete()
          .eq('provider', provider)
        
        if (error) {
          throw new Error(`Failed to reset rate limits for ${provider}: ${error.message}`)
        }
        console.log(`Rate limits reset for provider: ${provider}`)
      } else {
        const { error } = await supabase
          .from('api_rate_limits')
          .delete()
          .neq('id', 0) // Delete all records
        
        if (error) {
          throw new Error(`Failed to reset all rate limits: ${error.message}`)
        }
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
  },
}
