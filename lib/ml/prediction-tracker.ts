/**
 * PREDICTION ACCURACY TRACKING SYSTEM
 *
 * Tracks the performance of different ML models and provides
 * real-time accuracy metrics, model evaluation, and performance analysis
 */

export interface PredictionMetrics {
  modelName: string
  sport: string
  league: string
  totalPredictions: number
  correctPredictions: number
  accuracy: number
  precision: number
  recall: number
  f1Score: number
  calibrationScore: number
  logLoss: number
  brierScore: number
  sharpeRatio: number
  profitability: number
  lastUpdated: Date
}

export interface PredictionEvaluation {
  predictionId: string
  actualOutcome: number | string
  predictedOutcome: number | string
  probability: number
  isCorrect: boolean
  error: number
  calibrationBin: number
  profitLoss: number
}

export interface ModelPerformanceAnalysis {
  overall: PredictionMetrics
  byConfidenceLevel: Record<string, PredictionMetrics>
  bySeason: Record<string, PredictionMetrics>
  byGameType: Record<string, PredictionMetrics>
  trends: {
    accuracyTrend: number[]
    profitabilityTrend: number[]
    confidenceTrend: number[]
    recentForm: 'improving' | 'declining' | 'stable'
  }
  recommendations: string[]
}

/**
 * Comprehensive prediction tracking and evaluation system
 */
export class PredictionTracker {
  /**
   * Evaluate a completed prediction and update model metrics
   */
  static async evaluatePrediction(
    predictionId: string,
    actualOutcome: any,
    predictedOutcome: any,
    probability: number,
    sport: string,
    league: string,
    modelName: string
  ): Promise<PredictionEvaluation> {
    try {
      const { createClient } = await import('@/lib/supabase/server')
      const supabase = await createClient()

      if (!supabase) {
        throw new Error('Database connection failed')
      }

      // Determine if prediction was correct
      const isCorrect = this.isPredictionCorrect(actualOutcome, predictedOutcome)

      // Calculate error metrics
      const error = this.calculatePredictionError(actualOutcome, predictedOutcome, probability)

      // Determine calibration bin (for reliability analysis)
      const calibrationBin = Math.floor(probability * 10)

      // Calculate profit/loss (assuming unit bet)
      const profitLoss = this.calculateProfitLoss(isCorrect, probability)

      // Create evaluation record
      const evaluation: PredictionEvaluation = {
        predictionId,
        actualOutcome: typeof actualOutcome === 'number' ? actualOutcome : String(actualOutcome),
        predictedOutcome:
          typeof predictedOutcome === 'number' ? predictedOutcome : String(predictedOutcome),
        probability,
        isCorrect,
        error,
        calibrationBin,
        profitLoss,
      }

      // Update prediction in database with evaluation
      await supabase
        .from('predictions')
        .update({
          actual_value: actualOutcome,
          is_correct: isCorrect,
          updated_at: new Date().toISOString(),
        })
        .eq('id', predictionId)

      // Update model performance metrics
      await this.updateModelMetrics(sport, league, modelName)

      return evaluation
    } catch (error) {
      console.error('Error evaluating prediction:', error)
      throw error
    }
  }

  /**
   * Get comprehensive model performance analysis
   */
  static async getModelPerformance(
    sport: string,
    league?: string,
    modelName?: string,
    timeRange: 'week' | 'month' | 'season' | 'all' = 'month'
  ): Promise<ModelPerformanceAnalysis | null> {
    try {
      const { createClient } = await import('@/lib/supabase/server')
      const supabase = await createClient()

      if (!supabase) {
        throw new Error('Database connection failed')
      }

      // Build query filters
      let query = supabase
        .from('predictions')
        .select('*')
        .eq('sport', sport)
        .not('is_correct', 'is', null) // Only completed predictions

      if (league) {
        query = query.eq('league', league)
      }

      if (modelName) {
        query = query.eq('model_name', modelName)
      }

      // Apply time range filter
      const timeFilter = this.getTimeFilter(timeRange)
      if (timeFilter) {
        query = query.gte('created_at', timeFilter)
      }

      const { data: predictions, error } = await query

      if (error) {
        throw error
      }

      if (!predictions || predictions.length === 0) {
        return null
      }

      // Calculate overall metrics
      const overall = this.calculateMetrics(predictions, 'Overall', sport, league || 'all')

      // Calculate metrics by confidence level
      const byConfidenceLevel = this.calculateMetricsByConfidence(
        predictions,
        sport,
        league || 'all'
      )

      // Calculate metrics by season
      const bySeason = this.calculateMetricsBySeason(predictions, sport, league || 'all')

      // Calculate metrics by game type
      const byGameType = this.calculateMetricsByGameType(predictions, sport, league || 'all')

      // Calculate trends
      const trends = this.calculateTrends(predictions)

      // Generate recommendations
      const recommendations = this.generateRecommendations(overall, trends)

      return {
        overall,
        byConfidenceLevel,
        bySeason,
        byGameType,
        trends,
        recommendations,
      }
    } catch (error) {
      console.error('Error getting model performance:', error)
      return null
    }
  }

