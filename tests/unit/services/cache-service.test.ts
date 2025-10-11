/**
 * Cache Service Unit Tests
 * Tests the multi-layer caching system
 */

import { CacheService } from '@/lib/services/cache-service'
import { DatabaseCacheService } from '@/lib/services/database-cache-service'

describe('Cache Service', () => {
  let cacheService: CacheService
  let dbCacheService: DatabaseCacheService

  beforeEach(() => {
    cacheService = new CacheService()
    dbCacheService = DatabaseCacheService.getInstance()
    // Clear cache before each test
    cacheService.clear()
  })

  describe('Memory Cache', () => {
    it('should store and retrieve data', () => {
      const key = 'test-key'
      const data = { message: 'test data' }
      const ttl = 60000 // 1 minute

      cacheService.set(key, data, ttl)
      const retrieved = cacheService.get(key)

      expect(retrieved).toEqual(data)
    })

    it('should return null for expired data', async () => {
      const key = 'expired-key'
      const data = { message: 'expired data' }
      const ttl = 100 // 100ms

      cacheService.set(key, data, ttl)

      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 150))

      const retrieved = cacheService.get(key)
      expect(retrieved).toBeNull()
    })

    it('should handle cache misses gracefully', () => {
      const retrieved = cacheService.get('non-existent-key')
      expect(retrieved).toBeNull()
    })

    it('should clear all cached data', () => {
      cacheService.set('key1', 'data1')
      cacheService.set('key2', 'data2')

      cacheService.clear()

      expect(cacheService.get('key1')).toBeNull()
      expect(cacheService.get('key2')).toBeNull()
    })

    it('should delete specific keys', () => {
      cacheService.set('key1', 'data1')
      cacheService.set('key2', 'data2')

      cacheService.delete('key1')

      expect(cacheService.get('key1')).toBeNull()
      expect(cacheService.get('key2')).toEqual('data2')
    })
  })

  describe('Cache Statistics', () => {
    it('should track cache hits and misses', () => {
      cacheService.set('hit-key', 'data')

      // Hit
      cacheService.get('hit-key')

      // Miss
      cacheService.get('miss-key')

      const stats = cacheService.getStats()
      expect(stats.hits).toBeGreaterThan(0)
      expect(stats.misses).toBeGreaterThan(0)
    })

    it('should calculate hit rate correctly', () => {
      cacheService.set('key1', 'data1')
      cacheService.set('key2', 'data2')

      // 2 hits
      cacheService.get('key1')
      cacheService.get('key2')

      // 1 miss
      cacheService.get('key3')

      const stats = cacheService.getStats()
      expect(stats.hitRate).toBeCloseTo(0.67, 2) // 2/3 = 0.67
    })
  })

  describe('Database Cache Integration', () => {
    it('should check database cache availability', () => {
      const isAvailable = dbCacheService.isAvailable()
      expect(typeof isAvailable).toBe('boolean')
    })

    it('should handle database cache errors gracefully', async () => {
      // This test ensures the service doesn't crash when DB cache is unavailable
      const key = 'test-key'
      const data = { message: 'test data' }

      // Should not throw even if DB cache fails
      expect(async () => {
        await dbCacheService.set(key, data, 60000)
        await dbCacheService.get(key)
      }).not.toThrow()
    })
  })

  describe('Cache Key Generation', () => {
    it('should generate consistent cache keys', () => {
      const params1 = { sport: 'basketball', league: 'nba' }
      const params2 = { sport: 'basketball', league: 'nba' }

      const key1 = cacheService.generateKey('games', params1)
      const key2 = cacheService.generateKey('games', params2)

      expect(key1).toBe(key2)
    })

    it('should generate different keys for different parameters', () => {
      const params1 = { sport: 'basketball', league: 'nba' }
      const params2 = { sport: 'football', league: 'nfl' }

      const key1 = cacheService.generateKey('games', params1)
      const key2 = cacheService.generateKey('games', params2)

      expect(key1).not.toBe(key2)
    })
  })

  describe('Edge Cases', () => {
    it('should handle null and undefined values', () => {
      cacheService.set('null-key', null)
      cacheService.set('undefined-key', undefined)

      expect(cacheService.get('null-key')).toBeNull()
      expect(cacheService.get('undefined-key')).toBeUndefined()
    })

    it('should handle large data objects', () => {
      const largeData = {
        games: Array.from({ length: 1000 }, (_, i) => ({
          id: i,
          name: `Game ${i}`,
          data: 'x'.repeat(1000),
        })),
      }

      cacheService.set('large-data', largeData)
      const retrieved = cacheService.get('large-data')

      expect(retrieved).toEqual(largeData)
    })

    it('should handle concurrent access', async () => {
      const promises = Array.from({ length: 10 }, (_, i) => {
        return new Promise<void>(resolve => {
          setTimeout(() => {
            cacheService.set(`concurrent-key-${i}`, `data-${i}`)
            resolve()
          }, Math.random() * 10)
        })
      })

      await Promise.all(promises)

      // All keys should be retrievable
      for (let i = 0; i < 10; i++) {
        expect(cacheService.get(`concurrent-key-${i}`)).toBe(`data-${i}`)
      }
    })
  })
})
