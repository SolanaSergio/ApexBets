// Sports-related type definitions

export interface Team {
  id: string
  name: string
  abbreviation?: string
  city?: string
  conference?: string
  division?: string
  logo?: string
  colors?: {
    primary: string
    secondary: string
  }
}

export interface Player {
  id: string
  name: string
  position?: string
  jersey_number?: number
  team_id?: string
  height?: string
  weight?: string
  birth_date?: string
}

export interface Game {
  id: string
  home_team_id: string
  away_team_id: string
  date: string
  status: 'scheduled' | 'live' | 'finished' | 'postponed'
  home_score?: number
  away_score?: number
  season?: string
  week?: number
  sport: string
}

export interface GameOdds {
  game_id: string
  moneyline?: {
    home: number
    away: number
  }
  spread?: {
    home: number
    away: number
    line: number
  }
  total?: {
    over: number
    under: number
    line: number
  }
  updated_at: string
}

export interface PlayerStats {
  player_id: string
  game_id?: string
  season?: string
  points?: number
  rebounds?: number
  assists?: number
  steals?: number
  blocks?: number
  turnovers?: number
  minutes_played?: number
  field_goals_made?: number
  field_goals_attempted?: number
  three_points_made?: number
  three_points_attempted?: number
  free_throws_made?: number
  free_throws_attempted?: number
}

export interface TeamStats {
  team_id: string
  season?: string
  games_played?: number
  wins?: number
  losses?: number
  points_per_game?: number
  points_allowed_per_game?: number
  field_goal_percentage?: number
  three_point_percentage?: number
  free_throw_percentage?: number
  rebounds_per_game?: number
  assists_per_game?: number
  steals_per_game?: number
  blocks_per_game?: number
  turnovers_per_game?: number
}

export interface Prediction {
  id: string
  game_id: string
  prediction_type: 'winner' | 'spread' | 'total'
  predicted_value: number | string
  confidence: number
  model_version: string
  created_at: string
  sport?: string
  accuracy?: boolean
  reasoning?: string
  game?: {
    game_date: string
    sport: string
    away_team?: {
      abbreviation: string
    }
    home_team?: {
      abbreviation: string
    }
  }
}

export interface ValueBet {
  id: string
  game_id: string
  bet_type: string
  recommended_bet: string
  odds: number
  implied_probability: number
  model_probability: number
  value: number
  confidence: 'high' | 'medium' | 'low'
  recommended_stake?: number
  created_at: string
}

export type Sport = string

export interface SportConfig {
  name: string
  leagues: string[]
  seasons: {
    current: string
    available: string[]
  }
  statsMapping: Record<string, string>
}

// Filter interfaces
export interface PlayerStatsFilter {
  playerId?: string
  teamId?: string
  season?: string
  gameId?: string
  limit?: number
  offset?: number
}

export interface TeamStatsFilter {
  teamId?: string
  season?: string
  conference?: string
  division?: string
  limit?: number
  offset?: number
}

export interface GameFilter {
  sport?: Sport
  season?: string
  date?: string
  teamId?: string
  status?: Game['status']
  limit?: number
  offset?: number
}