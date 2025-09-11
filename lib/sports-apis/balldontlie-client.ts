/**
 * BALLDONTLIE API Client
 * Free NBA-focused API with comprehensive historical data
 */

interface BallDontLiePlayer {
  id: number
  first_name: string
  last_name: string
  position: string
  height_feet: number | null
  height_inches: number | null
  weight_pounds: number | null
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

interface BallDontLieTeam {
  id: number
  abbreviation: string
  city: string
  conference: string
  division: string
  full_name: string
  name: string
}

interface BallDontLieGame {
  id: number
  date: string
  home_team: BallDontLieTeam
  home_team_score: number | null
  period: number
  postseason: boolean
  season: number
  status: string
  time: string
  visitor_team: BallDontLieTeam
  visitor_team_score: number | null
}

interface BallDontLieStats {
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
  game: BallDontLieGame
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

interface BallDontLieResponse<T> {
  data: T[]
  meta: {
    current_page: number
    next_page: number | null
    per_page: number
    total_count: number
    total_pages: number
  }
}

export class BallDontLieClient {
  private baseUrl = 'https://api.balldontlie.io/v1'
  private apiKey: string
  private rateLimitDelay = 12000 // 12 seconds between requests (5 requests/minute = 12 seconds)
  private lastRequestTime = 0

  constructor(apiKey: string = '') {
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
    
    // Check if API key is available
    if (!this.apiKey || this.apiKey === 'your_balldontlie_api_key' || this.apiKey === '') {
      throw new Error('BALLDONTLIE API Error: API key not configured. Please set NEXT_PUBLIC_BALLDONTLIE_API_KEY in your environment variables.')
    }
    
    try {
      const headers: HeadersInit = {
        'Authorization': this.apiKey,
        'Accept': 'application/json',
        'User-Agent': 'ApexBets/1.0.0'
      }
      
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        headers
      })
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('BALLDONTLIE API Error: 401 Unauthorized - Invalid API key')
        } else if (response.status === 400) {
          throw new Error('BALLDONTLIE API Error: 400 Bad Request - Invalid request parameters')
        } else if (response.status === 404) {
          throw new Error('BALLDONTLIE API Error: 404 Not Found - Endpoint not found')
        } else if (response.status === 406) {
          throw new Error('BALLDONTLIE API Error: 406 Not Acceptable - Requested format not supported')
        } else if (response.status === 429) {
          throw new Error('BALLDONTLIE API Error: 429 Too Many Requests - Rate limit exceeded')
        } else if (response.status === 500) {
          throw new Error('BALLDONTLIE API Error: 500 Internal Server Error - Server issue, try again later')
        } else if (response.status === 503) {
          throw new Error('BALLDONTLIE API Error: 503 Service Unavailable - Server temporarily offline')
        } else {
          throw new Error(`BALLDONTLIE API Error: ${response.status} ${response.statusText}`)
        }
      }

