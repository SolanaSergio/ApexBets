/**
 * SPORT PREDICTION SERVICE
 * Dynamic prediction service that works with any sport
 */

import { SportConfigManager } from '../core/sport-config'

export interface PredictionResult {
  gameId?: string
  model: string
  confidence: number
  homeWinProbability: number
  awayWinProbability: number
  predictedSpread: number
  predictedTotal: number
  factors: string[]
}

export class SportPredictionService {
  private sport: string
  private league: string
  private modelVersion: string

  constructor(sport: string, league?: string) {
    this.sport = sport
    this.league = league || ''
    this.modelVersion = '1.0.0'
  }

  async getPredictions(
    params: { gameId?: string; date?: string; limit?: number } = {}
  ): Promise<PredictionResult[]> {
    try {
      // Handle "all" sport - this should not be called for "all"
      if (this.sport === 'all') {
        throw new Error('Cannot get predictions for "all" sport. Use individual sport services.')
      }

      // Get sport configuration
      const sportConfig = await SportConfigManager.getSportConfigAsync(this.sport)
      if (!sportConfig) {
        throw new Error(`Sport configuration not found for ${this.sport}`)
      }

      // Get game data from database
      if (!params.gameId) {
        // If no specific game, get recent games
        return await this.getRecentPredictions(params.limit || 10)
      }

      const gameData = await this.getGameData(params.gameId)
      if (!gameData) {
        throw new Error(`Game not found: ${params.gameId}`)
      }

      // Generate predictions based on sport-specific logic
      const predictions = await this.generatePredictions(gameData)

      return predictions
    } catch (error) {
      console.error(`Error getting predictions for ${this.sport}:`, error)
      return []
    }
  }

  private async getGameData(gameId: string): Promise<any> {
    try {
      // Fetch real game data from database using database service
      const { createClient } = await import('@/lib/supabase/server')
      const supabase = await createClient()

      if (!supabase) {
        throw new Error('Database connection failed')
      }

      const { data: game, error } = await supabase
        .from('games')
        .select(
          `
          *,
          home_team:teams!games_home_team_id_fkey(name, abbreviation),
          away_team:teams!games_away_team_id_fkey(name, abbreviation)
        `
        )
        .eq('id', gameId)
        .eq('sport', this.sport)
        .single()

      if (error || !game) {
        throw new Error(`Game not found: ${gameId}`)
      }

      return {
        id: game.id,
        sport: game.sport,
        homeTeam: game.home_team?.name ?? null,
        awayTeam: game.away_team?.name ?? null,
        homeTeamId: game.home_team_id,
        awayTeamId: game.away_team_id,
        date: game.game_date,
        status: game.status,
        homeScore: game.home_score,
        awayScore: game.away_score,
      }
    } catch (error) {
      console.error('Error fetching game data:', error)
      return null
    }
  }

  private async generatePredictions(gameData: any): Promise<PredictionResult[]> {
    const predictions: PredictionResult[] = []

    try {
      // Get team performance data
      const homeTeamStats = await this.getTeamStats(gameData.homeTeam)
      const awayTeamStats = await this.getTeamStats(gameData.awayTeam)

      // Generate ML-based prediction
      const mlPrediction = await this.generateMLPrediction(homeTeamStats, awayTeamStats, gameData)
      predictions.push(mlPrediction)

      // Generate statistical prediction
      const statPrediction = await this.generateStatisticalPrediction(
        homeTeamStats,
        awayTeamStats,
        gameData
      )
      predictions.push(statPrediction)
    } catch (error) {
      console.error('Error generating predictions:', error)
    }

    return predictions
  }

