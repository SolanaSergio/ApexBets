/**
 * Optimized Live Updates Service
 * Reduces API load through intelligent caching, request deduplication, and batching
 */

import { comprehensiveErrorRecovery } from './comprehensive-error-recovery'
import { apiSpecificErrorHandler } from './api-specific-error-handlers'
import { structuredLogger as logger } from './structured-logger'

interface LiveUpdateRequest {
  sport: string
  league?: string
  dataTypes: ('games' | 'scores' | 'odds' | 'standings')[]
  priority: 'high' | 'medium' | 'low'
}

interface CachedData {
  data: any
  timestamp: number
  ttl: number
  requestKey: string
}

interface RequestBatch {
  requests: LiveUpdateRequest[]
  timestamp: number
  timeout: NodeJS.Timeout
}

export class OptimizedLiveUpdatesService {
  private cache: Map<string, CachedData> = new Map()
  private pendingRequests: Map<string, Promise<any>> = new Map()
  private requestBatches: Map<string, RequestBatch> = new Map()
  private lastApiCalls: Map<string, number> = new Map()
  
  // Cache TTL configurations based on data type and priority
  private cacheTTLs = {
    live_games: 30 * 1000,      // 30 seconds for live games
    recent_games: 5 * 60 * 1000, // 5 minutes for recent games
    upcoming_games: 15 * 60 * 1000, // 15 minutes for upcoming games
    standings: 30 * 60 * 1000,   // 30 minutes for standings
    odds: 2 * 60 * 1000,        // 2 minutes for odds
    teams: 24 * 60 * 60 * 1000  // 24 hours for team data
  }

  // Minimum intervals between API calls per provider
  private apiIntervals = {
    'espn': 500,        // 500ms between calls
    'balldontlie': 1000, // 1 second (60 req/min)
    'api-sports': 6000,  // 6 seconds (10 req/min)
    'sportsdb': 2000,    // 2 seconds
    'nba-stats': 2000,   // 2 seconds
    'mlb-stats': 1000,   // 1 second
    'nhl': 1000,         // 1 second
    'odds-api': 60000    // 1 minute (very limited)
  }

  /**
   * Get live updates with optimized caching and request deduplication
   */
  async getLiveUpdates(request: LiveUpdateRequest): Promise<any> {
    const cacheKey = this.generateCacheKey(request)
    
    // Check cache first
    const cached = this.getFromCache(cacheKey)
    if (cached) {
      logger.logBusinessEvent('cache_hit', {
        sport: request.sport,
        cacheKey,
        age: Date.now() - cached.timestamp
      })
      return cached.data
    }

    // Check if request is already pending (deduplication)
    if (this.pendingRequests.has(cacheKey)) {
      logger.logBusinessEvent('request_deduplicated', {
        sport: request.sport,
        cacheKey
      })
      return await this.pendingRequests.get(cacheKey)
    }

    // Create new request
    const requestPromise = this.executeOptimizedRequest(request, cacheKey)
    this.pendingRequests.set(cacheKey, requestPromise)

    try {
      const result = await requestPromise
      return result
    } finally {
      this.pendingRequests.delete(cacheKey)
    }
  }

  private async executeOptimizedRequest(request: LiveUpdateRequest, cacheKey: string): Promise<any> {
    try {
      // Use comprehensive error recovery
      const result = await comprehensiveErrorRecovery.executeWithRecovery(
        request.sport,
        () => this.fetchLiveData(request),
        cacheKey
      )

      // Cache the result
      this.setCache(cacheKey, result, this.getCacheTTL(request))
      
      return result
    } catch (error) {
      logger.logBusinessEvent('live_update_failed', {
        sport: request.sport,
        error: (error as Error).message
      })
      
      // Return stale data if available
      const stale = this.getFromCache(cacheKey, true)
      if (stale) {
        return stale.data
      }
      
      throw error
    }
  }

  private async fetchLiveData(request: LiveUpdateRequest): Promise<any> {
    const results: any = {
      live: [],
      recent: [],
      upcoming: [],
      standings: [],
      odds: [],
      summary: {
        totalLive: 0,
        totalRecent: 0,
        totalUpcoming: 0,
        lastUpdated: new Date().toISOString()
      }
    }

    // Batch requests by data type to minimize API calls
    const promises: Promise<void>[] = []

    if (request.dataTypes.includes('games')) {
      promises.push(this.fetchGamesData(request, results))
    }

    if (request.dataTypes.includes('standings')) {
      promises.push(this.fetchStandingsData(request, results))
    }

    if (request.dataTypes.includes('odds')) {
      promises.push(this.fetchOddsData(request, results))
    }

    // Execute all requests in parallel but with rate limiting
    await Promise.allSettled(promises)

    // Update summary
    results.summary.totalLive = results.live.length
    results.summary.totalRecent = results.recent.length
    results.summary.totalUpcoming = results.upcoming.length

    return results
  }

