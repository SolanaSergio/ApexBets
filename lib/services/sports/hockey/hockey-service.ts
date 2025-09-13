/**
 * HOCKEY SERVICE
 * NHL-specific implementation with SportsDB integration
 */

import { SportSpecificService, GameData, TeamData, PlayerData } from '../../core/sport-specific-service'
import { sportsDBClient, oddsApiClient, apiSportsClient, nhlClient, espnClient } from '../../../sports-apis'
import { ServiceConfig } from '../../core/base-service'

export class HockeyService extends SportSpecificService {
  constructor(league: string = 'NHL') {
    const config: ServiceConfig = {
      name: 'hockey',
      cacheTTL: 5 * 60 * 1000, // 5 minutes
      rateLimitService: 'sportsdb',
      retryAttempts: 3,
      retryDelay: 1000
    }
    super('hockey', league, config)
  }

  async getGames(params: {
    date?: string
    status?: 'scheduled' | 'live' | 'finished'
    teamId?: string
  } = {}): Promise<GameData[]> {
    const key = this.getCacheKey('games', JSON.stringify(params))
    const ttl = params.status === 'live' ? 30 * 1000 : this.config.cacheTTL

    return this.getCachedOrFetch(key, () => this.fetchGames(params), ttl)
  }

  private async fetchGames(params: any): Promise<GameData[]> {
    const games: GameData[] = []
    const date = params.date || new Date().toISOString().split('T')[0]

    try {
      // Following comprehensive sports data API guide priority for hockey:
      // 1. NHL API (official, highest quality)
      // 2. TheSportsDB (free, reliable)
      // 3. ESPN (free, good coverage)
      // 4. API-Sports (cost-based)

      // First: Try NHL API (official, free, no key required)
      try {
        const nhlGames = await this.fetchGamesFromNHL(date)
        if (nhlGames.length > 0) {
          games.push(...nhlGames)
          return this.removeDuplicateGames(games)
        }
      } catch (error) {
        console.warn('NHL API failed, trying fallback APIs:', error instanceof Error ? error.message : 'Unknown error')
      }

      // Second: Try TheSportsDB (free, unlimited)
      if (this.hasSportsDBKey()) {
        try {
          const sportsDBGames = await this.fetchGamesFromSportsDB(date)
          if (sportsDBGames.length > 0) {
            games.push(...sportsDBGames)
            return this.removeDuplicateGames(games)
          }
        } catch (error) {
          console.warn('SportsDB failed, trying ESPN:', error instanceof Error ? error.message : 'Unknown error')
        }
      }

      // Third: Try ESPN (free, no key required)
      try {
        const espnGames = await this.fetchGamesFromESPN(date)
        if (espnGames.length > 0) {
          games.push(...espnGames)
          return this.removeDuplicateGames(games)
        }
      } catch (error) {
        console.warn('ESPN failed, trying RapidAPI as last resort:', error instanceof Error ? error.message : 'Unknown error')
      }

      // Last resort: Try RapidAPI (cost-based, limited free tier)
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
      console.error('Error fetching hockey games:', error)
      return []
    }
  }

  private async fetchGamesFromRapidAPI(date: string): Promise<GameData[]> {
    if (!apiSportsClient.isConfigured) return []
    
    try {
      // Use dynamic league configuration
      const leagueConfig = this.getLeagueConfig()
      const fixtures = await apiSportsClient.getFixtures({
        league: leagueConfig?.rapidApiId || 57, // NHL default fallback
        season: new Date().getFullYear(),
        date: date
      })
      if (fixtures?.response && Array.isArray(fixtures.response)) {
        return fixtures.response.map((fixture: any) => this.mapRapidAPIGameData(fixture))
      }
    } catch (error) {
      // Log the error but don't throw - let other APIs handle the request
      console.warn('RapidAPI hockey error (falling back to other APIs):', error instanceof Error ? error.message : 'Unknown error')
    }
    return []
  }

