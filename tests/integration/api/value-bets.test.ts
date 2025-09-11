/**
 * Real Integration Tests for Value Bets API
 * Tests actual API endpoints with real value betting data
 */

describe('Value Bets API Integration Tests', () => {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'

  describe('GET /api/value-bets', () => {
    it('should fetch real value bets data', async () => {
      const response = await fetch(`${baseUrl}/value-bets`)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toMatchObject({
        data: expect.any(Array),
        meta: expect.any(Object)
      })
      expect(Array.isArray(data.data)).toBe(true)

      if (data.data.length > 0) {
        const valueBet = data.data[0]
        expect(valueBet).toMatchObject({
          id: expect.any(String),
          game_id: expect.any(String),
          home_team: expect.any(String),
          away_team: expect.any(String),
          bet_type: expect.any(String),
          value_percentage: expect.any(Number),
          confidence: expect.any(Number),
          created_at: expect.any(String)
        })

        // Verify value percentage is reasonable
        expect(valueBet.value_percentage).toBeGreaterThan(0)
        expect(valueBet.value_percentage).toBeLessThan(1000) // Sanity check

        // Verify confidence is between 0 and 1
        expect(valueBet.confidence).toBeGreaterThanOrEqual(0)
        expect(valueBet.confidence).toBeLessThanOrEqual(1)
      }
    })

    it('should include betting odds information', async () => {
      const response = await fetch(`${baseUrl}/value-bets`)
      const data = await response.json()

      expect(response.status).toBe(200)
      
      if (data.data.length > 0) {
        const valueBet = data.data[0]
        
        // Should have odds information
        if (valueBet.odds) {
          expect(valueBet.odds).toMatchObject({
            home_odds: expect.any(Number),
            away_odds: expect.any(Number),
            source: expect.any(String)
          })
          
          expect(valueBet.odds.home_odds).toBeGreaterThan(0)
          expect(valueBet.odds.away_odds).toBeGreaterThan(0)
        }
      }
    })

    it('should include prediction information', async () => {
      const response = await fetch(`${baseUrl}/value-bets`)
      const data = await response.json()

      expect(response.status).toBe(200)
      
      if (data.data.length > 0) {
        const valueBet = data.data[0]
        
        // Should have prediction information
        if (valueBet.prediction) {
          expect(valueBet.prediction).toMatchObject({
            predicted_value: expect.any(Number),
            model_name: expect.any(String),
            confidence: expect.any(Number)
          })
        }
      }
    })

    it('should filter by bet type', async () => {
      const response = await fetch(`${baseUrl}/value-bets?bet_type=spread`)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toMatchObject({
        data: expect.any(Array),
        meta: expect.any(Object)
      })

      // All value bets should be spread bets
      data.data.forEach((valueBet: any) => {
        expect(valueBet.bet_type).toBe('spread')
      })
    })

    it('should filter by minimum value percentage', async () => {
      const response = await fetch(`${baseUrl}/value-bets?min_value=5.0`)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toMatchObject({
        data: expect.any(Array),
        meta: expect.any(Object)
      })

      // All value bets should have value percentage >= 5.0
      data.data.forEach((valueBet: any) => {
        expect(valueBet.value_percentage).toBeGreaterThanOrEqual(5.0)
      })
    })

    it('should filter by minimum confidence', async () => {
      const response = await fetch(`${baseUrl}/value-bets?min_confidence=0.7`)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toMatchObject({
        data: expect.any(Array),
        meta: expect.any(Object)
      })

      // All value bets should have confidence >= 0.7
      data.data.forEach((valueBet: any) => {
        expect(valueBet.confidence).toBeGreaterThanOrEqual(0.7)
      })
    })

    it('should include game information', async () => {
      const response = await fetch(`${baseUrl}/value-bets`)
      const data = await response.json()

      expect(response.status).toBe(200)
      
      if (data.data.length > 0) {
        const valueBet = data.data[0]
        
        // Should have game information
        expect(valueBet.game_id).toBeDefined()
        expect(valueBet.home_team).toBeDefined()
        expect(valueBet.away_team).toBeDefined()
        
        // Team names should be non-empty strings
        expect(valueBet.home_team.length).toBeGreaterThan(0)
        expect(valueBet.away_team.length).toBeGreaterThan(0)
      }
    })

    it('should return value bets with valid timestamps', async () => {
      const response = await fetch(`${baseUrl}/value-bets`)
      const data = await response.json()

      expect(response.status).toBe(200)
      
      data.data.forEach((valueBet: any) => {
        // Verify created_at is a valid ISO string
        const createdAt = new Date(valueBet.created_at)
        expect(createdAt).toBeInstanceOf(Date)
        expect(createdAt.getTime()).not.toBeNaN()
        
        // Verify created_at is not in the future
        const now = new Date()
        expect(createdAt.getTime()).toBeLessThanOrEqual(now.getTime())
      })
    })

    it('should handle limit parameter', async () => {
      const response = await fetch(`${baseUrl}/value-bets?limit=10`)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toMatchObject({
        data: expect.any(Array),
        meta: expect.any(Object)
      })
      expect(data.data.length).toBeLessThanOrEqual(10)
    })

    it('should return consistent value bet data structure', async () => {
      const response = await fetch(`${baseUrl}/value-bets`)
      const data = await response.json()

      expect(response.status).toBe(200)
      
      data.data.forEach((valueBet: any) => {
        // Required fields
        expect(valueBet.id).toBeDefined()
        expect(valueBet.game_id).toBeDefined()
        expect(valueBet.home_team).toBeDefined()
        expect(valueBet.away_team).toBeDefined()
        expect(valueBet.bet_type).toBeDefined()
        expect(valueBet.value_percentage).toBeDefined()
        expect(valueBet.confidence).toBeDefined()
        expect(valueBet.created_at).toBeDefined()
        
        // Field types
        expect(typeof valueBet.id).toBe('string')
        expect(typeof valueBet.game_id).toBe('string')
        expect(typeof valueBet.home_team).toBe('string')
        expect(typeof valueBet.away_team).toBe('string')
        expect(typeof valueBet.bet_type).toBe('string')
        expect(typeof valueBet.value_percentage).toBe('number')
        expect(typeof valueBet.confidence).toBe('number')
        expect(typeof valueBet.created_at).toBe('string')
        
        // Non-empty strings
        expect(valueBet.id.length).toBeGreaterThan(0)
        expect(valueBet.game_id.length).toBeGreaterThan(0)
        expect(valueBet.home_team.length).toBeGreaterThan(0)
        expect(valueBet.away_team.length).toBeGreaterThan(0)
        expect(valueBet.bet_type.length).toBeGreaterThan(0)
      })
    })

    it('should include different bet types', async () => {
      const response = await fetch(`${baseUrl}/value-bets`)
      const data = await response.json()

      expect(response.status).toBe(200)
      
      if (data.data.length > 0) {
        const betTypes = [...new Set(data.data.map((vb: any) => vb.bet_type))]
        
        // Should have at least one bet type
        expect(betTypes.length).toBeGreaterThan(0)
        
        // Common bet types
        const commonTypes = ['spread', 'total', 'moneyline', 'over_under']
        const hasCommonType = commonTypes.some(type => 
          (betTypes as string[]).some((bType: string) => bType.toLowerCase().includes(type))
        )
        
        // At least one common bet type should be present
        expect(hasCommonType).toBe(true)
      }
    })

    it('should handle empty value bets gracefully', async () => {
      // This test might pass if no value bets exist
      const response = await fetch(`${baseUrl}/value-bets`)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toMatchObject({
        data: expect.any(Array),
        meta: expect.any(Object)
      })
      // Empty array is acceptable when no value bets exist
    })
  })
})