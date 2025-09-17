/**
 * NHL API Client (Official - New 2025)
 * Free comprehensive NHL data from the official NHL API
 * Base URL: https://api-web.nhle.com/v1
 */

export interface NHLTeam {
  id: number
  name: string
  link: string
  venue: {
    id: number
    name: string
    link: string
    city: string
    timeZone: {
      id: string
      offset: number
      tz: string
    }
  }
  abbreviation: string
  teamName: string
  locationName: string
  firstYearOfPlay: string
  division: {
    id: number
    name: string
    nameShort: string
    link: string
    abbreviation: string
  }
  conference: {
    id: number
    name: string
    link: string
  }
  franchise: {
    franchiseId: number
    teamName: string
    link: string
  }
  shortName: string
  officialSiteUrl: string
  franchiseId: number
  active: boolean
}

export interface NHLPlayer {
  id: number
  headshot: string
  firstName: {
    default: string
  }
  lastName: {
    default: string
  }
  fullName: string
  sweaterNumber: number
  position: string
  shootsCatches: string
  heightInInches: number
  weightInPounds: number
  heightInCentimeters: number
  weightInKilograms: number
  birthDate: string
  birthCity: {
    default: string
  }
  birthCountry: string
  birthStateProvince?: {
    default: string
  }
  inHHOF: boolean
  inTop100AllTime: number
  featuredStats: {
    season: number
    regularSeason: {
      career: {
        assists: number
        goals: number
        gamesPlayed: number
        points: number
        plusMinus: number
        pim: number
        gameWinningGoals: number
        otGoals: number
        shots: number
        shootingPctg: number
        powerPlayGoals: number
        powerPlayPoints: number
        shorthandedGoals: number
        shorthandedPoints: number
      }
    }
  }
}

