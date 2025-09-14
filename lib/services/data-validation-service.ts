/**
 * DATA VALIDATION SERVICE
 * Ensures all game data is accurate and prevents false live games
 * Validates game statuses, scores, and timing before displaying
 */

import { createClient } from '@/lib/supabase/server'

export interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
  correctedData?: any
}

export interface GameValidationRules {
  maxHoursBeforeLive: number // Hours before game start to consider as live
  maxHoursAfterStart: number // Hours after game start to consider as live
  minScoreForLive: number // Minimum score required to show as live
  requireRealScores: boolean // Must have actual scores to show as live
  requireTimeValidation: boolean // Must validate game timing
}

export class DataValidationService {
  private rules: GameValidationRules

  constructor(rules: Partial<GameValidationRules> = {}) {
    this.rules = {
      maxHoursBeforeLive: 0.5, // 30 minutes before start
      maxHoursAfterStart: 4, // 4 hours after start
      minScoreForLive: 0, // Any score is valid
      requireRealScores: true, // Must have real scores
      requireTimeValidation: true,
      ...rules
    }
  }

  /**
   * Validate a single game for accuracy
   */
  validateGame(game: any): ValidationResult {
    const errors: string[] = []
    const warnings: string[] = []
    let isValid = true

    // Check if game has required fields
    if (!game.id) {
      errors.push('Game missing ID')
      isValid = false
    }

    if (!game.game_date) {
      errors.push('Game missing date')
      isValid = false
    }

    if (!game.status) {
      errors.push('Game missing status')
      isValid = false
    }

    // Validate game timing
    if (this.rules.requireTimeValidation && game.game_date) {
      const gameTime = new Date(game.game_date)
      const now = new Date()
      const hoursDiff = (now.getTime() - gameTime.getTime()) / (1000 * 60 * 60)

      // Check if game is too far in the future to be live
      if (hoursDiff < -this.rules.maxHoursBeforeLive) {
        if (game.status === 'live' || game.status === 'in_progress') {
          errors.push(`Game marked as live but starts in ${Math.abs(hoursDiff).toFixed(1)} hours`)
          isValid = false
        }
      }

      // Check if game is too old to be live
      if (hoursDiff > this.rules.maxHoursAfterStart) {
        if (game.status === 'live' || game.status === 'in_progress') {
          errors.push(`Game marked as live but started ${hoursDiff.toFixed(1)} hours ago`)
          isValid = false
        }
      }
    }

    // Validate scores for live games
    if (game.status === 'live' || game.status === 'in_progress') {
      if (this.rules.requireRealScores) {
        const hasHomeScore = game.home_score !== null && game.home_score !== undefined
        const hasAwayScore = game.away_score !== null && game.away_score !== undefined

        if (!hasHomeScore || !hasAwayScore) {
          errors.push('Live game missing scores')
          isValid = false
        }

        // Check if scores are realistic
        if (hasHomeScore && hasAwayScore) {
          if (game.home_score < 0 || game.away_score < 0) {
            errors.push('Game has negative scores')
            isValid = false
          }

          // Sport-specific score validation
          if (game.sport === 'basketball') {
            if (game.home_score > 200 || game.away_score > 200) {
              warnings.push('Unusually high basketball scores')
            }
          } else if (game.sport === 'football') {
            if (game.home_score > 100 || game.away_score > 100) {
              warnings.push('Unusually high football scores')
            }
          }
        }
      }
    }

    // Validate status consistency
    if (game.status === 'completed' || game.status === 'finished') {
      if (game.home_score === null || game.away_score === null) {
        warnings.push('Completed game missing final scores')
      }
    }

    // Create corrected data if needed
    let correctedData = null
    if (!isValid && errors.length > 0) {
      correctedData = {
        ...game,
        status: this.correctGameStatus(game),
        home_score: this.correctScore(game.home_score),
        away_score: this.correctScore(game.away_score)
      }
    }

    return {
      isValid,
      errors,
      warnings,
      correctedData
    }
  }

