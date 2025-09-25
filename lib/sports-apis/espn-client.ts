/**
 * ESPN Hidden API Client
 * Free access to ESPN sports data without authentication
 * Coverage: NFL, NBA, MLB, NHL, College sports
 */

export interface ESPNGame {
  id: string
  uid: string
  date: string
  name: string
  shortName: string
  competitions: Array<{
    id: string
    uid: string
    date: string
    attendance: number
    type: {
      id: string
      abbreviation: string
    }
    timeValid: boolean
    neutralSite: boolean
    conferenceCompetition: boolean
    recent: boolean
    venue: {
      id: string
      fullName: string
      address: {
        city: string
        state: string
      }
      capacity: number
      indoor: boolean
    }
    competitors: Array<{
      id: string
      uid: string
      type: string
      order: number
      homeAway: string
      team: {
        id: string
        uid: string
        location: string
        name: string
        abbreviation: string
        displayName: string
        shortDisplayName: string
        color: string
        alternateColor: string
        isActive: boolean
        venue: {
          id: string
        }
        links: Array<{
          rel: string[]
          href: string
          text: string
          isExternal: boolean
          isPremium: boolean
        }>
        logo: string
      }
      score: string
      linescores?: Array<{
        value: number
        displayValue: string
      }>
      statistics: Array<any>
      records: Array<{
        name: string
        abbreviation: string
        type: string
        summary: string
      }>
    }>
    notes: Array<any>
    status: {
      clock: number
      displayClock: string
      period: number
      type: {
        id: string
        name: string
        state: string
        completed: boolean
        description: string
        detail: string
        shortDetail: string
      }
    }
    broadcasts: Array<{
      market: string
      names: string[]
    }>
    leaders: Array<{
      name: string
      displayName: string
      shortDisplayName: string
      abbreviation: string
      leaders: Array<{
        displayValue: string
        value: number
        athlete: {
          id: string
          fullName: string
          displayName: string
          shortName: string
          links: Array<{
            rel: string[]
            href: string
          }>
          headshot: string
          jersey: string
          position: {
            abbreviation: string
          }
          team: {
            id: string
          }
        }
      }>
    }>
  }>
  links: Array<{
    language: string
    rel: string[]
    href: string
    text: string
    shortText: string
    isExternal: boolean
    isPremium: boolean
  }>
  status: {
    clock: number
    displayClock: string
    period: number
    type: {
      id: string
      name: string
      state: string
      completed: boolean
      description: string
      detail: string
      shortDetail: string
    }
  }
}

export interface ESPNTeam {
  id: string
  uid: string
  slug: string
  location: string
  name: string
  abbreviation: string
  displayName: string
  shortDisplayName: string
  color: string
  alternateColor: string
  isActive: boolean
  isAllStar: boolean
  logos: Array<{
    href: string
    alt: string
    rel: string[]
    width: number
    height: number
  }>
  record: {
    items: Array<{
      description: string
      type: string
      summary: string
      stats: Array<{
        name: string
        value: number
      }>
    }>
  }
}

export interface ESPNStanding {
  team: ESPNTeam
  note: {
    color: string
    description: string
    rank: number
  }
  stats: Array<{
    name: string
    displayName: string
    shortDisplayName: string
    description: string
    abbreviation: string
    type: string
    value: number
    displayValue: string
  }>
}

export class ESPNClient {
  private baseUrl = 'http://site.api.espn.com/apis/site/v2/sports'
  private maxRetries = 2 // Fewer retries for free API
  // Rate limiting is now handled by the centralized Enhanced Rate Limiter

