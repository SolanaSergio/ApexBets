/**
 * SPORT ODDS SERVICE
 * Sport-specific odds and betting market management
 */

import { BaseService, ServiceConfig } from '../core/base-service'
import { serviceFactory, SupportedSport } from '../core/service-factory'
import { oddsApiClient } from '../../sports-apis'

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

export interface BettingMarket {
  name: string
  displayName: string
  type: 'moneyline' | 'spread' | 'total' | 'props' | 'futures'
  available: boolean
  description: string
}

export interface ValueBettingAnalysis {
  gameId: string
  market: string
  selection: string
  odds: number
  impliedProbability: number
  fairProbability: number
  value: number
  recommendation: 'strong' | 'moderate' | 'weak' | 'avoid'
  lastUpdated: string
}

export class SportOddsService extends BaseService {
  private sport: SupportedSport
  private league: string

  constructor(sport: SupportedSport, league?: string) {
    const config: ServiceConfig = {
      name: `odds-${sport}`,
      cacheTTL: 2 * 60 * 1000, // 2 minutes
      rateLimitService: 'odds',
      retryAttempts: 3,
      retryDelay: 1000
    }
    super(config)
    this.sport = sport
    this.league = league || serviceFactory.getDefaultLeague(sport)
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
      try {
        if (!oddsApiClient) {
          console.warn('Odds API client not configured, returning empty odds')
          return []
        }
        
        const sportKey = this.getOddsApiSportKey()
        const odds = await oddsApiClient.getOdds({
          sport: sportKey,
          markets: params.markets?.join(',') || 'h2h,spreads,totals'
        })

        return odds.map(odd => this.mapOddsData(odd))
      } catch (error) {
        console.error(`Error fetching odds for ${this.sport}:`, error)
        return []
      }
    })
  }

  /**
   * Get available betting markets for the sport
   */
  async getBettingMarkets(): Promise<BettingMarket[]> {
    const key = this.getCacheKey('betting-markets', this.sport, this.league)
    
    return this.getCachedOrFetch(key, async () => {
      const markets: BettingMarket[] = [
        {
          name: 'moneyline',
          displayName: 'Moneyline',
          type: 'moneyline',
          available: true,
          description: 'Bet on which team will win the game'
        },
        {
          name: 'spread',
          displayName: 'Point Spread',
          type: 'spread',
          available: true,
          description: 'Bet on the point spread between teams'
        },
        {
          name: 'total',
          displayName: 'Over/Under',
          type: 'total',
          available: true,
          description: 'Bet on the total points scored'
        }
      ]

      // Add sport-specific markets
      if (this.sport === 'basketball') {
        markets.push({
          name: 'player-props',
          displayName: 'Player Props',
          type: 'props',
          available: true,
          description: 'Bet on individual player performance'
        })
      }

      return markets
    })
  }

  /**
   * Analyze value betting opportunities
   */
  async getValueBettingAnalysis(params: {
    minValue?: number
    maxOdds?: number
    limit?: number
  } = {}): Promise<ValueBettingAnalysis[]> {
    const key = this.getCacheKey('value-analysis', this.sport, this.league, JSON.stringify(params))
    
    return this.getCachedOrFetch(key, async () => {
      const odds = await this.getOdds()
      const analyses: ValueBettingAnalysis[] = []

      for (const odd of odds) {
        // Get fair probabilities from prediction service
        if (odd.markets.moneyline) {
          const homeImplied = 1 / odd.markets.moneyline.home
          const awayImplied = 1 / odd.markets.moneyline.away
          
          // Get fair probabilities from prediction service
          const predictions = await this.getPredictions(odd.gameId)
          const homeFair = predictions.homeWinProbability || 0.5
          const awayFair = predictions.awayWinProbability || 0.5

          const homeValue = homeFair * odd.markets.moneyline.home - 1
          const awayValue = awayFair * odd.markets.moneyline.away - 1

          if (homeValue >= (params.minValue || 0.1)) {
            analyses.push({
              gameId: odd.gameId,
              market: 'moneyline',
              selection: 'home',
              odds: odd.markets.moneyline.home,
              impliedProbability: Math.round(homeImplied * 100) / 100,
              fairProbability: Math.round(homeFair * 100) / 100,
              value: Math.round(homeValue * 100) / 100,
              recommendation: homeValue > 0.2 ? 'strong' : homeValue > 0.15 ? 'moderate' : 'weak',
              lastUpdated: new Date().toISOString()
            })
          }

          if (awayValue >= (params.minValue || 0.1)) {
            analyses.push({
              gameId: odd.gameId,
              market: 'moneyline',
              selection: 'away',
              odds: odd.markets.moneyline.away,
              impliedProbability: Math.round(awayImplied * 100) / 100,
              fairProbability: Math.round(awayFair * 100) / 100,
              value: Math.round(awayValue * 100) / 100,
              recommendation: awayValue > 0.2 ? 'strong' : awayValue > 0.15 ? 'moderate' : 'weak',
              lastUpdated: new Date().toISOString()
            })
          }
        }
      }

      return analyses
        .sort((a, b) => b.value - a.value)
        .slice(0, params.limit || 10)
    })
  }

  /**
   * Get odds comparison across bookmakers
   */
  async getOddsComparison(gameId: string): Promise<Record<string, OddsData[]>> {
    const key = this.getCacheKey('odds-comparison', this.sport, this.league, gameId)
    
    return this.getCachedOrFetch(key, async () => {
      // This would integrate with multiple bookmaker APIs
      const odds = await this.getOdds({ gameId })
      const comparison: Record<string, OddsData[]> = {}

      for (const odd of odds) {
        if (!comparison[odd.bookmaker]) {
          comparison[odd.bookmaker] = []
        }
        comparison[odd.bookmaker].push(odd)
      }

      return comparison
    })
  }

  /**
   * Get live odds updates
   */
  async getLiveOdds(): Promise<OddsData[]> {
    const key = this.getCacheKey('live-odds', this.sport, this.league)
    const ttl = 30 * 1000 // 30 seconds for live data
    
    return this.getCachedOrFetch(key, async () => {
      const service = serviceFactory.getService(this.sport, this.league)
      const liveGames = await service.getLiveGames()
      
      const odds: OddsData[] = []
      for (const game of liveGames) {
        const gameOdds = await this.getOdds({ gameId: game.id })
        odds.push(...gameOdds)
      }

      return odds
    }, ttl)
  }

  /**
   * Map odds API data to our format
   */
  private mapOddsData(rawData: any): OddsData {
    return {
      gameId: rawData.id || rawData.gameId,
      homeTeam: rawData.home_team || rawData.homeTeam,
      awayTeam: rawData.away_team || rawData.awayTeam,
      markets: {
        moneyline: rawData.bookmakers?.[0]?.markets?.find((m: any) => m.key === 'h2h') ? {
          home: rawData.bookmakers[0].markets.find((m: any) => m.key === 'h2h').outcomes[0].price,
          away: rawData.bookmakers[0].markets.find((m: any) => m.key === 'h2h').outcomes[1].price
        } : undefined,
        spread: rawData.bookmakers?.[0]?.markets?.find((m: any) => m.key === 'spreads') ? {
          home: rawData.bookmakers[0].markets.find((m: any) => m.key === 'spreads').outcomes[0].price,
          away: rawData.bookmakers[0].markets.find((m: any) => m.key === 'spreads').outcomes[1].price,
          line: rawData.bookmakers[0].markets.find((m: any) => m.key === 'spreads').outcomes[0].point
        } : undefined,
        total: rawData.bookmakers?.[0]?.markets?.find((m: any) => m.key === 'totals') ? {
          over: rawData.bookmakers[0].markets.find((m: any) => m.key === 'totals').outcomes[0].price,
          under: rawData.bookmakers[0].markets.find((m: any) => m.key === 'totals').outcomes[1].price,
          line: rawData.bookmakers[0].markets.find((m: any) => m.key === 'totals').outcomes[0].point
        } : undefined
      },
      bookmaker: rawData.bookmakers?.[0]?.title || 'Unknown',
      lastUpdated: new Date().toISOString()
    }
  }

  /**
   * Get the odds API sport key for the current sport
   */
  private getOddsApiSportKey(): string {
    const sportMap: Record<SupportedSport, string> = {
      basketball: 'basketball_nba',
      football: 'americanfootball_nfl',
      baseball: 'baseball_mlb',
      hockey: 'icehockey_nhl',
      soccer: 'soccer_epl',
      tennis: 'tennis_atp',
      golf: 'golf_pga'
    }

    return sportMap[this.sport] || 'basketball_nba'
  }

  /**
   * Get predictions for a game
   */
  private async getPredictions(gameId: string): Promise<{ homeWinProbability: number; awayWinProbability: number }> {
    try {
      // This would integrate with the prediction service
      // For now, return neutral probabilities
      return {
        homeWinProbability: 0.5,
        awayWinProbability: 0.5
      }
    } catch (error) {
      console.error('Error getting predictions:', error)
      return {
        homeWinProbability: 0.5,
        awayWinProbability: 0.5
      }
    }
  }

  /**
   * Get sport-specific health check
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
