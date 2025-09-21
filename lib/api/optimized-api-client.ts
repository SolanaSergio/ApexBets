/**
 * Optimized API Client
 * Handles rate limiting, caching, and error recovery efficiently
 */

// import { errorHandlingService } from '../services/error-handling-service'

interface ApiRequest {
  url: string
  options?: RequestInit
  cacheKey?: string
  ttl?: number
  retries?: number
}

interface ApiResponse<T = any> {
  data: T
  cached: boolean
  timestamp: number
  source: string
}

class OptimizedApiClient {
  private cache = new Map<string, { data: any, timestamp: number, ttl: number }>()
  private rateLimiters = new Map<string, { count: number, resetTime: number }>()
  private requestQueue = new Map<string, Promise<any>>()

  // Clean up expired cache entries every 5 minutes
  constructor() {
    setInterval(() => this.cleanupCache(), 300000)
  }

  async request<T = any>(request: ApiRequest): Promise<ApiResponse<T>> {
    const { url, options = {}, cacheKey, ttl = 300000, retries = 3 } = request
    const key = cacheKey || url

    // Check cache first
    if (cacheKey) {
      const cached = this.cache.get(key)
      if (cached && Date.now() - cached.timestamp < cached.ttl) {
        return {
          data: cached.data,
          cached: true,
          timestamp: cached.timestamp,
          source: 'cache'
        }
      }
    }

    // Check if request is already in progress
    if (this.requestQueue.has(key)) {
      const result = await this.requestQueue.get(key)
      return {
        data: result,
        cached: false,
        timestamp: Date.now(),
        source: 'queue'
      }
    }

    // Create request promise
    const requestPromise = this.executeRequest<T>(url, options, retries)
    this.requestQueue.set(key, requestPromise)

    try {
      const data = await requestPromise
      
      // Cache the result
      if (cacheKey) {
        this.cache.set(key, {
          data,
          timestamp: Date.now(),
          ttl
        })
      }

      return {
        data,
        cached: false,
        timestamp: Date.now(),
        source: 'api'
      }
    } finally {
      this.requestQueue.delete(key)
    }
  }

  private async executeRequest<T>(url: string, options: RequestInit, retries: number): Promise<T> {
    const domain = new URL(url).hostname
    await this.rateLimit(domain)

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'User-Agent': 'ApexBets/1.0',
          'Accept': 'application/json',
          ...options.headers
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      return data
    } catch (error) {
      if (retries > 0) {
        // Exponential backoff
        const delay = Math.min(1000 * Math.pow(2, 3 - retries), 10000)
        await this.sleep(delay)
        return this.executeRequest<T>(url, options, retries - 1)
      }
      throw error
    }
  }

  private async rateLimit(domain: string): Promise<void> {
    const now = Date.now()
    const limiter = this.rateLimiters.get(domain) || { count: 0, resetTime: now + 60000 }
    
    if (now > limiter.resetTime) {
      limiter.count = 0
      limiter.resetTime = now + 60000
    }

    // Rate limit based on domain
    const maxRequests = this.getMaxRequests(domain)
    if (limiter.count >= maxRequests) {
      const waitTime = limiter.resetTime - now
      if (waitTime > 0) {
        await this.sleep(waitTime)
        limiter.count = 0
        limiter.resetTime = Date.now() + 60000
      }
    }

    limiter.count++
    this.rateLimiters.set(domain, limiter)
  }

  private getMaxRequests(domain: string): number {
    // Conservative rate limits based on domain
    if (domain.includes('api-sports')) return 8 // 8 requests per minute
    if (domain.includes('odds-api')) return 2 // 2 requests per minute
    if (domain.includes('thesportsdb')) return 30 // 30 requests per minute
    if (domain.includes('balldontlie')) return 10 // 10 requests per minute
    if (domain.includes('nba.com')) return 20 // 20 requests per minute
    if (domain.includes('nhl.com')) return 20 // 20 requests per minute
    if (domain.includes('mlb.com')) return 20 // 20 requests per minute
    return 10 // Default conservative limit
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  private cleanupCache(): void {
    const now = Date.now()
    for (const [key, entry] of this.cache) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key)
      }
    }
  }

  // Batch multiple requests efficiently
  async batchRequest<T = any>(requests: ApiRequest[]): Promise<ApiResponse<T>[]> {
    const results = await Promise.allSettled(
      requests.map(req => this.request<T>(req))
    )

    return results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value
      } else {
        console.error(`Batch request ${index} failed:`, result.reason)
        return {
          data: null as T,
          cached: false,
          timestamp: Date.now(),
          source: 'error'
        }
      }
    })
  }

  // Clear cache for specific key or all
  clearCache(key?: string): void {
    if (key) {
      this.cache.delete(key)
    } else {
      this.cache.clear()
    }
  }

  // Get cache statistics
  getCacheStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
      rateLimiters: Array.from(this.rateLimiters.entries())
    }
  }
}

export const optimizedApiClient = new OptimizedApiClient()
export type { ApiRequest, ApiResponse }
