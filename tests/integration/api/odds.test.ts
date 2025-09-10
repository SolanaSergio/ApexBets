/**
 * Real Integration Tests for Odds API
 * Tests actual API endpoints with real odds data
 */

describe('Odds API Integration Tests', () => {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'

  describe('GET /api/odds', () => {
    it('should fetch real odds data', async () => {
      const response = await fetch(`${baseUrl}/odds`)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toMatchObject({
        data: expect.any(Array),
        meta: expect.any(Object)
      })
      expect(Array.isArray(data.data)).toBe(true)

      if (data.data.length > 0) {
        const odds = data.data[0]
        expect(odds).toMatchObject({
          id: expect.any(String),
          home_team: expect.any(String),
          away_team: expect.any(String),
          commence_time: expect.any(String),
          sport_key: expect.any(String),
          sport_title: expect.any(String)
        })

        // Verify commence_time is a valid ISO string
        expect(new Date(odds.commence_time)).toBeInstanceOf(Date)
        expect(new Date(odds.commence_time).getTime()).not.toBeNaN()
      }
    })

    it('should fetch odds with sport filter', async () => {
      const response = await fetch(`${baseUrl}/odds?sport=basketball_nba`)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toMatchObject({
        data: expect.any(Array),
        meta: expect.any(Object)
      })

      // All odds should be for basketball
      data.data.forEach((odds: any) => {
        expect(odds.sport_key).toBe('basketball_nba')
        expect(odds.sport_title).toContain('Basketball')
      })
    })

    it('should include betting markets when available', async () => {
      const response = await fetch(`${baseUrl}/odds`)
      const data = await response.json()

      expect(response.status).toBe(200)
      
      if (data.data.length > 0) {
        const odds = data.data[0]
        
        // Check for betting markets
        if (odds.bookmakers && odds.bookmakers.length > 0) {
          const bookmaker = odds.bookmakers[0]
          expect(bookmaker).toMatchObject({
            key: expect.any(String),
            title: expect.any(String),
            markets: expect.any(Array)
          })

          // Check markets structure
          if (bookmaker.markets.length > 0) {
            const market = bookmaker.markets[0]
            expect(market).toMatchObject({
              key: expect.any(String),
              outcomes: expect.any(Array)
            })

            // Check outcomes structure
            if (market.outcomes.length > 0) {
              const outcome = market.outcomes[0]
              expect(outcome).toMatchObject({
                name: expect.any(String),
                price: expect.any(Number)
              })
              expect(outcome.price).toBeGreaterThan(0)
            }
          }
        }
      }
    })

    it('should handle different market types', async () => {
      const response = await fetch(`${baseUrl}/odds?markets=h2h,spreads,totals`)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toMatchObject({
        data: expect.any(Array),
        meta: expect.any(Object)
      })

      if (data.data.length > 0) {
        const odds = data.data[0]
        
        // Should have bookmakers with different market types
        if (odds.bookmakers && odds.bookmakers.length > 0) {
          const bookmaker = odds.bookmakers[0]
          const marketKeys = bookmaker.markets.map((m: any) => m.key)
          
          // Should contain at least one of the requested market types
          const hasRequestedMarkets = ['h2h', 'spreads', 'totals'].some(market => 
            marketKeys.some((key: string) => key.includes(market))
          )
          expect(hasRequestedMarkets).toBe(true)
        }
      }
    })

    it('should return odds with valid team names', async () => {
      const response = await fetch(`${baseUrl}/odds`)
      const data = await response.json()

      expect(response.status).toBe(200)
      
      if (data.data.length > 0) {
        const odds = data.data[0]
        
        // Team names should be non-empty strings
        expect(odds.home_team).toBeTruthy()
        expect(odds.away_team).toBeTruthy()
        expect(typeof odds.home_team).toBe('string')
        expect(typeof odds.away_team).toBe('string')
        expect(odds.home_team.length).toBeGreaterThan(0)
        expect(odds.away_team.length).toBeGreaterThan(0)
      }
    })

    it('should handle future games', async () => {
      const response = await fetch(`${baseUrl}/odds`)
      const data = await response.json()

      expect(response.status).toBe(200)
      
      if (data.data.length > 0) {
        const odds = data.data[0]
        const commenceTime = new Date(odds.commence_time)
        const now = new Date()
        
        // Most odds should be for future games
        // Allow some tolerance for games starting soon
        const timeDiff = commenceTime.getTime() - now.getTime()
        expect(timeDiff).toBeGreaterThan(-3600000) // Within 1 hour tolerance
      }
    })

    it('should return consistent odds data structure', async () => {
      const response = await fetch(`${baseUrl}/odds`)
      const data = await response.json()

      expect(response.status).toBe(200)
      
      data.data.forEach((odds: any) => {
        // Required fields
        expect(odds.id).toBeDefined()
        expect(odds.home_team).toBeDefined()
        expect(odds.away_team).toBeDefined()
        expect(odds.commence_time).toBeDefined()
        expect(odds.sport_key).toBeDefined()
        expect(odds.sport_title).toBeDefined()
        
        // Field types
        expect(typeof odds.id).toBe('string')
        expect(typeof odds.home_team).toBe('string')
        expect(typeof odds.away_team).toBe('string')
        expect(typeof odds.commence_time).toBe('string')
        expect(typeof odds.sport_key).toBe('string')
        expect(typeof odds.sport_title).toBe('string')
        
        // Non-empty strings
        expect(odds.id.length).toBeGreaterThan(0)
        expect(odds.home_team.length).toBeGreaterThan(0)
        expect(odds.away_team.length).toBeGreaterThan(0)
        expect(odds.sport_key.length).toBeGreaterThan(0)
        expect(odds.sport_title.length).toBeGreaterThan(0)
      })
    })
  })
})