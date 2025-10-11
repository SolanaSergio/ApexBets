/**
 * Unified Cache Service
 * Consolidates all caching functionality into a single, efficient system
 * Replaces multiple cache layers with one coordinated system
 */

interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
  priority: 'low' | 'medium' | 'high'
  sport?: string
  dataType?: string
}

interface CacheStats {
  totalEntries: number
  totalSize: number
  hitRate: number
  missRate: number
  evictions: number
}

export class UnifiedCacheService {
  private static instance: UnifiedCacheService
  private cache = new Map<string, CacheEntry<any>>()
  private stats = {
    hits: 0,
    misses: 0,
    evictions: 0,
  }
  private maxSize = 1000
  private cleanupInterval: NodeJS.Timeout | null = null

  public static getInstance(): UnifiedCacheService {
    if (!UnifiedCacheService.instance) {
      UnifiedCacheService.instance = new UnifiedCacheService()
    }
    return UnifiedCacheService.instance
  }

  constructor() {
    // Clean up expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => this.cleanup(), 300000)
  }

  /**
   * Get data from cache with deduplication support
   */
  async get<T>(key: string): Promise<T | null> {
    const entry = this.cache.get(key)

    if (!entry) {
      this.stats.misses++
      return null
    }

    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key)
      this.stats.misses++
      this.stats.evictions++
      return null
    }

    this.stats.hits++
    return entry.data
  }

  /**
   * Set data in cache with TTL and priority
   */
  async set<T>(
    key: string,
    data: T,
    ttl: number = 300000, // 5 minutes default
    options: {
      priority?: 'low' | 'medium' | 'high'
      sport?: string
      dataType?: string
    } = {}
  ): Promise<void> {
    // Evict if cache is full
    if (this.cache.size >= this.maxSize) {
      this.evictLRU()
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
      priority: options.priority || 'medium',
      ...(options.sport && { sport: options.sport }),
      ...(options.dataType && { dataType: options.dataType }),
    })
  }

  /**
   * Delete specific key
   */
  async delete(key: string): Promise<void> {
    this.cache.delete(key)
  }

  /**
   * Clear all cache entries
   */
  async clear(): Promise<void> {
    this.cache.clear()
    this.stats = { hits: 0, misses: 0, evictions: 0 }
  }

  /**
   * Clear cache entries by sport
   */
  async clearBySport(sport: string): Promise<void> {
    const keysToDelete: string[] = []
    for (const [key, entry] of this.cache.entries()) {
      if (entry.sport === sport) {
        keysToDelete.push(key)
      }
    }
    keysToDelete.forEach(key => this.cache.delete(key))
  }

  /**
   * Clear cache entries by data type
   */
  async clearByDataType(dataType: string): Promise<void> {
    const keysToDelete: string[] = []
    for (const [key, entry] of this.cache.entries()) {
      if (entry.dataType === dataType) {
        keysToDelete.push(key)
      }
    }
    keysToDelete.forEach(key => this.cache.delete(key))
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    const totalRequests = this.stats.hits + this.stats.misses
    return {
      totalEntries: this.cache.size,
      totalSize: this.calculateTotalSize(),
      hitRate: totalRequests > 0 ? this.stats.hits / totalRequests : 0,
      missRate: totalRequests > 0 ? this.stats.misses / totalRequests : 0,
      evictions: this.stats.evictions,
    }
  }

  /**
   * Check if cache is available
   */
  isAvailable(): boolean {
    return true
  }

  /**
   * Get cache status
   */
  getStatus(): { available: boolean; size: number; maxSize: number } {
    return {
      available: true,
      size: this.cache.size,
      maxSize: this.maxSize,
    }
  }

  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const now = Date.now()
    const keysToDelete: string[] = []

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        keysToDelete.push(key)
      }
    }

    keysToDelete.forEach(key => {
      this.cache.delete(key)
      this.stats.evictions++
    })
  }

  /**
   * Evict least recently used entry
   */
  private evictLRU(): void {
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
      this.stats.evictions++
    }
  }

  /**
   * Calculate total cache size in bytes
   */
  private calculateTotalSize(): number {
    let totalSize = 0
    for (const entry of this.cache.values()) {
      totalSize += JSON.stringify(entry.data).length
    }
    return totalSize
  }

  /**
   * Cleanup on destroy
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = null
    }
    this.cache.clear()
  }
}

// Export singleton instance
export const unifiedCacheService = UnifiedCacheService.getInstance()
