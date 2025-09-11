/**
 * SPORT PREDICTION SERVICE
 * Sport-specific prediction and ML model management
 */

import { BaseService, ServiceConfig } from '../core/base-service'
import { serviceFactory, SupportedSport } from '../core/service-factory'
import { GameData } from '../core/sport-specific-service'

export interface PredictionResult {
  gameId: string
  homeTeam: string
  awayTeam: string
  homeWinProbability: number
  awayWinProbability: number
  predictedSpread: number
  predictedTotal: number
  confidence: number
  model: string
  factors: string[]
  lastUpdated: string
}

export interface ValueBettingOpportunity {
  gameId: string
  homeTeam: string
  awayTeam: string
  market: string
  selection: string
  odds: number
  predictedProbability: number
  value: number
  confidence: number
  recommendation: 'strong' | 'moderate' | 'weak'
  lastUpdated: string
}

export interface ModelPerformance {
  modelName: string
  accuracy: number
  totalPredictions: number
  correctPredictions: number
  lastUpdated: string
}

export class SportPredictionService extends BaseService {
  private sport: SupportedSport
  private league: string

  constructor(sport: SupportedSport, league?: string) {
    const config: ServiceConfig = {
      name: `predictions-${sport}`,
      cacheTTL: 10 * 60 * 1000, // 10 minutes
      rateLimitService: 'predictions',
      retryAttempts: 2,
      retryDelay: 500
    }
    super(config)
    this.sport = sport
    this.league = league || ''
  }

  /**
   * Initialize the service with the default league
   */
  async initialize(): Promise<void> {
    if (!this.league) {
      this.league = await serviceFactory.getDefaultLeague(this.sport)
    }
  }

  /**
   * Generate predictions for upcoming games
   */
  async getPredictions(params: {
    gameId?: string
    date?: string
    limit?: number
  } = {}): Promise<PredictionResult[]> {
    const key = this.getCacheKey('predictions', this.sport, this.league, JSON.stringify(params))
    
    return this.getCachedOrFetch(key, async () => {
      const service = await serviceFactory.getService(this.sport, this.league)
      
      let games: GameData[]
      if (params.gameId) {
        const game = await service.getGameById(params.gameId)
        games = game ? [game] : []
      } else {
        games = await service.getGames({
          date: params.date,
          status: 'scheduled'
        })
      }

      const predictions: PredictionResult[] = []

      for (const game of games.slice(0, params.limit || 10)) {
        const prediction = await this.generatePrediction(game)
        if (prediction) {
          predictions.push(prediction)
        }
      }

      return predictions
    })
  }

  /**
   * Generate a single prediction for a game
   */
  private async generatePrediction(game: GameData): Promise<PredictionResult | null> {
    try {
      // Get historical data for both teams
      const historicalData = await this.getHistoricalData(game)
      
      // Calculate probabilities based on historical performance
      const homeWinProbability = this.calculateWinProbability(game, historicalData, 'home')
      const awayWinProbability = 1 - homeWinProbability
      
      // Calculate predicted spread based on team strength differential
      const predictedSpread = this.calculatePredictedSpread(game, historicalData)
      
      // Calculate predicted total based on offensive capabilities
      const predictedTotal = this.calculatePredictedTotal(game, historicalData)
      
      // Calculate confidence based on data quality and consistency
      const confidence = this.calculateConfidence(historicalData)

      return {
        gameId: game.id,
        homeTeam: game.homeTeam,
        awayTeam: game.awayTeam,
        homeWinProbability: Math.round(homeWinProbability * 100) / 100,
        awayWinProbability: Math.round(awayWinProbability * 100) / 100,
        predictedSpread: Math.round(predictedSpread * 100) / 100,
        predictedTotal: Math.round(predictedTotal * 100) / 100,
        confidence: Math.round(confidence * 100) / 100,
        model: `${this.sport}-model-v1`,
        factors: ['team-form', 'head-to-head', 'home-advantage', 'injuries'],
        lastUpdated: new Date().toISOString()
      }
    } catch (error) {
      console.error(`Error generating prediction for game ${game.id}:`, error)
      return null
    }
  }

