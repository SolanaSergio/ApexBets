/**
 * Advanced Caching Service
 * Intelligent caching with TTL, compression, and sport-specific strategies
 */

interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
  compressed?: boolean
  sport?: string
  priority: 'low' | 'medium' | 'high'
}

interface CacheStats {
  hits: number
  misses: number
  size: number
  lastCleanup: number
}

export class AdvancedCacheService {
  private cache = new Map<string, CacheEntry<any>>()
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    size: 0,
    lastCleanup: Date.now()
  }
  private maxSize = 1000 // Maximum number of cache entries
  private cleanupInterval = 5 * 60 * 1000 // 5 minutes

  constructor() {
    // Start periodic cleanup
    setInterval(() => this.cleanup(), this.cleanupInterval)
  }

  /**
   * Get data from cache with intelligent TTL handling
   */
  get<T>(key: string, sport?: string): T | null {
    const entry = this.cache.get(key)
    
    if (!entry) {
      this.stats.misses++
      return null
    }

    // Check if entry has expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key)
      this.stats.misses++
      return null
    }

    // Sport-specific cache validation
    if (sport && entry.sport && entry.sport !== sport) {
      this.stats.misses++
      return null
    }

    this.stats.hits++
    return entry.compressed ? this.decompress(entry.data) : entry.data
  }

  /**
   * Set data in cache with intelligent TTL and compression
   */
  set<T>(
    key: string, 
    data: T, 
    options: {
      ttl?: number
      sport?: string
      priority?: 'low' | 'medium' | 'high'
      compress?: boolean
    } = {}
  ): void {
    const {
      ttl = this.getDefaultTTL(key),
      sport,
      priority = 'medium',
      compress = this.shouldCompress(data)
    } = options

    // Ensure we don't exceed max size
    if (this.cache.size >= this.maxSize) {
      this.evictLRU()
    }

    const entry: CacheEntry<T> = {
      data: compress ? this.compress(data) : data,
      timestamp: Date.now(),
      ttl,
      compressed: compress,
      priority
    }
    
    if (sport !== undefined) {
      entry.sport = sport
    }

    this.cache.set(key, entry)
    this.stats.size = this.cache.size
  }

  /**
   * Get or set pattern - fetch data if not in cache
   */
  async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    options: {
      ttl?: number
      sport?: string
      priority?: 'low' | 'medium' | 'high'
    } = {}
  ): Promise<T> {
    const cached = this.get<T>(key, options.sport)
    
    if (cached !== null) {
      return cached
    }

    try {
      const data = await fetcher()
      this.set(key, data, options)
      return data
    } catch (error) {
      console.error(`Failed to fetch data for key ${key}:`, error)
      throw error
    }
  }

  /**
   * Invalidate cache entries by pattern
   */
  invalidatePattern(pattern: string): void {
    const regex = new RegExp(pattern)
    const keysToDelete: string[] = []

    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        keysToDelete.push(key)
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key))
    this.stats.size = this.cache.size
  }

  /**
   * Invalidate all cache entries for a specific sport
   */
  invalidateSport(sport: string): void {
    const keysToDelete: string[] = []

    for (const [key, entry] of this.cache.entries()) {
      if (entry.sport === sport) {
        keysToDelete.push(key)
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key))
    this.stats.size = this.cache.size
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats & { hitRate: number } {
    const total = this.stats.hits + this.stats.misses
    const hitRate = total > 0 ? (this.stats.hits / total) * 100 : 0

    return {
      ...this.stats,
      hitRate: Math.round(hitRate * 100) / 100
    }
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear()
    this.stats = {
      hits: 0,
      misses: 0,
      size: 0,
      lastCleanup: Date.now()
    }
  }

  /**
   * Private helper methods
   */
  private getDefaultTTL(key: string): number {
    // Intelligent TTL based on data type
    if (key.includes('live') || key.includes('score')) {
      return 30 * 1000 // 30 seconds for live data
    }
    if (key.includes('odds')) {
      return 2 * 60 * 1000 // 2 minutes for odds
    }
    if (key.includes('standings') || key.includes('teams')) {
      return 5 * 60 * 1000 // 5 minutes for standings/teams
    }
    if (key.includes('players') || key.includes('stats')) {
      return 15 * 60 * 1000 // 15 minutes for player stats
    }
    return 10 * 60 * 1000 // 10 minutes default
  }

  private shouldCompress(data: any): boolean {
    // Compress large objects or arrays
    const serialized = JSON.stringify(data)
    return serialized.length > 10000 // 10KB threshold
  }

  private compress(data: any): any {
    // Simple compression - in production, use a proper compression library
    return JSON.stringify(data)
  }

  private decompress(data: any): any {
    // Simple decompression
    return typeof data === 'string' ? JSON.parse(data) : data
  }

  private evictLRU(): void {
    // Evict least recently used entries based on priority
    const entries = Array.from(this.cache.entries())
    
    // Sort by priority (low first) then by timestamp (oldest first)
    entries.sort((a, b) => {
      const priorityOrder = { low: 0, medium: 1, high: 2 }
      const priorityDiff = priorityOrder[a[1].priority] - priorityOrder[b[1].priority]
      
      if (priorityDiff !== 0) return priorityDiff
      return a[1].timestamp - b[1].timestamp
    })

    // Remove 10% of entries
    const toRemove = Math.max(1, Math.floor(entries.length * 0.1))
    
    for (let i = 0; i < toRemove; i++) {
      this.cache.delete(entries[i][0])
    }

    this.stats.size = this.cache.size
  }

  private cleanup(): void {
    const now = Date.now()
    const keysToDelete: string[] = []

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        keysToDelete.push(key)
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key))
    this.stats.size = this.cache.size
    this.stats.lastCleanup = now
  }
}

// Singleton instance
export const advancedCache = new AdvancedCacheService()
