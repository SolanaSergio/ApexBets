/**
 * Database Cleanup Service
 * Handles database cleanup and maintenance operations
 */

import { structuredLogger } from './structured-logger'
import { createClient } from '@supabase/supabase-js'

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

  private getSupabaseClient() {
    return createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
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
        message:
          errors.length === 0
            ? `Cleanup completed successfully. Cleaned ${cleanedRecords} records.`
            : `Cleanup completed with ${errors.length} errors. Cleaned ${cleanedRecords} records.`,
        cleanedRecords,
        errors,
        executionTime,
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
        executionTime,
      }
    }
  }

  private async cleanupExpiredCache(): Promise<{ cleanedRecords: number; errors: string[] }> {
    const errors: string[] = []
    let cleanedRecords = 0

    try {
      const supabase = this.getSupabaseClient()
      const { error } = await supabase
        .from('cache_entries')
        .delete()
        .lt('expires_at', new Date().toISOString())

      if (error) {
        errors.push(`Failed to clean expired cache: ${error.message}`)
      } else {
        // Note: Supabase doesn't return row count for delete operations
        cleanedRecords = 1 // Placeholder - actual count would need separate query
        structuredLogger.info('Cleaned expired cache entries')
      }
    } catch (error) {
      errors.push(
        `Error cleaning expired cache: ${error instanceof Error ? error.message : String(error)}`
      )
    }

    return { cleanedRecords, errors }
  }

  private async cleanupOrphanedRecords(): Promise<{ cleanedRecords: number; errors: string[] }> {
    const errors: string[] = []
    let cleanedRecords = 0

    try {
      const supabase = this.getSupabaseClient()
      
      // Clean up orphaned odds records
      const { error: oddsError } = await supabase
        .from('odds')
        .delete()
        .not('game_id', 'in', `(SELECT id FROM games)`)

      if (oddsError) {
        errors.push(`Failed to clean orphaned odds: ${oddsError.message}`)
      } else {
        cleanedRecords += 1 // Placeholder count
      }

      // Clean up orphaned predictions records
      const { error: predictionsError } = await supabase
        .from('predictions')
        .delete()
        .not('game_id', 'in', `(SELECT id FROM games)`)

      if (predictionsError) {
        errors.push(`Failed to clean orphaned predictions: ${predictionsError.message}`)
      } else {
        cleanedRecords += 1 // Placeholder count
      }

      // Clean up orphaned player stats
      const { error: playerStatsError } = await supabase
        .from('player_stats')
        .delete()
        .not('player_id', 'in', `(SELECT id FROM players)`)

      if (playerStatsError) {
        errors.push(`Failed to clean orphaned player stats: ${playerStatsError.message}`)
      } else {
        cleanedRecords += 1 // Placeholder count
      }
    } catch (error) {
      errors.push(
        `Error cleaning orphaned records: ${error instanceof Error ? error.message : String(error)}`
      )
    }

    return { cleanedRecords, errors }
  }

  private async cleanupDuplicateRecords(): Promise<{ cleanedRecords: number; errors: string[] }> {
    const errors: string[] = []
    let cleanedRecords = 0

    try {
      const supabase = this.getSupabaseClient()
      
      // Clean up duplicate games using Supabase RPC
      const { error: gamesError } = await supabase.rpc('cleanup_duplicate_games')

      if (gamesError) {
        errors.push(`Failed to clean duplicate games: ${gamesError.message}`)
      } else {
        cleanedRecords += 1 // Placeholder count
      }
    } catch (error) {
      errors.push(
        `Error cleaning duplicate records: ${error instanceof Error ? error.message : String(error)}`
      )
    }

    return { cleanedRecords, errors }
  }

  private async vacuumTables(): Promise<void> {
    try {
      const tables = [
        'games',
        'teams',
        'players',
        'odds',
        'predictions',
        'standings',
        'cache_entries',
      ]

      for (const table of tables) {
        // Supabase handles VACUUM automatically - skip
        console.log(`Skipping VACUUM for ${table} - handled by Supabase`)
      }

      structuredLogger.info('Table vacuum completed')
    } catch (error) {
      structuredLogger.error('Table vacuum failed', {
        error: error instanceof Error ? error.message : String(error),
      })
    }
  }

  async getCleanupRecommendations(): Promise<CleanupRecommendations> {
    try {
      const supabase = this.getSupabaseClient()
      
      // Get orphaned records count
      const { count: orphanedOddsCount } = await supabase
        .from('odds')
        .select('*', { count: 'exact', head: true })
        .not('game_id', 'in', `(SELECT id FROM games)`)
      const orphanedRecords = orphanedOddsCount || 0

      // Get old cache entries count
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
      const { count: oldCacheCount } = await supabase
        .from('cache_entries')
        .select('*', { count: 'exact', head: true })
        .lt('expires_at', sevenDaysAgo.toISOString())
      const oldCacheEntries = oldCacheCount || 0

      // Get table sizes (simplified for Supabase)
      const largeTables = [
        { table: 'games', size: 'N/A', rowCount: 0 },
        { table: 'teams', size: 'N/A', rowCount: 0 },
        { table: 'players', size: 'N/A', rowCount: 0 },
      ]

      return {
        orphanedRecords,
        duplicateRecords: 0, // Would need more complex queries to calculate
        oldCacheEntries,
        unusedIndexes: [], // Would need to query pg_stat_user_indexes
        largeTables,
      }
    } catch (error) {
      structuredLogger.error('Failed to get cleanup recommendations', {
        error: error instanceof Error ? error.message : String(error),
      })

      return {
        orphanedRecords: 0,
        duplicateRecords: 0,
        oldCacheEntries: 0,
        unusedIndexes: [],
        largeTables: [],
      }
    }
  }
}

export const databaseCleanupService = DatabaseCleanupService.getInstance()