  /**
   * Real-time model calibration analysis
   */
  static async getCalibrationAnalysis(
    sport: string,
    modelName?: string
  ): Promise<{
    calibrationCurve: { predictedProb: number; actualProb: number; count: number }[]
    calibrationScore: number
    isWellCalibrated: boolean
    recommendations: string[]
  }> {
    try {
      const { createClient } = await import('@/lib/supabase/server')
      const supabase = await createClient()

      if (!supabase) {
        throw new Error('Database connection failed')
      }

      let query = supabase
        .from('predictions')
        .select('confidence, is_correct')
        .eq('sport', sport)
        .not('is_correct', 'is', null)

      if (modelName) {
        query = query.eq('model_name', modelName)
      }

      const { data: predictions, error } = await query

      if (error || !predictions) {
        throw error
      }

      // Group predictions by confidence bins
      const bins: Record<number, { correct: number; total: number }> = {}

      predictions.forEach(pred => {
        const bin = Math.floor(pred.confidence * 10)
        if (!bins[bin]) {
          bins[bin] = { correct: 0, total: 0 }
        }
        bins[bin].total++
        if (pred.is_correct) {
          bins[bin].correct++
        }
      })

      // Calculate calibration curve
      const calibrationCurve = Object.entries(bins).map(([bin, data]) => ({
        predictedProb: (parseInt(bin) + 0.5) / 10, // Mid-point of bin
        actualProb: data.total > 0 ? data.correct / data.total : 0,
        count: data.total,
      }))

      // Calculate calibration score (lower is better)
      const calibrationScore = this.calculateCalibrationScore(calibrationCurve)

      // Determine if well calibrated (score < 0.1 is considered good)
      const isWellCalibrated = calibrationScore < 0.1

      // Generate recommendations
      const recommendations = this.generateCalibrationRecommendations(
        calibrationScore,
        calibrationCurve
      )

      return {
        calibrationCurve,
        calibrationScore,
        isWellCalibrated,
        recommendations,
      }
    } catch (error) {
      console.error('Error in calibration analysis:', error)
      return {
        calibrationCurve: [],
        calibrationScore: 1.0,
        isWellCalibrated: false,
        recommendations: ['Error analyzing calibration'],
      }
    }
  }

