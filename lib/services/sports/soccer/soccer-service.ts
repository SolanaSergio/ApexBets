/**
 * SOCCER SERVICE
 * Soccer-specific implementation with SportsDB integration
 */

import {
  SportSpecificService,
  GameData,
  TeamData,
  PlayerData,
} from '../../core/sport-specific-service'
import { sportsDBClient, oddsApiClient, apiSportsClient } from '../../../sports-apis'
import { ServiceConfig } from '../../core/base-service'

export class SoccerService extends SportSpecificService {
  constructor(league: string = 'Premier League') {
    const config: ServiceConfig = {
      name: 'soccer',
      cacheTTL: 5 * 60 * 1000, // 5 minutes
      rateLimitService: 'sportsdb',
      retryAttempts: 3,
      retryDelay: 1000,
    }
    super('soccer', league, config)
  }

  async getGames(
    params: {
      date?: string
      status?: 'scheduled' | 'live' | 'finished'
      teamId?: string
    } = {}
  ): Promise<GameData[]> {
    const key = this.getCacheKey('games', JSON.stringify(params))
    const ttl = params.status === 'live' ? 30 * 1000 : this.config.cacheTTL

    return this.getCachedOrFetch(key, () => this.fetchGames(params), ttl)
  }

  private async fetchGames(params: any): Promise<GameData[]> {
    const games: GameData[] = []
    const date = params.date || new Date().toISOString().split('T')[0]

    try {
      // Try APIs in sequence to avoid rate limits
      // Start with SportsDB first (more reliable than RapidAPI)
      if (this.hasSportsDBKey()) {
        try {
          const sportsDBGames = await this.fetchGamesFromSportsDB(date)
          if (sportsDBGames.length > 0) {
            games.push(...sportsDBGames)
            return this.removeDuplicateGames(games)
          }
        } catch (error) {
          console.warn(
            'SportsDB failed, trying RapidAPI:',
            error instanceof Error ? error.message : 'Unknown error'
          )
        }
      }

      // Only try RapidAPI if SportsDB failed and we haven't hit rate limits recently
      if (apiSportsClient.isConfigured && !this.hasRecentRapidAPIError()) {
        try {
          const rapidAPIGames = await this.fetchGamesFromRapidAPI(date)
          if (rapidAPIGames.length > 0) {
            games.push(...rapidAPIGames)
          }
        } catch (error) {
          console.warn('RapidAPI failed:', error instanceof Error ? error.message : 'Unknown error')
          this.recordRapidAPIError()
        }
      }

      return this.removeDuplicateGames(games)
    } catch (error) {
      console.error('Error fetching soccer games:', error)
      return []
    }
  }

  private async fetchGamesFromRapidAPI(date: string): Promise<GameData[]> {
    if (!apiSportsClient.isConfigured) return []

    try {
      // Use dynamic league configuration
      const leagueConfig = this.getLeagueConfig()
      const fixtures = await apiSportsClient.getFixtures({
        league: leagueConfig?.rapidApiId || 39, // Premier League default fallback
        season: new Date().getFullYear(),
        date: date,
      })
      if (fixtures?.response && Array.isArray(fixtures.response)) {
        return fixtures.response.map((fixture: any) => this.mapRapidAPIGameData(fixture))
      }
    } catch (error) {
      // Log the error but don't throw - let other APIs handle the request
      console.warn(
        'RapidAPI soccer error (falling back to other APIs):',
        error instanceof Error ? error.message : 'Unknown error'
      )
    }
    return []
  }

  private async fetchGamesFromSportsDB(date: string): Promise<GameData[]> {
    if (!this.hasSportsDBKey()) return []

    try {
      const events = await sportsDBClient.getEventsByDate(date, 'soccer')
      if (events && Array.isArray(events)) {
        return events.map(event => this.mapGameData(event))
      }
    } catch (error) {
      console.warn('SportsDB soccer error:', error)
    }
    return []
  }

  private removeDuplicateGames(games: GameData[]): GameData[] {
    const seen = new Set<string>()
    return games.filter(game => {
      const key = `${game.homeTeam}-${game.awayTeam}-${game.date}`
      if (seen.has(key)) {
        return false
      }
      seen.add(key)
      return true
    })
  }

