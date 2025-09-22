/**
 * Database Cache Service
 * Provides caching functionality for database operations using Supabase
 */

import { createClient } from '../supabase/server'

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

  private async initializeSupabase() {
    if (this.supabase) {
      return this.supabase
    }
    
    try {
      this.supabase = await createClient()
      return this.supabase
    } catch (error) {
      console.warn('Failed to initialize Supabase for database cache:', error)
      this.disabled = true
      return null
    }
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

    // Also store in database if available
    const supabase = await this.initializeSupabase()
    if (supabase) {
      try {
        await supabase
          .from('cache_entries')
          .upsert({
            key,
            data: JSON.stringify(data),
            ttl: ttl || this.config.ttl,
            created_at: new Date().toISOString(),
            expires_at: new Date(Date.now() + (ttl || this.config.ttl)).toISOString()
          })
      } catch (error) {
        console.warn('Failed to store in database cache:', error)
      }
    }
  }

  async get<T>(key: string): Promise<T | null> {
    if (this.disabled) return null
    
    // First check memory cache
    const entry = this.cache.get(key)
    if (entry && Date.now() - entry.timestamp <= entry.ttl) {
      return entry.data
    }

    // If not in memory or expired, check database
    const supabase = await this.initializeSupabase()
    if (supabase) {
      try {
        const { data: dbEntry, error } = await supabase
          .from('cache_entries')
          .select('*')
          .eq('key', key)
          .gt('expires_at', new Date().toISOString())
          .single()

        if (!error && dbEntry) {
          try {
            const parsedData = JSON.parse(dbEntry.data)
            // Store back in memory cache
            this.cache.set(key, {
              data: parsedData,
              timestamp: Date.now(),
              ttl: dbEntry.ttl
            })
            return parsedData
          } catch (parseError) {
            console.warn(`Failed to parse cached data for key ${key}:`, parseError)
            // Delete corrupted cache entry
            await this.delete(key)
            return null
          }
        }
      } catch (error) {
        console.warn('Failed to get from database cache:', error)
      }
    }

    return null
  }

  async delete(key: string): Promise<void> {
    this.cache.delete(key)
    
    const supabase = await this.initializeSupabase()
    if (supabase) {
      try {
        await supabase
          .from('cache_entries')
          .delete()
          .eq('key', key)
      } catch (error) {
        console.warn('Failed to delete from database cache:', error)
      }
    }
  }

  async clear(): Promise<void> {
    this.cache.clear()
    
    const supabase = await this.initializeSupabase()
    if (supabase) {
      try {
        await supabase
          .from('cache_entries')
          .delete()
          .neq('key', '') // Delete all entries
      } catch (error) {
        console.warn('Failed to clear database cache:', error)
      }
    }
  }

  async clearBySport(sport: string): Promise<void> {
    const keysToDelete: string[] = []
    for (const key of this.cache.keys()) {
      if (key.includes(`:${sport}:`)) {
        keysToDelete.push(key)
      }
    }
    keysToDelete.forEach(key => this.cache.delete(key))
    
    const supabase = await this.initializeSupabase()
    if (supabase) {
      try {
        await supabase
          .from('cache_entries')
          .delete()
          .like('key', `%:${sport}:%`)
      } catch (error) {
        console.warn('Failed to clear sport cache from database:', error)
      }
    }
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
