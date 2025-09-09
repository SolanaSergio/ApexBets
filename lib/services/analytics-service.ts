/**
 * Analytics Service
 * Provides comprehensive analytics and insights for the sports betting platform
 */

import { sportsDataService, type GameData } from './sports-data-service'
import { predictionService, type PredictionResult } from './prediction-service'

interface AnalyticsOverview {
  totalGames: number
  totalPredictions: number
  accuracyRate: number
  totalValueBets: number
  averageValue: number
  profitLoss: number
  winRate: number
  roi: number
}

interface PerformanceMetrics {
  daily: {
    date: string
    predictions: number
    correct: number
    accuracy: number
    value: number
  }[]
  weekly: {
    week: string
    predictions: number
    correct: number
    accuracy: number
    value: number
  }[]
  monthly: {
    month: string
    predictions: number
    correct: number
    accuracy: number
    value: number
  }[]
}

interface TeamAnalytics {
  teamId: string
  teamName: string
  gamesPlayed: number
  wins: number
  losses: number
  winPercentage: number
  averagePointsFor: number
  averagePointsAgainst: number
  pointDifferential: number
  homeRecord: { wins: number; losses: number }
  awayRecord: { wins: number; losses: number }
  recentForm: string[]
  trends: {
    overUnder: { over: number; under: number; push: number }
    againstSpread: { cover: number; push: number; notCover: number }
  }
}

interface PredictionAccuracy {
  modelName: string
  totalPredictions: number
  correctPredictions: number
  accuracy: number
  byType: {
    moneyline: { total: number; correct: number; accuracy: number }
    spread: { total: number; correct: number; accuracy: number }
    total: { total: number; correct: number; accuracy: number }
  }
  byConfidence: {
    high: { total: number; correct: number; accuracy: number }
    medium: { total: number; correct: number; accuracy: number }
    low: { total: number; correct: number; accuracy: number }
  }
}

interface ValueBettingStats {
  totalOpportunities: number
  strongRecommendations: number
  moderateRecommendations: number
  weakRecommendations: number
  averageValue: number
  bestValue: number
  worstValue: number
  byType: {
    moneyline: { count: number; averageValue: number }
    spread: { count: number; averageValue: number }
    total: { count: number; averageValue: number }
  }
}

export class AnalyticsService {
  private mockData = {
    totalGames: 0,
    totalPredictions: 0,
    correctPredictions: 0,
    totalValueBets: 0,
    totalValue: 0,
    profitLoss: 0
  }

  async getAnalyticsOverview(): Promise<AnalyticsOverview> {
    try {
      // In a real implementation, this would fetch from your database
      const games = await sportsDataService.getGames()
      const predictions = await this.getHistoricalPredictions()
      const valueBets = await this.getHistoricalValueBets()

      const accuracyRate = predictions.length > 0 ? 
        (this.mockData.correctPredictions / this.mockData.totalPredictions) : 0

      const averageValue = valueBets.length > 0 ? 
        (this.mockData.totalValue / this.mockData.totalValueBets) : 0

      const winRate = valueBets.length > 0 ? 
        (valueBets.filter(bet => bet.profit > 0).length / valueBets.length) : 0

      const roi = this.mockData.totalPredictions > 0 ? 
        (this.mockData.profitLoss / this.mockData.totalPredictions) : 0

      return {
        totalGames: games.length,
        totalPredictions: this.mockData.totalPredictions,
        accuracyRate,
        totalValueBets: this.mockData.totalValueBets,
        averageValue,
        profitLoss: this.mockData.profitLoss,
        winRate,
        roi
      }
    } catch (error) {
      console.error('Error getting analytics overview:', error)
      return {
        totalGames: 0,
        totalPredictions: 0,
        accuracyRate: 0,
        totalValueBets: 0,
        averageValue: 0,
        profitLoss: 0,
        winRate: 0,
        roi: 0
      }
    }
  }

  async getPerformanceMetrics(): Promise<PerformanceMetrics> {
    try {
      // Generate mock performance data
      const daily = this.generateDailyMetrics()
      const weekly = this.generateWeeklyMetrics()
      const monthly = this.generateMonthlyMetrics()

      return { daily, weekly, monthly }
    } catch (error) {
      console.error('Error getting performance metrics:', error)
      return { daily: [], weekly: [], monthly: [] }
    }
  }

