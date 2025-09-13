/**
 * Database Cache Service
 * Provides caching functionality for database operations
 */

interface CacheConfig {
  ttl: number
  maxSize: number
}

class DatabaseCacheService {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>()
  private config: CacheConfig

  constructor(config: CacheConfig = { ttl: 300000, maxSize: 1000 }) {
    this.config = config
  }

  set(key: string, data: any, ttl?: number): void {
    if (this.cache.size >= this.config.maxSize) {
      this.evictOldest()
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.config.ttl
    })
  }

  get(key: string): any | null {
    const entry = this.cache.get(key)
    if (!entry) return null

    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key)
      return null
    }

    return entry.data
  }

  delete(key: string): void {
    this.cache.delete(key)
  }

  clear(): void {
    this.cache.clear()
  }

  clearBySport(sport: string): void {
    const keysToDelete: string[] = []
    for (const key of this.cache.keys()) {
      if (key.includes(`:${sport}:`)) {
        keysToDelete.push(key)
      }
    }
    keysToDelete.forEach(key => this.cache.delete(key))
  }

  getStats(): { totalEntries: number; totalSize: number } {
    let totalSize = 0
    for (const entry of this.cache.values()) {
      totalSize += JSON.stringify(entry.data).length
    }
    
    return {
      totalEntries: this.cache.size,
      totalSize
    }
  }

  private evictOldest(): void {
    let oldestKey = ''
    let oldestTime = Date.now()

    for (const [key, entry] of this.cache.entries()) {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp
        oldestKey = key
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey)
    }
  }
}

export const databaseCacheService = new DatabaseCacheService()
