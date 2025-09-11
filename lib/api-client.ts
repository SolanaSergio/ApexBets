/**
 * API Client for Project Apex
 * Centralized client for making API requests
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

export interface Prediction {
  id: string
  game_id: string
  model_name: string
  prediction_type: string
  predicted_value: number
  confidence: number
  actual_value?: number
  is_correct?: boolean
  created_at: string
}

export interface Odds {
  id: string
  game_id: string
  source: string
  odds_type: string
  home_odds?: number
  away_odds?: number
  spread?: number
  total?: number
  timestamp: string
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

class ApiClient {
  private baseUrl: string

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl
  }

  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`

    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
      ...options,
    })

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`)
    }

    return response.json()
  }

  // Teams
  async getTeams(params?: { league?: string; sport?: string }): Promise<Team[]> {
    const searchParams = new URLSearchParams()
    if (params?.league) searchParams.set("league", params.league)
    if (params?.sport) searchParams.set("sport", params.sport)
    
    // Always use external API for real-time data
    searchParams.set("external", "true")

    const query = searchParams.toString()
    const response = await this.request<{ data: Team[] } | Team[]>(`/teams${query ? `?${query}` : ""}`)
    
    // Handle both wrapped and direct array responses
    return Array.isArray(response) ? response : response.data || []
  }

  async getTeam(teamId: string): Promise<Team> {
    return this.request<Team>(`/teams/${teamId}`)
  }

  // Games
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
    
    // Always use external API for real-time data
    searchParams.set("external", "true")

    const query = searchParams.toString()
    const response = await this.request<{ data: Game[] } | Game[]>(`/games${query ? `?${query}` : ""}`)
    
    // Handle both wrapped and direct array responses
    return Array.isArray(response) ? response : response.data || []
  }

  async getGame(gameId: string): Promise<Game> {
    return this.request<Game>(`/games/${gameId}`)
  }

  // Predictions
  async getPredictions(params?: {
    game_id?: string
    prediction_type?: string
    model_name?: string
    limit?: number
  }): Promise<Prediction[]> {
    const searchParams = new URLSearchParams()
    if (params?.game_id) searchParams.set("game_id", params.game_id)
    if (params?.prediction_type) searchParams.set("prediction_type", params.prediction_type)
    if (params?.model_name) searchParams.set("model_name", params.model_name)
    if (params?.limit) searchParams.set("limit", params.limit.toString())

    const query = searchParams.toString()
    const response = await this.request<{ data: Prediction[] } | Prediction[]>(`/predictions${query ? `?${query}` : ""}`)
    
    // Handle both wrapped and direct array responses
    return Array.isArray(response) ? response : response.data || []
  }

  // Odds
  async getOdds(params?: {
    game_id?: string
    source?: string
    limit?: number
  }): Promise<Odds[]> {
    const searchParams = new URLSearchParams()
    if (params?.game_id) searchParams.set("game_id", params.game_id)
    if (params?.source) searchParams.set("source", params.source)
    if (params?.limit) searchParams.set("limit", params.limit.toString())

    const query = searchParams.toString()
    return this.request<Odds[]>(`/odds${query ? `?${query}` : ""}`)
  }

  // Analytics
  async getAnalyticsStats(): Promise<AnalyticsStats> {
    const response = await this.request<{ data: AnalyticsStats }>("/analytics/stats")
    return response.data
  }

  async getTeamAnalytics(teamId: string): Promise<any> {
    return this.request(`/analytics/team/${teamId}`)
  }

  // Standings
  async getStandings(params?: { league?: string; sport?: string; season?: string }): Promise<any[]> {
    const searchParams = new URLSearchParams()
    if (params?.league) searchParams.set("league", params.league)
    if (params?.sport) searchParams.set("sport", params.sport)
    if (params?.season) searchParams.set("season", params.season)

    const query = searchParams.toString()
    return this.request<any[]>(`/standings${query ? `?${query}` : ""}`)
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
  async getUpcomingPredictions(params?: { limit?: number; days?: number }): Promise<any[]> {
    const searchParams = new URLSearchParams()
    if (params?.limit) searchParams.set("limit", params.limit.toString())
    if (params?.days) searchParams.set("days", params.days.toString())

    const query = searchParams.toString()
    return this.request<any[]>(`/predictions/upcoming${query ? `?${query}` : ""}`)
  }
}

export const apiClient = new ApiClient()
