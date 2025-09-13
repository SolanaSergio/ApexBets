/**
 * Unified Cache Manager
 * Consolidates all caching systems into a single, efficient manager
 * Prevents overlapping cache entries and implements proper request deduplication
 */

import { cacheManager } from '@/lib/cache'

export interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
  dataType: string
  sport?: string
}

export interface CacheStats {
  totalKeys: number
  hitRate: number
  memoryUsage: number
  lastCleanup: number
}

export class UnifiedCacheManager {
  private static instance: UnifiedCacheManager
  private pendingRequests = new Map<string, Promise<any>>()
  private requestCounts = new Map<string, number>()
  private hitCounts = new Map<string, number>()
  private lastCleanup = Date.now()
  
  // Cache TTL configurations (in milliseconds)
  private readonly cacheTTLs: Record<string, number> = {
    'live_games': 30000,     // 30 seconds for live games
    'scheduled_games': 300000, // 5 minutes for scheduled games
    'finished_games': 3600000, // 1 hour for finished games
    'teams': 1800000,        // 30 minutes for team data
    'players': 1800000,      // 30 minutes for player data
    'odds': 120000,          // 2 minutes for odds
    'predictions': 600000,   // 10 minutes for predictions
    'standings': 1800000,    // 30 minutes for standings
    'analytics': 900000,     // 15 minutes for analytics
    'health': 60000,         // 1 minute for health checks
    'api_response': 300000   // 5 minutes for general API responses
  }

  static getInstance(): UnifiedCacheManager {
    if (!UnifiedCacheManager.instance) {
      UnifiedCacheManager.instance = new UnifiedCacheManager()
    }
    return UnifiedCacheManager.instance
  }

  /**
   * Generate a unique cache key
   */
  private generateCacheKey(prefix: string, params: Record<string, any> = {}): string {
    const sortedParams = Object.keys(params)
      .sort()
      .map(key => `${key}:${this.sanitizeValue(params[key])}`)
      .join('|')
    return `unified:${prefix}:${sortedParams}`
  }

  private sanitizeValue(value: any): string {
    if (value === null || value === undefined) return 'null'
    if (typeof value === 'object') return JSON.stringify(value)
    return String(value).replace(/[:|]/g, '_')
  }

  /**
   * Get cache TTL for data type
   */
  private getCacheTTL(dataType: string): number {
    return this.cacheTTLs[dataType] || this.cacheTTLs['api_response']
  }

  /**
   * Get data with request deduplication
   */
  async get<T>(
    prefix: string,
    dataType: string,
    fetchFn: () => Promise<T>,
    params: Record<string, any> = {},
    sport?: string
  ): Promise<T> {
    const cacheKey = this.generateCacheKey(prefix, { ...params, sport })
    
    // Check if request is already pending (deduplication)
    if (this.pendingRequests.has(cacheKey)) {
      return this.pendingRequests.get(cacheKey)!
    }

    // Try to get from cache first
    const cached = await this.getFromCache<T>(cacheKey)
    if (cached !== null) {
      this.recordHit(cacheKey)
      return cached
    }

    // Create new request
    const request = this.executeRequest(cacheKey, dataType, fetchFn)
    this.pendingRequests.set(cacheKey, request)
    
    try {
      const result = await request
      this.recordRequest(cacheKey)
      return result
    } finally {
      this.pendingRequests.delete(cacheKey)
    }
  }

  /**
   * Execute request with proper error handling and caching
   */
  private async executeRequest<T>(
    cacheKey: string,
    dataType: string,
    fetchFn: () => Promise<T>
  ): Promise<T> {
    try {
      const data = await fetchFn()
      
      if (data !== null && data !== undefined) {
        await this.setToCache(cacheKey, data, dataType)
      }
      
      return data
    } catch (error) {
      console.warn(`Cache request failed for ${cacheKey}:`, error)
      throw error
    }
  }

  /**
   * Get from cache with expiration check
   */
  private async getFromCache<T>(cacheKey: string): Promise<T | null> {
    try {
      const entry = await cacheManager.get<CacheEntry<T>>(cacheKey)
      if (!entry) {
        return null
      }

      // Check if expired
      const now = Date.now()
      if (now - entry.timestamp > entry.ttl) {
        await cacheManager.delete(cacheKey)
        return null
      }

      return entry.data
    } catch (error) {
      console.warn(`Cache retrieval error for ${cacheKey}:`, error)
      return null
    }
  }

