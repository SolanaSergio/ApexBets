/**
 * BASKETBALL SERVICE
 * NBA-specific implementation with BallDontLie and SportsDB integration
 */

import { SportSpecificService, GameData, TeamData, PlayerData } from '../../core/sport-specific-service'
import { ballDontLieClient, sportsDBClient, oddsApiClient, apiSportsClient } from '../../../sports-apis'
import { ServiceConfig } from '../../core/base-service'
import { SportConfigManager } from '../../core/sport-config'

export class BasketballService extends SportSpecificService {
  constructor(league: string = 'NBA') {
    const config: ServiceConfig = {
      name: 'basketball',
      cacheTTL: 5 * 60 * 1000, // 5 minutes
      rateLimitService: 'balldontlie',
      retryAttempts: 3,
      retryDelay: 1000
    }
    super('basketball', league, config)
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
      // Start with the most reliable API first
      if (this.hasBallDontLieKey()) {
        try {
          const ballDontLieGames = await this.fetchGamesFromBallDontLie(date)
          if (ballDontLieGames.length > 0) {
            games.push(...ballDontLieGames)
            // If we got good data from BallDontLie, return it (basketball-specific)
            return this.removeDuplicateGames(games)
          }
        } catch (error) {
          console.warn('BallDontLie failed, trying other APIs:', error instanceof Error ? error.message : 'Unknown error')
        }
      }

      // Try SportsDB as fallback (more reliable than RapidAPI)
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

      // Only try RapidAPI if other APIs failed and we haven't hit rate limits recently
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
      console.error('Error fetching basketball games:', error)
      return []
    }
  }

  private async fetchGamesFromBallDontLie(date: string): Promise<GameData[]> {
    if (!this.hasBallDontLieKey()) return []
    
    try {
      const nbaGames = await ballDontLieClient.getGames({
        start_date: date,
        end_date: date
      })
      if (nbaGames?.data && Array.isArray(nbaGames.data)) {
        return nbaGames.data.map(game => this.mapGameData(game))
      }
    } catch (error) {
      console.warn('BallDontLie API error:', error)
    }
    return []
  }

  private async fetchGamesFromRapidAPI(date: string): Promise<GameData[]> {
    if (!apiSportsClient.isConfigured) return []
    
    try {
      // Get NBA league ID (39 is NBA in RapidAPI)
      const fixtures = await apiSportsClient.getFixtures({
        league: 39, // NBA
        season: new Date().getFullYear(),
        date: date
      })
      if (fixtures?.response && Array.isArray(fixtures.response)) {
        return fixtures.response.map((fixture: any) => this.mapRapidAPIGameData(fixture))
      }
    } catch (error) {
      // Log the error but don't throw - let other APIs handle the request
      console.warn('RapidAPI error (falling back to other APIs):', error instanceof Error ? error.message : 'Unknown error')
    }
    return []
  }

  private async fetchGamesFromSportsDB(date: string): Promise<GameData[]> {
    if (!this.hasSportsDBKey()) return []
    
    try {
      const events = await sportsDBClient.getEventsByDate(date, this.sport)
      if (events && Array.isArray(events)) {
        return events.map(event => this.mapGameData(event))
      }
    } catch (error) {
      console.warn('SportsDB API error:', error)
    }
    return []
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
      // Start with the most reliable API first
      if (this.hasBallDontLieKey()) {
        try {
          const ballDontLieTeams = await this.fetchTeamsFromBallDontLie()
          if (ballDontLieTeams.length > 0) {
            teams.push(...ballDontLieTeams)
            // If we got good data from BallDontLie, return it (basketball-specific)
            return this.removeDuplicateTeams(teams)
          }
        } catch (error) {
          console.warn('BallDontLie teams failed, trying other APIs:', error instanceof Error ? error.message : 'Unknown error')
        }
      }

      // Try SportsDB as fallback (more reliable than RapidAPI)
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

      // Only try RapidAPI if other APIs failed and we haven't hit rate limits recently
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
      console.error('Error fetching basketball teams:', error)
      return []
    }
  }

  private async fetchTeamsFromBallDontLie(): Promise<TeamData[]> {
    if (!this.hasBallDontLieKey()) return []
    
    try {
      const nbaTeams = await ballDontLieClient.getTeams()
      if (nbaTeams?.data && Array.isArray(nbaTeams.data)) {
        return nbaTeams.data.map(team => this.mapTeamData(team))
      }
    } catch (error) {
      console.warn('BallDontLie teams error:', error)
    }
    return []
  }

  private async fetchTeamsFromRapidAPI(): Promise<TeamData[]> {
    if (!apiSportsClient.isConfigured) return []
    
    try {
      // Get NBA teams from RapidAPI
      const teams = await apiSportsClient.getTeams(39, new Date().getFullYear()) // NBA league ID
      if (teams?.response && Array.isArray(teams.response)) {
        return teams.response.map((team: any) => this.mapRapidAPITeamData(team))
      }
    } catch (error) {
      // Log the error but don't throw - let other APIs handle the request
      console.warn('RapidAPI teams error (falling back to other APIs):', error instanceof Error ? error.message : 'Unknown error')
    }
    return []
  }

  private async fetchTeamsFromSportsDB(search?: string): Promise<TeamData[]> {
    if (!this.hasSportsDBKey()) return []
    
    try {
      const sportsDBTeams = await sportsDBClient.searchTeams(search || this.sport)
      if (sportsDBTeams && Array.isArray(sportsDBTeams)) {
        return sportsDBTeams.map(team => this.mapTeamData(team))
      }
    } catch (error) {
      console.warn('SportsDB teams error:', error)
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


  private extractCityFromName(teamName: string): string {
    // Extract city from team name (e.g., "Los Angeles Lakers" -> "Los Angeles")
    const parts = teamName.split(' ')
    if (parts.length > 1) {
      // Remove common team suffixes
      const suffixes = ['Lakers', 'Celtics', 'Warriors', 'Heat', 'Bulls', 'Knicks', '76ers', 'Nets', 'Hawks', 'Hornets', 'Cavaliers', 'Mavericks', 'Nuggets', 'Pistons', 'Rockets', 'Pacers', 'Clippers', 'Grizzlies', 'Bucks', 'Timberwolves', 'Pelicans', 'Thunder', 'Magic', 'Suns', 'Trail Blazers', 'Kings', 'Spurs', 'Raptors', 'Jazz', 'Wizards']
      
      for (let i = parts.length - 1; i >= 0; i--) {
        if (suffixes.includes(parts[i])) {
          return parts.slice(0, i).join(' ')
        }
      }
    }
    return teamName
  }

  private hasSportsDBKey(): boolean {
    return !!process.env.NEXT_PUBLIC_SPORTSDB_API_KEY
  }

  private hasBallDontLieKey(): boolean {
    return !!process.env.NEXT_PUBLIC_BALLDONTLIE_API_KEY
  }

  private rapidAPIErrorTime: number = 0
  private readonly RAPIDAPI_ERROR_COOLDOWN = 5 * 60 * 1000 // 5 minutes

  private hasRecentRapidAPIError(): boolean {
    return Date.now() - this.rapidAPIErrorTime < this.RAPIDAPI_ERROR_COOLDOWN
  }

  private recordRapidAPIError(): void {
    this.rapidAPIErrorTime = Date.now()
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
    const players: PlayerData[] = []
    const dataSource = await this.getDataSource()

    try {
      // Use configured data source
      if (dataSource === 'balldontlie' && this.hasBallDontLieKey()) {
        try {
          const nbaPlayers = await ballDontLieClient.getPlayers({
            search: params.search
          })
          
          if (nbaPlayers && nbaPlayers.data && Array.isArray(nbaPlayers.data)) {
            players.push(...nbaPlayers.data.map(player => this.mapPlayerData(player)))
          }
        } catch (error) {
          console.warn('BallDontLie players error:', error)
        }
      } else if (dataSource === 'sportsdb' && this.hasSportsDBKey()) {
        try {
          const sportsDBPlayers = await sportsDBClient.getPlayersByTeam('')
          if (sportsDBPlayers && Array.isArray(sportsDBPlayers)) {
            players.push(...sportsDBPlayers.map(player => this.mapPlayerData(player)))
          }
        } catch (error) {
          console.warn('SportsDB players error:', error)
        }
      } else {
        // Fallback to available APIs
        if (this.hasBallDontLieKey()) {
          try {
            const nbaPlayers = await ballDontLieClient.getPlayers({
              search: params.search
            })
            
            if (nbaPlayers && nbaPlayers.data && Array.isArray(nbaPlayers.data)) {
              players.push(...nbaPlayers.data.map(player => this.mapPlayerData(player)))
            }
          } catch (error) {
            console.warn('BallDontLie players fallback error:', error)
          }
        }

        if (this.hasSportsDBKey()) {
          try {
            const sportsDBPlayers = await sportsDBClient.getPlayersByTeam('')
            if (sportsDBPlayers && Array.isArray(sportsDBPlayers)) {
              players.push(...sportsDBPlayers.map(player => this.mapPlayerData(player)))
            }
          } catch (error) {
            console.warn('SportsDB players fallback error:', error)
          }
        }
      }

      return players
    } catch (error) {
      console.error('Error fetching basketball players:', error)
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
      // Use SportsDB for standings data
      const currentSeason = season || new Date().getFullYear().toString()
      const standings = await sportsDBClient.getLeaguesBySport('basketball')
      
      // Filter for NBA and return formatted standings
      const nbaLeagues = standings.filter(league => 
        league.strLeague?.toLowerCase().includes('nba') ||
        league.strLeague?.toLowerCase().includes('basketball')
      )
      
      return nbaLeagues.map(league => ({
        league: league.strLeague,
        season: currentSeason,
        teams: [] // Would need specific standings API
      }))
    } catch (error) {
      console.error('Error fetching basketball standings:', error)
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
        sport: 'basketball_nba',
        regions: 'us',
        markets: 'h2h,spreads,totals',
        oddsFormat: 'american',
        dateFormat: 'iso'
      })
      return odds
    } catch (error) {
      console.error('Error fetching basketball odds:', error)
      return []
    }
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
    // Map common team names to abbreviations
    const abbreviations: Record<string, string> = {
      'Los Angeles Lakers': 'LAL',
      'Boston Celtics': 'BOS',
      'Golden State Warriors': 'GSW',
      'Miami Heat': 'MIA',
      'Chicago Bulls': 'CHI',
      'New York Knicks': 'NYK',
      'Philadelphia 76ers': 'PHI',
      'Brooklyn Nets': 'BKN',
      'Atlanta Hawks': 'ATL',
      'Charlotte Hornets': 'CHA',
      'Cleveland Cavaliers': 'CLE',
      'Dallas Mavericks': 'DAL',
      'Denver Nuggets': 'DEN',
      'Detroit Pistons': 'DET',
      'Houston Rockets': 'HOU',
      'Indiana Pacers': 'IND',
      'LA Clippers': 'LAC',
      'Memphis Grizzlies': 'MEM',
      'Milwaukee Bucks': 'MIL',
      'Minnesota Timberwolves': 'MIN',
      'New Orleans Pelicans': 'NOP',
      'Oklahoma City Thunder': 'OKC',
      'Orlando Magic': 'ORL',
      'Phoenix Suns': 'PHX',
      'Portland Trail Blazers': 'POR',
      'Sacramento Kings': 'SAC',
      'San Antonio Spurs': 'SAS',
      'Toronto Raptors': 'TOR',
      'Utah Jazz': 'UTA',
      'Washington Wizards': 'WAS'
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
      'PST': 'postponed',
      'CANC': 'cancelled'
    }
    return statusMap[status] || 'scheduled'
  }

  // Abstract method implementations
  protected async fetchGameById(gameId: string): Promise<GameData | null> {
    try {
      // Check if gameId is a valid numeric ID for BallDontLie
      const numericId = parseInt(gameId)
      if (isNaN(numericId)) {
        // If it's a UUID, try to find the game in our database first
        const { createClient } = await import('@/lib/supabase/client')
        const supabase = createClient()
        
        const response = await supabase
          ?.from('games')
          .select('*')
          .eq('id', gameId)
          .single()
        
        if (!response || response.error || !response.data) {
          return null
        }
        
        const gameData = response.data
        
        // Return the game data from our database
        return this.mapGameData(gameData)
      }
      
      if (this.hasBallDontLieKey()) {
        const game = await ballDontLieClient.getGameById(numericId)
        return this.mapGameData(game)
      }
      return null
    } catch (error) {
      console.error(`Error fetching game ${gameId}:`, error)
      return null
    }
  }

  protected async fetchTeamById(teamId: string): Promise<TeamData | null> {
    try {
      // Check if teamId is a valid numeric ID for BallDontLie
      const numericId = parseInt(teamId)
      if (isNaN(numericId)) {
        // If it's a UUID, try to find the team in our database first
        const { createClient } = await import('@/lib/supabase/client')
        const supabase = createClient()
        
        const response = await supabase
          ?.from('teams')
          .select('*')
          .eq('id', teamId)
          .single()
        
        if (!response || response.error || !response.data) {
          return null
        }
        
        const teamData = response.data
        
        // Return the team data from our database
        return this.mapTeamData(teamData)
      }
      
      if (this.hasBallDontLieKey()) {
        const team = await ballDontLieClient.getTeamById(numericId)
        return this.mapTeamData(team)
      }
      return null
    } catch (error) {
      console.error(`Error fetching team ${teamId}:`, error)
      return null
    }
  }

  protected async fetchPlayerById(playerId: string): Promise<PlayerData | null> {
    try {
      // Check if playerId is a valid numeric ID for BallDontLie
      const numericId = parseInt(playerId)
      if (isNaN(numericId)) {
        // If it's a UUID, try to find the player in our database first
        const { createClient } = await import('@/lib/supabase/client')
        const supabase = createClient()
        
        const response = await supabase
          ?.from('players')
          .select('*')
          .eq('id', playerId)
          .single()
        
        if (!response || response.error || !response.data) {
          return null
        }
        
        const playerData = response.data
        
        // Return the player data from our database
        return this.mapPlayerData(playerData)
      }
      
      if (this.hasBallDontLieKey()) {
        const player = await ballDontLieClient.getPlayerById(numericId)
        return this.mapPlayerData(player)
      }
      return null
    } catch (error) {
      console.error(`Error fetching player ${playerId}:`, error)
      return null
    }
  }

  // Data mappers
  protected mapGameData(rawData: any): GameData {
    // BallDontLie format
    if (rawData.home_team) {
      return {
        id: rawData.id.toString(),
        sport: this.sport,
        league: this.league,
        homeTeam: rawData.home_team.full_name,
        awayTeam: rawData.visitor_team.full_name,
        date: rawData.date,
        time: rawData.time,
        status: rawData.status === 'Final' ? 'finished' : 
                rawData.status === 'In Progress' ? 'live' : 'scheduled',
        homeScore: rawData.home_team_score,
        awayScore: rawData.visitor_team_score,
        venue: undefined,
        lastUpdated: new Date().toISOString()
      }
    }

    // SportsDB format
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
    // BallDontLie format
    if (rawData.full_name) {
      return {
        id: rawData.id.toString(),
        sport: this.sport,
        league: this.league,
        name: rawData.full_name,
        abbreviation: rawData.abbreviation,
        city: rawData.city,
        lastUpdated: new Date().toISOString()
      }
    }

    // SportsDB format
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
      id: rawData.id.toString(),
      sport: this.sport,
      league: this.league,
      name: `${rawData.first_name} ${rawData.last_name}`,
      team: rawData.team?.full_name || 'Unknown',
      position: rawData.position,
      stats: {
        height_feet: rawData.height_feet,
        height_inches: rawData.height_inches,
        weight_pounds: rawData.weight_pounds
      },
      lastUpdated: new Date().toISOString()
    }
  }

  // Helper methods
  private async getDataSource(): Promise<string> {
    const config = await SportConfigManager.getSportConfigAsync(this.sport)
    return config?.dataSource || 'sportsdb'
  }

}
