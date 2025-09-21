/**
 * Data Validation Service
 * Comprehensive validation for all data entry points to prevent duplicates and ensure data integrity
 */

import { z } from 'zod';

// Validation schemas for different data types
export const TeamValidationSchema = z.object({
  name: z.string().min(1).max(255).trim(),
  city: z.string().max(100).trim().optional(),
  league: z.string().min(1).max(100).trim(),
  sport: z.enum(['basketball', 'football', 'baseball', 'hockey', 'soccer', 'tennis', 'golf']),
  abbreviation: z.string().max(10).trim().optional(),
  logo_url: z.string().url().optional(),
  conference: z.string().max(50).trim().optional(),
  division: z.string().max(50).trim().optional(),
  founded_year: z.number().int().min(1800).max(new Date().getFullYear()).optional(),
  stadium_name: z.string().max(200).trim().optional(),
  stadium_capacity: z.number().int().min(0).max(200000).optional(),
  primary_color: z.string().max(20).trim().optional(),
  secondary_color: z.string().max(20).trim().optional(),
  country: z.string().max(100).trim().default('US'),
  is_active: z.boolean().default(true)
});

export const GameValidationSchema = z.object({
  home_team_id: z.string().uuid(),
  away_team_id: z.string().uuid(),
  game_date: z.string().datetime(),
  season: z.string().min(1).max(20).trim(),
  week: z.number().int().min(1).max(52).optional(),
  home_score: z.number().int().min(0).max(999).optional(),
  away_score: z.number().int().min(0).max(999).optional(),
  status: z.enum(['scheduled', 'live', 'completed', 'postponed', 'cancelled']).default('scheduled'),
  venue: z.string().max(200).trim().optional(),
  weather_conditions: z.record(z.any()).optional(),
  sport: z.enum(['basketball', 'football', 'baseball', 'hockey', 'soccer', 'tennis', 'golf']),
  league: z.string().max(100).trim().optional(),
  game_type: z.string().max(50).trim().default('regular'),
  round: z.string().max(50).trim().optional(),
  series_game: z.number().int().min(1).optional(),
  overtime_periods: z.number().int().min(0).max(10).default(0),
  attendance: z.number().int().min(0).max(200000).optional(),
  referee_crew: z.record(z.any()).optional(),
  game_notes: z.string().max(1000).trim().optional()
});

export const OddsValidationSchema = z.object({
  game_id: z.string().uuid(),
  source: z.string().min(1).max(100).trim(),
  odds_type: z.string().min(1).max(50).trim(),
  home_odds: z.number().positive().max(1000).optional(),
  away_odds: z.number().positive().max(1000).optional(),
  spread: z.number().optional(),
  total: z.number().positive().optional(),
  sport: z.enum(['basketball', 'football', 'baseball', 'hockey', 'soccer', 'tennis', 'golf']),
  league: z.string().max(100).trim().optional(),
  prop_bets: z.record(z.any()).optional(),
  live_odds: z.boolean().default(false),
  odds_movement: z.record(z.any()).optional()
});

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  data?: any;
}

export class DataValidationService {
  private static instance: DataValidationService;
  private validationCache = new Map<string, any>();

  static getInstance(): DataValidationService {
    if (!DataValidationService.instance) {
      DataValidationService.instance = new DataValidationService();
    }
    return DataValidationService.instance;
  }

  /**
   * Validate team data
   */
  validateTeam(data: any): ValidationResult {
    try {
      const validatedData = TeamValidationSchema.parse(data);
      return {
        isValid: true,
        errors: [],
        warnings: this.generateTeamWarnings(validatedData),
        data: validatedData
      };
    } catch (error) {
      return {
        isValid: false,
        errors: this.extractValidationErrors(error),
        warnings: [],
        data: null
      };
    }
  }