  private mapRapidAPIGameData(fixture: any): GameData {
    return {
      id: fixture.fixture?.id?.toString() || '',
      sport: this.sport,
      league: this.league,
      homeTeam: fixture.teams?.home?.name || '',
      awayTeam: fixture.teams?.away?.name || '',
      date: fixture.fixture?.date || new Date().toISOString(),
      status: this.mapRapidAPIStatus(fixture.fixture?.status?.short),
      homeScore: fixture.goals?.home || null,
      awayScore: fixture.goals?.away || null,
      venue: fixture.fixture?.venue?.name || '',
      lastUpdated: new Date().toISOString(),
    }
  }

  private async getTeamAbbreviation(teamName: string): Promise<string> {
    // First try to get abbreviation from database
    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()

      if (supabase) {
        const { data: team } = await supabase
          .from('teams')
          .select('abbreviation')
          .eq('name', teamName)
          .eq('sport', this.sport)
          .single()

        if (team?.abbreviation) {
          return team.abbreviation
        }
      }
    } catch (error) {
      // Database lookup failed, fall back to API or extraction
    }

    // Try to get from API data if available
    try {
      const teams = await this.fetchTeamsFromSportsDB()
      const matchingTeam = teams.find(team => team.name.toLowerCase() === teamName.toLowerCase())
      if (matchingTeam?.abbreviation) {
        return matchingTeam.abbreviation
      }
    } catch (error) {
      // API lookup failed
    }

