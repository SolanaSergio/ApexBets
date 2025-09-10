/**
 * Real Integration Tests for Sports Data Service
 * Tests actual service methods with real external API calls
 */

import { sportsDataService } from '@/lib/services/sports-data-service'

describe('Sports Data Service Integration Tests', () => {
  describe('getGames', () => {
    it('should fetch real games data', async () => {
      const games = await sportsDataService.getGames()

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
      const games = await sportsDataService.getGames({ sport: 'basketball' })

      expect(Array.isArray(games)).toBe(true)

      // All games should be basketball
      games.forEach((game) => {
        expect(game.sport).toBe('basketball')
      })
    })

    it('should fetch games with date filter', async () => {
      const today = new Date().toISOString().split('T')[0]
      const games = await sportsDataService.getGames({ date: today })

      expect(Array.isArray(games)).toBe(true)

      // All games should be on the specified date
      games.forEach((game) => {
        expect(game.date).toBe(today)
      })
    })

    it('should fetch live games', async () => {
      const games = await sportsDataService.getLiveGames()

      expect(Array.isArray(games)).toBe(true)

      // Live games should have live status
      games.forEach((game) => {
        expect(['live', 'in_progress', '1st Qtr', '2nd Qtr', '3rd Qtr', '4th Qtr']).toContain(game.status)
      })
    })

    it('should fetch games with status filter', async () => {
      const games = await sportsDataService.getGames({ status: 'scheduled' })

      expect(Array.isArray(games)).toBe(true)

      // All games should be scheduled
      games.forEach((game) => {
        expect(['scheduled', 'not_started', 'pre_game']).toContain(game.status)
      })
    })
  })

  describe('getTeams', () => {
    it('should fetch real teams data', async () => {
      const teams = await sportsDataService.getTeams()

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
      const teams = await sportsDataService.getTeams({ sport: 'basketball' })

      expect(Array.isArray(teams)).toBe(true)

      // All teams should be basketball teams
      teams.forEach((team) => {
        expect(team.sport).toBe('basketball')
      })
    })

    it('should fetch teams with search filter', async () => {
      const teams = await sportsDataService.getTeams({ search: 'Lakers' })

      expect(Array.isArray(teams)).toBe(true)

      // Results should contain Lakers
      if (teams.length > 0) {
        const hasLakers = teams.some((team) => 
          team.name.toLowerCase().includes('lakers')
        )
        expect(hasLakers).toBe(true)
      }
    })
  })

  describe('getOdds', () => {
    it('should fetch real odds data', async () => {
      const odds = await sportsDataService.getOdds()

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
      const odds = await sportsDataService.getOdds({ sport: 'basketball_nba' })

      expect(Array.isArray(odds)).toBe(true)

      // All odds should be for basketball
      odds.forEach((odd) => {
        expect(odd.sport_key).toBe('basketball_nba')
        expect(odd.sport_title).toContain('Basketball')
      })
    })

    it('should fetch odds with markets filter', async () => {
      const odds = await sportsDataService.getOdds({ markets: ['h2h', 'spreads'] })

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

  describe('getLiveScores', () => {
    it('should fetch real live scores', async () => {
      const scores = await sportsDataService.getLiveScores()

      expect(Array.isArray(scores)).toBe(true)

      if (scores.length > 0) {
        const score = scores[0]
        expect(score).toMatchObject({
          id: expect.any(String),
          homeTeam: expect.any(String),
          awayTeam: expect.any(String),
          date: expect.any(String),
          status: expect.any(String),
          league: expect.any(String),
          sport: expect.any(String)
        })

        // Live scores should have live status
        expect(['live', 'in_progress', '1st Qtr', '2nd Qtr', '3rd Qtr', '4th Qtr']).toContain(score.status)
      }
    })

    it('should fetch live scores with sport filter', async () => {
      const scores = await sportsDataService.getLiveScores('basketball')

      expect(Array.isArray(scores)).toBe(true)

      // All scores should be basketball
      scores.forEach((score) => {
        expect(score.sport).toBe('basketball')
      })
    })
  })

  describe('getGameById', () => {
    it('should fetch real game by ID', async () => {
      // First get a game ID
      const games = await sportsDataService.getGames()
      
      if (games.length > 0) {
        const gameId = games[0].id
        const game = await sportsDataService.getGameById(gameId)

        if (game) {
          expect(game).toMatchObject({
            id: expect.any(String),
            homeTeam: expect.any(String),
            awayTeam: expect.any(String),
            date: expect.any(String),
            status: expect.any(String),
            league: expect.any(String),
            sport: expect.any(String)
          })

          expect(game.id).toBe(gameId)
        }
      }
    })

    it('should return null for invalid game ID', async () => {
      const game = await sportsDataService.getGameById('invalid-id')

      expect(game).toBeNull()
    })
  })

  describe('cache management', () => {
    it('should provide cache statistics', async () => {
      // Make some requests to populate cache
      await sportsDataService.getGames()
      await sportsDataService.getTeams()

      const stats = sportsDataService.getCacheStats()

      expect(stats).toMatchObject({
        size: expect.any(Number),
        keys: expect.any(Array)
      })

      expect(stats.size).toBeGreaterThanOrEqual(0)
      expect(Array.isArray(stats.keys)).toBe(true)
    })

    it('should clear cache', async () => {
      // Make some requests to populate cache
      await sportsDataService.getGames()
      
      const statsBefore = sportsDataService.getCacheStats()
      sportsDataService.clearCache()
      const statsAfter = sportsDataService.getCacheStats()

      expect(statsAfter.size).toBe(0)
      expect(statsAfter.keys).toHaveLength(0)
    })

    it('should provide detailed cache statistics', async () => {
      // Make some requests to populate cache
      await sportsDataService.getGames()
      await sportsDataService.getTeams()

      const detailedStats = sportsDataService.getDetailedCacheStats()

      expect(detailedStats).toMatchObject({
        hits: expect.any(Number),
        misses: expect.any(Number),
        totalEntries: expect.any(Number)
      })

      expect(detailedStats.hits).toBeGreaterThanOrEqual(0)
      expect(detailedStats.misses).toBeGreaterThanOrEqual(0)
      expect(detailedStats.totalEntries).toBeGreaterThanOrEqual(0)
    })
  })

  describe('cache warmup', () => {
    it('should warm up cache with critical data', async () => {
      // Clear cache first
      sportsDataService.clearCache()

      // Warm up cache
      await sportsDataService.warmupCache()

      // Check that cache has been populated
      const stats = sportsDataService.getCacheStats()
      expect(stats.size).toBeGreaterThan(0)
    })
  })
})
