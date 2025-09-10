/**
 * Prediction Service
 * Handles ML predictions and value betting opportunities
 */

import { sportsDataService } from './sports-data-service'

interface GameData {
  id: string
  homeTeam: string
  awayTeam: string
  date: string
  time?: string
  status: string
  homeScore?: number
  awayScore?: number
  league: string
  sport: string
  venue?: string
}

interface PredictionResult {
  gameId: string
  homeTeam: string
  awayTeam: string
  predictions: {
    homeWinProbability: number
    awayWinProbability: number
    predictedSpread: number
    predictedTotal: number
    confidence: number
  }
  valueBets: {
    type: 'moneyline' | 'spread' | 'total'
    side: 'home' | 'away' | 'over' | 'under'
    odds: number
    probability: number
    value: number
    recommendation: 'strong' | 'moderate' | 'weak'
  }[]
  modelInfo: {
    name: string
    version: string
    lastTrained: string
    accuracy: number
  }
}

interface ValueBettingOpportunity {
  gameId: string
  homeTeam: string
  awayTeam: string
  betType: string
  side: string
  odds: number
  probability: number
  value: number
  recommendation: 'strong' | 'moderate' | 'weak'
  expectedValue: number
  kellyPercentage: number
}

export class PredictionService {
  private modelAccuracy = {
    moneyline: 0.65,
    spread: 0.58,
    total: 0.55
  }

  private kellyThreshold = 0.05 // 5% minimum Kelly percentage for recommendations

  async generatePredictions(gameId: string): Promise<PredictionResult | null> {
    try {
      const game = await sportsDataService.getGameById(gameId)
      if (!game) {
        throw new Error('Game not found')
      }

      // Get historical data for both teams
      const homeTeamData = await this.getTeamHistoricalData(game.homeTeam)
      const awayTeamData = await this.getTeamHistoricalData(game.awayTeam)

      // Generate predictions using multiple models
      const predictions = await this.runPredictionModels(homeTeamData, awayTeamData, game)

      // Find value betting opportunities
      const valueBets = await this.findValueBets(game, predictions)

      return {
        gameId,
        homeTeam: game.homeTeam,
        awayTeam: game.awayTeam,
        predictions,
        valueBets,
        modelInfo: {
          name: 'ApexBets ML Ensemble',
          version: '1.0.0',
          lastTrained: new Date().toISOString(),
          accuracy: await this.calculateModelAccuracy(predictions)
        }
      }
    } catch (error) {
      console.error('Error generating predictions:', error)
      return null
    }
  }

  async findValueBettingOpportunities(sport: string = 'basketball'): Promise<ValueBettingOpportunity[]> {
    try {
      const games = await sportsDataService.getGames({ sport, status: 'scheduled' })
      const opportunities: ValueBettingOpportunity[] = []

      for (const game of games) {
        const prediction = await this.generatePredictions(game.id)
        if (prediction) {
          opportunities.push(...prediction.valueBets.map(bet => ({
            gameId: game.id,
            homeTeam: game.homeTeam,
            awayTeam: game.awayTeam,
            betType: bet.type,
            side: bet.side,
            odds: bet.odds,
            probability: bet.probability,
            value: bet.value,
            recommendation: bet.recommendation,
            expectedValue: this.calculateExpectedValue(bet.odds, bet.probability),
            kellyPercentage: this.calculateKellyPercentage(bet.odds, bet.probability)
          })))
        }
      }

      // Filter for strong recommendations and sort by value
      return opportunities
        .filter(opp => opp.recommendation === 'strong' && opp.kellyPercentage >= this.kellyThreshold)
        .sort((a, b) => b.value - a.value)
    } catch (error) {
      console.error('Error finding value betting opportunities:', error)
      return []
    }
  }

