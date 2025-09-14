/**
 * API Fallback Strategy - Updated for Full Compliance
 * Intelligent provider selection and fallback mechanisms
 * Following comprehensive sports data API guide best practices
 */

import { apiCostTracker } from './api-cost-tracker'
import { espnClient } from '../sports-apis/espn-client'
import { ballDontLieClient } from '../sports-apis/balldontlie-client'
import { apiSportsClient } from '../sports-apis/api-sports-client'
import { sportsDBClient } from '../sports-apis/sportsdb-client'
import { nbaStatsClient } from '../sports-apis/nba-stats-client'
import { mlbStatsClient } from '../sports-apis/mlb-stats-client'
import { nhlClient } from '../sports-apis/nhl-client'

export interface ProviderConfig {
  name: string
  priority: number
  cost: number
  reliability: number
  coverage: {
    sports: string[]
    dataTypes: string[]
    features: string[]
  }
  limits: {
    freeRequests: number
    rateLimit: number
  }
  healthStatus: 'healthy' | 'degraded' | 'down'
  lastHealthCheck: string
}

export interface FallbackRequest {
  sport: string
  dataType: 'games' | 'teams' | 'players' | 'standings' | 'odds' | 'stats'
  params: Record<string, any>
  priority: 'low' | 'medium' | 'high' | 'critical'
  timeout?: number
  maxRetries?: number
}

export interface FallbackResult<T> {
  data: T
  provider: string
  cached: boolean
  responseTime: number
  cost: number
  fallbacksUsed: string[]
  success: boolean
  error?: string
}

export class APIFallbackStrategy {
  private providers: Map<string, ProviderConfig> = new Map()
  private healthCheckInterval: NodeJS.Timeout | null = null
  private circuitBreakers: Map<string, {
    failures: number
    lastFailure: number
    state: 'closed' | 'open' | 'half-open'
  }> = new Map()

  constructor() {
    this.initializeProviders()
    this.startHealthChecks()
  }

