/**
 * Game Status Validator
 * Validates if games should be considered live based on time and real-time data
 * Prevents stale "live" games from being displayed
 * Sport-agnostic service for all sports - READ ONLY validation
 */

import { sportConfigService } from './sport-config-service'

export interface GameStatusValidation {
  isActuallyLive: boolean
  reason: string
  shouldShowAsLive: boolean
}

export class GameStatusValidator {

  /**
   * Validates if a game should be considered actually live for display purposes
   */
  async validateGameStatus(game: {
    game_date: string | Date
    status: string | number | null | undefined
    sport: string
    home_score?: number | null
    away_score?: number | null
  }): Promise<GameStatusValidation> {
    const gameDate = new Date(game.game_date)
    const now = new Date()
    const timeDiffHours = (now.getTime() - gameDate.getTime()) / (1000 * 60 * 60)

    // Ensure status is a string
    const statusStr = typeof game.status === 'string' ? game.status : String(game.status || '')

    // Get sport configuration for proper status handling
    const sportConfig = await sportConfigService.getSportConfig(game.sport)
    
    // If game is already completed/finished, it's not live
    if (sportConfig && await sportConfigService.isCompletedStatus(game.sport, statusStr)) {
      return {
        isActuallyLive: false,
        reason: 'Game already completed',
        shouldShowAsLive: false
      }
    }

    // If game is scheduled and hasn't started yet, it's not live
    if (sportConfig && await sportConfigService.isScheduledStatus(game.sport, statusStr) && timeDiffHours < 0) {
      return {
        isActuallyLive: false,
        reason: 'Game not yet started',
        shouldShowAsLive: false
      }
    }

    // If game is marked as live/in_progress, check if it's actually still live
    if (sportConfig && await sportConfigService.isLiveStatus(game.sport, statusStr)) {
      const maxDuration = await sportConfigService.getMaxGameDuration(game.sport)
      
      // If game is too old, it's not actually live anymore
      if (timeDiffHours > maxDuration) {
        return {
          isActuallyLive: false,
          reason: `Game ended ${Math.round(timeDiffHours)} hours ago (max duration: ${maxDuration}h)`,
          shouldShowAsLive: false
        }
      }

      // If game has scores and is old enough, likely completed
      if (game.home_score !== null && game.away_score !== null && timeDiffHours > 2) {
        return {
          isActuallyLive: false,
          reason: 'Game has final scores and is older than 2 hours',
          shouldShowAsLive: false
        }
      }

      // Game appears to be actually live
      return {
        isActuallyLive: true,
        reason: 'Game is currently live',
        shouldShowAsLive: true
      }
    }

    // Default: not live
    return {
      isActuallyLive: false,
      reason: 'Game status does not indicate live play',
      shouldShowAsLive: false
    }
  }


  /**
   * Batch validate multiple games
   */
  async validateGames(games: Array<{
    id: string
    game_date: string | Date
    status: string | number | null | undefined
    sport: string
    home_score?: number | null
    away_score?: number | null
  }>): Promise<Array<{
    id: string
    validation: GameStatusValidation
  }>> {
    const validations = await Promise.all(
      games.map(async game => ({
        id: game.id,
        validation: await this.validateGameStatus(game)
      }))
    )
    return validations
  }

  /**
   * Filter games to only show actually live ones
   */
  async filterLiveGames(games: Array<{
    id: string
    game_date: string | Date
    status: string | number | null | undefined
    sport: string
    home_score?: number | null
    away_score?: number | null
  }>): Promise<Array<{
    id: string
    game_date: string | Date
    status: string | number | null | undefined
    sport: string
    home_score?: number | null
    away_score?: number | null
  }>> {
    const validations = await this.validateGames(games)
    
    return games.filter(game => {
      const validation = validations.find(v => v.id === game.id)
      return validation?.validation.shouldShowAsLive === true
    })
  }
}

export const gameStatusValidator = new GameStatusValidator()