  async getTeamAnalytics(teamId: string): Promise<TeamAnalytics | null> {
    try {
      const games = await sportsDataService.getGames({ teamId })
      if (games.length === 0) return null

      const teamGames = games.filter(game => 
        game.homeTeam.toLowerCase().includes(teamId.toLowerCase()) ||
        game.awayTeam.toLowerCase().includes(teamId.toLowerCase())
      )

      const wins = teamGames.filter(game => {
        const isHome = game.homeTeam.toLowerCase().includes(teamId.toLowerCase())
        return (isHome && game.homeScore && game.awayScore && game.homeScore > game.awayScore) ||
               (!isHome && game.homeScore && game.awayScore && game.awayScore > game.homeScore)
      }).length

      const losses = teamGames.length - wins
      const winPercentage = teamGames.length > 0 ? wins / teamGames.length : 0

      const homeGames = teamGames.filter(game => 
        game.homeTeam.toLowerCase().includes(teamId.toLowerCase())
      )
      const homeWins = homeGames.filter(game => 
        game.homeScore && game.awayScore && game.homeScore > game.awayScore
      ).length

      const awayGames = teamGames.filter(game => 
        game.awayTeam.toLowerCase().includes(teamId.toLowerCase())
      )
      const awayWins = awayGames.filter(game => 
        game.homeScore && game.awayScore && game.awayScore > game.homeScore
      ).length

      return {
        teamId,
        teamName: teamGames[0]?.homeTeam || teamGames[0]?.awayTeam || 'Unknown',
        gamesPlayed: teamGames.length,
        wins,
        losses,
        winPercentage,
        averagePointsFor: this.calculateAveragePoints(teamGames, teamId, 'for'),
        averagePointsAgainst: this.calculateAveragePoints(teamGames, teamId, 'against'),
        pointDifferential: this.calculatePointDifferential(teamGames, teamId),
        homeRecord: { wins: homeWins, losses: homeGames.length - homeWins },
        awayRecord: { wins: awayWins, losses: awayGames.length - awayWins },
        recentForm: this.calculateRecentForm(teamGames, teamId),
        trends: {
          overUnder: this.calculateOverUnderTrends(teamGames),
          againstSpread: this.calculateSpreadTrends(teamGames, teamId)
        }
      }
    } catch (error) {
      console.error('Error getting team analytics:', error)
      return null
    }
  }

  async getPredictionAccuracy(): Promise<PredictionAccuracy> {
    try {
      const predictions = await this.getHistoricalPredictions()
      
      const moneyline = this.calculateAccuracyByType(predictions, 'moneyline')
      const spread = this.calculateAccuracyByType(predictions, 'spread')
      const total = this.calculateAccuracyByType(predictions, 'total')

      const highConfidence = this.calculateAccuracyByConfidence(predictions, 'high')
      const mediumConfidence = this.calculateAccuracyByConfidence(predictions, 'medium')
      const lowConfidence = this.calculateAccuracyByConfidence(predictions, 'low')

      return {
        modelName: 'ApexBets ML Ensemble',
        totalPredictions: predictions.length,
        correctPredictions: predictions.filter(p => p.correct).length,
        accuracy: predictions.length > 0 ? 
          predictions.filter(p => p.correct).length / predictions.length : 0,
        byType: { moneyline, spread, total },
        byConfidence: { high: highConfidence, medium: mediumConfidence, low: lowConfidence }
      }
    } catch (error) {
      console.error('Error getting prediction accuracy:', error)
      return {
        modelName: 'ApexBets ML Ensemble',
        totalPredictions: 0,
        correctPredictions: 0,
        accuracy: 0,
        byType: {
          moneyline: { total: 0, correct: 0, accuracy: 0 },
          spread: { total: 0, correct: 0, accuracy: 0 },
          total: { total: 0, correct: 0, accuracy: 0 }
        },
        byConfidence: {
          high: { total: 0, correct: 0, accuracy: 0 },
          medium: { total: 0, correct: 0, accuracy: 0 },
          low: { total: 0, correct: 0, accuracy: 0 }
        }
      }
    }
  }

  async getValueBettingStats(): Promise<ValueBettingStats> {
    try {
      const valueBets = await this.getHistoricalValueBets()
      
      const strong = valueBets.filter(bet => bet.recommendation === 'strong')
      const moderate = valueBets.filter(bet => bet.recommendation === 'moderate')
      const weak = valueBets.filter(bet => bet.recommendation === 'weak')

      const moneyline = valueBets.filter(bet => bet.type === 'moneyline')
      const spread = valueBets.filter(bet => bet.type === 'spread')
      const total = valueBets.filter(bet => bet.type === 'total')

      return {
        totalOpportunities: valueBets.length,
        strongRecommendations: strong.length,
        moderateRecommendations: moderate.length,
        weakRecommendations: weak.length,
        averageValue: valueBets.length > 0 ? 
          valueBets.reduce((sum, bet) => sum + bet.value, 0) / valueBets.length : 0,
        bestValue: valueBets.length > 0 ? Math.max(...valueBets.map(bet => bet.value)) : 0,
        worstValue: valueBets.length > 0 ? Math.min(...valueBets.map(bet => bet.value)) : 0,
        byType: {
          moneyline: {
            count: moneyline.length,
            averageValue: moneyline.length > 0 ? 
              moneyline.reduce((sum, bet) => sum + bet.value, 0) / moneyline.length : 0
          },
          spread: {
            count: spread.length,
            averageValue: spread.length > 0 ? 
              spread.reduce((sum, bet) => sum + bet.value, 0) / spread.length : 0
          },
          total: {
            count: total.length,
            averageValue: total.length > 0 ? 
              total.reduce((sum, bet) => sum + bet.value, 0) / total.length : 0
          }
        }
      }
    } catch (error) {
      console.error('Error getting value betting stats:', error)
      return {
        totalOpportunities: 0,
        strongRecommendations: 0,
        moderateRecommendations: 0,
        weakRecommendations: 0,
        averageValue: 0,
        bestValue: 0,
        worstValue: 0,
        byType: {
          moneyline: { count: 0, averageValue: 0 },
          spread: { count: 0, averageValue: 0 },
          total: { count: 0, averageValue: 0 }
        }
      }
    }
  }

