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
      // This would integrate with actual odds APIs
      // For now, generate realistic mock odds
      const homeWinProb = Math.random() * 0.4 + 0.3 // 30-70%
      const awayWinProb = 1 - homeWinProb
      
      const homeOdds = Math.round((1 / homeWinProb) * 100) / 100
      const awayOdds = Math.round((1 / awayWinProb) * 100) / 100
      
      const spread = (Math.random() - 0.5) * 20 // -10 to +10
      const total = Math.random() * 100 + 150 // 150-250
      
      return {
        gameId: game.id,
        homeTeam: game.homeTeam,
        awayTeam: game.awayTeam,
        markets: {
          moneyline: {
            home: homeOdds,
            away: awayOdds
          },
          spread: {
            home: spread > 0 ? -110 : 110,
            away: spread > 0 ? 110 : -110,
            line: Math.round(spread * 10) / 10
          },
          total: {
            over: -110,
            under: -110,
            line: Math.round(total)
          }
        },
        bookmaker: 'MockBookmaker',
        lastUpdated: new Date().toISOString()
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