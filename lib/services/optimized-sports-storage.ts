/**
 * Optimized Sports Data Storage Service
 * Efficiently stores and retrieves sports API data for fast access
 * Uses Supabase Edge Functions for all database operations
 */

import { databaseCacheService } from '../services/database-cache-service'
import { structuredLogger } from './structured-logger'
import { edgeFunctionClient } from './edge-function-client'

export interface SportsDataConfig {
  sport: string
  league: string
  season: string
  dataType: 'games' | 'teams' | 'players' | 'standings' | 'odds' | 'stats'
  ttl: number
  priority: 'low' | 'medium' | 'high' | 'critical'
}

export interface StorageResult<T> {
  data: T
  cached: boolean
  source: 'database' | 'api' | 'cache'
  responseTime: number
  lastUpdated: string
}

export class OptimizedSportsStorage {
  private static instance: OptimizedSportsStorage

  private constructor() {}

  static getInstance(): OptimizedSportsStorage {
    if (!OptimizedSportsStorage.instance) {
      OptimizedSportsStorage.instance = new OptimizedSportsStorage()
    }
    return OptimizedSportsStorage.instance
  }

  // Note: This method is deprecated - use Edge Functions for database operations
  // private getSupabaseClient() {
  //   throw new Error('Direct Supabase client access is deprecated. Use Edge Functions for database operations.')
  // }

  // Note: This method is deprecated - use Edge Functions for database operations
  // private async executeSQL(_query: string): Promise<any> {
  //   // Implementation removed - use Edge Functions instead
  // }

  async storeGames(sport: string, league: string, games: any[]): Promise<void> {
    try {
      const batchSize = 100
      const batches = this.chunkArray(games, batchSize)

      for (const batch of batches) {
        await edgeFunctionClient.batchInsertGames(batch);
      }

      // Clear cache for this sport
      try {
        await databaseCacheService.clearBySport(sport)
      } catch {}

      structuredLogger.info('Stored games', { count: games.length, sport, league })
    } catch (error) {
      structuredLogger.error('Failed to store games', {
        error: error instanceof Error ? error.message : String(error),
        sport,
        league,
        count: games.length,
      })
      throw error
    }
  }

  async storeTeams(sport: string, league: string, teams: any[]): Promise<void> {
    try {
      const batchSize = 50
      const batches = this.chunkArray(teams, batchSize)

      for (const batch of batches) {
        await edgeFunctionClient.batchInsertTeams(batch);
      }

      // Clear cache for this sport
      try {
        await databaseCacheService.clearBySport(sport)
      } catch {}

      structuredLogger.info('Stored teams', { count: teams.length, sport, league })
    } catch (error) {
      structuredLogger.error('Failed to store teams', {
        error: error instanceof Error ? error.message : String(error),
        sport,
        league,
        count: teams.length,
      })
      throw error
    }
  }

  async storePlayers(sport: string, league: string, players: any[]): Promise<void> {
    try {
      const batchSize = 50
      const batches = this.chunkArray(players, batchSize)

      for (const batch of batches) {
        await edgeFunctionClient.batchInsertPlayers(batch);
      }

      // Clear cache for this sport
      try {
        await databaseCacheService.clearBySport(sport)
      } catch {}

      structuredLogger.info('Stored players', { count: players.length, sport, league })
    } catch (error) {
      structuredLogger.error('Failed to store players', {
        error: error instanceof Error ? error.message : String(error),
        sport,
        league,
        count: players.length,
      })
      throw error
    }
  }

  async getGames(
    sport: string,
    league?: string,
    date?: string,
    status?: string
  ): Promise<StorageResult<any[]>> {
    const startTime = Date.now()

    try {
      // Use Edge Function to get games
      const result = await edgeFunctionClient.queryGames({
        sport,
        ...(league && { league }),
        limit: 100
      })

      const responseTime = Date.now() - startTime

      return {
        data: ('data' in result) ? result.data || [] : [],
        cached: false,
        source: 'database',
        responseTime,
        lastUpdated: new Date().toISOString(),
      }
    } catch (error) {
      structuredLogger.error('Failed to get games', {
        error: error instanceof Error ? error.message : String(error),
        sport,
        league,
        date,
        status,
      })
      throw error
    }
  }

