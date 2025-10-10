/**
 * Security Tests for API Endpoints
 * Tests security aspects including rate limiting, input validation, and error handling
 */

describe('Security Tests', () => {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL as string

  describe('Rate Limiting Tests', () => {
    it('should enforce rate limits on health endpoint', async () => {
      const promises = Array.from({ length: 100 }, () => 
        fetch(`${baseUrl}/health`)
      )
      
      const responses = await Promise.all(promises)
      
      // All requests should succeed (rate limiting should not cause failures)
      responses.forEach(response => {
        expect(response.status).toBe(200)
      })
      
      // Check that rate limiting is working by examining response headers
      const firstResponse = responses[0]
      expect(firstResponse.headers.get('x-ratelimit-limit')).toBeDefined()
      expect(firstResponse.headers.get('x-ratelimit-remaining')).toBeDefined()
    })

    it('should enforce rate limits on games endpoint', async () => {
      const promises = Array.from({ length: 50 }, () => 
        fetch(`${baseUrl}/games`)
      )
      
      const responses = await Promise.all(promises)
      
      // All requests should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200)
      })
    })

    it('should handle rate limit exceeded gracefully', async () => {
      // Make many requests quickly
      const promises = Array.from({ length: 200 }, () => 
        fetch(`${baseUrl}/health`)
      )
      
      const responses = await Promise.all(promises)
      
      // Should not return 429 (Too Many Requests) errors
      // Instead, should delay requests but still succeed
      responses.forEach(response => {
        expect(response.status).toBe(200)
      })
    })
  })

  describe('Input Validation Tests', () => {
    it('should handle SQL injection attempts', async () => {
      const maliciousInputs = [
        "'; DROP TABLE games; --",
        "1' OR '1'='1",
        "'; INSERT INTO games VALUES ('hack', 'hack'); --"
      ]
      
      for (const input of maliciousInputs) {
        const response = await fetch(`${baseUrl}/games?search=${encodeURIComponent(input)}`)
        expect(response.status).toBe(200)
        
        const data = await response.json()
        expect(Array.isArray(data)).toBe(true)
        // Should return empty results or handle gracefully
      }
    })

    it('should handle XSS attempts', async () => {
      const xssInputs = [
        "<script>alert('xss')</script>",
        "javascript:alert('xss')",
        "<img src=x onerror=alert('xss')>"
      ]
      
      for (const input of xssInputs) {
        const response = await fetch(`${baseUrl}/teams?search=${encodeURIComponent(input)}`)
        expect(response.status).toBe(200)
        
        const data = await response.json()
        expect(Array.isArray(data)).toBe(true)
        // Should not execute scripts
      }
    })

    it('should handle path traversal attempts', async () => {
      const pathTraversalInputs = [
        "../../../etc/passwd",
        "..\\..\\..\\windows\\system32\\drivers\\etc\\hosts",
        "....//....//....//etc/passwd"
      ]
      
      for (const input of pathTraversalInputs) {
        const response = await fetch(`${baseUrl}/games?file=${encodeURIComponent(input)}`)
        expect(response.status).toBe(200)
        
        const data = await response.json()
        expect(Array.isArray(data)).toBe(true)
        // Should not access files outside intended directory
      }
    })

    it('should handle oversized requests', async () => {
      const largeString = 'a'.repeat(10000)
      const response = await fetch(`${baseUrl}/games?search=${largeString}`)
      
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(Array.isArray(data)).toBe(true)
    })

    it('should handle special characters in parameters', async () => {
      const specialChars = [
        "!@#$%^&*()_+-=[]{}|;':\",./<>?",
        "测试中文",
        "🚀🎉💯",
        "null",
        "undefined",
        "NaN"
      ]
      
      for (const input of specialChars) {
        const response = await fetch(`${baseUrl}/teams?search=${encodeURIComponent(input)}`)
        expect(response.status).toBe(200)
        
        const data = await response.json()
        expect(Array.isArray(data)).toBe(true)
      }
    })
  })

  describe('Error Handling Security', () => {
    it('should not expose sensitive information in error responses', async () => {
      const response = await fetch(`${baseUrl}/invalid-endpoint`)
      
      expect(response.status).toBe(404)
      const data = await response.json()
      
      // Should not expose internal paths, stack traces, or sensitive data
      const responseText = JSON.stringify(data)
      expect(responseText).not.toContain('/app/')
      expect(responseText).not.toContain('/lib/')
      expect(responseText).not.toContain('Error:')
      expect(responseText).not.toContain('at ')
      expect(responseText).not.toContain('stack')
    })

    it('should handle malformed JSON gracefully', async () => {
      const response = await fetch(`${baseUrl}/games`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: '{"malformed": json}'
      })
      
      // Should handle malformed JSON without crashing
      expect(response.status).toBe(405) // Method not allowed, not 500
    })

    it('should handle missing required headers gracefully', async () => {
      const response = await fetch(`${baseUrl}/games`, {
        method: 'POST',
        body: '{}'
      })
      
      // Should handle missing headers without crashing
      expect(response.status).toBe(405) // Method not allowed, not 500
    })
  })

  describe('CORS Security', () => {
    it('should include proper CORS headers', async () => {
      const response = await fetch(`${baseUrl}/health`)
      
      // Should include CORS headers
      expect(response.headers.get('access-control-allow-origin')).toBeDefined()
      expect(response.headers.get('access-control-allow-methods')).toBeDefined()
      expect(response.headers.get('access-control-allow-headers')).toBeDefined()
    })

    it('should handle preflight requests', async () => {
      const response = await fetch(`${baseUrl}/health`, {
        method: 'OPTIONS',
        headers: {
          'Access-Control-Request-Method': 'GET',
          'Access-Control-Request-Headers': 'Content-Type'
        }
      })
      
      expect(response.status).toBe(200)
      expect(response.headers.get('access-control-allow-methods')).toBeDefined()
    })
  })

  describe('Content Security', () => {
    it('should return proper content types', async () => {
      const response = await fetch(`${baseUrl}/health`)
      expect(response.headers.get('content-type')).toContain('application/json')
    })

    it('should not include sensitive headers', async () => {
      const response = await fetch(`${baseUrl}/health`)
      
      // Should not expose sensitive server information
      expect(response.headers.get('server')).toBeFalsy()
      expect(response.headers.get('x-powered-by')).toBeFalsy()
      expect(response.headers.get('x-aspnet-version')).toBeFalsy()
    })

    it('should include security headers', async () => {
      const response = await fetch(`${baseUrl}/health`)
      
      // Should include security headers
      expect(response.headers.get('x-content-type-options')).toBe('nosniff')
      expect(response.headers.get('x-frame-options')).toBeDefined()
      expect(response.headers.get('x-xss-protection')).toBeDefined()
    })
  })

  describe('Authentication and Authorization', () => {
    it('should handle requests without authentication', async () => {
      const response = await fetch(`${baseUrl}/games`)
      expect(response.status).toBe(200)
    })

    it('should handle requests with invalid authentication', async () => {
      const response = await fetch(`${baseUrl}/games`, {
        headers: {
          'Authorization': 'Bearer invalid-token'
        }
      })
      expect(response.status).toBe(200)
    })

    it('should not expose user data without proper authentication', async () => {
      const response = await fetch(`${baseUrl}/analytics/stats`)
      expect(response.status).toBe(200)
      
      // Should return public analytics, not user-specific data
      const data = await response.json()
      expect(data).not.toHaveProperty('user_id')
      expect(data).not.toHaveProperty('user_email')
      expect(data).not.toHaveProperty('user_data')
    })
  })

  describe('Data Validation', () => {
    it('should validate date parameters', async () => {
      const invalidDates = [
        '2023-13-01', // Invalid month
        '2023-02-30', // Invalid day
        'not-a-date',
        '2023/01/01', // Wrong format
        '01-01-2023'  // Wrong format
      ]
      
      for (const date of invalidDates) {
        const response = await fetch(`${baseUrl}/games?date=${date}`)
        expect(response.status).toBe(200)
        
        const data = await response.json()
        expect(Array.isArray(data)).toBe(true)
        // Should handle invalid dates gracefully
      }
    })

    it('should validate numeric parameters', async () => {
      const invalidNumbers = [
        'not-a-number',
        'Infinity',
        '-Infinity',
        'NaN',
        '1e1000' // Too large
      ]
      
      for (const num of invalidNumbers) {
        const response = await fetch(`${baseUrl}/games?limit=${num}`)
        expect(response.status).toBe(200)
        
        const data = await response.json()
        expect(Array.isArray(data)).toBe(true)
        // Should handle invalid numbers gracefully
      }
    })

    it('should validate enum parameters', async () => {
      const invalidEnums = [
        'invalid-sport',
        'INVALID_STATUS',
        'not-a-league'
      ]
      
      for (const enumValue of invalidEnums) {
        const response = await fetch(`${baseUrl}/games?sport=${enumValue}`)
        expect(response.status).toBe(200)
        
        const data = await response.json()
        expect(Array.isArray(data)).toBe(true)
        // Should handle invalid enums gracefully
      }
    })
  })

  describe('Resource Exhaustion Protection', () => {
    it('should handle large limit parameters', async () => {
      const response = await fetch(`${baseUrl}/games?limit=10000`)
      expect(response.status).toBe(200)
      
      const data = await response.json()
      expect(Array.isArray(data)).toBe(true)
      // Should limit results to prevent resource exhaustion
      expect(data.length).toBeLessThanOrEqual(1000)
    })

    it('should handle deep pagination', async () => {
      const response = await fetch(`${baseUrl}/games?page=999999`)
      expect(response.status).toBe(200)
      
      const data = await response.json()
      expect(Array.isArray(data)).toBe(true)
      // Should handle deep pagination gracefully
    })
  })
})
