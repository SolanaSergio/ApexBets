/**
 * Data Integrity Service
 * Ensures data consistency and prevents duplicates at the database level
 */

import { MCPDatabaseService } from './mcp-database-service';
import { dataValidationService } from './data-validation-service';

export interface IntegrityCheckResult {
  isValid: boolean;
  issues: string[];
  suggestions: string[];
  duplicateCount: number;
  orphanedRecords: number;
}

export class DataIntegrityService {
  private static instance: DataIntegrityService;
  private dbService: MCPDatabaseService;

  constructor() {
    this.dbService = MCPDatabaseService.getInstance();
  }

  static getInstance(): DataIntegrityService {
    if (!DataIntegrityService.instance) {
      DataIntegrityService.instance = new DataIntegrityService();
    }
    return DataIntegrityService.instance;
  }

  /**
   * Check for duplicate teams
   */
  async checkDuplicateTeams(): Promise<IntegrityCheckResult> {
    try {
      const duplicates = await this.dbService.executeSQL(`
        SELECT name, sport, league, COUNT(*) as count
        FROM teams 
        GROUP BY name, sport, league 
        HAVING COUNT(*) > 1
        ORDER BY count DESC
      `);

      return {
        isValid: duplicates.length === 0,
        issues: duplicates.length > 0 ? [`Found ${duplicates.length} duplicate team groups`] : [],
        suggestions: duplicates.length > 0 ? ['Run cleanup to remove duplicates'] : [],
        duplicateCount: duplicates.length,
        orphanedRecords: 0
      };
    } catch (error) {
      return {
        isValid: false,
        issues: [`Error checking duplicate teams: ${error}`],
        suggestions: ['Check database connection and table structure'],
        duplicateCount: 0,
        orphanedRecords: 0
      };
    }
  }

  /**
   * Check for duplicate games
   */
  async checkDuplicateGames(): Promise<IntegrityCheckResult> {
    try {
      const duplicates = await this.dbService.executeSQL(`
        SELECT home_team_id, away_team_id, game_date, COUNT(*) as count
        FROM games 
        GROUP BY home_team_id, away_team_id, game_date 
        HAVING COUNT(*) > 1
        ORDER BY count DESC
      `);

      return {
        isValid: duplicates.length === 0,
        issues: duplicates.length > 0 ? [`Found ${duplicates.length} duplicate game groups`] : [],
        suggestions: duplicates.length > 0 ? ['Run cleanup to remove duplicates'] : [],
        duplicateCount: duplicates.length,
        orphanedRecords: 0
      };
    } catch (error) {
      return {
        isValid: false,
        issues: [`Error checking duplicate games: ${error}`],
        suggestions: ['Check database connection and table structure'],
        duplicateCount: 0,
        orphanedRecords: 0
      };
    }
  }

  /**
   * Check for orphaned records
   */
  async checkOrphanedRecords(): Promise<IntegrityCheckResult> {
    try {
      const orphanedGames = await this.dbService.executeSQL(`
        SELECT COUNT(*) as count
        FROM games g
        LEFT JOIN teams ht ON g.home_team_id = ht.id
        LEFT JOIN teams at ON g.away_team_id = at.id
        WHERE ht.id IS NULL OR at.id IS NULL
      `);

      const orphanedOdds = await this.dbService.executeSQL(`
        SELECT COUNT(*) as count
        FROM odds o
        LEFT JOIN games g ON o.game_id = g.id
        WHERE g.id IS NULL
      `);

      const orphanedPlayerStats = await this.dbService.executeSQL(`
        SELECT COUNT(*) as count
        FROM player_stats ps
        LEFT JOIN games g ON ps.game_id = g.id
        LEFT JOIN teams t ON ps.team_id = t.id
        WHERE g.id IS NULL OR t.id IS NULL
      `);

      const totalOrphaned = orphanedGames[0]?.count + orphanedOdds[0]?.count + orphanedPlayerStats[0]?.count;

      return {
        isValid: totalOrphaned === 0,
        issues: totalOrphaned > 0 ? [`Found ${totalOrphaned} orphaned records`] : [],
        suggestions: totalOrphaned > 0 ? ['Clean up orphaned records to maintain referential integrity'] : [],
        duplicateCount: 0,
        orphanedRecords: totalOrphaned
      };
    } catch (error) {
      return {
        isValid: false,
        issues: [`Error checking orphaned records: ${error}`],
        suggestions: ['Check database connection and foreign key constraints'],
        duplicateCount: 0,
        orphanedRecords: 0
      };
    }
  }

