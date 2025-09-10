/**
 * Enhanced Sports Data Service
 * Centralized service with rate limiting, caching, and error handling
 */

import { 
  sportsDBClient, 
  apiSportsClient, 
  ballDontLieClient, 
  oddsApiClient,
  type SportsDBEvent,
  type ApiSportsFixture,
  type BallDontLieGame,
  type OddsApiEvent
} from '../sports-apis'
import { rateLimiter } from './rate-limiter'
import { cacheService } from './cache-service'
import { errorHandlingService } from './error-handling-service'
import { apiRateLimiter } from '@/lib/rules/api-rate-limiter'

interface GameData {
  id: string
  homeTeam: string
  awayTeam: string
  date: string
  time?: string
  status: string
  homeScore?: number
  awayScore?: number
  league: string
  sport: string
  venue?: string
  odds?: {
    home: number
    away: number
    spread?: number
    total?: number
    source: string
  }[]
  predictions?: {
    homeWinProbability: number
    awayWinProbability: number
    predictedSpread: number
    predictedTotal: number
    confidence: number
    model: string
  }
}

interface TeamData {
  id: string
  name: string
  abbreviation: string
  league: string
  sport: string
  city?: string
  logo?: string
  stats?: {
    wins: number
    losses: number
    winPercentage: number
    pointsFor: number
    pointsAgainst: number
    pointDifferential: number
  }
}

interface PlayerData {
  id: string
  name: string
  team: string
  position?: string
  stats?: {
    points: number
    rebounds: number
    assists: number
    fieldGoalPercentage: number
    threePointPercentage: number
    freeThrowPercentage: number
  }
}

export class SportsDataService {
  private readonly DEFAULT_TTL = 5 * 60 * 1000 // 5 minutes
  private readonly ODDS_TTL = 2 * 60 * 1000 // 2 minutes for odds
  private readonly LIVE_TTL = 30 * 1000 // 30 seconds for live data

  private getCacheKey(prefix: string, ...params: (string | number)[]): string {
    return `sports:${prefix}:${params.join(':')}`
  }

