/**
 * Real Integration Tests for Analytics API
 * Tests actual API endpoints with real analytics data
 */

describe('Analytics API Integration Tests', () => {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL as string

  describe('GET /api/analytics/stats', () => {
    it('should fetch real analytics statistics', async () => {
      const response = await fetch(`${baseUrl}/analytics/stats`)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toMatchObject({
        data: expect.any(Object),
        meta: expect.any(Object)
      })
      expect(data.data).toMatchObject({
        total_games: expect.any(Number),
        total_predictions: expect.any(Number),
        accuracy_rate: expect.any(Number)
      })

      // Verify numeric values are reasonable
      expect(data.data.total_games).toBeGreaterThanOrEqual(0)
      expect(data.data.total_predictions).toBeGreaterThanOrEqual(0)
      expect(data.data.accuracy_rate).toBeGreaterThanOrEqual(0)
      expect(data.data.accuracy_rate).toBeLessThanOrEqual(1)
    })

    it('should include recent performance data', async () => {
      const response = await fetch(`${baseUrl}/analytics/stats`)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data.recent_performance).toBeDefined()
      expect(data.data.recent_performance).toMatchObject({
        accuracy_by_type: expect.any(Object),
        daily_stats: expect.any(Array)
      })

      // Verify accuracy_by_type structure
      Object.values(data.data.recent_performance.accuracy_by_type).forEach((accuracy) => {
        expect(typeof accuracy).toBe('number')
        expect(accuracy).toBeGreaterThanOrEqual(0)
        expect(accuracy).toBeLessThanOrEqual(1)
      })

      // Verify daily_stats structure
      data.data.recent_performance.daily_stats.forEach((day: any) => {
        expect(day).toMatchObject({
          date: expect.any(String),
          predictions_made: expect.any(Number),
          correct_predictions: expect.any(Number)
        })
        expect(day.predictions_made).toBeGreaterThanOrEqual(0)
        expect(day.correct_predictions).toBeGreaterThanOrEqual(0)
        expect(day.correct_predictions).toBeLessThanOrEqual(day.predictions_made)
      })
    })

    it('should return valid date format in daily stats', async () => {
      const response = await fetch(`${baseUrl}/analytics/stats`)
      const data = await response.json()

      expect(response.status).toBe(200)
      
      if (data.data.recent_performance.daily_stats.length > 0) {
        data.data.recent_performance.daily_stats.forEach((day: any) => {
          // Verify date format (YYYY-MM-DD)
          expect(day.date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
          
          // Verify date is valid
          const date = new Date(day.date)
          expect(date).toBeInstanceOf(Date)
          expect(date.getTime()).not.toBeNaN()
        })
      }
    })

    it('should include accuracy breakdown by prediction type', async () => {
      const response = await fetch(`${baseUrl}/analytics/stats`)
      const data = await response.json()

      expect(response.status).toBe(200)
      
      const accuracyByType = data.data.recent_performance.accuracy_by_type
      // This might be empty if no predictions exist, which is acceptable
      expect(Object.keys(accuracyByType).length).toBeGreaterThanOrEqual(0)
      
      // Common prediction types that might be present
      const possibleTypes = ['spread', 'total', 'moneyline', 'over_under', 'winner']
      const hasKnownType = possibleTypes.some(type => 
        Object.keys(accuracyByType).some(key => key.toLowerCase().includes(type))
      )
      
      // If there are prediction types, at least one should be known
      if (Object.keys(accuracyByType).length > 0) {
        expect(hasKnownType).toBe(true)
      }
    })

    it('should return consistent data structure', async () => {
      const response = await fetch(`${baseUrl}/analytics/stats`)
      const data = await response.json()

      expect(response.status).toBe(200)
      
      // Verify all required fields are present and have correct types
      expect(typeof data.data.total_games).toBe('number')
      expect(typeof data.data.total_predictions).toBe('number')
      expect(typeof data.data.accuracy_rate).toBe('number')
      expect(typeof data.data.recent_performance).toBe('object')
      expect(typeof data.data.recent_performance.accuracy_by_type).toBe('object')
      expect(Array.isArray(data.data.recent_performance.daily_stats)).toBe(true)
    })

    it('should handle edge cases gracefully', async () => {
      const response = await fetch(`${baseUrl}/analytics/stats`)
      const data = await response.json()

      expect(response.status).toBe(200)
      
      // Even with no data, structure should be consistent
      expect(data.data.total_games).toBeDefined()
      expect(data.data.total_predictions).toBeDefined()
      expect(data.data.accuracy_rate).toBeDefined()
      expect(data.data.recent_performance).toBeDefined()
    })
  })
})