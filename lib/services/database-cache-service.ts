/**
 * Database Cache Service
 * Provides persistent caching using Supabase database
 * Reduces API calls and improves performance
 */

import { createClient } from '@/lib/supabase/client'

interface CacheEntry {
  id: string
  key: string
  data: any
  created_at: string
  expires_at: string
  access_count: number
  last_accessed: string
  data_type: string
  sport?: string
  size_bytes: number
  compressed: boolean
}

interface CacheStats {
  totalEntries: number
  totalSize: number
  hitRate: number
  missRate: number
  expiredEntries: number
  dataTypes: Record<string, number>
}

interface CacheConfig {
  defaultTtl: number // Default TTL in seconds
  maxEntries: number
  cleanupInterval: number // Cleanup interval in milliseconds
  compressionThreshold: number // Compress entries larger than this
}

export class DatabaseCacheService {
  private supabase: any = null
  private config: CacheConfig
  private stats: CacheStats
  private cleanupTimer?: NodeJS.Timeout
  private cacheDisabled: boolean = false

  constructor(config?: Partial<CacheConfig>) {
    this.config = {
      defaultTtl: 300, // 5 minutes
      maxEntries: 50000,
      cleanupInterval: 300000, // 5 minutes
      compressionThreshold: 1024, // 1KB
      ...config
    }

    this.stats = {
      totalEntries: 0,
      totalSize: 0,
      hitRate: 0,
      missRate: 0,
      expiredEntries: 0,
      dataTypes: {}
    }

    this.initializeSupabase()
    this.startCleanupTimer()
  }

  private initializeSupabase() {
    try {
      this.supabase = createClient()
      if (!this.supabase) {
        console.warn('Database cache service: Supabase not available, disabling database cache')
        this.cacheDisabled = true
      }
    } catch (error) {
      console.error('Failed to initialize database cache service:', error)
      this.cacheDisabled = true
    }
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

  isAvailable(): boolean {
    return !!(this.supabase && !this.cacheDisabled)
  }

  // Method to re-enable database cache (useful after fixing RLS policies)
  reEnableCache(): void {
    if (this.supabase) {
      this.cacheDisabled = false
      console.log('Database cache service re-enabled')
    } else {
      console.log('Cannot re-enable database cache - Supabase client not available')
    }
  }

  // Method to get current status
  getStatus(): { available: boolean; disabled: boolean; supabaseConnected: boolean } {
    return {
      available: this.isAvailable(),
      disabled: this.cacheDisabled,
      supabaseConnected: !!this.supabase
    }
  }

  private generateKey(prefix: string, params: Record<string, any>): string {
    const sortedParams = Object.keys(params)
      .sort()
      .map(key => `${key}:${params[key]}`)
      .join('|')
    return `${prefix}:${sortedParams}`
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
      try {
        const compressed = Buffer.from(data).toString('base64')
        return { data: compressed, compressed: true }
      } catch {
        return { data, compressed: false }
      }
    }
    return { data, compressed: false }
  }

  private decompress(data: any, compressed: boolean): any {
    if (compressed && typeof data === 'string') {
      try {
        return Buffer.from(data, 'base64').toString()
      } catch {
        return data
      }
    }
    return data
  }

  async set<T>(
    key: string, 
    data: T, 
    ttl?: number, 
    dataType: string = 'general',
    sport?: string
  ): Promise<void> {
    if (!this.supabase || this.cacheDisabled) {
      console.warn('Database cache service not available - Supabase client not initialized or cache disabled')
      return
    }

    try {
      const entryTtl = ttl || this.config.defaultTtl
      const expiresAt = new Date(Date.now() + entryTtl * 1000)
      const size = this.calculateSize(data)
      const { data: processedData, compressed } = this.compress(data)

      const cacheEntry: Omit<CacheEntry, 'id' | 'created_at' | 'last_accessed'> = {
        key,
        data: processedData,
        expires_at: expiresAt.toISOString(),
        access_count: 0,
        data_type: dataType,
        sport: sport || undefined,
        size_bytes: size,
        compressed
      }

      // Upsert the cache entry
      const { error } = await this.supabase
        .from('cache_entries')
        .upsert(cacheEntry, { 
          onConflict: 'key',
          ignoreDuplicates: false 
        })

      if (error) {
        if (error.code === 'PGRST301' || error.message?.includes('406') || error.status === 406) {
          console.warn('Cache table access denied (406 error). This may be due to RLS policies. Disabling database cache temporarily.')
          console.warn('Error details:', { code: error.code, message: error.message, status: error.status, details: error.details })
          this.cacheDisabled = true
        } else {
          console.error('Error setting cache entry:', error)
        }
      }
    } catch (error) {
      console.error('Error in database cache set:', error)
    }
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.supabase || this.cacheDisabled) {
      console.warn('Database cache service not available - Supabase client not initialized or cache disabled')
      return null
    }

