/**
 * SOCCER SERVICE
 * Multi-league soccer service (Premier League, La Liga, etc.)
 */

import { sportsDBClient } from '../../sports-apis'
import { cacheManager } from '@/lib/cache'
import { rateLimiter } from '../../services/rate-limiter'
import { errorHandlingService } from '../../services/error-handling-service'

export interface SoccerGame {
  id: string
  homeTeam: string
  awayTeam: string
  date: string
  time?: string
  status: 'scheduled' | 'live' | 'finished'
  homeScore?: number
  awayScore?: number
  league: string
  venue?: string
  half?: number
  timeRemaining?: string
  homeTeamStats?: {
    goals: number
    shots: number
    possession: number
    passes: number
  }
  awayTeamStats?: {
    goals: number
    shots: number
    possession: number
    passes: number
  }
}

export interface SoccerTeam {
  id: string
  name: string
  abbreviation: string
  city: string
  country: string
  league: string
  logo?: string
  stats?: {
    wins: number
    draws: number
    losses: number
    points: number
    goalsFor: number
    goalsAgainst: number
    goalDifferential: number
  }
}

export interface SoccerPlayer {
  id: string
  name: string
  team: string
  position: string
  number: number
  nationality: string
  stats?: {
    goals: number
    assists: number
    yellowCards: number
    redCards: number
  }
}

export class SoccerService {
  private readonly CACHE_TTL = 5 * 60 * 1000 // 5 minutes
  private readonly LIVE_TTL = 30 * 1000 // 30 seconds

  constructor() {}

  async getGames(params: {
    date?: string
    status?: 'scheduled' | 'live' | 'finished'
    teamId?: string
    league?: string
  } = {}): Promise<SoccerGame[]> {
    const cacheKey = `soccer:games:${JSON.stringify(params)}`
    const ttl = params.status === 'live' ? this.LIVE_TTL : this.CACHE_TTL

    const cached = await cacheManager.getAsync<any[]>(cacheKey)
    return cached || await this.fetchGames(params, cacheKey, ttl)
  }

  private async fetchGames(params: any, cacheKey: string, ttl: number): Promise<SoccerGame[]> {
    const games: SoccerGame[] = []

    try {
      // Try SportsDB for soccer games
      try {
        await rateLimiter.waitForRateLimit('sportsdb')
        const events = await sportsDBClient.getEventsByDate(
          params.date || new Date().toISOString().split('T')[0],
          'soccer'
        )
        games.push(...events.map(this.mapSportsDBEvent))
      } catch (error) {
        errorHandlingService.logError(error as any, { context: 'SportsDB Soccer' })
      }

      // If no real data available, return empty array instead of mock data
      cacheManager.set(cacheKey, games, ttl)
      return games
    } catch (error) {
      errorHandlingService.logError(error as any, { context: 'Soccer games fetch' })
      return []
    }
  }

  async getTeams(params: {
    league?: string
    search?: string
  } = {}): Promise<SoccerTeam[]> {
    const cacheKey = `soccer:teams:${JSON.stringify(params)}`

    const cached = await cacheManager.getAsync<any[]>(cacheKey)
    return cached || await this.fetchTeams(params, cacheKey)
  }

  private async fetchTeams(params: any, cacheKey: string): Promise<SoccerTeam[]> {
    const teams: SoccerTeam[] = []

    try {
      // Try SportsDB for soccer teams
      try {
        await rateLimiter.waitForRateLimit('sportsdb')
        const sportsDBTeams = await sportsDBClient.searchTeams(params.search || 'soccer')
        teams.push(...sportsDBTeams.map(this.mapSportsDBTeam))
      } catch (error) {
        errorHandlingService.logError(error as any, { context: 'SportsDB teams' })
      }

      // Filter by search if provided
      let filteredTeams = teams
      if (params.search) {
        const searchTerm = params.search.toLowerCase()
        filteredTeams = teams.filter(team => 
          team.name.toLowerCase().includes(searchTerm) ||
          team.abbreviation.toLowerCase().includes(searchTerm) ||
          team.city.toLowerCase().includes(searchTerm)
        )
      }

      cacheManager.set(cacheKey, filteredTeams, 30 * 60 * 1000) // 30 minutes
      return filteredTeams
    } catch (error) {
      errorHandlingService.logError(error as any, { context: 'Soccer teams fetch' })
      return []
    }
  }

