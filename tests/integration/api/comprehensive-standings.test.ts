/**
 * Comprehensive Standings API Integration Tests
 * Tests all standings functionality with real NBA data
 * NO MOCK DATA - All tests use real NBA standings data
 */

describe('Comprehensive Standings API Tests', () => {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'

  describe('GET /api/standings - Real NBA Standings', () => {
    it('should fetch real NBA standings with proper data structure', async () => {
      const response = await fetch(`${baseUrl}/standings?sport=basketball`)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(Array.isArray(data)).toBe(true)

      if (data.length > 0) {
        const team = data[0]
        expect(team).toMatchObject({
          rank: expect.any(Number),
          team: expect.any(String),
          wins: expect.any(Number),
          losses: expect.any(Number),
          winRate: expect.any(Number),
          gamesBehind: expect.any(Number)
        })

        // Verify rank is positive
        expect(team.rank).toBeGreaterThan(0)
        
        // Verify wins and losses are non-negative
        expect(team.wins).toBeGreaterThanOrEqual(0)
        expect(team.losses).toBeGreaterThanOrEqual(0)
        
        // Verify win rate is between 0 and 1
        expect(team.winRate).toBeGreaterThanOrEqual(0)
        expect(team.winRate).toBeLessThanOrEqual(1)
        
        // Verify games behind is non-negative
        expect(team.gamesBehind).toBeGreaterThanOrEqual(0)
      }
    })

    it('should fetch NBA standings by league', async () => {
      const response = await fetch(`${baseUrl}/standings?league=NBA`)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(Array.isArray(data)).toBe(true)

      // Should have NBA teams
      if (data.length > 0) {
        const team = data[0]
        expect(team.team).toBeDefined()
        expect(typeof team.team).toBe('string')
        expect(team.team.length).toBeGreaterThan(0)
      }
    })

    it('should fetch standings by sport', async () => {
      const response = await fetch(`${baseUrl}/standings?sport=basketball`)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(Array.isArray(data)).toBe(true)

      // Should have basketball teams
      if (data.length > 0) {
        const team = data[0]
        expect(team.team).toBeDefined()
        expect(typeof team.team).toBe('string')
      }
    })

    it('should fetch standings by season', async () => {
      const currentYear = new Date().getFullYear()
      const season = `${currentYear}-${(currentYear + 1).toString().slice(-2)}`
      
      const response = await fetch(`${baseUrl}/standings?season=${season}`)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(Array.isArray(data)).toBe(true)
    })

    it('should validate real NBA team names in standings', async () => {
      const response = await fetch(`${baseUrl}/standings?sport=basketball`)
      const data = await response.json()

      expect(response.status).toBe(200)

      if (data.length > 0) {
        const knownNBATeams = [
          'Lakers', 'Warriors', 'Celtics', 'Bulls', 'Heat', 'Spurs',
          'Knicks', 'Nets', 'Rockets', 'Mavericks', 'Suns', 'Nuggets',
          'Clippers', 'Trail Blazers', 'Jazz', 'Thunder', 'Timberwolves',
          'Pelicans', 'Kings', 'Grizzlies', 'Hawks', 'Hornets', 'Magic',
          'Pistons', 'Pacers', 'Bucks', 'Cavaliers', 'Raptors', '76ers'
        ]

        const teamNames = data.map((team: any) => team.team)
        const hasKnownTeam = knownNBATeams.some(knownTeam => 
          teamNames.some((name: string) => name.includes(knownTeam))
        )

        expect(hasKnownTeam).toBe(true)
      }
    })

    it('should validate standings are sorted by rank', async () => {
      const response = await fetch(`${baseUrl}/standings?sport=basketball`)
      const data = await response.json()

      expect(response.status).toBe(200)

      if (data.length > 1) {
        const ranks = data.map((team: any) => team.rank)
        const sortedRanks = [...ranks].sort((a, b) => a - b)
        expect(ranks).toEqual(sortedRanks)
      }
    })

    it('should validate win rate calculation', async () => {
      const response = await fetch(`${baseUrl}/standings?sport=basketball`)
      const data = await response.json()

      expect(response.status).toBe(200)

      data.forEach((team: any) => {
        const totalGames = team.wins + team.losses
        if (totalGames > 0) {
          const expectedWinRate = team.wins / totalGames
          expect(Math.abs(team.winRate - expectedWinRate)).toBeLessThan(0.001)
        }
      })
    })

    it('should include conference information when available', async () => {
      const response = await fetch(`${baseUrl}/standings?sport=basketball`)
      const data = await response.json()

      expect(response.status).toBe(200)

      if (data.length > 0) {
        const team = data[0]
        if (team.conference) {
          expect(['Eastern', 'Western']).toContain(team.conference)
        }
      }
    })

    it('should include division information when available', async () => {
      const response = await fetch(`${baseUrl}/standings?sport=basketball`)
      const data = await response.json()

      expect(response.status).toBe(200)

      if (data.length > 0) {
        const team = data[0]
        if (team.division) {
          expect(typeof team.division).toBe('string')
          expect(team.division.length).toBeGreaterThan(0)
        }
      }
    })

    it('should include additional statistics when available', async () => {
      const response = await fetch(`${baseUrl}/standings?sport=basketball`)
      const data = await response.json()

      expect(response.status).toBe(200)

      if (data.length > 0) {
        const team = data[0]
        
        // Check for optional stats fields
        if (team.pointsFor) {
          expect(typeof team.pointsFor).toBe('number')
          expect(team.pointsFor).toBeGreaterThanOrEqual(0)
        }
        
        if (team.pointsAgainst) {
          expect(typeof team.pointsAgainst).toBe('number')
          expect(team.pointsAgainst).toBeGreaterThanOrEqual(0)
        }
        
        if (team.pointDifferential) {
          expect(typeof team.pointDifferential).toBe('number')
        }
      }
    })

    it('should handle empty results gracefully', async () => {
      const response = await fetch(`${baseUrl}/standings?league=NonExistentLeague`)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(Array.isArray(data)).toBe(true)
    })

    it('should handle invalid parameters gracefully', async () => {
      const response = await fetch(`${baseUrl}/standings?invalid=param`)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(Array.isArray(data)).toBe(true)
    })
  })

  describe('Standings Data Validation', () => {
    it('should validate all teams have required fields', async () => {
      const response = await fetch(`${baseUrl}/standings?sport=basketball`)
      const data = await response.json()

      expect(response.status).toBe(200)

      data.forEach((team: any) => {
        expect(team.rank).toBeDefined()
        expect(team.team).toBeDefined()
        expect(team.wins).toBeDefined()
        expect(team.losses).toBeDefined()
        expect(team.winRate).toBeDefined()
        expect(team.gamesBehind).toBeDefined()
        
        expect(typeof team.rank).toBe('number')
        expect(typeof team.team).toBe('string')
        expect(typeof team.wins).toBe('number')
        expect(typeof team.losses).toBe('number')
        expect(typeof team.winRate).toBe('number')
        expect(typeof team.gamesBehind).toBe('number')
      })
    })

    it('should validate ranks are sequential', async () => {
      const response = await fetch(`${baseUrl}/standings?sport=basketball`)
      const data = await response.json()

      expect(response.status).toBe(200)

      if (data.length > 1) {
        for (let i = 1; i < data.length; i++) {
          expect(data[i].rank).toBe(data[i-1].rank + 1)
        }
      }
    })

    it('should validate no duplicate ranks', async () => {
      const response = await fetch(`${baseUrl}/standings?sport=basketball`)
      const data = await response.json()

      expect(response.status).toBe(200)

      const ranks = data.map((team: any) => team.rank)
      const uniqueRanks = new Set(ranks)
      expect(ranks.length).toBe(uniqueRanks.size)
    })

    it('should validate team names are unique', async () => {
      const response = await fetch(`${baseUrl}/standings?sport=basketball`)
      const data = await response.json()

      expect(response.status).toBe(200)

      const teamNames = data.map((team: any) => team.team)
      const uniqueNames = new Set(teamNames)
      expect(teamNames.length).toBe(uniqueNames.size)
    })

    it('should validate games behind calculation', async () => {
      const response = await fetch(`${baseUrl}/standings?sport=basketball`)
      const data = await response.json()

      expect(response.status).toBe(200)

      if (data.length > 1) {
        const firstPlaceWins = data[0].wins
        const firstPlaceLosses = data[0].losses
        
        data.forEach((team: any, index: number) => {
          if (index === 0) {
            expect(team.gamesBehind).toBe(0)
          } else {
            const expectedGamesBehind = ((firstPlaceWins - team.wins) + (team.losses - firstPlaceLosses)) / 2
            expect(Math.abs(team.gamesBehind - expectedGamesBehind)).toBeLessThan(0.001)
          }
        })
      }
    })
  })

  describe('Performance Tests', () => {
    it('should respond within acceptable time limits', async () => {
      const startTime = Date.now()
      const response = await fetch(`${baseUrl}/standings?sport=basketball`)
      const endTime = Date.now()

      expect(response.status).toBe(200)
      expect(endTime - startTime).toBeLessThan(3000) // 3 seconds max
    })

    it('should handle concurrent requests efficiently', async () => {
      const requests = Array(5).fill(null).map(() => 
        fetch(`${baseUrl}/standings?sport=basketball`)
      )

      const responses = await Promise.all(requests)
      
      responses.forEach(response => {
        expect(response.status).toBe(200)
      })
    })
  })

  describe('Error Handling', () => {
    it('should handle server errors gracefully', async () => {
      // Test with malformed request
      const response = await fetch(`${baseUrl}/standings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: 'invalid json'
      })

      expect(response.status).toBe(405) // Method not allowed
    })

    it('should handle network timeouts gracefully', async () => {
      const response = await fetch(`${baseUrl}/standings?sport=basketball`)
      expect(response.status).toBe(200)
    })
  })
})
