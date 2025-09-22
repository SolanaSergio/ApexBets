/**
 * Database Cache Service
 * Provides caching functionality for database operations using Supabase
 */

// MCP-only approach - no direct Supabase client imports

interface CacheConfig {
  ttl: number
  maxSize: number
}

class DatabaseCacheService {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>()
  private config: CacheConfig
  private disabled = false
  private supabase: any = null

  constructor(config: CacheConfig = { ttl: 300000, maxSize: 1000 }) {
    this.config = config
    // Don't initialize Supabase in constructor - do it lazily
  }


  async set(key: string, data: any, ttl?: number): Promise<void> {
    if (this.disabled) return
    
    // Set in memory cache
    if (this.cache.size >= this.config.maxSize) {
      this.evictOldest()
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.config.ttl
    })

    // MCP-only approach - database operations handled by MCP services
    // Cache is stored in memory only for now
  }

  async get<T>(key: string): Promise<T | null> {
    if (this.disabled) return null
    
    // First check memory cache
    const entry = this.cache.get(key)
    if (entry && Date.now() - entry.timestamp <= entry.ttl) {
      return entry.data
    }

    // MCP-only approach - database operations handled by MCP services
    // Cache is stored in memory only for now

    return null
  }

  async delete(key: string): Promise<void> {
    this.cache.delete(key)
    
    // MCP-only approach - database operations handled by MCP services
    // Cache is stored in memory only for now
  }

  async clear(): Promise<void> {
    this.cache.clear()
    
    // MCP-only approach - database operations handled by MCP services
    // Cache is stored in memory only for now
  }

  async clearBySport(sport: string): Promise<void> {
    const keysToDelete: string[] = []
    for (const key of this.cache.keys()) {
      if (key.includes(`:${sport}:`)) {
        keysToDelete.push(key)
      }
    }
    keysToDelete.forEach(key => this.cache.delete(key))
    
    // MCP-only approach - database operations handled by MCP services
    // Cache is stored in memory only for now
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

  isAvailable(): boolean {
    return !this.disabled
  }

  reEnableCache(): void {
    this.disabled = false
    // Don't initialize here - will be done lazily
  }

  getStatus(): { available: boolean; disabled: boolean; supabaseConnected: boolean } {
    return {
      available: !this.disabled,
      disabled: this.disabled,
      supabaseConnected: this.supabase !== null
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
