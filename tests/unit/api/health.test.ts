/**
 * Real Integration Tests for Health API
 * Tests actual API endpoints with real data and real service calls
 */

describe('Health API Integration Tests', () => {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'

  describe('GET /api/health', () => {
    it('should return basic health status with real data', async () => {
      const response = await fetch(`${baseUrl}/health`)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toMatchObject({
        status: 'healthy',
        timestamp: expect.any(String),
        uptime: expect.any(Number),
        version: expect.any(String)
      })

      // Verify timestamp is recent (within last minute)
      const timestamp = new Date(data.timestamp)
      const now = new Date()
      expect(now.getTime() - timestamp.getTime()).toBeLessThan(60000)

      // Verify uptime is a positive number
      expect(data.uptime).toBeGreaterThan(0)
    })

    it('should return detailed health status with real service data', async () => {
      const response = await fetch(`${baseUrl}/health?detailed=true`)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toMatchObject({
        status: 'healthy',
        timestamp: expect.any(String),
        uptime: expect.any(Number),
        version: expect.any(String),
        environment: expect.any(Object),
        services: expect.any(Object),
        rateLimits: expect.any(Object),
        cache: expect.any(Object),
        apiTests: expect.any(Object),
        system: expect.any(Object)
      })

      // Verify system information is real
      expect(data.system.nodeVersion).toMatch(/^v\d+\.\d+\.\d+/)
      expect(data.system.platform).toBeDefined()
      expect(data.system.memory).toMatchObject({
        rss: expect.any(Number),
        heapTotal: expect.any(Number),
        heapUsed: expect.any(Number),
        external: expect.any(Number)
      })
    })

    it('should test real API connectivity', async () => {
      const response = await fetch(`${baseUrl}/health?detailed=true`)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.apiTests).toBeDefined()

      // Verify API tests contain real response times
      Object.values(data.apiTests).forEach((test: any) => {
        if (test.status === 'healthy') {
          expect(test.responseTime).toBeGreaterThan(0)
          expect(typeof test.fromCache).toBe('boolean')
        }
      })
    })

    it('should handle real rate limiting data', async () => {
      const response = await fetch(`${baseUrl}/health?detailed=true`)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.rateLimits).toBeDefined()

      // Verify rate limit data structure
      Object.values(data.rateLimits).forEach((service: any) => {
        expect(service).toMatchObject({
          requests: expect.any(Number),
          errors: expect.any(Number)
        })
        expect(service.requests).toBeGreaterThanOrEqual(0)
        expect(service.errors).toBeGreaterThanOrEqual(0)
      })
    })

    it('should provide real cache statistics', async () => {
      const response = await fetch(`${baseUrl}/health?detailed=true`)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.cache).toMatchObject({
        hits: expect.any(Number),
        misses: expect.any(Number),
        size: expect.any(Number)
      })

      expect(data.cache.hits).toBeGreaterThanOrEqual(0)
      expect(data.cache.misses).toBeGreaterThanOrEqual(0)
      expect(data.cache.size).toBeGreaterThanOrEqual(0)
    })

    it('should validate environment configuration', async () => {
      const response = await fetch(`${baseUrl}/health?detailed=true`)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.environment).toMatchObject({
        configured: expect.any(Boolean),
        missingKeys: expect.any(Array),
        invalidKeys: expect.any(Array),
        recommendations: expect.any(Array)
      })

      // Verify environment arrays contain strings
      data.environment.missingKeys.forEach((key: any) => {
        expect(typeof key).toBe('string')
      })
      data.environment.invalidKeys.forEach((key: any) => {
        expect(typeof key).toBe('string')
      })
      data.environment.recommendations.forEach((rec: any) => {
        expect(typeof rec).toBe('string')
      })
    })
  })
})
