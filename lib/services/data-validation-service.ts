/**
 * DATA VALIDATION SERVICE
 * Ensures data quality and consistency
 */

export interface ValidationResult {
  isValid: boolean
  errors: string[]
  data: any
}

export class DataValidationService {
  validateGame(data: any): ValidationResult {
    const errors: string[] = []
    let isValid = true

    if (!data.id) {
      errors.push('Game ID is required')
      isValid = false
    }

    if (!data.home_team_id) {
      errors.push('Home team ID is required')
      isValid = false
    }

    if (!data.away_team_id) {
      errors.push('Away team ID is required')
      isValid = false
    }

    if (!data.game_date) {
      errors.push('Game date is required')
      isValid = false
    }

    const validStatuses = ['scheduled', 'in_progress', 'completed', 'postponed', 'cancelled']
    if (data.status && !validStatuses.includes(data.status)) {
      errors.push('Invalid game status')
      isValid = false
    }

    if (data.home_score !== null && data.home_score !== undefined) {
      if (data.home_score < 0 || data.home_score > 200) {
        errors.push('Home score must be between 0 and 200')
        isValid = false
      }
    }

    if (data.away_score !== null && data.away_score !== undefined) {
      if (data.away_score < 0 || data.away_score > 200) {
        errors.push('Away score must be between 0 and 200')
        isValid = false
      }
    }

    return {
      isValid,
      errors,
      data: isValid ? data : null
    }
  }

  validateTeam(data: any): ValidationResult {
    const errors: string[] = []
    let isValid = true

    if (!data.id) {
      errors.push('Team ID is required')
      isValid = false
    }

    if (!data.name) {
      errors.push('Team name is required')
      isValid = false
    }

    const validSports = ['basketball', 'football', 'baseball', 'hockey', 'soccer']
    if (data.sport && !validSports.includes(data.sport)) {
      errors.push('Invalid sport type')
      isValid = false
    }

    return {
      isValid,
      errors,
      data: isValid ? data : null
    }
  }

  sanitizeData(data: any): any {
    const sanitized = { ...data }

    // Remove null/undefined values
    Object.keys(sanitized).forEach(key => {
      if (sanitized[key] === null || sanitized[key] === undefined) {
        delete sanitized[key]
      }
    })

    // Sanitize strings
    Object.keys(sanitized).forEach(key => {
      if (typeof sanitized[key] === 'string') {
        sanitized[key] = sanitized[key].trim()
      }
    })

    // Add timestamps
    sanitized.updated_at = new Date().toISOString()
    if (!sanitized.created_at) {
      sanitized.created_at = new Date().toISOString()
    }

    return sanitized
  }
}

export const dataValidationService = new DataValidationService()