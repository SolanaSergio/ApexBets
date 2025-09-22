/**
 * Database Cleanup Service
 * Handles database cleanup and maintenance operations
 */

import { structuredLogger } from './structured-logger'
import { databaseService } from './database-service'

export interface CleanupResult {
  success: boolean
  message: string
  cleanedRecords: number
  errors: string[]
  executionTime: number
}

export interface CleanupRecommendations {
  orphanedRecords: number
  duplicateRecords: number
  oldCacheEntries: number
  unusedIndexes: string[]
  largeTables: Array<{ table: string; size: string; rowCount: number }>
}

export class DatabaseCleanupService {
  private static instance: DatabaseCleanupService

  public static getInstance(): DatabaseCleanupService {
    if (!DatabaseCleanupService.instance) {
      DatabaseCleanupService.instance = new DatabaseCleanupService()
    }
    return DatabaseCleanupService.instance
  }

  async runFullCleanup(): Promise<CleanupResult> {
    const startTime = Date.now()
    const errors: string[] = []
    let cleanedRecords = 0

    try {
      structuredLogger.info('Starting full database cleanup')

      // Clean up expired cache entries
      const cacheResult = await this.cleanupExpiredCache()
      cleanedRecords += cacheResult.cleanedRecords
      if (cacheResult.errors.length > 0) {
        errors.push(...cacheResult.errors)
      }

      // Clean up orphaned records
      const orphanResult = await this.cleanupOrphanedRecords()
      cleanedRecords += orphanResult.cleanedRecords
      if (orphanResult.errors.length > 0) {
        errors.push(...orphanResult.errors)
      }

      // Clean up duplicate records
      const duplicateResult = await this.cleanupDuplicateRecords()
      cleanedRecords += duplicateResult.cleanedRecords
      if (duplicateResult.errors.length > 0) {
        errors.push(...duplicateResult.errors)
      }

      // Vacuum tables
      await this.vacuumTables()

      const executionTime = Date.now() - startTime

      const result: CleanupResult = {
        success: errors.length === 0,
        message: errors.length === 0 
          ? `Cleanup completed successfully. Cleaned ${cleanedRecords} records.`
          : `Cleanup completed with ${errors.length} errors. Cleaned ${cleanedRecords} records.`,
        cleanedRecords,
        errors,
        executionTime
      }

      structuredLogger.info('Database cleanup completed', result)

      return result

    } catch (error) {
      const executionTime = Date.now() - startTime
      const errorMessage = `Database cleanup failed: ${error instanceof Error ? error.message : String(error)}`

      structuredLogger.error(errorMessage)

      return {
        success: false,
        message: errorMessage,
        cleanedRecords,
        errors: [errorMessage, ...errors],
        executionTime
      }
    }
  }

  private async cleanupExpiredCache(): Promise<{ cleanedRecords: number; errors: string[] }> {
    const errors: string[] = []
    let cleanedRecords = 0

    try {
      const query = `
        DELETE FROM cache_entries 
        WHERE expires_at < NOW()
      `
      
      const result = await databaseService.executeSQL(query)
      
      if (result.success) {
        cleanedRecords = result.rowCount
        structuredLogger.info('Cleaned expired cache entries', { count: cleanedRecords })
      } else {
        errors.push(`Failed to clean expired cache: ${result.error}`)
      }

    } catch (error) {
      errors.push(`Error cleaning expired cache: ${error instanceof Error ? error.message : String(error)}`)
    }

    return { cleanedRecords, errors }
  }

