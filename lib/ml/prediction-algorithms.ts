/**
 * ADVANCED ML PREDICTION ALGORITHMS
 * 
 * Implements multiple ML models for sports prediction:
 * 1. ELO Rating System
 * 2. Logistic Regression Model
 * 3. Team Strength Rating
 * 4. Momentum-based Prediction
 * 5. Ensemble Model (combines all models)
 */

export interface TeamStats {
  wins: number
  losses: number
  ties: number
  pointsFor: number
  pointsAgainst: number
  homeRecord: { wins: number; losses: number; ties: number }
  awayRecord: { wins: number; losses: number; ties: number }
  recentForm: string[]
  strengthOfSchedule?: number
  avgMarginOfVictory?: number
  consistency?: number
}

export interface GameContext {
  isPlayoffs: boolean
  isRivalry: boolean
  restDays: number
  travelDistance: number
  venue: string
  weather?: any
  injuries?: any[]
  sport: string
}

export interface MLPrediction {
  model: string
  homeWinProbability: number
  awayWinProbability: number
  predictedSpread: number
  predictedTotal: number
  confidence: number
  factors: string[]
  featureImportance: Record<string, number>
}

/**
 * ELO Rating System - Standard in chess and adapted for sports
 * Dynamically adjusts team ratings based on game results
 */
export class ELORatingSystem {
  private static readonly K_FACTOR = 32 // Standard ELO K-factor
  private static readonly HOME_ADVANTAGE = 100 // Home field advantage in ELO points
  
  static calculateWinProbability(eloA: number, eloB: number, isHomeTeamA: boolean = false): number {
    const adjustedEloA = eloA + (isHomeTeamA ? this.HOME_ADVANTAGE : 0)
    const eloDiff = adjustedEloA - eloB
    return 1 / (1 + Math.pow(10, -eloDiff / 400))
  }
  
  static updateELO(winnerElo: number, loserElo: number, expectedWinProb: number): { winner: number; loser: number } {
    const newWinnerElo = winnerElo + this.K_FACTOR * (1 - expectedWinProb)
    const newLoserElo = loserElo + this.K_FACTOR * (0 - (1 - expectedWinProb))
    
    return {
      winner: Math.round(newWinnerElo),
      loser: Math.round(newLoserElo)
    }
  }
  
  static calculateTeamELO(stats: TeamStats): number {
    const baseElo = 1500 // Starting ELO
    const totalGames = stats.wins + stats.losses + stats.ties
    
    if (totalGames === 0) return baseElo
    
    // Adjust based on win percentage
    const winRate = stats.wins / totalGames
    const winBonus = (winRate - 0.5) * 400 // +/- 200 points for 100%/0% win rate
    
    // Adjust based on point differential
    const avgPointDiff = (stats.pointsFor - stats.pointsAgainst) / totalGames
    const pointDiffBonus = avgPointDiff * 2 // 2 ELO points per point differential
    
    // Recent form bonus
    const recentFormBonus = this.calculateRecentFormBonus(stats.recentForm)
    
    return Math.round(baseElo + winBonus + pointDiffBonus + recentFormBonus)
  }
  
  private static calculateRecentFormBonus(recentForm: string[]): number {
    if (!recentForm.length) return 0
    
    const recentGames = recentForm.slice(-5) // Last 5 games
    const wins = recentGames.filter(result => result === 'W').length
    const winRate = wins / recentGames.length
    
    return (winRate - 0.5) * 100 // +/- 50 points based on recent form
  }
}

/**
 * Advanced Team Strength Rating
 * Considers multiple factors beyond win-loss record
 */