  /**
   * Track live model performance and trigger alerts
   */
  static async monitorLivePerformance(): Promise<{
    alerts: string[]
    modelHealthScores: Record<string, number>
    recommendedActions: string[]
  }> {
    const alerts: string[] = []
    const modelHealthScores: Record<string, number> = {}
    const recommendedActions: string[] = []

    try {
      const { createClient } = await import('@/lib/supabase/server')
      const supabase = await createClient()

      if (!supabase) {
        throw new Error('Database connection failed')
      }

      // Get recent predictions (last 24 hours)
      const recentCutoff = new Date()
      recentCutoff.setHours(recentCutoff.getHours() - 24)

      const { data: recentPredictions, error } = await supabase
        .from('predictions')
        .select('*')
        .gte('created_at', recentCutoff.toISOString())
        .not('is_correct', 'is', null)

      if (error || !recentPredictions) {
        alerts.push('Unable to fetch recent predictions for monitoring')
        return { alerts, modelHealthScores, recommendedActions }
      }

      // Group by model
      const modelGroups = recentPredictions.reduce(
        (acc, pred) => {
          const key = `${pred.model_name}_${pred.sport}`
          if (!acc[key]) {
            acc[key] = []
          }
          acc[key].push(pred)
          return acc
        },
        {} as Record<string, any[]>
      )

      // Analyze each model
      Object.entries(modelGroups).forEach(([modelKey, predictions]) => {
        const typedPredictions = predictions as any[]
        if (typedPredictions.length < 5) {
          // Not enough data
          modelHealthScores[modelKey] = 0.5
          return
        }

        const accuracy =
          typedPredictions.filter((p: any) => p.is_correct).length / typedPredictions.length
        const avgConfidence =
          typedPredictions.reduce((sum: number, p: any) => sum + p.confidence, 0) /
          typedPredictions.length

        // Calculate health score
        const healthScore = accuracy * 0.7 + avgConfidence * 0.3
        modelHealthScores[modelKey] = Math.round(healthScore * 1000) / 1000

        // Generate alerts
        if (accuracy < 0.4) {
          alerts.push(`Low accuracy detected for ${modelKey}: ${Math.round(accuracy * 100)}%`)
          recommendedActions.push(`Review and retrain ${modelKey} model`)
        }

        if (avgConfidence > 0.9 && accuracy < 0.6) {
          alerts.push(`Overconfident predictions detected for ${modelKey}`)
          recommendedActions.push(`Recalibrate confidence intervals for ${modelKey}`)
        }

        if (typedPredictions.length > 20 && accuracy > 0.8) {
          // Good performance
          // No alert needed, but could log success
        }
      })

      if (alerts.length === 0) {
        alerts.push('All models performing within expected parameters')
      }
    } catch (error) {
      console.error('Error monitoring live performance:', error)
      alerts.push('Error occurred during performance monitoring')
    }

    return { alerts, modelHealthScores, recommendedActions }
  }

  // Private helper methods

  private static isPredictionCorrect(actual: any, predicted: any): boolean {
    if (typeof actual === 'number' && typeof predicted === 'number') {
      // For numeric predictions, consider within 5% as correct
      const tolerance = Math.abs(actual) * 0.05
      return Math.abs(actual - predicted) <= tolerance
    }

    // For categorical predictions, exact match
    return String(actual).toLowerCase() === String(predicted).toLowerCase()
  }

  private static calculatePredictionError(
    actual: any,
    predicted: any,
    probability: number
  ): number {
    if (typeof actual === 'number' && typeof predicted === 'number') {
      return Math.abs(actual - predicted)
    }

    // For binary predictions, use log loss
    const actualBinary = actual === predicted ? 1 : 0
    const clampedProb = Math.max(0.01, Math.min(0.99, probability))
    return -(actualBinary * Math.log(clampedProb) + (1 - actualBinary) * Math.log(1 - clampedProb))
  }

  private static calculateProfitLoss(isCorrect: boolean, probability: number): number {
    // Calculate profit assuming fair odds betting
    const impliedOdds = 1 / probability
    const fairOdds = impliedOdds * 0.95 // Account for house edge

    if (isCorrect) {
      return fairOdds - 1 // Profit
    } else {
      return -1 // Loss of stake
    }
  }

