/**
 * FOOTBALL SERVICE
 * NFL-specific implementation with SportsDB integration
 */

import { SportSpecificService, GameData, TeamData, PlayerData } from '../../core/sport-specific-service'
import { sportsDBClient, oddsApiClient, apiSportsClient } from '../../../sports-apis'
import { ServiceConfig } from '../../core/base-service'

export class FootballService extends SportSpecificService {
  constructor(league: string = 'NFL') {
    const config: ServiceConfig = {
      name: 'football',
      cacheTTL: 5 * 60 * 1000, // 5 minutes
      rateLimitService: 'sportsdb',
      retryAttempts: 3,
      retryDelay: 1000
    }
    super('football', league, config)
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
          console.warn('SportsDB failed, trying RapidAPI:', error instanceof Error ? error.message : 'Unknown error')
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
      console.error('Error fetching football games:', error)
      return []
    }
  }

  private async fetchGamesFromRapidAPI(date: string): Promise<GameData[]> {
    if (!apiSportsClient.isConfigured) return []
    
    try {
      // Get NFL league ID (1 is NFL in RapidAPI)
      const fixtures = await apiSportsClient.getFixtures({
        league: 1, // NFL
        season: new Date().getFullYear(),
        date: date
      })
      if (fixtures?.response && Array.isArray(fixtures.response)) {
        return fixtures.response.map((fixture: any) => this.mapRapidAPIGameData(fixture))
      }
    } catch (error) {
      // Log the error but don't throw - let other APIs handle the request
      console.warn('RapidAPI football error (falling back to other APIs):', error instanceof Error ? error.message : 'Unknown error')
    }
    return []
  }

  private async fetchGamesFromSportsDB(date: string): Promise<GameData[]> {
    if (!this.hasSportsDBKey()) return []
    
    try {
      const events = await sportsDBClient.getEventsByDate(date, 'americanfootball')
      if (events && Array.isArray(events)) {
        return events.map(event => this.mapGameData(event))
      }
    } catch (error) {
      console.warn('SportsDB football error:', error)
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

  private getTeamAbbreviation(teamName: string): string {
    // Map common NFL team names to abbreviations
    const abbreviations: Record<string, string> = {
      'Arizona Cardinals': 'ARI',
      'Atlanta Falcons': 'ATL',
      'Baltimore Ravens': 'BAL',
      'Buffalo Bills': 'BUF',
      'Carolina Panthers': 'CAR',
      'Chicago Bears': 'CHI',
      'Cincinnati Bengals': 'CIN',
      'Cleveland Browns': 'CLE',
      'Dallas Cowboys': 'DAL',
      'Denver Broncos': 'DEN',
      'Detroit Lions': 'DET',
      'Green Bay Packers': 'GB',
      'Houston Texans': 'HOU',
      'Indianapolis Colts': 'IND',
      'Jacksonville Jaguars': 'JAX',
      'Kansas City Chiefs': 'KC',
      'Las Vegas Raiders': 'LV',
      'Los Angeles Chargers': 'LAC',
      'Los Angeles Rams': 'LAR',
      'Miami Dolphins': 'MIA',
      'Minnesota Vikings': 'MIN',
      'New England Patriots': 'NE',
      'New Orleans Saints': 'NO',
      'New York Giants': 'NYG',
      'New York Jets': 'NYJ',
      'Philadelphia Eagles': 'PHI',
      'Pittsburgh Steelers': 'PIT',
      'San Francisco 49ers': 'SF',
      'Seattle Seahawks': 'SEA',
      'Tampa Bay Buccaneers': 'TB',
      'Tennessee Titans': 'TEN',
      'Washington Commanders': 'WAS'
    }
    return abbreviations[teamName] || teamName.split(' ').map(word => word[0]).join('').toUpperCase()
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
      console.error('Error fetching football teams:', error)
      return []
    }
  }

  private async fetchTeamsFromRapidAPI(): Promise<TeamData[]> {
    if (!apiSportsClient.isConfigured) return []
    
    try {
      // Get NFL teams from RapidAPI
      const teams = await apiSportsClient.getTeams(1, new Date().getFullYear()) // NFL league ID
      if (teams?.response && Array.isArray(teams.response)) {
        return teams.response.map((team: any) => this.mapRapidAPITeamData(team))
      }
    } catch (error) {
      // Log the error but don't throw - let other APIs handle the request
      console.warn('RapidAPI football teams error (falling back to other APIs):', error instanceof Error ? error.message : 'Unknown error')
    }
    return []
  }

  private async fetchTeamsFromSportsDB(search?: string): Promise<TeamData[]> {
    if (!this.hasSportsDBKey()) return []
    
    try {
      const teams = await sportsDBClient.searchTeams(search || 'americanfootball')
      if (teams && Array.isArray(teams)) {
        return teams.map(team => this.mapTeamData(team))
      }
    } catch (error) {
      console.warn('SportsDB football teams error:', error)
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
      abbreviation: this.getTeamAbbreviation(team.team?.name),
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
    // Extract city from team name (e.g., "New England Patriots" -> "New England")
    const parts = teamName.split(' ')
    if (parts.length > 1) {
      // Remove common team suffixes
      const suffixes = ['Cardinals', 'Falcons', 'Ravens', 'Bills', 'Panthers', 'Bears', 'Bengals', 'Browns', 'Cowboys', 'Broncos', 'Lions', 'Packers', 'Texans', 'Colts', 'Jaguars', 'Chiefs', 'Raiders', 'Chargers', 'Rams', 'Dolphins', 'Vikings', 'Patriots', 'Saints', 'Giants', 'Jets', 'Eagles', 'Steelers', '49ers', 'Seahawks', 'Buccaneers', 'Titans', 'Commanders']
      
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

  private async fetchPlayers(params: any): Promise<PlayerData[]> {
    try {
      // Football players would need different API integration
      return []
    } catch (error) {
      console.error('Error fetching football players:', error)
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

  private async fetchStandings(season?: string): Promise<any[]> {
    try {
      // Would integrate with appropriate API
      return []
    } catch (error) {
      console.error('Error fetching football standings:', error)
      return []
    }
  }

  async getOdds(params: any = {}): Promise<any[]> {
    const key = this.getCacheKey('odds', JSON.stringify(params))
    const ttl = 2 * 60 * 1000 // 2 minutes

    return this.getCachedOrFetch(key, () => this.fetchOdds(params), ttl)
  }

  private async fetchOdds(params: any): Promise<any[]> {
    try {
      if (!oddsApiClient) {
        console.warn('Odds API client not configured, returning empty odds')
        return []
      }
      
      const odds = await oddsApiClient.getOdds({
        sport: 'americanfootball_nfl',
        regions: 'us',
        markets: 'h2h,spreads,totals',
        oddsFormat: 'american',
        dateFormat: 'iso'
      })
      return odds
    } catch (error) {
      console.error('Error fetching football odds:', error)
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
      homeScore: rawData.intHomeScore ? parseInt(rawData.intHomeScore) : undefined,
      awayScore: rawData.intAwayScore ? parseInt(rawData.intAwayScore) : undefined,
      venue: rawData.strVenue,
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
}
