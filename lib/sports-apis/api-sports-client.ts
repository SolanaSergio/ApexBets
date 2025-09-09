/**
 * API-SPORTS Client
 * Fast real-time sports data with 15-second updates
 */

interface ApiSportsFixture {
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

interface ApiSportsTeam {
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

interface ApiSportsStanding {
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

export class ApiSportsClient {
  private baseUrl = 'https://api-football-v1.p.rapidapi.com/v3'
  private apiKey: string
  private rateLimitDelay = 2000 // 2 seconds between requests
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
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        headers: {
          'X-RapidAPI-Key': this.apiKey,
          'X-RapidAPI-Host': 'api-football-v1.p.rapidapi.com'
        }
      })
      
      if (!response.ok) {
        if (response.status === 429) {
          throw new Error('Rate limit exceeded. Please wait before making more requests.')
        }
        throw new Error(`API-SPORTS Error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error('API-SPORTS request failed:', error)
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

// Create instance with API key from environment
export const apiSportsClient = new ApiSportsClient(process.env.NEXT_PUBLIC_RAPIDAPI_KEY || '')
