/**
 * Data Validation Service
 * Handles data validation and integrity checks
 */

import { structuredLogger } from './structured-logger'

export interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
  validatedCount: number
}

export class DataValidationService {
  private static instance: DataValidationService

  public static getInstance(): DataValidationService {
    if (!DataValidationService.instance) {
      DataValidationService.instance = new DataValidationService()
    }
    return DataValidationService.instance
  }

  validateLiveGames(games: any[]): ValidationResult {
    const errors: string[] = []
    const warnings: string[] = []
    let validatedCount = 0

    try {
      structuredLogger.debug('Validating live games', { count: games.length })

      for (const game of games) {
        if (!game) {
          errors.push('Null game object found')
          continue
        }

        // Validate required fields
        if (!game.id) {
          errors.push('Game missing required field: id')
        }
        if (!game.sport) {
          errors.push('Game missing required field: sport')
        }
        if (!game.homeTeam && !game.home_team) {
          errors.push('Game missing required field: homeTeam')
        }
        if (!game.awayTeam && !game.away_team) {
          errors.push('Game missing required field: awayTeam')
        }

        // Validate status
        if (game.status && !['scheduled', 'live', 'finished', 'postponed', 'cancelled'].includes(game.status)) {
          warnings.push(`Game ${game.id} has invalid status: ${game.status}`)
        }

        // Validate scores if present
        if (game.homeScore !== undefined && (typeof game.homeScore !== 'number' || game.homeScore < 0)) {
          warnings.push(`Game ${game.id} has invalid home score: ${game.homeScore}`)
        }
        if (game.awayScore !== undefined && (typeof game.awayScore !== 'number' || game.awayScore < 0)) {
          warnings.push(`Game ${game.id} has invalid away score: ${game.awayScore}`)
        }

        validatedCount++
      }

      const result: ValidationResult = {
        isValid: errors.length === 0,
        errors,
        warnings,
        validatedCount
      }

      structuredLogger.debug('Live games validation completed', result)

      return result

    } catch (error) {
      structuredLogger.error('Live games validation failed', {
        error: error instanceof Error ? error.message : String(error)
      })

      return {
        isValid: false,
        errors: [`Validation failed: ${error instanceof Error ? error.message : String(error)}`],
        warnings: [],
        validatedCount
      }
    }
  }

  async validateComponentDataAccess(component: string): Promise<{ component: string; hasRequiredData: boolean; dataQuality: 'excellent' | 'good' | 'fair' | 'poor'; missingData: string[]; recommendations: string[] }> {
    // Basic stub using existing validation logic
    const result = this.validateLiveGames([])
    return {
      component,
      hasRequiredData: result.isValid,
      dataQuality: 'fair',
      missingData: result.errors,
      recommendations: ['Verify data sources and API connectivity']
    }
  }

  async validateAllComponents(): Promise<Array<{ component: string; hasRequiredData: boolean; dataQuality: 'excellent' | 'good' | 'fair' | 'poor'; missingData: string[]; recommendations: string[] }>> {
    const components = ['dashboard', 'teams', 'standings', 'players']
    const results = await Promise.all(components.map(c => this.validateComponentDataAccess(c)))
    return results
  }

  async getDataPopulationRecommendations(): Promise<Array<{ component: string; recommendations: string[] }>> {
    return [
      { component: 'teams', recommendations: ['Ensure team table has indexes', 'Backfill missing logos'] },
      { component: 'players', recommendations: ['Sync player rosters from primary provider'] }
    ]
  }

  validateGameData(game: any): ValidationResult {
    const errors: string[] = []
    const warnings: string[] = []

    try {
      if (!game) {
        return {
          isValid: false,
          errors: ['Game object is null or undefined'],
          warnings: [],
          validatedCount: 0
        }
      }

      // Validate required fields
      const requiredFields = ['id', 'sport', 'homeTeam', 'awayTeam']
      for (const field of requiredFields) {
        if (!game[field] && !game[field.toLowerCase()]) {
          errors.push(`Missing required field: ${field}`)
        }
      }

      // Validate data types
      if (game.homeScore !== undefined && typeof game.homeScore !== 'number') {
        errors.push('homeScore must be a number')
      }
      if (game.awayScore !== undefined && typeof game.awayScore !== 'number') {
        errors.push('awayScore must be a number')
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
        validatedCount: 1
      }

    } catch (error) {
      return {
        isValid: false,
        errors: [`Validation error: ${error instanceof Error ? error.message : String(error)}`],
        warnings: [],
        validatedCount: 0
      }
    }
  }

  validateTeamData(team: any): ValidationResult {
    const errors: string[] = []
    const warnings: string[] = []

    try {
      if (!team) {
        return {
          isValid: false,
          errors: ['Team object is null or undefined'],
          warnings: [],
          validatedCount: 0
        }
      }

      // Validate required fields
      if (!team.name) {
        errors.push('Team missing required field: name')
      }
      if (!team.sport) {
        errors.push('Team missing required field: sport')
      }

      // Validate optional fields
      if (team.foundedYear && (typeof team.foundedYear !== 'number' || team.foundedYear < 1800 || team.foundedYear > new Date().getFullYear())) {
        warnings.push(`Team ${team.name} has invalid founded year: ${team.foundedYear}`)
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
        validatedCount: 1
      }

    } catch (error) {
      return {
        isValid: false,
        errors: [`Validation error: ${error instanceof Error ? error.message : String(error)}`],
        warnings: [],
        validatedCount: 0
      }
    }
  }

  validatePlayerData(player: any): ValidationResult {
    const errors: string[] = []
    const warnings: string[] = []

    try {
      if (!player) {
        return {
          isValid: false,
          errors: ['Player object is null or undefined'],
          warnings: [],
          validatedCount: 0
        }
      }

      // Validate required fields
      if (!player.name) {
        errors.push('Player missing required field: name')
      }
      if (!player.sport) {
        errors.push('Player missing required field: sport')
      }

      // Validate optional fields
      if (player.age && (typeof player.age !== 'number' || player.age < 16 || player.age > 50)) {
        warnings.push(`Player ${player.name} has invalid age: ${player.age}`)
      }

      if (player.jerseyNumber && (typeof player.jerseyNumber !== 'number' || player.jerseyNumber < 0 || player.jerseyNumber > 99)) {
        warnings.push(`Player ${player.name} has invalid jersey number: ${player.jerseyNumber}`)
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
        validatedCount: 1
      }

    } catch (error) {
      return {
        isValid: false,
        errors: [`Validation error: ${error instanceof Error ? error.message : String(error)}`],
        warnings: [],
        validatedCount: 0
      }
    }
  }
}

export const dataValidationService = DataValidationService.getInstance()
