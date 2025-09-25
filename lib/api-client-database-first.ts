/**
 * DATABASE-FIRST API CLIENT
 * Always uses database-first endpoints for optimal performance and rate limit management
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "/api"

export interface Team {
  id: string
  name: string
  city?: string
  league: string
  sport: string
  abbreviation?: string
  logo_url?: string
  created_at: string
  updated_at: string
}

export interface Game {
  id: string
  home_team_id: string
  away_team_id: string
  game_date: string
  season: string
  week?: number
  home_score?: number
  away_score?: number
  status: string
  venue?: string
  league?: string
  sport?: string
  broadcast?: string
  attendance?: number
  game_time?: string
  time_remaining?: string
  quarter?: number
  period?: string
  possession?: string
  last_play?: string
  home_team_stats?: GameStats
  away_team_stats?: GameStats
  home_team?: {
    name: string
    abbreviation?: string
    record?: string
    logo_url?: string
    city?: string
  }
  away_team?: {
    name: string
    abbreviation?: string
    record?: string
    logo_url?: string
    city?: string
  }
}

export interface GameStats {
  points?: number
  rebounds?: number
  assists?: number
  steals?: number
  blocks?: number
  turnovers?: number
  field_goals_made?: number
  field_goals_attempted?: number
  three_points_made?: number
  three_points_attempted?: number
  free_throws_made?: number
  free_throws_attempted?: number
}

export interface Player {
  id: string;
  sport: string;
  name: string;
  position?: string;
  teamId?: string;
  teamName?: string;
  height?: string;
  weight?: number;
  age?: number;
  experienceYears?: number;
  college?: string;
  country?: string;
  jerseyNumber?: number;
  isActive?: boolean;
  headshotUrl?: string;
  lastUpdated: string;
}

export interface PlayerStats {
  games_played: number;
  player_id: number;
  season: number;
  min: string;
  fgm: number;
  fga: number;
  fg_pct: number;
  fg3m: number;
  fg3a: number;
  fg3_pct: number;
  ftm: number;
  fta: number;
  ft_pct: number;
  oreb: number;
  dreb: number;
  reb: number;
  ast: number;
  turnover: number;
  stl: number;
  blk: number;
  pf: number;
  pts: number;
}

export interface AnalyticsStats {
  total_games: number
  total_predictions: number
  total_teams: number
  accuracy_rate: number
  recent_predictions: number
  recent_performance: {
    accuracy_by_type: Record<string, number>
    daily_stats: Array<{
      date: string
      predictions_made: number
      correct_predictions: number
    }>
  }
}

export interface Prediction {
  id: string;
  game_id: string;
  prediction_type: string;
  predicted_outcome: string;
  confidence: number;
  model_name: string;
  is_correct?: boolean | null;
  predicted_value: number;
  created_at: string;
  updated_at: string;
}

class DatabaseFirstApiClient {
  private baseUrl: string
  private cache: Map<string, { data: any; timestamp: number }> = new Map()
  private readonly CACHE_TTL = 5 * 60 * 1000 // 5 minutes
  private detectedTimezone: string | null = null

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl
    // Detect browser timezone when available (client-side only)
    if (typeof globalThis !== 'undefined' && typeof (globalThis as any).window !== 'undefined' && typeof Intl !== 'undefined') {
      try {
        this.detectedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone || null
      } catch {
        this.detectedTimezone = null
      }
    }
  }

  private getCacheKey(endpoint: string, params?: Record<string, any>): string {
    const paramString = params ? JSON.stringify(params) : ''
    return `${endpoint}${paramString}`
  }

  private getCachedData<T>(cacheKey: string): T | null {
    const cached = this.cache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data as T
    }
    return null
  }

  private setCachedData<T>(cacheKey: string, data: T): void {
    this.cache.set(cacheKey, {
      data,
      timestamp: Date.now()
    })
  }

  private ensureTimezoneOnEndpoint(endpoint: string): string {
    // If endpoint already specifies a timezone, respect it
    if (endpoint.includes('timezone=')) return endpoint
    // Only append when we have a detected timezone (client-side)
    const tz = this.detectedTimezone
    if (!tz) return endpoint

    // Append using ? or & depending on presence of other params
    const hasQuery = endpoint.includes('?')
    const separator = hasQuery ? '&' : '?'
    return `${endpoint}${separator}timezone=${encodeURIComponent(tz)}`
  }

  public clearCache(): void {
    this.cache.clear()
  }

  public getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    }
  }

  private async request<T>(endpoint: string, options?: RequestInit, retries: number = 3): Promise<T> {
    // Always include user's timezone (client) unless caller explicitly provided one
    const endpointWithTz = this.ensureTimezoneOnEndpoint(endpoint)
    const url = `${this.baseUrl}${endpointWithTz}`

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const response = await fetch(url, {
          headers: {
            "Content-Type": "application/json",
            ...options?.headers,
          },
          ...options,
        })

        if (response.ok) {
          return response.json() as Promise<T>
        }

        // Handle rate limiting
        if (response.status === 429) {
          const retryAfter = response.headers.get('Retry-After')
          const delay = retryAfter ? parseInt(retryAfter) * 1000 : Math.pow(2, attempt) * 1000
          
          if (attempt < retries) {
            console.warn(`Rate limited, retrying in ${delay}ms (attempt ${attempt + 1}/${retries + 1})`)
            await new Promise(resolve => setTimeout(resolve, delay))
            continue
          }
        }

        // Handle other errors
        if (response.status >= 500 && attempt < retries) {
          const delay = Math.pow(2, attempt) * 1000
          console.warn(`Server error ${response.status}, retrying in ${delay}ms (attempt ${attempt + 1}/${retries + 1})`)
          await new Promise(resolve => setTimeout(resolve, delay))
          continue
        }

        throw new Error(`API Error: ${response.status} ${response.statusText}`)
      } catch (error) {
        if (attempt === retries) {
          throw error
        }
        
        // Network error, retry with exponential backoff
        const delay = Math.pow(2, attempt) * 1000
        console.warn(`Network error, retrying in ${delay}ms (attempt ${attempt + 1}/${retries + 1}):`, error)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }

    throw new Error('Max retries exceeded')
  }

  // Teams - DATABASE FIRST
  async getTeams(params?: { league?: string; sport?: string }): Promise<Team[]> {
    const cacheKey = this.getCacheKey('/database-first/teams', params)
    const cached = this.getCachedData<Team[]>(cacheKey)
    if (cached) {
      return cached
    }

    const searchParams = new URLSearchParams()
    if (params?.league) searchParams.set("league", params.league)
    if (params?.sport) searchParams.set("sport", params.sport)

    const query = searchParams.toString()
    const response = await this.request<{ success: boolean; data: Team[] }>(`/database-first/teams${query ? `?${query}` : ""}`)
    
    const result = response.success ? response.data : []
    this.setCachedData(cacheKey, result)
    return result
  }

  async getTeam(teamId: string): Promise<Team> {
    return this.request<Team>(`/teams/${teamId}`)
  }

  // Games - DATABASE FIRST
  async getGames(params?: {
    date_from?: string
    date_to?: string
    dateFrom?: string
    dateTo?: string
    status?: string
    team_id?: string
    limit?: number
    sport?: string
    search?: string
  }): Promise<Game[]> {
    const cacheKey = this.getCacheKey('/database-first/games', params)
    const cached = this.getCachedData<Game[]>(cacheKey)
    if (cached) {
      return cached
    }

    const searchParams = new URLSearchParams()
    if (params?.date_from) searchParams.set("date_from", params.date_from)
    if (params?.date_to) searchParams.set("date_to", params.date_to)
    if (params?.dateFrom) searchParams.set("date_from", params.dateFrom)
    if (params?.dateTo) searchParams.set("date_to", params.dateTo)
    if (params?.status) searchParams.set("status", params.status)
    if (params?.team_id) searchParams.set("team_id", params.team_id)
    if (params?.limit) searchParams.set("limit", params.limit.toString())
    if (params?.sport) searchParams.set("sport", params.sport)
    if (params?.search) searchParams.set("search", params.search)

    const query = searchParams.toString()
    const response = await this.request<{ success: boolean; data: Game[] }>(`/database-first/games${query ? `?${query}` : ""}`)
    
    const result = response.success ? response.data : []
    this.setCachedData(cacheKey, result)
    return result
  }

  async getGame(gameId: string): Promise<Game> {
    return this.request<Game>(`/games/${gameId}`)
  }

  // Players - DATABASE FIRST
  async getPlayers(params?: {
    sport?: string;
    team_id?: string;
    limit?: number;
    search?: string;
  }): Promise<Player[]> {
    const searchParams = new URLSearchParams();
    if (params?.sport) searchParams.set("sport", params.sport);
    if (params?.team_id) searchParams.set("team_id", params.team_id);
    if (params?.limit) searchParams.set("limit", params.limit.toString());
    if (params?.search) searchParams.set("search", params.search);

    const query = searchParams.toString();
    const response = await this.request<{ success: boolean; data: Player[] }>(
      `/players${query ? `?${query}` : ""}`
    );

    return response.success ? response.data : [];
  }

  async getPlayerStats(params: {
    sport: string;
    player_id: string;
    season?: number;
  }): Promise<PlayerStats[]> {
    const searchParams = new URLSearchParams();
    searchParams.set("sport", params.sport);
    searchParams.set("playerId", params.player_id);
    if (params.season) {
      searchParams.set("season", params.season.toString());
    }
    const query = searchParams.toString();
    return this.request<PlayerStats[]>(`/players/stats?${query}`);
  }

  // Predictions - DATABASE FIRST
  async getPredictions(params?: {
    game_id?: string
    prediction_type?: string
    model_name?: string
    limit?: number
  }): Promise<any[]> {
    const cacheKey = this.getCacheKey('/database-first/predictions', params)
    const cached = this.getCachedData<any[]>(cacheKey)
    if (cached) {
      return cached
    }

    const searchParams = new URLSearchParams()
    if (params?.game_id) searchParams.set("game_id", params.game_id)
    if (params?.prediction_type) searchParams.set("prediction_type", params.prediction_type)
    if (params?.model_name) searchParams.set("model_name", params.model_name)
    if (params?.limit) searchParams.set("limit", params.limit.toString())

    const query = searchParams.toString()
    const response = await this.request<{ success: boolean; data: any[] }>(`/database-first/predictions${query ? `?${query}` : ""}`)
    
    const result = response.success ? response.data : []
    this.setCachedData(cacheKey, result)
    return result
  }

  // Odds - DATABASE FIRST
  async getOdds(params?: {
    sport?: string
    game_id?: string
    source?: string
    limit?: number
  }): Promise<any[]> {
    const cacheKey = this.getCacheKey('/database-first/odds', params)
    const cached = this.getCachedData<any[]>(cacheKey)
    if (cached) {
      return cached
    }

    const searchParams = new URLSearchParams()
    if (params?.sport) searchParams.set("sport", params.sport)
    if (params?.game_id) searchParams.set("gameId", params.game_id)
    if (params?.source) searchParams.set("source", params.source)
    if (params?.limit) searchParams.set("limit", params.limit.toString())

    const query = searchParams.toString()
    const response = await this.request<{ success: boolean; data: any[] }>(`/database-first/odds${query ? `?${query}` : ""}`)
    
    const result = response.success ? response.data : []
    this.setCachedData(cacheKey, result)
    return result
  }

  // Analytics
  async getAnalyticsStats(sport?: string): Promise<AnalyticsStats> {
    const url = sport ? `/analytics/stats?sport=${sport}` : "/analytics/stats"
    const response = await this.request<{ success: boolean; data: AnalyticsStats }>(url)
    return response.success ? response.data : {
      total_games: 0,
      total_predictions: 0,
      total_teams: 0,
      accuracy_rate: 0,
      recent_predictions: 0,
      recent_performance: {
        accuracy_by_type: {},
        daily_stats: []
      }
    }
  }

  async getTeamAnalytics(teamId: string): Promise<any> {
    return this.request(`/analytics/team/${teamId}`)
  }

  // Standings - DATABASE FIRST
  async getStandings(params?: { league?: string; sport?: string; season?: string }): Promise<any[]> {
    const cacheKey = this.getCacheKey('/database-first/standings', params)
    const cached = this.getCachedData<any[]>(cacheKey)
    if (cached) {
      return cached
    }

    const searchParams = new URLSearchParams()
    if (params?.league) searchParams.set("league", params.league)
    if (params?.sport) searchParams.set("sport", params.sport)
    if (params?.season) searchParams.set("season", params.season)

    const query = searchParams.toString()
    const response = await this.request<{ success: boolean; data: any[] }>(`/database-first/standings${query ? `?${query}` : ""}`)
    
    const result = response.success ? response.data : []
    this.setCachedData(cacheKey, result)
    return result
  }

  // Team Stats
  async getTeamStats(params?: { team_id?: string; league?: string; sport?: string; season?: string }): Promise<any[]> {
    const searchParams = new URLSearchParams()
    if (params?.team_id) searchParams.set("team_id", params.team_id)
    if (params?.league) searchParams.set("league", params.league)
    if (params?.sport) searchParams.set("sport", params.sport)
    if (params?.season) searchParams.set("season", params.season)

    const query = searchParams.toString()
    return this.request<any[]>(`/teams/stats${query ? `?${query}` : ""}`)
  }

  // Upcoming Predictions
  async getUpcomingPredictions(params?: { sport?: string; limit?: number; days?: number }): Promise<any[]> {
    const searchParams = new URLSearchParams()
    if (params?.sport) searchParams.set("sport", params.sport)
    if (params?.limit) searchParams.set("limit", params.limit.toString())
    if (params?.days) searchParams.set("days", params.days.toString())

    const query = searchParams.toString()
    return this.request<any[]>(`/predictions/upcoming${query ? `?${query}` : ""}`)
  }

  // Health check
  async getHealthStatus(): Promise<Record<string, boolean>> {
    try {
      const response = await this.request<{ success: boolean; data: Record<string, boolean> }>("/health")
      return response.success ? response.data : {}
    } catch (error) {
      console.warn('Health check failed:', error)
      return {}
    }
  }
}

export const databaseFirstApiClient = new DatabaseFirstApiClient()
