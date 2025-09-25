/**
 * NBA Stats API Client (Official)
 * Free comprehensive NBA data from the official NBA API
 * Base URL: https://stats.nba.com/stats
 */

import { apiSpecificErrorHandler } from '../services/api-specific-error-handlers'

export interface NBAStatsPlayer {
  PERSON_ID: number
  DISPLAY_LAST_COMMA_FIRST: string
  DISPLAY_FIRST_LAST: string
  ROSTERSTATUS: string
  FROM_YEAR: string
  TO_YEAR: string
  PLAYERCODE: string
  TEAM_ID: number
  TEAM_CITY: string
  TEAM_NAME: string
  TEAM_ABBREVIATION: string
  JERSEY_NUMBER: string
  POSITION: string
  HEIGHT: string
  WEIGHT: string
  BIRTHDATE: string
  AGE: number
  EXP: string
  SCHOOL: string
  COUNTRY: string
}

export interface NBAStatsTeam {
  TEAM_ID: number
  SEASON_ID: string
  LEAGUE_ID: string
  TEAM_NAME: string
  TEAM_ABBREVIATION: string
  TEAM_CONFERENCE: string
  TEAM_DIVISION: string
  TEAM_CITY: string
  TEAM_STATE: string
  YEAR_FOUNDED: number
}

export interface NBAStatsGame {
  GAME_ID: string
  GAME_DATE: string
  MATCHUP: string
  WL: string
  MIN: number
  PTS: number
  FGM: number
  FGA: number
  FG_PCT: number
  FG3M: number
  FG3A: number
  FG3_PCT: number
  FTM: number
  FTA: number
  FT_PCT: number
  OREB: number
  DREB: number
  REB: number
  AST: number
  STL: number
  BLK: number
  TOV: number
  PF: number
  PLUS_MINUS: number
}

export interface NBAStatsResponse {
  resource: string
  parameters: Record<string, any>
  resultSets: Array<{
    name: string
    headers: string[]
    rowSet: any[][]
  }>
}

export class NBAStatsClient {
  private baseUrl = 'https://stats.nba.com/stats'
  private readonly providerName = 'nba-stats'
  private consecutiveFailures = 0
  private maxConsecutiveFailures = 3

  // Rate limiting is now handled by the centralized enhanced rate limiter

