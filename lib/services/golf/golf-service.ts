/**
 * GOLF SERVICE
 * Golf-specific service implementation
 */

import {
  SportSpecificService,
  GameData,
  TeamData,
  PlayerData,
} from '../core/sport-specific-service'
import { ServiceConfig } from '../core/base-service'

export class GolfService extends SportSpecificService {
  constructor(league: string) {
    const config: ServiceConfig = {
      name: 'golf-service',
      cacheTTL: 15 * 60 * 1000, // 15 minutes
      rateLimitService: 'golf',
      retryAttempts: 2,
      retryDelay: 1000,
    }
    super('golf', league, config)
  }

  async getGames(_params?: any): Promise<GameData[]> {
    // Golf tournaments are individual events, not team games
    // Return empty array as golf doesn't have traditional team games
    return []
  }

  async getTeams(_params?: any): Promise<TeamData[]> {
    // Golf doesn't have teams in the traditional sense
    // Return empty array
    return []
  }

  async getPlayers(params: any = {}): Promise<PlayerData[]> {
    try {
      // Fetch from database using Edge Functions
      const { edgeFunctionClient } = await import('@/lib/services/edge-function-client')
      const result = await edgeFunctionClient.queryPlayers({
        sport: 'golf',
        teamId: params.teamId,
        limit: params.limit || 100,
      })

      if (result.success && result.data) {
        return result.data.map((player: any) => ({
          id: player.id,
          name: player.name,
          team: player.team,
          position: player.position,
          stats: player.stats || {},
          sport: 'golf',
          league: this.league,
          lastUpdated: new Date().toISOString(),
        }))
      }
      return []
    } catch (error) {
      console.error('Error fetching golf players:', error)
      return []
    }
  }

  async getLiveGames(): Promise<GameData[]> {
    return []
  }

  async getStandings(_season?: string): Promise<any[]> {
    return []
  }

  async getOdds(_params?: any): Promise<any[]> {
    return []
  }

  protected async fetchGameById(_gameId: string): Promise<GameData | null> {
    return null
  }

  protected async fetchTeamById(_teamId: string): Promise<TeamData | null> {
    return null
  }

  protected async fetchPlayerById(_playerId: string): Promise<PlayerData | null> {
    return null
  }

  protected mapGameData(rawData: any): GameData {
    return {
      id: rawData.id || '',
      sport: 'golf',
      league: this.league,
      homeTeam: rawData.tournament || '',
      awayTeam: rawData.course || '',
      date: rawData.date || new Date().toISOString(),
      status: rawData.status || 'scheduled',
      homeScore: rawData.homeScore,
      awayScore: rawData.awayScore,
      venue: rawData.venue || '',
      lastUpdated: new Date().toISOString(),
    }
  }

  protected mapTeamData(rawData: any): TeamData {
    return {
      id: rawData.id || '',
      sport: 'golf',
      league: this.league,
      name: rawData.name || '',
      abbreviation: rawData.abbreviation || '',
      lastUpdated: new Date().toISOString(),
    }
  }

  protected mapPlayerData(rawData: any): PlayerData {
    return {
      id: rawData.id || '',
      sport: 'golf',
      league: this.league,
      name: rawData.name || '',
      team: rawData.team || '',
      position: rawData.position || 'Player',
      lastUpdated: new Date().toISOString(),
    }
  }
}
