/**
 * BASEBALL SERVICE
 * MLB-specific implementation with SportsDB integration
 */

import { SportSpecificService, GameData, TeamData, PlayerData } from '../../core/sport-specific-service'
import { sportsDBClient, oddsApiClient, apiSportsClient, mlbStatsClient, espnClient } from '../../../sports-apis'
import { ServiceConfig } from '../../core/base-service'

export class BaseballService extends SportSpecificService {
  constructor(league: string = 'MLB') {
    const config: ServiceConfig = {
      name: 'baseball',
      cacheTTL: 5 * 60 * 1000, // 5 minutes
      rateLimitService: 'sportsdb',
      retryAttempts: 3,
      retryDelay: 1000
    }
    super('baseball', league, config)
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
      // Following comprehensive sports data API guide priority for baseball:
      // 1. MLB Stats API (official, highest quality)
      // 2. TheSportsDB (free, reliable)
      // 3. ESPN (free, good coverage)
      // 4. API-Sports (cost-based)

      // First: Try MLB Stats API (official, free, no key required)
      try {
        const mlbGames = await this.fetchGamesFromMLBStats(date)
        if (mlbGames.length > 0) {
          games.push(...mlbGames)
          return this.removeDuplicateGames(games)
        }
      } catch (error) {
        console.warn('MLB Stats API failed, trying fallback APIs:', error instanceof Error ? error.message : 'Unknown error')
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
      console.error('Error fetching baseball games:', error)
      return []
    }
  }

  private async fetchGamesFromRapidAPI(date: string): Promise<GameData[]> {
    if (!apiSportsClient.isConfigured) return []
    
    try {
      // Get MLB league ID (1 is MLB in RapidAPI)
      const fixtures = await apiSportsClient.getFixtures({
        league: 1, // MLB
        season: new Date().getFullYear(),
        date: date
      })
      if (fixtures?.response && Array.isArray(fixtures.response)) {
        return fixtures.response.map((fixture: any) => this.mapRapidAPIGameData(fixture))
      }
    } catch (error) {
      // Log the error but don't throw - let other APIs handle the request
      console.warn('RapidAPI baseball error (falling back to other APIs):', error instanceof Error ? error.message : 'Unknown error')
    }
    return []
  }

  private async fetchGamesFromSportsDB(date: string): Promise<GameData[]> {
    if (!this.hasSportsDBKey()) return []
    
    try {
      const events = await sportsDBClient.getEventsByDate(date, 'baseball')
      if (events && Array.isArray(events)) {
        return events.map(event => this.mapGameData(event))
      }
    } catch (error) {
      console.warn('SportsDB baseball error:', error)
    }
    return []
  }

  // MLB Stats API methods (Official, free, no key required)
  private async fetchGamesFromMLBStats(date: string): Promise<GameData[]> {
    try {
      const games = await mlbStatsClient.getTodaysGames()
      if (games && Array.isArray(games)) {
        // Filter games for the requested date
        const requestedDate = date.split('T')[0]
        const filteredGames = games.filter(game => 
          game.gameDate?.split('T')[0] === requestedDate
        )
        return filteredGames.map(game => this.mapMLBStatsGameData(game))
      }
    } catch (error) {
      console.warn('MLB Stats API error:', error)
    }
    return []
  }

  // ESPN API methods (free, no key required)
  private async fetchGamesFromESPN(date: string): Promise<GameData[]> {
    try {
      const games = await espnClient.getMLBScoreboard(date)
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
      venue: fixture.fixture?.venue?.name || '',
      lastUpdated: new Date().toISOString()
    }
  }

