/**
 * API-SPORTS Client
 * Fast real-time sports data with 15-second updates
 * Integrated with enhanced rate limiter and proper error handling
 */

import { enhancedRateLimiter } from '../services/enhanced-rate-limiter'
import { structuredLogger } from '../services/structured-logger'
import { apiSpecificErrorHandler } from '../services/api-specific-error-handlers'

export interface ApiSportsFixture {
  fixture: {
    id: number
    referee: string
    timezone: string
    date: string
    timestamp: number
    periods: {
      first: number | null
      second: number | null
    }
    venue: {
      id: number
      name: string
      city: string
    }
    status: {
      long: string
      short: string
      elapsed: number | null
    }
  }
  league: {
    id: number
    name: string
    country: string
    logo: string
    flag: string
    season: number
    round: string
  }
  teams: {
    home: {
      id: number
      name: string
      logo: string
      winner: boolean | null
    }
    away: {
      id: number
      name: string
      logo: string
      winner: boolean | null
    }
  }
  goals: {
    home: number | null
    away: number | null
  }
  score: {
    halftime: {
      home: number | null
      away: number | null
    }
    fulltime: {
      home: number | null
      away: number | null
    }
    extratime: {
      home: number | null
      away: number | null
    }
    penalty: {
      home: number | null
      away: number | null
    }
  }
}

export interface ApiSportsTeam {
  team: {
    id: number
    name: string
    code: string
    country: string
    founded: number
    national: boolean
    logo: string
  }
  venue: {
    id: number
    name: string
    address: string
    city: string
    capacity: number
    surface: string
    image: string
  }
}

export interface ApiSportsStanding {
  rank: number
  team: {
    id: number
    name: string
    logo: string
  }
  points: number
  goalsDiff: number
  group: string
  form: string
  status: string
  description: string
  all: {
    played: number
    win: number
    draw: number
    lose: number
    goals: {
      for: number
      against: number
    }
  }
  home: {
    played: number
    win: number
    draw: number
    lose: number
    goals: {
      for: number
      against: number
    }
  }
  away: {
    played: number
    win: number
    draw: number
    lose: number
    goals: {
      for: number
      against: number
    }
  }
}

import { apiKeyRotation } from '../services/api-key-rotation'

export class ApiSportsClient {
  private baseUrl = 'https://api-football-v1.p.rapidapi.com/v3'
  private maxRetries = 3
  private provider = 'api-sports'

  constructor() {
    // API key is now managed by the rotation service
  }

  private getApiKey(): string | null {
    const key = apiKeyRotation.getCurrentKey('api-sports')
    if (!key || key === 'your_rapidapi_key_here') {
      structuredLogger.warn('API-Sports: No valid RapidAPI key configured', {
        provider: this.provider
      })
      return null
    }
    return key
  }

  public get isConfigured(): boolean {
    const key = this.getApiKey()
    return !!key && key !== 'your_rapidapi_key_here'
  }

