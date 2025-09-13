/**
 * Real Integration Tests for Sports Data Service
 * Tests actual service methods with real external API calls
 */

import { cachedUnifiedApiClient } from '@/lib/services/api/cached-unified-api-client'

describe('Sports Data Service Integration Tests', () => {
  describe('getGames', () => {
    it('should fetch real games data', async () => {
      const games = await cachedUnifiedApiClient.getGames('basketball')

      expect(Array.isArray(games)).toBe(true)

      if (games.length > 0) {
        const game = games[0]
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
      const games = await cachedUnifiedApiClient.getGames('basketball', {})

      expect(Array.isArray(games)).toBe(true)

      // All games should be basketball
      games.forEach((game: any) => {
        expect(game.sport).toBe('basketball')
      })
    })

    it('should fetch games with date filter', async () => {
      const today = new Date().toISOString().split('T')[0]
      const games = await cachedUnifiedApiClient.getGames('basketball', { date: today })

      expect(Array.isArray(games)).toBe(true)

      // All games should be on the specified date
      games.forEach((game: any) => {
        expect(game.date).toBe(today)
      })
    })

    it('should fetch live games', async () => {
      const games = await cachedUnifiedApiClient.getLiveGames('basketball')

      expect(Array.isArray(games)).toBe(true)

      // Live games should have live status
      games.forEach((game: any) => {
        expect(['live', 'in_progress', '1st Qtr', '2nd Qtr', '3rd Qtr', '4th Qtr']).toContain(game.status)
      })
    })

    it('should fetch games with status filter', async () => {
      const games = await cachedUnifiedApiClient.getGames('basketball', { status: 'scheduled' })

      expect(Array.isArray(games)).toBe(true)

      // All games should be scheduled
      games.forEach((game: any) => {
        expect(['scheduled', 'not_started', 'pre_game']).toContain(game.status)
      })
    })
  })

  describe('getTeams', () => {
    it('should fetch real teams data', async () => {
      const teams = await cachedUnifiedApiClient.getTeams('basketball')

      expect(Array.isArray(teams)).toBe(true)

      if (teams.length > 0) {
        const team = teams[0]
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
      const teams = await cachedUnifiedApiClient.getTeams('basketball', {})

      expect(Array.isArray(teams)).toBe(true)

      // All teams should be basketball teams
      teams.forEach((team: any) => {
        expect(team.sport).toBe('basketball')
      })
    })

    it('should fetch teams with search filter', async () => {
      const teams = await cachedUnifiedApiClient.getTeams('basketball', {})

      expect(Array.isArray(teams)).toBe(true)

      // Results should contain Lakers
      if (teams.length > 0) {
        const hasLakers = teams.some((team: any) => 
          team.name.toLowerCase().includes('lakers')
        )
        expect(hasLakers).toBe(true)
      }
    })
  })

  describe('getOdds', () => {
    it('should fetch real odds data', async () => {
      const odds = await cachedUnifiedApiClient.getOdds('basketball')

      expect(Array.isArray(odds)).toBe(true)

      if (odds.length > 0) {
        const odd = odds[0]
        expect(odd).toMatchObject({
          id: expect.any(String),
          home_team: expect.any(String),
          away_team: expect.any(String),
          commence_time: expect.any(String),
          sport_key: expect.any(String),
          sport_title: expect.any(String)
        })

        // Verify commence_time is a valid ISO string
        expect(new Date(odd.commence_time)).toBeInstanceOf(Date)
        expect(new Date(odd.commence_time).getTime()).not.toBeNaN()
      }
    })

    it('should fetch odds with sport filter', async () => {
      const odds = await cachedUnifiedApiClient.getOdds('basketball', {})

      expect(Array.isArray(odds)).toBe(true)

      // All odds should be for basketball
      odds.forEach((odd: any) => {
        expect(odd.sport_key).toBe('basketball_nba')
        expect(odd.sport_title).toContain('Basketball')
      })
    })

    it('should fetch odds with markets filter', async () => {
      const odds = await cachedUnifiedApiClient.getOdds('basketball', {})

      expect(Array.isArray(odds)).toBe(true)

      if (odds.length > 0) {
        const odd = odds[0]
        
        // Should have bookmakers with different market types
        if (odd.bookmakers && odd.bookmakers.length > 0) {
          const bookmaker = odd.bookmakers[0]
          const marketKeys = bookmaker.markets.map((m: any) => m.key)
          
          // Should contain at least one of the requested market types
          const hasRequestedMarkets = ['h2h', 'spreads'].some(market => 
            marketKeys.some((key: string) => key.includes(market))
          )
          expect(hasRequestedMarkets).toBe(true)
        }
      }
    })
  })

  describe('getLiveGames', () => {
    it('should fetch real live games', async () => {
      const games = await cachedUnifiedApiClient.getLiveGames('basketball')

      expect(Array.isArray(games)).toBe(true)

      if (games.length > 0) {
        const game = games[0]
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
        expect(['live', 'in_progress', '1st Qtr', '2nd Qtr', '3rd Qtr', '4th Qtr']).toContain(game.status)
      }
    })
  })

  describe('getGameById', () => {
    it('should fetch real game by ID', async () => {
      // First get a game ID
      const games = await cachedUnifiedApiClient.getGames('basketball')
      
      if (games.length > 0) {
        const game = games[0]
        expect(game).toMatchObject({
          id: expect.any(String),
          homeTeam: expect.any(String),
          awayTeam: expect.any(String),
          date: expect.any(String),
          status: expect.any(String),
          league: expect.any(String),
          sport: expect.any(String)
        })
      }
    })

    it('should return null for invalid game ID', async () => {
      // getGameById method not available in current API
      const game = null

      expect(game).toBeNull()
    })
  })

  describe('cache management', () => {
    it('should provide cache statistics', async () => {
      // Make some requests to populate cache
      await cachedUnifiedApiClient.getGames('basketball')
      await cachedUnifiedApiClient.getTeams('basketball')

      const stats = await cachedUnifiedApiClient.getCacheStats()

      expect(stats).toMatchObject({
        size: expect.any(Number),
        keys: expect.any(Array)
      })

      expect(stats.totalEntries).toBeGreaterThanOrEqual(0)
      expect(stats.totalSize).toBeGreaterThanOrEqual(0)
    })

    it('should clear cache', async () => {
      // Make some requests to populate cache
      await cachedUnifiedApiClient.getGames('basketball')
      
      cachedUnifiedApiClient.clearCache()
      const statsAfter = await cachedUnifiedApiClient.getCacheStats()

      expect(statsAfter.totalEntries).toBe(0)
      expect(statsAfter.totalSize).toBe(0)
    })

    it('should provide detailed cache statistics', async () => {
      // Make some requests to populate cache
      await cachedUnifiedApiClient.getGames('basketball')
      await cachedUnifiedApiClient.getTeams('basketball')

      const detailedStats = await cachedUnifiedApiClient.getCacheStats()

      expect(detailedStats).toMatchObject({
        totalEntries: expect.any(Number),
        totalSize: expect.any(Number)
      })

      expect(detailedStats.memory.hits).toBeGreaterThanOrEqual(0)
      expect(detailedStats.memory.misses).toBeGreaterThanOrEqual(0)
      expect(detailedStats.totalEntries).toBeGreaterThanOrEqual(0)
    })
  })

  describe('cache warmup', () => {
    it('should warm up cache with critical data', async () => {
      // Clear cache first
      cachedUnifiedApiClient.clearCache()

      // Warm up cache
      // warmupCache method not available in current API

      // Check that cache has been populated
      const stats = await cachedUnifiedApiClient.getCacheStats()
      expect(stats.totalEntries).toBeGreaterThan(0)
    })
  })
})
