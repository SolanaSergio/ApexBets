/**
 * FOOTBALL SERVICE
 * NFL-focused service with comprehensive team data
 */

import { sportsDBClient } from '../../sports-apis'
import { cacheManager } from '../../cache'
import { rateLimiter } from '../../services/rate-limiter'
import { errorHandlingService } from '../../services/error-handling-service'

export interface FootballGame {
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
  quarter?: number
  timeRemaining?: string
  possession?: string
  homeTeamStats?: {
    passingYards: number
    rushingYards: number
    totalYards: number
    turnovers: number
  }
  awayTeamStats?: {
    passingYards: number
    rushingYards: number
    totalYards: number
    turnovers: number
  }
}

export interface FootballTeam {
  id: string
  name: string
  abbreviation: string
  city: string
  conference: string
  division: string
  logo?: string
  stats?: {
    wins: number
    losses: number
    ties: number
    winPercentage: number
    pointsFor: number
    pointsAgainst: number
    pointDifferential: number
  }
}

export interface FootballPlayer {
  id: string
  name: string
  team: string
  position: string
  number: number
  stats?: {
    passingYards: number
    rushingYards: number
    receivingYards: number
    touchdowns: number
    interceptions: number
  }
}

export class FootballService {
  private readonly CACHE_TTL = 5 * 60 * 1000 // 5 minutes
  private readonly LIVE_TTL = 30 * 1000 // 30 seconds

  constructor() {}

  // No hardcoded data - all data fetched from APIs

  async getGames(params: {
    date?: string
    status?: 'scheduled' | 'live' | 'finished'
    teamId?: string
  } = {}): Promise<any[]> {
    const cacheKey = `football:games:${JSON.stringify(params)}`
    const ttl = params.status === 'live' ? this.LIVE_TTL : this.CACHE_TTL

    const cached = await cacheManager.getAsync<any[]>(cacheKey)
    return cached || await this.fetchGames(params, cacheKey, ttl)
  }

  private async fetchGames(params: any, cacheKey: string, ttl: number): Promise<FootballGame[]> {
    const games: FootballGame[] = []

    try {
      // Try SportsDB for NFL games
      try {
        await rateLimiter.waitForRateLimit('sportsdb')
        const events = await sportsDBClient.getEventsByDate(
          params.date || new Date().toISOString().split('T')[0],
          'americanfootball'
        )
        games.push(...events.map(this.mapSportsDBEvent))
      } catch (error) {
        errorHandlingService.logError(error as any, { context: 'SportsDB NFL' })
      }

      // If no real data available, return empty array instead of mock data
      // This follows the rule: "If no real data available, return empty array/object, not mock data"

      cacheManager.set(cacheKey, games, ttl)
      return games
    } catch (error) {
      errorHandlingService.logError(error as any, { context: 'Football games fetch' })
      return []
    }
  }

  // Removed generateSampleGames - no mock data allowed

  async getTeams(params: {
    league?: string
    search?: string
  } = {}): Promise<any[]> {
    const cacheKey = `football:teams:${JSON.stringify(params)}`

    const cached = await cacheManager.getAsync<any[]>(cacheKey)
    return cached || await this.fetchTeams(params, cacheKey)
  }

  private async fetchTeams(params: any, cacheKey: string): Promise<FootballTeam[]> {
    const teams: FootballTeam[] = []

    try {
      // Try SportsDB for NFL teams
      try {
        await rateLimiter.waitForRateLimit('sportsdb')
        const sportsDBTeams = await sportsDBClient.searchTeams(params.search || 'americanfootball')
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
      errorHandlingService.logError(error as any, { context: 'Football teams fetch' })
      return []
    }
  }

  async getPlayers(params: {
    teamId?: string
    search?: string
  } = {}): Promise<FootballPlayer[]> {
    const cacheKey = `football:players:${JSON.stringify(params)}`

    const cached = await cacheManager.getAsync<any[]>(cacheKey)
    return cached || await this.fetchPlayers(cacheKey)
  }

  private async fetchPlayers(cacheKey: string): Promise<FootballPlayer[]> {
    try {
      // For now, return empty array - would integrate with NFL API
      const players: FootballPlayer[] = []
      cacheManager.set(cacheKey, players, 30 * 60 * 1000)
      return players
    } catch (error) {
      errorHandlingService.logError(error as any, { context: 'Football players fetch' })
      return []
    }
  }

  async getLiveGames(): Promise<FootballGame[]> {
    return this.getGames({ status: 'live' })
  }

  async getStandings(league: string = 'NFL'): Promise<any[]> {
    const cacheKey = `football:standings:${league}`
    
    const cached = await cacheManager.getAsync<any[]>(cacheKey)
    return cached || await this.fetchStandings(cacheKey)
  }

  private async fetchStandings(cacheKey: string): Promise<any[]> {
    try {
      // For now, return empty array - would integrate with appropriate API
      const standings: any[] = []
      cacheManager.set(cacheKey, standings, 60 * 60 * 1000) // 1 hour
      return standings
    } catch (error) {
      errorHandlingService.logError(error as any, { context: 'Football standings fetch' })
      return []
    }
  }

  async getOdds(params: any = {}): Promise<any[]> {
    const cacheKey = `football:odds:${JSON.stringify(params)}`
    
    const cached = await cacheManager.getAsync<any[]>(cacheKey)
    return cached || await this.fetchOdds(cacheKey)
  }

  private async fetchOdds(cacheKey: string): Promise<any[]> {
    try {
      // Would integrate with odds API
      const odds: any[] = []
      cacheManager.set(cacheKey, odds, 2 * 60 * 1000) // 2 minutes
      return odds
    } catch (error) {
      errorHandlingService.logError(error as any, { context: 'Football odds fetch' })
      return []
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.getTeams({ league: 'NFL' })
      return true
    } catch (error) {
      return false
    }
  }

  // Mappers
  private mapSportsDBEvent(event: any): FootballGame {
    return {
      id: event.idEvent,
      homeTeam: event.strHomeTeam,
      awayTeam: event.strAwayTeam,
      date: event.dateEvent,
      time: event.strTime,
      status: event.strStatus === 'FT' ? 'finished' : event.strStatus === 'LIVE' ? 'live' : 'scheduled',
      homeScore: event.intHomeScore ? parseInt(event.intHomeScore) : 0,
      awayScore: event.intAwayScore ? parseInt(event.intAwayScore) : 0,
      league: 'NFL',
      venue: event.strVenue
    }
  }

  private mapSportsDBTeam(team: any): FootballTeam {
    return {
      id: team.idTeam,
      name: team.strTeam,
      abbreviation: team.strTeamShort,
      city: team.strTeam.split(' ').slice(0, -1).join(' '),
      conference: team.strConference || 'Unknown',
      division: team.strDivision || 'Unknown',
      logo: team.strTeamBadge
    }
  }
}

// Export the class for dependency injection
// Use serviceFactory.getFootballService() to get an instance