  private async request<T>(endpoint: string, retryAttempt: number = 0): Promise<T> {
    try {
      // Check rate limits before making request
      const rateLimitResult = await enhancedRateLimiter.checkRateLimit(this.provider, endpoint)
      
      if (!rateLimitResult.allowed) {
        const retryAfter = rateLimitResult.retryAfter || 60
        structuredLogger.warn('API-Sports rate limit exceeded', {
          provider: this.provider,
          endpoint,
          retryAfter,
          remaining: rateLimitResult.remaining
        })
        
        // Wait for the retry period
        await new Promise(resolve => setTimeout(resolve, retryAfter * 1000))
        
        // Retry once after waiting
        if (retryAttempt < 1) {
          return this.request<T>(endpoint, retryAttempt + 1)
        }
        
        throw new Error(`Rate limit exceeded. Retry after ${retryAfter} seconds.`)
      }
      
      // Get current API key from rotation service
      const apiKey = this.getApiKey()
      if (!apiKey || apiKey === '') {
        structuredLogger.warn('API-SPORTS API key not configured, returning empty data', {
          provider: this.provider,
          endpoint
        })
        return { response: [] } as T
      }
    
      const startTime = Date.now()
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout
      
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        headers: {
          'X-RapidAPI-Key': apiKey,
          'X-RapidAPI-Host': 'api-football-v1.p.rapidapi.com',
          'User-Agent': 'ApexBets/1.0'
        },
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      
      const duration = Date.now() - startTime
      
      // Log API call for monitoring
      structuredLogger.apiCall('GET', endpoint, response.status, duration, {
        provider: this.provider,
        remaining: rateLimitResult.remaining
      })
      
      if (!response.ok) {
        const errorResult = apiSpecificErrorHandler.handleError(
          this.provider,
          new Error(`HTTP ${response.status}: ${response.statusText}`),
          response.status
        )
        
        if (response.status === 401) {
          structuredLogger.error('API-SPORTS authentication failed', {
            endpoint,
            provider: this.provider,
            status: response.status
          })
          apiKeyRotation.rotateToNextKey('api-sports', 'invalid')
          if (retryAttempt < this.maxRetries) {
            return this.request<T>(endpoint, retryAttempt + 1)
          }
          return { response: [] } as T
        } else if (response.status === 403) {
          structuredLogger.warn('API-SPORTS access denied', {
            endpoint,
            provider: this.provider,
            status: response.status
          })
          if (retryAttempt < this.maxRetries) {
            const delay = errorResult.retryAfterMs || 5000
            await new Promise(resolve => setTimeout(resolve, delay))
            return this.request<T>(endpoint, retryAttempt + 1)
          } else {
            return { response: [] } as T
          }
        } else if (response.status === 429) {
          structuredLogger.rateLimitExceeded(this.provider, 2, {
            endpoint,
            retryAfter: errorResult.retryAfterMs
          })
          apiKeyRotation.rotateToNextKey('api-sports', 'rate_limit')
          if (retryAttempt < this.maxRetries) {
            const delay = errorResult.retryAfterMs || 60000
            await new Promise(resolve => setTimeout(resolve, delay))
            return this.request<T>(endpoint, retryAttempt + 1)
          } else {
            throw new Error(`API-SPORTS API Error: 429 Too Many Requests - Max retries exceeded`)
          }
        } else if (response.status >= 500) {
          if (errorResult.shouldRetry && retryAttempt < this.maxRetries) {
            const delay = errorResult.retryAfterMs || 5000
            await new Promise(resolve => setTimeout(resolve, delay))
            return this.request<T>(endpoint, retryAttempt + 1)
          } else {
            throw new Error(`API-SPORTS API Error: ${response.status} ${response.statusText}`)
          }
        } else {
          throw new Error(`API-SPORTS API Error: ${response.status} ${response.statusText}`)
        }
      }

      const data = await response.json()
      
      // Log successful response
      structuredLogger.info('API-SPORTS request successful', {
        provider: this.provider,
        endpoint,
        duration,
        dataSize: JSON.stringify(data).length
      })
      
      return data
    } catch (error) {
      const errorResult = apiSpecificErrorHandler.handleError(
        this.provider,
        error instanceof Error ? error : new Error(String(error))
      )
      
      structuredLogger.serviceError(this.provider, error instanceof Error ? error : new Error(String(error)), {
        endpoint,
        retryAttempt,
        shouldRetry: errorResult.shouldRetry
      })
      
      if (errorResult.shouldRetry && retryAttempt < this.maxRetries) {
        const delay = errorResult.retryAfterMs || 5000
        await new Promise(resolve => setTimeout(resolve, delay))
        return this.request<T>(endpoint, retryAttempt + 1)
      }
      
      throw error
    }
  }

  // Fixtures/Games
  async getFixtures(params: {
    league?: number
    season?: number
    team?: number
    date?: string
    next?: number
    last?: number
    live?: string
  } = {}): Promise<ApiSportsFixture[]> {
    const searchParams = new URLSearchParams()
    
    if (params.league) searchParams.set('league', params.league.toString())
    if (params.season) searchParams.set('season', params.season.toString())
    if (params.team) searchParams.set('team', params.team.toString())
    if (params.date) searchParams.set('date', params.date)
    if (params.next) searchParams.set('next', params.next.toString())
    if (params.last) searchParams.set('last', params.last.toString())
    if (params.live) searchParams.set('live', params.live)

    const query = searchParams.toString()
    const data = await this.request<{ response: ApiSportsFixture[] }>(`/fixtures?${query}`)
    return data.response || []
  }

