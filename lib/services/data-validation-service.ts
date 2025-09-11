/**
 * DATA VALIDATION SERVICE
 * Ensures data quality and consistency
 */

import { apiClient, type Game, type Team, type Player } from '@/lib/api-client';
import { SportConfigManager, SupportedSport } from './core/sport-config';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  data: any;
}

export interface ComponentValidationResult {
  component: string;
  hasRequiredData: boolean;
  dataQuality: 'excellent' | 'good' | 'fair' | 'poor';
  missingData: string[];
  recommendations: string[];
}

export class DataValidationService {
  validateGame(data: any): ValidationResult {
    const errors: string[] = [];
    let isValid = true;

    if (!data.id) {
      errors.push('Game ID is required');
      isValid = false;
    }

    if (!data.home_team_id) {
      errors.push('Home team ID is required');
      isValid = false;
    }

    if (!data.away_team_id) {
      errors.push('Away team ID is required');
      isValid = false;
    }

    if (!data.game_date) {
      errors.push('Game date is required');
      isValid = false;
    }

    // Validate game status dynamically
    const validStatuses = ['scheduled', 'in_progress', 'completed', 'postponed', 'cancelled', 'live', 'final'];
    if (data.status && !validStatuses.includes(data.status)) {
      errors.push(`Invalid game status. Valid statuses: ${validStatuses.join(', ')}`);
      isValid = false;
    }

    if (data.home_score !== null && data.home_score !== undefined) {
      if (data.home_score < 0 || data.home_score > 200) {
        errors.push('Home score must be between 0 and 200');
        isValid = false;
      }
    }

    if (data.away_score !== null && data.away_score !== undefined) {
      if (data.away_score < 0 || data.away_score > 200) {
        errors.push('Away score must be between 0 and 200');
        isValid = false;
      }
    }

    return {
      isValid,
      errors,
      data: isValid ? data : null,
    };
  }

  validateTeam(data: any): ValidationResult {
    const errors: string[] = [];
    let isValid = true;

    if (!data.id) {
      errors.push('Team ID is required');
      isValid = false;
    }

    if (!data.name) {
      errors.push('Team name is required');
      isValid = false;
    }

    // Validate sport dynamically from supported sports
    if (data.sport) {
      const supportedSports = SportConfigManager.getSupportedSports();
      if (!supportedSports.includes(data.sport)) {
        errors.push(`Invalid sport type. Supported sports: ${supportedSports.join(', ')}`);
        isValid = false;
      }
    }

    return {
      isValid,
      errors,
      data: isValid ? data : null,
    };
  }

  sanitizeData(data: any): any {
    const sanitized = { ...data };

    // Remove null/undefined values
    Object.keys(sanitized).forEach((key) => {
      if (sanitized[key] === null || sanitized[key] === undefined) {
        delete sanitized[key];
      }
    });

    // Sanitize strings
    Object.keys(sanitized).forEach((key) => {
      if (typeof sanitized[key] === 'string') {
        sanitized[key] = sanitized[key].trim();
      }
    });

    // Add timestamps
    sanitized.updated_at = new Date().toISOString();
    if (!sanitized.created_at) {
      sanitized.created_at = new Date().toISOString();
    }

    return sanitized;
  }

