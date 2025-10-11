/**
 * TENNIS SERVICE
 * Tennis-specific service implementation
 */

import {
  SportSpecificService,
  GameData,
  TeamData,
  PlayerData,
} from '../core/sport-specific-service'
import { ServiceConfig } from '../core/base-service'

export class TennisService extends SportSpecificService {
  constructor(league: string) {
    const config: ServiceConfig = {
      name: 'tennis-service',
      cacheTTL: 15 * 60 * 1000, // 15 minutes
      rateLimitService: 'tennis',
      retryAttempts: 2,
      retryDelay: 1000,
    }
    super('tennis', league, config)
  }

  async getGames(_params?: any): Promise<GameData[]> {
    // Tennis matches are typically individual matches, not team games
    // Return empty array as tennis doesn't have traditional team games
    return []
  }

  async getTeams(_params?: any): Promise<TeamData[]> {
    // Tennis doesn't have teams in the traditional sense
    // Return empty array
    return []
  }

  async getPlayers(params: any = {}): Promise<PlayerData[]> {
    try {
      // Fetch from database using production client
      const { productionSupabaseClient } = await import('@/lib/supabase/production-client')
      const players = await productionSupabaseClient.getPlayers(
        'tennis',
        params.teamId,
        params.limit || 100
      )

      return players.map((player: any) => ({
        id: player.id,
        name: player.name,
        position: player.position,
        team_id: player.team_id,
        sport: 'tennis',
        ...player,
      }))
    } catch (error) {
      console.error('Error fetching tennis players:', error)
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
      sport: 'tennis',
      league: this.league,
      homeTeam: rawData.homePlayer || '',
      awayTeam: rawData.awayPlayer || '',
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
      sport: 'tennis',
      league: this.league,
      name: rawData.name || '',
      abbreviation: rawData.abbreviation || '',
      lastUpdated: new Date().toISOString(),
    }
  }

  protected mapPlayerData(rawData: any): PlayerData {
    return {
      id: rawData.id || '',
      sport: 'tennis',
      league: this.league,
      name: rawData.name || '',
      team: rawData.team || '',
      position: rawData.position || 'Player',
      lastUpdated: new Date().toISOString(),
    }
  }
}