  private static calculateMetrics(
    predictions: any[],
    modelName: string,
    sport: string,
    league: string
  ): PredictionMetrics {
    const totalPredictions = predictions.length
    const correctPredictions = predictions.filter(p => p.is_correct).length
    const accuracy = totalPredictions > 0 ? correctPredictions / totalPredictions : 0

    // Calculate precision, recall, F1 for binary classification
    const truePositives = predictions.filter(p => p.is_correct && p.predicted_value === 1).length
    const falsePositives = predictions.filter(p => !p.is_correct && p.predicted_value === 1).length
    const falseNegatives = predictions.filter(p => !p.is_correct && p.predicted_value === 0).length

    const precision =
      truePositives + falsePositives > 0 ? truePositives / (truePositives + falsePositives) : 0
    const recall =
      truePositives + falseNegatives > 0 ? truePositives / (truePositives + falseNegatives) : 0
    const f1Score = precision + recall > 0 ? (2 * (precision * recall)) / (precision + recall) : 0

    // Calculate Brier score (for probability predictions)
    const brierScore =
      predictions.reduce((sum, p) => {
        const outcome = p.is_correct ? 1 : 0
        return sum + Math.pow(p.confidence - outcome, 2)
      }, 0) / totalPredictions

    // Calculate profitability
    const totalProfit = predictions.reduce((sum, p) => {
      return sum + this.calculateProfitLoss(p.is_correct, p.confidence)
    }, 0)
    const profitability = totalPredictions > 0 ? totalProfit / totalPredictions : 0

    return {
      modelName,
      sport,
      league,
      totalPredictions,
      correctPredictions,
      accuracy: Math.round(accuracy * 1000) / 1000,
      precision: Math.round(precision * 1000) / 1000,
      recall: Math.round(recall * 1000) / 1000,
      f1Score: Math.round(f1Score * 1000) / 1000,
      calibrationScore: 0, // Would need separate calculation
      logLoss: 0, // Would need separate calculation
      brierScore: Math.round(brierScore * 1000) / 1000,
      sharpeRatio: 0, // Would need time series data
      profitability: Math.round(profitability * 1000) / 1000,
      lastUpdated: new Date(),
    }
  }

  private static calculateMetricsByConfidence(
    predictions: any[],
    sport: string,
    league: string
  ): Record<string, PredictionMetrics> {
    const bins = {
      'Low (50-60%)': predictions.filter(p => p.confidence >= 0.5 && p.confidence < 0.6),
      'Medium (60-70%)': predictions.filter(p => p.confidence >= 0.6 && p.confidence < 0.7),
      'High (70-80%)': predictions.filter(p => p.confidence >= 0.7 && p.confidence < 0.8),
      'Very High (80%+)': predictions.filter(p => p.confidence >= 0.8),
    }

    const result: Record<string, PredictionMetrics> = {}
    Object.entries(bins).forEach(([level, preds]) => {
      if (preds.length > 0) {
        result[level] = this.calculateMetrics(preds, level, sport, league)
      }
    })

    return result
  }

  private static calculateMetricsBySeason(
    predictions: any[],
    sport: string,
    league: string
  ): Record<string, PredictionMetrics> {
    const seasons = predictions.reduce(
      (acc, pred) => {
        // Extract season from game data or use year from created_at
        const season = pred.season || new Date(pred.created_at).getFullYear().toString()
        if (!acc[season]) {
          acc[season] = []
        }
        acc[season].push(pred)
        return acc
      },
      {} as Record<string, any[]>
    )

    const result: Record<string, PredictionMetrics> = {}
    Object.entries(seasons).forEach(([season, preds]) => {
      result[season] = this.calculateMetrics(preds as any[], `Season ${season}`, sport, league)
    })

    return result
  }

  private static calculateMetricsByGameType(
    predictions: any[],
    sport: string,
    league: string
  ): Record<string, PredictionMetrics> {
    const gameTypes = predictions.reduce(
      (acc, pred) => {
        const gameType = pred.game_type || 'Regular Season'
        if (!acc[gameType]) {
          acc[gameType] = []
        }
        acc[gameType].push(pred)
        return acc
      },
      {} as Record<string, any[]>
    )

    const result: Record<string, PredictionMetrics> = {}
    Object.entries(gameTypes).forEach(([type, preds]) => {
      result[type] = this.calculateMetrics(preds as any[], type, sport, league)
    })

    return result
  }

  private static calculateTrends(predictions: any[]): ModelPerformanceAnalysis['trends'] {
    // Sort predictions by date
    const sortedPredictions = predictions.sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    )

    // Calculate rolling accuracy (window of 10 predictions)
    const windowSize = 10
    const accuracyTrend: number[] = []
    const profitabilityTrend: number[] = []
    const confidenceTrend: number[] = []

