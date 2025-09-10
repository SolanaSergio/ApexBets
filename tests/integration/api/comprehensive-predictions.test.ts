/**
 * Comprehensive Predictions API Integration Tests
 * Tests all predictions functionality with real NBA data
 * NO MOCK DATA - All tests use real prediction data
 */

describe('Comprehensive Predictions API Tests', () => {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'

  describe('GET /api/predictions - Real NBA Predictions', () => {
    it('should fetch real predictions with proper data structure', async () => {
      const response = await fetch(`${baseUrl}/predictions`)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toMatchObject({
        data: expect.any(Array)
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

        // Verify prediction type is valid
        const validTypes = ['winner', 'spread', 'total', 'over_under']
        expect(validTypes).toContain(prediction.prediction_type)
      }
    })

    it('should fetch predictions with game information', async () => {
      const response = await fetch(`${baseUrl}/predictions`)
      const data = await response.json()

      expect(response.status).toBe(200)

      if (data.data.length > 0) {
        const prediction = data.data[0]
        
        // Check if game information is included
        if (prediction.game) {
          expect(prediction.game).toMatchObject({
            id: expect.any(String),
            home_team: expect.any(Object),
            away_team: expect.any(Object),
            game_date: expect.any(String),
            status: expect.any(String)
          })

          // Verify team information structure
          if (prediction.game.home_team) {
            expect(prediction.game.home_team).toMatchObject({
              name: expect.any(String),
              abbreviation: expect.any(String)
            })
          }

          if (prediction.game.away_team) {
            expect(prediction.game.away_team).toMatchObject({
              name: expect.any(String),
              abbreviation: expect.any(String)
            })
          }
        }
      }
    })

    it('should fetch predictions with limit parameter', async () => {
      const limit = 5
      const response = await fetch(`${baseUrl}/predictions?limit=${limit}`)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(Array.isArray(data.data)).toBe(true)
      expect(data.data.length).toBeLessThanOrEqual(limit)
    })

    it('should fetch predictions by game ID', async () => {
      // First get a game ID
      const gamesResponse = await fetch(`${baseUrl}/games`)
      const gamesData = await gamesResponse.json()

      if (gamesData.data && gamesData.data.length > 0) {
        const gameId = gamesData.data[0].id

        const response = await fetch(`${baseUrl}/predictions?game_id=${gameId}`)
        const data = await response.json()

        expect(response.status).toBe(200)
        
        // Should return either a single prediction or array of predictions
        if (Array.isArray(data)) {
          data.forEach((prediction: any) => {
            expect(prediction.game_id).toBe(gameId)
          })
        } else {
          expect(data.gameId).toBe(gameId)
        }
      }
    })

    it('should fetch predictions by prediction type', async () => {
      const response = await fetch(`${baseUrl}/predictions?prediction_type=winner`)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(Array.isArray(data.data)).toBe(true)

      data.data.forEach((prediction: any) => {
        expect(prediction.prediction_type).toBe('winner')
      })
    })

    it('should fetch predictions by model name', async () => {
      const response = await fetch(`${baseUrl}/predictions`)
      const data = await response.json()

      expect(response.status).toBe(200)

      if (data.data.length > 0) {
        const modelName = data.data[0].model_name

        const modelResponse = await fetch(`${baseUrl}/predictions?model_name=${modelName}`)
        const modelData = await modelResponse.json()

        expect(modelResponse.status).toBe(200)
        expect(Array.isArray(modelData.data)).toBe(true)

        modelData.data.forEach((prediction: any) => {
          expect(prediction.model_name).toBe(modelName)
        })
      }
    })

    it('should validate prediction confidence scores', async () => {
      const response = await fetch(`${baseUrl}/predictions`)
      const data = await response.json()

      expect(response.status).toBe(200)

      data.data.forEach((prediction: any) => {
        expect(prediction.confidence).toBeGreaterThanOrEqual(0)
        expect(prediction.confidence).toBeLessThanOrEqual(1)
        expect(typeof prediction.confidence).toBe('number')
      })
    })

    it('should validate prediction values are reasonable', async () => {
      const response = await fetch(`${baseUrl}/predictions`)
      const data = await response.json()

      expect(response.status).toBe(200)

      data.data.forEach((prediction: any) => {
        expect(typeof prediction.predicted_value).toBe('number')
        
        // For winner predictions, value should be between 0 and 1
        if (prediction.prediction_type === 'winner') {
          expect(prediction.predicted_value).toBeGreaterThanOrEqual(0)
          expect(prediction.predicted_value).toBeLessThanOrEqual(1)
        }
        
        // For spread predictions, value should be reasonable range
        if (prediction.prediction_type === 'spread') {
          expect(prediction.predicted_value).toBeGreaterThanOrEqual(-50)
          expect(prediction.predicted_value).toBeLessThanOrEqual(50)
        }
        
        // For total predictions, value should be reasonable range
        if (prediction.prediction_type === 'total') {
          expect(prediction.predicted_value).toBeGreaterThanOrEqual(100)
          expect(prediction.predicted_value).toBeLessThanOrEqual(300)
        }
      })
    })

    it('should include actual values for completed predictions', async () => {
      const response = await fetch(`${baseUrl}/predictions`)
      const data = await response.json()

      expect(response.status).toBe(200)

      data.data.forEach((prediction: any) => {
        if (prediction.actual_value !== null && prediction.actual_value !== undefined) {
          expect(typeof prediction.actual_value).toBe('number')
        }
        
        if (prediction.is_correct !== null && prediction.is_correct !== undefined) {
          expect(typeof prediction.is_correct).toBe('boolean')
        }
      })
    })
  })

  describe('POST /api/predictions - Create Predictions', () => {
    it('should create a new prediction', async () => {
      // First get a game ID
      const gamesResponse = await fetch(`${baseUrl}/games`)
      const gamesData = await gamesResponse.json()

      if (gamesData.data && gamesData.data.length > 0) {
        const gameId = gamesData.data[0].id

        const predictionData = {
          game_id: gameId,
          predicted_winner: 'home',
          confidence: 0.75,
          prediction_type: 'winner',
          reasoning: 'Based on recent performance and home court advantage'
        }

        const response = await fetch(`${baseUrl}/predictions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(predictionData)
        })

        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.success).toBe(true)
        expect(data.data).toMatchObject({
          id: expect.any(String),
          game_id: gameId,
          predicted_winner: 'home',
          confidence: 0.75,
          prediction_type: 'winner'
        })
      }
    })

    it('should create prediction with minimal required fields', async () => {
      // First get a game ID
      const gamesResponse = await fetch(`${baseUrl}/games`)
      const gamesData = await gamesResponse.json()

      if (gamesData.data && gamesData.data.length > 0) {
        const gameId = gamesData.data[0].id

        const predictionData = {
          game_id: gameId,
          predicted_winner: 'away'
        }

        const response = await fetch(`${baseUrl}/predictions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(predictionData)
        })

        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.success).toBe(true)
        expect(data.data).toMatchObject({
          id: expect.any(String),
          game_id: gameId,
          predicted_winner: 'away'
        })
      }
    })

    it('should reject prediction creation with missing required fields', async () => {
      const predictionData = {
        confidence: 0.75
        // Missing game_id and predicted_winner
      }

      const response = await fetch(`${baseUrl}/predictions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(predictionData)
      })

      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Missing required fields')
    })

    it('should create prediction with all optional fields', async () => {
      // First get a game ID
      const gamesResponse = await fetch(`${baseUrl}/games`)
      const gamesData = await gamesResponse.json()

      if (gamesData.data && gamesData.data.length > 0) {
        const gameId = gamesData.data[0].id

        const predictionData = {
          game_id: gameId,
          predicted_winner: 'home',
          confidence: 0.85,
          prediction_type: 'winner',
          reasoning: 'Comprehensive analysis of team performance',
          status: 'pending'
        }

        const response = await fetch(`${baseUrl}/predictions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(predictionData)
        })

        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.success).toBe(true)
        expect(data.data).toMatchObject({
          id: expect.any(String),
          game_id: gameId,
          predicted_winner: 'home',
          confidence: 0.85,
          prediction_type: 'winner',
          reasoning: 'Comprehensive analysis of team performance',
          status: 'pending'
        })
      }
    })
  })

  describe('Prediction Data Validation', () => {
    it('should validate prediction types are valid', async () => {
      const response = await fetch(`${baseUrl}/predictions`)
      const data = await response.json()

      expect(response.status).toBe(200)

      const validTypes = ['winner', 'spread', 'total', 'over_under']
      data.data.forEach((prediction: any) => {
        expect(validTypes).toContain(prediction.prediction_type)
      })
    })

    it('should validate model names are not empty', async () => {
      const response = await fetch(`${baseUrl}/predictions`)
      const data = await response.json()

      expect(response.status).toBe(200)

      data.data.forEach((prediction: any) => {
        expect(prediction.model_name).toBeDefined()
        expect(typeof prediction.model_name).toBe('string')
        expect(prediction.model_name.trim().length).toBeGreaterThan(0)
      })
    })

    it('should validate timestamps are recent', async () => {
      const response = await fetch(`${baseUrl}/predictions`)
      const data = await response.json()

      expect(response.status).toBe(200)

      data.data.forEach((prediction: any) => {
        const createdAt = new Date(prediction.created_at)
        const now = new Date()
        const timeDiff = now.getTime() - createdAt.getTime()
        
        // Predictions should be from within the last 30 days
        expect(timeDiff).toBeLessThan(30 * 24 * 60 * 60 * 1000)
      })
    })

    it('should validate game IDs exist', async () => {
      const response = await fetch(`${baseUrl}/predictions`)
      const data = await response.json()

      expect(response.status).toBe(200)

      if (data.data.length > 0) {
        const gameIds = data.data.map((p: any) => p.game_id)
        const uniqueGameIds = [...new Set(gameIds)]

        // Verify each game ID exists
        for (const gameId of uniqueGameIds) {
          const gameResponse = await fetch(`${baseUrl}/games/${gameId}`)
          // Should not return 404
          expect(gameResponse.status).not.toBe(404)
        }
      }
    })
  })

  describe('Performance Tests', () => {
    it('should respond within acceptable time limits', async () => {
      const startTime = Date.now()
      const response = await fetch(`${baseUrl}/predictions`)
      const endTime = Date.now()

      expect(response.status).toBe(200)
      expect(endTime - startTime).toBeLessThan(5000) // 5 seconds max
    })

    it('should handle concurrent requests efficiently', async () => {
      const requests = Array(5).fill(null).map(() => 
        fetch(`${baseUrl}/predictions`)
      )

      const responses = await Promise.all(requests)
      
      responses.forEach(response => {
        expect(response.status).toBe(200)
      })
    })
  })

  describe('Error Handling', () => {
    it('should handle invalid game ID gracefully', async () => {
      const response = await fetch(`${baseUrl}/predictions?game_id=invalid_id`)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(Array.isArray(data.data)).toBe(true)
    })

    it('should handle invalid prediction type gracefully', async () => {
      const response = await fetch(`${baseUrl}/predictions?prediction_type=invalid_type`)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(Array.isArray(data.data)).toBe(true)
    })

    it('should handle server errors gracefully', async () => {
      const response = await fetch(`${baseUrl}/predictions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: 'invalid json'
      })

      expect(response.status).toBe(500)
    })
  })
})
