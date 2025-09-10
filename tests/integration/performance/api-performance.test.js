/**
 * Performance Tests for API Endpoints
 * Tests response times and performance characteristics
 */

describe('API Performance Tests', () => {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'

  describe('Response Time Tests', () => {
    it('should respond to health endpoint within 500ms', async () => {
      const startTime = Date.now()
      const response = await fetch(`${baseUrl}/health`)
      const endTime = Date.now()
      
      expect(response.status).toBe(200)
      expect(endTime - startTime).toBeLessThan(500)
    })

    it('should respond to games endpoint within 2 seconds', async () => {
      const startTime = Date.now()
      const response = await fetch(`${baseUrl}/games`)
      const endTime = Date.now()
      
      expect(response.status).toBe(200)
      expect(endTime - startTime).toBeLessThan(2000)
    })

    it('should respond to teams endpoint within 2 seconds', async () => {
      const startTime = Date.now()
      const response = await fetch(`${baseUrl}/teams`)
      const endTime = Date.now()
      
      expect(response.status).toBe(200)
      expect(endTime - startTime).toBeLessThan(2000)
    })

    it('should respond to analytics endpoint within 1 second', async () => {
      const startTime = Date.now()
      const response = await fetch(`${baseUrl}/analytics/stats`)
      const endTime = Date.now()
      
      expect(response.status).toBe(200)
      expect(endTime - startTime).toBeLessThan(1000)
    })
  })

  describe('Concurrent Request Tests', () => {
    it('should handle 10 concurrent health requests', async () => {
      const promises = Array.from({ length: 10 }, () => 
        fetch(`${baseUrl}/health`)
      )
      
      const startTime = Date.now()
      const responses = await Promise.all(promises)
      const endTime = Date.now()
      
      // All requests should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200)
      })
      
      // Should complete within reasonable time
      expect(endTime - startTime).toBeLessThan(5000)
    })

    it('should handle 5 concurrent games requests', async () => {
      const promises = Array.from({ length: 5 }, () => 
        fetch(`${baseUrl}/games`)
      )
      
      const startTime = Date.now()
      const responses = await Promise.all(promises)
      const endTime = Date.now()
      
      // All requests should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200)
      })
      
      // Should complete within reasonable time
      expect(endTime - startTime).toBeLessThan(10000)
    })

    it('should handle mixed concurrent requests', async () => {
      const promises = [
        fetch(`${baseUrl}/health`),
        fetch(`${baseUrl}/games`),
        fetch(`${baseUrl}/teams`),
        fetch(`${baseUrl}/analytics/stats`)
      ]
      
      const startTime = Date.now()
      const responses = await Promise.all(promises)
      const endTime = Date.now()
      
      // All requests should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200)
      })
      
      // Should complete within reasonable time
      expect(endTime - startTime).toBeLessThan(15000)
    })
  })

  describe('Caching Performance Tests', () => {
    it('should cache games data and return faster on second request', async () => {
      // First request
      const startTime1 = Date.now()
      const response1 = await fetch(`${baseUrl}/games`)
      const endTime1 = Date.now()
      const firstRequestTime = endTime1 - startTime1
      
      expect(response1.status).toBe(200)
      
      // Second request (should be faster due to caching)
      const startTime2 = Date.now()
      const response2 = await fetch(`${baseUrl}/games`)
      const endTime2 = Date.now()
      const secondRequestTime = endTime2 - startTime2
      
      expect(response2.status).toBe(200)
      
      // Second request should be faster (or at least not significantly slower)
      expect(secondRequestTime).toBeLessThanOrEqual(firstRequestTime * 1.5)
    })

    it('should cache teams data and return faster on second request', async () => {
      // First request
      const startTime1 = Date.now()
      const response1 = await fetch(`${baseUrl}/teams`)
      const endTime1 = Date.now()
      const firstRequestTime = endTime1 - startTime1
      
      expect(response1.status).toBe(200)
      
      // Second request (should be faster due to caching)
      const startTime2 = Date.now()
      const response2 = await fetch(`${baseUrl}/teams`)
      const endTime2 = Date.now()
      const secondRequestTime = endTime2 - startTime2
      
      expect(response2.status).toBe(200)
      
      // Second request should be faster (or at least not significantly slower)
      expect(secondRequestTime).toBeLessThanOrEqual(firstRequestTime * 1.5)
    })
  })

  describe('Data Size Tests', () => {
    it('should return reasonable data sizes', async () => {
      const response = await fetch(`${baseUrl}/games`)
      const data = await response.json()
      
      // Games data should not be excessively large
      const dataSize = JSON.stringify(data).length
      expect(dataSize).toBeLessThan(1024 * 1024) // Less than 1MB
    })

    it('should return reasonable teams data sizes', async () => {
      const response = await fetch(`${baseUrl}/teams`)
      const data = await response.json()
      
      // Teams data should not be excessively large
      const dataSize = JSON.stringify(data).length
      expect(dataSize).toBeLessThan(512 * 1024) // Less than 512KB
    })
  })

  describe('Error Handling Performance', () => {
    it('should handle invalid endpoints quickly', async () => {
      const startTime = Date.now()
      const response = await fetch(`${baseUrl}/invalid-endpoint`)
      const endTime = Date.now()
      
      expect(response.status).toBe(404)
      expect(endTime - startTime).toBeLessThan(1000)
    })

    it('should handle malformed requests quickly', async () => {
      const startTime = Date.now()
      const response = await fetch(`${baseUrl}/games?invalid=param&malformed=`)
      const endTime = Date.now()
      
      expect(response.status).toBe(200)
      expect(endTime - startTime).toBeLessThan(2000)
    })
  })
})
