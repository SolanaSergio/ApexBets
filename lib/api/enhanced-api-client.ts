/**
 * Enhanced API Client with Advanced Caching and Performance Optimization
 * Integrates with the advanced cache service for intelligent data management
 */

import { advancedCache } from '../services/cache/advanced-cache-service'

interface ApiResponse<T> {
  data: T
  meta?: {
    total?: number
    page?: number
    limit?: number
    fromCache?: boolean
    responseTime?: number
    sport?: string
  }
}

interface RequestOptions {
  sport?: string
  priority?: 'low' | 'medium' | 'high'
  ttl?: number
  bypassCache?: boolean
  timeout?: number
  retries?: number
}

export class EnhancedApiClient {
  private baseUrl: string
  private requestQueue = new Map<string, Promise<any>>()
  private defaultTimeout = 15000 // 15 seconds
  private defaultRetries = 3

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_URL || '/api'
  }

  /**
   * Enhanced GET request with intelligent caching
   */
  async get<T>(
    endpoint: string, 
    params: Record<string, any> = {}, 
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const {
      sport,
      priority = 'medium',
      ttl,
      bypassCache = false,
      timeout = this.defaultTimeout,
      retries = this.defaultRetries
    } = options

    // Create cache key
    const cacheKey = this.createCacheKey(endpoint, params, sport)

    // Check cache first (unless bypassed)
    if (!bypassCache) {
      const cached = advancedCache.get<ApiResponse<T>>(cacheKey, sport)
      if (cached) {
        return {
          ...cached,
          meta: {
            ...cached.meta,
            fromCache: true
          }
        }
      }
    }

    // Check if request is already in progress (deduplication)
    if (this.requestQueue.has(cacheKey)) {
      return this.requestQueue.get(cacheKey)
    }

    // Create the request promise
    const requestOptions: {
      timeout: number
      retries: number
      sport?: string
    } = {
      timeout,
      retries
    }
    if (sport !== undefined) {
      requestOptions.sport = sport
    }
    const requestPromise = this.executeRequest<T>(endpoint, params, requestOptions)

    // Store in queue for deduplication
    this.requestQueue.set(cacheKey, requestPromise)

    try {
      const result = await requestPromise

      // Cache the result
      const cacheOptions: {
        ttl?: number
        sport?: string
        priority?: 'low' | 'medium' | 'high'
      } = { priority }
      if (ttl !== undefined) {
        cacheOptions.ttl = ttl
      }
      if (sport !== undefined) {
        cacheOptions.sport = sport
      }
      advancedCache.set(cacheKey, result, cacheOptions)

      return result
    } finally {
      // Remove from queue
      this.requestQueue.delete(cacheKey)
    }
  }

  /**
   * POST request with optional caching
   */
  async post<T>(
    endpoint: string,
    data: any,
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const {
      timeout = this.defaultTimeout,
      retries = this.defaultRetries,
      sport
    } = options

    const requestOptions: {
      method: string
      body: string
      timeout: number
      retries: number
      sport?: string
    } = {
      method: 'POST',
      body: JSON.stringify(data),
      timeout,
      retries
    }
    if (sport !== undefined) {
      requestOptions.sport = sport
    }
    return this.executeRequest<T>(endpoint, {}, requestOptions)
  }

  /**
   * Batch request for multiple endpoints
   */
  async batch<T>(
    requests: Array<{
      endpoint: string
      params?: Record<string, any>
      options?: RequestOptions
    }>
  ): Promise<Array<ApiResponse<T>>> {
    const promises = requests.map(({ endpoint, params = {}, options = {} }) =>
      this.get<T>(endpoint, params, options)
    )

    return Promise.allSettled(promises).then(results =>
      results.map(result => {
        if (result.status === 'fulfilled') {
          return result.value
        } else {
          // Return a properly typed ApiResponse for failed requests
          return {
            data: null as any,
            meta: {
              responseTime: 0,
              fromCache: false
            }
          } as ApiResponse<T>
        }
      })
    )
  }

  /**
   * Invalidate cache for specific patterns
   */
  invalidateCache(pattern: string): void {
    advancedCache.invalidatePattern(pattern)
  }

  /**
   * Invalidate all cache for a sport
   */
  invalidateSportCache(sport: string): void {
    advancedCache.invalidateSport(sport)
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return advancedCache.getStats()
  }

  /**
   * Private helper methods
   */
  private async executeRequest<T>(
    endpoint: string,
    params: Record<string, any>,
    options: {
      method?: string
      body?: string
      timeout: number
      retries: number
      sport?: string
    }
  ): Promise<ApiResponse<T>> {
    const {
      method = 'GET',
      body,
      timeout,
      retries,
      sport
    } = options

    const url = this.buildUrl(endpoint, params)
    const startTime = Date.now()

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), timeout)

        const fetchOptions: RequestInit = {
          method,
          headers: {
            'Content-Type': 'application/json',
            'X-Sport': sport || 'all',
            'X-Request-ID': this.generateRequestId()
          },
          signal: controller.signal
        }
        
        if (body !== undefined) {
          fetchOptions.body = body
        }

        const response = await fetch(url, fetchOptions)

        clearTimeout(timeoutId)

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        const data = await response.json()
        const responseTime = Date.now() - startTime

        return {
          data: data.data || data,
          meta: {
            ...data.meta,
            responseTime,
            sport,
            fromCache: false
          }
        }
      } catch (error) {
        if (attempt === retries) {
          throw new Error(
            `Request failed after ${retries + 1} attempts: ${
              error instanceof Error ? error.message : String(error)
            }`
          )
        }

        // Exponential backoff
        await this.delay(Math.pow(2, attempt) * 1000)
      }
    }

    throw new Error('Request failed unexpectedly')
  }

  private createCacheKey(
    endpoint: string,
    params: Record<string, any>,
    sport?: string
  ): string {
    const sortedParams = Object.keys(params)
      .sort()
      .map(key => `${key}=${params[key]}`)
      .join('&')
    
    return `${endpoint}?${sortedParams}${sport ? `&sport=${sport}` : ''}`
  }

  private buildUrl(endpoint: string, params: Record<string, any>): string {
    const url = new URL(`${this.baseUrl}${endpoint}`)
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, String(value))
      }
    })

    return url.toString()
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

// Singleton instance
export const enhancedApiClient = new EnhancedApiClient()

// Sport-specific convenience methods
export const sportsApi = {
  async getLiveGames(sport: string, options?: RequestOptions) {
    return enhancedApiClient.get(`/live-updates`, { sport, real: true }, {
      ...options,
      sport,
      priority: 'high',
      ttl: 30000 // 30 seconds for live data
    })
  },

  async getTeams(sport: string, options?: RequestOptions) {
    return enhancedApiClient.get(`/teams`, { sport }, {
      ...options,
      sport,
      priority: 'medium',
      ttl: 300000 // 5 minutes for teams
    })
  },

  async getStandings(sport: string, options?: RequestOptions) {
    return enhancedApiClient.get(`/standings`, { sport }, {
      ...options,
      sport,
      priority: 'medium',
      ttl: 300000 // 5 minutes for standings
    })
  },

  async getPredictions(sport: string, limit = 10, options?: RequestOptions) {
    return enhancedApiClient.get(`/predictions`, { sport, limit }, {
      ...options,
      sport,
      priority: 'medium',
      ttl: 60000 // 1 minute for predictions
    })
  },

  async getOdds(sport: string, options?: RequestOptions) {
    return enhancedApiClient.get(`/odds`, { sport, external: true }, {
      ...options,
      sport,
      priority: 'medium',
      ttl: 120000 // 2 minutes for odds
    })
  }
}
