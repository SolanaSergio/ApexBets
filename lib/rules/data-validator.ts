/**
 * Data Validation Rules Enforcement
 * Validates all data before use, rejects invalid data
 */

export class DataValidator {
  private static instance: DataValidator

  static getInstance(): DataValidator {
    if (!DataValidator.instance) {
      DataValidator.instance = new DataValidator()
    }
    return DataValidator.instance
  }

  /**
   * Validate sports data structure
   * Throws error if data is invalid
   */
  validateSportsData(data: any): void {
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid sports data: must be an object')
    }

    if (Array.isArray(data)) {
      if (data.length === 0) {
        throw new Error('Invalid sports data: empty array')
      }

      for (const item of data) {
        this.validateSportsItem(item)
      }
    } else {
      this.validateSportsItem(data)
    }
  }

  private validateSportsItem(item: any): void {
    if (!item || typeof item !== 'object') {
      throw new Error('Invalid sports item: must be an object')
    }

    // Required fields for sports data
    const requiredFields = ['id', 'name']
    for (const field of requiredFields) {
      if (!item[field]) {
        throw new Error(`Invalid sports item: missing required field '${field}'`)
      }
    }

    // Validate data types
    if (typeof item.id !== 'string' && typeof item.id !== 'number') {
      throw new Error('Invalid sports item: id must be string or number')
    }

    if (typeof item.name !== 'string') {
      throw new Error('Invalid sports item: name must be string')
    }
  }

  /**
   * Validate game data structure
   */
  validateGameData(data: any): void {
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid game data: must be an object')
    }

    const requiredFields = ['id', 'home_team', 'away_team', 'date']
    for (const field of requiredFields) {
      if (!data[field]) {
        throw new Error(`Invalid game data: missing required field '${field}'`)
      }
    }

    // Validate date format
    if (data.date && !this.isValidDate(data.date)) {
      throw new Error('Invalid game data: date must be valid ISO string')
    }
  }

  /**
   * Validate player data structure
   */
  validatePlayerData(data: any): void {
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid player data: must be an object')
    }

    const requiredFields = ['id', 'name', 'team']
    for (const field of requiredFields) {
      if (!data[field]) {
        throw new Error(`Invalid player data: missing required field '${field}'`)
      }
    }
  }

  /**
   * Validate team data structure
   */
  validateTeamData(data: any): void {
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid team data: must be an object')
    }

    const requiredFields = ['id', 'name', 'sport']
    for (const field of requiredFields) {
      if (!data[field]) {
        throw new Error(`Invalid team data: missing required field '${field}'`)
      }
    }
  }

  /**
   * Validate odds data structure
   */
  validateOddsData(data: any): void {
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid odds data: must be an object')
    }

    const requiredFields = ['game_id', 'bookmaker', 'odds']
    for (const field of requiredFields) {
      if (!data[field]) {
        throw new Error(`Invalid odds data: missing required field '${field}'`)
      }
    }

    // Validate odds format
    if (data.odds && typeof data.odds !== 'object') {
      throw new Error('Invalid odds data: odds must be an object')
    }
  }

  /**
   * Validate prediction data structure
   */
  validatePredictionData(data: any): void {
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid prediction data: must be an object')
    }

    const requiredFields = ['game_id', 'prediction', 'confidence']
    for (const field of requiredFields) {
      if (!data[field]) {
        throw new Error(`Invalid prediction data: missing required field '${field}'`)
      }
    }

    // Validate confidence score
    if (data.confidence && (data.confidence < 0 || data.confidence > 1)) {
      throw new Error('Invalid prediction data: confidence must be between 0 and 1')
    }
  }

  /**
   * Validate API response structure
   */
  validateApiResponse(data: any): void {
    if (!data) {
      throw new Error('Invalid API response: data is null or undefined')
    }

    if (typeof data !== 'object') {
      throw new Error('Invalid API response: data must be an object')
    }

    // Check for error indicators
    if (data.error) {
      throw new Error(`API error: ${data.error}`)
    }

    if (data.status && data.status !== 'success' && data.status !== 200) {
      throw new Error(`API error: status ${data.status}`)
    }
  }

  /**
   * Sanitize string input
   */
  sanitizeString(input: any): string {
    if (typeof input !== 'string') {
      throw new Error('Invalid input: must be a string')
    }

    // Remove potentially dangerous characters
    return input
      .replace(/[<>]/g, '') // Remove HTML tags
      .replace(/['"]/g, '') // Remove quotes
      .trim()
  }

  /**
   * Validate date string
   */
  private isValidDate(dateString: string): boolean {
    const date = new Date(dateString)
    return date instanceof Date && !isNaN(date.getTime())
  }

  /**
   * Validate numeric input
   */
  validateNumber(input: any, min?: number, max?: number): number {
    const num = Number(input)

    if (isNaN(num)) {
      throw new Error('Invalid input: must be a number')
    }

    if (min !== undefined && num < min) {
      throw new Error(`Invalid input: must be at least ${min}`)
    }

    if (max !== undefined && num > max) {
      throw new Error(`Invalid input: must be at most ${max}`)
    }

    return num
  }

  /**
   * Validate boolean input
   */
  validateBoolean(input: any): boolean {
    if (typeof input === 'boolean') {
      return input
    }

    if (typeof input === 'string') {
      const lower = input.toLowerCase()
      if (lower === 'true' || lower === '1') return true
      if (lower === 'false' || lower === '0') return false
    }

    throw new Error('Invalid input: must be a boolean value')
  }
}

export const dataValidator = DataValidator.getInstance()
