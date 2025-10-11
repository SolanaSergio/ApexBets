/**
 * Standardized API Response Types
 * Provides consistent response interfaces across all API routes
 */

export interface ApiSuccessResponse<T = any> {
  success: true
  data: T
  meta: {
    timestamp: string
    source: 'database' | 'cache' | 'external-api' | 'edge-function'
    count?: number
    refreshed: boolean
    [key: string]: any
  }
}

export interface ApiErrorResponse {
  success: false
  error: string
  code?: string
  details?: any
  timestamp: string
  requestId?: string
}

export type ApiResponse<T = any> = ApiSuccessResponse<T> | ApiErrorResponse

// Common data types
export interface Game {
  id: string
  external_id?: string
  sport?: string
  league_id?: string
  league_name?: string
  season?: string
  home_team_id?: string
  away_team_id?: string
  home_team_name?: string
  away_team_name?: string
  home_team_score?: number
  away_team_score?: number
  home_team?: Team
  away_team?: Team
  game_date: string
  game_time_local?: string
  status: 'scheduled' | 'live' | 'completed' | 'postponed' | 'cancelled'
  game_type?: string
  venue?: string
  attendance?: number
  weather_conditions?: any
  referee_info?: any
  broadcast_info?: any
  betting_odds?: any
  last_updated?: string
  created_at?: string
  week?: number
  is_playoff?: boolean
  home_score?: number
  away_score?: number
  overtime_periods?: number
  updated_at?: string
}

export interface Team {
  id: string
  external_id?: string
  name: string
  sport: string
  league_id?: string
  league_name?: string
  abbreviation?: string
  city?: string
  state?: string
  country?: string
  logo_url?: string
  colors?: any
  venue?: string
  venue_capacity?: number
  founded_year?: number
  is_active?: boolean
  last_updated?: string
  created_at?: string
  conference?: string
  division?: string
}

export interface Player {
  id: string
  name: string
  position?: string
  team_id?: string
  teamName?: string
  sport: string
  league?: string
  jersey_number?: number
  height?: string
  weight?: number
  age?: number
  birth_date?: string
  nationality?: string
  salary?: number
  contract_end_date?: string
  is_active?: boolean
  external_id?: string
  created_at?: string
  updated_at?: string
  lastUpdated: string
}

export interface Prediction {
  id: string
  game_id?: string
  model_name: string
  prediction_type: string
  prediction_value: number
  confidence: number
  sport: string
  league?: string
  metadata?: any
  created_at?: string
  updated_at?: string
  confidence_interval?: any
  feature_importance?: any
  is_correct?: boolean
}

export interface BettingOdds {
  id: string
  game_id?: string
  sport: string
  provider: string
  odds_type: string
  home_odds?: number
  away_odds?: number
  spread?: number
  total?: number
  odds_data?: any
  last_updated?: string
  created_at?: string
}

export interface LeagueStanding {
  id: string
  sport: string
  league_id?: string
  league_name?: string
  season?: string
  team_id?: string
  team_name?: string
  position?: number
  games_played?: number
  wins?: number
  losses?: number
  ties?: number
  win_percentage?: number
  games_back?: number
  points_for?: number
  points_against?: number
  point_differential?: number
  home_record?: string
  away_record?: string
  streak?: string
  last_10_record?: string
  division_rank?: number
  conference_rank?: number
  playoff_status?: string
  last_updated?: string
  created_at?: string
}

// Pagination types
export interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

export interface PaginatedResponse<T> extends ApiSuccessResponse<T[]> {
  meta: ApiSuccessResponse<T[]>['meta'] & PaginationMeta
}

// Filter types
export interface GameFilters {
  sport?: string
  status?: 'scheduled' | 'live' | 'completed' | 'postponed' | 'cancelled'
  dateFrom?: string | undefined
  dateTo?: string | undefined
  league?: string | undefined
  limit?: number
}

export interface TeamFilters {
  sport?: string
  league?: string
  isActive?: boolean
  limit?: number
}

export interface PlayerFilters {
  sport?: string
  teamId?: string
  position?: string
  season?: string
  limit?: number
}

// Summary types
export interface GameSummary {
  total: number
  live: number
  completed: number
  scheduled: number
  recent: number
}

export interface TeamSummary {
  total: number
  active: number
  bySport: Record<string, number>
  byLeague: Record<string, number>
}

export interface PlayerSummary {
  total: number
  active: number
  byPosition: Record<string, number>
  byTeam: Record<string, number>
}

export interface PlayerStats {
  games_played: number
  player_id: number
  season: number
  min: string
  fgm: number
  fga: number
  fg_pct: number
  fg3m: number
  fg3a: number
  fg3_pct: number
  ftm: number
  fta: number
  ft_pct: number
  oreb: number
  dreb: number
  reb: number
  ast: number
  turnover: number
  stl: number
  blk: number
  pf: number
  pts: number
}

// Health check types
export interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy'
  timestamp: string
  services: {
    database: 'up' | 'down' | 'degraded'
    cache: 'up' | 'down' | 'degraded'
    externalApis: 'up' | 'down' | 'degraded'
  }
  version: string
  uptime: number
  memory: {
    used: number
    total: number
    percentage: number
  }
}