  private async getTeamStats(teamName: string): Promise<any> {
    try {
      // Fetch real team stats from database using database service
      const { createClient } = await import('@/lib/supabase/server')
      const supabase = await createClient()

      if (!supabase) {
        throw new Error('Database connection failed')
      }

      // Get team standings for current season
      const { data: standings, error } = await supabase
        .from('league_standings')
        .select(
          `
          *,
          team:teams!league_standings_team_id_fkey(name, abbreviation)
        `
        )
        .eq('sport', this.sport)
        .eq('league_name', this.league)
        .ilike('team.name', `%${teamName}%`)
        .single()

      if (error || !standings) {
        // Fallback: return basic structure with zeros
        return {
          wins: 0,
          losses: 0,
          ties: 0,
          pointsFor: 0,
          pointsAgainst: 0,
          homeRecord: { wins: 0, losses: 0, ties: 0 },
          awayRecord: { wins: 0, losses: 0, ties: 0 },
          recentForm: [],
        }
      }

      return {
        wins: standings.wins || 0,
        losses: standings.losses || 0,
        ties: standings.ties || 0,
        pointsFor: standings.points_for || 0,
        pointsAgainst: standings.points_against || 0,
        homeRecord: {
          wins: standings.home_wins || 0,
          losses: standings.home_losses || 0,
          ties: standings.home_ties || 0,
        },
        awayRecord: {
          wins: standings.away_wins || 0,
          losses: standings.away_losses || 0,
          ties: standings.away_ties || 0,
        },
        recentForm: this.calculateRecentForm(standings.streak || ''),
      }
    } catch (error) {
      console.error('Error fetching team stats:', error)
      return null
    }
  }

  private calculateRecentForm(streak: string): string[] {
    // Convert streak string to recent form array
    if (!streak) return []

    const form: string[] = []
    const currentStreak = streak.charAt(0)
    const count = parseInt(streak.slice(1)) || 1

    for (let i = 0; i < Math.min(count, 5); i++) {
      form.push(currentStreak)
    }

    return form
  }

  private async generateMLPrediction(
    homeStats: any,
    awayStats: any,
    gameData: any
  ): Promise<PredictionResult> {
    try {
      // Import advanced ML algorithms
      const { EnsembleModel } = await import('@/lib/ml/prediction-algorithms')

      // Import types for TypeScript (these are interfaces, not runtime values)
      type TeamStats = import('@/lib/ml/prediction-algorithms').TeamStats
      type GameContext = import('@/lib/ml/prediction-algorithms').GameContext

      // Convert stats to TeamStats format
      const homeTeamStats: TeamStats = {
        wins: homeStats.wins || 0,
        losses: homeStats.losses || 0,
        ties: homeStats.ties || 0,
        pointsFor: homeStats.pointsFor || 0,
        pointsAgainst: homeStats.pointsAgainst || 0,
        homeRecord: homeStats.homeRecord || { wins: 0, losses: 0, ties: 0 },
        awayRecord: homeStats.awayRecord || { wins: 0, losses: 0, ties: 0 },
        recentForm: homeStats.recentForm || [],
        strengthOfSchedule: homeStats.strengthOfSchedule || 0.5,
        avgMarginOfVictory: homeStats.avgMarginOfVictory || 0,
        consistency: homeStats.consistency || 0.5,
      }

      const awayTeamStats: TeamStats = {
        wins: awayStats.wins || 0,
        losses: awayStats.losses || 0,
        ties: awayStats.ties || 0,
        pointsFor: awayStats.pointsFor || 0,
        pointsAgainst: awayStats.pointsAgainst || 0,
        homeRecord: awayStats.homeRecord || { wins: 0, losses: 0, ties: 0 },
        awayRecord: awayStats.awayRecord || { wins: 0, losses: 0, ties: 0 },
        recentForm: awayStats.recentForm || [],
        strengthOfSchedule: awayStats.strengthOfSchedule || 0.5,
        avgMarginOfVictory: awayStats.avgMarginOfVictory || 0,
        consistency: awayStats.consistency || 0.5,
      }

      // Create game context
      const gameContext: GameContext = {
        isPlayoffs: gameData.gameType === 'playoffs' || gameData.season?.includes('playoffs'),
        isRivalry: false, // Could be enhanced with rivalry detection
        restDays: 2, // Default rest days, could be calculated from schedule
        travelDistance: 0, // Could be calculated from team locations
        venue: gameData.venue ?? null,
        sport: this.sport,
      }

      // Get ensemble ML prediction
      const mlPrediction = EnsembleModel.predict(homeTeamStats, awayTeamStats, gameContext)

      // Convert to PredictionResult format
      return {
        gameId: gameData.id,
        model: mlPrediction.model,
        confidence: mlPrediction.confidence,
        homeWinProbability: mlPrediction.homeWinProbability,
        awayWinProbability: mlPrediction.awayWinProbability,
        predictedSpread: mlPrediction.predictedSpread,
        predictedTotal: mlPrediction.predictedTotal,
        factors: mlPrediction.factors,
      }
    } catch (error) {
      console.error('Error in advanced ML prediction, falling back to basic model:', error)

      // Fallback to basic prediction if ML algorithms fail
      const homeWinRate =
        homeStats.wins / Math.max(homeStats.wins + homeStats.losses + homeStats.ties, 1)
      const homeAdvantage = 0.04
      const homeWinProbability = Math.min(0.9, Math.max(0.1, homeWinRate + homeAdvantage))

      return {
        gameId: gameData.id,
        model: `fallback_model_${this.sport}_v${this.modelVersion}`,
        confidence: 0.6,
        homeWinProbability,
        awayWinProbability: 1 - homeWinProbability,
        predictedSpread: 0,
        predictedTotal: 200,
        factors: ['Basic statistical analysis (ML algorithms unavailable)'],
      }
    }
  }