  private initializeProviders(): void {
    // Following the comprehensive guide's recommended priority order:
    // 1. TheSportsDB (Free unlimited, comprehensive)
    // 2. Official Sport APIs (NBA Stats, MLB Stats, NHL API)
    // 3. ESPN Hidden API (Free, major US sports)
    // 4. Ball Don't Lie (Free, specialized)
    // 5. API-Sports (Limited free, then paid)
    
    const configs: ProviderConfig[] = [
      {
        name: 'thesportsdb',
        priority: 1, // Highest priority (free + reliable + comprehensive)
        cost: 0,
        reliability: 0.95,
        coverage: {
          sports: ['football', 'basketball', 'baseball', 'hockey', 'soccer'],
          dataTypes: ['games', 'teams', 'players', 'standings', 'stats'],
          features: ['historical', 'current', 'logos', 'venues']
        },
        limits: {
          freeRequests: Number.MAX_SAFE_INTEGER,
          rateLimit: 30 // per minute
        },
        healthStatus: 'healthy',
        lastHealthCheck: new Date().toISOString()
      },
      {
        name: 'nba-stats',
        priority: 2, // Official NBA API - highest quality for basketball
        cost: 0,
        reliability: 0.98,
        coverage: {
          sports: ['basketball'],
          dataTypes: ['games', 'teams', 'players', 'standings', 'stats'],
          features: ['official', 'comprehensive', 'real_time', 'advanced_stats']
        },
        limits: {
          freeRequests: Number.MAX_SAFE_INTEGER,
          rateLimit: 60 // per minute (conservative)
        },
        healthStatus: 'healthy',
        lastHealthCheck: new Date().toISOString()
      },
      {
        name: 'mlb-stats',
        priority: 2, // Official MLB API - highest quality for baseball
        cost: 0,
        reliability: 0.98,
        coverage: {
          sports: ['baseball'],
          dataTypes: ['games', 'teams', 'players', 'standings', 'stats'],
          features: ['official', 'comprehensive', 'real_time', 'advanced_stats']
        },
        limits: {
          freeRequests: Number.MAX_SAFE_INTEGER,
          rateLimit: 60 // per minute (conservative)
        },
        healthStatus: 'healthy',
        lastHealthCheck: new Date().toISOString()
      },
      {
        name: 'nhl',
        priority: 2, // Official NHL API (2025) - highest quality for hockey
        cost: 0,
        reliability: 0.98,
        coverage: {
          sports: ['hockey'],
          dataTypes: ['games', 'teams', 'players', 'standings', 'stats'],
          features: ['official', 'comprehensive', 'real_time', 'advanced_stats']
        },
        limits: {
          freeRequests: Number.MAX_SAFE_INTEGER,
          rateLimit: 60 // per minute (conservative)
        },
        healthStatus: 'healthy',
        lastHealthCheck: new Date().toISOString()
      },
      {
        name: 'espn',
        priority: 3, // Third priority (free + good coverage for fallback)
        cost: 0,
        reliability: 0.90,
        coverage: {
          sports: ['football', 'basketball', 'baseball', 'hockey'],
          dataTypes: ['games', 'teams', 'standings', 'stats'],
          features: ['live', 'current', 'scores']
        },
        limits: {
          freeRequests: Number.MAX_SAFE_INTEGER,
          rateLimit: 60 // per minute
        },
        healthStatus: 'healthy',
        lastHealthCheck: new Date().toISOString()
      },
      {
        name: 'balldontlie',
        priority: 5, // Lower priority due to aggressive rate limiting
        cost: 0,
        reliability: 0.85, // Reduced due to rate limit issues
        coverage: {
          sports: ['basketball'],
          dataTypes: ['games', 'teams', 'players', 'stats'],
          features: ['historical', 'current', 'advanced_stats']
        },
        limits: {
          freeRequests: Number.MAX_SAFE_INTEGER,
          rateLimit: 5 // Free tier: 5 requests per minute (strict limit)
        },
        healthStatus: 'healthy',
        lastHealthCheck: new Date().toISOString()
      },
      {
        name: 'api-sports',
        priority: 4, // Move up priority since it's more reliable when configured
        cost: 0.01,
        reliability: 0.98,
        coverage: {
          sports: ['football', 'basketball', 'baseball', 'hockey', 'soccer'],
          dataTypes: ['games', 'teams', 'standings', 'odds', 'stats'],
          features: ['live', 'current', 'odds', 'detailed']
        },
        limits: {
          freeRequests: 100,
          rateLimit: 100 // per minute
        },
        healthStatus: 'healthy',
        lastHealthCheck: new Date().toISOString()
      }
    ]

    configs.forEach(config => {
      this.providers.set(config.name, config)
      this.circuitBreakers.set(config.name, {
        failures: 0,
        lastFailure: 0,
        state: 'closed'
      })
    })
  }

  async executeWithFallback<T>(request: FallbackRequest): Promise<FallbackResult<T>> {
    const startTime = Date.now()
    const fallbacksUsed: string[] = []
    let lastError: string = ''

    // Get prioritized providers for this request
    const providers = this.getPrioritizedProviders(request)

    for (const providerName of providers) {
      const provider = this.providers.get(providerName)
      if (!provider) continue

      // Check circuit breaker
      if (!this.isProviderAvailable(providerName)) {
        fallbacksUsed.push(`${providerName}:circuit-breaker`)
        continue
      }

      try {
        const result = await this.executeRequest<T>(providerName, request)
        const responseTime = Date.now() - startTime

        // Track successful request
        apiCostTracker.trackRequest(
          providerName,
          `${request.sport}/${request.dataType}`,
          responseTime,
          true,
          false
        )

        // Reset circuit breaker on success
        this.resetCircuitBreaker(providerName)

        return {
          data: result,
          provider: providerName,
          cached: false,
          responseTime,
          cost: provider.cost,
          fallbacksUsed,
          success: true
        }
      } catch (error) {
        lastError = error instanceof Error ? error.message : 'Unknown error'
        fallbacksUsed.push(`${providerName}:error`)
        
        // Track failed request
        apiCostTracker.trackRequest(
          providerName,
          `${request.sport}/${request.dataType}`,
          Date.now() - startTime,
          false,
          false
        )

        // Update circuit breaker
        this.recordFailure(providerName)

        console.warn(`Provider ${providerName} failed for ${request.sport}/${request.dataType}:`, lastError)
        continue
      }
    }

    // All providers failed
    const responseTime = Date.now() - startTime
    return {
      data: null as T,
      provider: 'none',
      cached: false,
      responseTime,
      cost: 0,
      fallbacksUsed,
      success: false,
      error: `All providers failed. Last error: ${lastError}`
    }
  }

