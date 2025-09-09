/**
 * Real-time Service
 * Handles live updates for scores, odds, and predictions
 */

import { sportsDataService } from './sports-data-service'
import { predictionService } from './prediction-service'

interface LiveUpdate {
  type: 'score' | 'odds' | 'prediction' | 'status'
  gameId: string
  data: any
  timestamp: string
}

interface Subscription {
  id: string
  type: 'games' | 'odds' | 'predictions' | 'live-scores'
  filters?: Record<string, any>
  callback: (update: LiveUpdate) => void
}

export class RealTimeService {
  private subscriptions = new Map<string, Subscription>()
  private updateInterval: NodeJS.Timeout | null = null
  private isRunning = false
  private readonly UPDATE_INTERVAL = 30000 // 30 seconds

  constructor() {
    this.start()
  }

  private start() {
    if (this.isRunning) return
    
    this.isRunning = true
    this.updateInterval = setInterval(() => {
      this.checkForUpdates()
    }, this.UPDATE_INTERVAL)
  }

  private stop() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval)
      this.updateInterval = null
    }
    this.isRunning = false
  }

  private async checkForUpdates() {
    try {
      // Check for live score updates
      const liveGames = await sportsDataService.getLiveGames()
      
      for (const game of liveGames) {
        this.notifySubscribers('live-scores', {
          type: 'score',
          gameId: game.id,
          data: {
            homeTeam: game.homeTeam,
            awayTeam: game.awayTeam,
            homeScore: game.homeScore,
            awayScore: game.awayScore,
            status: game.status,
            time: game.time
          },
          timestamp: new Date().toISOString()
        })
      }

      // Check for odds updates
      const odds = await sportsDataService.getOdds({ sport: 'basketball_nba' })
      
      for (const odd of odds) {
        this.notifySubscribers('odds', {
          type: 'odds',
          gameId: odd.id,
          data: {
            homeTeam: odd.home_team,
            awayTeam: odd.away_team,
            bookmakers: odd.bookmakers
          },
          timestamp: new Date().toISOString()
        })
      }

    } catch (error) {
      console.error('Error checking for updates:', error)
    }
  }

  private notifySubscribers(type: string, update: LiveUpdate) {
    for (const subscription of this.subscriptions.values()) {
      if (subscription.type === type || subscription.type === 'games') {
        try {
          subscription.callback(update)
        } catch (error) {
          console.error('Error in subscription callback:', error)
        }
      }
    }
  }

  subscribe(subscription: Omit<Subscription, 'id'>): string {
    const id = Math.random().toString(36).substr(2, 9)
    this.subscriptions.set(id, { ...subscription, id })
    return id
  }

  unsubscribe(id: string): boolean {
    return this.subscriptions.delete(id)
  }

  async getLiveScores(): Promise<LiveUpdate[]> {
    try {
      const liveGames = await sportsDataService.getLiveGames()
      return liveGames.map(game => ({
        type: 'score' as const,
        gameId: game.id,
        data: {
          homeTeam: game.homeTeam,
          awayTeam: game.awayTeam,
          homeScore: game.homeScore,
          awayScore: game.awayScore,
          status: game.status,
          time: game.time
        },
        timestamp: new Date().toISOString()
      }))
    } catch (error) {
      console.error('Error getting live scores:', error)
      return []
    }
  }

  async getLiveOdds(): Promise<LiveUpdate[]> {
    try {
      const odds = await sportsDataService.getOdds({ sport: 'basketball_nba' })
      return odds.map(odd => ({
        type: 'odds' as const,
        gameId: odd.id,
        data: {
          homeTeam: odd.home_team,
          awayTeam: odd.away_team,
          bookmakers: odd.bookmakers
        },
        timestamp: new Date().toISOString()
      }))
    } catch (error) {
      console.error('Error getting live odds:', error)
      return []
    }
  }

  async getValueBettingOpportunities(): Promise<LiveUpdate[]> {
    try {
      const opportunities = await predictionService.findValueBettingOpportunities()
      return opportunities.map(opp => ({
        type: 'prediction' as const,
        gameId: opp.gameId,
        data: {
          homeTeam: opp.homeTeam,
          awayTeam: opp.awayTeam,
          betType: opp.betType,
          side: opp.side,
          odds: opp.odds,
          value: opp.value,
          recommendation: opp.recommendation
        },
        timestamp: new Date().toISOString()
      }))
    } catch (error) {
      console.error('Error getting value betting opportunities:', error)
      return []
    }
  }

  // WebSocket-like interface for real-time updates
  createWebSocketConnection(): {
    send: (message: any) => void
    close: () => void
    onMessage: (callback: (message: any) => void) => void
  } {
    let messageCallback: ((message: any) => void) | null = null

    const subscriptionId = this.subscribe({
      type: 'games',
      callback: (update) => {
        if (messageCallback) {
          messageCallback(update)
        }
      }
    })

    return {
      send: (message: any) => {
        // Handle incoming messages if needed
        console.log('Received message:', message)
      },
      close: () => {
        this.unsubscribe(subscriptionId)
      },
      onMessage: (callback: (message: any) => void) => {
        messageCallback = callback
      }
    }
  }

  // Cleanup
  destroy() {
    this.stop()
    this.subscriptions.clear()
  }
}

export const realTimeService = new RealTimeService()