  private async request(endpoint: string, params: Record<string, any> = {}): Promise<NBAStatsResponse> {
    // Check if we've hit max consecutive failures
    if (this.consecutiveFailures >= this.maxConsecutiveFailures) {
      const backoffTime = Math.min(30000, 5000 * Math.pow(2, this.consecutiveFailures)) // Exponential backoff, max 30s
      console.warn(`${this.providerName}: Too many consecutive failures, backing off for ${backoffTime}ms`)
      await new Promise(resolve => setTimeout(resolve, backoffTime))
      this.consecutiveFailures = 0 // Reset after backoff
    }

    // Rate limiting is handled by the centralized enhanced rate limiter

    let response: Response | undefined

    try {
      const searchParams = new URLSearchParams()

      // Add default parameters (compute season dynamically if not provided)
      if (!params.Season) {
        const season = await (await import('@/lib/services/core/season-manager')).SeasonManager.getCurrentSeason('basketball')
        searchParams.set('Season', season)
      } else {
        searchParams.set('Season', params.Season)
      }
      searchParams.set('SeasonType', params.SeasonType || 'Regular Season')

      // Add custom parameters
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.set(key, value.toString())
        }
      })

      const url = `${this.baseUrl}${endpoint}?${searchParams.toString()}`

      response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Referer': 'https://www.nba.com/',
          'Origin': 'https://www.nba.com',
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept-Encoding': 'gzip, deflate, br',
          'Connection': 'keep-alive',
          'Sec-Fetch-Dest': 'empty',
          'Sec-Fetch-Mode': 'cors',
          'Sec-Fetch-Site': 'same-site',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
        // Add timeout
        signal: AbortSignal.timeout(30000) // 30 second timeout
      })

      if (!response.ok) {
        // Don't count 404s as failures for circuit breaker
        if (response.status === 404) {
          console.warn(`${this.providerName}: No data available for ${endpoint}`)
          return { 
            resource: endpoint,
            parameters: params,
            resultSets: [] 
          }
        }
        
        // Use API-specific error handler
        const errorResult = apiSpecificErrorHandler.handleError(
          this.providerName,
          new Error(`HTTP ${response.status}`),
          response.status
        )
        throw new Error(errorResult.error)
      }

      // Reset failure count on successful response
      apiSpecificErrorHandler.resetFailures(this.providerName)
      this.consecutiveFailures = 0 // Reset consecutive failures on success

      const data = await response.json() as any
      
      // Check if response has valid data
      if (!data || !data.resultSets || data.resultSets.length === 0) {
        console.warn(`${this.providerName}: Empty response for ${endpoint}`)
        return { 
          resource: endpoint,
          parameters: params,
          resultSets: [] 
        }
      }
      
      return data
    } catch (error) {
      // Increment consecutive failures
      this.consecutiveFailures++
      
      // Don't count network timeouts as circuit breaker failures
      if (error instanceof Error && error.name === 'AbortError') {
        console.warn(`${this.providerName}: Request timeout for ${endpoint}`)
        throw new Error('Request timeout')
      }
      
      // Use API-specific error handler
      const errorResult = apiSpecificErrorHandler.handleError(
        this.providerName,
        error as Error,
        response?.status
      )

      if (errorResult.shouldRetry && errorResult.retryAfterMs) {
        console.warn(`${this.providerName}: ${errorResult.error}, retrying after ${errorResult.retryAfterMs}ms`)
        await new Promise(resolve => setTimeout(resolve, errorResult.retryAfterMs!))
        // Could implement retry logic here, but for now just throw
      }

      throw new Error(errorResult.error)
    }
  }

  private transformRowSetToObjects<T>(headers: string[], rowSet: any[][]): T[] {
    return rowSet.map(row => {
      const obj: any = {}
      headers.forEach((header, index) => {
        obj[header] = row[index]
      })
      return obj as T
    })
  }

  // Common Info endpoints
  async getCommonAllPlayers(season?: string): Promise<NBAStatsPlayer[]> {
    const data = await this.request('/commonallplayers', {
      IsOnlyCurrentSeason: '1',
      LeagueID: '00',
      Season: season || await (await import('@/lib/services/core/season-manager')).SeasonManager.getCurrentSeason('basketball')
    })
    
    const resultSet = data.resultSets.find((rs: any) => rs.name === 'CommonAllPlayers')
    if (!resultSet) return []
    
    return this.transformRowSetToObjects<NBAStatsPlayer>(resultSet.headers, resultSet.rowSet)
  }

  // Player endpoints
  async getPlayerCareerStats(playerId: number): Promise<NBAStatsGame[]> {
    const data = await this.request('/playercareerstats', {
      PlayerID: playerId,
      PerMode: 'PerGame'
    })
    
    const resultSet = data.resultSets.find((rs: any) => rs.name === 'SeasonTotalsRegularSeason')
    if (!resultSet) return []
    
    return this.transformRowSetToObjects<NBAStatsGame>(resultSet.headers, resultSet.rowSet)
  }

  async getPlayerGameLog(playerId: number, season?: string): Promise<NBAStatsGame[]> {
    const data = await this.request('/playergamelog', {
      PlayerID: playerId,
      Season: season || await (await import('@/lib/services/core/season-manager')).SeasonManager.getCurrentSeason('basketball'),
      SeasonType: 'Regular Season'
    })
    
    const resultSet = data.resultSets.find((rs: any) => rs.name === 'PlayerGameLog')
    if (!resultSet) return []
    
    return this.transformRowSetToObjects<NBAStatsGame>(resultSet.headers, resultSet.rowSet)
  }

  // Team endpoints
  async getTeamGameLog(teamId: number, season?: string): Promise<any[]> {
    const data = await this.request('/teamgamelog', {
      TeamID: teamId,
      Season: season || await (await import('@/lib/services/core/season-manager')).SeasonManager.getCurrentSeason('basketball'),
      SeasonType: 'Regular Season'
    })
    
    const resultSet = data.resultSets.find((rs: any) => rs.name === 'TeamGameLog')
    if (!resultSet) return []
    
    return this.transformRowSetToObjects(resultSet.headers, resultSet.rowSet)
  }

  async getTeamRoster(teamId: number, season?: string): Promise<any[]> {
    const data = await this.request('/commonteamroster', {
      TeamID: teamId,
      Season: season || await (await import('@/lib/services/core/season-manager')).SeasonManager.getCurrentSeason('basketball')
    })
    
    const resultSet = data.resultSets.find((rs: any) => rs.name === 'CommonTeamRoster')
    if (!resultSet) return []
    
    return this.transformRowSetToObjects(resultSet.headers, resultSet.rowSet)
  }

  // League endpoints
  async getLeagueStandings(season?: string): Promise<any[]> {
    const data = await this.request('/leaguestandingsv3', {
      LeagueID: '00',
      Season: season || await (await import('@/lib/services/core/season-manager')).SeasonManager.getCurrentSeason('basketball'),
      SeasonType: 'Regular Season'
    })
    
    const resultSet = data.resultSets.find((rs: any) => rs.name === 'Standings')
    if (!resultSet) return []
    
    return this.transformRowSetToObjects(resultSet.headers, resultSet.rowSet)
  }

  async getLeagueGameFinder(params: {
    teamId?: number
    playerId?: number
    season?: string
    seasonType?: string
    outcomeGt?: string
  } = {}): Promise<any[]> {
    const data = await this.request('/leaguegamefinder', {
      LeagueID: '00',
      Season: params.season || await (await import('@/lib/services/core/season-manager')).SeasonManager.getCurrentSeason('basketball'),
      SeasonType: params.seasonType || 'Regular Season',
      TeamID: params.teamId,
      PlayerID: params.playerId,
      OutcomeGt: params.outcomeGt
    })
    
    const resultSet = data.resultSets.find((rs: any) => rs.name === 'LeagueGameFinderResults')
    if (!resultSet) return []
    
    return this.transformRowSetToObjects(resultSet.headers, resultSet.rowSet)
  }

  // Scoreboard
  async getScoreboard(gameDate: string): Promise<any> {
    const data = await this.request('/scoreboardV2', {
      GameDate: gameDate,
      LeagueID: '00',
      DayOffset: '0'
    })
    
    return data
  }

  // Live scoreboard (today's games)
  async getTodaysGames(): Promise<any> {
    const today = new Date().toISOString().split('T')[0].replace(/-/g, '')
    return this.getScoreboard(today)
  }

  // Player search
  async searchPlayers(playerName: string): Promise<NBAStatsPlayer[]> {
    const allPlayers = await this.getCommonAllPlayers()
    return allPlayers.filter(player => 
      player.DISPLAY_FIRST_LAST.toLowerCase().includes(playerName.toLowerCase()) ||
      player.DISPLAY_LAST_COMMA_FIRST.toLowerCase().includes(playerName.toLowerCase())
    )
  }

  // Dynamic team lookup helper - no hardcoded values
  async getTeamIdByName(teamName: string): Promise<number | null> {
    try {
      // Use the official NBA API to get current teams dynamically
      const teams = await this.getCommonTeamYears()
      
      // Find team by name (case-insensitive)
      const team = teams.find(team => 
        team.TEAM_NAME?.toLowerCase() === teamName.toLowerCase() ||
        team.TEAM_CITY?.toLowerCase() === teamName.toLowerCase() ||
        `${team.TEAM_CITY} ${team.TEAM_NAME}`.toLowerCase() === teamName.toLowerCase()
      )
      
      return team ? team.TEAM_ID : null
    } catch (error) {
      console.warn(`Failed to lookup team ID for ${teamName}:`, error)
      return null
    }
  }

  // Cache teams for efficient lookups
  private teamCache: NBAStatsTeam[] | null = null
  private teamCacheExpiry: number = 0
  private readonly TEAM_CACHE_TTL = 24 * 60 * 60 * 1000 // 24 hours

  async getCommonTeamYears(): Promise<NBAStatsTeam[]> {
    // Return cached teams if available and not expired
    if (this.teamCache && Date.now() < this.teamCacheExpiry) {
      return this.teamCache
    }

    try {
      const data = await this.request('/commonteamyears')
      
      if (data.resultSets && data.resultSets[0] && data.resultSets[0].rowSet) {
        this.teamCache = data.resultSets[0].rowSet.map((row: any[]) => ({
          TEAM_ID: row[0],
          SEASON_ID: row[1],
          LEAGUE_ID: row[2],
          TEAM_NAME: row[3],
          TEAM_ABBREVIATION: row[4],
          TEAM_CONFERENCE: row[5],
          TEAM_DIVISION: row[6],
          TEAM_CITY: row[7],
          TEAM_STATE: row[8],
          YEAR_FOUNDED: row[9]
        }))
        
        // Set cache expiry
        this.teamCacheExpiry = Date.now() + this.TEAM_CACHE_TTL
        
        return this.teamCache || []
      }
    } catch (error) {
      console.error('Failed to fetch NBA teams:', error)
    }
    
    return []
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      const teams = await this.getCommonTeamYears()
      return teams.length > 0
    } catch {
      return false
    }
  }
}

// Export singleton instance
export const nbaStatsClient = new NBAStatsClient()

// Export configured client for compatibility
export const getNBAStatsClient = (): NBAStatsClient => {
  return nbaStatsClient
}