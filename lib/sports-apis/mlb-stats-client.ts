/**
 * MLB Stats API Client (Official)
 * Free comprehensive MLB data from the official MLB API
 * Base URL: https://statsapi.mlb.com/api/v1
 */

export interface MLBTeam {
  id: number
  name: string
  link: string
  season: number
  venue: {
    id: number
    name: string
    link: string
  }
  teamCode: string
  fileCode: string
  abbreviation: string
  teamName: string
  locationName: string
  firstYearOfPlay: string
  league: {
    id: number
    name: string
    link: string
  }
  division: {
    id: number
    name: string
    link: string
  }
  sport: {
    id: number
    name: string
    link: string
  }
  shortName: string
  franchiseName: string
  clubName: string
  active: boolean
}

export interface MLBPlayer {
  id: number
  fullName: string
  link: string
  firstName: string
  lastName: string
  primaryNumber?: string
  birthDate: string
  currentAge: number
  birthCity?: string
  birthStateProvince?: string
  birthCountry: string
  height: string
  weight: number
  active: boolean
  primaryPosition: {
    code: string
    name: string
    type: string
    abbreviation: string
  }
  useName: string
  useLastName: string
  middleName?: string
  boxscoreName: string
  nickName?: string
  draftYear?: number
  mlbDebutDate?: string
  batSide: {
    code: string
    description: string
  }
  pitchHand: {
    code: string
    description: string
  }
}

export interface MLBGame {
  gamePk: number
  link: string
  gameType: string
  season: string
  gameDate: string
  officialDate: string
  status: {
    abstractGameState: string
    codedGameState: string
    detailedState: string
    statusCode: string
    startTimeTBD: boolean
    abstractGameCode: string
  }
  teams: {
    away: {
      leagueRecord: {
        wins: number
        losses: number
        pct: string
      }
      score?: number
      team: MLBTeam
      isWinner?: boolean
      probablePitcher?: MLBPlayer
      splitSquad: boolean
      seriesNumber: number
    }
    home: {
      leagueRecord: {
        wins: number
        losses: number
        pct: string
      }
      score?: number
      team: MLBTeam
      isWinner?: boolean
      probablePitcher?: MLBPlayer
      splitSquad: boolean
      seriesNumber: number
    }
  }
  venue: {
    id: number
    name: string
    link: string
  }
  content: {
    link: string
  }
  isTie: boolean
  gameNumber: number
  publicFacing: boolean
  doubleHeader: string
  gamedayType: string
  tiebreaker: string
  calendarEventID: string
  seasonDisplay: string
  dayNight: string
  scheduledInnings: number
  reverseHomeAwayStatus: boolean
  inningBreakLength: number
  gamesInSeries: number
  seriesGameNumber: number
  seriesDescription: string
  recordSource: string
  ifNecessary: string
  ifNecessaryDescription: string
}

export interface MLBStandings {
  standingsType: string
  league: {
    id: number
    name: string
    link: string
  }
  division: {
    id: number
    name: string
    link: string
  }
  sport: {
    id: number
    link: string
    name: string
  }
  lastUpdated: string
  teamRecords: Array<{
    team: MLBTeam
    standingsType: string
    league: {
      id: number
      name: string
      link: string
    }
    division: {
      id: number
      name: string
      link: string
    }
    sport: {
      id: number
      link: string
      name: string
    }
    wins: number
    losses: number
    pct: string
    gamesBack: string
    wildCardGamesBack: string
    leagueGamesBack: string
    springLeagueGamesBack: string
    sportGamesBack: string
    divisionGamesBack: string
    conferenceGamesBack: string
    leagueRecord: {
      wins: number
      losses: number
      pct: string
    }
    records: {
      splitRecords: Array<{
        wins: number
        losses: number
        type: string
        pct: string
      }>
      divisionRecords: Array<{
        wins: number
        losses: number
        pct: string
        division: {
          id: number
          name: string
          link: string
        }
      }>
      overallRecords: Array<{
        wins: number
        losses: number
        type: string
        pct: string
      }>
      leagueRecords: Array<{
        wins: number
        losses: number
        pct: string
        league: {
          id: number
          name: string
          link: string
        }
      }>
      expectedRecords: Array<{
        wins: number
        losses: number
        type: string
        pct: string
      }>
    }
    runsAllowed: number
    runsScored: number
    divisionChamp: boolean
    divisionLeader: boolean
    hasWildcard: boolean
    clinched: boolean
    eliminationNumber: string
    wildCardEliminationNumber: string
    magicNumber: string
    wins2: number
    losses2: number
    pct2: string
    lastUpdated: string
  }>
}

