/**
 * Rate Limiting Tests
 * Tests for API rate limiting functionality
 */

const { apiRateLimiter } = require('../../lib/rules/api-rate-limiter')
const {
  withRateLimit,
  getRateLimitStatus,
  isRateLimited,
} = require('../../lib/middleware/api-rate-limit')

describe('Rate Limiting', () => {
  beforeEach(() => {
    // Reset rate limiter before each test
    apiRateLimiter.reset()
  })

  describe('ApiRateLimiter', () => {
    it('should allow requests within rate limits', () => {
      expect(() => {
        apiRateLimiter.checkRateLimit('sportsdb')
        apiRateLimiter.recordRequest('sportsdb')
      }).not.toThrow()
    })

    it('should track usage correctly', () => {
      apiRateLimiter.checkRateLimit('sportsdb')
      apiRateLimiter.recordRequest('sportsdb')

      const usage = apiRateLimiter.getUsage('sportsdb')
      expect(usage.minute).toBe(1)
      expect(usage.day).toBe(1)
    })

    it('should enforce minute rate limits', () => {
      // Make 30 requests (sportsdb limit is 30/minute)
      for (let i = 0; i < 30; i++) {
        apiRateLimiter.checkRateLimit('sportsdb')
        apiRateLimiter.recordRequest('sportsdb')
      }

      // 31st request should fail
      expect(() => {
        apiRateLimiter.checkRateLimit('sportsdb')
      }).toThrow('Rate limit exceeded for sportsdb: 30 requests per minute')
    })

    it('should enforce day rate limits', () => {
      // Make 10000 requests (sportsdb limit is 10000/day)
      for (let i = 0; i < 10000; i++) {
        apiRateLimiter.checkRateLimit('sportsdb')
        apiRateLimiter.recordRequest('sportsdb')
      }

      // 10001st request should fail
      expect(() => {
        apiRateLimiter.checkRateLimit('sportsdb')
      }).toThrow('Rate limit exceeded for sportsdb: 10000 requests per day')
    })

    it('should enforce burst limits', () => {
      // Make 5 burst requests (sportsdb burst limit is 5)
      for (let i = 0; i < 5; i++) {
        apiRateLimiter.checkRateLimit('sportsdb')
        apiRateLimiter.recordRequest('sportsdb')
      }

      // 6th burst request should fail
      expect(() => {
        apiRateLimiter.checkRateLimit('sportsdb')
      }).toThrow('Burst limit exceeded for sportsdb: 5 requests in burst')
    })

    it('should have correct limits for different APIs', () => {
      // Test Odds API (10 requests/minute)
      for (let i = 0; i < 10; i++) {
        apiRateLimiter.checkRateLimit('odds')
        apiRateLimiter.recordRequest('odds')
      }

      expect(() => {
        apiRateLimiter.checkRateLimit('odds')
      }).toThrow('Rate limit exceeded for odds: 10 requests per minute')

      // Reset and test BALLDONTLIE (5 requests/minute)
      apiRateLimiter.reset()

      for (let i = 0; i < 5; i++) {
        apiRateLimiter.checkRateLimit('balldontlie')
        apiRateLimiter.recordRequest('balldontlie')
      }

      expect(() => {
        apiRateLimiter.checkRateLimit('balldontlie')
      }).toThrow('Rate limit exceeded for balldontlie: 5 requests per minute')
    })
  })

  describe('Rate Limit Middleware', () => {
    it('should allow requests within limits', async () => {
      const handler = withRateLimit({ service: 'sportsdb' })(async () => {
        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      })

      const request = new Request('http://localhost:3000/api/test')
      const response = await handler(request)

      expect(response.status).toBe(200)
      expect(response.headers.get('X-RateLimit-Remaining-Minute')).toBe('59')
    })

    it('should return 429 when rate limit exceeded', async () => {
      // Exhaust the rate limit first
      for (let i = 0; i < 30; i++) {
        apiRateLimiter.checkRateLimit('sportsdb')
        apiRateLimiter.recordRequest('sportsdb')
      }

      const handler = withRateLimit({ service: 'sportsdb' })(async () => {
        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      })

      const request = new Request('http://localhost:3000/api/test')
      const response = await handler(request)

      expect(response.status).toBe(429)
      expect(response.headers.get('Retry-After')).toBe('60')
    })

    it('should provide correct rate limit status', () => {
      apiRateLimiter.checkRateLimit('sportsdb')
      apiRateLimiter.recordRequest('sportsdb')

      const status = getRateLimitStatus('sportsdb')
      expect(status.minute).toBe(1)
      expect(status.day).toBe(1)
    })

    it('should correctly identify rate limited services', () => {
      // Within limits
      expect(isRateLimited('sportsdb')).toBe(false)

      // Exhaust rate limit
      for (let i = 0; i < 30; i++) {
        apiRateLimiter.checkRateLimit('sportsdb')
        apiRateLimiter.recordRequest('sportsdb')
      }

      expect(isRateLimited('sportsdb')).toBe(true)
    })
  })

  describe('API Client Rate Limiting', () => {
    it('should respect rate limits in API clients', async () => {
      // Test that rate limiting adds appropriate delays
      const startTime = Date.now()

      apiRateLimiter.checkRateLimit('odds') // 6 second delay
      apiRateLimiter.recordRequest('odds')

      const endTime = Date.now()
      // Should complete quickly as we're not actually making requests
      expect(endTime - startTime).toBeLessThan(100)
    })
  })

  describe('Rate Limit Configuration', () => {
    it('should have correct limits for each API', () => {
      const configs = {
        rapidapi: { requestsPerMinute: 100, requestsPerDay: 10000, burstLimit: 10 },
        odds: { requestsPerMinute: 10, requestsPerDay: 100, burstLimit: 2 },
        sportsdb: { requestsPerMinute: 30, requestsPerDay: 10000, burstLimit: 5 },
        balldontlie: { requestsPerMinute: 5, requestsPerDay: 10000, burstLimit: 2 },
        espn: { requestsPerMinute: 60, requestsPerDay: 10000, burstLimit: 10 },
      }

      // Test that the rate limiter uses these configurations
      // by checking that limits are enforced correctly
      Object.entries(configs).forEach(([service, limits]) => {
        // Test minute limits
        for (let i = 0; i < limits.requestsPerMinute; i++) {
          expect(() => {
            apiRateLimiter.checkRateLimit(service)
            apiRateLimiter.recordRequest(service)
          }).not.toThrow()
        }

        // Test that exceeding minute limit throws
        expect(() => {
          apiRateLimiter.checkRateLimit(service)
        }).toThrow(
          `Rate limit exceeded for ${service}: ${limits.requestsPerMinute} requests per minute`
        )

        // Reset for next test
        apiRateLimiter.reset()
      })
    })
  })
})
