/**
 * Comprehensive API Integration Tests
 * Tests all major API endpoints with real data
 */

import { NextRequest } from 'next/server'

// Test configuration
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'
const TEST_TIMEOUT = 30000 // 30 seconds

describe(
  'API Integration Tests',
  () => {
    describe('Health and Status Endpoints', () => {
      it('should return health status', async () => {
        const response = await fetch(`${BASE_URL}/health`)
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.success).toBe(true)
        expect(data.status).toBe('healthy')
        expect(data.timestamp).toBeDefined()
      })

      it('should return detailed health status', async () => {
        const response = await fetch(`${BASE_URL}/health/status`)
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.success).toBe(true)
        expect(data.data).toBeDefined()
        expect(data.data.status).toBe('healthy')
      })

      it('should return database status', async () => {
        const response = await fetch(`${BASE_URL}/database/status`)
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.success).toBe(true)
        expect(data.data).toBeDefined()
      })
    })

    describe('Sports Configuration', () => {
      it('should return supported sports', async () => {
        const response = await fetch(`${BASE_URL}/sports`)
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.success).toBe(true)
        expect(Array.isArray(data.data)).toBe(true)
        expect(data.data.length).toBeGreaterThan(0)
      })

      it('should validate sport parameters', async () => {
        const response = await fetch(`${BASE_URL}/sports?invalid=sport`)
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.success).toBe(true)
      })
    })

    describe('Database-First APIs', () => {
      const testSports = ['basketball', 'football', 'soccer', 'hockey', 'baseball']

      testSports.forEach(sport => {
        describe(`${sport} Data APIs`, () => {
          it(`should return ${sport} teams`, async () => {
            const response = await fetch(`${BASE_URL}/database-first/teams?sport=${sport}`)
            const data = await response.json()

            expect(response.status).toBe(200)
            expect(data.success).toBe(true)
            expect(Array.isArray(data.data)).toBe(true)
          })

          it(`should return ${sport} games`, async () => {
            const response = await fetch(`${BASE_URL}/database-first/games?sport=${sport}`)
            const data = await response.json()

            expect(response.status).toBe(200)
            expect(data.success).toBe(true)
            expect(Array.isArray(data.data)).toBe(true)
          })

          it(`should return ${sport} odds`, async () => {
            const response = await fetch(`${BASE_URL}/database-first/odds?sport=${sport}`)
            const data = await response.json()

            expect(response.status).toBe(200)
            expect(data.success).toBe(true)
            expect(Array.isArray(data.data)).toBe(true)
          })

          it(`should return ${sport} standings`, async () => {
            const response = await fetch(`${BASE_URL}/database-first/standings?sport=${sport}`)
            const data = await response.json()

            expect(response.status).toBe(200)
            expect(data.success).toBe(true)
            expect(Array.isArray(data.data)).toBe(true)
          })

          it(`should return ${sport} predictions`, async () => {
            const response = await fetch(`${BASE_URL}/database-first/predictions?sport=${sport}`)
            const data = await response.json()

            expect(response.status).toBe(200)
            expect(data.success).toBe(true)
            expect(Array.isArray(data.data)).toBe(true)
          })
        })
      })
    })

    describe('Analytics APIs', () => {
      const testSports = ['basketball', 'football', 'soccer']

      testSports.forEach(sport => {
        describe(`${sport} Analytics`, () => {
          it(`should return ${sport} analytics`, async () => {
            const response = await fetch(`${BASE_URL}/analytics?sport=${sport}`)
            const data = await response.json()

            expect(response.status).toBe(200)
            expect(data.success).toBe(true)
            expect(data.data).toBeDefined()
          })

          it(`should return ${sport} analytics stats`, async () => {
            const response = await fetch(`${BASE_URL}/analytics/stats?sport=${sport}`)
            const data = await response.json()

            expect(response.status).toBe(200)
            expect(data.success).toBe(true)
            expect(data.data).toBeDefined()
          })

          it(`should return ${sport} team performance`, async () => {
            const response = await fetch(`${BASE_URL}/analytics/team-performance?sport=${sport}`)
            const data = await response.json()

            expect(response.status).toBe(200)
            expect(data.success).toBe(true)
            // Should either return team data or list of available teams
            expect(data.team || data.teams).toBeDefined()
          })

          it(`should return ${sport} trends with timeout handling`, async () => {
            const response = await fetch(`${BASE_URL}/analytics/trends?sport=${sport}`)
            const data = await response.json()

            expect(response.status).toBe(200)
            expect(data.success).toBe(true)
            expect(data.trends).toBeDefined()
            expect(data.meta).toBeDefined()
          })
        })
      })
    })

    describe('Live Data APIs', () => {
      it('should return live scores', async () => {
        const response = await fetch(`${BASE_URL}/live-scores`)
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.success).toBe(true)
        expect(Array.isArray(data.data)).toBe(true)
      })

      it('should return live updates', async () => {
        const response = await fetch(`${BASE_URL}/live-updates`)
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.success).toBe(true)
        expect(data.live).toBeDefined()
        expect(data.recent).toBeDefined()
        expect(data.upcoming).toBeDefined()
      })

      it('should return live updates for specific sport', async () => {
        const response = await fetch(`${BASE_URL}/live-updates?sport=basketball`)
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.success).toBe(true)
        expect(data.sport).toBe('basketball')
      })

      it('should return all sports live updates', async () => {
        const response = await fetch(`${BASE_URL}/live-updates/all`)
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.success).toBe(true)
        expect(data.sports).toBeDefined()
      })
    })

    describe('Predictions and Value Betting', () => {
      it('should return value bets', async () => {
        const response = await fetch(`${BASE_URL}/value-bets`)
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.success).toBe(true)
        expect(Array.isArray(data.data)).toBe(true)
      })

      it('should return value bets for specific sport', async () => {
        const response = await fetch(`${BASE_URL}/value-bets?sport=basketball`)
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.success).toBe(true)
        expect(Array.isArray(data.data)).toBe(true)
      })

      it('should return upcoming predictions', async () => {
        const response = await fetch(`${BASE_URL}/predictions/upcoming`)
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.success).toBe(true)
        expect(Array.isArray(data.data)).toBe(true)
      })

      it('should generate predictions', async () => {
        const response = await fetch(`${BASE_URL}/predictions/generate?sport=basketball`, {
          method: 'POST',
        })
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.success).toBe(true)
        expect(Array.isArray(data.predictions)).toBe(true)
      })
    })

    describe('Player and Team Data', () => {
      it('should return players', async () => {
        const response = await fetch(`${BASE_URL}/players`)
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.success).toBe(true)
        expect(Array.isArray(data.data)).toBe(true)
      })

      it('should return players for specific sport', async () => {
        const response = await fetch(`${BASE_URL}/players?sport=basketball`)
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.success).toBe(true)
        expect(Array.isArray(data.data)).toBe(true)
      })

      it('should return teams', async () => {
        const response = await fetch(`${BASE_URL}/teams`)
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.success).toBe(true)
        expect(Array.isArray(data.data)).toBe(true)
      })

      it('should return teams for specific sport', async () => {
        const response = await fetch(`${BASE_URL}/teams?sport=basketball`)
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.success).toBe(true)
        expect(Array.isArray(data.data)).toBe(true)
      })

      it('should return player stats', async () => {
        const response = await fetch(`${BASE_URL}/player-stats`)
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.success).toBe(true)
        expect(Array.isArray(data.data)).toBe(true)
      })

      it('should return team stats', async () => {
        const response = await fetch(`${BASE_URL}/team-stats`)
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.success).toBe(true)
        expect(Array.isArray(data.data)).toBe(true)
      })
    })

    describe('Admin and Monitoring', () => {
      it('should return API status', async () => {
        const response = await fetch(`${BASE_URL}/admin/api-status`)
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.success).toBe(true)
        expect(data.data).toBeDefined()
      })

      it('should return database audit', async () => {
        const response = await fetch(`${BASE_URL}/admin/database-audit`)
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.success).toBe(true)
        expect(data.data).toBeDefined()
      })

      it('should return database schema', async () => {
        const response = await fetch(`${BASE_URL}/database/schema`)
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.success).toBe(true)
        expect(data.data).toBeDefined()
      })

      it('should return database integrity check', async () => {
        const response = await fetch(`${BASE_URL}/database/integrity`)
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.success).toBe(true)
        expect(data.data).toBeDefined()
      })
    })

    describe('Error Handling', () => {
      it('should handle invalid endpoints gracefully', async () => {
        const response = await fetch(`${BASE_URL}/invalid-endpoint`)

        expect(response.status).toBe(404)
      })

      it('should handle invalid sport parameters', async () => {
        const response = await fetch(`${BASE_URL}/teams?sport=invalid-sport`)
        const data = await response.json()

        expect(response.status).toBe(400)
        expect(data.success).toBe(false)
        expect(data.error).toBeDefined()
      })

      it('should handle missing required parameters', async () => {
        const response = await fetch(`${BASE_URL}/analytics/team-performance`)
        const data = await response.json()

        expect(response.status).toBe(400)
        expect(data.success).toBe(false)
        expect(data.error).toBeDefined()
      })
    })

    describe('Performance and Caching', () => {
      it('should respond within acceptable time limits', async () => {
        const startTime = Date.now()
        const response = await fetch(`${BASE_URL}/health`)
        const endTime = Date.now()

        expect(response.status).toBe(200)
        expect(endTime - startTime).toBeLessThan(5000) // 5 seconds
      })

      it('should cache responses appropriately', async () => {
        // First request
        const response1 = await fetch(`${BASE_URL}/sports`)
        const data1 = await response1.json()

        // Second request (should be cached)
        const response2 = await fetch(`${BASE_URL}/sports`)
        const data2 = await response2.json()

        expect(response1.status).toBe(200)
        expect(response2.status).toBe(200)
        expect(data1).toEqual(data2)
      })

      it('should handle concurrent requests', async () => {
        const promises = Array.from({ length: 10 }, () => fetch(`${BASE_URL}/health`))

        const responses = await Promise.all(promises)

        responses.forEach(response => {
          expect(response.status).toBe(200)
        })
      })
    })

    describe('Data Consistency', () => {
      it('should return consistent data structures', async () => {
        const endpoints = ['/teams', '/players', '/games', '/odds', '/predictions']

        for (const endpoint of endpoints) {
          const response = await fetch(`${BASE_URL}${endpoint}`)
          const data = await response.json()

          expect(response.status).toBe(200)
          expect(data.success).toBe(true)
          expect(data.data).toBeDefined()
          expect(data.meta).toBeDefined()
          expect(data.meta.timestamp).toBeDefined()
        }
      })

      it('should return consistent error structures', async () => {
        const response = await fetch(`${BASE_URL}/teams?sport=invalid-sport`)
        const data = await response.json()

        expect(response.status).toBe(400)
        expect(data.success).toBe(false)
        expect(data.error).toBeDefined()
        expect(data.timestamp).toBeDefined()
      })
    })
  },
  TEST_TIMEOUT
)