  private async fetchGamesFromSportsDB(date: string): Promise<GameData[]> {
    if (!this.hasSportsDBKey()) return []
    
    try {
      const events = await sportsDBClient.getEventsByDate(date, 'icehockey')
      if (events && Array.isArray(events)) {
        return events.map(event => this.mapGameData(event))
      }
    } catch (error) {
      console.warn('SportsDB hockey error:', error)
    }
    return []
  }

  // NHL API methods (Official, free, no key required)
  private async fetchGamesFromNHL(date: string): Promise<GameData[]> {
    try {
      const games = await nhlClient.getSchedule(date)
      if (games && Array.isArray(games)) {
        return games.map((game: any) => this.mapNHLGameData(game))
      }
    } catch (error) {
      console.warn('NHL API error:', error)
    }
    return []
  }

  // ESPN API methods (free, no key required)
  private async fetchGamesFromESPN(date: string): Promise<GameData[]> {
    try {
      const games = await espnClient.getNHLScoreboard(date)
      if (games && Array.isArray(games)) {
        return games.map(game => this.mapESPNGameData(game))
      }
    } catch (error) {
      console.warn('ESPN API error:', error)
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
      venue: fixture.fixture?.venue?.name || 'TBD',
      lastUpdated: new Date().toISOString()
    }
  }


  private extractAbbreviationFromName(teamName: string): string {
    // Extract abbreviation from team name by taking first letters
    const words = teamName.split(' ').filter(word => 
      !['of', 'the', 'and', 'at'].includes(word.toLowerCase())
    )
    
    if (words.length >= 2) {
      // For multi-word teams, take first letter of each major word
      return words.slice(-2).map(word => word[0]).join('').toUpperCase()
    } else if (words.length === 1) {
      // For single word teams, take first 3 letters
      return words[0].substring(0, 3).toUpperCase()
    }
    
    return teamName.substring(0, 3).toUpperCase()
  }

  private mapRapidAPIStatus(status: string): 'scheduled' | 'live' | 'finished' | 'postponed' | 'cancelled' {
    const statusMap: Record<string, 'scheduled' | 'live' | 'finished' | 'postponed' | 'cancelled'> = {
      'NS': 'scheduled',
      'LIVE': 'live',
      'FT': 'finished',
      'HT': 'live',
      '1H': 'live',
      '2H': 'live',
      '3H': 'live',
      'PST': 'postponed',
      'CANC': 'cancelled'
    }
    return statusMap[status] || 'scheduled'
  }