  private async getCachedOrFetch<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttl: number = this.DEFAULT_TTL,
    service: string = 'sportsdb'
  ): Promise<T> {
    // Check cache first
    const cached = cacheService.get<T>(key)
    if (cached) {
      return cached
    }

    // Check API rate limit
    try {
      apiRateLimiter.checkRateLimit(service as any)
    } catch (rateLimitError) {
      console.warn(`Rate limit exceeded for ${service}:`, rateLimitError.message)
      throw rateLimitError
    }

    // Wait for rate limit
    await rateLimiter.waitForRateLimit(service)

    // Make request with error handling and retry
    const startTime = Date.now()
    try {
      const data = await errorHandlingService.withRetry(
        fetchFn,
        3,
        1000,
        { service, operation: 'fetch' }
      )

      const responseTime = Date.now() - startTime
      rateLimiter.recordRequest(service, responseTime, false)
      
      // Record successful API request
      apiRateLimiter.recordRequest(service as any)

      // Cache the result
      cacheService.set(key, data, ttl)
      return data
    } catch (error) {
      const responseTime = Date.now() - startTime
      rateLimiter.recordRequest(service, responseTime, true)
      throw error
    }
  }

  // Games/Fixtures
  async getGames(params: {
    sport?: string
    league?: string
    date?: string
    status?: 'scheduled' | 'live' | 'finished'
    teamId?: string
  } = {}): Promise<GameData[]> {
    const key = this.getCacheKey('games', JSON.stringify(params))
    const ttl = params.status === 'live' ? this.LIVE_TTL : this.DEFAULT_TTL
    
    return this.getCachedOrFetch(key, async () => {
      const games: GameData[] = []
      
      try {
        // Try SportsDB first (most reliable free API)
        const events = await sportsDBClient.getEventsByDate(
          params.date || new Date().toISOString().split('T')[0],
          params.sport || 'basketball'
        )
        
        games.push(...events.map(this.mapSportsDBEvent))
        
        // Add NBA-specific data from BALLDONTLIE if basketball
        if (params.sport === 'basketball' || !params.sport) {
          try {
            const nbaGames = await ballDontLieClient.getGames({
              start_date: params.date,
              end_date: params.date
            })
            
            games.push(...nbaGames.data.map(this.mapBallDontLieGame))
          } catch (nbaError) {
            if (nbaError.message.includes('API key not configured')) {
              console.warn('BALLDONTLIE API key not configured - skipping NBA data')
            } else {
              console.warn('BALLDONTLIE API error:', nbaError.message)
            }
            // Continue without NBA data
          }
        }
        
        // Try API-SPORTS only if we have a valid API key and need live data
        if (params.status === 'live' && process.env.NEXT_PUBLIC_RAPIDAPI_KEY && process.env.NEXT_PUBLIC_RAPIDAPI_KEY !== 'your_rapidapi_key') {
          try {
            const fixtures = await apiSportsClient.getFixtures({
              date: params.date,
              live: 'all'
            })
            
            games.push(...fixtures.map(this.mapApiSportsFixture))
          } catch (apiSportsError) {
            console.warn('API-SPORTS error:', apiSportsError)
            // Continue without API-SPORTS data
          }
        }
        
        return games
      } catch (error) {
        console.error('Error fetching games:', error)
        return []
      }
    }, ttl, 'sportsdb')
  }

  async getLiveGames(): Promise<GameData[]> {
    return this.getGames({ status: 'live' })
  }

  async getGameById(gameId: string, source: 'sportsdb' | 'apisports' | 'balldontlie' = 'sportsdb'): Promise<GameData | null> {
    const key = this.getCacheKey('game', gameId, source)
    const service = source === 'apisports' ? 'rapidapi' : source === 'balldontlie' ? 'balldontlie' : 'sportsdb'
    
    return this.getCachedOrFetch(key, async () => {
      try {
        switch (source) {
          case 'sportsdb':
            const event = await sportsDBClient.getEventById(gameId)
            return event ? this.mapSportsDBEvent(event) : null
          case 'apisports':
            const fixture = await apiSportsClient.getFixtureById(parseInt(gameId))
            return fixture ? this.mapApiSportsFixture(fixture) : null
          case 'balldontlie':
            const game = await ballDontLieClient.getGameById(parseInt(gameId))
            return this.mapBallDontLieGame(game)
          default:
            return null
        }
      } catch (error) {
        console.error(`Error fetching game ${gameId} from ${source}:`, error)
        return null
      }
    }, this.DEFAULT_TTL, service)
  }

  // Teams
  async getTeams(params: {
    sport?: string
    league?: string
    search?: string
  } = {}): Promise<TeamData[]> {
    const key = this.getCacheKey('teams', JSON.stringify(params))
    
    return this.getCachedOrFetch(key, async () => {
      const teams: TeamData[] = []
      
      try {
        // Get NBA teams from BALLDONTLIE
        if (params.sport === 'basketball' || !params.sport) {
          try {
            const nbaTeams = await ballDontLieClient.getTeams()
            teams.push(...nbaTeams.data.map(this.mapBallDontLieTeam))
          } catch (nbaError) {
            if (nbaError.message.includes('API key not configured')) {
              console.warn('BALLDONTLIE API key not configured - skipping NBA teams')
            } else {
              console.warn('BALLDONTLIE API error:', nbaError.message)
            }
            // Continue without NBA teams
          }
        }
        
        // Get teams from SportsDB for broader coverage
        if (params.search) {
          const sportsDBTeams = await sportsDBClient.searchTeams(params.search)
          teams.push(...sportsDBTeams.map(this.mapSportsDBTeam))
        }
        
        return teams
      } catch (error) {
        console.error('Error fetching teams:', error)
        return []
      }
    }, 30 * 60 * 1000, 'sportsdb') // 30 minutes for teams
  }

  // Odds
  async getOdds(params: {
    sport?: string
    gameId?: string
    markets?: string[]
  } = {}): Promise<OddsApiEvent[]> {
    const key = this.getCacheKey('odds', JSON.stringify(params))
    
    return this.getCachedOrFetch(key, async () => {
      try {
        return await oddsApiClient.getOdds({
          sport: params.sport || 'basketball_nba',
          markets: params.markets?.join(',') || 'h2h,spreads,totals'
        })
      } catch (error) {
        console.error('Error fetching odds:', error)
        return []
      }
    }, this.ODDS_TTL, 'odds')
  }

  // Live scores
  async getLiveScores(sport?: string): Promise<GameData[]> {
    const key = this.getCacheKey('live-scores', sport || 'all')
    
    return this.getCachedOrFetch(key, async () => {
      try {
        // Try to get live games from SportsDB first
        const liveEvents = await sportsDBClient.getLiveEvents(sport || 'basketball')
        const liveGames = liveEvents.map(this.mapSportsDBEvent)
        
        // If we have a valid Odds API key, try to get additional live scores
        if (process.env.NEXT_PUBLIC_ODDS_API_KEY && process.env.NEXT_PUBLIC_ODDS_API_KEY !== 'your_odds_api_key') {
          try {
            const scores = await oddsApiClient.getScores({ sport })
            liveGames.push(...scores.map(this.mapOddsApiScores))
          } catch (oddsError) {
            console.warn('Odds API error for live scores:', oddsError)
            // Continue with SportsDB data only
          }
        }
        
        return liveGames
      } catch (error) {
        console.error('Error fetching live scores:', error)
        return []
      }
    }, this.LIVE_TTL, 'sportsdb')
  }

  // Mappers
  private mapSportsDBEvent(event: SportsDBEvent): GameData {
    return {
      id: event.idEvent,
      homeTeam: event.strHomeTeam,
      awayTeam: event.strAwayTeam,
      date: event.dateEvent,
      time: event.strTime,
      status: event.strStatus,
      homeScore: event.intHomeScore ? parseInt(event.intHomeScore) : undefined,
      awayScore: event.intAwayScore ? parseInt(event.intAwayScore) : undefined,
      league: event.strLeague,
      sport: event.strSport,
      venue: event.strVenue
    }
  }

  private mapApiSportsFixture(fixture: ApiSportsFixture): GameData {
    return {
      id: fixture.fixture.id.toString(),
      homeTeam: fixture.teams.home.name,
      awayTeam: fixture.teams.away.name,
      date: fixture.fixture.date.split('T')[0],
      time: fixture.fixture.date.split('T')[1]?.split('.')[0],
      status: fixture.fixture.status.short,
      homeScore: fixture.goals.home,
      awayScore: fixture.goals.away,
      league: fixture.league.name,
      sport: 'basketball',
      venue: fixture.fixture.venue.name
    }
  }

  private mapBallDontLieGame(game: BallDontLieGame): GameData {
    return {
      id: game.id.toString(),
      homeTeam: game.home_team.full_name,
      awayTeam: game.visitor_team.full_name,
      date: game.date,
      time: game.time,
      status: game.status,
      homeScore: game.home_team_score,
      awayScore: game.visitor_team_score,
      league: 'NBA',
      sport: 'basketball',
      venue: undefined
    }
  }

  private mapBallDontLieTeam(team: any): TeamData {
    return {
      id: team.id.toString(),
      name: team.full_name,
      abbreviation: team.abbreviation,
      league: 'NBA',
      sport: 'basketball',
      city: team.city
    }
  }

  private mapSportsDBTeam(team: any): TeamData {
    return {
      id: team.idTeam,
      name: team.strTeam,
      abbreviation: team.strTeamShort,
      league: team.strLeague,
      sport: team.strSport,
      city: team.strTeam.split(' ').slice(0, -1).join(' '),
      logo: team.strTeamBadge
    }
  }

  private mapOddsApiScores(score: any): GameData {
    return {
      id: score.id,
      homeTeam: score.home_team,
      awayTeam: score.away_team,
      date: score.commence_time.split('T')[0],
      time: score.commence_time.split('T')[1]?.split('.')[0],
      status: score.completed ? 'finished' : 'live',
      homeScore: score.scores.find((s: any) => s.name === score.home_team)?.score ? 
        parseInt(score.scores.find((s: any) => s.name === score.home_team).score) : undefined,
      awayScore: score.scores.find((s: any) => s.name === score.away_team)?.score ? 
        parseInt(score.scores.find((s: any) => s.name === score.away_team).score) : undefined,
      league: score.sport_title,
      sport: score.sport_key
    }
  }

  // Cache management
  clearCache(): void {
    cacheService.clear()
  }

  clearExpiredCache(): void {
    // Cache service handles expiration automatically
    // This method is kept for backward compatibility
  }

  getCacheStats(): { size: number; keys: string[] } {
    const stats = cacheService.getStats()
    return {
      size: stats.totalEntries,
      keys: cacheService.keys()
    }
  }

  // Enhanced cache management
  getDetailedCacheStats() {
    return cacheService.getStats()
  }

  getCacheSizeInfo() {
    return cacheService.getSizeInfo()
  }

  // Warm up cache with critical data
  async warmupCache(): Promise<void> {
    try {
      await Promise.all([
        this.getTeams({ sport: 'basketball' }),
        this.getGames({ status: 'live' }),
        this.getOdds({ sport: 'basketball_nba' })
      ])
    } catch (error) {
      console.warn('Cache warmup failed:', error)
    }
  }
}

export const sportsDataService = new SportsDataService()
