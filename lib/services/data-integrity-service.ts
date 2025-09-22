/**
 * Data Integrity Service
 * Handles data integrity checks and validation
 */

import { structuredLogger } from './structured-logger'
import { databaseService } from './database-service'

export interface IntegrityCheckResult {
  success: boolean
  issues: IntegrityIssue[]
  executionTime: number
  timestamp: Date
}

export interface IntegrityIssue {
  type: 'error' | 'warning' | 'info'
  table: string
  description: string
  count: number
  details?: any
}

export class DataIntegrityService {
  private static instance: DataIntegrityService

  public static getInstance(): DataIntegrityService {
    if (!DataIntegrityService.instance) {
      DataIntegrityService.instance = new DataIntegrityService()
    }
    return DataIntegrityService.instance
  }

  async runIntegrityCheck(sport?: string): Promise<IntegrityCheckResult> {
    const startTime = Date.now()
    const issues: IntegrityIssue[] = []

    try {
      structuredLogger.info('Starting data integrity check', { sport })

      // Check for orphaned records
      const orphanedIssues = await this.checkOrphanedRecords()
      issues.push(...orphanedIssues)

      // Check for missing required fields
      const missingFieldIssues = await this.checkMissingRequiredFields()
      issues.push(...missingFieldIssues)

      // Check for data consistency
      const consistencyIssues = await this.checkDataConsistency()
      issues.push(...consistencyIssues)

      // Check for duplicate records
      const duplicateIssues = await this.checkDuplicateRecords()
      issues.push(...duplicateIssues)

      const executionTime = Date.now() - startTime
      const success = issues.filter(issue => issue.type === 'error').length === 0

      const result: IntegrityCheckResult = {
        success,
        issues,
        executionTime,
        timestamp: new Date()
      }

      structuredLogger.info('Data integrity check completed', {
        success,
        totalIssues: issues.length,
        errorIssues: issues.filter(i => i.type === 'error').length,
        warningIssues: issues.filter(i => i.type === 'warning').length,
        executionTime
      })

      return result

    } catch (error) {
      const executionTime = Date.now() - startTime
      const errorMessage = `Data integrity check failed: ${error instanceof Error ? error.message : String(error)}`

      structuredLogger.error(errorMessage)

      return {
        success: false,
        issues: [{
          type: 'error',
          table: 'system',
          description: errorMessage,
          count: 1
        }],
        executionTime,
        timestamp: new Date()
      }
    }
  }

  private async checkOrphanedRecords(): Promise<IntegrityIssue[]> {
    const issues: IntegrityIssue[] = []

    try {
      // Check orphaned odds
      const orphanedOddsQuery = `
        SELECT COUNT(*) as count FROM odds 
        WHERE game_id NOT IN (SELECT id FROM games)
      `
      const oddsResult = await databaseService.executeSQL(orphanedOddsQuery)
      const orphanedOdds = oddsResult.data?.[0]?.count || 0

      if (orphanedOdds > 0) {
        issues.push({
          type: 'error',
          table: 'odds',
          description: 'Orphaned odds records found',
          count: orphanedOdds
        })
      }

      // Check orphaned predictions
      const orphanedPredictionsQuery = `
        SELECT COUNT(*) as count FROM predictions 
        WHERE game_id NOT IN (SELECT id FROM games)
      `
      const predictionsResult = await databaseService.executeSQL(orphanedPredictionsQuery)
      const orphanedPredictions = predictionsResult.data?.[0]?.count || 0

      if (orphanedPredictions > 0) {
        issues.push({
          type: 'error',
          table: 'predictions',
          description: 'Orphaned predictions records found',
          count: orphanedPredictions
        })
      }

      // Check orphaned player stats
      const orphanedPlayerStatsQuery = `
        SELECT COUNT(*) as count FROM player_stats 
        WHERE player_id NOT IN (SELECT id FROM players)
      `
      const playerStatsResult = await databaseService.executeSQL(orphanedPlayerStatsQuery)
      const orphanedPlayerStats = playerStatsResult.data?.[0]?.count || 0

      if (orphanedPlayerStats > 0) {
        issues.push({
          type: 'error',
          table: 'player_stats',
          description: 'Orphaned player stats records found',
          count: orphanedPlayerStats
        })
      }

    } catch (error) {
      issues.push({
        type: 'error',
        table: 'orphaned_records',
        description: `Failed to check orphaned records: ${error instanceof Error ? error.message : String(error)}`,
        count: 1
      })
    }

    return issues
  }

