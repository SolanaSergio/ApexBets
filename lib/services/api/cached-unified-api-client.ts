/**
 * CACHED UNIFIED API CLIENT
 * Provides a unified interface with database caching to all split services
 */

import { serviceFactory, SupportedSport } from '../core/service-factory'
import { databaseCacheService } from '../database-cache-service'
import { cacheService } from '../cache-service'

// Re-export types for convenience
export type { SupportedSport } from './unified-api-client'

export interface ApiResponse<T> {
  success: boolean
  data: T
  meta: {
    timestamp: string
    sport?: string
    league?: string
    action?: string
    count?: number
    cached?: boolean
    cacheAge?: number
  }
  error?: string
}

export interface UnifiedGameData {
  id: string
  sport: string
  league: string
  homeTeam: string
  awayTeam: string
  date: string
  time?: string
  status: 'scheduled' | 'live' | 'finished' | 'postponed' | 'cancelled'
  homeScore?: number
  awayScore?: number
  venue?: string
  odds?: any[]
  predictions?: any[]
  lastUpdated: string
}

export interface UnifiedTeamData {
  id: string
  sport: string
  league: string
  name: string
  abbreviation: string
  city?: string
  logoUrl?: string
  conference?: string
  division?: string
  foundedYear?: number
  stadiumName?: string
  stadiumCapacity?: number
  primaryColor?: string
  secondaryColor?: string
  country?: string
  isActive?: boolean
  lastUpdated: string
}

export interface UnifiedPlayerData {
  id: string
  sport: string
  name: string
  position?: string
  teamId?: string
  teamName?: string
  height?: string
  weight?: number
  age?: number
  experienceYears?: number
  college?: string
  country?: string
  jerseyNumber?: number
  isActive?: boolean
  headshotUrl?: string
  lastUpdated: string
}

export class CachedUnifiedApiClient {
  private cacheEnabled: boolean = true
  private defaultCacheTtl: number = 300000 // 5 minutes
  private pendingRequests: Map<string, Promise<any>> = new Map()
  private lastApiCall: number = 0
  private minDelayBetweenCalls: number = 1000 // 1 second minimum between API calls (reduced from 2s)

  constructor() {
    // Check if database cache is available
    this.cacheEnabled = true
  }

  // Cache configuration
  private getCacheTtl(dataType: string, sport?: string): number {
    const cacheConfig: Record<string, number> = {
      'live_games': 120000, // 2 minutes for live games
      'scheduled_games': 300000, // 5 minutes for scheduled games
      'finished_games': 3600000, // 1 hour for finished games
      'teams': 1800000, // 30 minutes for team data
      'players': 1800000, // 30 minutes for player data
      'odds': 120000, // 2 minutes for odds
      'predictions': 600000, // 10 minutes for predictions
      'standings': 1800000, // 30 minutes for standings
      'analytics': 900000, // 15 minutes for analytics
      'api_response': 300000 // 5 minutes for general API responses
    }

    return cacheConfig[dataType] || this.defaultCacheTtl
  }

  private generateCacheKey(prefix: string, params: Record<string, any>): string {
    const sortedParams = Object.keys(params)
      .sort()
      .map(key => `${key}:${params[key]}`)
      .join('|')
    return `${prefix}:${sortedParams}`
  }

  private async deduplicateRequest<T>(
    cacheKey: string,
    fetchFn: () => Promise<T>
  ): Promise<T> {
    // Check if request is already pending
    if (this.pendingRequests.has(cacheKey)) {
      return this.pendingRequests.get(cacheKey)!
    }

    // Create new request with rate limiting
    const request = this.rateLimitedFetch(fetchFn).finally(() => {
      this.pendingRequests.delete(cacheKey)
    })

    this.pendingRequests.set(cacheKey, request)
    return request
  }

  private async rateLimitedFetch<T>(fetchFn: () => Promise<T>): Promise<T> {
    const now = Date.now()
    const timeSinceLastCall = now - this.lastApiCall
    
    if (timeSinceLastCall < this.minDelayBetweenCalls) {
      const delay = this.minDelayBetweenCalls - timeSinceLastCall
      await new Promise(resolve => setTimeout(resolve, delay))
    }
    
    this.lastApiCall = Date.now()
    return fetchFn()
  }

  private async getCachedData<T>(
    cacheKey: string,
    dataType: string,
    sport?: string
  ): Promise<T | null> {
    if (!this.cacheEnabled) {
      return null
    }

    try {
      // Try database cache first (only if available)
      if (databaseCacheService.isAvailable()) {
        try {
          const dbCached = await databaseCacheService.get<T>(cacheKey)
          if (dbCached) {
            return dbCached
          }
        } catch (dbError) {
          // Database cache not available, continue with memory cache
          console.warn('Database cache error, using memory cache only:', (dbError as Error).message)
        }
      }

      // Fallback to memory cache
      const memCached = cacheService.get<T>(cacheKey)
      if (memCached) {
        // Try to store in database cache for persistence (if available)
        if (databaseCacheService.isAvailable()) {
          try {
            await databaseCacheService.set(
              cacheKey,
              memCached,
              this.getCacheTtl(dataType, sport),
              dataType,
              sport
            )
          } catch (dbError) {
            // Database cache not available, just use memory cache
            console.warn('Database cache set error:', (dbError as Error).message)
          }
        }
        return memCached
      }

      return null
    } catch (error) {
      console.warn('Cache retrieval error:', error)
      return null
    }
  }

