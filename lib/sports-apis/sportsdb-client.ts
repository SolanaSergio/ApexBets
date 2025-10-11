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
  // Rate limiting is now handled by the centralized Enhanced Rate Limiter

  constructor(apiKey: string = '123') {
    this.apiKey = apiKey
  }

  // Rate limiting is now handled by the centralized Enhanced Rate Limiter

  private async request<T>(endpoint: string): Promise<T> {
    // Rate limiting is now handled by the centralized Enhanced Rate Limiter

    try {
      // TheSportsDB uses the API key in the URL path, not as a header
      const url = `${this.baseUrl}/${this.apiKey}${endpoint}`

      // Validate URL before making request
      if (!this.isValidUrl(url)) {
        throw new Error(`Invalid SportsDB API URL: ${url}`)
      }

      // Making SportsDB API request
      console.log(`SportsDB API request: ${url}`)

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'User-Agent': 'ApexBets/1.0.0',
        },
        // Add timeout to prevent hanging requests
        signal: AbortSignal.timeout(10000), // 10 second timeout
      })

      console.log(`SportsDB API response status: ${response.status}`)

      if (!response.ok) {
        if (response.status === 429) {
          console.warn('SportsDB: Rate limit hit - this should be handled by Enhanced Rate Limiter')
          throw new Error('SportsDB API: Rate limit exceeded')
        }
        if (response.status === 404) {
          // Don't count 404s as rate limit errors
          throw new Error('SportsDB API endpoint not found. Check API key and endpoint.')
        }
        if (response.status >= 500) {
          // Don't count server errors as rate limit errors
          throw new Error(`SportsDB API server error: ${response.status} ${response.statusText}`)
        }
        throw new Error(`SportsDB API Error: ${response.status} ${response.statusText}`)
      }

      // Rate limiting is now handled by the centralized Enhanced Rate Limiter

      // Some SportsDB endpoints may return empty body on errors; guard parsing
      const text = await response.text()
      if (!text || text.trim() === '') {
        throw new Error('Empty response body from SportsDB API')
      }
      let data: any
      try {
        data = JSON.parse(text)
      } catch (e) {
        throw new Error('Invalid JSON response from SportsDB API')
      }

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
          throw new Error(
            'Network error connecting to SportsDB API. Please check your internet connection.'
          )
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
    const endpoint = sport ? `/eventsday.php?d=${date}&s=${sport}` : `/eventsday.php?d=${date}`

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
    const data = await this.request<{ teams: SportsDBTeam[] }>(
      `/lookup_all_teams.php?id=${leagueId}`
    )
    return data.teams || []
  }

  async getTeamById(teamId: string): Promise<SportsDBTeam | null> {
    const data = await this.request<{ teams: SportsDBTeam[] }>(`/lookupteam.php?id=${teamId}`)
    return data.teams?.[0] || null
  }

  // Players
  async getPlayersByTeam(teamId: string): Promise<SportsDBPlayer[]> {
    const data = await this.request<{ player: SportsDBPlayer[] }>(
      `/lookup_all_players.php?id=${teamId}`
    )
    return data.player || []
  }

  // Leagues
  async getLeaguesBySport(sport: string): Promise<any[]> {
    const data = await this.request<{ leagues: any[] }>(`/search_all_leagues.php?s=${sport}`)
    return data.leagues || []
  }

  // Search
  async searchTeams(query: string): Promise<SportsDBTeam[]> {
    const data = await this.request<{ teams: SportsDBTeam[] }>(
      `/searchteams.php?t=${encodeURIComponent(query)}`
    )
    return data.teams || []
  }

  async searchEvents(query: string): Promise<SportsDBEvent[]> {
    const data = await this.request<{ event: SportsDBEvent[] }>(
      `/searchevents.php?e=${encodeURIComponent(query)}`
    )
    return data.event || []
  }

  // Additional methods needed by API fallback strategy
  async getEvents(params: { date?: string; sport?: string } = {}): Promise<SportsDBEvent[]> {
    const date = params.date || new Date().toISOString().split('T')[0]
    return this.getEventsByDate(date, params.sport)
  }

  async getTeams(league?: string): Promise<SportsDBTeam[]> {
    if (league) {
      // Try to find league ID first
      const leagues = await this.getLeaguesBySport('Soccer') // Default fallback
      const targetLeague = leagues.find(l =>
        l.strLeague?.toLowerCase().includes(league.toLowerCase())
      )
      if (targetLeague) {
        return this.getTeamsByLeague(targetLeague.idLeague)
      }
    }
    // Return empty array if no league specified or found
    return []
  }

  async getPlayers(teamName?: string): Promise<SportsDBPlayer[]> {
    if (teamName) {
      const teams = await this.searchTeams(teamName)
      if (teams.length > 0) {
        return this.getPlayersByTeam(teams[0].idTeam)
      }
    }
    return []
  }

  async getTable(_league: string, _season: string): Promise<any[]> {
    // TheSportsDB doesn't have a direct standings endpoint
    // Return empty array for now - this would need to be implemented
    // with a different endpoint or API
    console.warn('getTable method not fully implemented for TheSportsDB')
    return []
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

  // Rate limiting is now handled by the centralized Enhanced Rate Limiter

  /**
   * Get current rate limit status
   */
  // Rate limiting is now handled by the centralized Enhanced Rate Limiter
}

// Create instance with API key from environment or use free key
const getSportsDBApiKey = (): string => {
  const apiKey = process.env.NEXT_PUBLIC_SPORTSDB_API_KEY
  if (!apiKey) {
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