  private async generateStatisticalPrediction(
    homeStats: any,
    awayStats: any,
    gameData: any
  ): Promise<PredictionResult> {
    // Statistical analysis based on team records
    const homeTotalGames = homeStats.wins + homeStats.losses + homeStats.ties
    const awayTotalGames = awayStats.wins + awayStats.losses + awayStats.ties

    const homeWinRate = homeTotalGames > 0 ? homeStats.wins / homeTotalGames : 0.5
    const awayWinRate = awayTotalGames > 0 ? awayStats.wins / awayTotalGames : 0.5

    // Calculate probabilities using Elo-style rating system
    const homeRating = homeWinRate * 2000 + 1000
    const awayRating = awayWinRate * 2000 + 1000
    const expectedHomeWin = 1 / (1 + Math.pow(10, (awayRating - homeRating) / 400))

    const homeWinProbability = Math.min(0.9, Math.max(0.1, expectedHomeWin))
    const awayWinProbability = 1 - homeWinProbability

    // Calculate confidence based on sample size
    const minGames = Math.min(homeTotalGames, awayTotalGames)
    const confidence = Math.min(0.9, Math.max(0.3, minGames / 15))

    // Calculate predicted spread based on point differentials
    const homeAvgPoints = homeTotalGames > 0 ? homeStats.pointsFor / homeTotalGames : 0
    const awayAvgPoints = awayTotalGames > 0 ? awayStats.pointsFor / awayTotalGames : 0
    const homeAvgAllowed = homeTotalGames > 0 ? homeStats.pointsAgainst / homeTotalGames : 0
    const awayAvgAllowed = awayTotalGames > 0 ? awayStats.pointsAgainst / awayTotalGames : 0

    const homeNetRating = homeAvgPoints - homeAvgAllowed
    const awayNetRating = awayAvgPoints - awayAvgAllowed
    const predictedSpread = homeNetRating - awayNetRating
    const predictedTotal = homeAvgPoints + awayAvgPoints

    return {
      gameId: gameData.id,
      model: `statistical_model_${this.sport}_v${this.modelVersion}`,
      confidence: Math.round(confidence * 100) / 100,
      homeWinProbability: Math.round(homeWinProbability * 100) / 100,
      awayWinProbability: Math.round(awayWinProbability * 100) / 100,
      predictedSpread: Math.round(predictedSpread * 10) / 10,
      predictedTotal: Math.round(predictedTotal),
      factors: [
        'Win percentage analysis',
        'Points per game',
        'Defensive efficiency',
        'Net rating comparison',
        'Sample size validation',
      ],
    }
  }

