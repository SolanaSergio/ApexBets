/**
 * Enhanced API Client
 * Integrates validation, retry mechanisms, and monitoring for robust API operations
 */

import { dataValidationService } from './data-validation-service';
import { dataIntegrityService } from './data-integrity-service';
import { retryMechanismService } from './retry-mechanism-service';
import { automatedMonitoringService } from './automated-monitoring-service';
import { MCPDatabaseService } from './mcp-database-service';

export interface ApiOperationResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  validationErrors?: string[];
  warnings?: string[];
  attempts: number;
  processingTime: number;
}

export interface BatchOperationResult<T> {
  successful: Array<{ index: number; data: T }>;
  failed: Array<{ index: number; error: string; validationErrors?: string[] }>;
  totalProcessed: number;
  successRate: number;
}

export class EnhancedApiClient {
  private static instance: EnhancedApiClient;
  private dbService: MCPDatabaseService;

  constructor() {
    this.dbService = MCPDatabaseService.getInstance();
  }

  static getInstance(): EnhancedApiClient {
    if (!EnhancedApiClient.instance) {
      EnhancedApiClient.instance = new EnhancedApiClient();
    }
    return EnhancedApiClient.instance;
  }

  /**
   * Insert team with full validation and retry
   */
  async insertTeam(teamData: any): Promise<ApiOperationResult<any>> {
    const startTime = Date.now();
    
    // Validate data structure
    const validation = dataValidationService.validateTeam(teamData);
    if (!validation.isValid) {
      return {
        success: false,
        error: 'Validation failed',
        validationErrors: validation.errors,
        warnings: validation.warnings,
        attempts: 0,
        processingTime: Date.now() - startTime
      };
    }

    // Check for duplicates
    const integrityCheck = await dataIntegrityService.validateBeforeInsert('team', validation.data);
    if (!integrityCheck.isValid) {
      return {
        success: false,
        error: 'Duplicate team detected',
        validationErrors: integrityCheck.errors,
        warnings: integrityCheck.warnings,
        attempts: 0,
        processingTime: Date.now() - startTime
      };
    }

    // Execute with retry
    const retryResult = await retryMechanismService.executeWithRetry(async () => {
      return await this.dbService.executeSQL(`
        INSERT INTO teams (name, city, league, sport, abbreviation, logo_url, conference, division, 
                          founded_year, stadium_name, stadium_capacity, primary_color, secondary_color, 
                          country, is_active)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        RETURNING *
      `, [
        validation.data.name,
        validation.data.city,
        validation.data.league,
        validation.data.sport,
        validation.data.abbreviation,
        validation.data.logo_url,
        validation.data.conference,
        validation.data.division,
        validation.data.founded_year,
        validation.data.stadium_name,
        validation.data.stadium_capacity,
        validation.data.primary_color,
        validation.data.secondary_color,
        validation.data.country,
        validation.data.is_active
      ]);
    });

    return {
      success: retryResult.success,
      data: retryResult.data?.[0],
      error: retryResult.success ? undefined : retryResult.error?.message,
      warnings: validation.warnings,
      attempts: retryResult.attempts,
      processingTime: Date.now() - startTime
    };
  }

  /**
   * Insert game with full validation and retry
   */
  async insertGame(gameData: any): Promise<ApiOperationResult<any>> {
    const startTime = Date.now();
    
    // Validate data structure
    const validation = dataValidationService.validateGame(gameData);
    if (!validation.isValid) {
      return {
        success: false,
        error: 'Validation failed',
        validationErrors: validation.errors,
        warnings: validation.warnings,
        attempts: 0,
        processingTime: Date.now() - startTime
      };
    }

    // Check for duplicates
    const integrityCheck = await dataIntegrityService.validateBeforeInsert('game', validation.data);
    if (!integrityCheck.isValid) {
      return {
        success: false,
        error: 'Duplicate game detected',
        validationErrors: integrityCheck.errors,
        warnings: integrityCheck.warnings,
        attempts: 0,
        processingTime: Date.now() - startTime
      };
    }

    // Execute with retry
    const retryResult = await retryMechanismService.executeWithRetry(async () => {
      return await this.dbService.executeSQL(`
        INSERT INTO games (home_team_id, away_team_id, game_date, season, week, home_score, away_score,
                          status, venue, weather_conditions, sport, league, game_type, round, series_game,
                          overtime_periods, attendance, referee_crew, game_notes)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
        RETURNING *
      `, [
        validation.data.home_team_id,
        validation.data.away_team_id,
        validation.data.game_date,
        validation.data.season,
        validation.data.week,
        validation.data.home_score,
        validation.data.away_score,
        validation.data.status,
        validation.data.venue,
        validation.data.weather_conditions ? JSON.stringify(validation.data.weather_conditions) : null,
        validation.data.sport,
        validation.data.league,
        validation.data.game_type,
        validation.data.round,
        validation.data.series_game,
        validation.data.overtime_periods,
        validation.data.attendance,
        validation.data.referee_crew ? JSON.stringify(validation.data.referee_crew) : null,
        validation.data.game_notes
      ]);
    });

    return {
      success: retryResult.success,
      data: retryResult.data?.[0],
      error: retryResult.success ? undefined : retryResult.error?.message,
      warnings: validation.warnings,
      attempts: retryResult.attempts,
      processingTime: Date.now() - startTime
    };
  }

