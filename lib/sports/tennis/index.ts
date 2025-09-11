/**
 * TENNIS SERVICE
 * ATP/WTA tennis service
 */

import { sportsDBClient } from '../../sports-apis'
import { cacheService } from '../../services/cache-service'
import { rateLimiter } from '../../services/rate-limiter'
import { errorHandlingService } from '../../services/error-handling-service'

export interface TennisMatch {
  id: string
  player1: string
  player2: string
  date: string
  time?: string
  status: 'scheduled' | 'live' | 'finished'
  player1Score?: string
  player2Score?: string
  tournament: string
  surface: string
  round: string
  sets?: {
    set1?: string
    set2?: string
    set3?: string
    set4?: string
    set5?: string
  }
}

export interface TennisPlayer {
  id: string
  name: string
  nationality: string
  ranking: number
  points: number
  age: number
  height: string
  weight: number
  hand: 'Right' | 'Left'
  stats?: {
    wins: number
    losses: number
    titles: number
    prizeMoney: number
  }
}

export interface TennisTournament {
  id: string
  name: string
  location: string
  surface: string
  level: string
  prizeMoney: number
  startDate: string
  endDate: string
  status: 'upcoming' | 'ongoing' | 'finished'
}

export class TennisService {
  private readonly CACHE_TTL = 5 * 60 * 1000 // 5 minutes
  private readonly LIVE_TTL = 30 * 1000 // 30 seconds

  constructor() {}

  async getMatches(params: {
    date?: string
    status?: 'scheduled' | 'live' | 'finished'
    tournament?: string
    player?: string
  } = {}): Promise<TennisMatch[]> {
    const cacheKey = `tennis:matches:${JSON.stringify(params)}`
    const ttl = params.status === 'live' ? this.LIVE_TTL : this.CACHE_TTL

    return cacheService.get(cacheKey) || await this.fetchMatches(params, cacheKey, ttl)
  }

  private async fetchMatches(params: any, cacheKey: string, ttl: number): Promise<TennisMatch[]> {
    const matches: TennisMatch[] = []

    try {
      // Try SportsDB for tennis matches
      try {
        await rateLimiter.waitForRateLimit('sportsdb')
        const events = await sportsDBClient.getEventsByDate(
          params.date || new Date().toISOString().split('T')[0],
          'tennis'
        )
        matches.push(...events.map(this.mapSportsDBEvent))
      } catch (error) {
        errorHandlingService.logError(error as any, { context: 'SportsDB Tennis' })
      }

      // If no real data available, return empty array instead of mock data
      cacheService.set(cacheKey, matches, ttl)
      return matches
    } catch (error) {
      errorHandlingService.logError(error as any, { context: 'Tennis matches fetch' })
      return []
    }
  }

  async getPlayers(params: {
    search?: string
    ranking?: number
  } = {}): Promise<TennisPlayer[]> {
    const cacheKey = `tennis:players:${JSON.stringify(params)}`

    return cacheService.get(cacheKey) || await this.fetchPlayers(params, cacheKey)
  }

  private async fetchPlayers(params: any, cacheKey: string): Promise<TennisPlayer[]> {
    try {
      // For now, return empty array - would integrate with tennis API
      const players: TennisPlayer[] = []
      cacheService.set(cacheKey, players, 30 * 60 * 1000)
      return players
    } catch (error) {
      errorHandlingService.logError(error as any, { context: 'Tennis players fetch' })
      return []
    }
  }

  async getTournaments(params: {
    status?: 'upcoming' | 'ongoing' | 'finished'
    surface?: string
  } = {}): Promise<TennisTournament[]> {
    const cacheKey = `tennis:tournaments:${JSON.stringify(params)}`

    return cacheService.get(cacheKey) || await this.fetchTournaments(params, cacheKey)
  }

  private async fetchTournaments(params: any, cacheKey: string): Promise<TennisTournament[]> {
    try {
      // For now, return empty array - would integrate with tennis API
      const tournaments: TennisTournament[] = []
      cacheService.set(cacheKey, tournaments, 60 * 60 * 1000)
      return tournaments
    } catch (error) {
      errorHandlingService.logError(error as any, { context: 'Tennis tournaments fetch' })
      return []
    }
  }

  async getLiveMatches(): Promise<TennisMatch[]> {
    return this.getMatches({ status: 'live' })
  }

  async getRankings(limit: number = 100): Promise<TennisPlayer[]> {
    const cacheKey = `tennis:rankings:${limit}`
    
    return cacheService.get(cacheKey) || await this.fetchRankings(limit, cacheKey)
  }

  private async fetchRankings(limit: number, cacheKey: string): Promise<TennisPlayer[]> {
    try {
      // For now, return empty array - would integrate with tennis API
      const rankings: TennisPlayer[] = []
      cacheService.set(cacheKey, rankings, 60 * 60 * 1000) // 1 hour
      return rankings
    } catch (error) {
      errorHandlingService.logError(error as any, { context: 'Tennis rankings fetch' })
      return []
    }
  }

  async getOdds(params: any = {}): Promise<any[]> {
    const cacheKey = `tennis:odds:${JSON.stringify(params)}`
    
    return cacheService.get(cacheKey) || await this.fetchOdds(params, cacheKey)
  }

  private async fetchOdds(params: any, cacheKey: string): Promise<any[]> {
    try {
      // Would integrate with odds API
      const odds: any[] = []
      cacheService.set(cacheKey, odds, 2 * 60 * 1000) // 2 minutes
      return odds
    } catch (error) {
      errorHandlingService.logError(error as any, { context: 'Tennis odds fetch' })
      return []
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.getPlayers()
      return true
    } catch (error) {
      return false
    }
  }

  // Mappers
  private mapSportsDBEvent(event: any): TennisMatch {
    return {
      id: event.idEvent,
      player1: event.strHomeTeam,
      player2: event.strAwayTeam,
      date: event.dateEvent,
      time: event.strTime,
      status: event.strStatus === 'FT' ? 'finished' : event.strStatus === 'LIVE' ? 'live' : 'scheduled',
      player1Score: event.intHomeScore ? event.intHomeScore.toString() : undefined,
      player2Score: event.intAwayScore ? event.intAwayScore.toString() : undefined,
      tournament: event.strLeague,
      surface: 'Hard', // Would be determined from tournament data
      round: 'First Round' // Would be determined from tournament data
    }
  }
}

// Export the class for dependency injection
// Use serviceFactory.getTennisService() to get an instance