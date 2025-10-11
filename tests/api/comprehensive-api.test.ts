/**
 * Comprehensive API Test Suite
 * Tests all API endpoints with real data validation
 * Ensures no mock data, proper error handling, and real Supabase integration
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals'

// Test configuration
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
const API_TIMEOUT = 30000 // 30 seconds for database operations

// Test data - using real team/player names from database
const TEST_DATA = {
  teams: {
    nfl: ['Kansas City Chiefs', 'Buffalo Bills', 'Miami Dolphins'],
    nba: ['Los Angeles Lakers', 'Boston Celtics', 'Golden State Warriors'],
    mlb: ['New York Yankees', 'Los Angeles Dodgers', 'Atlanta Braves'],
    nhl: ['Boston Bruins', 'Toronto Maple Leafs', 'Edmonton Oilers'],
  },
  players: {
    nfl: ['Patrick Mahomes', 'Josh Allen', 'Tua Tagovailoa'],
    nba: ['LeBron James', 'Jayson Tatum', 'Stephen Curry'],
    mlb: ['Aaron Judge', 'Mookie Betts', 'Ronald Acuña Jr.'],
    nhl: ['Brad Marchand', 'Auston Matthews', 'Connor McDavid'],
  },
  sports: ['nfl', 'nba', 'mlb', 'nhl'],
  leagues: ['NFL', 'NBA', 'MLB', 'NHL'],
}

// Helper function to make API requests
async function apiRequest(
  endpoint: string,
  options: RequestInit = {}
): Promise<{
  status: number
  data: any
  error?: string
}> {
  const url = `${BASE_URL}${endpoint}`

  try {
    const response = await fetch(url, {
      timeout: API_TIMEOUT,
      ...options,
    })

    const data = await response.json().catch(() => null)

    return {
      status: response.status,
      data,
      error: response.status >= 400 ? `HTTP ${response.status}` : undefined,
    }
  } catch (error) {
    return {
      status: 0,
      data: null,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

// Helper function to validate API response structure
function validateApiResponse(response: any, expectedFields: string[] = []): boolean {
  if (!response || typeof response !== 'object') return false

  // Check for common API response patterns
  const hasSuccessField = 'success' in response
  const hasDataField = 'data' in response
  const hasErrorField = 'error' in response

  // At least one of these should be present
  if (!hasSuccessField && !hasDataField && !hasErrorField) return false

  // Check expected fields
  for (const field of expectedFields) {
    if (!(field in response)) return false
  }

  return true
}

describe('Comprehensive API Test Suite', () => {
  beforeAll(async () => {
    console.log('Starting comprehensive API tests...')
    console.log(`Base URL: ${BASE_URL}`)
    console.log(`Test timeout: ${API_TIMEOUT}ms`)
  })

  afterAll(async () => {
    console.log('Comprehensive API tests completed')
  })

  describe('Core Data APIs', () => {
    describe('Teams API', () => {
      it('should fetch teams for all sports', async () => {
        for (const sport of TEST_DATA.sports) {
          const response = await apiRequest(`/api/teams?sport=${sport}`)

          expect(response.status).toBe(200)
          expect(response.data).toBeDefined()
          expect(Array.isArray(response.data)).toBe(true)

          if (response.data.length > 0) {
            expect(response.data[0]).toHaveProperty('name')
            expect(response.data[0]).toHaveProperty('sport')
            expect(response.data[0].sport).toBe(sport)
          }
        }
      })

      it('should fetch individual team details', async () => {
        for (const sport of TEST_DATA.sports) {
          const teams = TEST_DATA.teams[sport as keyof typeof TEST_DATA.teams]

          for (const teamName of teams) {
            const response = await apiRequest(
              `/api/teams?name=${encodeURIComponent(teamName)}&sport=${sport}`
            )

            expect(response.status).toBe(200)
            expect(response.data).toBeDefined()

            if (Array.isArray(response.data) && response.data.length > 0) {
              expect(response.data[0].name).toBe(teamName)
              expect(response.data[0].sport).toBe(sport)
            }
          }
        }
      })

      it('should fetch team logos', async () => {
        const response = await apiRequest('/api/teams/logo?sport=nfl&team=Kansas City Chiefs')

        expect(response.status).toBe(200)
        expect(response.data).toBeDefined()
        expect(response.data).toHaveProperty('url')
        expect(typeof response.data.url).toBe('string')
        expect(response.data.url.length).toBeGreaterThan(0)
      })
    })

    describe('Players API', () => {
      it('should fetch players for all sports', async () => {
        for (const sport of TEST_DATA.sports) {
          const response = await apiRequest(`/api/players?sport=${sport}`)

          expect(response.status).toBe(200)
          expect(response.data).toBeDefined()
          expect(Array.isArray(response.data)).toBe(true)

          if (response.data.length > 0) {
            expect(response.data[0]).toHaveProperty('name')
            expect(response.data[0]).toHaveProperty('sport')
            expect(response.data[0].sport).toBe(sport)
          }
        }
      })

      it('should fetch individual player details', async () => {
        for (const sport of TEST_DATA.sports) {
          const players = TEST_DATA.players[sport as keyof typeof TEST_DATA.players]

          for (const playerName of players) {
            const response = await apiRequest(
              `/api/players?name=${encodeURIComponent(playerName)}&sport=${sport}`
            )

            expect(response.status).toBe(200)
            expect(response.data).toBeDefined()

            if (Array.isArray(response.data) && response.data.length > 0) {
              expect(response.data[0].name).toBe(playerName)
              expect(response.data[0].sport).toBe(sport)
            }
          }
        }
      })
    })

    describe('Games API', () => {
      it('should fetch games for all sports', async () => {
        for (const sport of TEST_DATA.sports) {
          const response = await apiRequest(`/api/games?sport=${sport}`)

          expect(response.status).toBe(200)
          expect(response.data).toBeDefined()
          expect(Array.isArray(response.data)).toBe(true)

          if (response.data.length > 0) {
            expect(response.data[0]).toHaveProperty('home_team')
            expect(response.data[0]).toHaveProperty('away_team')
            expect(response.data[0]).toHaveProperty('sport')
            expect(response.data[0].sport).toBe(sport)
          }
        }
      })

      it("should fetch today's games", async () => {
        const response = await apiRequest('/api/database-first/games/today')

        expect(response.status).toBe(200)
        expect(response.data).toBeDefined()
        expect(Array.isArray(response.data)).toBe(true)
      })
    })

    describe('Live Scores API', () => {
      it('should fetch live scores', async () => {
        const response = await apiRequest('/api/live-scores')

        expect(response.status).toBe(200)
        expect(response.data).toBeDefined()
        expect(Array.isArray(response.data)).toBe(true)
      })

      it('should fetch live updates', async () => {
        const response = await apiRequest('/api/live-updates')

        expect(response.status).toBe(200)
        expect(response.data).toBeDefined()
        expect(Array.isArray(response.data)).toBe(true)
      })
    })
  })

  describe('Image Service APIs', () => {
    describe('Image Event Monitoring', () => {
      it('should accept valid image event data', async () => {
        const eventData = {
          entityType: 'team',
          entityName: 'Kansas City Chiefs',
          sport: 'nfl',
          source: 'espn-cdn',
          success: true,
          url: 'https://example.com/logo.png',
          loadTime: 150,
        }

        const response = await apiRequest('/api/monitor/image-event', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(eventData),
        })

        expect(response.status).toBe(200)
        expect(response.data).toBeDefined()
        expect(response.data.success).toBe(true)
      })

      it('should reject invalid image event data', async () => {
        const invalidData = {
          entityType: 'team',
          // Missing required fields
        }

        const response = await apiRequest('/api/monitor/image-event', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(invalidData),
        })

        expect(response.status).toBe(400)
        expect(response.data).toBeDefined()
        expect(response.data.success).toBe(false)
        expect(response.data.error).toContain('Missing required fields')
      })

      it('should reject empty request body', async () => {
        const response = await apiRequest('/api/monitor/image-event', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: '',
        })

        expect(response.status).toBe(400)
        expect(response.data).toBeDefined()
        expect(response.data.success).toBe(false)
        expect(response.data.error).toContain('Request body is empty')
      })

      it('should reject malformed JSON', async () => {
        const response = await apiRequest('/api/monitor/image-event', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: '{ invalid json }',
        })

        expect(response.status).toBe(400)
        expect(response.data).toBeDefined()
        expect(response.data.success).toBe(false)
        expect(response.data.error).toContain('Invalid JSON')
      })
    })

    describe('Image Health Monitoring', () => {
      it('should return image health metrics', async () => {
        const response = await apiRequest('/api/admin/image-health')

        expect(response.status).toBe(200)
        expect(response.data).toBeDefined()
        expect(response.data).toHaveProperty('totalRequests')
        expect(response.data).toHaveProperty('successRate')
        expect(response.data).toHaveProperty('avgLoadTime')
        expect(typeof response.data.totalRequests).toBe('number')
        expect(typeof response.data.successRate).toBe('number')
        expect(typeof response.data.avgLoadTime).toBe('number')
      })

      it('should return image statistics', async () => {
        const response = await apiRequest('/api/admin/image-stats')

        expect(response.status).toBe(200)
        expect(response.data).toBeDefined()
        expect(response.data).toHaveProperty('cacheHits')
        expect(response.data).toHaveProperty('cacheMisses')
        expect(response.data).toHaveProperty('fallbackUsage')
        expect(typeof response.data.cacheHits).toBe('number')
        expect(typeof response.data.cacheMisses).toBe('number')
        expect(typeof response.data.fallbackUsage).toBe('number')
      })
    })

    describe('Image Optimization', () => {
      it('should optimize images', async () => {
        const response = await apiRequest('/api/image-optimizer', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url: 'https://example.com/image.jpg',
            width: 200,
            height: 200,
          }),
        })

        expect(response.status).toBe(200)
        expect(response.data).toBeDefined()
        expect(response.data).toHaveProperty('optimizedUrl')
        expect(typeof response.data.optimizedUrl).toBe('string')
      })
    })
  })

  describe('Analytics APIs', () => {
    it('should fetch analytics data', async () => {
      const response = await apiRequest('/api/analytics')

      expect(response.status).toBe(200)
      expect(response.data).toBeDefined()
      expect(Array.isArray(response.data)).toBe(true)
    })

    it('should fetch trends data', async () => {
      const response = await apiRequest('/api/trends')

      expect(response.status).toBe(200)
      expect(response.data).toBeDefined()
      expect(Array.isArray(response.data)).toBe(true)
    })

    it('should fetch team performance analytics', async () => {
      const response = await apiRequest('/api/analytics/team-performance')

      expect(response.status).toBe(200)
      expect(response.data).toBeDefined()
    })

    it('should fetch prediction accuracy', async () => {
      const response = await apiRequest('/api/analytics/prediction-accuracy')

      expect(response.status).toBe(200)
      expect(response.data).toBeDefined()
    })
  })

  describe('Predictions APIs', () => {
    it('should generate predictions', async () => {
      const response = await apiRequest('/api/predictions/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sport: 'nfl',
          gameId: 'test-game-1',
        }),
      })

      expect(response.status).toBe(200)
      expect(response.data).toBeDefined()
    })

    it('should fetch upcoming predictions', async () => {
      const response = await apiRequest('/api/predictions/upcoming')

      expect(response.status).toBe(200)
      expect(response.data).toBeDefined()
      expect(Array.isArray(response.data)).toBe(true)
    })

    it('should fetch sport-specific predictions', async () => {
      for (const sport of TEST_DATA.sports) {
        const response = await apiRequest(`/api/predictions/${sport}`)

        expect(response.status).toBe(200)
        expect(response.data).toBeDefined()
        expect(Array.isArray(response.data)).toBe(true)
      }
    })
  })

  describe('Administrative APIs', () => {
    it('should return API status', async () => {
      const response = await apiRequest('/api/admin/api-status')

      expect(response.status).toBe(200)
      expect(response.data).toBeDefined()
      expect(response.data).toHaveProperty('status')
      expect(response.data).toHaveProperty('timestamp')
    })

    it('should return database status', async () => {
      const response = await apiRequest('/api/database/status')

      expect(response.status).toBe(200)
      expect(response.data).toBeDefined()
      expect(response.data).toHaveProperty('connected')
      expect(typeof response.data.connected).toBe('boolean')
    })

    it('should return health status', async () => {
      const response = await apiRequest('/api/health')

      expect(response.status).toBe(200)
      expect(response.data).toBeDefined()
      expect(response.data).toHaveProperty('status')
      expect(response.data).toHaveProperty('timestamp')
    })

    it('should clear cache', async () => {
      const response = await apiRequest('/api/health/clear-cache', {
        method: 'POST',
      })

      expect(response.status).toBe(200)
      expect(response.data).toBeDefined()
      expect(response.data.success).toBe(true)
    })
  })

  describe('Database-First APIs', () => {
    it('should fetch database-first teams', async () => {
      const response = await apiRequest('/api/database-first/teams')

      expect(response.status).toBe(200)
      expect(response.data).toBeDefined()
      expect(Array.isArray(response.data)).toBe(true)
    })

    it('should fetch database-first standings', async () => {
      const response = await apiRequest('/api/database-first/standings')

      expect(response.status).toBe(200)
      expect(response.data).toBeDefined()
      expect(Array.isArray(response.data)).toBe(true)
    })

    it('should fetch database-first predictions', async () => {
      const response = await apiRequest('/api/database-first/predictions')

      expect(response.status).toBe(200)
      expect(response.data).toBeDefined()
      expect(Array.isArray(response.data)).toBe(true)
    })

    it('should fetch database-first odds', async () => {
      const response = await apiRequest('/api/database-first/odds')

      expect(response.status).toBe(200)
      expect(response.data).toBeDefined()
      expect(Array.isArray(response.data)).toBe(true)
    })
  })

  describe('Error Handling', () => {
    it('should handle non-existent endpoints gracefully', async () => {
      const response = await apiRequest('/api/non-existent-endpoint')

      expect(response.status).toBe(404)
    })

    it('should handle invalid query parameters', async () => {
      const response = await apiRequest('/api/teams?invalid=param&another=invalid')

      // Should either return 200 with empty results or 400 with error
      expect([200, 400]).toContain(response.status)
    })

    it('should handle malformed requests', async () => {
      const response = await apiRequest('/api/monitor/image-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'not json',
      })

      expect(response.status).toBe(400)
      expect(response.data).toBeDefined()
      expect(response.data.success).toBe(false)
    })
  })

  describe('Performance Tests', () => {
    it('should respond within acceptable time limits', async () => {
      const startTime = Date.now()
      const response = await apiRequest('/api/teams?sport=nfl')
      const endTime = Date.now()

      expect(response.status).toBe(200)
      expect(endTime - startTime).toBeLessThan(5000) // Less than 5 seconds
    })

    it('should handle concurrent requests', async () => {
      const promises = Array.from({ length: 10 }, (_, i) =>
        apiRequest(`/api/teams?sport=${TEST_DATA.sports[i % TEST_DATA.sports.length]}`)
      )

      const responses = await Promise.all(promises)

      responses.forEach(response => {
        expect(response.status).toBe(200)
        expect(response.data).toBeDefined()
      })
    })
  })
})

// Export test utilities for other test files
export { apiRequest, validateApiResponse, TEST_DATA }