  async validateComponentDataAccess(component: string): Promise<ComponentValidationResult> {
    let hasRequiredData = true;
    const missingData: string[] = [];
    let dataQuality: 'excellent' | 'good' | 'fair' | 'poor' = 'excellent';
    const recommendations: string[] = [];

    const supportedSports = SportConfigManager.getSupportedSports();

    switch (component) {
      case 'GamesList':
        for (const sport of supportedSports) {
          try {
            const games = await apiClient.getGames({ sport: sport as SupportedSport, limit: 1 });
            if (games.length === 0) {
              hasRequiredData = false;
              missingData.push(`No games found for ${sport}`);
              recommendations.push(`Run data population for ${sport} games.`);
              dataQuality = 'poor';
            } else {
              const validation = this.validateGame(games[0]);
              if (!validation.isValid) {
                hasRequiredData = false;
                missingData.push(`Invalid game data for ${sport}: ${validation.errors.join(', ')}`);
                recommendations.push(`Check data source for ${sport} games.`);
                dataQuality = 'fair';
              }
            }
          } catch (error) {
            hasRequiredData = false;
            missingData.push(`Error fetching games for ${sport}: ${error instanceof Error ? error.message : String(error)}`);
            recommendations.push(`Verify API endpoint for ${sport} games.`);
            dataQuality = 'poor';
          }
        }
        break;
      case 'TeamsList':
        for (const sport of supportedSports) {
          try {
            const teams = await apiClient.getTeams({ sport: sport as SupportedSport });
            if (teams.length === 0) {
              hasRequiredData = false;
              missingData.push(`No teams found for ${sport}`);
              recommendations.push(`Run data population for ${sport} teams.`);
              dataQuality = 'poor';
            } else {
              const validation = this.validateTeam(teams[0]);
              if (!validation.isValid) {
                hasRequiredData = false;
                missingData.push(`Invalid team data for ${sport}: ${validation.errors.join(', ')}`);
                recommendations.push(`Check data source for ${sport} teams.`);
                dataQuality = 'fair';
              }
            }
          } catch (error) {
            hasRequiredData = false;
            missingData.push(`Error fetching teams for ${sport}: ${error instanceof Error ? error.message : String(error)}`);
            recommendations.push(`Verify API endpoint for ${sport} teams.`);
            dataQuality = 'poor';
          }
        }
        break;
      case 'PlayerSearch':
      case 'PlayerStats':
        // For player-related components, check if players can be fetched
        for (const sport of supportedSports) {
          try {
            const players = await apiClient.getPlayers({ sport: sport as SupportedSport, limit: 1 });
            if (players.length === 0) {
              hasRequiredData = false;
              missingData.push(`No players found for ${sport}`);
              recommendations.push(`Run data population for ${sport} players.`);
              dataQuality = 'poor';
            }
          } catch (error) {
            hasRequiredData = false;
            missingData.push(`Error fetching players for ${sport}: ${error instanceof Error ? error.message : String(error)}`);
            recommendations.push(`Verify API endpoint for ${sport} players.`);
            dataQuality = 'poor';
          }
        }
        break;
      // Add more cases for other critical components
      default:
        missingData.push(`Validation logic not defined for component: ${component}`);
        dataQuality = 'fair';
        break;
    }

    return {
      component,
      hasRequiredData,
      dataQuality,
      missingData,
      recommendations,
    };
  }

  async validateAllComponents(): Promise<ComponentValidationResult[]> {
    const results: ComponentValidationResult[] = [];
    const componentsToValidate = [
      'GamesList',
      'TeamsList',
      'PlayerSearch',
      'PlayerStats',
      // Add other critical components here
    ];

    for (const component of componentsToValidate) {
      results.push(await this.validateComponentDataAccess(component));
    }
    return results;
  }

  async getDataPopulationRecommendations(): Promise<string[]> {
    const recommendations: string[] = [];
    const results = await this.validateAllComponents();

    const allSports = SportConfigManager.getSupportedSports();
    const sportsWithMissingData = new Set<SupportedSport>();

    for (const result of results) {
      if (!result.hasRequiredData) {
        result.recommendations.forEach(rec => recommendations.push(rec));
        // Extract sports from missing data messages to suggest population
        const sportMatch = result.missingData.find(msg => msg.includes('for '))?.match(/for (\w+)/);
        if (sportMatch && sportMatch[1]) {
          sportsWithMissingData.add(sportMatch[1] as SupportedSport);
        }
      }
    }

    if (sportsWithMissingData.size > 0) {
      recommendations.push(`Consider running data population scripts for the following sports: ${Array.from(sportsWithMissingData).join(', ')}.`);
    }

    // Add general recommendations
    recommendations.push("Ensure all required API keys are configured in your .env file.");
    recommendations.push("Verify network connectivity to external data sources.");
    recommendations.push("Check server logs for detailed API errors.");

    return Array.from(new Set(recommendations)); // Remove duplicates
  }
}

export const dataValidationService = new DataValidationService();
