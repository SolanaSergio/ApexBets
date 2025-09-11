/**
 * MEMORY CACHE SERVICE
 * In-memory cache implementation with TTL support
 */

interface CacheEntry<T> {
  data: T
  expires: number
  createdAt: number
}

export class CacheService {
  private cache: Map<string, CacheEntry<any>> = new Map()
  private stats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
    totalEntries: 0,
    totalSize: 0
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key)
    
    if (!entry) {
      this.stats.misses++
      return null
    }

    // Check if expired
    if (Date.now() > entry.expires) {
      this.cache.delete(key)
      this.stats.misses++
      this.stats.totalEntries--
      return null
    }

    this.stats.hits++
    return entry.data as T
  }

  set<T>(key: string, data: T, ttlMs: number): void {
    const now = Date.now()
    const expires = now + ttlMs

    // Remove existing entry if it exists
    if (this.cache.has(key)) {
      this.cache.delete(key)
      this.stats.totalEntries--
    }

    this.cache.set(key, {
      data,
      expires,
      createdAt: now
    })

    this.stats.sets++
    this.stats.totalEntries++
    this.stats.totalSize += this.calculateSize(data)
  }

  delete(key: string): boolean {
    const existed = this.cache.delete(key)
    if (existed) {
      this.stats.deletes++
      this.stats.totalEntries--
    }
    return existed
  }

  clear(): void {
    this.cache.clear()
    this.stats.totalEntries = 0
    this.stats.totalSize = 0
  }

  keys(pattern?: RegExp): string[] {
    const allKeys = Array.from(this.cache.keys())
    
    if (!pattern) {
      return allKeys
    }

    return allKeys.filter(key => pattern.test(key))
  }

  has(key: string): boolean {
    const entry = this.cache.get(key)
    if (!entry) return false

    // Check if expired
    if (Date.now() > entry.expires) {
      this.cache.delete(key)
      this.stats.totalEntries--
      return false
    }

    return true
  }

  getStats() {
    return {
      ...this.stats,
      hitRate: this.stats.hits + this.stats.misses > 0 
        ? (this.stats.hits / (this.stats.hits + this.stats.misses)) * 100 
        : 0
    }
  }

  private calculateSize(data: any): number {
    try {
      return JSON.stringify(data).length
    } catch {
      return 0
    }
  }

  // Clean up expired entries
  cleanup(): void {
    const now = Date.now()
    let cleaned = 0

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expires) {
        this.cache.delete(key)
        cleaned++
      }
    }

    this.stats.totalEntries -= cleaned
  }
}

export const cacheService = new CacheService()

// Cleanup expired entries every 5 minutes
setInterval(() => {
  cacheService.cleanup()
}, 5 * 60 * 1000)
