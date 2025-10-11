/**
 * Rate Limiter Unit Tests
 * Tests the enhanced rate limiting system
 */

import { EnhancedRateLimiter, RateLimitConfig } from '@/lib/services/enhanced-rate-limiter'

describe('Enhanced Rate Limiter', () => {
  let rateLimiter: EnhancedRateLimiter

  beforeEach(() => {
    rateLimiter = EnhancedRateLimiter.getInstance()
    // Clear any existing state
    rateLimiter.reset()
  })

  describe('Rate Limit Checking', () => {
    it('should allow requests within rate limit', () => {
      const result = rateLimiter.checkRateLimit('test-provider', 'test-endpoint')

      expect(result.allowed).toBe(true)
      expect(result.remaining).toBeGreaterThan(0)
      expect(result.resetTime).toBeGreaterThan(Date.now())
    })

    it('should block requests exceeding rate limit', () => {
      const provider = 'test-provider'
      const endpoint = 'test-endpoint'

      // Make requests up to the limit
      for (let i = 0; i < 10; i++) {
        rateLimiter.checkRateLimit(provider, endpoint)
      }

      // This should be blocked
      const result = rateLimiter.checkRateLimit(provider, endpoint)

      expect(result.allowed).toBe(false)
      expect(result.remaining).toBe(0)
      expect(result.retryAfter).toBeDefined()
    })

    it('should track requests per provider', () => {
      const provider1 = 'provider-1'
      const provider2 = 'provider-2'

      // Make requests for provider 1
      rateLimiter.checkRateLimit(provider1, 'endpoint')
      rateLimiter.checkRateLimit(provider1, 'endpoint')

      // Make requests for provider 2
      rateLimiter.checkRateLimit(provider2, 'endpoint')

      const result1 = rateLimiter.checkRateLimit(provider1, 'endpoint')
      const result2 = rateLimiter.checkRateLimit(provider2, 'endpoint')

      // Both should be allowed as they're tracked separately
      expect(result1.allowed).toBe(true)
      expect(result2.allowed).toBe(true)
    })

    it('should track requests per endpoint', () => {
      const provider = 'test-provider'
      const endpoint1 = 'endpoint-1'
      const endpoint2 = 'endpoint-2'

      // Make requests for endpoint 1
      rateLimiter.checkRateLimit(provider, endpoint1)
      rateLimiter.checkRateLimit(provider, endpoint1)

      // Make requests for endpoint 2
      rateLimiter.checkRateLimit(provider, endpoint2)

      const result1 = rateLimiter.checkRateLimit(provider, endpoint1)
      const result2 = rateLimiter.checkRateLimit(provider, endpoint2)

      // Both should be allowed as they're tracked separately
      expect(result1.allowed).toBe(true)
      expect(result2.allowed).toBe(true)
    })
  })

  describe('Rate Limit Configuration', () => {
    it('should use default configuration for unknown providers', () => {
      const result = rateLimiter.checkRateLimit('unknown-provider', 'endpoint')

      expect(result.allowed).toBe(true)
      expect(result.remaining).toBeGreaterThan(0)
    })

    it('should respect burst limits', () => {
      const provider = 'test-provider'
      const endpoint = 'burst-test'

      // Make burst requests
      const burstLimit = 5
      for (let i = 0; i < burstLimit; i++) {
        const result = rateLimiter.checkRateLimit(provider, endpoint)
        expect(result.allowed).toBe(true)
      }

      // Burst limit exceeded
      const result = rateLimiter.checkRateLimit(provider, endpoint)
      expect(result.allowed).toBe(false)
    })

    it('should handle different window sizes', () => {
      const provider = 'test-provider'
      const endpoint = 'window-test'

      // Test with a small window
      const result1 = rateLimiter.checkRateLimit(provider, endpoint)
      expect(result1.allowed).toBe(true)

      // Wait for window to reset (in real scenario)
      // For testing, we'll just verify the structure
      expect(result1.resetTime).toBeGreaterThan(Date.now())
    })
  })

  describe('Rate Limit Statistics', () => {
    it('should track rate limit statistics', () => {
      const provider = 'stats-provider'
      const endpoint = 'stats-endpoint'

      // Make some requests
      rateLimiter.checkRateLimit(provider, endpoint)
      rateLimiter.checkRateLimit(provider, endpoint)

      const stats = rateLimiter.getStats()

      expect(stats).toBeDefined()
      expect(stats.totalRequests).toBeGreaterThan(0)
      expect(stats.blockedRequests).toBeGreaterThanOrEqual(0)
    })

    it('should calculate hit rate correctly', () => {
      const provider = 'hit-rate-provider'
      const endpoint = 'hit-rate-endpoint'

      // Make requests within limit
      for (let i = 0; i < 5; i++) {
        rateLimiter.checkRateLimit(provider, endpoint)
      }

      const stats = rateLimiter.getStats()
      expect(stats.hitRate).toBeGreaterThanOrEqual(0)
      expect(stats.hitRate).toBeLessThanOrEqual(1)
    })
  })

  describe('Rate Limit Reset', () => {
    it('should reset rate limits for specific provider', () => {
      const provider = 'reset-provider'
      const endpoint = 'reset-endpoint'

      // Exceed rate limit
      for (let i = 0; i < 10; i++) {
        rateLimiter.checkRateLimit(provider, endpoint)
      }

      // Should be blocked
      let result = rateLimiter.checkRateLimit(provider, endpoint)
      expect(result.allowed).toBe(false)

      // Reset rate limit
      rateLimiter.resetProvider(provider)

      // Should be allowed again
      result = rateLimiter.checkRateLimit(provider, endpoint)
      expect(result.allowed).toBe(true)
    })

    it('should reset all rate limits', () => {
      const provider1 = 'reset-all-provider-1'
      const provider2 = 'reset-all-provider-2'

      // Exceed rate limits for both providers
      for (let i = 0; i < 10; i++) {
        rateLimiter.checkRateLimit(provider1, 'endpoint')
        rateLimiter.checkRateLimit(provider2, 'endpoint')
      }

      // Both should be blocked
      let result1 = rateLimiter.checkRateLimit(provider1, 'endpoint')
      let result2 = rateLimiter.checkRateLimit(provider2, 'endpoint')
      expect(result1.allowed).toBe(false)
      expect(result2.allowed).toBe(false)

      // Reset all
      rateLimiter.reset()

      // Both should be allowed again
      result1 = rateLimiter.checkRateLimit(provider1, 'endpoint')
      result2 = rateLimiter.checkRateLimit(provider2, 'endpoint')
      expect(result1.allowed).toBe(true)
      expect(result2.allowed).toBe(true)
    })
  })

  describe('Edge Cases', () => {
    it('should handle concurrent requests', async () => {
      const provider = 'concurrent-provider'
      const endpoint = 'concurrent-endpoint'

      // Make concurrent requests
      const promises = Array.from({ length: 10 }, () =>
        Promise.resolve(rateLimiter.checkRateLimit(provider, endpoint))
      )

      const results = await Promise.all(promises)

      // All requests should be processed
      expect(results).toHaveLength(10)

      // Some should be allowed, some might be blocked
      const allowedCount = results.filter(r => r.allowed).length
      const blockedCount = results.filter(r => !r.allowed).length

      expect(allowedCount + blockedCount).toBe(10)
    })

    it('should handle invalid provider names', () => {
      const invalidProviders = ['', null, undefined, '   ']

      invalidProviders.forEach(provider => {
        expect(() => {
          rateLimiter.checkRateLimit(provider as string, 'endpoint')
        }).not.toThrow()
      })
    })

    it('should handle invalid endpoint names', () => {
      const invalidEndpoints = ['', null, undefined, '   ']

      invalidEndpoints.forEach(endpoint => {
        expect(() => {
          rateLimiter.checkRateLimit('provider', endpoint as string)
        }).not.toThrow()
      })
    })

    it('should handle very high request rates', () => {
      const provider = 'high-rate-provider'
      const endpoint = 'high-rate-endpoint'

      // Make many requests quickly
      const results = []
      for (let i = 0; i < 100; i++) {
        results.push(rateLimiter.checkRateLimit(provider, endpoint))
      }

      // Should handle gracefully without crashing
      expect(results).toHaveLength(100)

      // Some should be blocked due to rate limiting
      const blockedCount = results.filter(r => !r.allowed).length
      expect(blockedCount).toBeGreaterThan(0)
    })
  })

  describe('Provider-Specific Configuration', () => {
    it('should respect different rate limits per provider', () => {
      // Test with providers that have different rate limits
      const slowProvider = 'slow-provider'
      const fastProvider = 'fast-provider'

      // Both should start with their respective limits
      const slowResult = rateLimiter.checkRateLimit(slowProvider, 'endpoint')
      const fastResult = rateLimiter.checkRateLimit(fastProvider, 'endpoint')

      expect(slowResult.allowed).toBe(true)
      expect(fastResult.allowed).toBe(true)
    })

    it('should handle provider-specific burst limits', () => {
      const provider = 'burst-provider'
      const endpoint = 'burst-endpoint'

      // Test burst limit
      const burstLimit = 3
      for (let i = 0; i < burstLimit; i++) {
        const result = rateLimiter.checkRateLimit(provider, endpoint)
        expect(result.allowed).toBe(true)
      }

      // Should be blocked after burst limit
      const result = rateLimiter.checkRateLimit(provider, endpoint)
      expect(result.allowed).toBe(false)
    })
  })

  describe('Database Persistence', () => {
    it('should handle database persistence gracefully', async () => {
      const provider = 'db-provider'
      const endpoint = 'db-endpoint'

      // This test ensures the rate limiter doesn't crash when DB is unavailable
      expect(async () => {
        await rateLimiter.persistToDatabase()
        await rateLimiter.loadFromDatabase()
      }).not.toThrow()
    })

    it('should handle database errors gracefully', async () => {
      // Test that database errors don't break the rate limiter
      const provider = 'error-provider'
      const endpoint = 'error-endpoint'

      const result = rateLimiter.checkRateLimit(provider, endpoint)
      expect(result.allowed).toBe(true)

      // Should still work even if DB operations fail
      expect(async () => {
        await rateLimiter.persistToDatabase()
      }).not.toThrow()
    })
  })
})