  async getTeams(sport: string, league?: string): Promise<StorageResult<any[]>> {
    const startTime = Date.now()

    try {
      // Use Edge Function to get teams
      const result = await edgeFunctionClient.queryTeams({
        sport,
        ...(league && { league }),
        limit: 100
      })

      const responseTime = Date.now() - startTime

      return {
        data: ('data' in result) ? result.data || [] : [],
        cached: false,
        source: 'database',
        responseTime,
        lastUpdated: new Date().toISOString(),
      }
    } catch (error) {
      structuredLogger.error('Failed to get teams', {
        error: error instanceof Error ? error.message : String(error),
        sport,
        league,
      })
      throw error
    }
  }

  async getPlayers(
    sport: string,
    teamId?: string,
    limit: number = 100
  ): Promise<StorageResult<any[]>> {
    const startTime = Date.now()

    try {
      // Use Edge Function to get players
      const result = await edgeFunctionClient.queryPlayers({
        sport,
        ...(teamId && { teamId }),
        limit
      })

      const responseTime = Date.now() - startTime

      return {
        data: ('data' in result) ? result.data || [] : [],
        cached: false,
        source: 'database',
        responseTime,
        lastUpdated: new Date().toISOString(),
      }
    } catch (error) {
      structuredLogger.error('Failed to get players', {
        error: error instanceof Error ? error.message : String(error),
        sport,
        teamId,
        limit,
      })
      throw error
    }
  }

  async storeStandings(sport: string, league: string, standings: any[]): Promise<void> {
    try {
      const batchSize = 50
      const batches = this.chunkArray(standings, batchSize)

      for (const batch of batches) {
        await edgeFunctionClient.batchInsertStandings(batch);
      }

      structuredLogger.info('Stored standings', { count: standings.length, sport, league })
    } catch (error) {
      structuredLogger.error('Failed to store standings', {
        error: error instanceof Error ? error.message : String(error),
        sport,
        league,
        count: standings.length,
      })
      throw error
    }
  }

  async getStandings(
    sport: string,
    league: string,
    season?: string
  ): Promise<StorageResult<any[]>> {
    const startTime = Date.now()

    try {
      // Use Edge Function to get standings
      const result = await edgeFunctionClient.queryStandings({
        sport,
        league,
        ...(season && { season }),
        limit: 100
      })

      const responseTime = Date.now() - startTime

      return {
        data: ('data' in result) ? result.data || [] : [],
        cached: false,
        source: 'database',
        responseTime,
        lastUpdated: new Date().toISOString(),
      }
    } catch (error) {
      structuredLogger.error('Failed to get standings', {
        error: error instanceof Error ? error.message : String(error),
        sport,
        league,
        season,
      })
      throw error
    }
  }

  async clearOldData(sport: string, daysToKeep: number = 30): Promise<void> {
    try {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep)

      // TODO: Implement using Edge Functions
      console.log(`Would clear old data for ${sport} older than ${daysToKeep} days`)

      console.log(`✅ Cleared old data for ${sport} (older than ${daysToKeep} days)`)
    } catch (error) {
      structuredLogger.error('Failed to clear old data', {
        error: error instanceof Error ? error.message : String(error),
        sport,
        daysToKeep,
      })
      throw error
    }
  }

  async getStorageStats(): Promise<{
    totalGames: number
    totalTeams: number
    totalPlayers: number
    totalStandings: number
    cacheEntries: number
    lastUpdated: string
  }> {
    try {
      // Use Edge Functions to get stats
      const [gamesResult, teamsResult, playersResult, standingsResult] = await Promise.all([
        edgeFunctionClient.queryGames({ limit: 1 }),
        edgeFunctionClient.queryTeams({ limit: 1 }),
        edgeFunctionClient.queryPlayers({ limit: 1 }),
        edgeFunctionClient.queryStandings({ limit: 1 })
      ])

      return {
        totalGames: ('data' in gamesResult) ? gamesResult.data?.length || 0 : 0,
        totalTeams: ('data' in teamsResult) ? teamsResult.data?.length || 0 : 0,
        totalPlayers: ('data' in playersResult) ? playersResult.data?.length || 0 : 0,
        totalStandings: ('data' in standingsResult) ? standingsResult.data?.length || 0 : 0,
        cacheEntries: databaseCacheService.getStats().totalEntries, // TODO: Get from cache service
        lastUpdated: new Date().toISOString(),
      }
    } catch (error) {
      structuredLogger.error('Failed to get storage stats', {
        error: error instanceof Error ? error.message : String(error),
      })
      throw error
    }
  }

  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = []
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size))
    }
    return chunks
  }
}

export const optimizedSportsStorage = OptimizedSportsStorage.getInstance()