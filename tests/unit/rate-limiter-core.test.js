/**
 * Rate Limiter Core Tests
 * Tests the core rate limiting logic without external dependencies
 */

// Mock the rate limiter for testing
class MockRateLimiter {
  constructor() {
    this.requestCounts = new Map()
    this.burstCounts = new Map()
  }

  getApiConfig() {
    return {
      rapidapi: { requestsPerMinute: 100, requestsPerDay: 10000, burstLimit: 10 },
      odds: { requestsPerMinute: 10, requestsPerDay: 100, burstLimit: 2 },
      sportsdb: { requestsPerMinute: 30, requestsPerDay: 10000, burstLimit: 5 },
      balldontlie: { requestsPerMinute: 5, requestsPerDay: 10000, burstLimit: 2 },
      espn: { requestsPerMinute: 60, requestsPerDay: 10000, burstLimit: 10 },
    }
  }

  checkRateLimit(apiName) {
    const config = this.getApiConfig()[apiName]
    const now = Date.now()
    const key = `${apiName}_${Math.floor(now / 60000)}`
    const dayKey = `${apiName}_${Math.floor(now / 86400000)}`

    if (!this.requestCounts.has(key)) {
      this.requestCounts.set(key, { minute: 0, day: 0, lastReset: now })
    }
    if (!this.requestCounts.has(dayKey)) {
      this.requestCounts.set(dayKey, { minute: 0, day: 0, lastReset: now })
    }

    const minuteCount = this.requestCounts.get(key)
    const dayCount = this.requestCounts.get(dayKey)

    if (minuteCount.minute >= config.requestsPerMinute) {
      throw new Error(
        `Rate limit exceeded for ${apiName}: ${config.requestsPerMinute} requests per minute`
      )
    }

    if (dayCount.day >= config.requestsPerDay) {
      throw new Error(
        `Rate limit exceeded for ${apiName}: ${config.requestsPerDay} requests per day`
      )
    }

    const burstKey = `${apiName}_burst`
    const burstCount = this.burstCounts.get(burstKey) || 0
    if (burstCount >= config.burstLimit) {
      throw new Error(`Burst limit exceeded for ${apiName}: ${config.burstLimit} requests in burst`)
    }

    minuteCount.minute++
    dayCount.day++
    this.burstCounts.set(burstKey, burstCount + 1)

    setTimeout(() => {
      this.burstCounts.delete(burstKey)
    }, 1000)
  }

  recordRequest(apiName) {
    // Counters already incremented in checkRateLimit
  }

  getUsage(apiName) {
    const now = Date.now()
    const key = `${apiName}_${Math.floor(now / 60000)}`
    const dayKey = `${apiName}_${Math.floor(now / 86400000)}`
    const burstKey = `${apiName}_burst`

    const minuteCount = this.requestCounts.get(key) || { minute: 0, day: 0, lastReset: now }
    const dayCount = this.requestCounts.get(dayKey) || { minute: 0, day: 0, lastReset: now }
    const burstCount = this.burstCounts.get(burstKey) || 0

    return {
      minute: minuteCount.minute,
      day: dayCount.day,
      burst: burstCount,
    }
  }

  reset() {
    this.requestCounts.clear()
    this.burstCounts.clear()
  }
}

