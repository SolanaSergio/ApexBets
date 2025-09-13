/**
 * BASEBALL SERVICE
 * MLB-focused service
 */

import { sportsDBClient } from '../../sports-apis'
import { cacheManager } from '@/lib/cache'
import { rateLimiter } from '../../services/rate-limiter'
import { errorHandlingService } from '../../services/error-handling-service'

export interface BaseballGame {
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
  inning?: number
  homeTeamStats?: {
    hits: number
    runs: number
    errors: number
  }
  awayTeamStats?: {
    hits: number
    runs: number
    errors: number
  }
}

export interface BaseballTeam {
  id: string
  name: string
  abbreviation: string
  city: string
  league: string
  division: string
  logo?: string
  stats?: {
    wins: number
    losses: number
    winPercentage: number
    runsFor: number
    runsAgainst: number
  }
}

export interface BaseballPlayer {
  id: string
  name: string
  team: string
  position: string
  stats?: {
    battingAverage: number
    homeRuns: number
    rbi: number
    hits: number
  }
}

export class BaseballService {
  private readonly CACHE_TTL = 5 * 60 * 1000

  constructor() {}

  async getGames(params: any = {}): Promise<any[]> {
    const cacheKey = `baseball:games:${JSON.stringify(params)}`
    const cached = await cacheManager.getAsync<any[]>(cacheKey)
    return cached || await this.fetchGames(params, cacheKey)
  }

  private async fetchGames(params: any, cacheKey: string): Promise<BaseballGame[]> {
    try {
      await rateLimiter.waitForRateLimit('sportsdb')
      const events = await sportsDBClient.getEventsByDate(
        params.date || new Date().toISOString().split('T')[0],
        'baseball'
      )
      const games = events.map(this.mapSportsDBEvent)
      cacheManager.set(cacheKey, games, this.CACHE_TTL)
      return games
    } catch (error) {
      errorHandlingService.logError(error as any, { context: 'Baseball games fetch' })
      return []
    }
  }

  async getTeams(params: any = {}): Promise<any[]> {
    const cacheKey = `baseball:teams:${JSON.stringify(params)}`
    const cached = await cacheManager.getAsync<any[]>(cacheKey)
    return cached || await this.fetchTeams(params, cacheKey)
  }

  private async fetchTeams(params: any, cacheKey: string): Promise<BaseballTeam[]> {
    try {
      await rateLimiter.waitForRateLimit('sportsdb')
      const teams = await sportsDBClient.searchTeams('baseball')
      const mappedTeams = teams.map(this.mapSportsDBTeam)
      cacheManager.set(cacheKey, mappedTeams, 30 * 60 * 1000)
      return mappedTeams
    } catch (error) {
      errorHandlingService.logError(error as any, { context: 'Baseball teams fetch' })
      return []
    }
  }

  async getPlayers(params: any = {}): Promise<BaseballPlayer[]> {
    return []
  }

  async getLiveGames(): Promise<BaseballGame[]> {
    return this.getGames({ status: 'live' })
  }

  async getStandings(league: string = 'MLB'): Promise<any[]> {
    return []
  }

  async getOdds(params: any = {}): Promise<any[]> {
    return []
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.getTeams()
      return true
    } catch (error) {
      return false
    }
  }

  private mapSportsDBEvent(event: any): BaseballGame {
    return {
      id: event.idEvent,
      homeTeam: event.strHomeTeam,
      awayTeam: event.strAwayTeam,
      date: event.dateEvent,
      time: event.strTime,
      status: event.strStatus === 'FT' ? 'finished' : event.strStatus === 'LIVE' ? 'live' : 'scheduled',
      homeScore: event.intHomeScore ? parseInt(event.intHomeScore) : 0,
      awayScore: event.intAwayScore ? parseInt(event.intAwayScore) : 0,
      league: 'MLB',
      venue: event.strVenue
    }
  }

  private mapSportsDBTeam(team: any): BaseballTeam {
    return {
      id: team.idTeam,
      name: team.strTeam,
      abbreviation: team.strTeamShort,
      city: team.strTeam.split(' ').slice(0, -1).join(' '),
      league: 'MLB',
      division: 'Unknown',
      logo: team.strTeamBadge
    }
  }
}

// Export the class for dependency injection
// Use serviceFactory.getBaseballService() to get an instance