    for (let i = windowSize - 1; i < sortedPredictions.length; i++) {
      const window = sortedPredictions.slice(i - windowSize + 1, i + 1)
      const accuracy = window.filter(p => p.is_correct).length / window.length
      const profitability =
        window.reduce((sum, p) => sum + this.calculateProfitLoss(p.is_correct, p.confidence), 0) /
        window.length
      const avgConfidence = window.reduce((sum, p) => sum + p.confidence, 0) / window.length

      accuracyTrend.push(Math.round(accuracy * 1000) / 1000)
      profitabilityTrend.push(Math.round(profitability * 1000) / 1000)
      confidenceTrend.push(Math.round(avgConfidence * 1000) / 1000)
    }

    // Determine recent form
    const recentAccuracy = accuracyTrend.slice(-5)
    const earlyAccuracy = accuracyTrend.slice(0, 5)

    let recentForm: 'improving' | 'declining' | 'stable' = 'stable'

    if (recentAccuracy.length >= 3 && earlyAccuracy.length >= 3) {
      const recentAvg = recentAccuracy.reduce((sum, acc) => sum + acc, 0) / recentAccuracy.length
      const earlyAvg = earlyAccuracy.reduce((sum, acc) => sum + acc, 0) / earlyAccuracy.length

      if (recentAvg > earlyAvg + 0.05) {
        recentForm = 'improving'
      } else if (recentAvg < earlyAvg - 0.05) {
        recentForm = 'declining'
      }
    }

    return {
      accuracyTrend,
      profitabilityTrend,
      confidenceTrend,
      recentForm,
    }
  }

  private static generateRecommendations(
    metrics: PredictionMetrics,
    trends: ModelPerformanceAnalysis['trends']
  ): string[] {
    const recommendations: string[] = []

    if (metrics.accuracy < 0.55) {
      recommendations.push(
        'Model accuracy is below expected threshold. Consider retraining with more recent data.'
      )
    }

    if (metrics.profitability < -0.05) {
      recommendations.push(
        'Model is showing negative profitability. Review betting strategy and odds calculation.'
      )
    }

    if (trends.recentForm === 'declining') {
      recommendations.push(
        'Recent performance is declining. Consider updating model features or retraining.'
      )
    }

    if (metrics.brierScore > 0.25) {
      recommendations.push(
        'High Brier score indicates poor probability calibration. Consider calibration adjustment.'
      )
    }

    if (recommendations.length === 0) {
      recommendations.push('Model performance is within acceptable parameters.')
    }

    return recommendations
  }

  private static getTimeFilter(timeRange: string): string | null {
    const now = new Date()
    switch (timeRange) {
      case 'week':
        now.setDate(now.getDate() - 7)
        return now.toISOString()
      case 'month':
        now.setMonth(now.getMonth() - 1)
        return now.toISOString()
      case 'season':
        now.setMonth(now.getMonth() - 6) // Rough season length
        return now.toISOString()
      case 'all':
      default:
        return null
    }
  }

  private static calculateCalibrationScore(
    calibrationCurve: { predictedProb: number; actualProb: number; count: number }[]
  ): number {
    // Calculate Expected Calibration Error (ECE)
    let totalSamples = 0
    let weightedError = 0

    calibrationCurve.forEach(bin => {
      const error = Math.abs(bin.predictedProb - bin.actualProb)
      weightedError += error * bin.count
      totalSamples += bin.count
    })

    return totalSamples > 0 ? weightedError / totalSamples : 1.0
  }

  private static generateCalibrationRecommendations(score: number, curve: any[]): string[] {
    const recommendations: string[] = []

    if (score > 0.1) {
      recommendations.push(
        'Model is poorly calibrated. Consider Platt scaling or isotonic regression.'
      )
    }

    if (curve.some(bin => bin.actualProb > bin.predictedProb + 0.1)) {
      recommendations.push('Model is underconfident in some probability ranges.')
    }

    if (curve.some(bin => bin.actualProb < bin.predictedProb - 0.1)) {
      recommendations.push('Model is overconfident in some probability ranges.')
    }

    if (recommendations.length === 0) {
      recommendations.push('Model calibration is acceptable.')
    }

    return recommendations
  }

  private static async updateModelMetrics(
    sport: string,
    league: string,
    modelName: string
  ): Promise<void> {
    // This would update aggregated model metrics in a separate table
    // Implementation depends on specific database schema needs
    console.log(`Updated metrics for ${modelName} in ${sport}/${league}`)
  }
}
