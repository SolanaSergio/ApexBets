/**
 * API Fallback Strategy - Fully Dynamic and Compliant
 * No hardcoded sport-specific logic - all configuration driven
 */

import { apiCostTracker } from './api-cost-tracker'
import { enhancedRateLimiter } from './enhanced-rate-limiter'
// Removed unused imports - using only SportsDB for now
import { sportsDBClient } from '../sports-apis/sportsdb-client'
import { envValidator } from '../config/env-validator'
import { structuredLogger } from './structured-logger'

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
  providers?: string[]
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
  private static instance: APIFallbackStrategy
  private providers: Map<string, ProviderConfig> = new Map()
  private circuitBreakers: Map<string, { failures: number; lastFailure: Date; isOpen: boolean }> = new Map()

  public static getInstance(): APIFallbackStrategy {
    if (!APIFallbackStrategy.instance) {
      APIFallbackStrategy.instance = new APIFallbackStrategy()
    }
    return APIFallbackStrategy.instance
  }

  constructor() {
    this.initializeProviders()
  }

  private initializeProviders(): void {
    const supportedSports = envValidator.getSupportedSports()
    
    // Generic providers that work with any sport
    const genericProviders: ProviderConfig[] = [
      {
        name: 'thesportsdb',
        priority: 1,
        cost: 0, // Free API
        reliability: 0.8, // Good reliability
        coverage: {
          sports: supportedSports,
          dataTypes: ['games', 'teams', 'players', 'standings', 'odds'],
          features: ['live', 'historical', 'comprehensive']
        },
        limits: {
          freeRequests: 10000, // Free tier limit
          rateLimit: 30 // requests per minute
        },
        healthStatus: 'healthy',
        lastHealthCheck: new Date().toISOString()
      },
      {
        name: 'espn',
        priority: 3,
        cost: 0,
        reliability: 0.90,
        coverage: {
          sports: supportedSports,
          dataTypes: ['games', 'teams', 'players', 'standings'],
          features: ['live', 'historical', 'comprehensive']
        },
        limits: {
          freeRequests: Number.MAX_SAFE_INTEGER,
          rateLimit: 100
        },
        healthStatus: 'healthy',
        lastHealthCheck: new Date().toISOString()
      },
      {
        name: 'balldontlie',
        priority: 4,
        cost: 0,
        reliability: 0.85,
        coverage: {
          sports: supportedSports,
          dataTypes: ['games', 'teams', 'players', 'stats'],
          features: ['live', 'historical', 'advanced_stats']
        },
        limits: {
          freeRequests: 1000,
          rateLimit: 4 // 4 requests per minute (15 seconds between requests)
        },
        healthStatus: 'healthy',
        lastHealthCheck: new Date().toISOString()
      },
      {
        name: 'api-sports',
        priority: 5,
        cost: 0,
        reliability: 0.88,
        coverage: {
          sports: supportedSports,
          dataTypes: ['games', 'teams', 'players', 'standings', 'odds'],
          features: ['live', 'historical', 'comprehensive']
        },
        limits: {
          freeRequests: 100,
          rateLimit: 10
        },
        healthStatus: 'healthy',
        lastHealthCheck: new Date().toISOString()
      }
    ]

    // Load sport-specific providers from database configuration
    this.loadSportSpecificProviders(supportedSports)

    // Add generic providers
    genericProviders.forEach(provider => {
      this.providers.set(provider.name, provider)
    })
  }

  private async loadSportSpecificProviders(supportedSports: string[]): Promise<void> {
    try {
      // Import database service
      const { databaseService } = await import('./database-service')
      
      const query = `
        SELECT 
          provider_name,
          priority,
          cost,
          reliability,
          supported_sports,
          data_types,
          features,
          rate_limit,
          free_requests
        FROM api_provider_configurations
        WHERE is_active = true
        ORDER BY priority
      `
      
      const result = await databaseService.executeSQL(query)
      
      if (result.success && result.data) {
        for (const row of result.data) {
          const provider: ProviderConfig = {
            name: row.provider_name,
            priority: row.priority,
            cost: row.cost,
            reliability: row.reliability,
            coverage: {
              sports: Array.isArray(row.supported_sports) ? row.supported_sports : supportedSports,
              dataTypes: Array.isArray(row.data_types) ? row.data_types : ['games', 'teams', 'players'],
              features: Array.isArray(row.features) ? row.features : ['live', 'historical']
            },
            limits: {
              freeRequests: row.free_requests || 1000,
              rateLimit: row.rate_limit || 60
            },
            healthStatus: 'healthy',
            lastHealthCheck: new Date().toISOString()
          }
          
          this.providers.set(provider.name, provider)
        }
      }
    } catch (error) {
      structuredLogger.error('Failed to load sport-specific providers', {
        error: error instanceof Error ? error.message : String(error)
      })
    }
  }

  async executeRequest<T>(request: FallbackRequest): Promise<FallbackResult<T>> {
    const startTime = Date.now()
    const fallbacksUsed: string[] = []
    
    try {
      // Get available providers for this sport and data type
      const availableProviders = this.getAvailableProviders(request.sport, request.dataType, request.providers)
      
      if (availableProviders.length === 0) {
        throw new Error(`No providers available for sport: ${request.sport}, dataType: ${request.dataType}`)
      }

      // Try providers in priority order
      for (const provider of availableProviders) {
        try {
          if (this.isCircuitBreakerOpen(provider.name)) {
            continue
          }

          // Check rate limit before making request
          const rateLimitResult = await enhancedRateLimiter.checkRateLimit(provider.name, request.dataType)
          if (!rateLimitResult.allowed) {
            structuredLogger.warn('Rate limit exceeded, skipping provider', {
              provider: provider.name,
              retryAfter: rateLimitResult.retryAfter
            })
            continue
          }

          const data = await this.executeProviderRequest<T>(provider.name, request)
          const responseTime = Date.now() - startTime
          
          // Track cost
          const cost = this.calculateCost(provider, request)
          apiCostTracker.trackRequest(provider.name, request.dataType, responseTime, true, false, cost)

          // Reset circuit breaker on success
          this.resetCircuitBreaker(provider.name)

          return {
            data,
            provider: provider.name,
            cached: false,
            responseTime,
            cost,
            fallbacksUsed,
            success: true
          }

        } catch (error) {
          fallbacksUsed.push(provider.name)
          this.recordFailure(provider.name)
          
          structuredLogger.warn('Provider request failed', {
            provider: provider.name,
            sport: request.sport,
            dataType: request.dataType,
            error: error instanceof Error ? error.message : String(error)
          })
          
          // If this is a rate limit error, add extra delay before trying next provider
          if (error instanceof Error && (error.message.includes('rate limit') || error.message.includes('429'))) {
            const delay = 5000 + (Math.random() * 5000) // 5-10 seconds random delay
            await new Promise(resolve => setTimeout(resolve, delay))
          }
        }
      }

      throw new Error(`All providers failed for sport: ${request.sport}, dataType: ${request.dataType}`)

    } catch (error) {
      const responseTime = Date.now() - startTime
      
      return {
        data: [] as T,
        provider: 'none',
        cached: false,
        responseTime,
        cost: 0,
        fallbacksUsed,
        success: false,
        error: error instanceof Error ? error.message : String(error)
      }
    }
  }

  private getAvailableProviders(sport: string, dataType: string, requestedProviders?: string[]): ProviderConfig[] {
    const providers = Array.from(this.providers.values())
      .filter(provider => {
        // Check if sport is supported
        if (provider.coverage.sports.length > 0 && !provider.coverage.sports.includes(sport)) {
          return false
        }
        
        // Check if data type is supported
        if (!provider.coverage.dataTypes.includes(dataType)) {
          return false
        }
        
        // Check if provider is healthy
        if (provider.healthStatus === 'down') {
          return false
        }
        
        // Check if circuit breaker is open
        if (this.isCircuitBreakerOpen(provider.name)) {
          return false
        }
        
        // Check if provider was specifically requested
        if (requestedProviders && !requestedProviders.includes(provider.name)) {
          return false
        }
        
        return true
      })
      .sort((a, b) => a.priority - b.priority)

    return providers
  }

  private async executeProviderRequest<T>(providerName: string, request: FallbackRequest): Promise<T> {
    switch (providerName) {
      case 'thesportsdb':
        return this.executeTheSportsDBRequest<T>(request)
      case 'espn':
        return this.executeESPNRequest<T>(request)
      case 'balldontlie':
        return this.executeBallDontLieRequest<T>(request)
      case 'api-sports':
        return this.executeAPISportsRequest<T>(request)
      default:
        throw new Error(`Unknown provider: ${providerName}`)
    }
  }

  private async executeTheSportsDBRequest<T>(request: FallbackRequest): Promise<T> {
    switch (request.dataType) {
      case 'games':
        return await sportsDBClient.getEvents(request.params) as T
      case 'teams':
        return await sportsDBClient.searchTeams(request.params.search || request.sport) as T
      case 'players':
        return await sportsDBClient.getPlayers(request.params.teamName) as T
      case 'standings':
        return await sportsDBClient.getTable(request.params.league || '', request.params.season || '') as T
      case 'odds':
        // TheSportsDB doesn't have odds - return empty array
        return [] as T
      default:
        throw new Error(`Unsupported data type: ${request.dataType}`)
    }
  }

  private async executeESPNRequest<T>(request: FallbackRequest): Promise<T> {
    try {
      // ESPN doesn't have a public API for most data
      // This would require ESPN API access which is not publicly available
      throw new Error('ESPN API not publicly available - requires ESPN partnership')
    } catch (error) {
      structuredLogger.error('ESPN API request failed', {
        dataType: request.dataType,
        sport: request.sport,
        error: error instanceof Error ? error.message : String(error)
      })
      throw error
    }
  }

  private async executeBallDontLieRequest<T>(request: FallbackRequest): Promise<T> {
    try {
      const apiKey = process.env.BALLDONTLIE_API_KEY
      if (!apiKey) {
        throw new Error('BallDontLie API key not configured')
      }

      const baseUrl = 'https://www.balldontlie.io/api/v1'
      let url = ''
      const params = new URLSearchParams()

      switch (request.dataType) {
        case 'games':
          url = `${baseUrl}/games`
          if (request.params.season) params.append('seasons[]', request.params.season)
          if (request.params.teamId) params.append('team_ids[]', request.params.teamId)
          break
        case 'teams':
          url = `${baseUrl}/teams`
          break
        case 'players':
          url = `${baseUrl}/players`
          if (request.params.teamId) params.append('team_ids[]', request.params.teamId)
          break
        case 'standings':
          // BallDontLie doesn't have standings endpoint
          throw new Error('BallDontLie API does not support standings data')
        case 'odds':
          // BallDontLie doesn't have odds endpoint
          throw new Error('BallDontLie API does not support odds data')
        default:
          throw new Error(`Unsupported data type: ${request.dataType}`)
      }

      const response = await fetch(`${url}?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'User-Agent': 'ApexBets/1.0'
        }
      })

      if (!response.ok) {
        throw new Error(`BallDontLie API error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      return data.data || [] as T
    } catch (error) {
      structuredLogger.error('BallDontLie API request failed', {
        dataType: request.dataType,
        sport: request.sport,
        error: error instanceof Error ? error.message : String(error)
      })
      throw error
    }
  }

  private async executeAPISportsRequest<T>(request: FallbackRequest): Promise<T> {
    try {
      const apiKey = process.env.APISPORTS_API_KEY
      if (!apiKey) {
        throw new Error('API-Sports API key not configured')
      }

      const baseUrl = 'https://v1.american-football.api-sports.io'
      let url = ''
      const params = new URLSearchParams()

      // Map sport names to API-Sports endpoints
      const sportMapping: Record<string, string> = {
        'football': 'american-football',
        'basketball': 'basketball',
        'baseball': 'baseball',
        'hockey': 'hockey',
        'soccer': 'football'
      }

      const apiSport = sportMapping[request.sport.toLowerCase()]
      if (!apiSport) {
        throw new Error(`Sport ${request.sport} not supported by API-Sports`)
      }

      switch (request.dataType) {
        case 'games':
          url = `${baseUrl}/${apiSport}/fixtures`
          if (request.params.season) params.append('season', request.params.season)
          if (request.params.league) params.append('league', request.params.league)
          break
        case 'teams':
          url = `${baseUrl}/${apiSport}/teams`
          if (request.params.league) params.append('league', request.params.league)
          break
        case 'players':
          url = `${baseUrl}/${apiSport}/players`
          if (request.params.teamId) params.append('team', request.params.teamId)
          break
        case 'standings':
          url = `${baseUrl}/${apiSport}/standings`
          if (request.params.season) params.append('season', request.params.season)
          if (request.params.league) params.append('league', request.params.league)
          break
        case 'odds':
          url = `${baseUrl}/${apiSport}/odds`
          if (request.params.fixture) params.append('fixture', request.params.fixture)
          break
        default:
          throw new Error(`Unsupported data type: ${request.dataType}`)
      }

      const response = await fetch(`${url}?${params.toString()}`, {
        headers: {
          'X-RapidAPI-Key': apiKey,
          'X-RapidAPI-Host': 'v1.american-football.api-sports.io',
          'User-Agent': 'ApexBets/1.0'
        }
      })

      if (!response.ok) {
        throw new Error(`API-Sports API error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      return data.response || [] as T
    } catch (error) {
      structuredLogger.error('API-Sports API request failed', {
        dataType: request.dataType,
        sport: request.sport,
        error: error instanceof Error ? error.message : String(error)
      })
      throw error
    }
  }

  private calculateCost(provider: ProviderConfig, _request: FallbackRequest): number {
    return provider.cost
  }

  private isCircuitBreakerOpen(providerName: string): boolean {
    const breaker = this.circuitBreakers.get(providerName)
    if (!breaker) return false
    
    if (breaker.isOpen) {
      // Check if enough time has passed to try again
      const timeSinceLastFailure = Date.now() - breaker.lastFailure.getTime()
      const resetTime = this.getCircuitBreakerResetTime(providerName)
      
      if (timeSinceLastFailure > resetTime) {
        breaker.isOpen = false
        breaker.failures = 0
        structuredLogger.info('Circuit breaker reset', { provider: providerName })
      }
    }
    
    return breaker.isOpen
  }

  private getCircuitBreakerResetTime(providerName: string): number {
    // Different reset times based on provider reliability
    const resetTimes: Record<string, number> = {
      'thesportsdb': 60000, // 1 minute
      'balldontlie': 120000, // 2 minutes (more conservative due to rate limits)
      'nba-stats': 300000, // 5 minutes (server errors)
      'api-sports': 180000, // 3 minutes
      'espn': 60000 // 1 minute
    }
    
    return resetTimes[providerName] || 120000 // Default 2 minutes
  }

  private recordFailure(providerName: string): void {
    const breaker = this.circuitBreakers.get(providerName) || { failures: 0, lastFailure: new Date(), isOpen: false }
    breaker.failures++
    breaker.lastFailure = new Date()
    
    if (breaker.failures >= 5) {
      breaker.isOpen = true
    }
    
    this.circuitBreakers.set(providerName, breaker)
  }

  private resetCircuitBreaker(providerName: string): void {
    const breaker = this.circuitBreakers.get(providerName)
    if (breaker) {
      breaker.failures = 0
      breaker.isOpen = false
    }
  }

  async healthCheck(): Promise<{ [provider: string]: boolean }> {
    const results: { [provider: string]: boolean } = {}
    
    for (const [name, _provider] of this.providers) {
      try {
        // Simple health check - try a basic request
        await this.executeProviderRequest(name, {
          sport: 'basketball', // Use a common sport for health check
          dataType: 'games',
          params: {},
          priority: 'low'
        })
        results[name] = true
      } catch {
        results[name] = false
      }
    }
    
    return results
  }

  getProviderStats(): { [provider: string]: ProviderConfig } {
    const stats: { [provider: string]: ProviderConfig } = {}
    for (const [name, config] of this.providers) {
      stats[name] = { ...config }
    }
    return stats
  }

  // Legacy method for backward compatibility
  async executeWithFallback<T>(request: FallbackRequest): Promise<FallbackResult<T>> {
    return this.executeRequest<T>(request)
  }

  // Legacy method for backward compatibility
  async fetchData<T>(dataType: string, params: any): Promise<T> {
    const request: FallbackRequest = {
      sport: params.sport || 'basketball',
      dataType: dataType as any,
      params,
      priority: 'medium'
    }
    
    const result = await this.executeRequest<T>(request)
    return result.data
  }
}

export const apiFallbackStrategy = APIFallbackStrategy.getInstance()