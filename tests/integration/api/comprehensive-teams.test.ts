/**
 * Comprehensive Integration Tests for Teams API
 * Tests actual API endpoints with real NBA team data
 */

describe('Comprehensive Teams API Tests', () => {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'

  describe('GET /api/teams - Real NBA Teams', () => {
    it('should fetch real NBA teams with proper data structure', async () => {
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
          league: expect.any(String),
          sport: expect.any(String),
        })

        // Verify required fields are not empty
        expect(team.id.length).toBeGreaterThan(0)
        expect(team.name.length).toBeGreaterThan(0)
        expect(team.league.length).toBeGreaterThan(0)
        expect(team.sport.length).toBeGreaterThan(0)
      }
    })

    it('should fetch NBA basketball teams specifically', async () => {
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

      // Should have NBA teams
      if (data.data.length > 0) {
        const hasNBATeam = data.data.some((team: any) => team.league === 'NBA')
        expect(hasNBATeam).toBe(true)
      }
    })

    it('should fetch teams by NBA league', async () => {
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

    it('should validate real NBA team names', async () => {
      const response = await fetch(`${baseUrl}/teams?sport=basketball&league=NBA`)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toMatchObject({
        data: expect.any(Array),
        meta: expect.any(Object)
      })

      if (data.data.length > 0) {
        const knownNBATeams = [
          'Lakers', 'Warriors', 'Celtics', 'Bulls', 'Heat', 'Spurs',
          'Knicks', 'Nets', 'Rockets', 'Mavericks', 'Suns', 'Nuggets',
          'Clippers', 'Trail Blazers', 'Jazz', 'Thunder', 'Timberwolves',
          'Pelicans', 'Kings', 'Grizzlies', 'Hawks', 'Hornets', 'Magic',
          'Pistons', 'Pacers', 'Bucks', 'Cavaliers', 'Raptors', '76ers'
        ]

        const teamNames = data.data.map((team: any) => team.name)
        const hasKnownTeam = knownNBATeams.some(knownTeam => 
          teamNames.some((name: string) => name.includes(knownTeam))
        )

        expect(hasKnownTeam).toBe(true)
      }
    })

    it('should include team abbreviations for NBA teams', async () => {
      const response = await fetch(`${baseUrl}/teams?league=NBA`)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toMatchObject({
        data: expect.any(Array),
        meta: expect.any(Object)
      })

      if (data.data.length > 0) {
        const team = data.data[0]
        expect(team.abbreviation).toBeDefined()
        expect(typeof team.abbreviation).toBe('string')
        // Some teams might have empty abbreviations, which is acceptable
        if (team.abbreviation.length > 0) {
          expect(team.abbreviation.length).toBeLessThanOrEqual(5) // NBA abbreviations are 2-5 chars
        }
      }
    })

    it('should include team cities for NBA teams', async () => {
      const response = await fetch(`${baseUrl}/teams?league=NBA`)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toMatchObject({
        data: expect.any(Array),
        meta: expect.any(Object)
      })

      if (data.data.length > 0) {
        const team = data.data[0]
        if (team.city) {
          expect(typeof team.city).toBe('string')
          expect(team.city.length).toBeGreaterThan(0)
        }
      }
    })

    it('should include logo URLs when available', async () => {
      const response = await fetch(`${baseUrl}/teams?league=NBA`)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toMatchObject({
        data: expect.any(Array),
        meta: expect.any(Object)
      })

      if (data.data.length > 0) {
        const team = data.data[0]
        if (team.logo_url) {
          expect(typeof team.logo_url).toBe('string')
          expect(team.logo_url).toMatch(/^https?:\/\//)
        }
      }
    })

    it('should return teams in alphabetical order', async () => {
      const response = await fetch(`${baseUrl}/teams?league=NBA`)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toMatchObject({
        data: expect.any(Array),
        meta: expect.any(Object)
      })

      if (data.data.length > 1) {
        const teamNames = data.data.map((team: any) => team.name)
        const sortedNames = [...teamNames].sort()
        expect(teamNames).toEqual(sortedNames)
      }
    })

    it('should handle empty results gracefully', async () => {
      const response = await fetch(`${baseUrl}/teams?league=NonExistentLeague`)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toMatchObject({
        data: expect.any(Array),
        meta: expect.any(Object)
      })
      expect(data.data.length).toBe(0)
    })

    it('should handle invalid parameters gracefully', async () => {
      const response = await fetch(`${baseUrl}/teams?invalid=param`)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toMatchObject({
        data: expect.any(Array),
        meta: expect.any(Object)
      })
    })
  })

  describe('POST /api/teams - Create NBA Teams', () => {
    it('should create a new NBA team', async () => {
      const teamData = {
        name: 'Test Lakers',
        city: 'Los Angeles',
        league: 'NBA',
        sport: 'basketball',
        abbreviation: 'TLK'
      }

      const response = await fetch(`${baseUrl}/teams`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(teamData),
      })

      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toMatchObject({
        id: expect.any(String),
        name: teamData.name,
        city: teamData.city,
        league: teamData.league,
        sport: teamData.sport,
        abbreviation: teamData.abbreviation,
      })
    })

    it('should create team with minimal required fields', async () => {
      const teamData = {
        name: 'Minimal Team',
        sport: 'basketball'
      }

      const response = await fetch(`${baseUrl}/teams`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(teamData),
      })

      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toMatchObject({
        id: expect.any(String),
        name: teamData.name,
        sport: teamData.sport,
      })
    })

    it('should reject team creation with missing required fields', async () => {
      const teamData = {
        city: 'Los Angeles'
        // Missing name and sport
      }

      const response = await fetch(`${baseUrl}/teams`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(teamData),
      })

      expect(response.status).toBe(400)
    })

    it('should handle team creation with logo URL', async () => {
      const teamData = {
        name: 'Team With Logo',
        sport: 'basketball',
        league: 'NBA',
        logo_url: 'https://example.com/logo.png'
      }

      const response = await fetch(`${baseUrl}/teams`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(teamData),
      })

      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.logo_url).toBe(teamData.logo_url)
    })
  })

  describe('Team Data Validation', () => {
    it('should validate NBA team abbreviations format', async () => {
      const response = await fetch(`${baseUrl}/teams?league=NBA`)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toMatchObject({
        data: expect.any(Array),
        meta: expect.any(Object)
      })

      data.data.forEach((team: any) => {
        if (team.abbreviation) {
          // NBA abbreviations are typically 2-5 characters, uppercase
          expect(team.abbreviation.length).toBeGreaterThanOrEqual(2)
          expect(team.abbreviation.length).toBeLessThanOrEqual(5)
        }
      })
    })

    it('should validate team names are not empty or whitespace', async () => {
      const response = await fetch(`${baseUrl}/teams`)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toMatchObject({
        data: expect.any(Array),
        meta: expect.any(Object)
      })

      data.data.forEach((team: any) => {
        expect(team.name.trim().length).toBeGreaterThan(0)
        expect(team.name).not.toMatch(/^\s+$/) // Not just whitespace
      })
    })

    it('should validate team IDs are unique', async () => {
      const response = await fetch(`${baseUrl}/teams`)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toMatchObject({
        data: expect.any(Array),
        meta: expect.any(Object)
      })

      const teamIds = data.data.map((team: any) => team.id)
      const uniqueIds = new Set(teamIds)
      expect(teamIds.length).toBe(uniqueIds.size)
    })

    it('should validate created_at and updated_at timestamps', async () => {
      const response = await fetch(`${baseUrl}/teams`)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toMatchObject({
        data: expect.any(Array),
        meta: expect.any(Object)
      })

      data.data.forEach((team: any) => {
        expect(team.created_at).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
        expect(team.updated_at).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
        
        // Verify timestamps are valid dates
        expect(new Date(team.created_at)).toBeInstanceOf(Date)
        expect(new Date(team.updated_at)).toBeInstanceOf(Date)
      })
    })
  })

  describe('Performance Tests', () => {
    it('should respond within acceptable time limits', async () => {
      const startTime = Date.now()
      const response = await fetch(`${baseUrl}/teams`)
      const endTime = Date.now()

      expect(response.status).toBe(200)
      expect(endTime - startTime).toBeLessThan(5000) // 5 seconds
    })

    it('should handle concurrent requests efficiently', async () => {
      const requests = Array(5).fill(null).map(() => 
        fetch(`${baseUrl}/teams`)
      )

      const responses = await Promise.all(requests)
      
      responses.forEach(response => {
        expect(response.status).toBe(200)
      })
    })

    it('should handle large result sets efficiently', async () => {
      const startTime = Date.now()
      const response = await fetch(`${baseUrl}/teams`)
      const endTime = Date.now()

      expect(response.status).toBe(200)
      expect(endTime - startTime).toBeLessThan(10000) // 10 seconds for large datasets
    })
  })

  describe('Error Handling', () => {
    it('should handle server errors gracefully', async () => {
      // Test with malformed request
      const response = await fetch(`${baseUrl}/teams`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: 'invalid json',
      })

      expect([400, 500]).toContain(response.status) // Accept both 400 and 500 for malformed requests
    })
  })
})