  // Helper methods
  private async getHistoricalPredictions(): Promise<any[]> {
    // In a real implementation, this would fetch from your database
    return []
  }

  private async getHistoricalValueBets(): Promise<any[]> {
    // In a real implementation, this would fetch from your database
    return []
  }

  private generateDailyMetrics() {
    const daily = []
    for (let i = 29; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      daily.push({
        date: date.toISOString().split('T')[0],
        predictions: Math.floor(Math.random() * 20) + 5,
        correct: Math.floor(Math.random() * 15) + 3,
        accuracy: Math.random() * 0.4 + 0.5,
        value: Math.random() * 100 - 50
      })
    }
    return daily
  }

  private generateWeeklyMetrics() {
    const weekly = []
    for (let i = 11; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - (i * 7))
      weekly.push({
        week: date.toISOString().split('T')[0],
        predictions: Math.floor(Math.random() * 100) + 20,
        correct: Math.floor(Math.random() * 80) + 10,
        accuracy: Math.random() * 0.4 + 0.5,
        value: Math.random() * 500 - 250
      })
    }
    return weekly
  }

  private generateMonthlyMetrics() {
    const monthly = []
    for (let i = 11; i >= 0; i--) {
      const date = new Date()
      date.setMonth(date.getMonth() - i)
      monthly.push({
        month: date.toISOString().substring(0, 7),
        predictions: Math.floor(Math.random() * 400) + 100,
        correct: Math.floor(Math.random() * 300) + 50,
        accuracy: Math.random() * 0.4 + 0.5,
        value: Math.random() * 2000 - 1000
      })
    }
    return monthly
  }

  private calculateAveragePoints(games: GameData[], teamId: string, type: 'for' | 'against'): number {
    const teamGames = games.filter(game => 
      game.homeTeam.toLowerCase().includes(teamId.toLowerCase()) ||
      game.awayTeam.toLowerCase().includes(teamId.toLowerCase())
    )

    if (teamGames.length === 0) return 0

    const totalPoints = teamGames.reduce((sum, game) => {
      const isHome = game.homeTeam.toLowerCase().includes(teamId.toLowerCase())
      const points = type === 'for' ? 
        (isHome ? game.homeScore : game.awayScore) : 
        (isHome ? game.awayScore : game.homeScore)
      return sum + (points || 0)
    }, 0)

    return totalPoints / teamGames.length
  }

  private calculatePointDifferential(games: GameData[], teamId: string): number {
    const pointsFor = this.calculateAveragePoints(games, teamId, 'for')
    const pointsAgainst = this.calculateAveragePoints(games, teamId, 'against')
    return pointsFor - pointsAgainst
  }

  private calculateRecentForm(games: GameData[], teamId: string): string[] {
    const teamGames = games
      .filter(game => 
        game.homeTeam.toLowerCase().includes(teamId.toLowerCase()) ||
        game.awayTeam.toLowerCase().includes(teamId.toLowerCase())
      )
      .slice(-5) // Last 5 games

    return teamGames.map(game => {
      const isHome = game.homeTeam.toLowerCase().includes(teamId.toLowerCase())
      const won = (isHome && game.homeScore && game.awayScore && game.homeScore > game.awayScore) ||
                  (!isHome && game.homeScore && game.awayScore && game.awayScore > game.homeScore)
      return won ? 'W' : 'L'
    })
  }

  private calculateOverUnderTrends(games: GameData[]): { over: number; under: number; push: number } {
    // Simplified calculation - in reality, you'd need the actual totals
    return { over: 0, under: 0, push: 0 }
  }

  private calculateSpreadTrends(games: GameData[], teamId: string): { cover: number; push: number; notCover: number } {
    // Simplified calculation - in reality, you'd need the actual spreads
    return { cover: 0, push: 0, notCover: 0 }
  }

  private calculateAccuracyByType(predictions: any[], type: string): { total: number; correct: number; accuracy: number } {
    const typePredictions = predictions.filter(p => p.type === type)
    const correct = typePredictions.filter(p => p.correct).length
    return {
      total: typePredictions.length,
      correct,
      accuracy: typePredictions.length > 0 ? correct / typePredictions.length : 0
    }
  }

  private calculateAccuracyByConfidence(predictions: any[], confidence: string): { total: number; correct: number; accuracy: number } {
    const confidencePredictions = predictions.filter(p => p.confidence === confidence)
    const correct = confidencePredictions.filter(p => p.correct).length
    return {
      total: confidencePredictions.length,
      correct,
      accuracy: confidencePredictions.length > 0 ? correct / confidencePredictions.length : 0
    }
  }
}

export const analyticsService = new AnalyticsService()
