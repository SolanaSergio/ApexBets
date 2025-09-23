/**
 * Ball Don't Lie API Client
 * API for NBA, NFL, MLB, NHL, EPL data
 * API key required for authentication
 * Documentation: https://www.balldontlie.io/
 */

export interface BallDontLiePlayer {
  id: number
  first_name: string
  last_name: string
  position: string
  height: string
  weight: string
  jersey_number: string
  college: string
  country: string
  draft_year: number
  draft_round: number
  draft_number: number
  team: {
    id: number
    abbreviation: string
    city: string
    conference: string
    division: string
    full_name: string
    name: string
  }
}

export interface BallDontLieTeam {
  id: number
  abbreviation: string
  city: string
  conference: string
  division: string
  full_name: string
  name: string
}

export interface BallDontLieGame {
  id: number
  date: string
  home_team: BallDontLieTeam
  home_team_score: number
  period: number
  postseason: boolean
  season: number
  status: string
  time: string
  visitor_team: BallDontLieTeam
  visitor_team_score: number
}

export interface BallDontLieStats {
  id: number
  ast: number
  blk: number
  dreb: number
  fg3_pct: number
  fg3a: number
  fg3m: number
  fg_pct: number
  fga: number
  fgm: number
  ft_pct: number
  fta: number
  ftm: number
  game: {
    id: number
    date: string
    home_team_id: number
    home_team_score: number
    period: number
    postseason: boolean
    season: number
    status: string
    time: string
    visitor_team_id: number
    visitor_team_score: number
  }
  min: string
  oreb: number
  pf: number
  player: BallDontLiePlayer
  pts: number
  reb: number
  stl: number
  team: BallDontLieTeam
  turnover: number
}

export class BallDontLieClient {
  private baseUrl = 'https://api.balldontlie.io/v1'
  private apiKey: string | null
  private maxRetries = 2 // Increased retries with better backoff
  private requestQueue: Promise<any> = Promise.resolve()

  constructor() {
    this.apiKey = process.env.NEXT_PUBLIC_BALLDONTLIE_API_KEY || null
    if (!this.apiKey || this.apiKey === 'your_balldontlie_api_key_here') {
      console.warn('BallDontLie API key not found or using placeholder. Set NEXT_PUBLIC_BALLDONTLIE_API_KEY environment variable for full functionality.')
      this.apiKey = null
    }
  }

  public isConfigured(): boolean {
    return !!this.apiKey
  }

  // Rate limiting is now handled by the centralized enhanced rate limiter

  private async request<T>(endpoint: string, params: Record<string, string | number> = {}, retryAttempt: number = 0): Promise<T> {
    // Queue requests to prevent overwhelming the API
    return this.requestQueue = this.requestQueue.then(async () => {
      // Rate limiting is handled by the centralized enhanced rate limiter
      
      const url = new URL(`${this.baseUrl}${endpoint}`)
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.set(key, value.toString())
        }
      })
      
