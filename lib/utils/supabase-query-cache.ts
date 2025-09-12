/**
 * Supabase Query Cache Utility
 * Provides caching functionality for Supabase queries
 */

interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
}

class SupabaseQueryCache {
  private cache = new Map<string, CacheEntry<any>>()
  private defaultTTL = 5 * 60 * 1000 // 5 minutes

  set<T>(key: string, data: T, ttl?: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL
    })
  }

  get<T>(key: string): T | null {
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

  has(key: string): boolean {
    const entry = this.cache.get(key)
    if (!entry) return false

    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key)
      return false
    }

    return true
  }
}

export const supabaseQueryCache = new SupabaseQueryCache()

// Cached Supabase query function
export async function cachedSupabaseQuery<T>(
  key: string,
  queryFn: () => Promise<T>,
  ttl?: number
): Promise<T> {
  const cached = supabaseQueryCache.get<T>(key)
  if (cached) {
    return cached
  }

  const result = await queryFn()
  supabaseQueryCache.set(key, result, ttl)
  return result
}