  /**
   * Validate multiple games
   */
  validateGames(games: any[]): { valid: any[], invalid: any[], corrected: any[] } {
    const valid: any[] = []
    const invalid: any[] = []
    const corrected: any[] = []

    for (const game of games) {
      const validation = this.validateGame(game)
      
      if (validation.isValid) {
        valid.push(game)
      } else if (validation.correctedData) {
        corrected.push(validation.correctedData)
      } else {
        invalid.push(game)
      }
    }

    return { valid, invalid, corrected }
  }

  /**
   * Validate live games specifically
   */
  validateLiveGames(games: any[]): any[] {
    return games.filter(game => {
      const validation = this.validateGame(game)
      
      // Only include games that are truly live and valid
      const isLive = game.status === 'live' || game.status === 'in_progress'
      const hasValidScores = game.home_score > 0 || game.away_score > 0
      const isRecent = this.isGameRecent(game)
      
      return isLive && validation.isValid && (hasValidScores || !this.rules.requireRealScores) && isRecent
    })
  }

  /**
   * Check if game is recent enough to be considered live
   */
  private isGameRecent(game: any): boolean {
    if (!game.game_date) return false
    
    const gameTime = new Date(game.game_date)
    const now = new Date()
    const hoursDiff = (now.getTime() - gameTime.getTime()) / (1000 * 60 * 60)
    
    return hoursDiff >= -this.rules.maxHoursBeforeLive && hoursDiff <= this.rules.maxHoursAfterStart
  }

  /**
   * Correct game status based on timing and scores
   */
  private correctGameStatus(game: any): string {
    if (!game.game_date) return 'scheduled'
    
    const gameTime = new Date(game.game_date)
    const now = new Date()
    const hoursDiff = (now.getTime() - gameTime.getTime()) / (1000 * 60 * 60)
    
    // Game hasn't started yet
    if (hoursDiff < -this.rules.maxHoursBeforeLive) {
      return 'scheduled'
    }
    
    // Game is in progress
    if (hoursDiff >= -this.rules.maxHoursBeforeLive && hoursDiff <= this.rules.maxHoursAfterStart) {
      return 'in_progress'
    }
    
    // Game is too old
    return 'completed'
  }

  /**
   * Correct score values
   */
  private correctScore(score: any): number {
    if (score === null || score === undefined) return 0
    if (typeof score !== 'number') return 0
    if (score < 0) return 0
    return score
  }

  /**
   * Get validation statistics
   */
  async getValidationStats(): Promise<{
    totalGames: number
    validGames: number
    invalidGames: number
    correctedGames: number
    liveGames: number
    lastValidation: Date
  }> {
    const supabase = await createClient()
    if (!supabase) {
      throw new Error('Supabase client not available')
    }

    const { data: allGames } = await supabase
      .from('games')
      .select('id, status, game_date, home_score, away_score')
      .gte('updated_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())

    if (!allGames) {
      return {
        totalGames: 0,
        validGames: 0,
        invalidGames: 0,
        correctedGames: 0,
        liveGames: 0,
        lastValidation: new Date()
      }
    }

    const validation = this.validateGames(allGames)
    const liveGames = this.validateLiveGames(allGames)

    return {
      totalGames: allGames.length,
      validGames: validation.valid.length,
      invalidGames: validation.invalid.length,
      correctedGames: validation.corrected.length,
      liveGames: liveGames.length,
      lastValidation: new Date()
    }
  }

  /**
   * Update validation rules
   */
  updateRules(newRules: Partial<GameValidationRules>): void {
    this.rules = { ...this.rules, ...newRules }
  }

  /**
   * Get current validation rules
   */
  getRules(): GameValidationRules {
    return { ...this.rules }
  }
}

// Export singleton instance
export const dataValidationService = new DataValidationService()