  private async checkMissingRequiredFields(): Promise<IntegrityIssue[]> {
    const issues: IntegrityIssue[] = []

    try {
      // Check games with missing required fields
      const gamesMissingFieldsQuery = `
        SELECT COUNT(*) as count FROM games 
        WHERE home_team_id IS NULL OR away_team_id IS NULL OR sport IS NULL
      `
      const gamesResult = await databaseService.executeSQL(gamesMissingFieldsQuery)
      const gamesMissingFields = gamesResult.data?.[0]?.count || 0

      if (gamesMissingFields > 0) {
        issues.push({
          type: 'error',
          table: 'games',
          description: 'Games with missing required fields found',
          count: gamesMissingFields
        })
      }

      // Check teams with missing required fields
      const teamsMissingFieldsQuery = `
        SELECT COUNT(*) as count FROM teams 
        WHERE name IS NULL OR sport IS NULL
      `
      const teamsResult = await databaseService.executeSQL(teamsMissingFieldsQuery)
      const teamsMissingFields = teamsResult.data?.[0]?.count || 0

      if (teamsMissingFields > 0) {
        issues.push({
          type: 'error',
          table: 'teams',
          description: 'Teams with missing required fields found',
          count: teamsMissingFields
        })
      }

      // Check players with missing required fields
      const playersMissingFieldsQuery = `
        SELECT COUNT(*) as count FROM players 
        WHERE name IS NULL OR sport IS NULL
      `
      const playersResult = await databaseService.executeSQL(playersMissingFieldsQuery)
      const playersMissingFields = playersResult.data?.[0]?.count || 0

      if (playersMissingFields > 0) {
        issues.push({
          type: 'error',
          table: 'players',
          description: 'Players with missing required fields found',
          count: playersMissingFields
        })
      }

    } catch (error) {
      issues.push({
        type: 'error',
        table: 'missing_fields',
        description: `Failed to check missing required fields: ${error instanceof Error ? error.message : String(error)}`,
        count: 1
      })
    }

    return issues
  }

  private async checkDataConsistency(): Promise<IntegrityIssue[]> {
    const issues: IntegrityIssue[] = []

    try {
      // Check for games with invalid scores
      const invalidScoresQuery = `
        SELECT COUNT(*) as count FROM games 
        WHERE (home_score IS NOT NULL AND home_score < 0) 
        OR (away_score IS NOT NULL AND away_score < 0)
      `
      const scoresResult = await databaseService.executeSQL(invalidScoresQuery)
      const invalidScores = scoresResult.data?.[0]?.count || 0

      if (invalidScores > 0) {
        issues.push({
          type: 'warning',
          table: 'games',
          description: 'Games with invalid scores found',
          count: invalidScores
        })
      }

      // Check for players with invalid ages
      const invalidAgesQuery = `
        SELECT COUNT(*) as count FROM players 
        WHERE age IS NOT NULL AND (age < 16 OR age > 50)
      `
      const agesResult = await databaseService.executeSQL(invalidAgesQuery)
      const invalidAges = agesResult.data?.[0]?.count || 0

      if (invalidAges > 0) {
        issues.push({
          type: 'warning',
          table: 'players',
          description: 'Players with invalid ages found',
          count: invalidAges
        })
      }

    } catch (error) {
      issues.push({
        type: 'error',
        table: 'data_consistency',
        description: `Failed to check data consistency: ${error instanceof Error ? error.message : String(error)}`,
        count: 1
      })
    }

    return issues
  }

  private async checkDuplicateRecords(): Promise<IntegrityIssue[]> {
    const issues: IntegrityIssue[] = []

    try {
      // Check for duplicate games
      const duplicateGamesQuery = `
        SELECT COUNT(*) as count FROM (
          SELECT home_team_id, away_team_id, game_date, COUNT(*) as cnt
          FROM games
          GROUP BY home_team_id, away_team_id, game_date
          HAVING COUNT(*) > 1
        ) duplicates
      `
      const gamesResult = await databaseService.executeSQL(duplicateGamesQuery)
      const duplicateGames = gamesResult.data?.[0]?.count || 0

      if (duplicateGames > 0) {
        issues.push({
          type: 'warning',
          table: 'games',
          description: 'Duplicate games found',
          count: duplicateGames
        })
      }

      // Check for duplicate teams
      const duplicateTeamsQuery = `
        SELECT COUNT(*) as count FROM (
          SELECT name, sport, league, COUNT(*) as cnt
          FROM teams
          GROUP BY name, sport, league
          HAVING COUNT(*) > 1
        ) duplicates
      `
      const teamsResult = await databaseService.executeSQL(duplicateTeamsQuery)
      const duplicateTeams = teamsResult.data?.[0]?.count || 0

      if (duplicateTeams > 0) {
        issues.push({
          type: 'warning',
          table: 'teams',
          description: 'Duplicate teams found',
          count: duplicateTeams
        })
      }

    } catch (error) {
      issues.push({
        type: 'error',
        table: 'duplicates',
        description: `Failed to check duplicate records: ${error instanceof Error ? error.message : String(error)}`,
        count: 1
      })
    }

    return issues
  }
}

export const dataIntegrityService = DataIntegrityService.getInstance()
