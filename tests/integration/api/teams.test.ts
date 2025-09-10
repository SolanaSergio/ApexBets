/**
 * Real Integration Tests for Teams API
 * Tests actual API endpoints with real team data
 */

describe('Teams API Integration Tests', () => {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'

  describe('GET /api/teams', () => {
    it('should fetch real teams data', async () => {
      const response = await fetch(`${baseUrl}/teams`)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toMatchObject({
        data: expect.any(Array),
        meta: expect.any(Object)
      })
      expect(Array.isArray(data.data)).toBe(true)

      if (data.data.length > 0) {
        const team = data.data[0]
        expect(team).toMatchObject({
          id: expect.any(String),
          name: expect.any(String),
          abbreviation: expect.any(String),
          league: expect.any(String),
          sport: expect.any(String)
        })

        // Verify team name is not empty
        expect(team.name.length).toBeGreaterThan(0)
        expect(team.abbreviation.length).toBeGreaterThan(0)
      }
    })

    it('should fetch teams with sport filter', async () => {
      const response = await fetch(`${baseUrl}/teams?sport=basketball`)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toMatchObject({
        data: expect.any(Array),
        meta: expect.any(Object)
      })

      // All teams should be basketball teams
      data.data.forEach((team: any) => {
        expect(team.sport).toBe('basketball')
      })
    })

    it('should fetch teams with league filter', async () => {
      const response = await fetch(`${baseUrl}/teams?league=NBA`)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toMatchObject({
        data: expect.any(Array),
        meta: expect.any(Object)
      })

      // All teams should be NBA teams
      data.data.forEach((team: any) => {
        expect(team.league).toBe('NBA')
      })
    })

    it('should return teams with real NBA team names', async () => {
      const response = await fetch(`${baseUrl}/teams?sport=basketball`)
      const data = await response.json()

      expect(response.status).toBe(200)
      
      if (data.data.length > 0) {
        // Check for known NBA teams
        const teamNames = data.data.map((team: any) => team.name)
        const knownTeams = ['Lakers', 'Warriors', 'Celtics', 'Bulls', 'Heat', 'Spurs']
        
        const hasKnownTeam = knownTeams.some(knownTeam => 
          teamNames.some((name: string) => name.includes(knownTeam))
        )
        
        // At least one known NBA team should be present
        expect(hasKnownTeam).toBe(true)
      }
    })

    it('should include team statistics when available', async () => {
      const response = await fetch(`${baseUrl}/teams`)
      const data = await response.json()

      expect(response.status).toBe(200)
      
      if (data.data.length > 0) {
        const team = data.data[0]
        
        // Check for optional stats fields
        if (team.stats) {
          expect(team.stats).toMatchObject({
            wins: expect.any(Number),
            losses: expect.any(Number),
            winPercentage: expect.any(Number)
          })
          
          expect(team.stats.wins).toBeGreaterThanOrEqual(0)
          expect(team.stats.losses).toBeGreaterThanOrEqual(0)
          expect(team.stats.winPercentage).toBeGreaterThanOrEqual(0)
          expect(team.stats.winPercentage).toBeLessThanOrEqual(1)
        }
      }
    })

    it('should handle search parameter', async () => {
      const response = await fetch(`${baseUrl}/teams?search=Lakers`)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toMatchObject({
        data: expect.any(Array),
        meta: expect.any(Object)
      })

      // Results should contain Lakers
      if (data.data.length > 0) {
        const hasLakers = data.data.some((team: any) => 
          team.name.toLowerCase().includes('lakers')
        )
        expect(hasLakers).toBe(true)
      }
    })

    it('should return consistent team data structure', async () => {
      const response = await fetch(`${baseUrl}/teams`)
      const data = await response.json()

      expect(response.status).toBe(200)
      
      data.data.forEach((team: any) => {
        // Required fields
        expect(team.id).toBeDefined()
        expect(team.name).toBeDefined()
        expect(team.abbreviation).toBeDefined()
        expect(team.league).toBeDefined()
        expect(team.sport).toBeDefined()
        
        // Field types
        expect(typeof team.id).toBe('string')
        expect(typeof team.name).toBe('string')
        expect(typeof team.abbreviation).toBe('string')
        expect(typeof team.league).toBe('string')
        expect(typeof team.sport).toBe('string')
        
        // Non-empty strings
        expect(team.id.length).toBeGreaterThan(0)
        expect(team.name.length).toBeGreaterThan(0)
        expect(team.abbreviation.length).toBeGreaterThan(0)
        expect(team.league.length).toBeGreaterThan(0)
        expect(team.sport.length).toBeGreaterThan(0)
      })
    })
  })
})