  private async setCachedData<T>(
    cacheKey: string,
    data: T,
    dataType: string,
    sport?: string
  ): Promise<void> {
    if (!this.cacheEnabled) {
      return
    }

    try {
      const ttl = this.getCacheTtl(dataType, sport)

      // Store in memory cache first (always available)
      cacheService.set(cacheKey, data, ttl * 1000) // Convert to milliseconds

      // Try to store in database cache (if available)
      if (databaseCacheService.isAvailable()) {
        try {
          await databaseCacheService.set(cacheKey, data, ttl, dataType, sport)
        } catch (dbError) {
          // Database cache not available, just use memory cache
          console.warn('Database cache storage error:', (dbError as Error).message)
        }
      }
    } catch (error) {
      console.warn('Cache storage error:', error)
    }
  }

  // Sport management
  getSupportedSports(): SupportedSport[] {
    return serviceFactory.getSupportedSports()
  }

  async getHealthStatus(): Promise<Record<SupportedSport, boolean>> {
    const cacheKey = this.generateCacheKey('health_status', {})
    const cached = await this.getCachedData<Record<SupportedSport, boolean>>(
      cacheKey,
      'api_response'
    )

    if (cached) {
      return cached
    }

    const health: Record<SupportedSport, boolean> = {} as Record<SupportedSport, boolean>
    const sports = this.getSupportedSports()

    for (const sport of sports) {
      try {
        const service = serviceFactory.getService(sport)
        health[sport] = service ? true : false
      } catch {
        health[sport] = false
      }
    }

    await this.setCachedData(cacheKey, health, 'api_response')
    return health
  }

  // Games
  async getGames(
    sport: SupportedSport,
    params: {
      date?: string
      status?: string
      limit?: number
      league?: string
    } = {}
  ): Promise<UnifiedGameData[]> {
    const cacheKey = this.generateCacheKey(`games:${sport}`, params)
    const cached = await this.getCachedData<UnifiedGameData[]>(cacheKey, 'scheduled_games', sport)

    if (cached) {
      return cached
    }

    try {
      const service = serviceFactory.getService(sport)
      if (!service) {
        throw new Error(`No service available for sport: ${sport}`)
      }

      const games = await service.getGames(params)
      await this.setCachedData(cacheKey, games, 'scheduled_games', sport)
      return games
    } catch (error) {
      console.error(`Error fetching games for ${sport}:`, error)
      return []
    }
  }

  async getLiveGames(sport: SupportedSport): Promise<UnifiedGameData[]> {
    const cacheKey = this.generateCacheKey(`live_games:${sport}`, {})
    const cached = await this.getCachedData<UnifiedGameData[]>(cacheKey, 'live_games', sport)

    if (cached) {
      return cached
    }

    return this.deduplicateRequest(cacheKey, async () => {
      try {
        const service = serviceFactory.getService(sport)
        if (!service) {
          throw new Error(`No service available for sport: ${sport}`)
        }

        const games = await service.getLiveGames()
        await this.setCachedData(cacheKey, games, 'live_games', sport)
        return games
      } catch (error) {
        console.error(`Error fetching live games for ${sport}:`, error)
        return []
      }
    })
  }

  // Teams
  async getTeams(
    sport: SupportedSport,
    params: {
      limit?: number
      league?: string
    } = {}
  ): Promise<UnifiedTeamData[]> {
    const cacheKey = this.generateCacheKey(`teams:${sport}`, params)
    const cached = await this.getCachedData<UnifiedTeamData[]>(cacheKey, 'teams', sport)

    if (cached) {
      return cached
    }

    try {
      const service = serviceFactory.getService(sport)
      if (!service) {
        throw new Error(`No service available for sport: ${sport}`)
      }

      const teams = await service.getTeams(params)
      await this.setCachedData(cacheKey, teams, 'teams', sport)
      return teams
    } catch (error) {
      console.error(`Error fetching teams for ${sport}:`, error)
      return []
    }
  }

  // Players
  async getPlayers(
    sport: SupportedSport,
    params: {
      limit?: number
      teamId?: string
      position?: string
    } = {}
  ): Promise<UnifiedPlayerData[]> {
    const cacheKey = this.generateCacheKey(`players:${sport}`, params)
    const cached = await this.getCachedData<UnifiedPlayerData[]>(cacheKey, 'players', sport)

    if (cached) {
      return cached
    }

    try {
      const service = serviceFactory.getService(sport)
      if (!service) {
        throw new Error(`No service available for sport: ${sport}`)
      }

      const players = await service.getPlayers(params)
      await this.setCachedData(cacheKey, players, 'players', sport)
      return players
    } catch (error) {
      console.error(`Error fetching players for ${sport}:`, error)
      return []
    }
  }

