/**
 * ODDS HISTORY SERVICE
 * Manages historical odds data from The Odds API
 * Populates and maintains odds_history table
 */

import { createClient } from '@supabase/supabase-js'

export interface OddsData {
  gameId: string
  sport: string
  bookmaker: string
  betType: 'moneyline' | 'spread' | 'total' | 'prop'
  betSide: string
  odds: number
  lineValue?: number
  timestamp: string
}

export interface TheOddsApiResponse {
  id: string
  sport_key: string
  sport_title: string
  commence_time: string
  home_team: string
  away_team: string
  bookmakers: Array<{
    key: string
    title: string
    last_update: string
    markets: Array<{
      key: string
      last_update: string
      outcomes: Array<{
        name: string
        price: number
        point?: number
      }>
    }>
  }>
}

export class OddsHistoryService {
  private readonly baseUrl = 'https://api.the-odds-api.com/v4'
  private readonly supabase: any

  constructor() {
    // Initialize Supabase client for database operations
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  }

  private getApiKey(): string {
    const apiKey = process.env.THE_ODDS_API_KEY
    if (!apiKey) {
      throw new Error('THE_ODDS_API_KEY environment variable is required')
    }
    return apiKey
  }

  /**
   * Fetch odds data from The Odds API for a specific sport
   */
  async fetchOddsFromApi(sport: string, regions: string[] = ['us']): Promise<TheOddsApiResponse[]> {
    try {
      const url = `${this.baseUrl}/sports/${sport}/odds`
      const params = new URLSearchParams({
        apiKey: this.getApiKey(),
        regions: regions.join(','),
        markets: 'h2h,spreads,totals',
        oddsFormat: 'decimal',
        dateFormat: 'iso'
      })

      const response = await fetch(`${url}?${params}`)
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error(`Error fetching odds for ${sport}:`, error)
      throw error
    }
  }

  /**
   * Process and store odds data in the database
   */
  async storeOddsData(oddsData: TheOddsApiResponse[]): Promise<void> {
    try {
      const insertPromises = oddsData.map(game => this.processGameOdds(game))
      await Promise.all(insertPromises)
    } catch (error) {
      console.error('Error storing odds data:', error)
      throw error
    }
  }

  /**
   * Process odds for a single game
   */
  private async processGameOdds(game: TheOddsApiResponse): Promise<void> {
    try {
      const gameId = game.id
      const sport = game.sport_key
      const commenceTime = new Date(game.commence_time)

      for (const bookmaker of game.bookmakers) {
        for (const market of bookmaker.markets) {
          await this.processMarket(gameId, sport, bookmaker, market, commenceTime)
        }
      }
    } catch (error) {
      console.error(`Error processing game ${game.id}:`, error)
    }
  }

  /**
   * Process a specific market (moneyline, spread, total)
   */
  private async processMarket(
    gameId: string,
    sport: string,
    bookmaker: any,
    market: any,
    commenceTime: Date
  ): Promise<void> {
    try {
      const marketType = this.mapMarketType(market.key)
      
      for (const outcome of market.outcomes) {
        const oddsData: OddsData = {
          gameId,
          sport,
          bookmaker: bookmaker.key,
          betType: marketType,
          betSide: this.mapBetSide(outcome.name, market.key),
          odds: outcome.price,
          lineValue: outcome.point,
          timestamp: commenceTime.toISOString()
        }

        await this.insertOddsRecord(oddsData)
      }
    } catch (error) {
      console.error(`Error processing market ${market.key}:`, error)
    }
  }

  /**
   * Insert a single odds record into the database using Supabase client
   */
  private async insertOddsRecord(oddsData: OddsData): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('odds_history')
        .upsert({
          game_id: oddsData.gameId,
          sport: oddsData.sport,
          bookmaker: oddsData.bookmaker,
          bet_type: oddsData.betType,
          bet_side: oddsData.betSide,
          odds: oddsData.odds,
          line_value: oddsData.lineValue,
          timestamp: oddsData.timestamp,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'game_id,bookmaker,bet_type,bet_side,timestamp'
        })

      if (error) {
        console.error('Error inserting odds record:', error)
        throw error
      }
    } catch (error) {
      console.error('Error inserting odds record:', error)
      throw error
    }
  }

  /**
   * Map API market keys to our bet types
   */
  private mapMarketType(marketKey: string): 'moneyline' | 'spread' | 'total' | 'prop' {
    switch (marketKey) {
      case 'h2h':
        return 'moneyline'
      case 'spreads':
        return 'spread'
      case 'totals':
        return 'total'
      default:
        return 'prop'
    }
  }

  /**
   * Map outcome names to bet sides
   */
  private mapBetSide(outcomeName: string, marketKey: string): string {
    switch (marketKey) {
      case 'h2h':
        return outcomeName.toLowerCase().includes('home') ? 'home' : 'away'
      case 'spreads':
        return outcomeName.toLowerCase().includes('home') ? 'home' : 'away'
      case 'totals':
        return outcomeName.toLowerCase().includes('over') ? 'over' : 'under'
      default:
        return outcomeName.toLowerCase()
    }
  }

  /**
   * Get odds history for a specific game using Supabase client
   */
  async getOddsHistory(gameId: string, sport: string, limit: number = 20): Promise<any[]> {
    try {
      const { data, error } = await this.supabase
        .from('odds_history')
        .select(`
          home_moneyline,
          away_moneyline,
          home_spread,
          away_spread,
          total,
          timestamp
        `)
        .eq('game_id', gameId)
        .eq('sport', sport)
        .order('timestamp', { ascending: false })
        .limit(limit)

      if (error) {
        console.error('Error fetching odds history:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Error fetching odds history:', error)
      return []
    }
  }

  /**
   * Clean up old odds data (older than 30 days) using Supabase client
   */
  async cleanupOldOdds(): Promise<void> {
    try {
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      const { error } = await this.supabase
        .from('odds_history')
        .delete()
        .lt('timestamp', thirtyDaysAgo.toISOString())

      if (error) {
        console.error('Error cleaning up old odds:', error)
        throw error
      }

      console.log('Cleaned up old odds data')
    } catch (error) {
      console.error('Error cleaning up old odds:', error)
      throw error
    }
  }

  /**
   * Get supported sports from The Odds API
   */
  async getSupportedSports(): Promise<string[]> {
    try {
      const response = await fetch(`${this.baseUrl}/sports?apiKey=${this.getApiKey()}`)
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`)
      }

      const sports = await response.json()
      return sports.map((sport: any) => sport.key)
    } catch (error) {
      console.error('Error fetching supported sports:', error)
      return []
    }
  }
}

// Export singleton instance
export const oddsHistoryService = new OddsHistoryService()