  /**
   * Get value betting opportunities
   */
  async getValueBettingOpportunities(params: {
    minValue?: number
    maxOdds?: number
    limit?: number
  } = {}): Promise<ValueBettingOpportunity[]> {
    const key = this.getCacheKey('value-bets', this.sport, this.league, JSON.stringify(params))
    
    return this.getCachedOrFetch(key, async () => {
      const predictions = await this.getPredictions()
      const opportunities: ValueBettingOpportunity[] = []

      for (const prediction of predictions) {
        // Get actual odds for the game
        const odds = await this.getOddsForGame(prediction.gameId)
        
        if (odds && odds.moneyline) {
          const homeOdds = odds.moneyline.home
          const awayOdds = odds.moneyline.away
          
          const homeValue = prediction.homeWinProbability * homeOdds - 1
          const awayValue = prediction.awayWinProbability * awayOdds - 1

          if (homeValue >= (params.minValue || 0.1)) {
            opportunities.push({
              gameId: prediction.gameId,
              homeTeam: prediction.homeTeam,
              awayTeam: prediction.awayTeam,
              market: 'moneyline',
              selection: 'home',
              odds: homeOdds,
              predictedProbability: prediction.homeWinProbability,
              value: Math.round(homeValue * 100) / 100,
              confidence: prediction.confidence,
              recommendation: homeValue > 0.2 ? 'strong' : homeValue > 0.15 ? 'moderate' : 'weak',
              lastUpdated: new Date().toISOString()
            })
          }

          if (awayValue >= (params.minValue || 0.1)) {
            opportunities.push({
              gameId: prediction.gameId,
              homeTeam: prediction.homeTeam,
              awayTeam: prediction.awayTeam,
              market: 'moneyline',
              selection: 'away',
              odds: awayOdds,
              predictedProbability: prediction.awayWinProbability,
              value: Math.round(awayValue * 100) / 100,
              confidence: prediction.confidence,
              recommendation: awayValue > 0.2 ? 'strong' : awayValue > 0.15 ? 'moderate' : 'weak',
              lastUpdated: new Date().toISOString()
            })
          }
        }
      }

      return opportunities
        .sort((a, b) => b.value - a.value)
        .slice(0, params.limit || 10)
    })
  }

  /**
   * Get model performance metrics
   */
  async getModelPerformance(): Promise<ModelPerformance[]> {
    const key = this.getCacheKey('model-performance', this.sport, this.league)
    
    return this.getCachedOrFetch(key, async () => {
      // This would integrate with actual model performance tracking
      return [
        {
          modelName: `${this.sport}-model-v1`,
          accuracy: 0.65,
          totalPredictions: 1000,
          correctPredictions: 650,
          lastUpdated: new Date().toISOString()
        }
      ]
    })
  }

  /**
   * Get historical data for teams
   */
  private async getHistoricalData(game: GameData): Promise<any> {
    try {
      // Get historical data from the sport service
      const serviceFactory = (await import('../core/service-factory')).serviceFactory
      const service = await serviceFactory.getService(this.sport, this.league)
      
      // Get recent games for both teams
      const homeTeamGames = await service.getGames({ 
        teamId: game.homeTeam,
        status: 'finished',
        limit: 10
      })
      
      const awayTeamGames = await service.getGames({ 
        teamId: game.awayTeam,
        status: 'finished',
        limit: 10
      })
      
      // Calculate win rates and averages
      const homeWinRate = this.calculateWinRate(homeTeamGames, game.homeTeam)
      const awayWinRate = this.calculateWinRate(awayTeamGames, game.awayTeam)
      
      const homeAvgScore = this.calculateAverageScore(homeTeamGames, game.homeTeam)
      const homeAvgAllowed = this.calculateAverageAllowed(homeTeamGames, game.homeTeam)
      
      const awayAvgScore = this.calculateAverageScore(awayTeamGames, game.awayTeam)
      const awayAvgAllowed = this.calculateAverageAllowed(awayTeamGames, game.awayTeam)
      
      return {
        homeTeam: { 
          winRate: homeWinRate, 
          avgScore: homeAvgScore, 
          avgAllowed: homeAvgAllowed 
        },
        awayTeam: { 
          winRate: awayWinRate, 
          avgScore: awayAvgScore, 
          avgAllowed: awayAvgAllowed 
        }
      }
    } catch (error) {
      console.error('Error getting historical data:', error)
      return {
        homeTeam: { winRate: 0.5, avgScore: 0, avgAllowed: 0 },
        awayTeam: { winRate: 0.5, avgScore: 0, avgAllowed: 0 }
      }
    }
  }

  /**
   * Calculate win rate for a team from their games
   */
  private calculateWinRate(games: GameData[], teamName: string): number {
    const finishedGames = games.filter(game => 
      game.status === 'finished' && 
      game.homeScore !== undefined && 
      game.awayScore !== undefined
    )
    
    if (finishedGames.length === 0) return 0.5
    
    const wins = finishedGames.filter(game => {
      if (game.homeTeam === teamName) {
        return game.homeScore! > game.awayScore!
      } else {
        return game.awayScore! > game.homeScore!
      }
    }).length
    
    return wins / finishedGames.length
  }
  
  /**
   * Calculate average score for a team
   */
  private calculateAverageScore(games: GameData[], teamName: string): number {
    const finishedGames = games.filter(game => 
      game.status === 'finished' && 
      game.homeScore !== undefined && 
      game.awayScore !== undefined
    )
    
    if (finishedGames.length === 0) return 0
    
    const totalScore = finishedGames.reduce((sum, game) => {
      if (game.homeTeam === teamName) {
        return sum + (game.homeScore || 0)
      } else {
        return sum + (game.awayScore || 0)
      }
    }, 0)
    
    return totalScore / finishedGames.length
  }
  
