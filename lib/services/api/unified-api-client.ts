/**
 * Unified API Client
 * Centralized API client for all sports data
 */

import { SportConfigManager, SupportedSport } from '../core/sport-config'

// Re-export SupportedSport for convenience
export type { SupportedSport }

export interface UnifiedGameData {
  id: string
  sport: string
  league: string
  homeTeam: string
  awayTeam: string
  date: string
  status: string
  homeScore?: number
  awayScore?: number
  venue?: string
  season?: string
}

export interface UnifiedTeamData {
  id: string
  name: string
  city?: string
  league: string
  sport: string
  abbreviation?: string
  logoUrl?: string
  conference?: string
  division?: string
  foundedYear?: number
  stadiumName?: string
  stadiumCapacity?: number
  primaryColor?: string
  secondaryColor?: string
  country?: string
  isActive: boolean
}

export interface UnifiedPlayerData {
  id: string
  name: string
  sport: string
  teamName?: string
  position?: string
  height?: number
  weight?: number
  age?: number
  experienceYears?: number
  college?: string
  country?: string
  jerseyNumber?: number
  isActive: boolean
  headshotUrl?: string
}

export interface UnifiedStandingsData {
  id: string
  sport: string
  league: string
  season: string
  teamName: string
  position: number
  wins: number
  losses: number
  ties: number
  winPercentage: number
  gamesBehind?: number
  pointsFor: number
  pointsAgainst: number
  lastUpdated: string
}

export interface UnifiedOddsData {
  id: string
  gameId: string
  bookmaker: string
  market: string
  outcome: string
  price: number
  point?: number
  lastUpdated: string
}

export interface UnifiedPredictionData {
  id: string
  gameId: string
  predictionModel: string
  predictedOutcome: string
  confidence: number
  predictionTimestamp: string
}

export class UnifiedApiClient {
  private static instance: UnifiedApiClient

  public static getInstance(): UnifiedApiClient {
    if (!UnifiedApiClient.instance) {
      UnifiedApiClient.instance = new UnifiedApiClient()
    }
    return UnifiedApiClient.instance
  }

  async getGames(
    sport: SupportedSport,
    options: {
      date?: string
      status?: string
      limit?: number
      league?: string
    } = {}
  ): Promise<UnifiedGameData[]> {
    try {
      // ARCHITECTURE PATTERN: Database-First Approach
      // Call internal API routes that fetch from database, not external APIs
      const params = new URLSearchParams({
        sport,
        ...(options.date && { date_from: options.date }),
        ...(options.status && { status: options.status }),
        ...(options.limit && { limit: options.limit.toString() }),
        ...(options.league && { league: options.league }),
      })

      const response = await fetch(`/api/database-first/games?${params}`)
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`)
      }

      const result = await response.json()
      if (result.success && Array.isArray(result.data)) {
        return result.data.map(this.normalizeGameData)
      }

      return []
    } catch (error) {
      console.error('Error fetching games:', error)
      return []
    }
  }

  async getLiveGames(sport: SupportedSport, _league?: string): Promise<UnifiedGameData[]> {
    return this.getGames(sport, { status: 'live' })
  }

  async getTeams(
    sport: SupportedSport,
    options: {
      limit?: number
      league?: string
    } = {}
  ): Promise<UnifiedTeamData[]> {
    try {
      // ARCHITECTURE PATTERN: Database-First Approach
      // Call internal API routes that fetch from database, not external APIs
      const params = new URLSearchParams({
        sport,
        ...(options.limit && { limit: options.limit.toString() }),
        ...(options.league && { league: options.league }),
      })

      const response = await fetch(`/api/database-first/teams?${params}`)
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`)
      }

      const result = await response.json()
      if (result.success && Array.isArray(result.data)) {
        return result.data.map(this.normalizeTeamData)
      }

