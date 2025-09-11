/**
 * ML Prediction Service
 * Handles machine learning model predictions for sports betting
 */

import { serviceFactory } from './core/service-factory'

interface PredictionRequest {
  game: any
  betType: string
  side: string
}

interface PredictionResult {
  model_name: string
  prediction_type: string
  predicted_value: any
  confidence: number
  actual_value?: any
  is_correct?: boolean
  reasoning: string
}

export class MLPredictionService {
  private readonly DEFAULT_CONFIDENCE = 0.6
  private readonly MIN_CONFIDENCE = 0.3
  private readonly MAX_CONFIDENCE = 0.95

  /**
   * Calculate probability using ML models
   */
  async calculateProbability(game: any, betType: string, side: string): Promise<number> {
    try {
      // Get historical data for the teams
      const historicalData = await this.getHistoricalData(game)
      
      // Calculate probability based on bet type
      switch (betType) {
        case "Moneyline":
          return this.calculateMoneylineProbability(game, side, historicalData)
        case "Spread":
          return this.calculateSpreadProbability(game, side, historicalData)
        case "Over/Under":
          return this.calculateTotalProbability(game, side, historicalData)
        default:
          return 0.5
      }
    } catch (error) {
      console.error('ML prediction error:', error)
      return 0.5 // Neutral probability on error
    }
  }

  /**
   * Generate predictions for a game
   */
  async generatePredictions(game: any, sport: string): Promise<PredictionResult[]> {
    try {
      const predictions: PredictionResult[] = []
      const historicalData = await this.getHistoricalData(game)
      
      // Moneyline prediction
      const homeWinProb = await this.calculateMoneylineProbability(game, game.homeTeam, historicalData)
      predictions.push({
        model_name: "ml_ensemble_v1",
        prediction_type: "winner",
        predicted_value: homeWinProb > 0.5 ? "home" : "away",
        confidence: Math.abs(homeWinProb - 0.5) * 2,
        actual_value: game.home_score > game.away_score ? "home" : "away",
        is_correct: (homeWinProb > 0.5) === (game.home_score > game.away_score),
        reasoning: "Based on team performance metrics and historical head-to-head data"
      })

      // Spread prediction
      const predictedSpread = await this.calculateSpreadValue(game, historicalData)
      const actualSpread = (game.home_score || 0) - (game.away_score || 0)
      predictions.push({
        model_name: "ml_ensemble_v1",
        prediction_type: "spread",
        predicted_value: predictedSpread,
        confidence: this.calculateSpreadConfidence(historicalData),
        actual_value: actualSpread,
        is_correct: Math.abs(predictedSpread - actualSpread) < 3,
        reasoning: "Based on team strength differential and recent form"
      })

      // Total prediction
      const predictedTotal = await this.calculateTotalValue(game, historicalData)
      const actualTotal = (game.home_score || 0) + (game.away_score || 0)
      predictions.push({
        model_name: "ml_ensemble_v1",
        prediction_type: "total",
        predicted_value: predictedTotal,
        confidence: this.calculateTotalConfidence(historicalData),
        actual_value: actualTotal,
        is_correct: Math.abs(predictedTotal - actualTotal) < 10,
        reasoning: "Based on offensive and defensive efficiency metrics"
      })

      return predictions
    } catch (error) {
      console.error('Error generating predictions:', error)
      return []
    }
  }

  private async getHistoricalData(game: any): Promise<any> {
    try {
      // Get sport-specific service
      const sportService = serviceFactory.getService(game.sport || 'basketball', game.league || 'NBA')
      
      // Get recent games for both teams
      const [homeTeamGames, awayTeamGames] = await Promise.all([
        sportService.getGames({ 
          teamId: game.home_team_id, 
          status: 'finished',
          limit: 10 
        }),
        sportService.getGames({ 
          teamId: game.away_team_id, 
          status: 'finished',
          limit: 10 
        })
      ])

      return {
        homeTeam: this.calculateTeamStats(homeTeamGames),
        awayTeam: this.calculateTeamStats(awayTeamGames)
      }
    } catch (error) {
      console.error('Error fetching historical data:', error)
      return { homeTeam: {}, awayTeam: {} }
    }
  }

