/**
 * NBA Stats API Client (Official)
 * Free comprehensive NBA data from the official NBA API
 * Base URL: https://stats.nba.com/stats
 */

import { apiErrorHandler } from '../services/api-error-handler'

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
  private rateLimitDelay = 2000 // 2 seconds between requests to be more respectful
  private lastRequestTime = 0
  private readonly providerName = 'nba-stats'

  private async rateLimit(): Promise<void> {
    const now = Date.now()
    const timeSinceLastRequest = now - this.lastRequestTime
    if (timeSinceLastRequest < this.rateLimitDelay) {
      await new Promise(resolve => setTimeout(resolve, this.rateLimitDelay - timeSinceLastRequest))
    }
    this.lastRequestTime = Date.now()
  }

  private async request(endpoint: string, params: Record<string, any> = {}): Promise<NBAStatsResponse> {
    await this.rateLimit()
    
    try {
      const searchParams = new URLSearchParams()
      
      // Add default parameters
      searchParams.set('Season', params.Season || '2024-25')
      searchParams.set('SeasonType', params.SeasonType || 'Regular Season')
      
      // Add custom parameters
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.set(key, value.toString())
        }
      })

      const url = `${this.baseUrl}${endpoint}?${searchParams.toString()}`
      
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': apiErrorHandler.getCurrentUserAgent(),
          'Referer': 'https://www.nba.com/',
          'Origin': 'https://www.nba.com',
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept-Encoding': 'gzip, deflate, br',
          'Connection': 'keep-alive',
          'Sec-Fetch-Dest': 'empty',
          'Sec-Fetch-Mode': 'cors',
          'Sec-Fetch-Site': 'same-site'
        },
        // Add timeout
        signal: AbortSignal.timeout(20000) // 20 second timeout
      })
      
      if (!response.ok) {
        // Use generic error handler
        const errorResult = apiErrorHandler.handleError(this.providerName, new Error(`HTTP ${response.status}`), response)
        throw new Error(errorResult.error)
      }

      // Reset failure count on successful response
      apiErrorHandler.resetFailureCount(this.providerName)

      const data = await response.json()
      return data
    } catch (error) {
      // Use generic error handler for all errors
      const errorResult = apiErrorHandler.handleError(this.providerName, error as Error)
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
  async getCommonAllPlayers(season: string = '2024-25'): Promise<NBAStatsPlayer[]> {
    const data = await this.request('/commonallplayers', {
      IsOnlyCurrentSeason: '1',
      LeagueID: '00',
      Season: season
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

  async getPlayerGameLog(playerId: number, season: string = '2024-25'): Promise<NBAStatsGame[]> {
    const data = await this.request('/playergamelog', {
      PlayerID: playerId,
      Season: season,
      SeasonType: 'Regular Season'
    })
    
    const resultSet = data.resultSets.find((rs: any) => rs.name === 'PlayerGameLog')
    if (!resultSet) return []
    
    return this.transformRowSetToObjects<NBAStatsGame>(resultSet.headers, resultSet.rowSet)
  }

  // Team endpoints
  async getTeamGameLog(teamId: number, season: string = '2024-25'): Promise<any[]> {
    const data = await this.request('/teamgamelog', {
      TeamID: teamId,
      Season: season,
      SeasonType: 'Regular Season'
    })
    
    const resultSet = data.resultSets.find((rs: any) => rs.name === 'TeamGameLog')
    if (!resultSet) return []
    
    return this.transformRowSetToObjects(resultSet.headers, resultSet.rowSet)
  }

  async getTeamRoster(teamId: number, season: string = '2024-25'): Promise<any[]> {
    const data = await this.request('/commonteamroster', {
      TeamID: teamId,
      Season: season
    })
    
    const resultSet = data.resultSets.find((rs: any) => rs.name === 'CommonTeamRoster')
    if (!resultSet) return []
    
    return this.transformRowSetToObjects(resultSet.headers, resultSet.rowSet)
  }

  // League endpoints
  async getLeagueStandings(season: string = '2024-25'): Promise<any[]> {
    const data = await this.request('/leaguestandingsv3', {
      LeagueID: '00',
      Season: season,
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
      Season: params.season || '2024-25',
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