    try {
      const { data, error } = await this.supabase
        .from('cache_entries')
        .select('*')
        .eq('key', key)
        .maybeSingle()

      if (error) {
        if (error.code === 'PGRST116') { // Not found error
          this.stats.missRate++
          return null
        } else if (error.code === 'PGRST301' || error.message?.includes('406') || error.status === 406) {
          // RLS policy error or Not Acceptable - table might not exist or no access
          console.warn('Cache table access denied (406 error). This may be due to RLS policies. Disabling database cache temporarily.')
          console.warn('Error details:', { code: error.code, message: error.message, status: error.status, details: error.details })
          this.cacheDisabled = true
          this.stats.missRate++
          return null
        } else {
          console.error('Error getting cache entry:', error)
          this.stats.missRate++
          return null
        }
      }

      // Check if data exists and is valid
      if (!data) {
        this.stats.missRate++
        return null
      }

      // Check if expired
      if (new Date(data.expires_at) < new Date()) {
        await this.delete(key)
        this.stats.missRate++
        this.stats.expiredEntries++
        return null
      }

      // Update access statistics
      await this.supabase
        .from('cache_entries')
        .update({
          access_count: data.access_count + 1,
          last_accessed: new Date().toISOString()
        })
        .eq('key', key)

      this.stats.hitRate++

      // Decompress data if needed
      const decompressedData = this.decompress(data.data, data.compressed)
      return decompressedData as T
    } catch (error) {
      console.error('Error in database cache get:', error)
      this.stats.missRate++
      return null
    }
  }

  async has(key: string): Promise<boolean> {
    if (!this.supabase) return false

    try {
      const { data, error } = await this.supabase
        .from('cache_entries')
        .select('expires_at')
        .eq('key', key)
        .maybeSingle()

      if (error) {
        console.error('Error checking cache entry:', error)
        return false
      }

      if (!data) return false

      return new Date(data.expires_at) > new Date()
    } catch (error) {
      console.error('Error checking cache entry:', error)
      return false
    }
  }

  async delete(key: string): Promise<boolean> {
    if (!this.supabase) return false

    try {
      const { error } = await this.supabase
        .from('cache_entries')
        .delete()
        .eq('key', key)

      if (error) {
        console.error('Error deleting cache entry:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error in database cache delete:', error)
      return false
    }
  }

  async clear(): Promise<void> {
    if (!this.supabase) return

    try {
      const { error } = await this.supabase
        .from('cache_entries')
        .delete()
        .neq('id', 0) // Delete all entries

      if (error) {
        console.error('Error clearing cache:', error)
      }
    } catch (error) {
      console.error('Error in database cache clear:', error)
    }
  }

  async clearByType(dataType: string): Promise<void> {
    if (!this.supabase) return

    try {
      const { error } = await this.supabase
        .from('cache_entries')
        .delete()
        .eq('data_type', dataType)

      if (error) {
        console.error('Error clearing cache by type:', error)
      }
    } catch (error) {
      console.error('Error in database cache clear by type:', error)
    }
  }

  async clearBySport(sport: string): Promise<void> {
    if (!this.supabase) return

    try {
      const { error } = await this.supabase
        .from('cache_entries')
        .delete()
        .eq('sport', sport)

      if (error) {
        console.error('Error clearing cache by sport:', error)
      }
    } catch (error) {
      console.error('Error in database cache clear by sport:', error)
    }
  }

  private async cleanup(): Promise<void> {
    if (!this.supabase) return

    try {
      // Delete expired entries
      const { error: expiredError } = await this.supabase
        .from('cache_entries')
        .delete()
        .lt('expires_at', new Date().toISOString())

      if (expiredError) {
        console.error('Error cleaning up expired entries:', expiredError)
      }

      // Get current stats
      const { data: statsData, error: statsError } = await this.supabase
        .from('cache_entries')
        .select('data_type, size_bytes')

      if (!statsError && statsData) {
        this.stats.totalEntries = statsData.length
        this.stats.totalSize = statsData.reduce((sum: number, entry: any) => sum + entry.size_bytes, 0)
        
        // Count data types
        this.stats.dataTypes = {}
        statsData.forEach((entry: any) => {
          this.stats.dataTypes[entry.data_type] = (this.stats.dataTypes[entry.data_type] || 0) + 1
        })
      }

      // If we have too many entries, delete oldest ones
      if (this.stats.totalEntries > this.config.maxEntries) {
        const entriesToDelete = this.stats.totalEntries - this.config.maxEntries
        
        const { error: deleteError } = await this.supabase
          .from('cache_entries')
          .delete()
          .order('last_accessed', { ascending: true })
          .limit(entriesToDelete)

        if (deleteError) {
          console.error('Error cleaning up excess entries:', deleteError)
        }
      }
    } catch (error) {
      console.error('Error in cache cleanup:', error)
    }
  }

  async getStats(): Promise<CacheStats> {
    if (!this.supabase) {
      return this.stats
    }

    try {
      const { data, error } = await this.supabase
        .from('cache_entries')
        .select('data_type, size_bytes, access_count')

      if (!error && data) {
        this.stats.totalEntries = data.length
        this.stats.totalSize = data.reduce((sum: number, entry: any) => sum + entry.size_bytes, 0)
        
        // Count data types
        this.stats.dataTypes = {}
        data.forEach((entry: any) => {
          this.stats.dataTypes[entry.data_type] = (this.stats.dataTypes[entry.data_type] || 0) + 1
        })

        // Calculate hit rate
        const totalRequests = this.stats.hitRate + this.stats.missRate
        if (totalRequests > 0) {
          this.stats.hitRate = this.stats.hitRate / totalRequests
          this.stats.missRate = this.stats.missRate / totalRequests
        }
      }
    } catch (error) {
      console.error('Error getting cache stats:', error)
    }

    return this.stats
  }

  // Convenience methods for common cache patterns
  async cacheApiResponse<T>(
    endpoint: string,
    params: Record<string, any>,
    data: T,
    ttl?: number,
    sport?: string
  ): Promise<void> {
    const key = this.generateKey(`api:${endpoint}`, params)
    await this.set(key, data, ttl, 'api_response', sport)
  }

  async getCachedApiResponse<T>(
    endpoint: string,
    params: Record<string, any>
  ): Promise<T | null> {
    const key = this.generateKey(`api:${endpoint}`, params)
    return await this.get<T>(key)
  }

  async cacheGameData<T>(
    sport: string,
    gameId: string,
    data: T,
    ttl?: number
  ): Promise<void> {
    const key = this.generateKey(`game:${sport}`, { gameId })
    await this.set(key, data, ttl, 'game_data', sport)
  }

  async getCachedGameData<T>(
    sport: string,
    gameId: string
  ): Promise<T | null> {
    const key = this.generateKey(`game:${sport}`, { gameId })
    return await this.get<T>(key)
  }

  async cacheTeamData<T>(
    sport: string,
    teamId: string,
    data: T,
    ttl?: number
  ): Promise<void> {
    const key = this.generateKey(`team:${sport}`, { teamId })
    await this.set(key, data, ttl, 'team_data', sport)
  }

  async getCachedTeamData<T>(
    sport: string,
    teamId: string
  ): Promise<T | null> {
    const key = this.generateKey(`team:${sport}`, { teamId })
    return await this.get<T>(key)
  }

  async cachePlayerData<T>(
    sport: string,
    playerId: string,
    data: T,
    ttl?: number
  ): Promise<void> {
    const key = this.generateKey(`player:${sport}`, { playerId })
    await this.set(key, data, ttl, 'player_data', sport)
  }

  async getCachedPlayerData<T>(
    sport: string,
    playerId: string
  ): Promise<T | null> {
    const key = this.generateKey(`player:${sport}`, { playerId })
    return await this.get<T>(key)
  }

  // Warm up cache with frequently accessed data
  async warmup<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttl?: number,
    dataType: string = 'general',
    sport?: string
  ): Promise<T> {
    const cached = await this.get<T>(key)
    if (cached) {
      return cached
    }

    const data = await fetchFn()
    await this.set(key, data, ttl, dataType, sport)
    return data
  }

  // Batch operations
  async mget<T>(keys: string[]): Promise<(T | null)[]> {
    const results = await Promise.all(keys.map(key => this.get<T>(key)))
    return results
  }

  async mset<T>(
    entries: Array<{ key: string; value: T; ttl?: number; dataType?: string; sport?: string }>
  ): Promise<void> {
    await Promise.all(
      entries.map(({ key, value, ttl, dataType, sport }) =>
        this.set(key, value, ttl, dataType, sport)
      )
    )
  }

  // Cleanup and destroy
  destroy(): void {
    this.stopCleanupTimer()
  }
}

export const databaseCacheService = new DatabaseCacheService()
export type { CacheEntry, CacheStats, CacheConfig }