  // Odds
  async getOdds(
    sport: SupportedSport,
    params: {
      gameId?: string
      limit?: number
    } = {}
  ): Promise<any[]> {
    const cacheKey = this.generateCacheKey(`odds:${sport}`, params)
    const cached = await this.getCachedData<any[]>(cacheKey, 'odds', sport)

    if (cached) {
      return cached
    }

    try {
      const service = serviceFactory.getService(sport)
      if (!service) {
        throw new Error(`No service available for sport: ${sport}`)
      }

      const odds = await service.getOdds(params)
      await this.setCachedData(cacheKey, odds, 'odds', sport)
      return odds
    } catch (error) {
      console.error(`Error fetching odds for ${sport}:`, error)
      return []
    }
  }

  // Predictions
  async getPredictions(
    sport: SupportedSport,
    params: {
      gameId?: string
      limit?: number
    } = {}
  ): Promise<any[]> {
    const cacheKey = this.generateCacheKey(`predictions:${sport}`, params)
    const cached = await this.getCachedData<any[]>(cacheKey, 'predictions', sport)

    if (cached) {
      return cached
    }

    try {
      const service = serviceFactory.getService(sport)
      if (!service) {
        throw new Error(`No service available for sport: ${sport}`)
      }

        const predictions = await (service as any).getPredictions?.(params) || []
      await this.setCachedData(cacheKey, predictions, 'predictions', sport)
      return predictions
    } catch (error) {
      console.error(`Error fetching predictions for ${sport}:`, error)
      return []
    }
  }

  // Standings
  async getStandings(
    sport: SupportedSport,
    params: {
      season?: string
      league?: string
    } = {}
  ): Promise<any[]> {
    const cacheKey = this.generateCacheKey(`standings:${sport}`, params)
    const cached = await this.getCachedData<any[]>(cacheKey, 'standings', sport)

    if (cached) {
      return cached
    }

    try {
      const service = serviceFactory.getService(sport)
      if (!service) {
        throw new Error(`No service available for sport: ${sport}`)
      }

      const standings = await service.getStandings(params.season)
      await this.setCachedData(cacheKey, standings, 'standings', sport)
      return standings
    } catch (error) {
      console.error(`Error fetching standings for ${sport}:`, error)
      return []
    }
  }

  // Analytics
  async getAnalytics(
    sport: SupportedSport,
    params: {
      type?: string
      teamId?: string
      gameId?: string
    } = {}
  ): Promise<any> {
    const cacheKey = this.generateCacheKey(`analytics:${sport}`, params)
    const cached = await this.getCachedData<any>(cacheKey, 'analytics', sport)

    if (cached) {
      return cached
    }

    try {
      const service = serviceFactory.getService(sport)
      if (!service) {
        throw new Error(`No service available for sport: ${sport}`)
      }

      const analytics = await (service as any).getAnalytics?.(params) || []
      await this.setCachedData(cacheKey, analytics, 'analytics', sport)
      return analytics
    } catch (error) {
      console.error(`Error fetching analytics for ${sport}:`, error)
      return null
    }
  }

  // Cache management
  async clearCache(sport?: string): Promise<void> {
    try {
      if (sport) {
        await databaseCacheService.clearBySport(sport)
        // Clear memory cache for the sport
        const keys = cacheService.keys(new RegExp(`.*:${sport}:.*`))
        keys.forEach(key => cacheService.delete(key))
      } else {
        await databaseCacheService.clear()
        cacheService.clear()
      }
    } catch (error) {
      console.error('Error clearing cache:', error)
    }
  }

  async getCacheStats(): Promise<any> {
    try {
      const dbStats = await databaseCacheService.getStats()
      const memStats = cacheService.getStats()
      
      return {
        database: dbStats,
        memory: memStats,
        totalEntries: dbStats.totalEntries + memStats.totalEntries,
        totalSize: dbStats.totalSize + memStats.totalSize
      }
    } catch (error) {
      console.error('Error getting cache stats:', error)
      return null
    }
  }

  // Enable/disable caching
  setCacheEnabled(enabled: boolean): void {
    this.cacheEnabled = enabled
  }

  isCacheEnabled(): boolean {
    return this.cacheEnabled
  }

  // Re-enable database cache (useful after fixing RLS policies)
  reEnableDatabaseCache(): void {
    databaseCacheService.reEnableCache()
  }

  // Get database cache status
  getDatabaseCacheStatus(): { available: boolean; disabled: boolean; supabaseConnected: boolean } {
    return databaseCacheService.getStatus()
  }
}

export const cachedUnifiedApiClient = new CachedUnifiedApiClient()
