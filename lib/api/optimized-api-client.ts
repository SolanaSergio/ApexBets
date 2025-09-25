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
  // Rate limiting is now handled by the centralized Enhanced Rate Limiter
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
      // Rate limiting is now handled by the centralized Enhanced Rate Limiter

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
      return data as T
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

  // Rate limiting is now handled by the centralized Enhanced Rate Limiter

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
      // Rate limiting is now handled by the centralized Enhanced Rate Limiter
    }
  }
}

export const optimizedApiClient = new OptimizedApiClient()
export type { ApiRequest, ApiResponse }
