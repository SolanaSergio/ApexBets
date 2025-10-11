/**
 * SPORT-SPECIFIC SERVICE
 * Base class for sport-specific services
 */

import { BaseService, ServiceConfig } from './base-service'

export interface SportData {
  id: string
  sport: string
  league: string
  season?: string
  lastUpdated: string
}

export interface GameData extends SportData {
  homeTeam: string
  awayTeam: string
  date: string
  time?: string
  status: 'scheduled' | 'live' | 'finished' | 'postponed' | 'cancelled'
  homeScore: number | null
  awayScore: number | null
  venue: string
  odds?: any[]
  predictions?: any[]
}

export interface TeamData extends SportData {
  name: string
  abbreviation: string
  city?: string
  logo?: string
  stats?: any
}

export interface PlayerData extends SportData {
  name: string
  team: string
  position?: string
  stats?: any
}

export abstract class SportSpecificService extends BaseService {
  protected sport: string
  protected league: string

  constructor(sport: string, league: string, config: ServiceConfig) {
    super(config)
    this.sport = sport
    this.league = league
  }

  // Abstract methods that must be implemented by each sport
  abstract getGames(params?: any): Promise<GameData[]>
  abstract getTeams(params?: any): Promise<TeamData[]>
  abstract getPlayers(params?: any): Promise<PlayerData[]>
  abstract getLiveGames(): Promise<GameData[]>
  abstract getStandings(season?: string): Promise<any[]>
  abstract getOdds(params?: any): Promise<any[]>

  // Common methods with sport-specific implementations
  async getGameById(gameId: string): Promise<GameData | null> {
    const key = this.getCacheKey('game', gameId)
    return this.getCachedOrFetch(key, () => this.fetchGameById(gameId))
  }

  async getTeamById(teamId: string): Promise<TeamData | null> {
    const key = this.getCacheKey('team', teamId)
    return this.getCachedOrFetch(key, () => this.fetchTeamById(teamId))
  }

  async getPlayerById(playerId: string): Promise<PlayerData | null> {
    const key = this.getCacheKey('player', playerId)
    return this.getCachedOrFetch(key, () => this.fetchPlayerById(playerId))
  }

  // Abstract fetch methods
  protected abstract fetchGameById(gameId: string): Promise<GameData | null>
  protected abstract fetchTeamById(teamId: string): Promise<TeamData | null>
  protected abstract fetchPlayerById(playerId: string): Promise<PlayerData | null>

  // Sport-specific data mapping
  protected abstract mapGameData(rawData: any): GameData
  protected abstract mapTeamData(rawData: any): TeamData
  protected abstract mapPlayerData(rawData: any): PlayerData

  // Utility methods
  getSport(): string {
    return this.sport
  }

  getLeague(): string {
    return this.league
  }

  private healthCheckCache: { result: boolean; timestamp: number } | null = null
  private readonly HEALTH_CHECK_CACHE_TTL = 30 * 1000 // 30 seconds

  async healthCheck(): Promise<boolean> {
    // Check cache first
    if (
      this.healthCheckCache &&
      Date.now() - this.healthCheckCache.timestamp < this.HEALTH_CHECK_CACHE_TTL
    ) {
      return this.healthCheckCache.result
    }

    try {
      // Test with a simple API call, but handle rate limit errors gracefully
      await this.getTeams({ limit: 1 })

      // Cache successful result
      this.healthCheckCache = {
        result: true,
        timestamp: Date.now(),
      }
      return true
    } catch (error) {
      // Check if it's a rate limit error
      if (error instanceof Error && error.message.includes('Burst limit exceeded')) {
        console.warn(`${this.sport} service health check skipped due to rate limit:`, error.message)
        // Return cached result if available, otherwise return false
        return this.healthCheckCache?.result ?? false
      }

      console.error(`${this.sport} service health check failed:`, error)

      // Cache failed result
      this.healthCheckCache = {
        result: false,
        timestamp: Date.now(),
      }
      return false
    }
  }

  /**
   * Clear health check cache
   */
  clearHealthCheckCache(): void {
    this.healthCheckCache = null
  }
}