  /**
   * Validate data before insertion
   */
  async validateBeforeInsert(type: 'team' | 'game' | 'odds', data: any): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
    duplicateCheck: boolean;
  }> {
    // First validate the data structure
    const validation = dataValidationService.validateData(type, data);
    
    if (!validation.isValid) {
      return {
        isValid: false,
        errors: validation.errors,
        warnings: validation.warnings,
        duplicateCheck: false
      };
    }

    // Check for duplicates
    const duplicateCheck = await this.checkForDuplicates(type, validation.data);

    return {
      isValid: !duplicateCheck.hasDuplicates,
      errors: duplicateCheck.hasDuplicates ? ['Duplicate record detected'] : [],
      warnings: validation.warnings,
      duplicateCheck: !duplicateCheck.hasDuplicates
    };
  }

  /**
   * Check for duplicates before insertion
   */
  private async checkForDuplicates(type: 'team' | 'game' | 'odds', data: any): Promise<{
    hasDuplicates: boolean;
    duplicateFields: string[];
  }> {
    try {
      let query = '';
      let params: any[] = [];

      switch (type) {
        case 'team':
          query = 'SELECT COUNT(*) as count FROM teams WHERE name = $1 AND sport = $2 AND league = $3';
          params = [data.name, data.sport, data.league];
          break;
        case 'game':
          query = 'SELECT COUNT(*) as count FROM games WHERE home_team_id = $1 AND away_team_id = $2 AND game_date = $3';
          params = [data.home_team_id, data.away_team_id, data.game_date];
          break;
        case 'odds':
          query = 'SELECT COUNT(*) as count FROM odds WHERE game_id = $1 AND source = $2';
          params = [data.game_id, data.source];
          break;
      }

      const result = await this.dbService.executeSQL(query, params);
      const count = result[0]?.count || 0;

      return {
        hasDuplicates: count > 0,
        duplicateFields: count > 0 ? ['Duplicate record exists'] : []
      };
    } catch (error) {
      return {
        hasDuplicates: false,
        duplicateFields: []
      };
    }
  }

  /**
   * Clean up duplicates
   */
  async cleanupDuplicates(): Promise<{
    success: boolean;
    teamsRemoved: number;
    gamesRemoved: number;
    oddsRemoved: number;
    errors: string[];
  }> {
    const errors: string[] = [];
    let teamsRemoved = 0;
    let gamesRemoved = 0;
    let oddsRemoved = 0;

    try {
      // Clean up duplicate teams
      const teamCleanup = await this.dbService.executeSQL(`
        WITH duplicate_teams AS (
          SELECT id, name, sport, league, created_at,
                 ROW_NUMBER() OVER (PARTITION BY name, sport, league ORDER BY created_at DESC) as rn
          FROM teams
        )
        DELETE FROM teams 
        WHERE id IN (
          SELECT id FROM duplicate_teams WHERE rn > 1
        )
      `);
      teamsRemoved = teamCleanup.length || 0;

      // Clean up duplicate games
      const gameCleanup = await this.dbService.executeSQL(`
        WITH duplicate_games AS (
          SELECT id, home_team_id, away_team_id, game_date, created_at,
                 ROW_NUMBER() OVER (PARTITION BY home_team_id, away_team_id, game_date ORDER BY created_at DESC) as rn
          FROM games
        )
        DELETE FROM games 
        WHERE id IN (
          SELECT id FROM duplicate_games WHERE rn > 1
        )
      `);
      gamesRemoved = gameCleanup.length || 0;

      // Clean up duplicate odds
      const oddsCleanup = await this.dbService.executeSQL(`
        WITH duplicate_odds AS (
          SELECT id, game_id, source, created_at,
                 ROW_NUMBER() OVER (PARTITION BY game_id, source ORDER BY created_at DESC) as rn
          FROM odds
        )
        DELETE FROM odds 
        WHERE id IN (
          SELECT id FROM duplicate_odds WHERE rn > 1
        )
      `);
      oddsRemoved = oddsCleanup.length || 0;

      return {
        success: true,
        teamsRemoved,
        gamesRemoved,
        oddsRemoved,
        errors
      };
    } catch (error) {
      errors.push(`Cleanup failed: ${error}`);
      return {
        success: false,
        teamsRemoved,
        gamesRemoved,
        oddsRemoved,
        errors
      };
    }
  }

  /**
   * Run comprehensive integrity check
   */
  async runIntegrityCheck(): Promise<{
    overall: boolean;
    teams: IntegrityCheckResult;
    games: IntegrityCheckResult;
    orphaned: IntegrityCheckResult;
    recommendations: string[];
  }> {
    const teams = await this.checkDuplicateTeams();
    const games = await this.checkDuplicateGames();
    const orphaned = await this.checkOrphanedRecords();

    const overall = teams.isValid && games.isValid && orphaned.isValid;

    const recommendations: string[] = [];
    if (!teams.isValid) recommendations.push('Clean up duplicate teams');
    if (!games.isValid) recommendations.push('Clean up duplicate games');
    if (!orphaned.isValid) recommendations.push('Clean up orphaned records');

    return {
      overall,
      teams,
      games,
      orphaned,
      recommendations
    };
  }
}

export const dataIntegrityService = DataIntegrityService.getInstance();
