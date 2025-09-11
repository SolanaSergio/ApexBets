/**
 * SPORT ODDS SERVICE
 * Sport-specific odds management and integration
 */

import { BaseService, ServiceConfig } from '../core/base-service'
import { serviceFactory, SupportedSport } from '../core/service-factory'

export interface OddsData {
  gameId: string
  homeTeam: string
  awayTeam: string
  markets: {
    moneyline?: {
      home: number
      away: number
    }
    spread?: {
      home: number
      away: number
      line: number
    }
    total?: {
      over: number
      under: number
      line: number
    }
  }
  bookmaker: string
  lastUpdated: string
}

export class SportOddsService extends BaseService {
  private sport: SupportedSport
  private league: string

  constructor(sport: SupportedSport, league?: string) {
    const config: ServiceConfig = {
      name: `odds-${sport}`,
      cacheTTL: 5 * 60 * 1000, // 5 minutes
      rateLimitService: 'odds',
      retryAttempts: 2,
      retryDelay: 1000
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
   * Get odds for games
   */
  async getOdds(params: {
    gameId?: string
    date?: string
    markets?: string[]
    limit?: number
  } = {}): Promise<OddsData[]> {
    const key = this.getCacheKey('odds', this.sport, this.league, JSON.stringify(params))
    
    return this.getCachedOrFetch(key, async () => {
      // Get games from the sport service
      const service = await serviceFactory.getService(this.sport, this.league)
      
      let games
      if (params.gameId) {
        const game = await service.getGameById(params.gameId)
        games = game ? [game] : []
      } else {
        games = await service.getGames({
          date: params.date,
          status: 'scheduled'
        })
      }

      const odds: OddsData[] = []

      for (const game of games.slice(0, params.limit || 10)) {
        const gameOdds = await this.fetchOddsForGame(game)
        if (gameOdds) {
          odds.push(gameOdds)
        }
      }

      return odds
    })
  }

  /**
   * Fetch odds for a specific game
   */
  private async fetchOddsForGame(game: any): Promise<OddsData | null> {
    try {
      // Fetch real odds data from database using Supabase MCP
      const { createClient } = await import('@/lib/supabase/server')
      const supabase = await createClient()
      
      if (!supabase) {
        throw new Error('Database connection failed')
      }

      const { data: odds, error } = await supabase
        .from('odds')
        .select('*')
        .eq('game_id', game.id)
        .eq('sport', this.sport)
        .eq('league', this.league)
        .order('last_updated', { ascending: false })
        .limit(1)

      if (error || !odds || odds.length === 0) {
        // If no odds data available, return null instead of mock data
        return null
      }

      const oddsData = odds[0]
      
      return {
        gameId: game.id,
        homeTeam: game.home_team?.name || game.homeTeam || 'Unknown',
        awayTeam: game.away_team?.name || game.awayTeam || 'Unknown',
        markets: {
          moneyline: oddsData.moneyline ? {
            home: oddsData.moneyline.home,
            away: oddsData.moneyline.away
          } : undefined,
          spread: oddsData.spread ? {
            home: oddsData.spread.home,
            away: oddsData.spread.away,
            line: oddsData.spread.line
          } : undefined,
          total: oddsData.total ? {
            over: oddsData.total.over,
            under: oddsData.total.under,
            line: oddsData.total.line
          } : undefined
        },
        bookmaker: oddsData.bookmaker || 'Unknown',
        lastUpdated: oddsData.last_updated || new Date().toISOString()
      }
    } catch (error) {
      console.error(`Error fetching odds for game ${game.id}:`, error)
      return null
    }
  }

  /**
   * Get live odds for in-progress games
   */
  async getLiveOdds(): Promise<OddsData[]> {
    const key = this.getCacheKey('live-odds', this.sport, this.league)
    
    return this.getCachedOrFetch(key, async () => {
      const service = await serviceFactory.getService(this.sport, this.league)
      const liveGames = await service.getLiveGames()
      
      const odds: OddsData[] = []
      for (const game of liveGames) {
        const gameOdds = await this.fetchOddsForGame(game)
        if (gameOdds) {
          odds.push(gameOdds)
        }
      }
      
      return odds
    })
  }

  /**
   * Get odds history for a game
   */
  async getOddsHistory(gameId: string): Promise<OddsData[]> {
    const key = this.getCacheKey('odds-history', gameId)
    
    return this.getCachedOrFetch(key, async () => {
      // This would fetch historical odds data
      return []
    })
  }

  /**
   * Get available betting markets
   */
  async getBettingMarkets(): Promise<any[]> {
    const key = this.getCacheKey('betting-markets', this.sport, this.league)
    
    return this.getCachedOrFetch(key, async () => {
      // Return sport-specific betting markets
      const baseMarkets = [
        { id: 'moneyline', name: 'Moneyline', description: 'Win/Lose betting' },
        { id: 'spread', name: 'Point Spread', description: 'Point spread betting' },
        { id: 'total', name: 'Over/Under', description: 'Total points/goals betting' }
      ]

      // Add sport-specific markets
      const sportMarkets = await this.getSportSpecificMarkets()
      
      return [...baseMarkets, ...sportMarkets]
    })
  }

  /**
   * Get value betting analysis
   */
  async getValueBettingAnalysis(params: { minValue?: number; limit?: number } = {}): Promise<any[]> {
    const key = this.getCacheKey('value-betting-analysis', this.sport, this.league, JSON.stringify(params))
    
    return this.getCachedOrFetch(key, async () => {
      const odds = await this.getOdds({ limit: params.limit || 10 })
      
      return odds
        .filter(odd => this.calculateValue(odd) >= (params.minValue || 0.1))
        .map(odd => ({
          gameId: odd.gameId,
          sport: this.sport,
          league: this.league,
          value: this.calculateValue(odd),
          recommendation: this.getRecommendation(odd),
          expectedReturn: this.calculateExpectedReturn(odd),
          lastUpdated: odd.lastUpdated
        }))
    })
  }

  /**
   * Get odds comparison across bookmakers
   */
  async getOddsComparison(gameId: string): Promise<any> {
    const key = this.getCacheKey('odds-comparison', gameId)
    
    return this.getCachedOrFetch(key, async () => {
      const odds = await this.getOdds({ gameId })
      
      if (odds.length === 0) {
        return null
      }

      const gameOdds = odds[0]
      
      return {
        gameId,
        sport: this.sport,
        league: this.league,
        homeTeam: gameOdds.homeTeam,
        awayTeam: gameOdds.awayTeam,
        bestOdds: this.findBestOdds(gameOdds),
        comparison: this.buildComparisonData(gameOdds),
        lastUpdated: gameOdds.lastUpdated
      }
    })
  }

  /**
   * Get sport-specific betting markets dynamically
   */
  private async getSportSpecificMarkets(): Promise<any[]> {
    try {
      const { SportConfigManager } = await import('../core/sport-config')
      return await SportConfigManager.getBettingMarkets(this.sport)
    } catch (error) {
      console.error(`Error getting betting markets for ${this.sport}:`, error)
      return []
    }
  }

  /**
   * Calculate value for odds
   */
  private calculateValue(odds: OddsData): number {
    // Simplified value calculation
    const homeOdds = odds.markets.moneyline?.home || 0
    const awayOdds = odds.markets.moneyline?.away || 0
    
    if (homeOdds === 0 || awayOdds === 0) return 0
    
    const homeImpliedProb = 1 / homeOdds
    const awayImpliedProb = 1 / awayOdds
    const totalImpliedProb = homeImpliedProb + awayImpliedProb
    
    // Value is inverse of total implied probability
    return Math.max(0, 1 - totalImpliedProb)
  }

  /**
   * Get betting recommendation
   */
  private getRecommendation(odds: OddsData): string {
    const value = this.calculateValue(odds)
    
    if (value > 0.2) return 'Strong Value'
    if (value > 0.1) return 'Good Value'
    if (value > 0.05) return 'Moderate Value'
    return 'Low Value'
  }

  /**
   * Calculate expected return
   */
  private calculateExpectedReturn(odds: OddsData): number {
    const value = this.calculateValue(odds)
    return value * 100 // Convert to percentage
  }

  /**
   * Find best odds
   */
  private findBestOdds(odds: OddsData): any {
    return {
      moneyline: {
        home: odds.markets.moneyline?.home || 0,
        away: odds.markets.moneyline?.away || 0
      },
      spread: {
        home: odds.markets.spread?.home || 0,
        away: odds.markets.spread?.away || 0,
        line: odds.markets.spread?.line || 0
      },
      total: {
        over: odds.markets.total?.over || 0,
        under: odds.markets.total?.under || 0,
        line: odds.markets.total?.line || 0
      }
    }
  }

  /**
   * Build comparison data
   */
  private buildComparisonData(odds: OddsData): any {
    return {
      bookmaker: odds.bookmaker,
      lastUpdated: odds.lastUpdated,
      markets: Object.keys(odds.markets).length,
      value: this.calculateValue(odds)
    }
  }

  /**
   * Health check for odds service
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.getOdds({ limit: 1 })
      return true
    } catch (error) {
      console.error(`${this.sport} odds service health check failed:`, error)
      return false
    }
  }
}