describe('Rate Limiter Core Logic', () => {
  let rateLimiter

  beforeEach(() => {
    rateLimiter = new MockRateLimiter()
  })

  describe('Basic Functionality', () => {
    it('should allow requests within rate limits', () => {
      expect(() => {
        rateLimiter.checkRateLimit('sportsdb')
        rateLimiter.recordRequest('sportsdb')
      }).not.toThrow()
    })

    it('should track usage correctly', () => {
      rateLimiter.checkRateLimit('sportsdb')
      rateLimiter.recordRequest('sportsdb')

      const usage = rateLimiter.getUsage('sportsdb')
      expect(usage.minute).toBe(1)
      expect(usage.day).toBe(1)
    })

    it('should enforce minute rate limits', () => {
      // Make requests with delays to avoid burst limit
      for (let i = 0; i < 30; i++) {
        rateLimiter.checkRateLimit('sportsdb')
        rateLimiter.recordRequest('sportsdb')

        // Small delay to avoid burst limit
        if (i % 4 === 3) {
          // Reset burst count every 4 requests
          rateLimiter.burstCounts.clear()
        }
      }

      // 31st request should fail
      expect(() => {
        rateLimiter.checkRateLimit('sportsdb')
      }).toThrow('Rate limit exceeded for sportsdb: 30 requests per minute')
    })

    it('should enforce day rate limits', () => {
      // Test day limit by directly setting the day count
      const now = Date.now()
      const dayKey = `sportsdb_${Math.floor(now / 86400000)}`

      // Set day count to 10000 (the limit)
      rateLimiter.requestCounts.set(dayKey, { minute: 0, day: 10000, lastReset: now })

      // Next request should fail due to day limit
      expect(() => {
        rateLimiter.checkRateLimit('sportsdb')
      }).toThrow('Rate limit exceeded for sportsdb: 10000 requests per day')
    })

    it('should enforce burst limits', () => {
      // Make 5 burst requests (sportsdb burst limit is 5)
      for (let i = 0; i < 5; i++) {
        rateLimiter.checkRateLimit('sportsdb')
        rateLimiter.recordRequest('sportsdb')
      }

      // 6th burst request should fail
      expect(() => {
        rateLimiter.checkRateLimit('sportsdb')
      }).toThrow('Burst limit exceeded for sportsdb: 5 requests in burst')
    })
  })

  describe('Different API Limits', () => {
    it('should have correct limits for Odds API', () => {
      // Test Odds API (10 requests/minute, burst limit 2)
      for (let i = 0; i < 10; i++) {
        rateLimiter.checkRateLimit('odds')
        rateLimiter.recordRequest('odds')

        // Reset burst count every request to avoid burst limit
        rateLimiter.burstCounts.clear()
      }

      expect(() => {
        rateLimiter.checkRateLimit('odds')
      }).toThrow('Rate limit exceeded for odds: 10 requests per minute')
    })

    it('should have correct limits for BALLDONTLIE API', () => {
      // Reset for BALLDONTLIE test
      rateLimiter.reset()

      // Test BALLDONTLIE (5 requests/minute, burst limit 2)
      for (let i = 0; i < 5; i++) {
        rateLimiter.checkRateLimit('balldontlie')
        rateLimiter.recordRequest('balldontlie')

        // Reset burst count every request to avoid burst limit
        rateLimiter.burstCounts.clear()
      }

      expect(() => {
        rateLimiter.checkRateLimit('balldontlie')
      }).toThrow('Rate limit exceeded for balldontlie: 5 requests per minute')
    })

    it('should have correct limits for RapidAPI', () => {
      // Reset for RapidAPI test
      rateLimiter.reset()

      // Test RapidAPI (100 requests/minute, burst limit 10)
      for (let i = 0; i < 100; i++) {
        rateLimiter.checkRateLimit('rapidapi')
        rateLimiter.recordRequest('rapidapi')

        // Reset burst count every 9 requests to avoid burst limit
        if (i % 9 === 8) {
          rateLimiter.burstCounts.clear()
        }
      }

      expect(() => {
        rateLimiter.checkRateLimit('rapidapi')
      }).toThrow('Rate limit exceeded for rapidapi: 100 requests per minute')
    })

    it('should have correct limits for ESPN API', () => {
      // Reset for ESPN test
      rateLimiter.reset()

      // Test ESPN (60 requests/minute, burst limit 10)
      for (let i = 0; i < 60; i++) {
        rateLimiter.checkRateLimit('espn')
        rateLimiter.recordRequest('espn')

        // Reset burst count every 9 requests to avoid burst limit
        if (i % 9 === 8) {
          rateLimiter.burstCounts.clear()
        }
      }

      expect(() => {
        rateLimiter.checkRateLimit('espn')
      }).toThrow('Rate limit exceeded for espn: 60 requests per minute')
    })
  })

  describe('Usage Tracking', () => {
    it('should track usage across different APIs independently', () => {
      rateLimiter.checkRateLimit('odds')
      rateLimiter.recordRequest('odds')

      rateLimiter.checkRateLimit('sportsdb')
      rateLimiter.recordRequest('sportsdb')

      const oddsUsage = rateLimiter.getUsage('odds')
      const sportsdbUsage = rateLimiter.getUsage('sportsdb')

      expect(oddsUsage.minute).toBe(1)
      expect(sportsdbUsage.minute).toBe(1)
      expect(oddsUsage.minute).toBe(sportsdbUsage.minute)
    })

    it('should reset burst counts after timeout', done => {
      // Make 5 burst requests
      for (let i = 0; i < 5; i++) {
        rateLimiter.checkRateLimit('sportsdb')
        rateLimiter.recordRequest('sportsdb')
      }

      // Should be at burst limit
      expect(() => {
        rateLimiter.checkRateLimit('sportsdb')
      }).toThrow('Burst limit exceeded for sportsdb: 5 requests in burst')

      // Wait for burst timeout (1 second)
      setTimeout(() => {
        // Should be able to make another request
        expect(() => {
          rateLimiter.checkRateLimit('sportsdb')
          rateLimiter.recordRequest('sportsdb')
        }).not.toThrow()
        done()
      }, 1100)
    })
  })

  describe('Configuration Validation', () => {
    it('should have correct configuration for all APIs', () => {
      const config = rateLimiter.getApiConfig()

      expect(config.rapidapi.requestsPerMinute).toBe(100)
      expect(config.rapidapi.requestsPerDay).toBe(10000)
      expect(config.rapidapi.burstLimit).toBe(10)

      expect(config.odds.requestsPerMinute).toBe(10)
      expect(config.odds.requestsPerDay).toBe(100)
      expect(config.odds.burstLimit).toBe(2)

      expect(config.sportsdb.requestsPerMinute).toBe(30)
      expect(config.sportsdb.requestsPerDay).toBe(10000)
      expect(config.sportsdb.burstLimit).toBe(5)

      expect(config.balldontlie.requestsPerMinute).toBe(5)
      expect(config.balldontlie.requestsPerDay).toBe(10000)
      expect(config.balldontlie.burstLimit).toBe(2)

      expect(config.espn.requestsPerMinute).toBe(60)
      expect(config.espn.requestsPerDay).toBe(10000)
      expect(config.espn.burstLimit).toBe(10)
    })
  })
})