  /**
   * Get recent predictions for multiple games
   */
  private async getRecentPredictions(limit: number): Promise<PredictionResult[]> {
    try {
      // Fetch actual predictions from database instead of generating them
      const { createClient } = await import('@/lib/supabase/server')
      const supabase = await createClient()

      if (!supabase) {
        throw new Error('Database connection failed')
      }

      // Get predictions with game and team data
      const { data: predictions, error } = await supabase
        .from('predictions')
        .select(
          `
          *,
          game:games!predictions_game_id_fkey(
            id,
            game_date,
            status,
            sport,
            league,
            home_score,
            away_score,
            home_team:teams!games_home_team_id_fkey(name, abbreviation),
            away_team:teams!games_away_team_id_fkey(name, abbreviation)
          )
        `
        )
        .eq('sport', this.sport)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error || !predictions || predictions.length === 0) {
        return []
      }

      // Transform database predictions to PredictionResult format
      return predictions
        .map(pred => ({
          gameId: pred.game_id,
          model: pred.model_name || 'ApexML',
          confidence: pred.confidence || 0.5,
          homeWinProbability:
            pred.prediction_type === 'winner' && pred.predicted_value === 1 ? pred.confidence : 0.5,
          awayWinProbability:
            pred.prediction_type === 'winner' && pred.predicted_value === 0 ? pred.confidence : 0.5,
          predictedSpread: pred.prediction_type === 'spread' ? pred.predicted_value : 0,
          predictedTotal: pred.prediction_type === 'total_points' ? pred.predicted_value : 0,
          factors: pred.reasoning ? [pred.reasoning] : ['Historical analysis'],
          homeTeam: pred.game?.home_team?.name ?? null,
          awayTeam: pred.game?.away_team?.name ?? null,
          gameDate: pred.game?.game_date,
          status: pred.game?.status,
          actualValue: pred.actual_value,
          isCorrect: pred.is_correct,
          predictionType: pred.prediction_type,
        }))
        .slice(0, limit)
    } catch (error) {
      console.error(`Error getting recent predictions for ${this.sport}:`, error)
      return []
    }
  }

  /**
   * Get value betting opportunities
   */
  async getValueBettingOpportunities(
    params: { minValue?: number; limit?: number } = {}
  ): Promise<any[]> {
    try {
      // Fetch actual value betting opportunities from database
      const { createClient } = await import('@/lib/supabase/server')
      const supabase = await createClient()

      if (!supabase) {
        throw new Error('Database connection failed')
      }

      const { data: opportunities, error } = await supabase
        .from('value_betting_opportunities')
        .select(
          `
          *,
          game:games!value_betting_opportunities_game_id_fkey(
            id,
            game_date,
            status,
            home_team:teams!games_home_team_id_fkey(name, abbreviation),
            away_team:teams!games_away_team_id_fkey(name, abbreviation)
          )
        `
        )
        .eq('sport', this.sport)
        .gte('value', params.minValue || 0.05)
        .gte('expires_at', new Date().toISOString())
        .order('value', { ascending: false })
        .limit(params.limit || 10)

      if (error || !opportunities) {
        return []
      }

      // Transform to expected format
      return opportunities.map(opp => ({
        gameId: opp.game_id,
        homeTeam: opp.game?.home_team?.name ?? null,
        awayTeam: opp.game?.away_team?.name ?? null,
        market: opp.bet_type,
        selection: opp.side,
        odds: opp.odds,
        value: opp.value,
        recommendation: opp.recommendation,
        confidence: opp.confidence_score,
        predictedProbability: opp.predicted_probability,
        expectedValue: opp.expected_value,
        kellyPercentage: opp.kelly_percentage,
      }))
    } catch (error) {
      console.error(`Error getting value betting opportunities for ${this.sport}:`, error)
      return []
    }
  }

  /**
   * Get model performance metrics
   */
  async getModelPerformance(): Promise<any> {
    try {
      // Fetch real model performance data from database using database service
      const { createClient } = await import('@/lib/supabase/server')
      const supabase = await createClient()

      if (!supabase) {
        throw new Error('Database connection failed')
      }

      const { data: predictions, error } = await supabase
        .from('predictions')
        .select('*')
        .eq('sport', this.sport)
        .eq('league_name', this.league)
        .not('actual_value', 'is', null) // Only completed predictions

      if (error || !predictions || predictions.length === 0) {
        // Return default performance if no data available
        return {
          sport: this.sport,
          league: this.league,
          modelVersion: this.modelVersion,
          accuracy: 0,
          precision: 0,
          recall: 0,
          f1Score: 0,
          totalPredictions: 0,
          correctPredictions: 0,
          lastUpdated: new Date().toISOString(),
        }
      }

      // Calculate real performance metrics
      const totalPredictions = predictions.length
      const correctPredictions = predictions.filter(p => p.is_correct === true).length
      const accuracy = totalPredictions > 0 ? correctPredictions / totalPredictions : 0

      // Calculate precision and recall for win predictions
      const winPredictions = predictions.filter(p => p.predicted_value > 0.5)
      const trueWins = winPredictions.filter(p => p.actual_value > 0.5)
      const precision = winPredictions.length > 0 ? trueWins.length / winPredictions.length : 0

      const actualWins = predictions.filter(p => p.actual_value > 0.5)
      const recall = actualWins.length > 0 ? trueWins.length / actualWins.length : 0
      const f1Score = precision + recall > 0 ? (2 * (precision * recall)) / (precision + recall) : 0

      return {
        sport: this.sport,
        league: this.league,
        modelVersion: this.modelVersion,
        accuracy: Math.round(accuracy * 100) / 100,
        precision: Math.round(precision * 100) / 100,
        recall: Math.round(recall * 100) / 100,
        f1Score: Math.round(f1Score * 100) / 100,
        totalPredictions,
        correctPredictions,
        lastUpdated: new Date().toISOString(),
      }
    } catch (error) {
      console.error(`Error getting model performance for ${this.sport}:`, error)
      return null
    }
  }

  /**
   * Get prediction accuracy for a specific period
   */
  async getPredictionAccuracy(
    params: {
      startDate?: string
      endDate?: string
      model?: string
    } = {}
  ): Promise<any> {
    try {
      // Fetch real prediction accuracy data from database using database service
      const { createClient } = await import('@/lib/supabase/server')
      const supabase = await createClient()

      if (!supabase) {
        throw new Error('Database connection failed')
      }

      const startDate =
        params.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
      const endDate = params.endDate || new Date().toISOString()
      const model = params.model || this.modelVersion

      let query = supabase
        .from('predictions')
        .select('*')
        .eq('sport', this.sport)
        .eq('league_name', this.league)
        .not('actual_value', 'is', null)
        .gte('created_at', startDate)
        .lte('created_at', endDate)

      if (model !== this.modelVersion) {
        query = query.eq('model_name', model)
      }

      const { data: predictions, error } = await query

      if (error || !predictions || predictions.length === 0) {
        return {
          sport: this.sport,
          league: this.league,
          period: { start: startDate, end: endDate },
          model,
          accuracy: 0,
          totalPredictions: 0,
          correctPredictions: 0,
          lastUpdated: new Date().toISOString(),
        }
      }

      // Calculate real accuracy metrics
      const totalPredictions = predictions.length
      const correctPredictions = predictions.filter(p => p.is_correct === true).length
      const accuracy = totalPredictions > 0 ? correctPredictions / totalPredictions : 0

      return {
        sport: this.sport,
        league: this.league,
        period: { start: startDate, end: endDate },
        model,
        accuracy: Math.round(accuracy * 100) / 100,
        totalPredictions,
        correctPredictions,
        lastUpdated: new Date().toISOString(),
      }
    } catch (error) {
      console.error(`Error getting prediction accuracy for ${this.sport}:`, error)
      return null
    }
  }

  /**
   * Health check for prediction service
   */
  async healthCheck(): Promise<boolean> {
    try {
      // Test basic functionality
      await this.getPredictions({ limit: 1 })
      return true
    } catch (error) {
      console.error(`${this.sport} prediction service health check failed:`, error)
      return false
    }
  }
}