  async getPlayers(params: {
    teamId?: string
    search?: string
  } = {}): Promise<SoccerPlayer[]> {
    const cacheKey = `soccer:players:${JSON.stringify(params)}`

    const cached = await cacheManager.getAsync<any[]>(cacheKey)
    return cached || await this.fetchPlayers(params, cacheKey)
  }

  private async fetchPlayers(params: any, cacheKey: string): Promise<SoccerPlayer[]> {
    try {
      // For now, return empty array - would integrate with soccer API
      const players: SoccerPlayer[] = []
      cacheManager.set(cacheKey, players, 30 * 60 * 1000)
      return players
    } catch (error) {
      errorHandlingService.logError(error as any, { context: 'Soccer players fetch' })
      return []
    }
  }

  async getLiveGames(): Promise<SoccerGame[]> {
    return this.getGames({ status: 'live' })
  }

  async getStandings(league: string = 'Premier League'): Promise<any[]> {
    const cacheKey = `soccer:standings:${league}`
    
    const cached = await cacheManager.getAsync<any[]>(cacheKey)
    return cached || await this.fetchStandings(league, cacheKey)
  }

  private async fetchStandings(league: string, cacheKey: string): Promise<any[]> {
    try {
      // For now, return empty array - would integrate with appropriate API
      const standings: any[] = []
      cacheManager.set(cacheKey, standings, 60 * 60 * 1000) // 1 hour
      return standings
    } catch (error) {
      errorHandlingService.logError(error as any, { context: 'Soccer standings fetch' })
      return []
    }
  }

  async getOdds(params: any = {}): Promise<any[]> {
    const cacheKey = `soccer:odds:${JSON.stringify(params)}`
    
    const cached = await cacheManager.getAsync<any[]>(cacheKey)
    return cached || await this.fetchOdds(params, cacheKey)
  }

  private async fetchOdds(params: any, cacheKey: string): Promise<any[]> {
    try {
      // Would integrate with odds API
      const odds: any[] = []
      cacheManager.set(cacheKey, odds, 2 * 60 * 1000) // 2 minutes
      return odds
    } catch (error) {
      errorHandlingService.logError(error as any, { context: 'Soccer odds fetch' })
      return []
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.getTeams({ league: 'Premier League' })
      return true
    } catch (error) {
      return false
    }
  }

  // Mappers
  private mapSportsDBEvent(event: any): SoccerGame {
    return {
      id: event.idEvent,
      homeTeam: event.strHomeTeam,
      awayTeam: event.strAwayTeam,
      date: event.dateEvent,
      time: event.strTime,
      status: event.strStatus === 'FT' ? 'finished' : event.strStatus === 'LIVE' ? 'live' : 'scheduled',
      homeScore: event.intHomeScore ? parseInt(event.intHomeScore) : 0,
      awayScore: event.intAwayScore ? parseInt(event.intAwayScore) : 0,
      league: event.strLeague,
      venue: event.strVenue
    }
  }

  private mapSportsDBTeam(team: any): SoccerTeam {
    return {
      id: team.idTeam,
      name: team.strTeam,
      abbreviation: team.strTeamShort,
      city: team.strTeam.split(' ').slice(0, -1).join(' '),
      country: team.strCountry || 'Unknown',
      league: team.strLeague || 'Unknown',
      logo: team.strTeamBadge
    }
  }
}

// Export the class for dependency injection
// Use serviceFactory.getSoccerService() to get an instance