  private calculateTeamStats(games: any[]): any {
    if (games.length === 0) {
      return {
        winRate: 0.5,
        avgPoints: 0,
        avgPointsAllowed: 0,
        homeAdvantage: 0
      }
    }

    const wins = games.filter(g => g.homeScore > g.awayScore).length
    const totalPoints = games.reduce((sum, g) => sum + (g.homeScore || 0), 0)
    const totalPointsAllowed = games.reduce((sum, g) => sum + (g.awayScore || 0), 0)

    return {
      winRate: wins / games.length,
      avgPoints: totalPoints / games.length,
      avgPointsAllowed: totalPointsAllowed / games.length,
      homeAdvantage: 0.55 // Standard home advantage
    }
  }

  private async calculateMoneylineProbability(game: any, side: string, historicalData: any): Promise<number> {
    const { homeTeam, awayTeam } = historicalData
    
    // Base probability calculation
    let homeProb = 0.5
    
    // Adjust for team strength
    if (homeTeam.winRate > awayTeam.winRate) {
      homeProb += (homeTeam.winRate - awayTeam.winRate) * 0.3
    } else {
      homeProb -= (awayTeam.winRate - homeTeam.winRate) * 0.3
    }
    
    // Apply home advantage
    homeProb = homeProb * homeTeam.homeAdvantage + (1 - homeTeam.homeAdvantage) * 0.5
    
    return side.includes(game.homeTeam) ? homeProb : 1 - homeProb
  }

  private async calculateSpreadValue(game: any, historicalData: any): Promise<number> {
    const { homeTeam, awayTeam } = historicalData
    
    // Calculate expected point differential
    const homeAdvantage = 3.5 // Standard home advantage in points
    const strengthDiff = (homeTeam.avgPoints - homeTeam.avgPointsAllowed) - 
                        (awayTeam.avgPoints - awayTeam.avgPointsAllowed)
    
    return strengthDiff + homeAdvantage
  }

  private async calculateTotalValue(game: any, historicalData: any): Promise<number> {
    const { homeTeam, awayTeam } = historicalData
    
    // Calculate expected total points
    const homeOffense = homeTeam.avgPoints
    const awayOffense = awayTeam.avgPoints
    const homeDefense = homeTeam.avgPointsAllowed
    const awayDefense = awayTeam.avgPointsAllowed
    
    // Weighted average considering both teams' offensive and defensive capabilities
    const expectedTotal = (homeOffense + awayOffense + homeDefense + awayDefense) / 2
    
    return Math.max(150, Math.min(250, expectedTotal)) // Reasonable bounds
  }

  private calculateSpreadConfidence(historicalData: any): number {
    const { homeTeam, awayTeam } = historicalData
    
    // Confidence based on data quality and team consistency
    const dataQuality = Math.min(1, (homeTeam.winRate + awayTeam.winRate) / 2)
    const consistency = 1 - Math.abs(homeTeam.winRate - awayTeam.winRate)
    
    return Math.max(this.MIN_CONFIDENCE, Math.min(this.MAX_CONFIDENCE, 
      this.DEFAULT_CONFIDENCE * dataQuality * consistency))
  }

  private calculateTotalConfidence(historicalData: any): number {
    const { homeTeam, awayTeam } = historicalData
    
    // Confidence based on scoring consistency
    const homeConsistency = 1 - Math.abs(homeTeam.avgPoints - homeTeam.avgPointsAllowed) / 100
    const awayConsistency = 1 - Math.abs(awayTeam.avgPoints - awayTeam.avgPointsAllowed) / 100
    
    return Math.max(this.MIN_CONFIDENCE, Math.min(this.MAX_CONFIDENCE,
      this.DEFAULT_CONFIDENCE * (homeConsistency + awayConsistency) / 2))
  }
}

export const mlPredictionService = new MLPredictionService()
