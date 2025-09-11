/**
 * ESPN API Client
 * Conservative rate limiting for ESPN endpoints
 */

interface EspnTeam {
  id: string
  name: string
  abbreviation: string
  logo: string
  conference?: string
  division?: string
}

interface EspnGame {
  id: string
  homeTeam: EspnTeam
  awayTeam: EspnTeam
  date: string
  status: string
  homeScore?: number
  awayScore?: number
  venue?: string
}

export class EspnClient {
  private baseUrl = 'https://site.api.espn.com/apis/site/v2/sports'
  private rateLimitDelay = 1000 // 1 second between requests (conservative approach)
  private lastRequestTime = 0

  constructor() {
    // ESPN API doesn't require authentication for public data
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
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        headers: {
          'User-Agent': 'ApexBets/1.0.0',
          'Accept': 'application/json'
        }
      })
      
      if (!response.ok) {
        if (response.status === 429) {
          throw new Error('Rate limit exceeded. Please wait before making more requests.')
        }
        throw new Error(`ESPN API Error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error('ESPN API request failed:', error)
      throw error
    }
  }

  // Get teams for a sport
  async getTeams(sport: string, league?: string): Promise<EspnTeam[]> {
    const endpoint = league 
      ? `/${sport}/${league}/teams`
      : `/${sport}/teams`
    
    const data = await this.request<{ sports: Array<{ leagues: Array<{ teams: EspnTeam[] }> }> }>(endpoint)
    return data.sports?.[0]?.leagues?.[0]?.teams || []
  }

  // Get games for a sport
  async getGames(sport: string, league?: string, date?: string): Promise<EspnGame[]> {
    const endpoint = league 
      ? `/${sport}/${league}/scoreboard${date ? `?dates=${date}` : ''}`
      : `/${sport}/scoreboard${date ? `?dates=${date}` : ''}`
    
    const data = await this.request<{ events: EspnGame[] }>(endpoint)
    return data.events || []
  }

  // Get live games
  async getLiveGames(sport: string, league?: string): Promise<EspnGame[]> {
    const endpoint = league 
      ? `/${sport}/${league}/scoreboard?live=true`
      : `/${sport}/scoreboard?live=true`
    
    const data = await this.request<{ events: EspnGame[] }>(endpoint)
    return data.events || []
  }

  // Get standings
  async getStandings(sport: string, league?: string): Promise<any[]> {
    const endpoint = league 
      ? `/${sport}/${league}/standings`
      : `/${sport}/standings`
    
    const data = await this.request<{ children: Array<{ standings: { entries: any[] } }> }>(endpoint)
    return data.children?.[0]?.standings?.entries || []
  }

  // Get team details
  async getTeam(sport: string, teamId: string): Promise<EspnTeam | null> {
    const endpoint = `/${sport}/teams/${teamId}`
    
    try {
      const data = await this.request<{ team: EspnTeam }>(endpoint)
      return data.team || null
    } catch (error) {
      console.error(`Error fetching team ${teamId}:`, error)
      return null
    }
  }
}

// Create instance
export const espnClient = new EspnClient()