  private async getTeamHistoricalData(teamName: string): Promise<any> {
    try {
      // Fetch real team data from sports data service
      const teams = await sportsDataService.getTeams({ search: teamName })
      const team = teams.find(t => 
        t.name.toLowerCase().includes(teamName.toLowerCase()) ||
        t.abbreviation.toLowerCase() === teamName.toLowerCase()
      )
      
      if (!team) {
        return {
          name: teamName,
          recentGames: [],
          seasonStats: {
            wins: 0,
            losses: 0,
            pointsFor: 0,
            pointsAgainst: 0,
            homeRecord: { wins: 0, losses: 0 },
            awayRecord: { wins: 0, losses: 0 }
          },
          playerStats: [],
          trends: {
            recentForm: [],
            homeAdvantage: 0,
            restAdvantage: 0
          }
        }
      }

      // Get recent games for this team
      const recentGames = await sportsDataService.getGames({ 
        teamId: team.id,
        status: 'finished'
      })

      // Calculate real season stats from games
      const teamGames = recentGames.filter(game => 
        game.homeTeam.toLowerCase().includes(teamName.toLowerCase()) ||
        game.awayTeam.toLowerCase().includes(teamName.toLowerCase())
      )

      const wins = teamGames.filter(game => {
        const isHome = game.homeTeam.toLowerCase().includes(teamName.toLowerCase())
        return (isHome && game.homeScore && game.awayScore && game.homeScore > game.awayScore) ||
               (!isHome && game.homeScore && game.awayScore && game.awayScore > game.homeScore)
      }).length

      const losses = teamGames.length - wins
      const pointsFor = teamGames.reduce((sum, game) => {
        const isHome = game.homeTeam.toLowerCase().includes(teamName.toLowerCase())
        return sum + (isHome ? (game.homeScore || 0) : (game.awayScore || 0))
      }, 0)

      const pointsAgainst = teamGames.reduce((sum, game) => {
        const isHome = game.homeTeam.toLowerCase().includes(teamName.toLowerCase())
        return sum + (isHome ? (game.awayScore || 0) : (game.homeScore || 0))
      }, 0)

      const homeGames = teamGames.filter(game => 
        game.homeTeam.toLowerCase().includes(teamName.toLowerCase())
      )
      const homeWins = homeGames.filter(game => 
        game.homeScore && game.awayScore && game.homeScore > game.awayScore
      ).length

      const awayGames = teamGames.filter(game => 
        game.awayTeam.toLowerCase().includes(teamName.toLowerCase())
      )
      const awayWins = awayGames.filter(game => 
        game.homeScore && game.awayScore && game.awayScore > game.homeScore
      ).length

      return {
        name: teamName,
        recentGames: teamGames.slice(-10), // Last 10 games
        seasonStats: {
          wins,
          losses,
          pointsFor: teamGames.length > 0 ? pointsFor / teamGames.length : 0,
          pointsAgainst: teamGames.length > 0 ? pointsAgainst / teamGames.length : 0,
          homeRecord: { wins: homeWins, losses: homeGames.length - homeWins },
          awayRecord: { wins: awayWins, losses: awayGames.length - awayWins }
        },
        playerStats: [], // Would need separate player API calls
        trends: {
          recentForm: this.calculateRecentForm(teamGames, teamName),
          homeAdvantage: this.calculateHomeAdvantage(homeGames, awayGames),
          restAdvantage: 0 // Would need rest day data
        }
      }
    } catch (error) {
      console.error('Error fetching team historical data:', error)
      return {
        name: teamName,
        recentGames: [],
        seasonStats: {
          wins: 0,
          losses: 0,
          pointsFor: 0,
          pointsAgainst: 0,
          homeRecord: { wins: 0, losses: 0 },
          awayRecord: { wins: 0, losses: 0 }
        },
        playerStats: [],
        trends: {
          recentForm: [],
          homeAdvantage: 0,
          restAdvantage: 0
        }
      }
    }
  }

