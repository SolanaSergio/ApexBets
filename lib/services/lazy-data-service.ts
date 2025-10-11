import { dal } from '@/lib/data/data-access-layer'
import inMemoryCache from '@/lib/cache/in-memory-cache'

export interface LazyDataOptions {
  limit?: number
  offset?: number
  filters?: Record<string, any>
  orderBy?: string
  orderDirection?: 'asc' | 'desc'
}

export interface SportDataResult {
  games: any[]
  predictions: any[]
  odds: any[]
  standings: any[]
  players: any[]
  totalCount: number
  hasMore: boolean
}

class LazyDataService {
  private static instance: LazyDataService

  static getInstance(): LazyDataService {
    if (!LazyDataService.instance) {
      LazyDataService.instance = new LazyDataService()
    }
    return LazyDataService.instance
  }

  async loadDataForSport(sport: string, dataType: string, options: LazyDataOptions = {}): Promise<any[]> {
    const cacheKey = `${sport}_${dataType}_${JSON.stringify(options)}`
    const cachedData = inMemoryCache.get(cacheKey)
    if (cachedData) {
      return cachedData as any[]
    }

    const data = await this.fetchDataForSport(sport, dataType, options)
    inMemoryCache.set(cacheKey, data)
    return data
  }

  private async fetchDataForSport(sport: string, dataType: string, options: LazyDataOptions): Promise<any[]> {
    switch (dataType) {
      case 'games':
        return this.loadGamesForSport(sport, options)
      case 'predictions':
        return this.loadPredictionsForSport(sport, options)
      case 'odds':
        return this.loadOddsForSport(sport, options)
      case 'standings':
        return this.loadStandingsForSport(sport, options)
      case 'players':
        return this.loadPlayersForSport(sport, options)
      default:
        throw new Error(`Unknown data type: ${dataType}`)
    }
  }

  private async loadGamesForSport(sport: string, options: LazyDataOptions): Promise<any[]> {
    return dal.query('games', { match: { sport }, ...options })
  }

  private async loadPredictionsForSport(sport: string, options: LazyDataOptions): Promise<any[]> {
    return dal.query('predictions', { match: { sport }, ...options })
  }

  private async loadOddsForSport(sport: string, options: LazyDataOptions): Promise<any[]> {
    return dal.query('betting_odds', { match: { sport }, ...options })
  }

  private async loadStandingsForSport(sport: string, options: LazyDataOptions): Promise<any[]> {
    return dal.query('league_standings', { match: { sport }, ...options })
  }

  private async loadPlayersForSport(sport: string, options: LazyDataOptions): Promise<any[]> {
    return dal.query('player_profiles', { match: { sport }, ...options })
  }

  async loadAllDataForSport(sport: string): Promise<SportDataResult> {
    const dataTypes = ['games', 'predictions', 'odds', 'standings', 'players']
    const promises = dataTypes.map(type => this.loadDataForSport(sport, type))

    const results = await Promise.allSettled(promises)

    const result = {
      games: results[0].status === 'fulfilled' ? results[0].value : [],
      predictions: results[1].status === 'fulfilled' ? results[1].value : [],
      odds: results[2].status === 'fulfilled' ? results[2].value : [],
      standings: results[3].status === 'fulfilled' ? results[3].value : [],
      players: results[4].status === 'fulfilled' ? results[4].value : [],
      totalCount: 0,
      hasMore: false
    }

    result.totalCount = Object.values(result).slice(0, 5).reduce((sum: number, arr: any) => sum + (Array.isArray(arr) ? arr.length : 0), 0)
    return result
  }

  async getSportConfig(sport: string): Promise<any> {
    const cacheKey = `sport_config_${sport}`
    const cachedData = inMemoryCache.get(cacheKey)
    if (cachedData) {
      return cachedData
    }

    const data = await dal.query('sports', { match: { name: sport, is_active: true }, limit: 1 })
    const config = data[0]
    inMemoryCache.set(cacheKey, config)
    return config
  }

  async getAllSports(): Promise<string[]> {
    const cacheKey = 'all_sports'
    const cachedData = inMemoryCache.get(cacheKey)
    if (cachedData) {
      return cachedData as string[]
    }

    const data = await dal.query('sports', { match: { is_active: true }, select: 'name', orderBy: 'name' })
    const sports = data.map((sport: any) => sport.name)
    inMemoryCache.set(cacheKey, sports)
    return sports
  }
}

export const lazyDataService = LazyDataService.getInstance()