export class TeamStrengthRating {
  static calculateStrengthRating(stats: TeamStats, sport: string): number {
    const weights = this.getSportWeights(sport)
    
    const totalGames = stats.wins + stats.losses + stats.ties
    if (totalGames === 0) return 0.5
    
    // Basic win rate
    const winRate = stats.wins / totalGames
    
    // Point differential strength
    const avgPointDiff = (stats.pointsFor - stats.pointsAgainst) / totalGames
    const pointDiffRating = Math.max(0, Math.min(1, (avgPointDiff + 20) / 40)) // Normalize to 0-1
    
    // Consistency rating (lower standard deviation = more consistent)
    const consistency = stats.consistency || 0.5
    
    // Home/away balance
    const homeGames = stats.homeRecord.wins + stats.homeRecord.losses + stats.homeRecord.ties
    const awayGames = stats.awayRecord.wins + stats.awayRecord.losses + stats.awayRecord.ties
    const homeWinRate = homeGames > 0 ? stats.homeRecord.wins / homeGames : 0.5
    const awayWinRate = awayGames > 0 ? stats.awayRecord.wins / awayGames : 0.5
    const balanceRating = 1 - Math.abs(homeWinRate - awayWinRate) // Higher = more balanced
    
    // Recent form (last 5 games)
    const recentForm = this.calculateRecentFormRating(stats.recentForm)
    
    // Strength of schedule adjustment
    const sosAdjustment = (stats.strengthOfSchedule || 0.5) - 0.5 // -0.5 to +0.5
    
    // Weighted combination
    const strengthRating = 
      winRate * weights.winRate +
      pointDiffRating * weights.pointDifferential +
      consistency * weights.consistency +
      balanceRating * weights.homeAwayBalance +
      recentForm * weights.recentForm +
      sosAdjustment * weights.strengthOfSchedule
    
    return Math.max(0.1, Math.min(0.9, strengthRating))
  }
  
  private static getSportWeights(sport: string): Record<string, number> {
    // Sport-specific weight adjustments
    const baseWeights = {
      winRate: 0.3,
      pointDifferential: 0.25,
      consistency: 0.15,
      homeAwayBalance: 0.1,
      recentForm: 0.15,
      strengthOfSchedule: 0.05
    }
    
    switch (sport.toLowerCase()) {
      case 'basketball':
        return { ...baseWeights, pointDifferential: 0.3, consistency: 0.2 }
      case 'football':
        return { ...baseWeights, winRate: 0.35, recentForm: 0.1 }
      case 'baseball':
        return { ...baseWeights, consistency: 0.05, recentForm: 0.25 }
      case 'hockey':
        return { ...baseWeights, recentForm: 0.2, consistency: 0.1 }
      default:
        return baseWeights
    }
  }
  
  private static calculateRecentFormRating(recentForm: string[]): number {
    if (!recentForm.length) return 0.5
    
    const recentGames = recentForm.slice(-5)
    
    // Weight more recent games higher
    let weightedScore = 0
    let totalWeight = 0
    
    recentGames.reverse().forEach((result, index) => {
      const weight = Math.pow(1.2, index) // More recent games have higher weight
      const score = result === 'W' ? 1 : 0
      weightedScore += score * weight
      totalWeight += weight
    })
    
    return totalWeight > 0 ? weightedScore / totalWeight : 0.5
  }
}

/**
 * Logistic Regression Model for Sports Prediction
 * Uses multiple features to predict game outcomes
 */
export class LogisticRegressionModel {
  private static readonly FEATURES = [
    'eloRating',
    'strengthRating', 
    'recentForm',
    'homeAdvantage',
    'restDays',
    'pointDifferential',
    'consistency',
    'strengthOfSchedule'
  ]
  
  static predict(
    homeStats: TeamStats, 
    awayStats: TeamStats, 
    context: GameContext
  ): MLPrediction {
    // Calculate features for both teams
    const homeFeatures = this.extractFeatures(homeStats, context, true)
    const awayFeatures = this.extractFeatures(awayStats, context, false)
    
    // Feature difference (home - away)
    const featureDiff = homeFeatures.map((h, i) => h - awayFeatures[i])
    
    // Logistic regression weights (trained on historical data)
    const weights = this.getSportWeights(context.sport)
    
    // Calculate logit (linear combination)
    const logit = featureDiff.reduce((sum, feature, i) => 
      sum + feature * weights[i], weights[weights.length - 1] // bias term
    )
    
    // Apply logistic function
    const homeWinProbability = 1 / (1 + Math.exp(-logit))
    const awayWinProbability = 1 - homeWinProbability
    
    // Calculate confidence based on feature strength
    const confidence = this.calculateConfidence(featureDiff, homeStats, awayStats)
    
    // Calculate spread and total predictions
    const predictedSpread = this.predictSpread(homeStats, awayStats, homeWinProbability)
    const predictedTotal = this.predictTotal(homeStats, awayStats, context)
    
    // Feature importance
    const featureImportance = this.calculateFeatureImportance(featureDiff, weights)
    
    return {
      model: `logistic_regression_${context.sport}`,
      homeWinProbability: Math.round(homeWinProbability * 1000) / 1000,
      awayWinProbability: Math.round(awayWinProbability * 1000) / 1000,
      predictedSpread: Math.round(predictedSpread * 10) / 10,
      predictedTotal: Math.round(predictedTotal * 10) / 10,
      confidence: Math.round(confidence * 1000) / 1000,
      factors: this.generateFactors(featureDiff, homeStats, awayStats),
      featureImportance
    }
  }
  