  private async runPredictionModels(homeTeam: any, awayTeam: any, game: GameData): Promise<any> {
    // Simplified prediction logic - in production, this would use trained ML models
    const homeWinProbability = this.calculateWinProbability(homeTeam, awayTeam, true)
    const predictedSpread = this.calculatePredictedSpread(homeTeam, awayTeam)
    const predictedTotal = this.calculatePredictedTotal(homeTeam, awayTeam)
    const confidence = this.calculateConfidence(homeTeam, awayTeam)

    return {
      homeWinProbability,
      awayWinProbability: 1 - homeWinProbability,
      predictedSpread,
      predictedTotal,
      confidence
    }
  }

  private calculateWinProbability(homeTeam: any, awayTeam: any, isHome: boolean): number {
    // Simplified calculation - replace with actual ML model
    const homeAdvantage = isHome ? 0.05 : -0.05
    const baseProbability = 0.5 + (homeTeam.seasonStats?.winPercentage || 0.5) - (awayTeam.seasonStats?.winPercentage || 0.5)
    return Math.max(0.1, Math.min(0.9, baseProbability + homeAdvantage))
  }

  private calculatePredictedSpread(homeTeam: any, awayTeam: any): number {
    // Simplified spread calculation
    const homePoints = homeTeam.seasonStats?.pointsFor || 100
    const awayPoints = awayTeam.seasonStats?.pointsFor || 100
    const homeAllowed = homeTeam.seasonStats?.pointsAgainst || 100
    const awayAllowed = awayTeam.seasonStats?.pointsAgainst || 100
    
    const homeOffensiveRating = homePoints / (homePoints + homeAllowed)
    const awayOffensiveRating = awayPoints / (awayPoints + awayAllowed)
    
    return (homeOffensiveRating - awayOffensiveRating) * 20 // Scale to typical spread range
  }

  private calculatePredictedTotal(homeTeam: any, awayTeam: any): number {
    // Simplified total calculation
    const homePace = homeTeam.seasonStats?.pointsFor || 100
    const awayPace = awayTeam.seasonStats?.pointsFor || 100
    const homeDefense = homeTeam.seasonStats?.pointsAgainst || 100
    const awayDefense = awayTeam.seasonStats?.pointsAgainst || 100
    
    return (homePace + awayPace + homeDefense + awayDefense) / 4
  }

  private calculateConfidence(homeTeam: any, awayTeam: any): number {
    // Confidence based on data quality and team consistency
    const dataQuality = 0.8 // Would be calculated based on available data
    const teamConsistency = 0.7 // Would be calculated based on recent performance variance
    return (dataQuality + teamConsistency) / 2
  }

