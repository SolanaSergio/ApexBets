/**
 * TheSportsDB API Client
 * Free multi-sport API with generous rate limits
 */

interface SportsDBEvent {
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

interface SportsDBTeam {
  idTeam: string
  strTeam: string
  strTeamShort: string
  strLeague: string
  strSport: string
  strStadium?: string
  strTeamBadge?: string
}

interface SportsDBPlayer {
  idPlayer: string
  strPlayer: string
  strTeam: string
  strPosition?: string
  strThumb?: string
}

export class SportsDBClient {
  private baseUrl = 'https://www.thesportsdb.com/api/v1/json'
  private apiKey: string
  private rateLimitDelay = 2000 // 2 seconds between requests (30 req/min = 2 sec)
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
      const response = await fetch(url)
      
      if (!response.ok) {
        if (response.status === 429) {
          throw new Error('Rate limit exceeded. Please wait before making more requests.')
        }
        throw new Error(`SportsDB API Error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error('SportsDB API request failed:', error)
      throw error
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
}

// Create instance with API key from environment or use free key
export const sportsDBClient = new SportsDBClient(process.env.NEXT_PUBLIC_SPORTSDB_API_KEY || '123')