  private async fetchGamesData(request: LiveUpdateRequest, results: any): Promise<void> {
    try {
      // Choose optimal API based on sport and current load
      const apiProvider = this.selectOptimalProvider(request.sport, 'games')
      
      // Check rate limiting
      if (!this.canMakeApiCall(apiProvider)) {
        throw new Error(`Rate limit: Cannot call ${apiProvider} yet`)
      }

      let games: any[] = []
      
      switch (apiProvider) {
        case 'espn':
          games = await this.fetchFromESPN(request.sport)
          break
        case 'balldontlie':
          if (request.sport === 'basketball') {
            games = await this.fetchFromBallDontLie()
          }
          break
        case 'sportsdb':
          games = await this.fetchFromSportsDB(request.sport)
          break
        default:
          throw new Error(`No provider available for ${request.sport}`)
      }

      // Categorize games
      const now = new Date()
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
      const oneDayFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000)

      games.forEach(game => {
        const gameDate = new Date(game.date)
        
        if (game.status === 'live' || game.status === 'in_progress') {
          results.live.push(game)
        } else if (gameDate > oneDayAgo && gameDate <= now && game.status === 'finished') {
          results.recent.push(game)
        } else if (gameDate > now && gameDate <= oneDayFromNow) {
          results.upcoming.push(game)
        }
      })

      this.recordApiCall(apiProvider)
      
    } catch (error) {
      logger.logBusinessEvent('games_fetch_failed', {
        sport: request.sport,
        error: (error as Error).message
      })
    }
  }

  private async fetchStandingsData(request: LiveUpdateRequest, results: any): Promise<void> {
    try {
      // Standings change less frequently, use longer cache
      const cacheKey = `standings:${request.sport}:${request.league || 'all'}`
      const cached = this.getFromCache(cacheKey)
      
      if (cached) {
        results.standings = cached.data
        return
      }

      const apiProvider = this.selectOptimalProvider(request.sport, 'standings')
      
      if (!this.canMakeApiCall(apiProvider)) {
        return // Skip if rate limited
      }

      // Fetch standings logic here
      // This would be implemented based on the specific API
      
      this.recordApiCall(apiProvider)
      
    } catch (error) {
      logger.logBusinessEvent('standings_fetch_failed', {
        sport: request.sport,
        error: (error as Error).message
      })
    }
  }

  private async fetchOddsData(request: LiveUpdateRequest, results: any): Promise<void> {
    try {
      // Odds are very rate-limited, use aggressive caching
      const cacheKey = `odds:${request.sport}:${request.league || 'all'}`
      const cached = this.getFromCache(cacheKey)
      
      if (cached) {
        results.odds = cached.data
        return
      }

      // Only fetch odds if absolutely necessary and not rate limited
      if (this.canMakeApiCall('odds-api')) {
        // Fetch odds logic here
        this.recordApiCall('odds-api')
      }
      
    } catch (error) {
      logger.logBusinessEvent('odds_fetch_failed', {
        sport: request.sport,
        error: (error as Error).message
      })
    }
  }

  private async fetchFromESPN(sport: string): Promise<any[]> {
    // ESPN API calls would go here
    // This is a placeholder
    return []
  }

  private async fetchFromBallDontLie(): Promise<any[]> {
    // BallDontLie API calls would go here
    // This is a placeholder
    return []
  }

  private async fetchFromSportsDB(sport: string): Promise<any[]> {
    // SportsDB API calls would go here
    // This is a placeholder
    return []
  }

  private selectOptimalProvider(sport: string, dataType: string): string {
    // Select the best provider based on:
    // 1. Sport compatibility
    // 2. Current rate limit status
    // 3. Recent success rate
    // 4. Data type requirements

    const providers = {
      basketball: ['balldontlie', 'nba-stats', 'espn', 'sportsdb'],
      football: ['espn', 'sportsdb'],
      soccer: ['api-sports', 'espn', 'sportsdb'],
      baseball: ['mlb-stats', 'espn', 'sportsdb'],
      hockey: ['nhl', 'espn', 'sportsdb']
    }

    const sportProviders = providers[sport as keyof typeof providers] || ['espn', 'sportsdb']
    
    // Return first available provider that's not rate limited
    for (const provider of sportProviders) {
      if (this.canMakeApiCall(provider)) {
        return provider
      }
    }

    // If all are rate limited, return the one with shortest wait time
    return sportProviders[0]
  }

  private canMakeApiCall(provider: string): boolean {
    const lastCall = this.lastApiCalls.get(provider) || 0
    const interval = this.apiIntervals[provider as keyof typeof this.apiIntervals] || 1000
    return Date.now() - lastCall >= interval
  }

  private recordApiCall(provider: string): void {
    this.lastApiCalls.set(provider, Date.now())
  }

  private generateCacheKey(request: LiveUpdateRequest): string {
    return `live:${request.sport}:${request.league || 'all'}:${request.dataTypes.join(',')}`
  }

  private getCacheTTL(request: LiveUpdateRequest): number {
    // Return shortest TTL for any requested data type
    let minTTL = Infinity
    
    for (const dataType of request.dataTypes) {
      const ttl = this.cacheTTLs[dataType as keyof typeof this.cacheTTLs] || 60000
      minTTL = Math.min(minTTL, ttl)
    }
    
    return minTTL === Infinity ? 60000 : minTTL
  }

  private getFromCache(key: string, allowStale: boolean = false): CachedData | null {
    const cached = this.cache.get(key)
    if (!cached) return null

    const age = Date.now() - cached.timestamp
    if (age > cached.ttl && !allowStale) {
      this.cache.delete(key)
      return null
    }

    return cached
  }

  private setCache(key: string, data: any, ttl: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
      requestKey: key
    })
  }

  /**
   * Clear expired cache entries
   */
  clearExpiredCache(): void {
    const now = Date.now()
    for (const [key, cached] of this.cache.entries()) {
      if (now - cached.timestamp > cached.ttl) {
        this.cache.delete(key)
      }
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    const stats = {
      totalEntries: this.cache.size,
      pendingRequests: this.pendingRequests.size,
      lastApiCalls: Object.fromEntries(this.lastApiCalls),
      cacheHitRate: 0 // Would need to track hits/misses
    }
    
    return stats
  }
}

export const optimizedLiveUpdates = new OptimizedLiveUpdatesService()
