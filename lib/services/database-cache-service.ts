/**
 * Database Cache Service
 * Provides caching functionality for database operations using Supabase
 */

// Production approach - no direct Supabase client imports

interface CacheConfig {
  ttl: number
  maxSize: number
}

interface CacheTTLConfig {
  liveGames: number      // 10-30 seconds
  upcomingGames: number  // 5 minutes
  historicalGames: number // 1 hour
  teams: number          // 1 day
  players: number         // 1 day
  standings: number       // 30 minutes
  odds: number           // 1 minute
  predictions: number    // 15 minutes
  default: number        // 5 minutes
}

class DatabaseCacheService {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>()
  private config: CacheConfig
  private disabled = false
  private supabase: any = null
  private ttlConfig: CacheTTLConfig

  constructor(config: CacheConfig = { ttl: 300000, maxSize: 1000 }) {
    this.config = config
    this.ttlConfig = {
      liveGames: 30000,      // 30 seconds
      upcomingGames: 300000, // 5 minutes
      historicalGames: 3600000, // 1 hour
      teams: 86400000,       // 1 day
      players: 86400000,     // 1 day
      standings: 1800000,    // 30 minutes
      odds: 60000,           // 1 minute
      predictions: 900000,   // 15 minutes
      default: 300000        // 5 minutes
    }
    // Don't initialize Supabase in constructor - do it lazily
  }

  private getTTLForKey(key: string): number {
    // Determine TTL based on cache key patterns
    if (key.includes('live') || key.includes('status=live')) {
      return this.ttlConfig.liveGames
    }
    if (key.includes('upcoming') || key.includes('status=scheduled')) {
      return this.ttlConfig.upcomingGames
    }
    if (key.includes('historical') || key.includes('date_from') || key.includes('date_to')) {
      return this.ttlConfig.historicalGames
    }
    if (key.includes('teams')) {
      return this.ttlConfig.teams
    }
    if (key.includes('players')) {
      return this.ttlConfig.players
    }
    if (key.includes('standings')) {
      return this.ttlConfig.standings
    }
    if (key.includes('odds')) {
      return this.ttlConfig.odds
    }
    if (key.includes('predictions')) {
      return this.ttlConfig.predictions
    }
    return this.ttlConfig.default
  }


  async set(key: string, data: any, ttl?: number): Promise<void> {
    if (this.disabled) return
    
    // Use intelligent TTL if not provided
    const effectiveTTL = ttl || this.getTTLForKey(key)
    
    // Set in memory cache
    if (this.cache.size >= this.config.maxSize) {
      this.evictOldest()
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: effectiveTTL
    })

    // Production approach - database operations handled by database services
    // Cache is stored in memory only for now
  }

  async get<T>(key: string): Promise<T | null> {
    if (this.disabled) return null
    
    // First check memory cache
    const entry = this.cache.get(key)
    if (entry && Date.now() - entry.timestamp <= entry.ttl) {
      return entry.data
    }

    // Production approach - database operations handled by database services
    // Cache is stored in memory only for now

    return null
  }

  async delete(key: string): Promise<void> {
    this.cache.delete(key)
    
    // Production approach - database operations handled by database services
    // Cache is stored in memory only for now
  }

  async clear(): Promise<void> {
    this.cache.clear()
    
    // Production approach - database operations handled by database services
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
    
    // Production approach - database operations handled by database services
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
