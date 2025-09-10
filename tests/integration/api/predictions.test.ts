/**
 * Real Integration Tests for Predictions API
 * Tests actual API endpoints with real prediction data
 */

describe('Predictions API Integration Tests', () => {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'

  describe('GET /api/predictions', () => {
    it('should fetch real predictions data', async () => {
      const response = await fetch(`${baseUrl}/predictions`)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toMatchObject({
        data: expect.any(Array),
        meta: expect.any(Object)
      })
      expect(Array.isArray(data.data)).toBe(true)

      if (data.data.length > 0) {
        const prediction = data.data[0]
        expect(prediction).toMatchObject({
          id: expect.any(String),
          game_id: expect.any(String),
          model_name: expect.any(String),
          prediction_type: expect.any(String),
          predicted_value: expect.any(Number),
          confidence: expect.any(Number),
          created_at: expect.any(String)
        })

        // Verify confidence is between 0 and 1
        expect(prediction.confidence).toBeGreaterThanOrEqual(0)
        expect(prediction.confidence).toBeLessThanOrEqual(1)
      }
    })

    it('should fetch predictions with game_id filter', async () => {
      // First get a game_id from games API
      const gamesResponse = await fetch(`${baseUrl}/games`)
      const games = await gamesResponse.json()
      
      if (games.data && games.data.length > 0) {
        const gameId = games.data[0].id
        const response = await fetch(`${baseUrl}/predictions?game_id=${gameId}`)
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data).toMatchObject({
          data: expect.any(Object),
          meta: expect.any(Object)
        })

        // Should be a single prediction object
        expect(data.data.gameId).toBe(gameId)
      }
    })

    it('should fetch predictions with prediction_type filter', async () => {
      const response = await fetch(`${baseUrl}/predictions?prediction_type=spread`)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toMatchObject({
        data: expect.any(Array),
        meta: expect.any(Object)
      })

      // All predictions should be spread predictions
      data.data.forEach((prediction: any) => {
        expect(prediction.prediction_type).toBe('spread')
      })
    })

    it('should fetch predictions with model_name filter', async () => {
      const response = await fetch(`${baseUrl}/predictions?model_name=ml_model_v1`)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toMatchObject({
        data: expect.any(Array),
        meta: expect.any(Object)
      })

      // All predictions should be from the specified model
      data.data.forEach((prediction: any) => {
        expect(prediction.model_name).toBe('ml_model_v1')
      })
    })

    it('should include actual values when available', async () => {
      const response = await fetch(`${baseUrl}/predictions`)
      const data = await response.json()

      expect(response.status).toBe(200)
      
      if (data.data.length > 0) {
        const prediction = data.data[0]
        
        // Check for optional actual_value field
        if (prediction.actual_value !== undefined) {
          expect(typeof prediction.actual_value).toBe('number')
        }
        
        // Check for optional is_correct field
        if (prediction.is_correct !== undefined) {
          expect(typeof prediction.is_correct).toBe('boolean')
        }
      }
    })

    it('should return predictions with valid timestamps', async () => {
      const response = await fetch(`${baseUrl}/predictions`)
      const data = await response.json()

      expect(response.status).toBe(200)
      
      data.data.forEach((prediction: any) => {
        // Verify created_at is a valid ISO string
        const createdAt = new Date(prediction.created_at)
        expect(createdAt).toBeInstanceOf(Date)
        expect(createdAt.getTime()).not.toBeNaN()
        
        // Verify created_at is not in the future
        const now = new Date()
        expect(createdAt.getTime()).toBeLessThanOrEqual(now.getTime())
      })
    })

    it('should handle limit parameter', async () => {
      const response = await fetch(`${baseUrl}/predictions?limit=5`)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toMatchObject({
        data: expect.any(Array),
        meta: expect.any(Object)
      })
      expect(data.data.length).toBeLessThanOrEqual(5)
    })

    it('should return consistent prediction data structure', async () => {
      const response = await fetch(`${baseUrl}/predictions`)
      const data = await response.json()

      expect(response.status).toBe(200)
      
      data.data.forEach((prediction: any) => {
        // Required fields
        expect(prediction.id).toBeDefined()
        expect(prediction.game_id).toBeDefined()
        expect(prediction.model_name).toBeDefined()
        expect(prediction.prediction_type).toBeDefined()
        expect(prediction.predicted_value).toBeDefined()
        expect(prediction.confidence).toBeDefined()
        expect(prediction.created_at).toBeDefined()
        
        // Field types
        expect(typeof prediction.id).toBe('string')
        expect(typeof prediction.game_id).toBe('string')
        expect(typeof prediction.model_name).toBe('string')
        expect(typeof prediction.prediction_type).toBe('string')
        expect(typeof prediction.predicted_value).toBe('number')
        expect(typeof prediction.confidence).toBe('number')
        expect(typeof prediction.created_at).toBe('string')
        
        // Non-empty strings
        expect(prediction.id.length).toBeGreaterThan(0)
        expect(prediction.game_id.length).toBeGreaterThan(0)
        expect(prediction.model_name.length).toBeGreaterThan(0)
        expect(prediction.prediction_type.length).toBeGreaterThan(0)
      })
    })

    it('should include different prediction types', async () => {
      const response = await fetch(`${baseUrl}/predictions`)
      const data = await response.json()

      expect(response.status).toBe(200)
      
      if (data.data.length > 0) {
        const predictionTypes = [...new Set(data.data.map((p: any) => p.prediction_type))]
        
        // Should have at least one prediction type
        expect(predictionTypes.length).toBeGreaterThan(0)
        
        // Common prediction types
        const commonTypes = ['spread', 'total', 'moneyline', 'over_under', 'winner']
        const hasCommonType = commonTypes.some(type => 
          predictionTypes.some(pType => pType.toLowerCase().includes(type))
        )
        
        // At least one common prediction type should be present
        expect(hasCommonType).toBe(true)
      }
    })

    it('should handle empty predictions gracefully', async () => {
      // This test might pass if no predictions exist
      const response = await fetch(`${baseUrl}/predictions`)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toMatchObject({
        data: expect.any(Array),
        meta: expect.any(Object)
      })
      // Empty array is acceptable when no predictions exist
    })
  })
})