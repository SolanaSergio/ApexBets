/**
 * Real Integration Tests for Cache Service
 * Tests actual cache functionality with real data
 */

import { cacheService } from '@/lib/services/cache-service'

describe('Cache Service Integration Tests', () => {
  beforeEach(() => {
    // Clear cache before each test
    cacheService.clear()
  })

  describe('basic cache operations', () => {
    it('should store and retrieve data', () => {
      const key = 'test-key'
      const value = { message: 'Hello World', number: 42 }
      const ttl = 60000 // 1 minute

      cacheService.set(key, value, ttl)
      const retrieved = cacheService.get(key)

      expect(retrieved).toEqual(value)
    })

    it('should return undefined for non-existent key', () => {
      const retrieved = cacheService.get('non-existent-key')
      expect(retrieved).toBeUndefined()
    })

    it('should handle different data types', () => {
      const stringValue = 'test string'
      const numberValue = 123
      const booleanValue = true
      const arrayValue = [1, 2, 3]
      const objectValue = { key: 'value' }

      cacheService.set('string', stringValue, 60000)
      cacheService.set('number', numberValue, 60000)
      cacheService.set('boolean', booleanValue, 60000)
      cacheService.set('array', arrayValue, 60000)
      cacheService.set('object', objectValue, 60000)

      expect(cacheService.get('string')).toBe(stringValue)
      expect(cacheService.get('number')).toBe(numberValue)
      expect(cacheService.get('boolean')).toBe(booleanValue)
      expect(cacheService.get('array')).toEqual(arrayValue)
      expect(cacheService.get('object')).toEqual(objectValue)
    })

    it('should handle large objects', () => {
      const largeObject = {
        data: Array.from({ length: 1000 }, (_, i) => ({
          id: i,
          name: `Item ${i}`,
          value: Math.random()
        }))
      }

      cacheService.set('large-object', largeObject, 60000)
      const retrieved = cacheService.get('large-object')

      expect(retrieved).toEqual(largeObject)
      expect(retrieved.data).toHaveLength(1000)
    })
  })

  describe('TTL (Time To Live) functionality', () => {
    it('should expire data after TTL', async () => {
      const key = 'expiry-test'
      const value = 'test value'
      const ttl = 100 // 100ms

      cacheService.set(key, value, ttl)
      
      // Should be available immediately
      expect(cacheService.get(key)).toBe(value)
      
      // Wait for expiry
      await new Promise(resolve => setTimeout(resolve, 150))
      
      // Should be expired
      expect(cacheService.get(key)).toBeUndefined()
    })

    it('should not expire data before TTL', async () => {
      const key = 'no-expiry-test'
      const value = 'test value'
      const ttl = 1000 // 1 second

      cacheService.set(key, value, ttl)
      
      // Wait a short time
      await new Promise(resolve => setTimeout(resolve, 100))
      
      // Should still be available
      expect(cacheService.get(key)).toBe(value)
    })

    it('should handle zero TTL (no expiry)', () => {
      const key = 'no-expiry-zero'
      const value = 'test value'
      const ttl = 0 // No expiry

      cacheService.set(key, value, ttl)
      
      // Should be available
      expect(cacheService.get(key)).toBe(value)
    })
  })

  describe('cache statistics', () => {
    it('should track cache hits and misses', () => {
      const stats = cacheService.getStats()
      
      expect(stats).toMatchObject({
        hits: expect.any(Number),
        misses: expect.any(Number),
        totalEntries: expect.any(Number)
      })

      expect(stats.hits).toBeGreaterThanOrEqual(0)
      expect(stats.misses).toBeGreaterThanOrEqual(0)
      expect(stats.totalEntries).toBeGreaterThanOrEqual(0)
    })

    it('should increment hits on successful retrieval', () => {
      const key = 'hit-test'
      const value = 'test value'

      cacheService.set(key, value, 60000)
      
      const statsBefore = cacheService.getStats()
      cacheService.get(key)
      const statsAfter = cacheService.getStats()

      expect(statsAfter.hits).toBeGreaterThan(statsBefore.hits)
    })

    it('should increment misses on failed retrieval', () => {
      const statsBefore = cacheService.getStats()
      cacheService.get('non-existent-key')
      const statsAfter = cacheService.getStats()

      expect(statsAfter.misses).toBeGreaterThan(statsBefore.misses)
    })

    it('should track total entries', () => {
      const statsBefore = cacheService.getStats()
      
      cacheService.set('key1', 'value1', 60000)
      cacheService.set('key2', 'value2', 60000)
      cacheService.set('key3', 'value3', 60000)
      
      const statsAfter = cacheService.getStats()

      expect(statsAfter.totalEntries).toBe(statsBefore.totalEntries + 3)
    })
  })

  describe('cache management', () => {
    it('should clear all cache entries', () => {
      cacheService.set('key1', 'value1', 60000)
      cacheService.set('key2', 'value2', 60000)
      cacheService.set('key3', 'value3', 60000)

      expect(cacheService.get('key1')).toBe('value1')
      expect(cacheService.get('key2')).toBe('value2')
      expect(cacheService.get('key3')).toBe('value3')

      cacheService.clear()

      expect(cacheService.get('key1')).toBeUndefined()
      expect(cacheService.get('key2')).toBeUndefined()
      expect(cacheService.get('key3')).toBeUndefined()
    })

    it('should return all cache keys', () => {
      cacheService.set('key1', 'value1', 60000)
      cacheService.set('key2', 'value2', 60000)
      cacheService.set('key3', 'value3', 60000)

      const keys = cacheService.keys()

      expect(keys).toContain('key1')
      expect(keys).toContain('key2')
      expect(keys).toContain('key3')
      expect(keys).toHaveLength(3)
    })

    it('should provide size information', () => {
      const sizeInfo = cacheService.getSizeInfo()

      expect(sizeInfo).toMatchObject({
        totalEntries: expect.any(Number),
        memoryUsage: expect.any(Number),
        averageEntrySize: expect.any(Number)
      })

      expect(sizeInfo.totalEntries).toBeGreaterThanOrEqual(0)
      expect(sizeInfo.memoryUsage).toBeGreaterThanOrEqual(0)
      expect(sizeInfo.averageEntrySize).toBeGreaterThanOrEqual(0)
    })
  })

  describe('edge cases', () => {
    it('should handle empty string keys', () => {
      const value = 'test value'
      
      cacheService.set('', value, 60000)
      expect(cacheService.get('')).toBe(value)
    })

    it('should handle special characters in keys', () => {
      const key = 'key-with-special-chars!@#$%^&*()'
      const value = 'test value'
      
      cacheService.set(key, value, 60000)
      expect(cacheService.get(key)).toBe(value)
    })

    it('should handle null and undefined values', () => {
      cacheService.set('null-value', null, 60000)
      cacheService.set('undefined-value', undefined, 60000)

      expect(cacheService.get('null-value')).toBeNull()
      expect(cacheService.get('undefined-value')).toBeUndefined()
    })

    it('should handle very long keys', () => {
      const longKey = 'a'.repeat(1000)
      const value = 'test value'
      
      cacheService.set(longKey, value, 60000)
      expect(cacheService.get(longKey)).toBe(value)
    })

    it('should handle concurrent access', async () => {
      const promises = []
      
      // Set multiple values concurrently
      for (let i = 0; i < 100; i++) {
        promises.push(
          new Promise(resolve => {
            cacheService.set(`concurrent-${i}`, `value-${i}`, 60000)
            resolve(undefined)
          })
        )
      }
      
      await Promise.all(promises)
      
      // Verify all values were set
      for (let i = 0; i < 100; i++) {
        expect(cacheService.get(`concurrent-${i}`)).toBe(`value-${i}`)
      }
    })
  })

  describe('performance', () => {
    it('should handle many cache operations efficiently', () => {
      const startTime = Date.now()
      
      // Set many values
      for (let i = 0; i < 1000; i++) {
        cacheService.set(`perf-${i}`, `value-${i}`, 60000)
      }
      
      // Retrieve many values
      for (let i = 0; i < 1000; i++) {
        cacheService.get(`perf-${i}`)
      }
      
      const endTime = Date.now()
      const duration = endTime - startTime
      
      // Should complete within reasonable time (1 second)
      expect(duration).toBeLessThan(1000)
    })

    it('should handle cache with many entries', () => {
      // Set many entries
      for (let i = 0; i < 10000; i++) {
        cacheService.set(`many-${i}`, `value-${i}`, 60000)
      }
      
      const stats = cacheService.getStats()
      expect(stats.totalEntries).toBe(10000)
      
      // Should still be able to retrieve values
      expect(cacheService.get('many-0')).toBe('value-0')
      expect(cacheService.get('many-9999')).toBe('value-9999')
    })
  })
})