  private async request<T>(endpoint: string, retryAttempt: number = 0): Promise<T> {
    // Rate limiting is now handled by the centralized Enhanced Rate Limiter
    
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`)
      
      if (!response.ok) {
        if (response.status === 429 && retryAttempt < this.maxRetries) {
          console.warn('ESPN API: Rate limit hit, retrying...')
          await new Promise(resolve => setTimeout(resolve, 2000 * (retryAttempt + 1)))
          return this.request<T>(endpoint, retryAttempt + 1)
        }
        
        if (response.status >= 500 && retryAttempt < this.maxRetries) {
          console.warn(`ESPN API: Server error ${response.status}, retrying...`)
          await new Promise(resolve => setTimeout(resolve, 1000 * (retryAttempt + 1)))
          return this.request<T>(endpoint, retryAttempt + 1)
        }
        
        console.warn(`ESPN API Error: ${response.status} ${response.statusText}`)
        return { events: [], teams: [], children: [] } as T
      }

      const data = await response.json()
      return data as T
    } catch (error) {
      if (retryAttempt < this.maxRetries) {
        console.warn(`ESPN API: Network error, retrying... (${retryAttempt + 1}/${this.maxRetries})`)
        await new Promise(resolve => setTimeout(resolve, 1000 * (retryAttempt + 1)))
        return this.request<T>(endpoint, retryAttempt + 1)
      }
      
      console.error('ESPN API request failed:', error)
      return { events: [], teams: [], children: [] } as T
    }
  }

  // Scoreboard data for different sports
  async getScoreboard(sport: 'football' | 'basketball' | 'baseball' | 'hockey', league: string, date?: string): Promise<{ events: ESPNGame[] }> {
    const endpoint = date 
      ? `/${sport}/${league}/scoreboard?dates=${date}`
      : `/${sport}/${league}/scoreboard`
    
    return this.request<{ events: ESPNGame[] }>(endpoint)
  }

  // NFL Scoreboard
  async getNFLScoreboard(date?: string): Promise<ESPNGame[]> {
    const data = await this.getScoreboard('football', 'nfl', date)
    return data.events || []
  }

  // NBA Scoreboard  
  async getNBAScoreboard(date?: string): Promise<ESPNGame[]> {
    const data = await this.getScoreboard('basketball', 'nba', date)
    return data.events || []
  }

  // MLB Scoreboard
  async getMLBScoreboard(date?: string): Promise<ESPNGame[]> {
    const data = await this.getScoreboard('baseball', 'mlb', date)
    return data.events || []
  }

  // NHL Scoreboard
  async getNHLScoreboard(date?: string): Promise<ESPNGame[]> {
    const data = await this.getScoreboard('hockey', 'nhl', date)
    return data.events || []
  }

  // Teams for a league
  async getTeams(sport: 'football' | 'basketball' | 'baseball' | 'hockey', league: string): Promise<ESPNTeam[]> {
    const data = await this.request<{ sports: Array<{ leagues: Array<{ teams: ESPNTeam[] }> }> }>(`/${sport}/${league}/teams`)
    return data.sports?.[0]?.leagues?.[0]?.teams || []
  }

  // Standings
  async getStandings(sport: 'football' | 'basketball' | 'baseball' | 'hockey', league: string): Promise<ESPNStanding[]> {
    const data = await this.request<{ children: Array<{ standings: { entries: ESPNStanding[] } }> }>(`/${sport}/${league}/standings`)
    return data.children?.[0]?.standings?.entries || []
  }

  // Team roster
  async getTeamRoster(sport: 'football' | 'basketball' | 'baseball' | 'hockey', league: string, teamId: string): Promise<any[]> {
    const data = await this.request<{ athletes: any[] }>(`/${sport}/${league}/teams/${teamId}/roster`)
    return data.athletes || []
  }

  // Player stats
  async getPlayerStats(sport: 'football' | 'basketball' | 'baseball' | 'hockey', league: string, playerId: string): Promise<any> {
    const data = await this.request<any>(`/${sport}/${league}/athletes/${playerId}/stats`)
    return data || null
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      const data = await this.request<any>('/football/nfl/scoreboard')
      return data && typeof data === 'object'
    } catch {
      return false
    }
  }
}

// Export singleton instance
export const espnClient = new ESPNClient()