  private async cleanupOrphanedRecords(): Promise<{ cleanedRecords: number; errors: string[] }> {
    const errors: string[] = []
    let cleanedRecords = 0

    try {
      // Clean up orphaned odds records
      const oddsQuery = `
        DELETE FROM odds 
        WHERE game_id NOT IN (SELECT id FROM games)
      `
      
      const oddsResult = await databaseService.executeSQL(oddsQuery)
      if (oddsResult.success) {
        cleanedRecords += oddsResult.rowCount
      } else {
        errors.push(`Failed to clean orphaned odds: ${oddsResult.error}`)
      }

      // Clean up orphaned predictions records
      const predictionsQuery = `
        DELETE FROM predictions 
        WHERE game_id NOT IN (SELECT id FROM games)
      `
      
      const predictionsResult = await databaseService.executeSQL(predictionsQuery)
      if (predictionsResult.success) {
        cleanedRecords += predictionsResult.rowCount
      } else {
        errors.push(`Failed to clean orphaned predictions: ${predictionsResult.error}`)
      }

      // Clean up orphaned player stats
      const playerStatsQuery = `
        DELETE FROM player_stats 
        WHERE player_id NOT IN (SELECT id FROM players)
      `
      
      const playerStatsResult = await databaseService.executeSQL(playerStatsQuery)
      if (playerStatsResult.success) {
        cleanedRecords += playerStatsResult.rowCount
      } else {
        errors.push(`Failed to clean orphaned player stats: ${playerStatsResult.error}`)
      }

    } catch (error) {
      errors.push(`Error cleaning orphaned records: ${error instanceof Error ? error.message : String(error)}`)
    }

    return { cleanedRecords, errors }
  }

  private async cleanupDuplicateRecords(): Promise<{ cleanedRecords: number; errors: string[] }> {
    const errors: string[] = []
    let cleanedRecords = 0

    try {
      // Clean up duplicate games
      const gamesQuery = `
        DELETE FROM games 
        WHERE id IN (
          SELECT id FROM (
            SELECT id, ROW_NUMBER() OVER (
              PARTITION BY home_team_id, away_team_id, game_date 
              ORDER BY created_at DESC
            ) as rn
            FROM games
          ) t WHERE rn > 1
        )
      `
      
      const gamesResult = await databaseService.executeSQL(gamesQuery)
      if (gamesResult.success) {
        cleanedRecords += gamesResult.rowCount
      } else {
        errors.push(`Failed to clean duplicate games: ${gamesResult.error}`)
      }

    } catch (error) {
      errors.push(`Error cleaning duplicate records: ${error instanceof Error ? error.message : String(error)}`)
    }

    return { cleanedRecords, errors }
  }

  private async vacuumTables(): Promise<void> {
    try {
      const tables = ['games', 'teams', 'players', 'odds', 'predictions', 'standings', 'cache_entries']
      
      for (const table of tables) {
        await databaseService.vacuumTable(table)
      }

      structuredLogger.info('Table vacuum completed')

    } catch (error) {
      structuredLogger.error('Table vacuum failed', {
        error: error instanceof Error ? error.message : String(error)
      })
    }
  }

  async getCleanupRecommendations(): Promise<CleanupRecommendations> {
    try {
      // Get orphaned records count
      const orphanedOddsQuery = `
        SELECT COUNT(*) as count FROM odds 
        WHERE game_id NOT IN (SELECT id FROM games)
      `
      const orphanedOddsResult = await databaseService.executeSQL(orphanedOddsQuery)
      const orphanedRecords = orphanedOddsResult.data?.[0]?.count || 0

      // Get old cache entries count
      const oldCacheQuery = `
        SELECT COUNT(*) as count FROM cache_entries 
        WHERE expires_at < NOW() - INTERVAL '7 days'
      `
      const oldCacheResult = await databaseService.executeSQL(oldCacheQuery)
      const oldCacheEntries = oldCacheResult.data?.[0]?.count || 0

      // Get table sizes
      const tableSizesResult = await databaseService.getTableSizes()
      const largeTables = (tableSizesResult.data || [])
        .filter((table: any) => table.rowCount > 10000)
        .map((table: any) => ({
          table: table.tablename,
          size: table.size,
          rowCount: table.rowCount || 0
        }))

      return {
        orphanedRecords,
        duplicateRecords: 0, // Would need more complex queries to calculate
        oldCacheEntries,
        unusedIndexes: [], // Would need to query pg_stat_user_indexes
        largeTables
      }

    } catch (error) {
      structuredLogger.error('Failed to get cleanup recommendations', {
        error: error instanceof Error ? error.message : String(error)
      })

      return {
        orphanedRecords: 0,
        duplicateRecords: 0,
        oldCacheEntries: 0,
        unusedIndexes: [],
        largeTables: []
      }
    }
  }
}

export const databaseCleanupService = DatabaseCleanupService.getInstance()