export class MLBStatsClient {
  private baseUrl = 'https://statsapi.mlb.com/api/v1'
  // Rate limiting is now handled by the centralized Enhanced Rate Limiter

  private async request<T>(endpoint: string): Promise<T> {
    // Rate limiting is now handled by the centralized Enhanced Rate Limiter
    
    try {
      const url = `${this.baseUrl}${endpoint}`
      
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'ProjectApex/1.0.0'
        },
        // Add timeout
        signal: AbortSignal.timeout(10000) // 10 second timeout
      })
      
      if (!response.ok) {
        if (response.status === 429) {
          throw new Error('MLB Stats API: Rate limit exceeded')
        }
        throw new Error(`MLB Stats API Error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      return data as T
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('MLB Stats API: Request timeout')
      }
      console.error('MLB Stats API request failed:', error)
      throw error
    }
  }

  // Dynamic team lookup helper - no hardcoded values
  async getTeamIdByName(teamName: string): Promise<number | null> {
    try {
      // Use the official MLB API to get current teams dynamically
      const teams = await this.getTeams()
      
      // Find team by name (case-insensitive, multiple matching strategies)
      const team = teams.find(team => 
        team.name?.toLowerCase() === teamName.toLowerCase() ||
        team.locationName?.toLowerCase() === teamName.toLowerCase() ||
        team.teamName?.toLowerCase() === teamName.toLowerCase() ||
        `${team.locationName} ${team.teamName}`.toLowerCase() === teamName.toLowerCase() ||
        team.franchiseName?.toLowerCase() === teamName.toLowerCase()
      )
      
      return team ? team.id : null
    } catch (error) {
      console.warn(`Failed to lookup team ID for ${teamName}:`, error)
      return null
    }
  }

  // Cache teams for efficient lookups
  private teamCache: MLBTeam[] | null = null
  private teamCacheExpiry: number = 0
  private readonly TEAM_CACHE_TTL = 24 * 60 * 60 * 1000 // 24 hours

  // Teams
  async getTeams(season?: number): Promise<MLBTeam[]> {
    // Return cached teams if available and not expired
    if (this.teamCache && Date.now() < this.teamCacheExpiry && !season) {
      return this.teamCache
    }

    try {
      const endpoint = season ? `/teams?sportId=1&season=${season}` : '/teams?sportId=1'
      const data = await this.request<{ teams: MLBTeam[] }>(endpoint)
      const teams = data.teams || []
      
      // Cache current season teams only
      if (!season) {
        this.teamCache = teams
        this.teamCacheExpiry = Date.now() + this.TEAM_CACHE_TTL
      }
      
      return teams
    } catch (error) {
      console.error('Failed to fetch MLB teams:', error)
      return []
    }
  }

  async getTeam(teamId: number): Promise<MLBTeam | null> {
    const data = await this.request<{ teams: MLBTeam[] }>(`/teams/${teamId}?sportId=1`)
    return data.teams?.[0] || null
  }

  async getTeamRoster(teamId: number, season?: number): Promise<MLBPlayer[]> {
    const endpoint = season 
      ? `/teams/${teamId}/roster?season=${season}`
      : `/teams/${teamId}/roster`
    const data = await this.request<{ roster: Array<{ person: MLBPlayer }> }>(endpoint)
    return data.roster?.map(item => item.person) || []
  }

  // Players
  async getPlayer(playerId: number): Promise<MLBPlayer | null> {
    const data = await this.request<{ people: MLBPlayer[] }>(`/people/${playerId}`)
    return data.people?.[0] || null
  }

  async searchPlayers(name: string): Promise<MLBPlayer[]> {
    // MLB API doesn't have a direct search, so we'll need to get all active players
    // and filter client-side for now
    try {
      const teams = await this.getTeams()
      const allPlayers: MLBPlayer[] = []
      
      // Get roster for each team (limited search to avoid too many requests)
      for (const team of teams.slice(0, 5)) { // Limit to first 5 teams for demo
        try {
          const roster = await this.getTeamRoster(team.id)
          allPlayers.push(...roster)
        } catch (error) {
          console.warn(`Failed to get roster for team ${team.name}:`, error)
        }
      }
      
      return allPlayers.filter(player =>
        player.fullName.toLowerCase().includes(name.toLowerCase())
      )
    } catch (error) {
      console.error('Error searching players:', error)
      return []
    }
  }

  // Games & Schedule
  async getSchedule(params: {
    startDate?: string
    endDate?: string
    teamId?: number
    season?: number
  } = {}): Promise<MLBGame[]> {
    const searchParams = new URLSearchParams()
    
    // SportId is required for MLB API - 1 is for MLB
    searchParams.set('sportId', '1')
    
    if (params.startDate) searchParams.set('startDate', params.startDate)
    if (params.endDate) searchParams.set('endDate', params.endDate)
    if (params.teamId) searchParams.set('teamIds', params.teamId.toString())
    if (params.season) searchParams.set('season', params.season.toString())
    
    const endpoint = `/schedule?${searchParams.toString()}`
    const data = await this.request<{ dates: Array<{ games: MLBGame[] }> }>(endpoint)
    
    // Flatten games from all dates
    return data.dates?.flatMap(date => date.games) || []
  }

  async getTodaysGames(): Promise<MLBGame[]> {
    const today = new Date().toISOString().split('T')[0]
    return this.getSchedule({ startDate: today, endDate: today })
  }

  async getLiveGames(): Promise<MLBGame[]> {
    const games = await this.getTodaysGames()
    return games.filter(game => 
      game.status.abstractGameState === 'Live' ||
      game.status.detailedState.includes('In Progress')
    )
  }

  async getGame(gamePk: number): Promise<MLBGame | null> {
    const data = await this.request<{ dates: Array<{ games: MLBGame[] }> }>(`/schedule?sportId=1&gamePk=${gamePk}`)
    return data.dates?.[0]?.games?.[0] || null
  }

  // Standings
  async getStandings(season?: number): Promise<MLBStandings[]> {
    const endpoint = season ? `/standings?sportId=1&season=${season}` : '/standings?sportId=1'
    const data = await this.request<{ records: MLBStandings[] }>(endpoint)
    return data.records || []
  }

  async getDivisionStandings(divisionId: number, season?: number): Promise<MLBStandings | null> {
    const standings = await this.getStandings(season)
    return standings.find(standing => standing.division.id === divisionId) || null
  }

  // Stats
  async getPlayerStats(playerId: number, params: {
    season?: number
    group?: string
    stats?: string
  } = {}): Promise<any> {
    const searchParams = new URLSearchParams()
    
    if (params.season) searchParams.set('season', params.season.toString())
    if (params.group) searchParams.set('group', params.group)
    if (params.stats) searchParams.set('stats', params.stats)
    
    const endpoint = `/people/${playerId}/stats?${searchParams.toString()}`
    return this.request(endpoint)
  }

  async getTeamStats(teamId: number, params: {
    season?: number
    group?: string
    stats?: string
  } = {}): Promise<any> {
    const searchParams = new URLSearchParams()
    
    if (params.season) searchParams.set('season', params.season.toString())
    if (params.group) searchParams.set('group', params.group)
    if (params.stats) searchParams.set('stats', params.stats)
    
    const endpoint = `/teams/${teamId}/stats?${searchParams.toString()}`
    return this.request(endpoint)
  }

  // League information
  async getLeagues(): Promise<any[]> {
    const data = await this.request<{ leagues: any[] }>('/league?sportId=1')
    return data.leagues || []
  }

  async getDivisions(): Promise<any[]> {
    const data = await this.request<{ divisions: any[] }>('/divisions?sportId=1')
    return data.divisions || []
  }

  // Utility methods
  async getCurrentSeason(): Promise<number> {
    try {
      const data = await this.request<{ seasons: Array<{ seasonId: string }> }>('/seasons/current?sportId=1')
      return parseInt(data.seasons?.[0]?.seasonId || new Date().getFullYear().toString())
    } catch {
      return new Date().getFullYear()
    }
  }



  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      const teams = await this.getTeams()
      return teams.length > 0
    } catch {
      return false
    }
  }
}

// Export singleton instance
export const mlbStatsClient = new MLBStatsClient()

// Export configured client for compatibility
export const getMLBStatsClient = (): MLBStatsClient => {
  return mlbStatsClient
}