export interface NHLGame {
  gamePk: number
  gameType: string
  season: string
  gameDate: string
  status: {
    abstractGameState: string
    codedGameState: string
    detailedState: string
    statusCode: string
    startTimeTBD: boolean
  }
  teams: {
    away: {
      team: {
        id: number
        name: string
        link: string
      }
      score?: number
      leagueRecord: {
        wins: number
        losses: number
        ot: number
        type: string
      }
    }
    home: {
      team: {
        id: number
        name: string
        link: string
      }
      score?: number
      leagueRecord: {
        wins: number
        losses: number
        ot: number
        type: string
      }
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
}

export interface NHLStandings {
  wildCardIndicator: boolean
  standings: Array<{
    conferenceAbbrev: string
    conferenceHomeSequence: number
    conferenceL10Sequence: number
    conferenceName: string
    conferenceRoadSequence: number
    conferenceSequence: number
    date: string
    divisionAbbrev: string
    divisionHomeSequence: number
    divisionL10Sequence: number
    divisionName: string
    divisionRoadSequence: number
    divisionSequence: string
    gameTypeId: number
    gamesPlayed: number
    goalDifferential: number
    goalDifferentialPctg: number
    goalAgainst: number
    goalFor: number
    goalsForPctg: number
    homeGamesPlayed: number
    homeGoalDifferential: number
    homeGoalsAgainst: number
    homeGoalsFor: number
    homeLosses: number
    homeOtLosses: number
    homePoints: number
    homeRegulationPlusOtWins: number
    homeRegulationWins: number
    homeTies: number
    homeWins: number
    l10GamesPlayed: number
    l10GoalDifferential: number
    l10GoalsAgainst: number
    l10GoalsFor: number
    l10Losses: number
    l10OtLosses: number
    l10Points: number
    l10RegulationPlusOtWins: number
    l10RegulationWins: number
    l10Ties: number
    l10Wins: number
    leagueHomeSequence: number
    leagueL10Sequence: number
    leagueRoadSequence: number
    leagueSequence: number
    losses: number
    otLosses: number
    placeName: {
      default: string
    }
    pointPctg: number
    points: number
    regulationPlusOtWinPctg: number
    regulationPlusOtWins: number
    regulationWinPctg: number
    regulationWins: number
    roadGamesPlayed: number
    roadGoalDifferential: number
    roadGoalsAgainst: number
    roadGoalsFor: number
    roadLosses: number
    roadOtLosses: number
    roadPoints: number
    roadRegulationPlusOtWins: number
    roadRegulationWins: number
    roadTies: number
    roadWins: number
    seasonId: number
    shootoutLosses: number
    shootoutWins: number
    streakCode: string
    streakCount: number
    teamName: {
      default: string
      fr: string
    }
    teamCommonName: {
      default: string
    }
    teamAbbrev: {
      default: string
    }
    teamLogo: string
    ties: number
    waiversSequence: number
    wildcardSequence: number
    winPctg: number
    wins: number
  }>
}

export class NHLClient {
  private baseUrl = 'https://statsapi.web.nhl.com/api/v1'
  private rateLimitDelay = 1000 // 1 second between requests to be respectful
  private lastRequestTime = 0
  private maxRetries = 3

  private async rateLimit(): Promise<void> {
    const now = Date.now()
    const timeSinceLastRequest = now - this.lastRequestTime
    if (timeSinceLastRequest < this.rateLimitDelay) {
      await new Promise(resolve => setTimeout(resolve, this.rateLimitDelay - timeSinceLastRequest))
    }
    this.lastRequestTime = Date.now()
  }

  private async request<T>(endpoint: string, retryCount: number = 0): Promise<T> {
    await this.rateLimit()

    try {
      const url = `${this.baseUrl}${endpoint}`

      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'ProjectApex/1.0.0'
        },
        // Add timeout
        signal: AbortSignal.timeout(15000) // 15 second timeout
      })

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error('NHL API: Rate limit exceeded')
        }
        throw new Error(`NHL API Error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      return data
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('NHL API: Request timeout')
      }

      // Handle network errors with retry and fallback
      if (error instanceof Error && (
        error.message.includes('ENOTFOUND') ||
        error.message.includes('ECONNREFUSED') ||
        error.message.includes('fetch failed')
      )) {
        if (retryCount < this.maxRetries) {
          console.warn(`NHL API network error, retrying... (${retryCount + 1}/${this.maxRetries})`)
          await this.exponentialBackoff(retryCount)
          return this.request<T>(endpoint, retryCount + 1)
        } else {
          // Try fallback API or return graceful error
          console.error('NHL API: All retries failed, network unavailable')
          throw new Error('NHL API: Network unavailable after retries')
        }
      }

      console.error('NHL API request failed:', error)
      throw error
    }
  }

  private async exponentialBackoff(attempt: number): Promise<void> {
    const baseDelay = 2000 // 2 seconds
    const maxDelay = 30000 // 30 seconds
    const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay)
    await new Promise(resolve => setTimeout(resolve, delay))
  }

  // Teams - moved above for proper method ordering
  // (method implementation moved above)

  async getTeam(teamId: number): Promise<any> {
    return this.request(`/teams/${teamId}`)
  }

  async getTeamRoster(teamId: number, season?: string): Promise<any> {
    const seasonParam = season || this.getCurrentSeasonString()
    return this.request(`/teams/${teamId}/roster?season=${seasonParam}`)
  }

  // Players
  async getPlayer(playerId: number): Promise<NHLPlayer | null> {
    try {
      return await this.request<NHLPlayer>(`/people/${playerId}`)
    } catch {
      return null
    }
  }

  async getPlayerStats(playerId: number, season?: string): Promise<any> {
    const seasonParam = season || this.getCurrentSeasonString()
    return this.request(`/people/${playerId}/stats?stats=gameLog&season=${seasonParam}`)
  }

  // Games & Schedule
  async getSchedule(date: string): Promise<NHLGame[]> {
    const data = await this.request<{ dates: Array<{ games: NHLGame[] }> }>(`/schedule?date=${date}`)
    return data.dates?.flatMap(day => day.games) || []
  }

  async getTodaysGames(): Promise<NHLGame[]> {
    const today = new Date().toISOString().split('T')[0]
    return this.getSchedule(today)
  }

  async getScoreboard(date?: string): Promise<any> {
    const scoreDate = date || new Date().toISOString().split('T')[0]
    return this.request(`/schedule?date=${scoreDate}&expand=schedule.linescore`)
  }

  async getLiveGames(): Promise<NHLGame[]> {
    const games = await this.getTodaysGames()
    return games.filter(game => 
      game.status?.detailedState === 'In Progress' || 
      game.status?.detailedState === 'Final'
    )
  }

  async getGame(gameId: number): Promise<any> {
    return this.request(`/game/${gameId}/boxscore`)
  }

  // Standings
  async getStandings(_date?: string): Promise<NHLStandings> {
    const seasonParam = this.getCurrentSeasonString()
    return this.request<NHLStandings>(`/standings?season=${seasonParam}`)
  }

  async getCurrentStandings(): Promise<NHLStandings> {
    const seasonParam = this.getCurrentSeasonString()
    return this.request<NHLStandings>(`/standings?season=${seasonParam}`)
  }

  // Playoff information
  async getPlayoffBracket(season?: number): Promise<any> {
    const seasonParam = season ? `${season}${season + 1}` : this.getCurrentSeasonString()
    return this.request(`/tournaments/playoffs?season=${seasonParam}`)
  }

  async getPlayoffSeries(season?: number): Promise<any> {
    const seasonParam = season ? `${season}${season + 1}` : this.getCurrentSeasonString()
    return this.request(`/tournaments/playoffs?season=${seasonParam}&expand=series.matchup`)
  }

  // Statistics and leaders
  async getStatsLeaders(categories: string[], season?: string): Promise<any> {
    const seasonParam = season || this.getCurrentSeasonString()
    const categoryString = categories.join(',')
    return this.request(`/stats/leaders?season=${seasonParam}&leaderCategories=${categoryString}`)
  }

  async getGoalieStats(season?: string): Promise<any> {
    const seasonParam = season || this.getCurrentSeasonString()
    return this.request(`/stats/leaders?season=${seasonParam}&leaderCategories=wins,losses,otLosses,shutouts,goalsAgainstAverage,savePercentage`)
  }

  // Country and location data
  async getCountries(): Promise<any> {
    return this.request('/countries')
  }

  async getLocationByCountry(countryId: number): Promise<any> {
    return this.request(`/countries/${countryId}`)
  }

  // Dynamic team lookup helper - no hardcoded values
  async getTeamAbbrevByName(teamName: string): Promise<string | null> {
    try {
      // Use the official NHL API to get current teams dynamically
      const teams = await this.getTeams()
      
      // Find team by name (case-insensitive)
      const team = teams.find(team => 
        team.name?.toLowerCase() === teamName.toLowerCase() ||
        team.teamName?.toLowerCase() === teamName.toLowerCase() ||
        team.locationName?.toLowerCase() === teamName.toLowerCase() ||
        team.shortName?.toLowerCase() === teamName.toLowerCase()
      )
      
      return team ? (team.abbreviation || null) : null
    } catch (error) {
      console.warn(`Failed to lookup team abbreviation for ${teamName}:`, error)
      return null
    }
  }

  // Cache teams for efficient lookups
  private teamCache: NHLTeam[] | null = null
  private teamCacheExpiry: number = 0
  private readonly TEAM_CACHE_TTL = 24 * 60 * 60 * 1000 // 24 hours

  // Teams
  async getTeams(): Promise<NHLTeam[]> {
    // Return cached teams if available and not expired
    if (this.teamCache && Date.now() < this.teamCacheExpiry) {
      return this.teamCache
    }

    try {
      const data = await this.request<{ teams: NHLTeam[] }>('/teams')
      const teams = data.teams || []
      
      // Cache teams
      this.teamCache = teams
      this.teamCacheExpiry = Date.now() + this.TEAM_CACHE_TTL
      
      return teams
    } catch (error) {
      console.error('Failed to fetch NHL teams:', error)
      return []
    }
  }

  async searchPlayers(_name: string): Promise<NHLPlayer[]> {
    try {
      // NHL API doesn't have a direct search endpoint
      // We'll need to implement this differently or use a different approach
      // For now, return empty array as this would require getting all players first
      console.warn('NHL API: Player search not implemented - would require full player database')
      return []
    } catch (error) {
      console.error('Error searching players:', error)
      return []
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

  // Season helper
  getCurrentSeasonString(): string {
    const now = new Date()
    const year = now.getFullYear()
    // NHL season typically starts in October and ends in April of next year
    const seasonStartYear = now.getMonth() >= 9 ? year : year - 1
    return `${seasonStartYear}${seasonStartYear + 1}`
  }
}

// Export singleton instance
export const nhlClient = new NHLClient()

// Export configured client for compatibility
export const getNHLClient = (): NHLClient => {
  return nhlClient
}