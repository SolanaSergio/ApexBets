/**
 * Real Integration Tests for Cache Service
 * Tests actual cache functionality with real data
 */

import { cacheManager } from '@/lib/cache'

describe('Cache Service Integration Tests', () => {
  beforeEach(() => {
    // Clear cache before each test
    cacheManager.clear()
  })

  describe('basic cache operations', () => {
    it('should store and retrieve data', () => {
      const key = 'test-key'
      const value = { message: 'Hello World', number: 42 }
      const ttl = 60000 // 1 minute

      cacheManager.set(key, value, ttl)
      const retrieved = cacheManager.get(key)

      expect(retrieved).toEqual(value)
    })

    it('should return undefined for non-existent key', () => {
      const retrieved = cacheManager.get('non-existent-key')
      expect(retrieved).toBeUndefined()
    })

    it('should handle different data types', () => {
      const stringValue = 'test string'
      const numberValue = 123
      const booleanValue = true
      const arrayValue = [1, 2, 3]
      const objectValue = { key: 'value' }

      cacheManager.set('string', stringValue, 60000)
      cacheManager.set('number', numberValue, 60000)
      cacheManager.set('boolean', booleanValue, 60000)
      cacheManager.set('array', arrayValue, 60000)
      cacheManager.set('object', objectValue, 60000)

      expect(cacheManager.get('string')).toBe(stringValue)
      expect(cacheManager.get('number')).toBe(numberValue)
      expect(cacheManager.get('boolean')).toBe(booleanValue)
      expect(cacheManager.get('array')).toEqual(arrayValue)
      expect(cacheManager.get('object')).toEqual(objectValue)
    })

    it('should handle large objects', () => {
      const largeObject = {
        data: Array.from({ length: 1000 }, (_, i) => ({
          id: i,
          name: `Item ${i}`,
          value: Math.random()
        }))
      }

      cacheManager.set('large-object', largeObject, 60000)
      const retrieved = cacheManager.get('large-object')

      expect(retrieved).toEqual(largeObject)
      expect((retrieved as any).data).toHaveLength(1000)
    })
  })

  describe('TTL (Time To Live) functionality', () => {
    it('should expire data after TTL', async () => {
      const key = 'expiry-test'
      const value = 'test value'
      const ttl = 100 // 100ms

      cacheManager.set(key, value, ttl)
      
      // Should be available immediately
      expect(cacheManager.get(key)).toBe(value)
      
      // Wait for expiry
      await new Promise(resolve => setTimeout(resolve, 150))
      
      // Should be expired
      expect(cacheManager.get(key)).toBeUndefined()
    })

    it('should not expire data before TTL', async () => {
      const key = 'no-expiry-test'
      const value = 'test value'
      const ttl = 1000 // 1 second

      cacheManager.set(key, value, ttl)
      
      // Wait a short time
      await new Promise(resolve => setTimeout(resolve, 100))
      
      // Should still be available
      expect(cacheManager.get(key)).toBe(value)
    })

    it('should handle zero TTL (no expiry)', () => {
      const key = 'no-expiry-zero'
      const value = 'test value'
      const ttl = 0 // No expiry

      cacheManager.set(key, value, ttl)
      
      // Should be available
      expect(cacheManager.get(key)).toBe(value)
    })
  })

  describe('cache statistics', () => {
    it('should track cache hits and misses', () => {
      const stats = cacheManager.getStats()
      
      expect(stats).toMatchObject({
        hits: expect.any(Number),
        misses: expect.any(Number),
        totalEntries: expect.any(Number)
      })

      expect(stats.memory.hits).toBeGreaterThanOrEqual(0)
      expect(stats.memory.misses).toBeGreaterThanOrEqual(0)
      expect(stats.totalEntries).toBeGreaterThanOrEqual(0)
    })

    it('should increment hits on successful retrieval', () => {
      const key = 'hit-test'
      const value = 'test value'

      cacheManager.set(key, value, 60000)
      
      const statsBefore = cacheManager.getStats()
      cacheManager.get(key)
      const statsAfter = cacheManager.getStats()

      expect(statsAfter.memory.hits).toBeGreaterThan(statsBefore.memory.hits)
    })

    it('should increment misses on failed retrieval', () => {
      const statsBefore = cacheManager.getStats()
      cacheManager.get('non-existent-key')
      const statsAfter = cacheManager.getStats()

      expect(statsAfter.memory.misses).toBeGreaterThan(statsBefore.memory.misses)
    })

    it('should track total entries', () => {
      const statsBefore = cacheManager.getStats()
      
      cacheManager.set('key1', 'value1', 60000)
      cacheManager.set('key2', 'value2', 60000)
      cacheManager.set('key3', 'value3', 60000)
      
      const statsAfter = cacheManager.getStats()

      expect(statsAfter.totalEntries).toBe(statsBefore.totalEntries + 3)
    })
  })

  describe('cache management', () => {
    it('should clear all cache entries', () => {
      cacheManager.set('key1', 'value1', 60000)
      cacheManager.set('key2', 'value2', 60000)
      cacheManager.set('key3', 'value3', 60000)

      expect(cacheManager.get('key1')).toBe('value1')
      expect(cacheManager.get('key2')).toBe('value2')
      expect(cacheManager.get('key3')).toBe('value3')

      cacheManager.clear()

      expect(cacheManager.get('key1')).toBeUndefined()
      expect(cacheManager.get('key2')).toBeUndefined()
      expect(cacheManager.get('key3')).toBeUndefined()
    })

    it('should return all cache keys', () => {
      cacheManager.set('key1', 'value1', 60000)
      cacheManager.set('key2', 'value2', 60000)
      cacheManager.set('key3', 'value3', 60000)

      const keys = cacheManager.keys()

      expect(keys).toContain('key1')
      expect(keys).toContain('key2')
      expect(keys).toContain('key3')
      expect(keys).toHaveLength(3)
    })

    it('should provide size information', () => {
      const sizeInfo = cacheManager.getStats()

      expect(sizeInfo).toMatchObject({
        totalEntries: expect.any(Number),
        memoryUsage: expect.any(Number),
        averageEntrySize: expect.any(Number)
      })

      expect(sizeInfo.totalEntries).toBeGreaterThanOrEqual(0)
      expect(sizeInfo.memory.totalSize).toBeGreaterThanOrEqual(0)
      expect(sizeInfo.totalSize).toBeGreaterThanOrEqual(0)
    })
  })

  describe('edge cases', () => {
    it('should handle empty string keys', () => {
      const value = 'test value'
      
      cacheManager.set('', value, 60000)
      expect(cacheManager.get('')).toBe(value)
    })

    it('should handle special characters in keys', () => {
      const key = 'key-with-special-chars!@#$%^&*()'
      const value = 'test value'
      
      cacheManager.set(key, value, 60000)
      expect(cacheManager.get(key)).toBe(value)
    })

    it('should handle null and undefined values', () => {
      cacheManager.set('null-value', null, 60000)
      cacheManager.set('undefined-value', undefined, 60000)

      expect(cacheManager.get('null-value')).toBeNull()
      expect(cacheManager.get('undefined-value')).toBeUndefined()
    })

    it('should handle very long keys', () => {
      const longKey = 'a'.repeat(1000)
      const value = 'test value'
      
      cacheManager.set(longKey, value, 60000)
      expect(cacheManager.get(longKey)).toBe(value)
    })

    it('should handle concurrent access', async () => {
      const promises = []
      
      // Set multiple values concurrently
      for (let i = 0; i < 100; i++) {
        promises.push(
          new Promise(resolve => {
            cacheManager.set(`concurrent-${i}`, `value-${i}`, 60000)
            resolve(undefined)
          })
        )
      }
      
      await Promise.all(promises)
      
      // Verify all values were set
      for (let i = 0; i < 100; i++) {
        expect(cacheManager.get(`concurrent-${i}`)).toBe(`value-${i}`)
      }
    })
  })

  describe('performance', () => {
    it('should handle many cache operations efficiently', () => {
      const startTime = Date.now()
      
      // Set many values
      for (let i = 0; i < 1000; i++) {
        cacheManager.set(`perf-${i}`, `value-${i}`, 60000)
      }
      
      // Retrieve many values
      for (let i = 0; i < 1000; i++) {
        cacheManager.get(`perf-${i}`)
      }
      
      const endTime = Date.now()
      const duration = endTime - startTime
      
      // Should complete within reasonable time (1 second)
      expect(duration).toBeLessThan(1000)
    })

    it('should handle cache with many entries', () => {
      // Set many entries
      for (let i = 0; i < 10000; i++) {
        cacheManager.set(`many-${i}`, `value-${i}`, 60000)
      }
      
      const stats = cacheManager.getStats()
      expect(stats.totalEntries).toBe(10000)
      
      // Should still be able to retrieve values
      expect(cacheManager.get('many-0')).toBe('value-0')
      expect(cacheManager.get('many-9999')).toBe('value-9999')
    })
  })
})