  private getPrioritizedProviders(request: FallbackRequest): string[] {
    return Array.from(this.providers.values())
      .filter(provider => {
        // Check if provider supports this sport and data type
        const supportsSport = provider.coverage.sports.includes(request.sport) || 
                             provider.coverage.sports.includes('all')
        const supportsDataType = provider.coverage.dataTypes.includes(request.dataType)
        
        return supportsSport && supportsDataType && provider.healthStatus !== 'down'
      })
      .sort((a, b) => {
        // Enhanced sorting logic following the guide
        // 1. For sport-specific requests, prioritize official APIs
        if (request.sport === 'basketball' && (a.name === 'nba-stats' || b.name === 'nba-stats')) {
          return a.name === 'nba-stats' ? -1 : 1
        }
        if (request.sport === 'baseball' && (a.name === 'mlb-stats' || b.name === 'mlb-stats')) {
          return a.name === 'mlb-stats' ? -1 : 1
        }
        if (request.sport === 'hockey' && (a.name === 'nhl' || b.name === 'nhl')) {
          return a.name === 'nhl' ? -1 : 1
        }
        
        // 2. Sort by priority
        if (a.priority !== b.priority) {
          return a.priority - b.priority
        }
        
        // 3. Then by cost (free first)
        if (a.cost !== b.cost) {
          return a.cost - b.cost
        }
        
        // 4. Finally by reliability
        return b.reliability - a.reliability
      })
      .map(provider => provider.name)
  }

  private async executeRequest<T>(providerName: string, request: FallbackRequest): Promise<T> {
    const { sport, dataType, params } = request

    switch (providerName) {
      case 'thesportsdb':
        return this.executeTheSportsDBRequest<T>(sport, dataType, params)
      
      case 'nba-stats':
        return this.executeNBAStatsRequest<T>(sport, dataType, params)
      
      case 'mlb-stats':
        return this.executeMLBStatsRequest<T>(sport, dataType, params)
      
      case 'nhl':
        return this.executeNHLRequest<T>(sport, dataType, params)
      
      case 'espn':
        return this.executeESPNRequest<T>(sport, dataType, params)
      
      case 'balldontlie':
        return this.executeBallDontLieRequest<T>(sport, dataType, params)
      
      case 'api-sports':
        return this.executeApiSportsRequest<T>(sport, dataType, params)
      
      default:
        throw new Error(`Unknown provider: ${providerName}`)
    }
  }

  private async executeTheSportsDBRequest<T>(_sport: string, dataType: string, params: any): Promise<T> {
    switch (dataType) {
      case 'games':
        return await sportsDBClient.getEvents(params) as T
      case 'teams':
        return await sportsDBClient.getTeams(params.league) as T
      case 'players':
        return await sportsDBClient.getPlayers(params.teamName) as T
      case 'standings':
        return await sportsDBClient.getTable(params.league, params.season) as T
      default:
        throw new Error(`Unsupported data type: ${dataType}`)
    }
  }

  private async executeNBAStatsRequest<T>(sport: string, dataType: string, params: any): Promise<T> {
    if (sport !== 'basketball') {
      throw new Error('NBA Stats API only supports basketball')
    }

    switch (dataType) {
      case 'games':
        return await nbaStatsClient.getTodaysGames() as T
      case 'teams':
        return await nbaStatsClient.getCommonTeamYears() as T
      case 'players':
        return await nbaStatsClient.getCommonAllPlayers(params.season) as T
      case 'standings':
        return await nbaStatsClient.getLeagueStandings(params.season) as T
      case 'stats':
        if (params.playerId) {
          return await nbaStatsClient.getPlayerCareerStats(params.playerId) as T
        }
        throw new Error('Player ID required for stats')
      default:
        throw new Error(`Unsupported data type: ${dataType}`)
    }
  }