  /**
   * Validate game data
   */
  validateGame(data: any): ValidationResult {
    try {
      const validatedData = GameValidationSchema.parse(data);
      return {
        isValid: true,
        errors: [],
        warnings: this.generateGameWarnings(validatedData),
        data: validatedData
      };
    } catch (error) {
      return {
        isValid: false,
        errors: this.extractValidationErrors(error),
        warnings: [],
        data: null
      };
    }
  }

  /**
   * Validate odds data
   */
  validateOdds(data: any): ValidationResult {
    try {
      const validatedData = OddsValidationSchema.parse(data);
      return {
        isValid: true,
        errors: [],
        warnings: this.generateOddsWarnings(validatedData),
        data: validatedData
      };
    } catch (error) {
      return {
        isValid: false,
        errors: this.extractValidationErrors(error),
        warnings: [],
        data: null
      };
    }
  }

  /**
   * Validate data based on type
   */
  validateData(type: 'team' | 'game' | 'odds', data: any): ValidationResult {
    const cacheKey = `${type}_${JSON.stringify(data)}`;
    
    if (this.validationCache.has(cacheKey)) {
      return this.validationCache.get(cacheKey);
    }

    let result: ValidationResult;
    
    switch (type) {
      case 'team':
        result = this.validateTeam(data);
        break;
      case 'game':
        result = this.validateGame(data);
        break;
      case 'odds':
        result = this.validateOdds(data);
        break;
      default:
        result = {
          isValid: false,
          errors: ['Unknown validation type'],
          warnings: [],
          data: null
        };
    }

    // Cache result for 5 minutes
    this.validationCache.set(cacheKey, result);
    setTimeout(() => this.validationCache.delete(cacheKey), 5 * 60 * 1000);

    return result;
  }

  /**
   * Batch validate multiple records
   */
  validateBatch(type: 'team' | 'game' | 'odds', dataArray: any[]): {
    valid: any[];
    invalid: { data: any; errors: string[] }[];
    warnings: string[];
  } {
    const valid: any[] = [];
    const invalid: { data: any; errors: string[] }[] = [];
    const allWarnings: string[] = [];

    for (const data of dataArray) {
      const result = this.validateData(type, data);
      
      if (result.isValid) {
        valid.push(result.data);
        allWarnings.push(...result.warnings);
      } else {
        invalid.push({ data, errors: result.errors });
      }
    }

    return { valid, invalid, warnings: allWarnings };
  }

  private extractValidationErrors(error: any): string[] {
    if (error instanceof z.ZodError) {
      return error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
    }
    return [error.message || 'Unknown validation error'];
  }

  private generateTeamWarnings(data: any): string[] {
    const warnings: string[] = [];
    
    if (!data.logo_url) {
      warnings.push('Team missing logo URL');
    }
    
    if (!data.abbreviation) {
      warnings.push('Team missing abbreviation');
    }
    
    if (data.founded_year && data.founded_year < 1900) {
      warnings.push('Team founded year seems unusually early');
    }
    
    return warnings;
  }

  private generateGameWarnings(data: any): string[] {
    const warnings: string[] = [];
    
    if (data.home_team_id === data.away_team_id) {
      warnings.push('Home team and away team are the same');
    }
    
    if (data.game_date && new Date(data.game_date) > new Date()) {
      warnings.push('Game date is in the future');
    }
    
    if (data.status === 'completed' && (data.home_score === null || data.away_score === null)) {
      warnings.push('Completed game missing scores');
    }
    
    return warnings;
  }

  private generateOddsWarnings(data: any): string[] {
    const warnings: string[] = [];
    
    if (data.home_odds && data.away_odds && Math.abs(data.home_odds - data.away_odds) > 50) {
      warnings.push('Large odds difference between teams');
    }
    
    if (data.spread && Math.abs(data.spread) > 50) {
      warnings.push('Very large spread value');
    }
    
    return warnings;
  }

  /**
   * Clear validation cache
   */
  clearCache(): void {
    this.validationCache.clear();
  }
}

export const dataValidationService = DataValidationService.getInstance();