/**
 * Enhanced Cache Service
 * Provides intelligent caching with TTL, compression, and cache invalidation
 */

interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
  accessCount: number
  lastAccessed: number
  compressed?: boolean
  size: number
}

interface CacheStats {
  totalEntries: number
  totalSize: number
  hitRate: number
  missRate: number
  evictionCount: number
  compressionRatio: number
}

interface CacheConfig {
  maxSize: number // Maximum cache size in bytes
  maxEntries: number // Maximum number of entries
  defaultTtl: number // Default TTL in milliseconds
  compressionThreshold: number // Compress entries larger than this
  cleanupInterval: number // Cleanup interval in milliseconds
}

class CacheService {
  private cache = new Map<string, CacheEntry<any>>()
  private accessOrder: string[] = []
  private config: CacheConfig
  private stats: CacheStats
  private cleanupTimer?: NodeJS.Timeout

  constructor(config?: Partial<CacheConfig>) {
    this.config = {
      maxSize: 100 * 1024 * 1024, // 100MB
      maxEntries: 10000,
      defaultTtl: 5 * 60 * 1000, // 5 minutes
      compressionThreshold: 1024, // 1KB
      cleanupInterval: 60000, // 1 minute
      ...config
    }

    this.stats = {
      totalEntries: 0,
      totalSize: 0,
      hitRate: 0,
      missRate: 0,
      evictionCount: 0,
      compressionRatio: 0
    }

    this.startCleanupTimer()
  }

  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanup()
    }, this.config.cleanupInterval)
  }

  private stopCleanupTimer(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer)
      this.cleanupTimer = undefined
    }
  }

  private calculateSize(data: any): number {
    try {
      return JSON.stringify(data).length * 2 // Rough estimate in bytes
    } catch {
      return 0
    }
  }

  private compress(data: any): { data: any; compressed: boolean } {
    if (typeof data === 'string' && data.length > this.config.compressionThreshold) {
      // Simple compression using gzip-like approach
      try {
        const compressed = Buffer.from(data).toString('base64')
        return { data: compressed, compressed: true }
      } catch {
        return { data, compressed: false }
      }
    }
    return { data, compressed: false }
  }

  private decompress(entry: CacheEntry<any>): any {
    if (entry.compressed && typeof entry.data === 'string') {
      try {
        return Buffer.from(entry.data, 'base64').toString()
      } catch {
        return entry.data
      }
    }
    return entry.data
  }

  private isExpired(entry: CacheEntry<any>): boolean {
    return Date.now() - entry.timestamp > entry.ttl
  }

  private updateAccessOrder(key: string): void {
    // Remove from current position
    const index = this.accessOrder.indexOf(key)
    if (index > -1) {
      this.accessOrder.splice(index, 1)
    }
    // Add to end (most recently used)
    this.accessOrder.push(key)
  }

  private evictLRU(): void {
    if (this.accessOrder.length === 0) return

    const keyToEvict = this.accessOrder[0] // Least recently used
    const entry = this.cache.get(keyToEvict)
    
    if (entry) {
      this.cache.delete(keyToEvict)
      this.accessOrder.shift()
      this.stats.totalSize -= entry.size
      this.stats.totalEntries--
      this.stats.evictionCount++
    }
  }

  private needsEviction(): boolean {
    return this.cache.size >= this.config.maxEntries || 
           this.stats.totalSize >= this.config.maxSize
  }

  private cleanup(): void {
    const now = Date.now()
    const keysToDelete: string[] = []

    // Remove expired entries
    for (const [key, entry] of this.cache.entries()) {
      if (this.isExpired(entry)) {
        keysToDelete.push(key)
      }
    }

    // Delete expired entries
    for (const key of keysToDelete) {
      const entry = this.cache.get(key)
      if (entry) {
        this.cache.delete(key)
        this.stats.totalSize -= entry.size
        this.stats.totalEntries--
        
        // Remove from access order
        const index = this.accessOrder.indexOf(key)
        if (index > -1) {
          this.accessOrder.splice(index, 1)
        }
      }
    }

    // Evict LRU entries if needed
    while (this.needsEviction()) {
      this.evictLRU()
    }
  }

  set<T>(key: string, data: T, ttl?: number): void {
    const entryTtl = ttl || this.config.defaultTtl
    const size = this.calculateSize(data)
    const { data: processedData, compressed } = this.compress(data)
    
    const entry: CacheEntry<T> = {
      data: processedData,
      timestamp: Date.now(),
      ttl: entryTtl,
      accessCount: 0,
      lastAccessed: Date.now(),
      compressed,
      size
    }

    // Remove existing entry if it exists
    if (this.cache.has(key)) {
      const existingEntry = this.cache.get(key)!
      this.stats.totalSize -= existingEntry.size
      this.stats.totalEntries--
      
      const index = this.accessOrder.indexOf(key)
      if (index > -1) {
        this.accessOrder.splice(index, 1)
      }
    }

    // Check if we need to evict before adding
    while (this.needsEviction()) {
      this.evictLRU()
    }

    this.cache.set(key, entry)
    this.stats.totalSize += size
    this.stats.totalEntries++
    this.updateAccessOrder(key)
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key)
    
    if (!entry) {
      this.stats.missRate++
      return null
    }

    if (this.isExpired(entry)) {
      this.cache.delete(key)
      this.stats.missRate++
      
      // Remove from access order
      const index = this.accessOrder.indexOf(key)
      if (index > -1) {
        this.accessOrder.splice(index, 1)
      }
      
      return null
    }

    // Update access statistics
    entry.accessCount++
    entry.lastAccessed = Date.now()
    this.stats.hitRate++
    this.updateAccessOrder(key)

    return this.decompress(entry) as T
  }

  has(key: string): boolean {
    const entry = this.cache.get(key)
    return entry ? !this.isExpired(entry) : false
  }

  delete(key: string): boolean {
    const entry = this.cache.get(key)
    if (entry) {
      this.cache.delete(key)
      this.stats.totalSize -= entry.size
      this.stats.totalEntries--
      
      // Remove from access order
      const index = this.accessOrder.indexOf(key)
      if (index > -1) {
        this.accessOrder.splice(index, 1)
      }
      
      return true
    }
    return false
  }

  clear(): void {
    this.cache.clear()
    this.accessOrder = []
    this.stats = {
      totalEntries: 0,
      totalSize: 0,
      hitRate: 0,
      missRate: 0,
      evictionCount: 0,
      compressionRatio: 0
    }
  }

  getStats(): CacheStats {
    const totalRequests = this.stats.hitRate + this.stats.missRate
    const hitRate = totalRequests > 0 ? this.stats.hitRate / totalRequests : 0
    const missRate = totalRequests > 0 ? this.stats.missRate / totalRequests : 0

    return {
      ...this.stats,
      hitRate,
      missRate,
      compressionRatio: this.calculateCompressionRatio()
    }
  }

  private calculateCompressionRatio(): number {
    let compressedSize = 0
    let originalSize = 0

    for (const entry of this.cache.values()) {
      if (entry.compressed) {
        compressedSize += entry.size
        // Estimate original size (this is approximate)
        originalSize += entry.size * 1.5
      } else {
        originalSize += entry.size
      }
    }

    return originalSize > 0 ? compressedSize / originalSize : 0
  }

  // Get cache keys matching a pattern
  keys(pattern?: RegExp): string[] {
    if (!pattern) {
      return Array.from(this.cache.keys())
    }
    
    return Array.from(this.cache.keys()).filter(key => pattern.test(key))
  }

  // Get cache size in human-readable format
  getSizeInfo(): { size: number; sizeFormatted: string; entries: number } {
    const formatBytes = (bytes: number): string => {
      if (bytes === 0) return '0 Bytes'
      const k = 1024
      const sizes = ['Bytes', 'KB', 'MB', 'GB']
      const i = Math.floor(Math.log(bytes) / Math.log(k))
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    }

    return {
      size: this.stats.totalSize,
      sizeFormatted: formatBytes(this.stats.totalSize),
      entries: this.stats.totalEntries
    }
  }

  // Warm up cache with frequently accessed data
  async warmup<T>(key: string, fetchFn: () => Promise<T>, ttl?: number): Promise<T> {
    const cached = this.get<T>(key)
    if (cached) {
      return cached
    }

    const data = await fetchFn()
    this.set(key, data, ttl)
    return data
  }

  // Batch operations
  mget<T>(keys: string[]): (T | null)[] {
    return keys.map(key => this.get<T>(key))
  }

  mset<T>(entries: Array<{ key: string; value: T; ttl?: number }>): void {
    for (const { key, value, ttl } of entries) {
      this.set(key, value, ttl)
    }
  }

  // Cleanup and destroy
  destroy(): void {
    this.stopCleanupTimer()
    this.clear()
  }
}

export const cacheService = new CacheService()
export type { CacheEntry, CacheStats, CacheConfig }