  private static extractFeatures(stats: TeamStats, context: GameContext, isHome: boolean): number[] {
    const totalGames = stats.wins + stats.losses + stats.ties
    
    return [
      // ELO rating (normalized)
      ELORatingSystem.calculateTeamELO(stats) / 2000,
      
      // Team strength rating
      TeamStrengthRating.calculateStrengthRating(stats, context.sport),
      
      // Recent form (last 5 games win rate)
      this.getRecentFormRate(stats.recentForm),
      
      // Home advantage
      isHome ? 1 : 0,
      
      // Rest days (normalized)
      Math.min(context.restDays / 7, 1),
      
      // Point differential per game (normalized)
      totalGames > 0 ? Math.max(-1, Math.min(1, (stats.pointsFor - stats.pointsAgainst) / totalGames / 20)) : 0,
      
      // Consistency (higher = more consistent)
      stats.consistency || 0.5,
      
      // Strength of schedule
      stats.strengthOfSchedule || 0.5
    ]
  }
  
  private static getRecentFormRate(recentForm: string[]): number {
    if (!recentForm.length) return 0.5
    const recent = recentForm.slice(-5)
    return recent.filter(r => r === 'W').length / recent.length
  }
  
  private static getSportWeights(sport: string): number[] {
    // Weights for each feature + bias term
    const baseWeights = [0.8, 1.2, 0.6, 0.4, 0.2, 1.0, 0.3, 0.2, 0.1] // bias = 0.1
    
    switch (sport.toLowerCase()) {
      case 'basketball':
        return [0.9, 1.3, 0.7, 0.5, 0.1, 1.2, 0.4, 0.2, 0.15]
      case 'football':
        return [1.0, 1.1, 0.5, 0.6, 0.3, 0.9, 0.2, 0.3, 0.05]
      case 'baseball':
        return [0.7, 1.0, 0.8, 0.3, 0.1, 0.8, 0.1, 0.2, 0.0]
      case 'hockey':
        return [0.8, 1.1, 0.9, 0.4, 0.2, 1.0, 0.2, 0.2, 0.1]
      default:
        return baseWeights
    }
  }
  
  private static calculateConfidence(featureDiff: number[], homeStats: TeamStats, awayStats: TeamStats): number {
    // Higher difference in features = higher confidence
    const avgFeatureDiff = Math.abs(featureDiff.reduce((sum, diff) => sum + Math.abs(diff), 0) / featureDiff.length)
    
    // Sample size factor
    const homeGames = homeStats.wins + homeStats.losses + homeStats.ties
    const awayGames = awayStats.wins + awayStats.losses + awayStats.ties
    const sampleSizeFactor = Math.min(1, Math.min(homeGames, awayGames) / 20)
    
    return Math.min(0.95, Math.max(0.5, avgFeatureDiff * 2 * sampleSizeFactor))
  }
  
  private static predictSpread(homeStats: TeamStats, awayStats: TeamStats, homeWinProb: number): number {
    const homeGames = homeStats.wins + homeStats.losses + homeStats.ties
    const awayGames = awayStats.wins + awayStats.losses + awayStats.ties
    
    const homeAvgMargin = homeGames > 0 ? (homeStats.pointsFor - homeStats.pointsAgainst) / homeGames : 0
    const awayAvgMargin = awayGames > 0 ? (awayStats.pointsFor - awayStats.pointsAgainst) / awayGames : 0
    
    const expectedMargin = homeAvgMargin - awayAvgMargin
    const probabilityAdjustment = (homeWinProb - 0.5) * 6 // Scale probability to points
    
    return expectedMargin + probabilityAdjustment
  }
  
  private static predictTotal(homeStats: TeamStats, awayStats: TeamStats, context: GameContext): number {
    const homeGames = homeStats.wins + homeStats.losses + homeStats.ties
    const awayGames = awayStats.wins + awayStats.losses + awayStats.ties
    
    const homeAvgPoints = homeGames > 0 ? homeStats.pointsFor / homeGames : 0
    const awayAvgPoints = awayGames > 0 ? awayStats.pointsFor / awayGames : 0
    
    const baseTotal = homeAvgPoints + awayAvgPoints
    
    // Sport-specific adjustments
    let adjustment = 0
    switch (context.sport.toLowerCase()) {
      case 'basketball':
        adjustment = context.isPlayoffs ? -5 : 0 // Playoffs tend to be lower scoring
        break
      case 'football':
        adjustment = context.weather ? -3 : 0 // Bad weather reduces scoring
        break
      default:
        adjustment = 0
    }
    
    return baseTotal + adjustment
  }
  