  private async executeMLBStatsRequest<T>(sport: string, dataType: string, params: any): Promise<T> {
    if (sport !== 'baseball') {
      throw new Error('MLB Stats API only supports baseball')
    }

    switch (dataType) {
      case 'games':
        // Use date parameter if provided, otherwise get today's games
        if (params.date) {
          return await mlbStatsClient.getSchedule({ 
            startDate: params.date, 
            endDate: params.date 
          }) as T
        }
        return await mlbStatsClient.getTodaysGames() as T
      case 'teams':
        return await mlbStatsClient.getTeams(params.season) as T
      case 'players':
        if (params.teamId) {
          return await mlbStatsClient.getTeamRoster(params.teamId, params.season) as T
        }
        throw new Error('Team ID required for players')
      case 'standings':
        return await mlbStatsClient.getStandings(params.season) as T
      case 'stats':
        if (params.playerId) {
          return await mlbStatsClient.getPlayerStats(params.playerId, params) as T
        }
        throw new Error('Player ID required for stats')
      default:
        throw new Error(`Unsupported data type: ${dataType}`)
    }
  }

  private async executeNHLRequest<T>(sport: string, dataType: string, params: any): Promise<T> {
    if (sport !== 'hockey') {
      throw new Error('NHL API only supports hockey')
    }

    switch (dataType) {
      case 'games':
        return await nhlClient.getTodaysGames() as T
      case 'teams':
        return await nhlClient.getTeams() as T
      case 'players':
        if (params.teamId) {
          return await nhlClient.getTeamRoster(params.teamId, params.season) as T
        }
        throw new Error('Team ID required for players')
      case 'standings':
        return await nhlClient.getCurrentStandings() as T
      case 'stats':
        if (params.playerId) {
          return await nhlClient.getPlayerStats(params.playerId, params.season) as T
        }
        throw new Error('Player ID required for stats')
      default:
        throw new Error(`Unsupported data type: ${dataType}`)
    }
  }

  private async executeESPNRequest<T>(sport: string, dataType: string, params: any): Promise<T> {
    const sportMap: Record<string, string> = {
      'football': 'football',
      'basketball': 'basketball',
      'baseball': 'baseball',
      'hockey': 'hockey'
    }

    const mappedSport = sportMap[sport]
    if (!mappedSport) {
      throw new Error(`Unsupported sport: ${sport}`)
    }

    switch (dataType) {
      case 'games':
        return await espnClient.getScoreboard(mappedSport as any, params.league, params.date) as T
      case 'teams':
        return await espnClient.getTeams(mappedSport as any, params.league) as T
      case 'standings':
        return await espnClient.getStandings(mappedSport as any, params.league) as T
      default:
        throw new Error(`Unsupported data type: ${dataType}`)
    }
  }

  private async executeBallDontLieRequest<T>(sport: string, dataType: string, params: any): Promise<T> {
    if (sport !== 'basketball') {
      throw new Error('BallDontLie only supports basketball')
    }

    switch (dataType) {
      case 'games':
        const gamesResult = await ballDontLieClient.getGames(params)
        return gamesResult.data as T
      case 'teams':
        const teamsResult = await ballDontLieClient.getTeams(params)
        return teamsResult.data as T
      case 'players':
        const playersResult = await ballDontLieClient.getPlayers(params)
        return playersResult.data as T
      case 'stats':
        const statsResult = await ballDontLieClient.getStats(params)
        return statsResult.data as T
      default:
        throw new Error(`Unsupported data type: ${dataType}`)
    }
  }

  private async executeApiSportsRequest<T>(_sport: string, dataType: string, params: any): Promise<T> {
    switch (dataType) {
      case 'games':
        return await apiSportsClient.getFixtures(params) as T
      case 'teams':
        return await apiSportsClient.getTeams(params.league, params.season) as T
      case 'standings':
        return await apiSportsClient.getStandings(params.league, params.season) as T
      default:
        throw new Error(`Unsupported data type: ${dataType}`)
    }
  }