  private async findValueBets(game: GameData, predictions: any): Promise<any[]> {
    const valueBets: any[] = []
    
    try {
      // Get current odds for the game
      const odds = await sportsDataService.getOdds({ gameId: game.id })
      
      for (const odd of odds) {
        for (const bookmaker of odd.bookmakers) {
          for (const market of bookmaker.markets) {
            if (market.key === 'h2h') {
              // Moneyline bets
              for (const outcome of market.outcomes) {
                const isHome = outcome.name === game.homeTeam
                const probability = isHome ? predictions.homeWinProbability : predictions.awayWinProbability
                const value = this.calculateValue(outcome.price, probability)
                
                if (value > 0.1) { // 10% value threshold
                  valueBets.push({
                    type: 'moneyline',
                    side: isHome ? 'home' : 'away',
                    odds: outcome.price,
                    probability,
                    value,
                    recommendation: this.getRecommendationLevel(value)
                  })
                }
              }
            } else if (market.key === 'spreads') {
              // Spread bets
              for (const outcome of market.outcomes) {
                const isHome = outcome.name === game.homeTeam
                const spreadProbability = this.calculateSpreadProbability(
                  predictions.predictedSpread,
                  outcome.point || 0,
                  isHome
                )
                const value = this.calculateValue(outcome.price, spreadProbability)
                
                if (value > 0.1) {
                  valueBets.push({
                    type: 'spread',
                    side: isHome ? 'home' : 'away',
                    odds: outcome.price,
                    probability: spreadProbability,
                    value,
                    recommendation: this.getRecommendationLevel(value)
                  })
                }
              }
            } else if (market.key === 'totals') {
              // Total bets
              for (const outcome of market.outcomes) {
                const isOver = outcome.name.includes('Over')
                const totalProbability = this.calculateTotalProbability(
                  predictions.predictedTotal,
                  outcome.point || 0,
                  isOver
                )
                const value = this.calculateValue(outcome.price, totalProbability)
                
                if (value > 0.1) {
                  valueBets.push({
                    type: 'total',
                    side: isOver ? 'over' : 'under',
                    odds: outcome.price,
                    probability: totalProbability,
                    value,
                    recommendation: this.getRecommendationLevel(value)
                  })
                }
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Error finding value bets:', error)
    }
    
    return valueBets
  }

  private calculateValue(odds: number, probability: number): number {
    // Convert American odds to decimal odds
    const decimalOdds = odds > 0 ? (odds / 100) + 1 : (100 / Math.abs(odds)) + 1
    return (probability * decimalOdds) - 1
  }

  private calculateSpreadProbability(predictedSpread: number, actualSpread: number, isHome: boolean): number {
    const spreadDiff = isHome ? predictedSpread - actualSpread : actualSpread - predictedSpread
    // Simplified probability calculation based on spread difference
    return 0.5 + (spreadDiff * 0.02) // 2% per point difference
  }

  private calculateTotalProbability(predictedTotal: number, actualTotal: number, isOver: boolean): number {
    const totalDiff = isOver ? predictedTotal - actualTotal : actualTotal - predictedTotal
    // Simplified probability calculation based on total difference
    return 0.5 + (totalDiff * 0.01) // 1% per point difference
  }

  private getRecommendationLevel(value: number): 'strong' | 'moderate' | 'weak' {
    if (value > 0.2) return 'strong'
    if (value > 0.1) return 'moderate'
    return 'weak'
  }

  private calculateExpectedValue(odds: number, probability: number): number {
    const decimalOdds = odds > 0 ? (odds / 100) + 1 : (100 / Math.abs(odds)) + 1
    return (probability * (decimalOdds - 1)) - ((1 - probability) * 1)
  }

  private calculateKellyPercentage(odds: number, probability: number): number {
    const decimalOdds = odds > 0 ? (odds / 100) + 1 : (100 / Math.abs(odds)) + 1
    const b = decimalOdds - 1
    const p = probability
    const q = 1 - probability
    return (b * p - q) / b
  }

  private async calculateModelAccuracy(predictions: any): Promise<number> {
    // Calculate accuracy based on historical data
    const historicalPredictions = await this.getHistoricalPredictions()
    if (historicalPredictions.length === 0) {
      return 0.65 // Default accuracy if no historical data
    }
    
    const correct = historicalPredictions.filter((p: any) => p.correct).length
    return correct / historicalPredictions.length
  }

  private calculateRecentForm(games: any[], teamName: string): string[] {
    return games.slice(-5).map(game => {
      const isHome = game.homeTeam.toLowerCase().includes(teamName.toLowerCase())
      const won = (isHome && game.homeScore && game.awayScore && game.homeScore > game.awayScore) ||
                  (!isHome && game.homeScore && game.awayScore && game.awayScore > game.homeScore)
      return won ? 'W' : 'L'
    })
  }

  private calculateHomeAdvantage(homeGames: any[], awayGames: any[]): number {
    if (homeGames.length === 0 || awayGames.length === 0) return 0
    
    const homeWinRate = homeGames.filter(game => 
      game.homeScore && game.awayScore && game.homeScore > game.awayScore
    ).length / homeGames.length
    
    const awayWinRate = awayGames.filter(game => 
      game.homeScore && game.awayScore && game.awayScore > game.homeScore
    ).length / awayGames.length
    
    return homeWinRate - awayWinRate
  }

  private async getHistoricalPredictions(): Promise<any[]> {
    // This would fetch from your database
    // For now, return empty array - will be populated by actual predictions
    return []
  }
}

export const predictionService = new PredictionService()