      const data = await response.json()
      return data
    } catch (error) {
      if (error instanceof SyntaxError) {
        console.error('BALLDONTLIE API Error: Invalid JSON response')
        throw new Error('BALLDONTLIE API Error: Invalid JSON response from server')
      } else if (error instanceof TypeError && error.message.includes('fetch')) {
        console.error('BALLDONTLIE API Error: Network error')
        throw new Error('BALLDONTLIE API Error: Network error - check your internet connection')
      } else {
        console.error('BALLDONTLIE API request failed:', error)
        throw error
      }
    }
  }

  // Players
  async getPlayers(params: {
    page?: number
    per_page?: number
    search?: string
  } = {}): Promise<BallDontLieResponse<BallDontLiePlayer>> {
    const searchParams = new URLSearchParams()
    
    if (params.page) searchParams.set('page', params.page.toString())
    if (params.per_page) searchParams.set('per_page', params.per_page.toString())
    if (params.search) searchParams.set('search', params.search)

    const query = searchParams.toString()
    return this.request<BallDontLieResponse<BallDontLiePlayer>>(`/players?${query}`)
  }

  async getPlayerById(playerId: number): Promise<BallDontLiePlayer> {
    return this.request<BallDontLiePlayer>(`/players/${playerId}`)
  }

  // Teams
  async getTeams(params: {
    page?: number
    per_page?: number
  } = {}): Promise<BallDontLieResponse<BallDontLieTeam>> {
    const searchParams = new URLSearchParams()
    
    if (params.page) searchParams.set('page', params.page.toString())
    if (params.per_page) searchParams.set('per_page', params.per_page.toString())

    const query = searchParams.toString()
    return this.request<BallDontLieResponse<BallDontLieTeam>>(`/teams?${query}`)
  }

  async getTeamById(teamId: number): Promise<BallDontLieTeam> {
    return this.request<BallDontLieTeam>(`/teams/${teamId}`)
  }

  // Games
  async getGames(params: {
    page?: number
    per_page?: number
    dates?: string[]
    seasons?: number[]
    team_ids?: number[]
    postseason?: boolean
    start_date?: string
    end_date?: string
  } = {}): Promise<BallDontLieResponse<BallDontLieGame>> {
    const searchParams = new URLSearchParams()
    
    if (params.page) searchParams.set('page', params.page.toString())
    if (params.per_page) searchParams.set('per_page', params.per_page.toString())
    if (params.dates) {
      params.dates.forEach(date => searchParams.append('dates[]', date))
    }
    if (params.seasons) {
      params.seasons.forEach(season => searchParams.append('seasons[]', season.toString()))
    }
    if (params.team_ids) {
      params.team_ids.forEach(teamId => searchParams.append('team_ids[]', teamId.toString()))
    }
    if (params.postseason !== undefined) searchParams.set('postseason', params.postseason.toString())
    if (params.start_date) searchParams.set('start_date', params.start_date)
    if (params.end_date) searchParams.set('end_date', params.end_date)

    const query = searchParams.toString()
    return this.request<BallDontLieResponse<BallDontLieGame>>(`/games?${query}`)
  }

  async getGameById(gameId: number): Promise<BallDontLieGame> {
    return this.request<BallDontLieGame>(`/games/${gameId}`)
  }

  // Stats
  async getStats(params: {
    page?: number
    per_page?: number
    dates?: string[]
    seasons?: number[]
    player_ids?: number[]
    game_ids?: number[]
    postseason?: boolean
    start_date?: string
    end_date?: string
  } = {}): Promise<BallDontLieResponse<BallDontLieStats>> {
    const searchParams = new URLSearchParams()
    
    if (params.page) searchParams.set('page', params.page.toString())
    if (params.per_page) searchParams.set('per_page', params.per_page.toString())
    if (params.dates) searchParams.set('dates[]', params.dates.join(','))
    if (params.seasons) searchParams.set('seasons[]', params.seasons.join(','))
    if (params.player_ids) {
      params.player_ids.forEach(playerId => searchParams.append('player_ids[]', playerId.toString()))
    }
    if (params.game_ids) {
      params.game_ids.forEach(gameId => searchParams.append('game_ids[]', gameId.toString()))
    }
    if (params.postseason !== undefined) searchParams.set('postseason', params.postseason.toString())
    if (params.start_date) searchParams.set('start_date', params.start_date)
    if (params.end_date) searchParams.set('end_date', params.end_date)

    const query = searchParams.toString()
    return this.request<BallDontLieResponse<BallDontLieStats>>(`/stats?${query}`)
  }

  // Season averages for players
  async getSeasonAverages(params: {
    season: number
    player_ids?: number[]
  }): Promise<BallDontLieResponse<any>> {
    const searchParams = new URLSearchParams()
    searchParams.set('season', params.season.toString())
    
    if (params.player_ids) {
      params.player_ids.forEach(playerId => searchParams.append('player_ids[]', playerId.toString()))
    }

    const query = searchParams.toString()
    return this.request<BallDontLieResponse<any>>(`/season_averages?${query}`)
  }

  // Get all data with pagination
  async getAllData<T>(
    endpoint: string,
    params: Record<string, any> = {},
    maxPages: number = 10
  ): Promise<T[]> {
    const allData: T[] = []
    let currentPage = 1

    while (currentPage <= maxPages) {
      const response = await this.request<BallDontLieResponse<T>>(
        `${endpoint}?${new URLSearchParams({ ...params, page: currentPage.toString() }).toString()}`
      )

      allData.push(...response.data)

      if (!response.meta.next_page || response.data.length === 0) {
        break
      }

      currentPage = response.meta.next_page
    }

    return allData
  }
}

// Create instance with API key from environment
const getBallDontLieApiKey = (): string => {
  const apiKey = process.env.NEXT_PUBLIC_BALLDONTLIE_API_KEY
  if (!apiKey || apiKey === 'your_balldontlie_api_key' || apiKey === '') {
    return '' // Return empty string instead of throwing error
  }
  return apiKey
}

// Create client lazily to avoid module load errors
let _ballDontLieClient: BallDontLieClient | null = null

const getClient = (): BallDontLieClient => {
  if (!_ballDontLieClient) {
    const apiKey = getBallDontLieApiKey()
    _ballDontLieClient = new BallDontLieClient(apiKey)
  }
  return _ballDontLieClient
}

export const ballDontLieClient = {
  // Check if API key is available
  get isConfigured(): boolean {
    const apiKey = getBallDontLieApiKey()
    return apiKey !== ''
  },

  // Delegate all methods to the client instance
  async getPlayers(params: any = {}) {
    return getClient().getPlayers(params)
  },

  async getPlayerById(playerId: number) {
    return getClient().getPlayerById(playerId)
  },

  async getTeams(params: any = {}) {
    return getClient().getTeams(params)
  },

  async getTeamById(teamId: number) {
    return getClient().getTeamById(teamId)
  },

  async getGames(params: any = {}) {
    return getClient().getGames(params)
  },

  async getGameById(gameId: number) {
    return getClient().getGameById(gameId)
  },

  async getStats(params: any = {}) {
    return getClient().getStats(params)
  },

  async getSeasonAverages(params: any) {
    return getClient().getSeasonAverages(params)
  },

  async getAllData<T>(endpoint: string, params: Record<string, any> = {}, maxPages: number = 10) {
    return getClient().getAllData<T>(endpoint, params, maxPages)
  }
}
