/**
 * The Odds API Client
 * Betting odds and live sports data with proper rate limiting and error handling
 */

import { enhancedRateLimiter } from '../services/enhanced-rate-limiter'
import { structuredLogger } from '../services/structured-logger'
import { apiSpecificErrorHandler } from '../services/api-specific-error-handlers'

export interface OddsApiEvent {
  id: string
  sport_key: string
  sport_title: string
  commence_time: string
  home_team: string
  away_team: string
  bookmakers: {
    key: string
    title: string
    last_update: string
    markets: {
      key: string
      outcomes: {
        name: string
        price: number
        point?: number
      }[]
    }[]
  }[]
}

export interface OddsApiSports {
  key: string
  group: string
  title: string
  description: string
  active: boolean
  has_outrights: boolean
}

export interface OddsApiScores {
  id: string
  sport_key: string
  sport_title: string
  commence_time: string
  completed: boolean
  home_team: string
  away_team: string
  scores: {
    name: string
    score: string
  }[]
  last_update: string
}

export class OddsApiClient {
  private baseUrl = 'https://api.the-odds-api.com/v4'
  private apiKey: string
  private provider = 'odds-api'

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  private async request<T>(endpoint: string, retryCount = 0): Promise<T> {
    try {
      // Check rate limits before making request
      const rateLimitResult = await enhancedRateLimiter.checkRateLimit(this.provider, endpoint)
      
      if (!rateLimitResult.allowed) {
        const retryAfter = rateLimitResult.retryAfter || 60
        structuredLogger.warn('Odds API rate limit exceeded', {
          provider: this.provider,
          endpoint,
          retryAfter,
          remaining: rateLimitResult.remaining
        })
        
        // Wait for the retry period
        await new Promise(resolve => setTimeout(resolve, retryAfter * 1000))
        
        // Retry once after waiting
        if (retryCount < 1) {
          return this.request<T>(endpoint, retryCount + 1)
        }
        
        throw new Error(`Rate limit exceeded. Retry after ${retryAfter} seconds.`)
      }

      // Add API key as query parameter
      const separator = endpoint.includes('?') ? '&' : '?'
      const url = `${this.baseUrl}${endpoint}${separator}apiKey=${this.apiKey}`
      
      const startTime = Date.now()
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout
      
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
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
        
        if (response.status === 429) {
          structuredLogger.rateLimitExceeded(this.provider, 10, {
            endpoint,
            retryAfter: errorResult.retryAfterMs
          })
          
          if (errorResult.shouldRetry && retryCount < 2) {
            const delay = errorResult.retryAfterMs || 60000
            await new Promise(resolve => setTimeout(resolve, delay))
            return this.request<T>(endpoint, retryCount + 1)
          }
          
          throw new Error(`Rate limit exceeded. Please wait before making more requests.`)
        } else if (response.status === 404) {
          // Return empty array for 404 (no data available)
          structuredLogger.warn('Odds API: No data available for the requested parameters', {
            endpoint,
            provider: this.provider
          })
          return [] as T
        } else if (response.status === 401) {
          structuredLogger.error('Odds API authentication failed', {
            endpoint,
            provider: this.provider,
            status: response.status
          })
          throw new Error('Odds API Error: 401 Unauthorized - Invalid API key. Please check your NEXT_PUBLIC_ODDS_API_KEY environment variable.')
        } else if (response.status >= 500) {
          if (errorResult.shouldRetry && retryCount < 2) {
            const delay = errorResult.retryAfterMs || 5000
            await new Promise(resolve => setTimeout(resolve, delay))
            return this.request<T>(endpoint, retryCount + 1)
          }
        }
        
        throw new Error(`Odds API Error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      
      // Log successful response
      structuredLogger.info('Odds API request successful', {
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
        retryCount,
        shouldRetry: errorResult.shouldRetry
      })
      
      if (errorResult.shouldRetry && retryCount < 2) {
        const delay = errorResult.retryAfterMs || 5000
        await new Promise(resolve => setTimeout(resolve, delay))
        return this.request<T>(endpoint, retryCount + 1)
      }
      
      throw error
    }
  }

  // Sports
  async getSports(): Promise<OddsApiSports[]> {
    return this.request<OddsApiSports[]>('/sports')
  }

  // Odds
  async getOdds(params: {
    sport: string
    regions?: string
    markets?: string
    oddsFormat?: string
    dateFormat?: string
    bookmakers?: string
    commenceTimeFrom?: string
    commenceTimeTo?: string
  }): Promise<OddsApiEvent[]> {
    const searchParams = new URLSearchParams()
    
    searchParams.set('sport', params.sport)
    if (params.regions) searchParams.set('regions', params.regions)
    if (params.markets) searchParams.set('markets', params.markets)
    if (params.oddsFormat) searchParams.set('oddsFormat', params.oddsFormat)
    if (params.dateFormat) searchParams.set('dateFormat', params.dateFormat)
    if (params.bookmakers) searchParams.set('bookmakers', params.bookmakers)
    if (params.commenceTimeFrom) searchParams.set('commenceTimeFrom', params.commenceTimeFrom)
    if (params.commenceTimeTo) searchParams.set('commenceTimeTo', params.commenceTimeTo)

    const query = searchParams.toString()
    return this.request<OddsApiEvent[]>(`/odds?${query}`)
  }

  // Scores
  async getScores(params: {
    sport?: string
    daysFrom?: number
    dateFormat?: string
  } = {}): Promise<OddsApiScores[]> {
    const searchParams = new URLSearchParams()
    
    if (params.sport) searchParams.set('sport', params.sport)
    if (params.daysFrom) searchParams.set('daysFrom', params.daysFrom.toString())
    if (params.dateFormat) searchParams.set('dateFormat', params.dateFormat)

    const query = searchParams.toString()
    return this.request<OddsApiScores[]>(`/scores?${query}`)
  }

  // Event details
  async getEventDetails(eventId: string): Promise<OddsApiEvent> {
    return this.request<OddsApiEvent>(`/events/${eventId}`)
  }

  // Historical odds
  async getHistoricalOdds(params: {
    sport: string
    eventId: string
    regions?: string
    markets?: string
    oddsFormat?: string
    dateFormat?: string
    bookmakers?: string
  }): Promise<any> {
    const searchParams = new URLSearchParams()
    
    searchParams.set('sport', params.sport)
    searchParams.set('eventId', params.eventId)
    if (params.regions) searchParams.set('regions', params.regions)
    if (params.markets) searchParams.set('markets', params.markets)
    if (params.oddsFormat) searchParams.set('oddsFormat', params.oddsFormat)
    if (params.dateFormat) searchParams.set('dateFormat', params.dateFormat)
    if (params.bookmakers) searchParams.set('bookmakers', params.bookmakers)

    const query = searchParams.toString()
    return this.request<any>(`/historical-odds?${query}`)
  }

  // Usage information
  async getUsage(): Promise<{
    requests_used: number
    requests_remaining: number
  }> {
    return this.request<{
      requests_used: number
      requests_remaining: number
    }>('/usage')
  }
}

// Create instance with API key from environment
const getOddsApiKey = (): string | null => {
  const apiKey = process.env.NEXT_PUBLIC_ODDS_API_KEY
  if (!apiKey || apiKey === 'your_odds_api_key' || apiKey === '') {
    return null
  }
  return apiKey
}

// Lazy initialization to avoid errors at module load time
let _oddsApiClient: OddsApiClient | null = null

export const getOddsApiClient = (): OddsApiClient | null => {
  if (!_oddsApiClient) {
    const apiKey = getOddsApiKey()
    if (apiKey) {
      _oddsApiClient = new OddsApiClient(apiKey)
    }
  }
  return _oddsApiClient
}

// For backward compatibility - returns null if API key is not configured
export const oddsApiClient = getOddsApiClient()