  /**
   * Insert odds with full validation and retry
   */
  async insertOdds(oddsData: any): Promise<ApiOperationResult<any>> {
    const startTime = Date.now();
    
    // Validate data structure
    const validation = dataValidationService.validateOdds(oddsData);
    if (!validation.isValid) {
      return {
        success: false,
        error: 'Validation failed',
        validationErrors: validation.errors,
        warnings: validation.warnings,
        attempts: 0,
        processingTime: Date.now() - startTime
      };
    }

    // Check for duplicates
    const integrityCheck = await dataIntegrityService.validateBeforeInsert('odds', validation.data);
    if (!integrityCheck.isValid) {
      return {
        success: false,
        error: 'Duplicate odds detected',
        validationErrors: integrityCheck.errors,
        warnings: integrityCheck.warnings,
        attempts: 0,
        processingTime: Date.now() - startTime
      };
    }

    // Execute with retry
    const retryResult = await retryMechanismService.executeWithRetry(async () => {
      return await this.dbService.executeSQL(`
        INSERT INTO odds (game_id, source, odds_type, home_odds, away_odds, spread, total, sport, league,
                         prop_bets, live_odds, odds_movement)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING *
      `, [
        validation.data.game_id,
        validation.data.source,
        validation.data.odds_type,
        validation.data.home_odds,
        validation.data.away_odds,
        validation.data.spread,
        validation.data.total,
        validation.data.sport,
        validation.data.league,
        validation.data.prop_bets ? JSON.stringify(validation.data.prop_bets) : null,
        validation.data.live_odds,
        validation.data.odds_movement ? JSON.stringify(validation.data.odds_movement) : null
      ]);
    });

    return {
      success: retryResult.success,
      data: retryResult.data?.[0],
      error: retryResult.success ? undefined : retryResult.error?.message,
      warnings: validation.warnings,
      attempts: retryResult.attempts,
      processingTime: Date.now() - startTime
    };
  }

  /**
   * Batch insert teams with validation and retry
   */
  async batchInsertTeams(teamsData: any[]): Promise<BatchOperationResult<any>> {
    const successful: Array<{ index: number; data: any }> = [];
    const failed: Array<{ index: number; error: string; validationErrors?: string[] }> = [];

    for (let i = 0; i < teamsData.length; i++) {
      const result = await this.insertTeam(teamsData[i]);
      
      if (result.success) {
        successful.push({ index: i, data: result.data });
      } else {
        failed.push({ 
          index: i, 
          error: result.error || 'Unknown error',
          validationErrors: result.validationErrors
        });
      }
    }

    return {
      successful,
      failed,
      totalProcessed: teamsData.length,
      successRate: successful.length / teamsData.length
    };
  }

  /**
   * Batch insert games with validation and retry
   */
  async batchInsertGames(gamesData: any[]): Promise<BatchOperationResult<any>> {
    const successful: Array<{ index: number; data: any }> = [];
    const failed: Array<{ index: number; error: string; validationErrors?: string[] }> = [];

    for (let i = 0; i < gamesData.length; i++) {
      const result = await this.insertGame(gamesData[i]);
      
      if (result.success) {
        successful.push({ index: i, data: result.data });
      } else {
        failed.push({ 
          index: i, 
          error: result.error || 'Unknown error',
          validationErrors: result.validationErrors
        });
      }
    }

    return {
      successful,
      failed,
      totalProcessed: gamesData.length,
      successRate: successful.length / gamesData.length
    };
  }

  /**
   * Batch insert odds with validation and retry
   */
  async batchInsertOdds(oddsData: any[]): Promise<BatchOperationResult<any>> {
    const successful: Array<{ index: number; data: any }> = [];
    const failed: Array<{ index: number; error: string; validationErrors?: string[] }> = [];

    for (let i = 0; i < oddsData.length; i++) {
      const result = await this.insertOdds(oddsData[i]);
      
      if (result.success) {
        successful.push({ index: i, data: result.data });
      } else {
        failed.push({ 
          index: i, 
          error: result.error || 'Unknown error',
          validationErrors: result.validationErrors
        });
      }
    }

    return {
      successful,
      failed,
      totalProcessed: oddsData.length,
      successRate: successful.length / oddsData.length
    };
  }

  /**
   * Get data with retry and monitoring
   */
  async getData<T>(query: string, params: any[] = []): Promise<ApiOperationResult<T[]>> {
    const startTime = Date.now();
    
    const retryResult = await retryMechanismService.executeWithRetry(async () => {
      return await this.dbService.executeSQL(query, params);
    });

    return {
      success: retryResult.success,
      data: retryResult.data as T[],
      error: retryResult.success ? undefined : retryResult.error?.message,
      attempts: retryResult.attempts,
      processingTime: Date.now() - startTime
    };
  }

  /**
   * Run data integrity check
   */
  async runDataIntegrityCheck(): Promise<{
    success: boolean;
    results: any;
    recommendations: string[];
  }> {
    try {
      const results = await dataIntegrityService.runIntegrityCheck();
      return {
        success: results.overall,
        results,
        recommendations: results.recommendations
      };
    } catch (error) {
      return {
        success: false,
        results: null,
        recommendations: ['Check system health and database connection']
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
    return await dataIntegrityService.cleanupDuplicates();
  }

  /**
   * Get monitoring metrics
   */
  getMonitoringMetrics() {
    return automatedMonitoringService.getMetrics();
  }

  /**
   * Get active alerts
   */
  getActiveAlerts() {
    return automatedMonitoringService.getActiveAlerts();
  }

  /**
   * Force health check
   */
  async forceHealthCheck() {
    return await automatedMonitoringService.forceHealthCheck();
  }
}

export const enhancedApiClient = EnhancedApiClient.getInstance();