  private async getTeamAbbreviation(teamName: string): Promise<string> {
    // Try to get abbreviation from database first
    try {
      const { createClient } = await import('@/lib/supabase/server')
      const supabase = await createClient()
      
      if (supabase) {
        const { data: team } = await supabase
          .from('teams')
          .select('abbreviation')
          .eq('name', teamName)
          .eq('sport', 'baseball')
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
      const matchingTeam = teams.find(team => 
        team.name.toLowerCase() === teamName.toLowerCase()
      )
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
      '4H': 'live',
      '5H': 'live',
      '6H': 'live',
      '7H': 'live',
      '8H': 'live',
      '9H': 'live',
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
      console.error('Error fetching baseball teams:', error)
      return []
    }
  }

  private async fetchTeamsFromRapidAPI(): Promise<TeamData[]> {
    if (!apiSportsClient.isConfigured) return []
    
    try {
      // Get MLB teams from RapidAPI
      const teams = await apiSportsClient.getTeams(1, new Date().getFullYear()) // MLB league ID
      if (teams?.response && Array.isArray(teams.response)) {
        return teams.response.map((team: any) => this.mapRapidAPITeamData(team))
      }
    } catch (error) {
      // Log the error but don't throw - let other APIs handle the request
      console.warn('RapidAPI baseball teams error (falling back to other APIs):', error instanceof Error ? error.message : 'Unknown error')
    }
    return []
  }

  private async fetchTeamsFromSportsDB(search?: string): Promise<TeamData[]> {
    if (!this.hasSportsDBKey()) return []
    
    try {
      const teams = await sportsDBClient.searchTeams(search || 'baseball')
      if (teams && Array.isArray(teams)) {
        return teams.map(team => this.mapTeamData(team))
      }
    } catch (error) {
      console.warn('SportsDB baseball teams error:', error)
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

  private extractCityFromName(teamName: string): string {
    // Extract city from team name (e.g., "New York Yankees" -> "New York")
    const parts = teamName.split(' ')
    if (parts.length > 1) {
      // Remove common team suffixes
      const suffixes = ['Diamondbacks', 'Braves', 'Orioles', 'Red Sox', 'Cubs', 'White Sox', 'Reds', 'Guardians', 'Rockies', 'Tigers', 'Astros', 'Royals', 'Angels', 'Dodgers', 'Marlins', 'Brewers', 'Twins', 'Mets', 'Yankees', 'Athletics', 'Phillies', 'Pirates', 'Padres', 'Giants', 'Mariners', 'Cardinals', 'Rays', 'Rangers', 'Blue Jays', 'Nationals']
      
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
      // Baseball players would need different API integration
      return []
    } catch (error) {
      console.error('Error fetching baseball players:', error)
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
      console.error('Error fetching baseball standings:', error)
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
        sport: 'baseball_mlb',
        regions: 'us',
        markets: 'h2h,spreads,totals',
        oddsFormat: 'american',
        dateFormat: 'iso'
      })
      return odds
    } catch (error) {
      console.error('Error fetching baseball odds:', error)
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
      sport: this.sport,
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
      sport: this.sport,
      league: rawData.strLeague || this.league,
      name: rawData.strPlayer || rawData.name,
      team: rawData.strTeam || rawData.team,
      position: rawData.strPosition || rawData.position,
      stats: rawData.stats || {},
      lastUpdated: new Date().toISOString()
    }
  }

  // MLB Stats API data mapping methods
  private mapMLBStatsGameData(game: any): GameData {
    return {
      id: game.gamePk?.toString() || '',
      sport: this.sport,
      league: 'MLB',
      homeTeam: game.teams?.home?.team?.name || '',
      awayTeam: game.teams?.away?.team?.name || '',
      date: game.gameDate || new Date().toISOString(),
      status: this.mapMLBStatsStatus(game.status?.detailedState),
      homeScore: game.teams?.home?.score || null,
      awayScore: game.teams?.away?.score || null,
      venue: game.venue?.name || 'TBD',
      lastUpdated: new Date().toISOString()
    }
  }

  private mapMLBStatsStatus(detailedState: string): 'scheduled' | 'live' | 'finished' | 'postponed' | 'cancelled' {
    if (!detailedState) return 'scheduled'
    
    const status = detailedState.toLowerCase()
    if (status.includes('final') || status.includes('completed')) return 'finished'
    if (status.includes('in progress') || status.includes('live')) return 'live'
    if (status.includes('postponed') || status.includes('delayed')) return 'postponed'
    if (status.includes('cancelled')) return 'cancelled'
    
    return 'scheduled'
  }

  // ESPN API data mapping methods
  private mapESPNGameData(game: any): GameData {
    const homeTeam = game.competitions?.[0]?.competitors?.find((c: any) => c.homeAway === 'home')
    const awayTeam = game.competitions?.[0]?.competitors?.find((c: any) => c.homeAway === 'away')
    
    return {
      id: game.id?.toString() || '',
      sport: this.sport,
      league: 'MLB',
      homeTeam: homeTeam?.team?.displayName || '',
      awayTeam: awayTeam?.team?.displayName || '',
      date: game.date || new Date().toISOString(),
      status: this.mapESPNStatus(game.status?.type?.name),
      homeScore: parseInt(homeTeam?.score) || null,
      awayScore: parseInt(awayTeam?.score) || null,
      venue: game.competitions?.[0]?.venue?.fullName || '',
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
}
