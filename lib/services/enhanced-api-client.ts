/**
 * Enhanced API Client
 * Integrates rate limiting, caching, error handling, and environment validation
 */

import { envValidator } from '../config/env-validator'
import { rateLimiter } from './rate-limiter'
import { cacheService } from './cache-service'
import { errorHandlingService } from './error-handling-service'

interface ApiRequestOptions {
  useCache?: boolean
  cacheTtl?: number
  retries?: number
  timeout?: number
  priority?: 'low' | 'normal' | 'high'
}

interface ApiResponse<T> {
  data: T
  fromCache: boolean
  responseTime: number
  rateLimitInfo: {
    remaining: number
    resetTime: number
  }
}

class EnhancedApiClient {
  private baseUrl: string
  private defaultTimeout: number = 30000 // 30 seconds

  constructor(baseUrl: string = '/api') {
    this.baseUrl = baseUrl
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {},
    service: string,
    requestOptions: ApiRequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const startTime = Date.now()
    const {
      useCache = true,
      cacheTtl = 5 * 60 * 1000, // 5 minutes
      retries = 3,
      timeout = this.defaultTimeout,
      priority = 'normal'
    } = requestOptions

    const cacheKey = `api:${service}:${endpoint}:${JSON.stringify(options)}`
    
    // Check cache first
    if (useCache) {
      const cached = cacheService.get<T>(cacheKey)
      if (cached) {
        return {
          data: cached,
          fromCache: true,
          responseTime: 0,
          rateLimitInfo: {
            remaining: 0,
            resetTime: 0
          }
        }
      }
    }

    // Check rate limits
    await rateLimiter.waitForRateLimit(service)

    // Make the request with retry logic
    const data = await errorHandlingService.withRetry(
      async () => {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), timeout)

        try {
          const response = await fetch(`${this.baseUrl}${endpoint}`, {
            ...options,
            signal: controller.signal,
            headers: {
              'Content-Type': 'application/json',
              'X-Request-Priority': priority,
              ...options.headers
            }
          })

          clearTimeout(timeoutId)

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`)
          }

          const responseData = await response.json()
          return responseData
        } catch (error) {
          clearTimeout(timeoutId)
          throw error
        }
      },
      retries,
      1000,
      { service, endpoint }
    )

    const responseTime = Date.now() - startTime

    // Record the request for rate limiting
    rateLimiter.recordRequest(service, responseTime, false)

    // Cache the response
    if (useCache) {
      cacheService.set(cacheKey, data, cacheTtl)
    }

    // Get rate limit info
    const rateLimitStatus = rateLimiter.getRateLimitStatus(service)

    return {
      data,
      fromCache: false,
      responseTime,
      rateLimitInfo: {
        remaining: rateLimitStatus.limits.requestsPerMinute - rateLimitStatus.usage.requestsThisMinute,
        resetTime: Date.now() + 60000 // Reset in 1 minute
      }
    }
  }

  // Sports API methods
  async getGames(params: {
    sport?: string
    status?: string
    date?: string
    teamId?: string
    external?: boolean
  } = {}): Promise<ApiResponse<any[]>> {
    const searchParams = new URLSearchParams()
    if (params.sport) searchParams.set('sport', params.sport)
    if (params.status) searchParams.set('status', params.status)
    if (params.date) searchParams.set('date', params.date)
    if (params.teamId) searchParams.set('team_id', params.teamId)
    if (params.external) searchParams.set('external', 'true')

    const query = searchParams.toString()
    const endpoint = `/games${query ? `?${query}` : ''}`

    return this.makeRequest<any[]>(endpoint, { method: 'GET' }, 'sportsdb', {
      useCache: !params.external,
      cacheTtl: params.external ? 30000 : 5 * 60 * 1000 // 30 seconds for external, 5 minutes for cached
    })
  }

  async getOdds(params: {
    sport?: string
    gameId?: string
    markets?: string[]
    external?: boolean
  } = {}): Promise<ApiResponse<any[]>> {
    const searchParams = new URLSearchParams()
    if (params.sport) searchParams.set('sport', params.sport)
    if (params.gameId) searchParams.set('game_id', params.gameId)
    if (params.markets) searchParams.set('markets', params.markets.join(','))
    if (params.external) searchParams.set('external', 'true')

    const query = searchParams.toString()
    const endpoint = `/odds${query ? `?${query}` : ''}`

    return this.makeRequest<any[]>(endpoint, { method: 'GET' }, 'odds', {
      useCache: !params.external,
      cacheTtl: params.external ? 120000 : 2 * 60 * 1000 // 2 minutes for external, 2 minutes for cached
    })
  }

  async getTeams(params: {
    league?: string
    sport?: string
    search?: string
  } = {}): Promise<ApiResponse<any[]>> {
    const searchParams = new URLSearchParams()
    if (params.league) searchParams.set('league', params.league)
    if (params.sport) searchParams.set('sport', params.sport)
    if (params.search) searchParams.set('search', params.search)

    const query = searchParams.toString()
    const endpoint = `/teams${query ? `?${query}` : ''}`

    return this.makeRequest<any[]>(endpoint, { method: 'GET' }, 'sportsdb', {
      useCache: true,
      cacheTtl: 30 * 60 * 1000 // 30 minutes for teams (rarely change)
    })
  }

  async getPredictions(params: {
    gameId: string
    modelName?: string
  }): Promise<ApiResponse<any>> {
    const searchParams = new URLSearchParams()
    searchParams.set('game_id', params.gameId)
    if (params.modelName) searchParams.set('model_name', params.modelName)

    const query = searchParams.toString()
    const endpoint = `/predictions?${query}`

    return this.makeRequest<any>(endpoint, { method: 'GET' }, 'rapidapi', {
      useCache: true,
      cacheTtl: 10 * 60 * 1000 // 10 minutes for predictions
    })
  }

  async getValueBets(params: {
    sport?: string
    minValue?: number
    recommendation?: string
  } = {}): Promise<ApiResponse<any>> {
    const searchParams = new URLSearchParams()
    if (params.sport) searchParams.set('sport', params.sport)
    if (params.minValue) searchParams.set('min_value', params.minValue.toString())
    if (params.recommendation) searchParams.set('recommendation', params.recommendation)

    const query = searchParams.toString()
    const endpoint = `/value-bets${query ? `?${query}` : ''}`

    return this.makeRequest<any>(endpoint, { method: 'GET' }, 'rapidapi', {
      useCache: true,
      cacheTtl: 2 * 60 * 1000 // 2 minutes for value bets
    })
  }

  async getLiveScores(params: {
    sport?: string
  } = {}): Promise<ApiResponse<any[]>> {
    const searchParams = new URLSearchParams()
    if (params.sport) searchParams.set('sport', params.sport)

    const query = searchParams.toString()
    const endpoint = `/live-scores${query ? `?${query}` : ''}`

    return this.makeRequest<any[]>(endpoint, { method: 'GET' }, 'odds', {
      useCache: true,
      cacheTtl: 30000 // 30 seconds for live scores
    })
  }

  async getAnalyticsStats(): Promise<ApiResponse<any>> {
    return this.makeRequest<any>('/analytics/stats', { method: 'GET' }, 'sportsdb', {
      useCache: true,
      cacheTtl: 5 * 60 * 1000 // 5 minutes for analytics
    })
  }

  // Health check and status methods
  async getHealthStatus(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy'
    services: Record<string, any>
    cache: any
    rateLimits: any
    environment: any
  }> {
    const services: Record<string, any> = {}
    const rateLimits: Record<string, any> = {}

    // Check each service
    for (const [service] of rateLimiter['limits']) {
      const rateLimitStatus = rateLimiter.getRateLimitStatus(service)
      const usageStats = rateLimiter.getUsageStats(service)
      
      services[service] = {
        status: rateLimitStatus.canMakeRequest ? 'healthy' : 'rate_limited',
        usage: usageStats,
        limits: rateLimitStatus.limits
      }

      rateLimits[service] = rateLimitStatus
    }

    // Check environment
    const envReport = envValidator.getConfigurationReport()

    // Check cache
    const cacheStats = cacheService.getStats()

    // Determine overall status
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy'
    
    if (!envReport.isConfigured) {
      status = 'unhealthy'
    } else if (Object.values(services).some(s => s.status === 'rate_limited')) {
      status = 'degraded'
    }

    return {
      status,
      services,
      cache: cacheStats,
      rateLimits,
      environment: envReport
    }
  }

  // Cache management methods
  clearCache(pattern?: RegExp): void {
    if (pattern) {
      const keys = cacheService.keys(pattern)
      keys.forEach(key => cacheService.delete(key))
    } else {
      cacheService.clear()
    }
  }

  getCacheStats(): any {
    return cacheService.getStats()
  }

  // Rate limit management
  getRateLimitStats(): any {
    return rateLimiter.getAllUsageStats()
  }

  // Environment validation
  getEnvironmentStatus(): any {
    return envValidator.getConfigurationReport()
  }

  // Warm up cache with critical data
  async warmupCache(): Promise<void> {
    try {
      // Warm up frequently accessed data
      await Promise.all([
        this.getTeams({ sport: 'basketball' }),
        this.getGames({ status: 'live' }),
        this.getAnalyticsStats()
      ])
    } catch (error) {
      console.warn('Cache warmup failed:', error)
    }
  }
}

export const enhancedApiClient = new EnhancedApiClient()
export type { ApiRequestOptions, ApiResponse }