  private isProviderAvailable(providerName: string): boolean {
    const circuitBreaker = this.circuitBreakers.get(providerName)
    if (!circuitBreaker) return true

    const now = Date.now()
    
    if (circuitBreaker.state === 'open') {
      // Check if we should try half-open
      if (now - circuitBreaker.lastFailure > 60000) { // 1 minute timeout
        circuitBreaker.state = 'half-open'
        return true
      }
      return false
    }

    return true
  }

  private recordFailure(providerName: string): void {
    const circuitBreaker = this.circuitBreakers.get(providerName)
    if (!circuitBreaker) return

    circuitBreaker.failures++
    circuitBreaker.lastFailure = Date.now()

    // Open circuit breaker after 3 failures
    if (circuitBreaker.failures >= 3) {
      circuitBreaker.state = 'open'
      console.warn(`Circuit breaker opened for provider: ${providerName}`)
    }
  }

  private resetCircuitBreaker(providerName: string): void {
    const circuitBreaker = this.circuitBreakers.get(providerName)
    if (!circuitBreaker) return

    circuitBreaker.failures = 0
    circuitBreaker.state = 'closed'
  }

  private startHealthChecks(): void {
    // Run health checks every 5 minutes
    this.healthCheckInterval = setInterval(() => {
      this.performHealthChecks()
    }, 5 * 60 * 1000)
  }

  private async performHealthChecks(): Promise<void> {
    const healthCheckPromises = Array.from(this.providers.keys()).map(async (providerName) => {
      const provider = this.providers.get(providerName)
      if (!provider) return

      try {
        let isHealthy = false

        switch (providerName) {
          case 'thesportsdb':
            isHealthy = await sportsDBClient.healthCheck()
            break
          case 'nba-stats':
            isHealthy = await nbaStatsClient.healthCheck()
            break
          case 'mlb-stats':
            isHealthy = await mlbStatsClient.healthCheck()
            break
          case 'nhl':
            isHealthy = await nhlClient.healthCheck()
            break
          case 'espn':
            isHealthy = await espnClient.healthCheck()
            break
          case 'balldontlie':
            isHealthy = await ballDontLieClient.healthCheck()
            break
          case 'api-sports':
            isHealthy = apiSportsClient.isConfigured
            break
        }

        provider.healthStatus = isHealthy ? 'healthy' : 'down'
        provider.lastHealthCheck = new Date().toISOString()

        if (!isHealthy) {
          console.warn(`Health check failed for provider: ${providerName}`)
        }
      } catch (error) {
        provider.healthStatus = 'down'
        provider.lastHealthCheck = new Date().toISOString()
        console.error(`Health check error for ${providerName}:`, error)
      }
    })

    await Promise.all(healthCheckPromises)
  }

  getProviderStatus(): Array<{
    name: string
    status: string
    lastCheck: string
    reliability: number
    circuitBreakerState: string
    coverage: {
      sports: string[]
      features: string[]
    }
  }> {
    return Array.from(this.providers.entries()).map(([name, config]) => {
      const circuitBreaker = this.circuitBreakers.get(name)
      return {
        name,
        status: config.healthStatus,
        lastCheck: config.lastHealthCheck,
        reliability: config.reliability,
        circuitBreakerState: circuitBreaker?.state || 'unknown',
        coverage: {
          sports: config.coverage.sports,
          features: config.coverage.features
        }
      }
    })
  }

  // Get statistics on API usage by provider
  getProviderStats(): Record<string, {
    priority: number
    cost: number
    reliability: number
    healthStatus: string
    circuitBreakerState: string
  }> {
    const stats: Record<string, any> = {}
    
    for (const [name, config] of this.providers.entries()) {
      const circuitBreaker = this.circuitBreakers.get(name)
      stats[name] = {
        priority: config.priority,
        cost: config.cost,
        reliability: config.reliability,
        healthStatus: config.healthStatus,
        circuitBreakerState: circuitBreaker?.state || 'unknown'
      }
    }
    
    return stats
  }

  // Cleanup method
  destroy(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval)
    }
  }
}

export const apiFallbackStrategy = new APIFallbackStrategy()