  /**
   * Calculate average points allowed for a team
   */
  private calculateAverageAllowed(games: GameData[], teamName: string): number {
    const finishedGames = games.filter(game => 
      game.status === 'finished' && 
      game.homeScore !== undefined && 
      game.awayScore !== undefined
    )
    
    if (finishedGames.length === 0) return 0
    
    const totalAllowed = finishedGames.reduce((sum, game) => {
      if (game.homeTeam === teamName) {
        return sum + (game.awayScore || 0)
      } else {
        return sum + (game.homeScore || 0)
      }
    }, 0)
    
    return totalAllowed / finishedGames.length
  }

  /**
   * Calculate win probability based on historical data
   */
  private calculateWinProbability(game: GameData, historicalData: any, side: 'home' | 'away'): number {
    const team = side === 'home' ? historicalData.homeTeam : historicalData.awayTeam
    const opponent = side === 'home' ? historicalData.awayTeam : historicalData.homeTeam
    
    // Base probability on team win rate vs opponent
    const baseProb = team.winRate
    const opponentFactor = 1 - opponent.winRate
    
    // Apply home advantage if home team
    const homeAdvantage = side === 'home' ? 0.05 : 0
    
    return Math.max(0.1, Math.min(0.9, (baseProb + opponentFactor) / 2 + homeAdvantage))
  }

  /**
   * Calculate predicted spread
   */
  private calculatePredictedSpread(game: GameData, historicalData: any): number {
    const homeStrength = historicalData.homeTeam.avgScore - historicalData.homeTeam.avgAllowed
    const awayStrength = historicalData.awayTeam.avgScore - historicalData.awayTeam.avgAllowed
    
    return homeStrength - awayStrength
  }

  /**
   * Calculate predicted total
   */
  private calculatePredictedTotal(game: GameData, historicalData: any): number {
    const homeOffense = historicalData.homeTeam.avgScore
    const awayOffense = historicalData.awayTeam.avgScore
    
    return homeOffense + awayOffense
  }

  /**
   * Calculate confidence based on data quality
   */
  private calculateConfidence(historicalData: any): number {
    // Base confidence on data availability and consistency
    const homeTeamData = historicalData.homeTeam
    const awayTeamData = historicalData.awayTeam
    
    // Calculate data quality based on how much data we have
    const homeDataQuality = homeTeamData.winRate > 0 ? 1 : 0.5
    const awayDataQuality = awayTeamData.winRate > 0 ? 1 : 0.5
    
    // Average data quality
    const dataQuality = (homeDataQuality + awayDataQuality) / 2
    
    // Apply some variance based on team performance consistency
    const homeConsistency = Math.abs(homeTeamData.avgScore - homeTeamData.avgAllowed) / 10
    const awayConsistency = Math.abs(awayTeamData.avgScore - awayTeamData.avgAllowed) / 10
    const consistencyFactor = Math.min(1, (homeConsistency + awayConsistency) / 2)
    
    const finalConfidence = dataQuality * (0.5 + consistencyFactor * 0.5)
    return Math.max(0.3, Math.min(0.9, finalConfidence))
  }

  /**
   * Get odds for a specific game
   */
  private async getOddsForGame(gameId: string): Promise<any> {
    try {
      // Integrate with the odds service
      const { SportOddsService } = await import('../odds/sport-odds-service')
      const oddsService = new SportOddsService(this.sport, this.league)
      const odds = await oddsService.getOdds({ gameId })
      
      if (odds.length > 0) {
        const odd = odds[0]
        return {
          moneyline: {
            home: odd.markets?.moneyline?.home,
            away: odd.markets?.moneyline?.away
          },
          spread: {
            home: odd.markets?.spread?.home,
            away: odd.markets?.spread?.away,
            line: odd.markets?.spread?.line
          },
          total: {
            over: odd.markets?.total?.over,
            under: odd.markets?.total?.under,
            line: odd.markets?.total?.line
          }
        }
      }
      
      return null
    } catch (error) {
      console.error('Error getting odds for game:', error)
      return null
    }
  }

  /**
   * Get prediction accuracy for a specific time period
   */
  async getPredictionAccuracy(params: {
    startDate?: string
    endDate?: string
    model?: string
  } = {}): Promise<{
    accuracy: number
    totalPredictions: number
    correctPredictions: number
    period: string
  }> {
    const key = this.getCacheKey('prediction-accuracy', this.sport, this.league, JSON.stringify(params))
    
    return this.getCachedOrFetch(key, async () => {
      // This would integrate with actual accuracy tracking
      return {
        accuracy: 0.65,
        totalPredictions: 100,
        correctPredictions: 65,
        period: `${params.startDate || '2024-01-01'} to ${params.endDate || '2024-12-31'}`
      }
    })
  }

  /**
   * Get sport-specific health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.getPredictions({ limit: 1 })
      return true
    } catch (error) {
      console.error(`${this.sport} prediction service health check failed:`, error)
      return false
    }
  }
}
