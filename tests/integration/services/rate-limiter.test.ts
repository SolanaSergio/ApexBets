/**
 * Real Integration Tests for Rate Limiter Service
 * Tests actual rate limiting functionality with real requests
 */

import { rateLimiter } from '@/lib/services/rate-limiter'

describe('Rate Limiter Service Integration Tests', () => {
  beforeEach(() => {
    // Reset rate limiter state before each test
    rateLimiter.resetUsageStats()
  })

  describe('basic rate limiting', () => {
    it('should allow requests within rate limit', async () => {
      const service = 'test-service'
      const startTime = Date.now()
      
      // Make requests within rate limit
      for (let i = 0; i < 5; i++) {
        await rateLimiter.waitForRateLimit(service)
        rateLimiter.recordRequest(service, 100, false)
      }
      
      const endTime = Date.now()
      const duration = endTime - startTime
      
      // Should complete quickly without significant delay
      expect(duration).toBeLessThan(1000)
    })

    it('should delay requests when rate limit is exceeded', async () => {
      const service = 'test-service'
      const startTime = Date.now()
      
      // Make many requests to trigger rate limiting
      for (let i = 0; i < 20; i++) {
        await rateLimiter.waitForRateLimit(service)
        rateLimiter.recordRequest(service, 100, false)
      }
      
      const endTime = Date.now()
      const duration = endTime - startTime
      
      // Should take longer due to rate limiting
      expect(duration).toBeGreaterThan(100)
    })

    it('should handle different services independently', async () => {
      const service1 = 'service-1'
      const service2 = 'service-2'
      
      // Make requests to both services
      await rateLimiter.waitForRateLimit(service1)
      rateLimiter.recordRequest(service1, 100, false)
      
      await rateLimiter.waitForRateLimit(service2)
      rateLimiter.recordRequest(service2, 100, false)
      
      // Both should be recorded separately
      const stats1 = rateLimiter.getUsageStats(service1)
      const stats2 = rateLimiter.getUsageStats(service2)
      
      expect(stats1.totalRequests).toBe(1)
      expect(stats2.totalRequests).toBe(1)
    })
  })

  describe('request recording', () => {
    it('should record successful requests', () => {
      const service = 'test-service'
      const responseTime = 150
      
      rateLimiter.recordRequest(service, responseTime, false)
      
      const stats = rateLimiter.getUsageStats(service)
      expect(stats.totalRequests).toBe(1)
      expect(stats.errorRate).toBe(0)
      expect(stats.averageResponseTime).toBe(responseTime)
    })

    it('should record failed requests', () => {
      const service = 'test-service'
      const responseTime = 200
      
      rateLimiter.recordRequest(service, responseTime, true)
      
      const stats = rateLimiter.getUsageStats(service)
      expect(stats.totalRequests).toBe(1)
      expect(stats.errorRate).toBeGreaterThan(0)
      expect(stats.averageResponseTime).toBe(responseTime)
    })

    it('should calculate average response time', () => {
      const service = 'test-service'
      
      rateLimiter.recordRequest(service, 100, false)
      rateLimiter.recordRequest(service, 200, false)
      rateLimiter.recordRequest(service, 300, false)
      
      const stats = rateLimiter.getUsageStats(service)
      expect(stats.averageResponseTime).toBe(200)
    })

    it('should track error rate', () => {
      const service = 'test-service'
      
      rateLimiter.recordRequest(service, 100, false)
      rateLimiter.recordRequest(service, 200, true)
      rateLimiter.recordRequest(service, 300, true)
      
      const stats = rateLimiter.getUsageStats(service)
      expect(stats.totalRequests).toBe(3)
      expect(stats.errorRate).toBeGreaterThan(0)
      expect(stats.errorRate).toBe(2/3)
    })
  })

  describe('rate limit configuration', () => {
    it('should respect rate limits for different services', async () => {
      const service1 = 'fast-service'
      const service2 = 'slow-service'
      
      // Configure different rate limits
      // Rate limits are configured in constructor, cannot be changed at runtime
      // This test verifies the existing configuration
      
      const startTime = Date.now()
      
      // Make requests to both services
      for (let i = 0; i < 5; i++) {
        await rateLimiter.waitForRateLimit(service1)
        rateLimiter.recordRequest(service1, 100, false)
        
        await rateLimiter.waitForRateLimit(service2)
        rateLimiter.recordRequest(service2, 100, false)
      }
      
      const endTime = Date.now()
      const duration = endTime - startTime
      
      // Should take longer due to slow-service rate limit
      expect(duration).toBeGreaterThan(1000)
    })

    it('should handle burst requests', async () => {
      const service = 'burst-service'
      // Rate limits are configured in constructor, cannot be changed at runtime
      
      const startTime = Date.now()
      
      // Make burst of requests
      const promises = []
      for (let i = 0; i < 10; i++) {
        promises.push(
          rateLimiter.waitForRateLimit(service).then(() => {
            rateLimiter.recordRequest(service, 100, false)
          })
        )
      }
      
      await Promise.all(promises)
      
      const endTime = Date.now()
      const duration = endTime - startTime
      
      // Should take time due to rate limiting
      expect(duration).toBeGreaterThan(500)
    })
  })

  describe('statistics and monitoring', () => {
    it('should provide service statistics', () => {
      const service = 'test-service'
      
      rateLimiter.recordRequest(service, 100, false)
      rateLimiter.recordRequest(service, 200, true)
      rateLimiter.recordRequest(service, 300, false)
      
      const stats = rateLimiter.getUsageStats(service)
      
      expect(stats).toMatchObject({
        requests: 3,
        errors: 1,
        averageResponseTime: 200,
        errorRate: 1/3,
        lastRequestTime: expect.any(Number)
      })
    })

    it('should provide all usage statistics', () => {
      const service1 = 'service-1'
      const service2 = 'service-2'
      
      rateLimiter.recordRequest(service1, 100, false)
      rateLimiter.recordRequest(service2, 200, true)
      
      const allStats = rateLimiter.getAllUsageStats()
      
      expect(allStats).toHaveProperty(service1)
      expect(allStats).toHaveProperty(service2)
      expect(allStats[service1].totalRequests).toBe(1)
      expect(allStats[service2].totalRequests).toBe(1)
    })

    it('should track last request time', () => {
      const service = 'test-service'
      const beforeTime = Date.now()
      
      rateLimiter.recordRequest(service, 100, false)
      
      const afterTime = Date.now()
      const stats = rateLimiter.getUsageStats(service)
      
      expect(stats.lastRequestTime).toBeGreaterThanOrEqual(beforeTime)
      expect(stats.lastRequestTime).toBeLessThanOrEqual(afterTime)
    })
  })

  describe('error handling', () => {
    it('should handle invalid service names', () => {
      const invalidService = ''
      
      // Should not throw error
      expect(() => {
        rateLimiter.recordRequest(invalidService, 100, false)
      }).not.toThrow()
      
      const stats = rateLimiter.getUsageStats(invalidService)
      expect(stats.totalRequests).toBe(1)
    })

    it('should handle negative response times', () => {
      const service = 'test-service'
      
      rateLimiter.recordRequest(service, -100, false)
      
      const stats = rateLimiter.getUsageStats(service)
      expect(stats.averageResponseTime).toBe(-100)
    })

    it('should handle very large response times', () => {
      const service = 'test-service'
      const largeResponseTime = 999999999
      
      rateLimiter.recordRequest(service, largeResponseTime, false)
      
      const stats = rateLimiter.getUsageStats(service)
      expect(stats.averageResponseTime).toBe(largeResponseTime)
    })
  })

  describe('concurrent access', () => {
    it('should handle concurrent requests safely', async () => {
      const service = 'concurrent-service'
      const promises = []
      
      // Make many concurrent requests
      for (let i = 0; i < 100; i++) {
        promises.push(
          rateLimiter.waitForRateLimit(service).then(() => {
            rateLimiter.recordRequest(service, Math.random() * 1000, Math.random() > 0.5)
          })
        )
      }
      
      await Promise.all(promises)
      
      const stats = rateLimiter.getUsageStats(service)
      expect(stats.totalRequests).toBe(100)
    })

    it('should maintain rate limits under concurrent load', async () => {
      const service = 'concurrent-rate-service'
      // Rate limits are configured in constructor, cannot be changed at runtime
      
      const startTime = Date.now()
      const promises = []
      
      // Make 50 concurrent requests
      for (let i = 0; i < 50; i++) {
        promises.push(
          rateLimiter.waitForRateLimit(service).then(() => {
            rateLimiter.recordRequest(service, 100, false)
          })
        )
      }
      
      await Promise.all(promises)
      
      const endTime = Date.now()
      const duration = endTime - startTime
      
      // Should take time due to rate limiting
      expect(duration).toBeGreaterThan(1000)
    })
  })

  describe('reset functionality', () => {
    it('should reset all statistics', () => {
      const service = 'test-service'
      
      rateLimiter.recordRequest(service, 100, false)
      rateLimiter.recordRequest(service, 200, true)
      
      let stats = rateLimiter.getUsageStats(service)
      expect(stats.totalRequests).toBe(2)
      expect(stats.errorRate).toBeGreaterThan(0)
      
      rateLimiter.resetUsageStats()
      
      stats = rateLimiter.getUsageStats(service)
      expect(stats.totalRequests).toBe(0)
      expect(stats.errorRate).toBe(0)
    })

    it('should reset specific service statistics', () => {
      const service1 = 'service-1'
      const service2 = 'service-2'
      
      rateLimiter.recordRequest(service1, 100, false)
      rateLimiter.recordRequest(service2, 200, true)
      
      rateLimiter.resetUsageStats(service1)
      
      const stats1 = rateLimiter.getUsageStats(service1)
      const stats2 = rateLimiter.getUsageStats(service2)
      
      expect(stats1.totalRequests).toBe(0)
      expect(stats2.totalRequests).toBe(1)
    })
  })
})