      try {
        // Add authentication headers - Ball Don't Lie uses direct API key
        const headers: Record<string, string> = {
          'Content-Type': 'application/json'
        }

        if (this.apiKey) {
          headers['Authorization'] = this.apiKey // Direct API key, not Bearer token
        } else {
          throw new Error('BallDontLie API: API key required for all requests')
        }

        const response = await fetch(url.toString(), { headers })
        
        if (!response.ok) {
          // Handle 401 Unauthorized specifically
          if (response.status === 401) {
            console.error('BallDontLie API: Unauthorized. Check your API key.')
            throw new Error('BallDontLie API: Invalid or missing API key')
          }
          if (response.status === 429) {
            const retryAfter = response.headers.get('Retry-After')
            const delay = retryAfter ? parseInt(retryAfter) * 1000 : 90000 // 1.5 minutes default
            console.warn(`BallDontLie API: Rate limit exceeded (4 req/min), backing off for ${delay}ms`)
            
            if (retryAttempt < this.maxRetries) {
              await new Promise(resolve => setTimeout(resolve, delay))
              return this.request<T>(endpoint, params, retryAttempt + 1)
            } else {
              throw new Error(`BallDontLie API: Rate limit exceeded after ${this.maxRetries} retries. Free tier: 4 requests/minute limit.`)
            }
          }
          
          if (response.status >= 500 && retryAttempt < this.maxRetries) {
            console.warn(`BallDontLie API: Server error ${response.status}, retrying...`)
            await new Promise(resolve => setTimeout(resolve, 2000 * (retryAttempt + 1)))
            return this.request<T>(endpoint, params, retryAttempt + 1)
          }
          
          console.warn(`BallDontLie API Error: ${response.status} ${response.statusText}`)
          
          // Don't return empty data for auth errors, throw instead
          if (response.status === 401 || response.status === 403) {
            throw new Error(`BallDontLie API: Authentication failed (${response.status})`)
          }
          
          return { data: [], meta: {} } as T
        }

        const data = await response.json()
        return data
      } catch (error) {
        if (retryAttempt < this.maxRetries) {
          console.warn(`BallDontLie API: Network error, retrying... (${retryAttempt + 1}/${this.maxRetries})`)
          await new Promise(resolve => setTimeout(resolve, 3000 * (retryAttempt + 1)))
          return this.request<T>(endpoint, params, retryAttempt + 1)
        }
        
        console.error('BallDontLie API request failed:', error)
        throw error
      }
    })
  }

  // Players
  async getPlayers(params: {
    cursor?: number
    per_page?: number
    search?: string
    first_name?: string
    last_name?: string
    team_ids?: number[]
  } = {}): Promise<{ data: BallDontLiePlayer[]; meta: any }> {
    const queryParams: Record<string, string | number> = {}
    
    if (params.cursor) queryParams.cursor = params.cursor
    if (params.per_page) queryParams.per_page = params.per_page
    if (params.search) queryParams.search = params.search
    if (params.first_name) queryParams.first_name = params.first_name
    if (params.last_name) queryParams.last_name = params.last_name
    if (params.team_ids) queryParams['team_ids[]'] = params.team_ids.join(',')

    return this.request<{ data: BallDontLiePlayer[]; meta: any }>('/players', queryParams)
  }

  async getPlayerById(playerId: number): Promise<BallDontLiePlayer | null> {
    const data = await this.request<BallDontLiePlayer>(`/players/${playerId}`)
    return data || null
  }

  // Teams
  async getTeams(params: {
    cursor?: number
    per_page?: number
  } = {}): Promise<{ data: BallDontLieTeam[]; meta: any }> {
    return this.request<{ data: BallDontLieTeam[]; meta: any }>('/teams', params)
  }

  async getTeamById(teamId: number): Promise<BallDontLieTeam | null> {
    const data = await this.request<BallDontLieTeam>(`/teams/${teamId}`)
    return data || null
  }

  // Games
  async getGames(params: {
    cursor?: number
    per_page?: number
    dates?: string[]
    seasons?: number[]
    team_ids?: number[]
    postseason?: boolean
    start_date?: string
    end_date?: string
  } = {}): Promise<{ data: BallDontLieGame[]; meta: any }> {
    const queryParams: Record<string, string | number> = {}
    
    if (params.cursor) queryParams.cursor = params.cursor
    if (params.per_page) queryParams.per_page = params.per_page
    if (params.dates) queryParams['dates[]'] = params.dates.join(',')
    if (params.seasons) queryParams['seasons[]'] = params.seasons.join(',')
    if (params.team_ids) queryParams['team_ids[]'] = params.team_ids.join(',')
    if (params.postseason !== undefined) queryParams.postseason = params.postseason.toString()
    if (params.start_date) queryParams.start_date = params.start_date
    if (params.end_date) queryParams.end_date = params.end_date

    return this.request<{ data: BallDontLieGame[]; meta: any }>('/games', queryParams)
  }

  async getGameById(gameId: number): Promise<BallDontLieGame | null> {
    try {
      const data = await this.request<BallDontLieGame>(`/games/${gameId}`)
      return data || null
    } catch (error) {
      console.warn(`BallDontLie API: Failed to get game ${gameId}:`, error)
      return null
    }
  }

  // Stats
  async getStats(params: {
    cursor?: number
    per_page?: number
    dates?: string[]
    seasons?: number[]
    player_ids?: number[]
    game_ids?: number[]
    postseason?: boolean
    start_date?: string
    end_date?: string
  } = {}): Promise<{ data: BallDontLieStats[]; meta: any }> {
    const queryParams: Record<string, string | number> = {}
    
    if (params.cursor) queryParams.cursor = params.cursor
    if (params.per_page) queryParams.per_page = params.per_page
    if (params.dates) queryParams['dates[]'] = params.dates.join(',')
    if (params.seasons) queryParams['seasons[]'] = params.seasons.join(',')
    if (params.player_ids) queryParams['player_ids[]'] = params.player_ids.join(',')
    if (params.game_ids) queryParams['game_ids[]'] = params.game_ids.join(',')
    if (params.postseason !== undefined) queryParams.postseason = params.postseason.toString()
    if (params.start_date) queryParams.start_date = params.start_date
    if (params.end_date) queryParams.end_date = params.end_date

    return this.request<{ data: BallDontLieStats[]; meta: any }>('/stats', queryParams)
  }

  // Season averages
  async getSeasonAverages(params: {
    season: number
    player_ids?: number[]
  }): Promise<{ data: any[]; meta: any }> {
    const queryParams: Record<string, string | number> = {
      season: params.season
    }
    
    if (params.player_ids) {
      queryParams['player_ids[]'] = params.player_ids.join(',')
    }

    return this.request<{ data: any[]; meta: any }>('/season_averages', queryParams)
  }

  // Advanced stats
  async getAdvancedStats(params: {
    cursor?: number
    per_page?: number
    seasons?: number[]
    player_ids?: number[]
    team_ids?: number[]
  } = {}): Promise<{ data: any[]; meta: any }> {
    const queryParams: Record<string, string | number> = {}
    
    if (params.cursor) queryParams.cursor = params.cursor
    if (params.per_page) queryParams.per_page = params.per_page
    if (params.seasons) queryParams['seasons[]'] = params.seasons.join(',')
    if (params.player_ids) queryParams['player_ids[]'] = params.player_ids.join(',')
    if (params.team_ids) queryParams['team_ids[]'] = params.team_ids.join(',')

    return this.request<{ data: any[]; meta: any }>('/advanced_stats', queryParams)
  }

  // Helper methods for common queries
  async getTodaysGames(): Promise<BallDontLieGame[]> {
    const today = new Date().toISOString().split('T')[0]
    const result = await this.getGames({ dates: [today], per_page: 100 })
    return result.data || []
  }

  async getPlayerSeasonStats(playerId: number, season: number): Promise<any> {
    const result = await this.getSeasonAverages({ season, player_ids: [playerId] })
    return result.data?.[0] || null
  }

  async getTeamPlayers(teamId: number): Promise<BallDontLiePlayer[]> {
    const result = await this.getPlayers({ team_ids: [teamId], per_page: 100 })
    return result.data || []
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      if (!this.isConfigured()) {
        console.warn('BallDontLie API: Not configured (missing API key)')
        return false
      }
      
      const result = await this.getTeams({ per_page: 1 })
      return result && result.data && Array.isArray(result.data)
    } catch (error) {
      console.error('BallDontLie API health check failed:', error)
      return false
    }
  }
}

// Export singleton instance
export const ballDontLieClient = new BallDontLieClient()