  /**
   * Set to cache with metadata
   */
  private async setToCache<T>(
    cacheKey: string,
    data: T,
    dataType: string
  ): Promise<void> {
    try {
      const entry: CacheEntry<T> = {
        data,
        timestamp: Date.now(),
        ttl: this.getCacheTTL(dataType),
        dataType
      }

      await cacheManager.set(cacheKey, entry, entry.ttl)
    } catch (error) {
      console.warn(`Cache storage error for ${cacheKey}:`, error)
    }
  }

  /**
   * Clear cache by pattern
   */
  async clearByPattern(pattern: string): Promise<void> {
    try {
      const keys = await this.getCacheKeys()
      const matchingKeys = keys.filter(key => key.includes(pattern))
      
      await Promise.all(
        matchingKeys.map(key => cacheManager.delete(key))
      )
      
      console.log(`Cleared ${matchingKeys.length} cache entries matching pattern: ${pattern}`)
    } catch (error) {
      console.warn(`Cache clear error for pattern ${pattern}:`, error)
    }
  }

  /**
   * Clear cache for specific sport
   */
  async clearSportCache(sport: string): Promise<void> {
    await this.clearByPattern(`sport:${sport}`)
  }

  /**
   * Clear all cache
   */
  async clearAll(): Promise<void> {
    try {
      await cacheManager.clear()
      this.pendingRequests.clear()
      this.requestCounts.clear()
      this.hitCounts.clear()
      console.log('All cache cleared')
    } catch (error) {
      console.warn('Cache clear all error:', error)
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<CacheStats> {
    try {
      const keys = await this.getCacheKeys()
      const totalRequests = Array.from(this.requestCounts.values()).reduce((sum, count) => sum + count, 0)
      const totalHits = Array.from(this.hitCounts.values()).reduce((sum, count) => sum + count, 0)
      
      return {
        totalKeys: keys.length,
        hitRate: totalRequests > 0 ? totalHits / totalRequests : 0,
        memoryUsage: this.estimateMemoryUsage(),
        lastCleanup: this.lastCleanup
      }
    } catch (error) {
      console.warn('Cache stats error:', error)
      return {
        totalKeys: 0,
        hitRate: 0,
        memoryUsage: 0,
        lastCleanup: this.lastCleanup
      }
    }
  }

  /**
   * Cleanup expired entries
   */
  async cleanup(): Promise<void> {
    try {
      const keys = await this.getCacheKeys()
      const now = Date.now()
      const expiredKeys: string[] = []

      for (const key of keys) {
        try {
          const entry = await cacheManager.get<CacheEntry<any>>(key)
          if (entry && now - entry.timestamp > entry.ttl) {
            expiredKeys.push(key)
          }
        } catch (error) {
          // If we can't read the entry, consider it expired
          expiredKeys.push(key)
        }
      }

      await Promise.all(
        expiredKeys.map(key => cacheManager.delete(key))
      )

      this.lastCleanup = now
      console.log(`Cleaned up ${expiredKeys.length} expired cache entries`)
    } catch (error) {
      console.warn('Cache cleanup error:', error)
    }
  }

  /**
   * Record cache hit
   */
  private recordHit(cacheKey: string): void {
    this.hitCounts.set(cacheKey, (this.hitCounts.get(cacheKey) || 0) + 1)
  }

  /**
   * Record cache request
   */
  private recordRequest(cacheKey: string): void {
    this.requestCounts.set(cacheKey, (this.requestCounts.get(cacheKey) || 0) + 1)
  }

  /**
   * Get all cache keys
   */
  private async getCacheKeys(): Promise<string[]> {
    try {
      // This would depend on the cache manager implementation
      // For now, return empty array as fallback
      return []
    } catch (error) {
      return []
    }
  }

  /**
   * Estimate memory usage
   */
  private estimateMemoryUsage(): number {
    // Rough estimation based on pending requests and counts
    return (this.pendingRequests.size + this.requestCounts.size + this.hitCounts.size) * 100
  }

  /**
   * Force refresh cache entry
   */
  async refresh<T>(
    prefix: string,
    dataType: string,
    fetchFn: () => Promise<T>,
    params: Record<string, any> = {},
    sport?: string
  ): Promise<T> {
    const cacheKey = this.generateCacheKey(prefix, { ...params, sport })
    
    // Remove from cache first
    try {
      await cacheManager.delete(cacheKey)
    } catch (error) {
      console.warn(`Cache delete error for ${cacheKey}:`, error)
    }
    
    // Fetch fresh data
    return this.get(prefix, dataType, fetchFn, params, sport)
  }
}

// Export singleton instance
export const unifiedCacheManager = UnifiedCacheManager.getInstance()