/**
 * The Odds API Client
 * Betting odds and live sports data
 */

interface OddsApiEvent {
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

interface OddsApiSports {
  key: string
  group: string
  title: string
  description: string
  active: boolean
  has_outrights: boolean
}

interface OddsApiScores {
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
  private rateLimitDelay = 6000 // 6 seconds between requests (10 requests/minute = 6 seconds)
  private lastRequestTime = 0

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  private async rateLimit(): Promise<void> {
    const now = Date.now()
    const timeSinceLastRequest = now - this.lastRequestTime
    if (timeSinceLastRequest < this.rateLimitDelay) {
      await new Promise(resolve => setTimeout(resolve, this.rateLimitDelay - timeSinceLastRequest))
    }
    this.lastRequestTime = Date.now()
  }

  private async request<T>(endpoint: string): Promise<T> {
    await this.rateLimit()
    
    try {
      // Add API key as query parameter
      const separator = endpoint.includes('?') ? '&' : '?'
      const url = `${this.baseUrl}${endpoint}${separator}apiKey=${this.apiKey}`
      
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      if (!response.ok) {
        if (response.status === 429) {
          throw new Error('Rate limit exceeded. Please wait before making more requests.')
        }
        throw new Error(`Odds API Error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error('Odds API request failed:', error)
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