  async getFixtureById(fixtureId: number): Promise<ApiSportsFixture | null> {
    const data = await this.request<{ response: ApiSportsFixture[] }>(`/fixtures?id=${fixtureId}`)
    return data.response?.[0] || null
  }

  async getLiveFixtures(): Promise<ApiSportsFixture[]> {
    const data = await this.request<{ response: ApiSportsFixture[] }>('/fixtures?live=all')
    return data.response || []
  }

  // Teams
  async getTeams(leagueId: number, season: number): Promise<ApiSportsTeam[]> {
    const data = await this.request<{ response: ApiSportsTeam[] }>(`/teams?league=${leagueId}&season=${season}`)
    return data.response || []
  }

  async getTeamById(teamId: number): Promise<ApiSportsTeam | null> {
    const data = await this.request<{ response: ApiSportsTeam[] }>(`/teams?id=${teamId}`)
    return data.response?.[0] || null
  }

  // Standings
  async getStandings(leagueId: number, season: number): Promise<ApiSportsStanding[]> {
    const data = await this.request<{ response: { league: { standings: ApiSportsStanding[][] } }[] }>(`/standings?league=${leagueId}&season=${season}`)
    return data.response?.[0]?.league?.standings?.[0] || []
  }

  // Leagues
  async getLeagues(country?: string): Promise<any[]> {
    const endpoint = country ? `/leagues?country=${country}` : '/leagues'
    const data = await this.request<{ response: any[] }>(endpoint)
    return data.response || []
  }

  // Head to Head
  async getHeadToHead(team1: number, team2: number, last?: number): Promise<ApiSportsFixture[]> {
    const endpoint = last ? `/fixtures/headtohead?h2h=${team1}-${team2}&last=${last}` : `/fixtures/headtohead?h2h=${team1}-${team2}`
    const data = await this.request<{ response: ApiSportsFixture[] }>(endpoint)
    return data.response || []
  }

  // Statistics
  async getTeamStatistics(teamId: number, leagueId: number, season: number): Promise<any> {
    const data = await this.request<{ response: any }>(`/teams/statistics?team=${teamId}&league=${leagueId}&season=${season}`)
    return data.response || null
  }
}

// Create instance with API key rotation support
const getApiSportsKey = (): string => {
  const apiKey = apiKeyRotation.getCurrentKey('api-sports')
  if (!apiKey || apiKey === '') {
    return '' // Return empty string instead of throwing error
  }
  return apiKey
}

// Create client lazily to avoid module load errors
let _apiSportsClient: ApiSportsClient | null = null

const getClient = (): ApiSportsClient => {
  if (!_apiSportsClient) {
    _apiSportsClient = new ApiSportsClient()
  }
  return _apiSportsClient
}

export const apiSportsClient = {
  // Check if API key is available
  get isConfigured(): boolean {
    const apiKey = getApiSportsKey()
    return apiKey !== ''
  },

  // Delegate all methods to the client instance
  async getLeagues(): Promise<any> {
    if (!this.isConfigured) {
      console.warn('API-SPORTS API key not configured, returning empty data')
      return []
    }
    return getClient().getLeagues()
  },

  async getTeams(leagueId: number, season: number): Promise<any> {
    if (!this.isConfigured) {
      console.warn('API-SPORTS API key not configured, returning empty data')
      return []
    }
    return getClient().getTeams(leagueId, season)
  },

  async getFixtures(params: {
    league?: number
    season?: number
    team?: number
    date?: string
    next?: number
    last?: number
    live?: string
  } = {}): Promise<any> {
    if (!this.isConfigured) {
      console.warn('API-SPORTS API key not configured, returning empty data')
      return []
    }
    return getClient().getFixtures(params)
  },

  async getTeamStatistics(teamId: number, leagueId: number, season: number): Promise<any> {
    if (!this.isConfigured) {
      console.warn('API-SPORTS API key not configured, returning empty data')
      return null
    }
    return getClient().getTeamStatistics(teamId, leagueId, season)
  },

  async getStandings(leagueId: number, season: number): Promise<any> {
    if (!this.isConfigured) {
      console.warn('API-SPORTS API key not configured, returning empty data')
      return []
    }
    return getClient().getStandings(leagueId, season)
  }
}
