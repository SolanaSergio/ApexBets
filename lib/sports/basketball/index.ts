/**
 * BASKETBALL SERVICE
 * NBA-focused service with BallDontLie integration
 */

import { ballDontLieClient, sportsDBClient } from '../../sports-apis'
import { cacheManager } from '../../cache'
import { rateLimiter } from '../../services/rate-limiter'
import { errorHandlingService } from '../../services/error-handling-service'

export interface BasketballGame {
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
  homeTeamStats?: {
    points: number
    rebounds: number
    assists: number
    fieldGoalPercentage: number
  }
  awayTeamStats?: {
    points: number
    rebounds: number
    assists: number
    fieldGoalPercentage: number
  }
}

export interface BasketballTeam {
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
    winPercentage: number
    pointsFor: number
    pointsAgainst: number
    pointDifferential: number
  }
}

export interface BasketballPlayer {
  id: string
  name: string
  team: string
  position: string
  height: string
  weight: number
  stats?: {
    points: number
    rebounds: number
    assists: number
    steals: number
    blocks: number
    fieldGoalPercentage: number
    threePointPercentage: number
    freeThrowPercentage: number
  }
}

export class BasketballService {
  private readonly CACHE_TTL = 5 * 60 * 1000 // 5 minutes
  private readonly LIVE_TTL = 30 * 1000 // 30 seconds

  constructor() {}

  async getGames(params: {
    date?: string
    status?: 'scheduled' | 'live' | 'finished'
    teamId?: string
  } = {}): Promise<BasketballGame[]> {
    const cacheKey = `basketball:games:${JSON.stringify(params)}`
    const ttl = params.status === 'live' ? this.LIVE_TTL : this.CACHE_TTL

    const cached = cacheManager.get<BasketballGame[]>(cacheKey)
    return cached || await this.fetchGames(params, cacheKey, ttl)
  }

  private async fetchGames(params: any, cacheKey: string, ttl: number): Promise<BasketballGame[]> {
    const games: BasketballGame[] = []

    try {
      // Try BallDontLie first (NBA-specific, high quality)
      if (process.env.NEXT_PUBLIC_BALLDONTLIE_API_KEY && 
          process.env.NEXT_PUBLIC_BALLDONTLIE_API_KEY !== '') {
        try {
          await rateLimiter.waitForRateLimit('balldontlie')
          const nbaGames = await ballDontLieClient.getGames({
            start_date: params.date || new Date().toISOString().split('T')[0],
            end_date: params.date || new Date().toISOString().split('T')[0]
          })
          games.push(...nbaGames.data.map(this.mapBallDontLieGame))
        } catch (error) {
          errorHandlingService.logError(error as any, { context: 'BallDontLie API' })
        }
      }

      // Fallback to SportsDB for broader coverage
      try {
        await rateLimiter.waitForRateLimit('sportsdb')
        const events = await sportsDBClient.getEventsByDate(
          params.date || new Date().toISOString().split('T')[0],
          'basketball'
        )
        games.push(...events.map(this.mapSportsDBEvent))
      } catch (error) {
        errorHandlingService.logError(error as any, { context: 'SportsDB API' })
      }

      cacheManager.set(cacheKey, games, ttl)
      return games
    } catch (error) {
      errorHandlingService.logError(error as any, { context: 'Basketball games fetch' })
      return []
    }
  }

  async getTeams(params: {
    league?: string
    search?: string
  } = {}): Promise<BasketballTeam[]> {
    const cacheKey = `basketball:teams:${JSON.stringify(params)}`

    const cached = cacheManager.get<BasketballTeam[]>(cacheKey)
    return cached || await this.fetchTeams(params, cacheKey)
  }

  private async fetchTeams(params: any, cacheKey: string): Promise<BasketballTeam[]> {
    const teams: BasketballTeam[] = []

    try {
      // Try BallDontLie for NBA teams
      if (process.env.NEXT_PUBLIC_BALLDONTLIE_API_KEY && 
          process.env.NEXT_PUBLIC_BALLDONTLIE_API_KEY !== '') {
        try {
          await rateLimiter.waitForRateLimit('balldontlie')
          const nbaTeams = await ballDontLieClient.getTeams()
          teams.push(...nbaTeams.data.map(this.mapBallDontLieTeam))
        } catch (error) {
          errorHandlingService.logError(error as any, { context: 'BallDontLie teams' })
        }
      }

      // Fallback to SportsDB
      try {
        await rateLimiter.waitForRateLimit('sportsdb')
        const sportsDBTeams = await sportsDBClient.searchTeams(params.search || 'basketball')
        teams.push(...sportsDBTeams.map(this.mapSportsDBTeam))
      } catch (error) {
        errorHandlingService.logError(error as any, { context: 'SportsDB teams' })
      }

      cacheManager.set(cacheKey, teams, 30 * 60 * 1000) // 30 minutes
      return teams
    } catch (error) {
      errorHandlingService.logError(error as any, { context: 'Basketball teams fetch' })
      return []
    }
  }

