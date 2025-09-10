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
      expect(Array.isArray(data)).toBe(true)

      if (data.length > 0) {
        const game = data[0]
        expect(game).toMatchObject({
          id: expect.any(String),
          homeTeam: expect.any(String),
          awayTeam: expect.any(String),
          date: expect.any(String),
          status: expect.any(String),
          league: expect.any(String),
          sport: expect.any(String)
        })

        // Verify date format
        expect(game.date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      }
    })

    it('should fetch games with sport filter', async () => {
      const response = await fetch(`${baseUrl}/games?sport=basketball`)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(Array.isArray(data)).toBe(true)

      // All games should be basketball
      data.forEach((game: any) => {
        expect(game.sport).toBe('basketball')
      })
    })

    it('should fetch games with date filter', async () => {
      const today = new Date().toISOString().split('T')[0]
      const response = await fetch(`${baseUrl}/games?date=${today}`)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(Array.isArray(data)).toBe(true)

      // All games should be on the specified date
      data.forEach((game: any) => {
        expect(game.date).toBe(today)
      })
    })

    it('should fetch live games', async () => {
      const response = await fetch(`${baseUrl}/games?status=live`)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(Array.isArray(data)).toBe(true)

      // Live games should have live status
      data.forEach((game: any) => {
        expect(['live', 'in_progress', '1st Qtr', '2nd Qtr', '3rd Qtr', '4th Qtr']).toContain(game.status)
      })
    })

    it('should handle invalid parameters gracefully', async () => {
      const response = await fetch(`${baseUrl}/games?invalid=param`)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(Array.isArray(data)).toBe(true)
    })

    it('should return games with real team names', async () => {
      const response = await fetch(`${baseUrl}/games`)
      const data = await response.json()

      expect(response.status).toBe(200)
      
      if (data.length > 0) {
        const game = data[0]
        
        // Team names should be non-empty strings
        expect(game.homeTeam).toBeTruthy()
        expect(game.awayTeam).toBeTruthy()
        expect(typeof game.homeTeam).toBe('string')
        expect(typeof game.awayTeam).toBe('string')
        expect(game.homeTeam.length).toBeGreaterThan(0)
        expect(game.awayTeam.length).toBeGreaterThan(0)
      }
    })

    it('should include optional fields when available', async () => {
      const response = await fetch(`${baseUrl}/games`)
      const data = await response.json()

      expect(response.status).toBe(200)
      
      if (data.length > 0) {
        const game = data[0]
        
        // Check for optional fields that might be present
        if (game.time) {
          expect(typeof game.time).toBe('string')
        }
        if (game.venue) {
          expect(typeof game.venue).toBe('string')
        }
        if (game.homeScore !== undefined) {
          expect(typeof game.homeScore).toBe('number')
        }
        if (game.awayScore !== undefined) {
          expect(typeof game.awayScore).toBe('number')
        }
      }
    })
  })
})
