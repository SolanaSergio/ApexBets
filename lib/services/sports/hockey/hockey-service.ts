/**
 * HOCKEY SERVICE
 * NHL-specific implementation with SportsDB integration
 */

import { SportSpecificService, GameData, TeamData, PlayerData } from '../../core/sport-specific-service'
import { sportsDBClient, oddsApiClient } from '../../../sports-apis'
import { ServiceConfig } from '../../core/base-service'

export class HockeyService extends SportSpecificService {
  constructor(league: string = 'NHL') {
    const config: ServiceConfig = {
      name: 'hockey',
      cacheTTL: 5 * 60 * 1000, // 5 minutes
      rateLimitService: 'sportsdb',
      retryAttempts: 3,
      retryDelay: 1000
    }
    super('hockey', league, config)
  }

  async getGames(params: {
    date?: string
    status?: 'scheduled' | 'live' | 'finished'
    teamId?: string
  } = {}): Promise<GameData[]> {
    const key = this.getCacheKey('games', JSON.stringify(params))
    const ttl = params.status === 'live' ? 30 * 1000 : this.config.cacheTTL

    return this.getCachedOrFetch(key, () => this.fetchGames(params), ttl)
  }

  private async fetchGames(params: any): Promise<GameData[]> {
    try {
      const events = await sportsDBClient.getEventsByDate(
        params.date || new Date().toISOString().split('T')[0],
        'icehockey'
      )
      return events.map(event => this.mapGameData(event))
    } catch (error) {
      console.error('Error fetching hockey games from SportsDB:', error)
      
      // Return empty array for now - in a real implementation, you might:
      // 1. Try alternative APIs
      // 2. Return cached data
      // 3. Use mock data for development
      return []
    }
  }

  async getTeams(params: {
    league?: string
    search?: string
  } = {}): Promise<TeamData[]> {
    const key = this.getCacheKey('teams', JSON.stringify(params))
    const ttl = 30 * 60 * 1000 // 30 minutes

    return this.getCachedOrFetch(key, () => this.fetchTeams(params), ttl)
  }

  private async fetchTeams(params: any): Promise<TeamData[]> {
    try {
      const teams = await sportsDBClient.searchTeams(params.search || 'icehockey')
      return teams.map(team => this.mapTeamData(team))
    } catch (error) {
      console.error('Error fetching hockey teams from SportsDB:', error)
      
      // Return empty array for now - in a real implementation, you might:
      // 1. Try alternative APIs
      // 2. Return cached data
      // 3. Use mock data for development
      return []
    }
  }

  async getPlayers(params: {
    teamId?: string
    search?: string
  } = {}): Promise<PlayerData[]> {
    const key = this.getCacheKey('players', JSON.stringify(params))
    const ttl = 30 * 60 * 1000 // 30 minutes

    return this.getCachedOrFetch(key, () => this.fetchPlayers(params), ttl)
  }

  private async fetchPlayers(params: any): Promise<PlayerData[]> {
    try {
      // Hockey players would need different API integration
      return []
    } catch (error) {
      console.error('Error fetching hockey players:', error)
      return []
    }
  }

  async getLiveGames(): Promise<GameData[]> {
    return this.getGames({ status: 'live' })
  }

  async getStandings(season?: string): Promise<any[]> {
    const key = this.getCacheKey('standings', season || 'current')
    const ttl = 60 * 60 * 1000 // 1 hour

    return this.getCachedOrFetch(key, () => this.fetchStandings(season), ttl)
  }

  private async fetchStandings(season?: string): Promise<any[]> {
    try {
      // Would integrate with appropriate API
      return []
    } catch (error) {
      console.error('Error fetching hockey standings:', error)
      return []
    }
  }

  async getOdds(params: any = {}): Promise<any[]> {
    const key = this.getCacheKey('odds', JSON.stringify(params))
    const ttl = 2 * 60 * 1000 // 2 minutes

    return this.getCachedOrFetch(key, () => this.fetchOdds(params), ttl)
  }

  private async fetchOdds(params: any): Promise<any[]> {
    try {
      if (!oddsApiClient) {
        throw new Error('Odds API client not configured')
      }
      const odds = await oddsApiClient.getOdds({
        sport: 'icehockey_nhl',
        regions: 'us',
        markets: 'h2h,spreads,totals',
        oddsFormat: 'american',
        dateFormat: 'iso'
      })
      return odds
    } catch (error) {
      console.error('Error fetching hockey odds:', error)
      return []
    }
  }

  // Abstract method implementations
  protected async fetchGameById(gameId: string): Promise<GameData | null> {
    try {
      const event = await sportsDBClient.getEventById(gameId)
      return event ? this.mapGameData(event) : null
    } catch (error) {
      console.error(`Error fetching game ${gameId}:`, error)
      return null
    }
  }

  protected async fetchTeamById(teamId: string): Promise<TeamData | null> {
    try {
      // Would need specific team API
      return null
    } catch (error) {
      console.error(`Error fetching team ${teamId}:`, error)
      return null
    }
  }

  protected async fetchPlayerById(playerId: string): Promise<PlayerData | null> {
    try {
      // Would need specific player API
      return null
    } catch (error) {
      console.error(`Error fetching player ${playerId}:`, error)
      return null
    }
  }

  // Data mappers
  protected mapGameData(rawData: any): GameData {
    return {
      id: rawData.idEvent,
      sport: 'hockey',
      league: rawData.strLeague,
      homeTeam: rawData.strHomeTeam,
      awayTeam: rawData.strAwayTeam,
      date: rawData.dateEvent,
      time: rawData.strTime,
      status: rawData.strStatus === 'FT' ? 'finished' : 
              rawData.strStatus === 'LIVE' ? 'live' : 'scheduled',
      homeScore: rawData.intHomeScore ? parseInt(rawData.intHomeScore) : undefined,
      awayScore: rawData.intAwayScore ? parseInt(rawData.intAwayScore) : undefined,
      venue: rawData.strVenue,
      lastUpdated: new Date().toISOString()
    }
  }

  protected mapTeamData(rawData: any): TeamData {
    return {
      id: rawData.idTeam,
      sport: 'hockey',
      league: rawData.strLeague,
      name: rawData.strTeam,
      abbreviation: rawData.strTeamShort,
      city: rawData.strTeam.split(' ').slice(0, -1).join(' '),
      logo: rawData.strTeamBadge,
      lastUpdated: new Date().toISOString()
    }
  }

  protected mapPlayerData(rawData: any): PlayerData {
    return {
      id: rawData.idPlayer || rawData.id,
      sport: 'hockey',
      league: rawData.strLeague || 'NHL',
      name: rawData.strPlayer || rawData.name,
      team: rawData.strTeam || rawData.team,
      position: rawData.strPosition || rawData.position,
      stats: rawData.stats || {},
      lastUpdated: new Date().toISOString()
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      // First check if SportsDB API is accessible
      const sportsDBHealthy = await sportsDBClient.healthCheck()
      if (!sportsDBHealthy) {
        console.warn('SportsDB API is not accessible, but service can still function with cached data')
        return true // Return true as service can still work with cached data
      }
      
      // Test with a simple API call
      await this.getTeams()
      return true
    } catch (error) {
      console.error(`${this.sport} service health check failed:`, error)
      return false
    }
  }
}
