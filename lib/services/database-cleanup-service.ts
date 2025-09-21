/**
 * Database Cleanup Service
 * Fixes data integrity issues, removes duplicates, and optimizes database
 */

import { MCPDatabaseService } from './mcp-database-service'

export interface CleanupResult {
  operation: string
  status: 'SUCCESS' | 'FAILED' | 'SKIPPED'
  recordsAffected: number
  message: string
  details?: any
}

export interface CleanupReport {
  totalOperations: number
  successfulOperations: number
  failedOperations: number
  skippedOperations: number
  totalRecordsAffected: number
  results: CleanupResult[]
  timestamp: string
}

export class DatabaseCleanupService {
  private dbService: MCPDatabaseService

  constructor() {
    this.dbService = MCPDatabaseService.getInstance()
  }

  /**
   * Run comprehensive database cleanup
   */
  async runFullCleanup(): Promise<CleanupReport> {
    console.log('🧹 Starting comprehensive database cleanup...')
    
    const results: CleanupResult[] = []
    let totalRecordsAffected = 0

    try {
      // 1. Remove duplicate teams
      const duplicateTeamsResult = await this.removeDuplicateTeams()
      results.push(duplicateTeamsResult)
      totalRecordsAffected += duplicateTeamsResult.recordsAffected

      // 2. Remove duplicate games
      const duplicateGamesResult = await this.removeDuplicateGames()
      results.push(duplicateGamesResult)
      totalRecordsAffected += duplicateGamesResult.recordsAffected

      // 3. Clean up orphaned odds
      const orphanedOddsResult = await this.cleanupOrphanedOdds()
      results.push(orphanedOddsResult)
      totalRecordsAffected += orphanedOddsResult.recordsAffected

      // 4. Clean up orphaned player stats
      const orphanedStatsResult = await this.cleanupOrphanedPlayerStats()
      results.push(orphanedStatsResult)
      totalRecordsAffected += orphanedStatsResult.recordsAffected

      // 5. Fix invalid data
      const invalidDataResult = await this.fixInvalidData()
      results.push(invalidDataResult)
      totalRecordsAffected += invalidDataResult.recordsAffected

      // 6. Optimize database
      const optimizeResult = await this.optimizeDatabase()
      results.push(optimizeResult)

      // 7. Update statistics
      const statsResult = await this.updateStatistics()
      results.push(statsResult)

    } catch (error) {
      console.error('❌ Error during cleanup:', error)
      results.push({
        operation: 'Full Cleanup',
        status: 'FAILED',
        recordsAffected: 0,
        message: `Cleanup failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      })
    }

    const successfulOperations = results.filter(r => r.status === 'SUCCESS').length
    const failedOperations = results.filter(r => r.status === 'FAILED').length
    const skippedOperations = results.filter(r => r.status === 'SKIPPED').length

    const report: CleanupReport = {
      totalOperations: results.length,
      successfulOperations,
      failedOperations,
      skippedOperations,
      totalRecordsAffected,
      results,
      timestamp: new Date().toISOString()
    }

    console.log(`✅ Cleanup completed: ${successfulOperations} successful, ${failedOperations} failed, ${skippedOperations} skipped`)
    console.log(`📊 Total records affected: ${totalRecordsAffected}`)

    return report
  }

  /**
   * Remove duplicate teams (keep most recent)
   */
  private async removeDuplicateTeams(): Promise<CleanupResult> {
    try {
      // First, find duplicates
      const duplicatesQuery = `
        SELECT name, sport, league, COUNT(*) as duplicate_count
        FROM teams 
        GROUP BY name, sport, league 
        HAVING COUNT(*) > 1
      `
      const duplicates = await this.dbService.executeSQL(duplicatesQuery)

      if (duplicates.length === 0) {
        return {
          operation: 'Remove Duplicate Teams',
          status: 'SKIPPED',
          recordsAffected: 0,
          message: 'No duplicate teams found'
        }
      }

      let totalDeleted = 0

      // Remove duplicates for each team
      for (const duplicate of duplicates) {
        const deleteQuery = `
          DELETE FROM teams 
          WHERE name = $1 AND sport = $2 AND league = $3
          AND id NOT IN (
            SELECT id FROM teams 
            WHERE name = $1 AND sport = $2 AND league = $3
            ORDER BY updated_at DESC, created_at DESC
            LIMIT 1
          )
        `
        const deleteResult = await this.dbService.executeSQL(deleteQuery, [
          duplicate.name, 
          duplicate.sport, 
          duplicate.league
        ])
        
        totalDeleted += duplicate.duplicate_count - 1
      }

      return {
        operation: 'Remove Duplicate Teams',
        status: 'SUCCESS',
        recordsAffected: totalDeleted,
        message: `Removed ${totalDeleted} duplicate team entries`,
        details: { duplicatesFound: duplicates.length }
      }

    } catch (error) {
      return {
        operation: 'Remove Duplicate Teams',
        status: 'FAILED',
        recordsAffected: 0,
        message: `Failed to remove duplicate teams: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      }
    }
  }

  /**
   * Remove duplicate games (keep most recent)
   */
  private async removeDuplicateGames(): Promise<CleanupResult> {
    try {
      // First, find duplicates
      const duplicatesQuery = `
        SELECT home_team_id, away_team_id, game_date, COUNT(*) as duplicate_count
        FROM games 
        GROUP BY home_team_id, away_team_id, game_date 
        HAVING COUNT(*) > 1
      `
      const duplicates = await this.dbService.executeSQL(duplicatesQuery)

      if (duplicates.length === 0) {
        return {
          operation: 'Remove Duplicate Games',
          status: 'SKIPPED',
          recordsAffected: 0,
          message: 'No duplicate games found'
        }
      }

      let totalDeleted = 0

      // Remove duplicates for each game
      for (const duplicate of duplicates) {
        const deleteQuery = `
          DELETE FROM games 
          WHERE home_team_id = $1 AND away_team_id = $2 AND game_date = $3
          AND id NOT IN (
            SELECT id FROM games 
            WHERE home_team_id = $1 AND away_team_id = $2 AND game_date = $3
            ORDER BY updated_at DESC, created_at DESC
            LIMIT 1
          )
        `
        await this.dbService.executeSQL(deleteQuery, [
          duplicate.home_team_id, 
          duplicate.away_team_id, 
          duplicate.game_date
        ])
        
        totalDeleted += duplicate.duplicate_count - 1
      }

      return {
        operation: 'Remove Duplicate Games',
        status: 'SUCCESS',
        recordsAffected: totalDeleted,
        message: `Removed ${totalDeleted} duplicate game entries`,
        details: { duplicatesFound: duplicates.length }
      }

    } catch (error) {
      return {
        operation: 'Remove Duplicate Games',
        status: 'FAILED',
        recordsAffected: 0,
        message: `Failed to remove duplicate games: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      }
    }
  }

  /**
   * Clean up orphaned odds (odds without valid games)
   */
  private async cleanupOrphanedOdds(): Promise<CleanupResult> {
    try {
      const orphanedQuery = `
        SELECT COUNT(*) as orphaned_count
        FROM odds o
        LEFT JOIN games g ON o.game_id = g.id
        WHERE g.id IS NULL
      `
      const orphanedResult = await this.dbService.executeSQL(orphanedQuery)
      const orphanedCount = orphanedResult[0].orphaned_count

      if (orphanedCount === 0) {
        return {
          operation: 'Cleanup Orphaned Odds',
          status: 'SKIPPED',
          recordsAffected: 0,
          message: 'No orphaned odds found'
        }
      }

      const deleteQuery = `
        DELETE FROM odds 
        WHERE id IN (
          SELECT o.id
          FROM odds o
          LEFT JOIN games g ON o.game_id = g.id
          WHERE g.id IS NULL
        )
      `
      await this.dbService.executeSQL(deleteQuery)

      return {
        operation: 'Cleanup Orphaned Odds',
        status: 'SUCCESS',
        recordsAffected: orphanedCount,
        message: `Removed ${orphanedCount} orphaned odds records`,
        details: { orphanedCount }
      }

    } catch (error) {
      return {
        operation: 'Cleanup Orphaned Odds',
        status: 'FAILED',
        recordsAffected: 0,
        message: `Failed to cleanup orphaned odds: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      }
    }
  }

  /**
   * Clean up orphaned player stats
   */
  private async cleanupOrphanedPlayerStats(): Promise<CleanupResult> {
    try {
      const statsTables = ['player_stats', 'football_player_stats', 'baseball_player_stats', 'hockey_player_stats', 'soccer_player_stats']
      let totalOrphaned = 0

      for (const table of statsTables) {
        try {
          const orphanedQuery = `
            SELECT COUNT(*) as orphaned_count
            FROM ${table} ps
            LEFT JOIN games g ON ps.game_id = g.id
            WHERE g.id IS NULL
          `
          const orphanedResult = await this.dbService.executeSQL(orphanedQuery)
          const orphanedCount = orphanedResult[0].orphaned_count

          if (orphanedCount > 0) {
            const deleteQuery = `
              DELETE FROM ${table} 
              WHERE id IN (
                SELECT ps.id
                FROM ${table} ps
                LEFT JOIN games g ON ps.game_id = g.id
                WHERE g.id IS NULL
              )
            `
            await this.dbService.executeSQL(deleteQuery)
            totalOrphaned += orphanedCount
          }
        } catch (error) {
          // Table might not exist, skip it
          console.warn(`Skipping ${table}: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
      }

      if (totalOrphaned === 0) {
        return {
          operation: 'Cleanup Orphaned Player Stats',
          status: 'SKIPPED',
          recordsAffected: 0,
          message: 'No orphaned player stats found'
        }
      }

      return {
        operation: 'Cleanup Orphaned Player Stats',
        status: 'SUCCESS',
        recordsAffected: totalOrphaned,
        message: `Removed ${totalOrphaned} orphaned player stats records`,
        details: { totalOrphaned }
      }

    } catch (error) {
      return {
        operation: 'Cleanup Orphaned Player Stats',
        status: 'FAILED',
        recordsAffected: 0,
        message: `Failed to cleanup orphaned player stats: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      }
    }
  }

  /**
   * Fix invalid data entries
   */
  private async fixInvalidData(): Promise<CleanupResult> {
    try {
      let totalFixed = 0

      // Fix teams with empty names
      const emptyNamesQuery = `
        UPDATE teams 
        SET name = 'Unknown Team ' || id::text
        WHERE name IS NULL OR name = ''
      `
      const emptyNamesResult = await this.dbService.executeSQL(emptyNamesQuery)
      totalFixed += emptyNamesResult.length || 0

      // Fix teams with empty sports
      const emptySportsQuery = `
        UPDATE teams 
        SET sport = 'unknown'
        WHERE sport IS NULL OR sport = ''
      `
      const emptySportsResult = await this.dbService.executeSQL(emptySportsQuery)
      totalFixed += emptySportsResult.length || 0

      // Fix games with invalid dates
      const invalidDatesQuery = `
        UPDATE games 
        SET game_date = NOW()
        WHERE game_date IS NULL OR game_date < '1900-01-01'
      `
      const invalidDatesResult = await this.dbService.executeSQL(invalidDatesQuery)
      totalFixed += invalidDatesResult.length || 0

      // Fix games with invalid status
      const invalidStatusQuery = `
        UPDATE games 
        SET status = 'scheduled'
        WHERE status IS NULL OR status NOT IN ('scheduled', 'live', 'completed', 'postponed', 'cancelled')
      `
      const invalidStatusResult = await this.dbService.executeSQL(invalidStatusQuery)
      totalFixed += invalidStatusResult.length || 0

      return {
        operation: 'Fix Invalid Data',
        status: 'SUCCESS',
        recordsAffected: totalFixed,
        message: `Fixed ${totalFixed} invalid data entries`,
        details: { 
          emptyNames: emptyNamesResult.length || 0,
          emptySports: emptySportsResult.length || 0,
          invalidDates: invalidDatesResult.length || 0,
          invalidStatus: invalidStatusResult.length || 0
        }
      }

    } catch (error) {
      return {
        operation: 'Fix Invalid Data',
        status: 'FAILED',
        recordsAffected: 0,
        message: `Failed to fix invalid data: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      }
    }
  }

  /**
   * Optimize database performance
   */
  private async optimizeDatabase(): Promise<CleanupResult> {
    try {
      // Analyze tables to update statistics
      const analyzeQuery = 'ANALYZE'
      await this.dbService.executeSQL(analyzeQuery)

      // Vacuum to reclaim space
      const vacuumQuery = 'VACUUM'
      await this.dbService.executeSQL(vacuumQuery)

      return {
        operation: 'Optimize Database',
        status: 'SUCCESS',
        recordsAffected: 0,
        message: 'Database optimization completed',
        details: { operations: ['ANALYZE', 'VACUUM'] }
      }

    } catch (error) {
      return {
        operation: 'Optimize Database',
        status: 'FAILED',
        recordsAffected: 0,
        message: `Failed to optimize database: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      }
    }
  }

  /**
   * Update database statistics
   */
  private async updateStatistics(): Promise<CleanupResult> {
    try {
      // Get current statistics
      const statsQuery = `
        SELECT 
          'teams' as table_name, COUNT(*) as record_count
        FROM teams
        UNION ALL
        SELECT 
          'games' as table_name, COUNT(*) as record_count
        FROM games
        UNION ALL
        SELECT 
          'odds' as table_name, COUNT(*) as record_count
        FROM odds
        UNION ALL
        SELECT 
          'player_stats' as table_name, COUNT(*) as record_count
        FROM player_stats
      `
      const stats = await this.dbService.executeSQL(statsQuery)

      return {
        operation: 'Update Statistics',
        status: 'SUCCESS',
        recordsAffected: 0,
        message: 'Database statistics updated',
        details: { statistics: stats }
      }

    } catch (error) {
      return {
        operation: 'Update Statistics',
        status: 'FAILED',
        recordsAffected: 0,
        message: `Failed to update statistics: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      }
    }
  }

  /**
   * Get cleanup recommendations
   */
  async getCleanupRecommendations(): Promise<string[]> {
    const recommendations: string[] = []

    try {
      // Check for duplicates
      const duplicateTeamsQuery = `
        SELECT COUNT(*) as duplicate_count
        FROM (
          SELECT name, sport, league, COUNT(*) as cnt
          FROM teams 
          GROUP BY name, sport, league 
          HAVING COUNT(*) > 1
        ) duplicates
      `
      const duplicateTeams = await this.dbService.executeSQL(duplicateTeamsQuery)
      if (duplicateTeams[0].duplicate_count > 0) {
        recommendations.push(`Remove ${duplicateTeams[0].duplicate_count} duplicate team entries`)
      }

      const duplicateGamesQuery = `
        SELECT COUNT(*) as duplicate_count
        FROM (
          SELECT home_team_id, away_team_id, game_date, COUNT(*) as cnt
          FROM games 
          GROUP BY home_team_id, away_team_id, game_date 
          HAVING COUNT(*) > 1
        ) duplicates
      `
      const duplicateGames = await this.dbService.executeSQL(duplicateGamesQuery)
      if (duplicateGames[0].duplicate_count > 0) {
        recommendations.push(`Remove ${duplicateGames[0].duplicate_count} duplicate game entries`)
      }

      // Check for orphaned records
      const orphanedOddsQuery = `
        SELECT COUNT(*) as orphaned_count
        FROM odds o
        LEFT JOIN games g ON o.game_id = g.id
        WHERE g.id IS NULL
      `
      const orphanedOdds = await this.dbService.executeSQL(orphanedOddsQuery)
      if (orphanedOdds[0].orphaned_count > 0) {
        recommendations.push(`Remove ${orphanedOdds[0].orphaned_count} orphaned odds records`)
      }

      // Check for invalid data
      const invalidDataQuery = `
        SELECT 
          COUNT(CASE WHEN name IS NULL OR name = '' THEN 1 END) as empty_names,
          COUNT(CASE WHEN sport IS NULL OR sport = '' THEN 1 END) as empty_sports,
          COUNT(CASE WHEN game_date IS NULL OR game_date < '1900-01-01' THEN 1 END) as invalid_dates
        FROM teams t
        LEFT JOIN games g ON (g.home_team_id = t.id OR g.away_team_id = t.id)
      `
      const invalidData = await this.dbService.executeSQL(invalidDataQuery)
      const data = invalidData[0]
      
      if (data.empty_names > 0) {
        recommendations.push(`Fix ${data.empty_names} teams with empty names`)
      }
      if (data.empty_sports > 0) {
        recommendations.push(`Fix ${data.empty_sports} teams with empty sports`)
      }
      if (data.invalid_dates > 0) {
        recommendations.push(`Fix ${data.invalid_dates} games with invalid dates`)
      }

      if (recommendations.length === 0) {
        recommendations.push('Database is clean - no cleanup needed')
      }

    } catch (error) {
      recommendations.push(`Error analyzing database: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }

    return recommendations
  }
}

// Export singleton instance
export const databaseCleanupService = new DatabaseCleanupService()