    // Fall back to extracting abbreviation from team name
    return this.extractAbbreviationFromName(teamName)
  }

  private extractAbbreviationFromName(teamName: string): string {
    // Extract abbreviation from team name by taking first letters
    const words = teamName
      .split(' ')
      .filter(
        word => !['of', 'the', 'and', 'at', 'fc', 'united', 'city'].includes(word.toLowerCase())
      )

    if (words.length >= 2) {
      // For multi-word teams, take first letter of each major word
      return words
        .slice(0, 3)
        .map(word => word[0])
        .join('')
        .toUpperCase()
    } else if (words.length === 1) {
      // For single word teams, take first 3 letters
      return words[0].substring(0, 3).toUpperCase()
    }

    return teamName.substring(0, 3).toUpperCase()
  }

  private mapRapidAPIStatus(
    status: string
  ): 'scheduled' | 'live' | 'finished' | 'postponed' | 'cancelled' {
    const statusMap: Record<string, 'scheduled' | 'live' | 'finished' | 'postponed' | 'cancelled'> =
      {
        NS: 'scheduled',
        LIVE: 'live',
        FT: 'finished',
        HT: 'live',
        '1H': 'live',
        '2H': 'live',
        PST: 'postponed',
        CANC: 'cancelled',
        SUSP: 'postponed',
      }
    return statusMap[status] || 'scheduled'
  }

  async getTeams(
    params: {
      league?: string
      search?: string
    } = {}
  ): Promise<TeamData[]> {
    const key = this.getCacheKey('teams', JSON.stringify(params))
    const ttl = 30 * 60 * 1000 // 30 minutes

    return this.getCachedOrFetch(key, () => this.fetchTeams(params), ttl)
  }

  private async fetchTeams(params: any): Promise<TeamData[]> {
    const teams: TeamData[] = []

    try {
      // Try APIs in sequence to avoid rate limits
      // Start with SportsDB first (more reliable than RapidAPI)
      if (this.hasSportsDBKey()) {
        try {
          const sportsDBTeams = await this.fetchTeamsFromSportsDB(params.search)
          if (sportsDBTeams.length > 0) {
            teams.push(...sportsDBTeams)
            return this.removeDuplicateTeams(teams)
          }
        } catch (error) {
          console.warn(
            'SportsDB teams failed, trying RapidAPI:',
            error instanceof Error ? error.message : 'Unknown error'
          )
        }
      }

      // Only try RapidAPI if SportsDB failed and we haven't hit rate limits recently
      if (apiSportsClient.isConfigured && !this.hasRecentRapidAPIError()) {
        try {
          const rapidAPITeams = await this.fetchTeamsFromRapidAPI()
          if (rapidAPITeams.length > 0) {
            teams.push(...rapidAPITeams)
          }
        } catch (error) {
          console.warn(
            'RapidAPI teams failed:',
            error instanceof Error ? error.message : 'Unknown error'
          )
          this.recordRapidAPIError()
        }
      }

      return this.removeDuplicateTeams(teams)
    } catch (error) {
      console.error('Error fetching soccer teams:', error)
      return []
    }
  }

  private async fetchTeamsFromRapidAPI(): Promise<TeamData[]> {
    if (!apiSportsClient.isConfigured) return []

    try {
      // Use dynamic league configuration
      const leagueConfig = this.getLeagueConfig()
      const teams = await apiSportsClient.getTeams(
        leagueConfig?.rapidApiId || 39,
        new Date().getFullYear()
      )
      if (teams?.response && Array.isArray(teams.response)) {
        const mappedTeams = await Promise.all(
          teams.response.map((team: any) => this.mapRapidAPITeamData(team))
        )
        return mappedTeams
      }
    } catch (error) {
      // Log the error but don't throw - let other APIs handle the request
      console.warn(
        'RapidAPI soccer teams error (falling back to other APIs):',
        error instanceof Error ? error.message : 'Unknown error'
      )
    }
    return []
  }

  private async fetchTeamsFromSportsDB(search?: string): Promise<TeamData[]> {
    if (!this.hasSportsDBKey()) return []

    try {
      const teams = await sportsDBClient.searchTeams(search || 'soccer')
      if (teams && Array.isArray(teams)) {
        return teams.map(team => this.mapTeamData(team))
      }
    } catch (error) {
      console.warn('SportsDB soccer teams error:', error)
    }
    return []
  }

  private removeDuplicateTeams(teams: TeamData[]): TeamData[] {
    const seen = new Set<string>()
    return teams.filter(team => {
      const key = team.name.toLowerCase()
      if (seen.has(key)) {
        return false
      }
      seen.add(key)
      return true
    })
  }

  private async mapRapidAPITeamData(team: any): Promise<TeamData> {
    return {
      id: team.team?.id?.toString() || '',
      sport: this.sport,
      league: this.league,
      name: team.team?.name || '',
      city: await this.extractCityFromName(team.team?.name),
      abbreviation: await this.getTeamAbbreviation(team.team?.name),
      logo: team.team?.logo || '',
      lastUpdated: new Date().toISOString(),
    }
  }

  private hasSportsDBKey(): boolean {
    return !!process.env.NEXT_PUBLIC_SPORTSDB_API_KEY
  }

  private rapidAPIErrorTime: number = 0
  private readonly RAPIDAPI_ERROR_COOLDOWN = 5 * 60 * 1000 // 5 minutes

  private hasRecentRapidAPIError(): boolean {
    return Date.now() - this.rapidAPIErrorTime < this.RAPIDAPI_ERROR_COOLDOWN
  }

  private recordRapidAPIError(): void {
    this.rapidAPIErrorTime = Date.now()
  }

  private getLeagueConfig(): any {
    // Get league configuration from sport config manager
    try {
      const sportConfig = require('../../core/sport-config').SportConfigManager.getSportConfig(
        this.sport
      )
      return (
        sportConfig?.leagues?.find((l: any) => l.name === this.league) || {
          rapidApiId: this.sport === 'soccer' ? 39 : undefined, // Premier League default
          teamSuffixes: undefined,
        }
      )
    } catch (error) {
      // Fallback configuration
      return {
        rapidApiId: this.sport === 'soccer' ? 39 : undefined,
        teamSuffixes: undefined,
      }
    }
  }

  /**
   * Get team suffixes dynamically from database
   * NO hardcoded team names
   */
  private async getTeamSuffixes(): Promise<string[]> {
    try {
      const { createClient } = require('@supabase/supabase-js')
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      )

      const { data: teams } = await supabase
        .from('teams')
        .select('name')
        .eq('sport', 'soccer')
        .eq('is_active', true)

      if (teams && teams.length > 0) {
        // Extract suffixes from real team names
        return teams
          .map((team: any) => {
            const parts = team.name.split(' ')
            return parts[parts.length - 1] // Last word is typically the suffix
          })
          .filter((suffix: any, index: number, arr: any[]) => arr.indexOf(suffix) === index) // Remove duplicates
      }
    } catch (error) {
      console.warn('Failed to get team suffixes from database:', error)
    }

    // Fallback: return empty array (no hardcoded names)
    return []
  }

  private async extractCityFromName(teamName: string): Promise<string> {
    // Extract city from team name dynamically
    const parts = teamName.split(' ')
    if (parts.length > 1) {
      // Get team suffixes dynamically from database
      const suffixes = await this.getTeamSuffixes()

      for (let i = parts.length - 1; i >= 0; i--) {
        if (suffixes.includes(parts[i])) {
          return parts.slice(0, i).join(' ')
        }
      }
    }
    return teamName
  }

  async getPlayers(
    params: {
      teamId?: string
      search?: string
    } = {}
  ): Promise<PlayerData[]> {
    const key = this.getCacheKey('players', JSON.stringify(params))
    const ttl = 30 * 60 * 1000 // 30 minutes

    return this.getCachedOrFetch(key, () => this.fetchPlayers(params), ttl)
  }

  private async fetchPlayers(params: any): Promise<PlayerData[]> {
    try {
      // Fetch from database using production client
      const { productionSupabaseClient } = await import('@/lib/supabase/production-client')
      const players = await productionSupabaseClient.getPlayers(
        'soccer',
        params.teamId,
        params.limit || 100
      )

      return players.map((player: any) => ({
        id: player.id,
        name: player.name,
        position: player.position,
        team_id: player.team_id,
        sport: 'soccer',
        ...player,
      }))
    } catch (error) {
      console.error('Error fetching soccer players:', error)
      return []
    }
  }

  async getLiveGames(): Promise<GameData[]> {
    return this.getGames({ status: 'live' })
  }

  async getStandings(season?: string): Promise<any[]> {
    const key = this.getCacheKey('standings', season || 'current')
    const ttl = 60 * 60 * 1000 // 1 hour

    return this.getCachedOrFetch(key, () => this.fetchStandings(season), ttl)
  }

  private async fetchStandings(_season?: string): Promise<any[]> {
    try {
      // Would integrate with appropriate API
      return []
    } catch (error) {
      console.error('Error fetching soccer standings:', error)
      return []
    }
  }

  async getOdds(params: any = {}): Promise<any[]> {
    const key = this.getCacheKey('odds', JSON.stringify(params))
    const ttl = 2 * 60 * 1000 // 2 minutes

    return this.getCachedOrFetch(key, () => this.fetchOdds(params), ttl)
  }

  private async fetchOdds(_params: any): Promise<any[]> {
    try {
      if (!oddsApiClient) {
        console.warn('Odds API client not configured, returning empty odds')
        return []
      }

      const odds = await oddsApiClient.getOdds({
        sport: 'soccer_epl',
        regions: 'us',
        markets: 'h2h,spreads,totals',
        oddsFormat: 'american',
        dateFormat: 'iso',
      })
      return odds
    } catch (error) {
      console.error('Error fetching soccer odds:', error)
      return []
    }
  }

  // Abstract method implementations
  protected async fetchGameById(gameId: string): Promise<GameData | null> {
    try {
      const event = await sportsDBClient.getEventById(gameId)
      return event ? this.mapGameData(event) : null
    } catch (error) {
      console.error(`Error fetching game ${gameId}:`, error)
      return null
    }
  }

  protected async fetchTeamById(teamId: string): Promise<TeamData | null> {
    try {
      // Would need specific team API
      return null
    } catch (error) {
      console.error(`Error fetching team ${teamId}:`, error)
      return null
    }
  }

  protected async fetchPlayerById(playerId: string): Promise<PlayerData | null> {
    try {
      // Would need specific player API
      return null
    } catch (error) {
      console.error(`Error fetching player ${playerId}:`, error)
      return null
    }
  }

  // Data mappers
  protected mapGameData(rawData: any): GameData {
    return {
      id: rawData.idEvent,
      sport: this.sport,
      league: rawData.strLeague,
      homeTeam: rawData.strHomeTeam,
      awayTeam: rawData.strAwayTeam,
      date: rawData.dateEvent,
      time: rawData.strTime,
      status:
        rawData.strStatus === 'FT'
          ? 'finished'
          : rawData.strStatus === 'LIVE'
            ? 'live'
            : 'scheduled',
      homeScore: rawData.intHomeScore ? parseInt(rawData.intHomeScore) : null,
      awayScore: rawData.intAwayScore ? parseInt(rawData.intAwayScore) : null,
      venue: rawData.strVenue,
      lastUpdated: new Date().toISOString(),
    }
  }

  protected mapTeamData(rawData: any): TeamData {
    return {
      id: rawData.idTeam,
      sport: this.sport,
      league: rawData.strLeague,
      name: rawData.strTeam,
      abbreviation: rawData.strTeamShort,
      city: rawData.strTeam.split(' ').slice(0, -1).join(' '),
      logo: rawData.strTeamBadge,
      lastUpdated: new Date().toISOString(),
    }
  }

  protected mapPlayerData(rawData: any): PlayerData {
    return {
      id: rawData.idPlayer || rawData.id,
      sport: this.sport,
      league: rawData.strLeague || this.league,
      name: rawData.strPlayer || rawData.name,
      team: rawData.strTeam || rawData.team,
      position: rawData.strPosition || rawData.position,
      stats: rawData.stats || {},
      lastUpdated: new Date().toISOString(),
    }
  }
}
