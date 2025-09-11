/**
 * TheSportsDB API Client
 * Free multi-sport API with generous rate limits
 */

export interface SportsDBEvent {
  idEvent: string
  strEvent: string
  strHomeTeam: string
  strAwayTeam: string
  dateEvent: string
  strTime: string
  strStatus: string
  intHomeScore?: string
  intAwayScore?: string
  strLeague: string
  strSport: string
  strVenue?: string
}

export interface SportsDBTeam {
  idTeam: string
  strTeam: string
  strTeamShort: string
  strLeague: string
  strSport: string
  strStadium?: string
  strTeamBadge?: string
}

export interface SportsDBPlayer {
  idPlayer: string
  strPlayer: string
  strTeam: string
  strPosition?: string
  strThumb?: string
}

export class SportsDBClient {
  private baseUrl = 'https://www.thesportsdb.com/api/v1/json'
  private apiKey: string
  private rateLimitDelay = 1000 // 1 second between requests (60 req/min = 1 sec)
  private lastRequestTime = 0

  constructor(apiKey: string = '123') {
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
      // TheSportsDB uses the API key in the URL path, not as a header
      const url = `${this.baseUrl}/${this.apiKey}${endpoint}`
      
      // Validate URL before making request
      if (!this.isValidUrl(url)) {
        throw new Error(`Invalid SportsDB API URL: ${url}`)
      }

      // Making SportsDB API request
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'ApexBets/1.0.0'
        },
        // Add timeout to prevent hanging requests
        signal: AbortSignal.timeout(10000) // 10 second timeout
      })
      
      if (!response.ok) {
        if (response.status === 429) {
          throw new Error('Rate limit exceeded. Please wait before making more requests.')
        }
        if (response.status === 404) {
          throw new Error('SportsDB API endpoint not found. Check API key and endpoint.')
        }
        if (response.status >= 500) {
          throw new Error(`SportsDB API server error: ${response.status} ${response.statusText}`)
        }
        throw new Error(`SportsDB API Error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      
      // Validate response data
      if (!data || typeof data !== 'object') {
        throw new Error('Invalid response format from SportsDB API')
      }
      
      return data
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          console.error('SportsDB API request timed out:', error.message)
          throw new Error('SportsDB API request timed out. Please try again.')
        }
        if (error.message.includes('fetch failed') || error.message.includes('Failed to fetch')) {
          console.error('SportsDB API network error:', error.message)
          throw new Error('Network error connecting to SportsDB API. Please check your internet connection.')
        }
        console.error('SportsDB API request failed:', error.message)
        throw error
      }
      console.error('SportsDB API request failed with unknown error:', error)
      throw new Error('Unknown error occurred while connecting to SportsDB API')
    }
  }

  private isValidUrl(url: string): boolean {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }

  // Events/Games
  async getEventsByDate(date: string, sport?: string): Promise<SportsDBEvent[]> {
    const endpoint = sport 
      ? `/eventsday.php?d=${date}&s=${sport}`
      : `/eventsday.php?d=${date}`
    
    const data = await this.request<{ events: SportsDBEvent[] }>(endpoint)
    return data.events || []
  }

  async getEventById(eventId: string): Promise<SportsDBEvent | null> {
    const data = await this.request<{ events: SportsDBEvent[] }>(`/lookupevent.php?id=${eventId}`)
    return data.events?.[0] || null
  }

  async getLiveEvents(sport?: string): Promise<SportsDBEvent[]> {
    const endpoint = sport ? `/livescore.php?s=${sport}` : '/livescore.php'
    const data = await this.request<{ events: SportsDBEvent[] }>(endpoint)
    return data.events || []
  }

  // Teams
  async getTeamsByLeague(leagueId: string): Promise<SportsDBTeam[]> {
    const data = await this.request<{ teams: SportsDBTeam[] }>(`/lookup_all_teams.php?id=${leagueId}`)
    return data.teams || []
  }

  async getTeamById(teamId: string): Promise<SportsDBTeam | null> {
    const data = await this.request<{ teams: SportsDBTeam[] }>(`/lookupteam.php?id=${teamId}`)
    return data.teams?.[0] || null
  }

  // Players
  async getPlayersByTeam(teamId: string): Promise<SportsDBPlayer[]> {
    const data = await this.request<{ player: SportsDBPlayer[] }>(`/lookup_all_players.php?id=${teamId}`)
    return data.player || []
  }

  // Leagues
  async getLeaguesBySport(sport: string): Promise<any[]> {
    const data = await this.request<{ leagues: any[] }>(`/search_all_leagues.php?s=${sport}`)
    return data.leagues || []
  }

  // Search
  async searchTeams(query: string): Promise<SportsDBTeam[]> {
    const data = await this.request<{ teams: SportsDBTeam[] }>(`/searchteams.php?t=${encodeURIComponent(query)}`)
    return data.teams || []
  }

  async searchEvents(query: string): Promise<SportsDBEvent[]> {
    const data = await this.request<{ event: SportsDBEvent[] }>(`/searchevents.php?e=${encodeURIComponent(query)}`)
    return data.event || []
  }

  // Health check method
  async healthCheck(): Promise<boolean> {
    try {
      // Test with a simple API call
      await this.request<{ events: any[] }>('/eventsday.php?d=2024-01-01')
      return true
    } catch (error) {
      console.error('SportsDB API health check failed:', error)
      return false
    }
  }
}

// Create instance with API key from environment or use free key
const getSportsDBApiKey = (): string => {
  const apiKey = process.env.NEXT_PUBLIC_SPORTSDB_API_KEY
  if (!apiKey || apiKey === 'your_sportsdb_api_key' || apiKey === '') {
    console.warn('NEXT_PUBLIC_SPORTSDB_API_KEY not configured, using free tier')
    return '123' // Free tier key
  }
  return apiKey
}

// Validate API key format
const validateApiKey = (apiKey: string): boolean => {
  // SportsDB API keys are typically numeric strings
  return /^\d+$/.test(apiKey) && apiKey.length >= 3
}

// Create client with validation
const createSportsDBClient = (): SportsDBClient => {
  const apiKey = getSportsDBApiKey()
  
  if (!validateApiKey(apiKey)) {
    console.warn(`Invalid SportsDB API key format: ${apiKey}. Using free tier key.`)
    return new SportsDBClient('123')
  }
  
  return new SportsDBClient(apiKey)
}

export const sportsDBClient = createSportsDBClient()
