/**
 * Real Integration Tests for Live Scores API
 * Tests actual API endpoints with real live game data
 */

describe('Live Scores API Integration Tests', () => {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL as string

  describe('GET /api/live-scores', () => {
    it('should fetch real live scores data', async () => {
      const response = await fetch(`${baseUrl}/live-scores`)
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
          homeTeam: expect.any(String),
          awayTeam: expect.any(String),
          date: expect.any(String),
          status: expect.any(String),
          league: expect.any(String),
          sport: expect.any(String)
        })

        // Live games should have live status
        expect(['live', 'in_progress', '1st Qtr', '2nd Qtr', '3rd Qtr', '4th Qtr', 'Halftime']).toContain(game.status)
      }
    })

    it('should fetch live scores with sport filter', async () => {
      const response = await fetch(`${baseUrl}/live-scores?sport=basketball`)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toMatchObject({
        data: expect.any(Array),
        meta: expect.any(Object)
      })

      // All games should be basketball
      data.data.forEach((game: any) => {
        expect(game.sport).toBe('basketball')
      })
    })

    it('should include real-time scores when available', async () => {
      const response = await fetch(`${baseUrl}/live-scores`)
      const data = await response.json()

      expect(response.status).toBe(200)
      
      if (data.data.length > 0) {
        const game = data.data[0]
        
        // Live games should have scores
        if (game.status === 'live' || game.status.includes('Qtr') || game.status === 'Halftime') {
          expect(game.homeScore).toBeDefined()
          expect(game.awayScore).toBeDefined()
          expect(typeof game.homeScore).toBe('number')
          expect(typeof game.awayScore).toBe('number')
          expect(game.homeScore).toBeGreaterThanOrEqual(0)
          expect(game.awayScore).toBeGreaterThanOrEqual(0)
        }
      }
    })

    it('should return games with current date', async () => {
      const response = await fetch(`${baseUrl}/live-scores`)
      const data = await response.json()

      expect(response.status).toBe(200)
      
      if (data.data.length > 0) {
        const today = new Date().toISOString().split('T')[0]
        
        // Live games should be from today
        data.data.forEach((game: any) => {
          expect(game.date).toBe(today)
        })
      }
    })

    it('should handle different game statuses', async () => {
      const response = await fetch(`${baseUrl}/live-scores`)
      const data = await response.json()

      expect(response.status).toBe(200)
      
      if (data.data.length > 0) {
        const statuses = data.data.map((game: any) => game.status)
        const validStatuses = [
          'live', 'in_progress', '1st Qtr', '2nd Qtr', '3rd Qtr', '4th Qtr', 
          'Halftime', 'Final', 'finished', 'scheduled'
        ]
        
        statuses.forEach((status: string) => {
          expect(validStatuses).toContain(status)
        })
      }
    })

    it('should return games with real team names', async () => {
      const response = await fetch(`${baseUrl}/live-scores`)
      const data = await response.json()

      expect(response.status).toBe(200)
      
      if (data.data.length > 0) {
        const game = data.data[0]
        
        // Team names should be non-empty strings
        expect(game.homeTeam).toBeTruthy()
        expect(game.awayTeam).toBeTruthy()
        expect(typeof game.homeTeam).toBe('string')
        expect(typeof game.awayTeam).toBe('string')
        expect(game.homeTeam.length).toBeGreaterThan(0)
        expect(game.awayTeam.length).toBeGreaterThan(0)
      }
    })

    it('should include game timing information', async () => {
      const response = await fetch(`${baseUrl}/live-scores`)
      const data = await response.json()

      expect(response.status).toBe(200)
      
      if (data.data.length > 0) {
        const game = data.data[0]
        
        // Should have time information for live games
        if (game.status === 'live' || game.status.includes('Qtr')) {
          expect(game.time).toBeDefined()
          expect(typeof game.time).toBe('string')
        }
      }
    })

    it('should return consistent live scores data structure', async () => {
      const response = await fetch(`${baseUrl}/live-scores`)
      const data = await response.json()

      expect(response.status).toBe(200)
      
      data.data.forEach((game: any) => {
        // Required fields
        expect(game.id).toBeDefined()
        expect(game.homeTeam).toBeDefined()
        expect(game.awayTeam).toBeDefined()
        expect(game.date).toBeDefined()
        expect(game.status).toBeDefined()
        expect(game.league).toBeDefined()
        expect(game.sport).toBeDefined()
        
        // Field types
        expect(typeof game.id).toBe('string')
        expect(typeof game.homeTeam).toBe('string')
        expect(typeof game.awayTeam).toBe('string')
        expect(typeof game.date).toBe('string')
        expect(typeof game.status).toBe('string')
        expect(typeof game.league).toBe('string')
        expect(typeof game.sport).toBe('string')
        
        // Non-empty strings
        expect(game.id.length).toBeGreaterThan(0)
        expect(game.homeTeam.length).toBeGreaterThan(0)
        expect(game.awayTeam.length).toBeGreaterThan(0)
        expect(game.league.length).toBeGreaterThan(0)
        expect(game.sport.length).toBeGreaterThan(0)
      })
    })

    it('should handle empty live scores gracefully', async () => {
      // This test might pass if no games are currently live
      const response = await fetch(`${baseUrl}/live-scores`)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toMatchObject({
        data: expect.any(Array),
        meta: expect.any(Object)
      })
      // Empty array is acceptable when no games are live
    })
  })
})