  async getTeams(params: {
    league?: string
    search?: string
  } = {}): Promise<TeamData[]> {
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
          console.warn('SportsDB teams failed, trying RapidAPI:', error instanceof Error ? error.message : 'Unknown error')
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
          console.warn('RapidAPI teams failed:', error instanceof Error ? error.message : 'Unknown error')
          this.recordRapidAPIError()
        }
      }

      return this.removeDuplicateTeams(teams)
    } catch (error) {
      console.error('Error fetching hockey teams:', error)
      return []
    }
  }

  private async fetchTeamsFromRapidAPI(): Promise<TeamData[]> {
    if (!apiSportsClient.isConfigured) return []
    
    try {
      // Use dynamic league configuration
      const leagueConfig = this.getLeagueConfig()
      const teams = await apiSportsClient.getTeams(leagueConfig?.rapidApiId || 57, new Date().getFullYear())
      if (teams?.response && Array.isArray(teams.response)) {
        return teams.response.map((team: any) => this.mapRapidAPITeamData(team))
      }
    } catch (error) {
      // Log the error but don't throw - let other APIs handle the request
      console.warn('RapidAPI hockey teams error (falling back to other APIs):', error instanceof Error ? error.message : 'Unknown error')
    }
    return []
  }

  private async fetchTeamsFromSportsDB(search?: string): Promise<TeamData[]> {
    if (!this.hasSportsDBKey()) return []
    
    try {
      const teams = await sportsDBClient.searchTeams(search || 'icehockey')
      if (teams && Array.isArray(teams)) {
        return teams.map(team => this.mapTeamData(team))
      }
    } catch (error) {
      console.warn('SportsDB hockey teams error:', error)
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

  private mapRapidAPITeamData(team: any): TeamData {
    return {
      id: team.team?.id?.toString() || '',
      sport: this.sport,
      league: this.league,
      name: team.team?.name || '',
      city: this.extractCityFromName(team.team?.name),
      abbreviation: this.extractAbbreviationFromName(team.team?.name || ''),
      logo: team.team?.logo || '',
      lastUpdated: new Date().toISOString()
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
      const sportConfig = require('../../core/sport-config').SportConfigManager.getSportConfig(this.sport)
      return sportConfig?.leagues?.find((l: any) => l.name === this.league) || {
        rapidApiId: this.sport === 'hockey' ? 57 : undefined, // NHL default
        teamSuffixes: undefined
      }
    } catch (error) {
      // Fallback configuration
      return {
        rapidApiId: this.sport === 'hockey' ? 57 : undefined,
        teamSuffixes: undefined
      }
    }
  }

  private extractCityFromName(teamName: string): string {
    // Extract city from team name (e.g., "New York Rangers" -> "New York")
    const parts = teamName.split(' ')
    if (parts.length > 1) {
      // Remove common team suffixes
      const suffixes = ['Ducks', 'Coyotes', 'Bruins', 'Sabres', 'Flames', 'Hurricanes', 'Blackhawks', 'Avalanche', 'Blue Jackets', 'Stars', 'Red Wings', 'Oilers', 'Panthers', 'Kings', 'Wild', 'Canadiens', 'Predators', 'Devils', 'Islanders', 'Rangers', 'Senators', 'Flyers', 'Penguins', 'Sharks', 'Kraken', 'Blues', 'Lightning', 'Maple Leafs', 'Canucks', 'Golden Knights', 'Capitals', 'Jets']
      
      for (let i = parts.length - 1; i >= 0; i--) {
        if (suffixes.includes(parts[i])) {
          return parts.slice(0, i).join(' ')
        }
      }
    }
    return teamName
  }

  async getPlayers(params: {
    teamId?: string
    search?: string
  } = {}): Promise<PlayerData[]> {
    const key = this.getCacheKey('players', JSON.stringify(params))
    const ttl = 30 * 60 * 1000 // 30 minutes

    return this.getCachedOrFetch(key, () => this.fetchPlayers(params), ttl)
  }

  private async fetchPlayers(_params: any): Promise<PlayerData[]> {
    try {
      // Hockey players would need different API integration
      return []
    } catch (error) {
      console.error('Error fetching hockey players:', error)
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
      console.error('Error fetching hockey standings:', error)
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
        throw new Error('Odds API client not configured')
      }
      const odds = await oddsApiClient.getOdds({
        sport: 'icehockey_nhl',
        regions: 'us',
        markets: 'h2h,spreads,totals',
        oddsFormat: 'american',
        dateFormat: 'iso'
      })
      return odds
    } catch (error) {
      console.error('Error fetching hockey odds:', error)
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
      sport: 'hockey',
      league: rawData.strLeague,
      homeTeam: rawData.strHomeTeam,
      awayTeam: rawData.strAwayTeam,
      date: rawData.dateEvent,
      time: rawData.strTime,
      status: rawData.strStatus === 'FT' ? 'finished' : 
              rawData.strStatus === 'LIVE' ? 'live' : 'scheduled',
      homeScore: rawData.intHomeScore ? parseInt(rawData.intHomeScore) : null,
      awayScore: rawData.intAwayScore ? parseInt(rawData.intAwayScore) : null,
      venue: rawData.strVenue || 'TBD',
      lastUpdated: new Date().toISOString()
    }
  }

  protected mapTeamData(rawData: any): TeamData {
    return {
      id: rawData.idTeam,
      sport: 'hockey',
      league: rawData.strLeague,
      name: rawData.strTeam,
      abbreviation: rawData.strTeamShort,
      city: rawData.strTeam.split(' ').slice(0, -1).join(' '),
      logo: rawData.strTeamBadge,
      lastUpdated: new Date().toISOString()
    }
  }

  protected mapPlayerData(rawData: any): PlayerData {
    return {
      id: rawData.idPlayer || rawData.id,
      sport: 'hockey',
      league: rawData.strLeague || 'NHL',
      name: rawData.strPlayer || rawData.name,
      team: rawData.strTeam || rawData.team,
      position: rawData.strPosition || rawData.position,
      stats: rawData.stats || {},
      lastUpdated: new Date().toISOString()
    }
  }

  // NHL API data mapping methods
  private mapNHLGameData(game: any): GameData {
    return {
      id: game.id?.toString() || '',
      sport: this.sport,
      league: 'NHL',
      homeTeam: game.homeTeam?.name?.default || '',
      awayTeam: game.awayTeam?.name?.default || '',
      date: game.gameDate || new Date().toISOString(),
      status: this.mapNHLStatus(game.gameState),
      homeScore: game.homeTeam?.score || null,
      awayScore: game.awayTeam?.score || null,
      venue: game.venue?.default || 'TBD',
      lastUpdated: new Date().toISOString()
    }
  }

  private mapNHLStatus(gameState: string | number): 'scheduled' | 'live' | 'finished' | 'postponed' | 'cancelled' {
    // NHL game states: 1=scheduled, 2=live, 3=final, 4=final_ot, 5=final_so, 6=postponed, 7=cancelled
    if (typeof gameState === 'number') {
      switch (gameState) {
        case 1: return 'scheduled'
        case 2: return 'live'
        case 3:
        case 4:
        case 5: return 'finished'
        case 6: return 'postponed'
        case 7: return 'cancelled'
        default: return 'scheduled'
      }
    }
    
    if (typeof gameState === 'string') {
      const state = gameState.toLowerCase()
      if (state.includes('final')) return 'finished'
      if (state.includes('live') || state.includes('progress')) return 'live'
      if (state.includes('postponed')) return 'postponed'
      if (state.includes('cancelled')) return 'cancelled'
    }
    
    return 'scheduled'
  }

  // ESPN API data mapping methods
  private mapESPNGameData(game: any): GameData {
    const homeTeam = game.competitions?.[0]?.competitors?.find((c: any) => c.homeAway === 'home')
    const awayTeam = game.competitions?.[0]?.competitors?.find((c: any) => c.homeAway === 'away')
    
    return {
      id: game.id?.toString() || '',
      sport: this.sport,
      league: 'NHL',
      homeTeam: homeTeam?.team?.displayName || '',
      awayTeam: awayTeam?.team?.displayName || '',
      date: game.date || new Date().toISOString(),
      status: this.mapESPNStatus(game.status?.type?.name),
      homeScore: parseInt(homeTeam?.score) || null,
      awayScore: parseInt(awayTeam?.score) || null,
      venue: game.competitions?.[0]?.venue?.fullName || 'TBD',
      lastUpdated: new Date().toISOString()
    }
  }

  private mapESPNStatus(statusName: string): 'scheduled' | 'live' | 'finished' | 'postponed' | 'cancelled' {
    if (!statusName) return 'scheduled'
    
    const status = statusName.toLowerCase()
    if (status.includes('final')) return 'finished'
    if (status.includes('in progress') || status.includes('live')) return 'live'
    if (status.includes('postponed')) return 'postponed'
    if (status.includes('cancelled')) return 'cancelled'
    
    return 'scheduled'
  }

  async healthCheck(): Promise<boolean> {
    try {
      // First check if SportsDB API is accessible
      const sportsDBHealthy = await sportsDBClient.healthCheck()
      if (!sportsDBHealthy) {
        console.warn('SportsDB API is not accessible, but service can still function with cached data')
        return true // Return true as service can still work with cached data
      }
      
      // Test with a simple API call
      await this.getTeams()
      return true
    } catch (error) {
      console.error(`${this.sport} service health check failed:`, error)
      return false
    }
  }
}
