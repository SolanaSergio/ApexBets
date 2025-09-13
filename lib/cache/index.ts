/**
 * CACHE MANAGER
 * Unified cache interface that combines memory and database caching
 */

import { cacheService } from '@/lib/services/cache-service'
import { databaseCacheService } from '@/lib/services/database-cache-service'

export interface CacheManager {
  get<T>(key: string): T | null
  set<T>(key: string, data: T, ttl: number): void
  delete(key: string): boolean
  clear(): void
  has(key: string): boolean
  keys(pattern?: RegExp): string[]
  getStats(): any
}

class UnifiedCacheManager implements CacheManager {
  private memoryFirst: boolean = true

  constructor(memoryFirst: boolean = true) {
    this.memoryFirst = memoryFirst
  }

  get<T>(key: string): T | null {
    // Try memory cache first if enabled
    if (this.memoryFirst) {
      const memResult = cacheService.get<T>(key)
      if (memResult !== null) {
        return memResult
      }
    }

    // Try database cache if available
    if (databaseCacheService.isAvailable()) {
      // Note: This is async but we need sync interface
      // In practice, this should be handled by the calling code
      return null
    }

    return null
  }

  async getAsync<T>(key: string): Promise<T | null> {
    // Try memory cache first if enabled
    if (this.memoryFirst) {
      const memResult = cacheService.get<T>(key)
      if (memResult !== null) {
        return memResult
      }
    }

    // Try database cache if available
    if (databaseCacheService.isAvailable()) {
      try {
        return await databaseCacheService.get<T>(key)
      } catch (error) {
        console.warn('Database cache get error:', error)
      }
    }

    return null
  }

  set<T>(key: string, data: T, ttl: number): void {
    // Set in memory cache
    cacheService.set(key, data, ttl)

    // Set in database cache if available (async)
    if (databaseCacheService.isAvailable()) {
      // Extract data type from key pattern
      // const dataType = this.extractDataType(key)
      // const sport = this.extractSport(key)
      
      try {
        databaseCacheService.set(key, data, Math.floor(ttl / 1000))
      } catch (error) {
        console.warn('Database cache set error:', error)
      }
    }
  }

  delete(key: string): boolean {
    const memDeleted = cacheService.delete(key)
    
    // Delete from database cache if available (async)
    if (databaseCacheService.isAvailable()) {
      try {
        databaseCacheService.delete(key)
      } catch (error) {
        console.warn('Database cache delete error:', error)
      }
    }

    return memDeleted
  }

  clear(): void {
    cacheService.clear()
    
    // Clear database cache if available (async)
    if (databaseCacheService.isAvailable()) {
      try {
        databaseCacheService.clear()
      } catch (error) {
        console.warn('Database cache clear error:', error)
      }
    }
  }

  has(key: string): boolean {
    return cacheService.has(key)
  }

  keys(pattern?: RegExp): string[] {
    return cacheService.keys(pattern)
  }

  getStats() {
    const memStats = cacheService.getStats()
    
    return {
      memory: memStats,
      database: databaseCacheService.getStatus(),
      totalEntries: memStats.totalEntries,
      totalSize: memStats.totalSize
    }
  }

  private extractDataType(key: string): string {
    // Extract data type from cache key pattern
    if (key.includes(':games:')) return 'games'
    if (key.includes(':teams:')) return 'teams'
    if (key.includes(':players:')) return 'players'
    if (key.includes(':odds:')) return 'odds'
    if (key.includes(':standings:')) return 'standings'
    if (key.includes(':analytics:')) return 'analytics'
    return 'api_response'
  }

  private extractSport(key: string): string | undefined {
    // Extract sport from cache key pattern
    const match = key.match(/:([^:]+):/)
    return match ? match[1] : undefined
  }
}

export const cacheManager = new UnifiedCacheManager()