  async getPlayers(params: {
    teamId?: string
    search?: string
  } = {}): Promise<BasketballPlayer[]> {
    const cacheKey = `basketball:players:${JSON.stringify(params)}`

    const cached = cacheManager.get<BasketballPlayer[]>(cacheKey)
    return cached || await this.fetchPlayers(params, cacheKey)
  }

  private async fetchPlayers(params: any, cacheKey: string): Promise<BasketballPlayer[]> {
    try {
      if (process.env.NEXT_PUBLIC_BALLDONTLIE_API_KEY && 
          process.env.NEXT_PUBLIC_BALLDONTLIE_API_KEY !== '') {
        await rateLimiter.waitForRateLimit('balldontlie')
        const players = await ballDontLieClient.getPlayers({
          search: params.search
        })
        
        const mappedPlayers = players.data.map(this.mapBallDontLiePlayer)
        cacheManager.set(cacheKey, mappedPlayers, 30 * 60 * 1000)
        return mappedPlayers
      }
      
      return []
    } catch (error) {
      errorHandlingService.logError(error as any, { context: 'Basketball players fetch' })
      return []
    }
  }

  async getLiveGames(): Promise<BasketballGame[]> {
    return this.getGames({ status: 'live' })
  }

  async getStandings(league: string = 'NBA'): Promise<any[]> {
    const cacheKey = `basketball:standings:${league}`
    
    const cached = cacheManager.get<any[]>(cacheKey)
    return cached || await this.fetchStandings(cacheKey)
  }

  private async fetchStandings(cacheKey: string): Promise<any[]> {
    try {
      // For now, return empty array - would integrate with appropriate API
      const standings: any[] = []
      cacheManager.set(cacheKey, standings, 60 * 60 * 1000) // 1 hour
      return standings
    } catch (error) {
      errorHandlingService.logError(error as any, { context: 'Basketball standings fetch' })
      return []
    }
  }

  async getOdds(params: any = {}): Promise<any[]> {
    const cacheKey = `basketball:odds:${JSON.stringify(params)}`
    
    const cached = cacheManager.get<any[]>(cacheKey)
    return cached || await this.fetchOdds(cacheKey)
  }

  private async fetchOdds(cacheKey: string): Promise<any[]> {
    try {
      // Would integrate with odds API
      const odds: any[] = []
      cacheManager.set(cacheKey, odds, 2 * 60 * 1000) // 2 minutes
      return odds
    } catch (error) {
      errorHandlingService.logError(error as any, { context: 'Basketball odds fetch' })
      return []
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.getTeams({ league: 'NBA' })
      return true
    } catch (error) {
      return false
    }
  }

  // Mappers
  private mapBallDontLieGame(game: any): BasketballGame {
    return {
      id: game.id.toString(),
      homeTeam: game.home_team.full_name,
      awayTeam: game.visitor_team.full_name,
      date: game.date,
      time: game.time,
      status: game.status === 'Final' ? 'finished' : game.status === 'In Progress' ? 'live' : 'scheduled',
      homeScore: game.home_team_score,
      awayScore: game.visitor_team_score,
      league: 'NBA',
      venue: game.venue || ''
    }
  }

  private mapSportsDBEvent(event: any): BasketballGame {
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

  private mapBallDontLieTeam(team: any): BasketballTeam {
    return {
      id: team.id.toString(),
      name: team.full_name,
      abbreviation: team.abbreviation,
      city: team.city,
      conference: team.conference || 'Unknown',
      division: team.division || 'Unknown'
    }
  }

  private mapSportsDBTeam(team: any): BasketballTeam {
    return {
      id: team.idTeam,
      name: team.strTeam,
      abbreviation: team.strTeamShort,
      city: team.strTeam.split(' ').slice(0, -1).join(' '),
      conference: 'Unknown',
      division: 'Unknown',
      logo: team.strTeamBadge
    }
  }

  private mapBallDontLiePlayer(player: any): BasketballPlayer {
    return {
      id: player.id.toString(),
      name: `${player.first_name} ${player.last_name}`,
      team: player.team?.full_name || 'Unknown',
      position: player.position,
      height: `${player.height_feet}'${player.height_inches}"`,
      weight: player.weight_pounds
    }
  }
}

// Export the class for dependency injection
// Use serviceFactory.getBasketballService() to get an instance