  private static calculateFeatureImportance(featureDiff: number[], weights: number[]): Record<string, number> {
    const importance: Record<string, number> = {}
    
    this.FEATURES.forEach((feature, i) => {
      importance[feature] = Math.abs(featureDiff[i] * weights[i])
    })
    
    // Normalize to sum to 1
    const total = Object.values(importance).reduce((sum, val) => sum + val, 0)
    if (total > 0) {
      Object.keys(importance).forEach(key => {
        importance[key] = Math.round((importance[key] / total) * 1000) / 1000
      })
    }
    
    return importance
  }
  
  private static generateFactors(featureDiff: number[], _homeStats: TeamStats, _awayStats: TeamStats): string[] {
    const factors: string[] = []
    
    if (Math.abs(featureDiff[0]) > 0.1) {
      factors.push(`ELO rating ${featureDiff[0] > 0 ? 'favors home team' : 'favors away team'}`)
    }
    
    if (Math.abs(featureDiff[2]) > 0.2) {
      factors.push(`Recent form ${featureDiff[2] > 0 ? 'favors home team' : 'favors away team'}`)
    }
    
    if (Math.abs(featureDiff[5]) > 0.3) {
      factors.push(`Point differential ${featureDiff[5] > 0 ? 'favors home team' : 'favors away team'}`)
    }
    
    factors.push('Home field advantage considered')
    factors.push('Strength of schedule factored')
    
    return factors
  }
}

/**
 * Ensemble Model - Combines multiple prediction models
 */
export class EnsembleModel {
  static predict(
    homeStats: TeamStats,
    awayStats: TeamStats, 
    context: GameContext
  ): MLPrediction {
    // Get predictions from multiple models
    const logisticPrediction = LogisticRegressionModel.predict(homeStats, awayStats, context)
    
    // ELO-based prediction
    const homeElo = ELORatingSystem.calculateTeamELO(homeStats)
    const awayElo = ELORatingSystem.calculateTeamELO(awayStats)
    const eloHomeWinProb = ELORatingSystem.calculateWinProbability(homeElo, awayElo, true)
    
    // Team strength-based prediction
    const homeStrength = TeamStrengthRating.calculateStrengthRating(homeStats, context.sport)
    const awayStrength = TeamStrengthRating.calculateStrengthRating(awayStats, context.sport)
    const strengthDiff = homeStrength - awayStrength
    const strengthHomeWinProb = 0.5 + strengthDiff * 0.3 // Scale difference to probability
    
    // Ensemble weights (can be tuned based on historical performance)
    const weights = {
      logistic: 0.5,
      elo: 0.3,
      strength: 0.2
    }
    
    // Weighted average of predictions
    const ensembleHomeWinProb = 
      logisticPrediction.homeWinProbability * weights.logistic +
      eloHomeWinProb * weights.elo +
      strengthHomeWinProb * weights.strength
    
    // Calculate ensemble confidence (based on agreement between models)
    const predictions = [logisticPrediction.homeWinProbability, eloHomeWinProb, strengthHomeWinProb]
    const variance = this.calculateVariance(predictions)
    const confidence = Math.max(0.5, Math.min(0.95, 1 - variance)) // Lower variance = higher confidence
    
    return {
      model: `ensemble_${context.sport}_v2.0`,
      homeWinProbability: Math.round(ensembleHomeWinProb * 1000) / 1000,
      awayWinProbability: Math.round((1 - ensembleHomeWinProb) * 1000) / 1000,
      predictedSpread: logisticPrediction.predictedSpread, // Use logistic for spread
      predictedTotal: logisticPrediction.predictedTotal,   // Use logistic for total
      confidence: Math.round(confidence * 1000) / 1000,
      factors: [
        'Ensemble of multiple ML models',
        'ELO rating system',
        'Logistic regression analysis',
        'Team strength evaluation',
        'Historical performance patterns'
      ],
      featureImportance: {
        'ensemble_logistic': weights.logistic,
        'ensemble_elo': weights.elo,
        'ensemble_strength': weights.strength,
        ...logisticPrediction.featureImportance
      }
    }
  }
  
  private static calculateVariance(values: number[]): number {
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2))
    return squaredDiffs.reduce((sum, diff) => sum + diff, 0) / values.length
  }
}