      return []
    } catch (error) {
      console.error('Error fetching teams:', error)
      return []
    }
  }

  async getPlayers(
    sport: SupportedSport,
    options: {
      limit?: number
      teamId?: string
      position?: string
    } = {}
  ): Promise<UnifiedPlayerData[]> {
    try {
      // ARCHITECTURE PATTERN: Database-First Approach
      // Call internal API routes that fetch from database, not external APIs
      const params = new URLSearchParams({
        sport,
        ...(options.limit && { limit: options.limit.toString() }),
        ...(options.teamId && { team_id: options.teamId }),
        ...(options.position && { position: options.position }),
      })

      const response = await fetch(`/api/players?${params}`)
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`)
      }

      const result = await response.json()
      if (result.success && Array.isArray(result.data)) {
        return result.data.map(this.normalizePlayerData)
      }

      return []
    } catch (error) {
      console.error('Error fetching players:', error)
      return []
    }
  }

  async getStandings(
    sport: SupportedSport,
    options: {
      season?: string
      league?: string
    } = {}
  ): Promise<UnifiedStandingsData[]> {
    try {
      // ARCHITECTURE PATTERN: Database-First Approach
      // Call internal API routes that fetch from database, not external APIs
      const params = new URLSearchParams({
        sport,
        ...(options.season && { season: options.season }),
        ...(options.league && { league: options.league }),
      })

      const response = await fetch(`/api/database-first/standings?${params}`)
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`)
      }

      const result = await response.json()
      if (result.success && Array.isArray(result.data)) {
        return result.data.map(this.normalizeStandingsData)
      }

      return []
    } catch (error) {
      console.error('Error fetching standings:', error)
      return []
    }
  }

  async getOdds(
    sport: SupportedSport,
    options: {
      gameId?: string
      limit?: number
    } = {}
  ): Promise<UnifiedOddsData[]> {
    try {
      // ARCHITECTURE PATTERN: Database-First Approach
      // Call internal API routes that fetch from database, not external APIs
      const params = new URLSearchParams({
        sport,
        ...(options.gameId && { game_id: options.gameId }),
        ...(options.limit && { limit: options.limit.toString() }),
      })

      const response = await fetch(`/api/database-first/odds?${params}`)
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`)
      }

      const result = await response.json()
      if (result.success && Array.isArray(result.data)) {
        return result.data.map(this.normalizeOddsData)
      }

      return []
    } catch (error) {
      console.error('Error fetching odds:', error)
      return []
    }
  }

  async getPredictions(
    sport: SupportedSport,
    options: {
      gameId?: string
      limit?: number
    } = {}
  ): Promise<UnifiedPredictionData[]> {
    try {
      // ARCHITECTURE PATTERN: Database-First Approach
      // Call internal API routes that fetch from database, not external APIs
      const params = new URLSearchParams({
        sport,
        ...(options.gameId && { game_id: options.gameId }),
        ...(options.limit && { limit: options.limit.toString() }),
      })

      const response = await fetch(`/api/database-first/predictions?${params}`)
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`)
      }

      const result = await response.json()
      if (result.success && Array.isArray(result.data)) {
        return result.data.map(this.normalizePredictionData)
      }

      return []
    } catch (error) {
      console.error('Error fetching predictions:', error)
      return []
    }
  }

  // Helper and auxiliary methods expected by API routes
  getSupportedSports(): SupportedSport[] {
    return SportConfigManager.getAllSportsSync()
  }

  getLeaguesForSport(sport: SupportedSport): string[] {
    return SportConfigManager.getLeaguesForSportSync(sport)
  }

  getDefaultLeague(sport: SupportedSport): string {
    const leagues = this.getLeaguesForSport(sport)
    return leagues[0] || ''
  }

  async getAnalytics(_sport: SupportedSport, _options?: { league?: string }): Promise<any[]> {
    return []
  }

  async getTeamPerformance(_sport: SupportedSport): Promise<any[]> {
    return []
  }

  async getValueBets(
    _sport: SupportedSport,
    _options?: { league?: string; limit?: number }
  ): Promise<any[]> {
    return []
  }

  async getSportOverview(_sport: SupportedSport, _league?: string): Promise<any> {
    return {}
  }

  async getHealthStatus(): Promise<{ providers: any; timestamp: string }> {
    return { providers: {}, timestamp: new Date().toISOString() }
  }

  getCacheStats(): { games: number; teams: number; players: number } {
    return { games: 0, teams: 0, players: 0 }
  }

  async warmupServices(_sports: string[]): Promise<void> {
    return
  }

  clearAllCaches(): void {
    return
  }

  private normalizeGameData(data: any): UnifiedGameData {
    return {
      id: data.id || data.gameId || `${Date.now()}_${Math.random()}`,
      sport: data.sport || '',
      league: data.league || data.competition || '',
      homeTeam: data.homeTeam || data.home_team || data.homeTeamName || '',
      awayTeam: data.awayTeam || data.away_team || data.awayTeamName || '',
      date: data.date || data.gameDate || data.scheduled || '',
      status: data.status || data.gameStatus || 'scheduled',
      homeScore: data.homeScore || data.home_score || data.homeTeamScore,
      awayScore: data.awayScore || data.away_score || data.awayTeamScore,
      venue: data.venue || data.stadium || data.location,
      season: data.season || data.seasonYear,
    }
  }

  private normalizeTeamData(data: any): UnifiedTeamData {
    return {
      id: data.id || data.teamId || `${Date.now()}_${Math.random()}`,
      name: data.name || data.teamName || '',
      city: data.city || data.location,
      league: data.league || data.competition || '',
      sport: data.sport || '',
      abbreviation: data.abbreviation || data.abbr || data.code,
      logoUrl: data.logoUrl || data.logo || data.image,
      conference: data.conference,
      division: data.division,
      foundedYear: data.foundedYear || data.founded || data.established,
      stadiumName: data.stadiumName || data.stadium || data.venue,
      stadiumCapacity: data.stadiumCapacity || data.capacity,
      primaryColor: data.primaryColor || data.color || data.primary_color,
      secondaryColor: data.secondaryColor || data.secondary_color,
      country: data.country || data.nation,
      isActive: data.isActive !== false,
    }
  }

  private normalizePlayerData(data: any): UnifiedPlayerData {
    return {
      id: data.id || data.playerId || `${Date.now()}_${Math.random()}`,
      name: data.name || data.playerName || data.fullName || '',
      sport: data.sport || '',
      teamName: data.teamName || data.team || data.currentTeam,
      position: data.position || data.pos || data.role,
      height: data.height || data.heightCm,
      weight: data.weight || data.weightKg,
      age: data.age || data.ageYears,
      experienceYears: data.experienceYears || data.experience || data.yearsPro,
      college: data.college || data.university,
      country: data.country || data.nationality || data.nation,
      jerseyNumber: data.jerseyNumber || data.number || data.jersey,
      isActive: data.isActive !== false,
      headshotUrl: data.headshotUrl || data.photo || data.image || data.avatar,
    }
  }

  private normalizeStandingsData(data: any): UnifiedStandingsData {
    return {
      id: data.id || `${Date.now()}_${Math.random()}`,
      sport: data.sport || '',
      league: data.league || data.competition || '',
      season: data.season || data.seasonYear || new Date().getFullYear().toString(),
      teamName: data.teamName || data.team || data.name || '',
      position: data.position || data.rank || data.standing || 0,
      wins: data.wins || data.w || data.victories || 0,
      losses: data.losses || data.l || data.defeats || 0,
      ties: data.ties || data.t || data.draws || 0,
      winPercentage: data.winPercentage || data.win_percentage || data.pct || 0,
      gamesBehind: data.gamesBehind || data.games_behind || data.gb,
      pointsFor: data.pointsFor || data.points_for || data.pf || 0,
      pointsAgainst: data.pointsAgainst || data.points_against || data.pa || 0,
      lastUpdated: data.lastUpdated || data.last_updated || new Date().toISOString(),
    }
  }

  private normalizeOddsData(data: any): UnifiedOddsData {
    return {
      id: data.id || `${Date.now()}_${Math.random()}`,
      gameId: data.gameId || data.game_id || '',
      bookmaker: data.bookmaker || data.bookie || data.sportsbook || '',
      market: data.market || data.bet_type || data.market_type || '',
      outcome: data.outcome || data.selection || data.option || '',
      price: data.price || data.odds || data.decimal_odds || 0,
      point: data.point || data.spread || data.handicap,
      lastUpdated: data.lastUpdated || data.last_updated || new Date().toISOString(),
    }
  }

  private normalizePredictionData(data: any): UnifiedPredictionData {
    return {
      id: data.id || `${Date.now()}_${Math.random()}`,
      gameId: data.gameId || data.game_id || '',
      predictionModel: data.predictionModel || data.model || data.algorithm || '',
      predictedOutcome: data.predictedOutcome || data.prediction || data.outcome || '',
      confidence: data.confidence || data.probability || data.certainty || 0,
      predictionTimestamp: data.predictionTimestamp || data.timestamp || new Date().toISOString(),
    }
  }
}

export const unifiedApiClient = UnifiedApiClient.getInstance()
