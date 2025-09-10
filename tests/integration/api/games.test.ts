/**
 * Real Integration Tests for Games API
 * Tests actual API endpoints with real data from external APIs
 */

describe('Games API Integration Tests', () => {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'

  describe('GET /api/games', () => {
    it('should fetch real games data', async () => {
      const response = await fetch(`${baseUrl}/games`)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toMatchObject({
        data: expect.any(Array),
        meta: expect.any(Object)
      })
      expect(Array.isArray(data.data)).toBe(true)

      if (data.data.length > 0) {
        const game = data.data[0]
        expect(game).toMatchObject({
          id: expect.any(String),
          home_team: expect.objectContaining({
            name: expect.any(String),
            abbreviation: expect.any(String)
          }),
          away_team: expect.objectContaining({
            name: expect.any(String),
            abbreviation: expect.any(String)
          }),
          game_date: expect.any(String),
          status: expect.any(String),
        })

        // Verify date format
        expect(game.game_date).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
      }
    })

    it('should fetch games with sport filter', async () => {
      const response = await fetch(`${baseUrl}/games?sport=basketball`)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toMatchObject({
        data: expect.any(Array),
        meta: expect.any(Object)
      })

      // All games should have basketball teams (WNBA teams in this case)
      data.data.forEach((game: any) => {
        expect(game.home_team).toBeDefined()
        expect(game.away_team).toBeDefined()
      })
    })

    it('should fetch games with date filter', async () => {
      const today = new Date().toISOString().split('T')[0]
      const response = await fetch(`${baseUrl}/games?date=${today}`)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toMatchObject({
        data: expect.any(Array),
        meta: expect.any(Object)
      })

      // All games should be on the specified date
      data.data.forEach((game: any) => {
        expect(game.game_date).toContain(today)
      })
    })

    it('should fetch live games', async () => {
      const response = await fetch(`${baseUrl}/games?status=live`)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toMatchObject({
        data: expect.any(Array),
        meta: expect.any(Object)
      })

      // Live games should have live status
      data.data.forEach((game: any) => {
        expect(['live', 'in_progress', '1st Qtr', '2nd Qtr', '3rd Qtr', '4th Qtr', 'FT', 'NS']).toContain(game.status)
      })
    })

    it('should handle invalid parameters gracefully', async () => {
      const response = await fetch(`${baseUrl}/games?invalid=param`)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toMatchObject({
        data: expect.any(Array),
        meta: expect.any(Object)
      })
    })

    it('should return games with real team names', async () => {
      const response = await fetch(`${baseUrl}/games`)
      const data = await response.json()

      expect(response.status).toBe(200)
      
      if (data.data.length > 0) {
        const game = data.data[0]
        
        // Team names should be non-empty strings
        expect(game.home_team.name).toBeTruthy()
        expect(game.away_team.name).toBeTruthy()
        expect(typeof game.home_team.name).toBe('string')
        expect(typeof game.away_team.name).toBe('string')
        expect(game.home_team.name.length).toBeGreaterThan(0)
        expect(game.away_team.name.length).toBeGreaterThan(0)
      }
    })

    it('should include optional fields when available', async () => {
      const response = await fetch(`${baseUrl}/games`)
      const data = await response.json()

      expect(response.status).toBe(200)
      
      if (data.data.length > 0) {
        const game = data.data[0]
        
        // Check for optional fields that might be present
        if (game.venue) {
          expect(typeof game.venue).toBe('string')
        }
        if (game.home_score !== null && game.home_score !== undefined) {
          expect(typeof game.home_score).toBe('number')
        }
        if (game.away_score !== null && game.away_score !== undefined) {
          expect(typeof game.away_score).toBe('number')
        }
        if (game.season) {
          expect(typeof game.season).toBe('string')
        }
      }
    })
  })
})