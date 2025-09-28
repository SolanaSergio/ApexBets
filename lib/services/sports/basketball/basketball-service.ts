/**
 * BASKETBALL SERVICE
 * NBA-specific implementation with BallDontLie and SportsDB integration
 */

import { SportSpecificService, GameData, TeamData, PlayerData } from '../../core/sport-specific-service'
import { ballDontLieClient, sportsDBClient, oddsApiClient, apiSportsClient, nbaStatsClient, espnClient } from '../../../sports-apis'
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
      // Following comprehensive sports data API guide priority:
      // 1. NBA Stats API (official, highest quality for basketball)
      // 2. TheSportsDB (free, reliable)
      // 3. ESPN (free, good coverage)
      // 4. Ball Don't Lie (basketball-specific but rate-limited)
      // 5. API-Sports (cost-based)

      // First: Try NBA Stats API (official, free, no key required)
      try {
        const nbaGames = await this.fetchGamesFromNBAStats(date)
        if (nbaGames.length > 0) {
          games.push(...nbaGames)
          return this.removeDuplicateGames(games)
        }
      } catch (error) {
        console.warn('NBA Stats API failed, trying fallback APIs:', error instanceof Error ? error.message : 'Unknown error')
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
        console.warn('ESPN failed, trying Ball Don\'t Lie:', error instanceof Error ? error.message : 'Unknown error')
      }

      // Fourth: Try Ball Don't Lie (basketball-specific but rate-limited)
      if (this.hasBallDontLieKey()) {
        try {
          const ballDontLieGames = await this.fetchGamesFromBallDontLie(date)
          if (ballDontLieGames.length > 0) {
            games.push(...ballDontLieGames)
            return this.removeDuplicateGames(games)
          }
        } catch (error) {
          console.warn('BallDontLie failed, trying RapidAPI as last resort:', error instanceof Error ? error.message : 'Unknown error')
        }
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
      // Use dynamic league configuration
      const leagueConfig = this.getLeagueConfig()
      const fixtures = await apiSportsClient.getFixtures({
        league: leagueConfig?.rapidApiId || 39, // NBA default fallback
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

  // NBA Stats API methods (Official, free, no key required)
  private async fetchGamesFromNBAStats(date: string): Promise<GameData[]> {
    try {
      // Convert date format: YYYY-MM-DD to YYYYMMDD
      const gameDate = date.replace(/-/g, '')
      const scoreboardData = await nbaStatsClient.getScoreboard(gameDate)
      
      if (scoreboardData?.resultSets) {
        const gameHeaderResultSet = scoreboardData.resultSets.find(
          (rs: any) => rs.name === 'GameHeader'
        )
        
        if (gameHeaderResultSet?.rowSet) {
          return gameHeaderResultSet.rowSet.map((row: any[]) => {
            const headers = gameHeaderResultSet.headers
            const game: any = {}
            headers.forEach((header: string, index: number) => {
              game[header] = row[index]
            })
            return this.mapNBAStatsGameData(game)
          })
        }
      }
    } catch (error) {
      console.warn('NBA Stats API error:', error)
    }
    return []
  }

  private async fetchTeamsFromNBAStats(): Promise<TeamData[]> {
    try {
      const teams = await nbaStatsClient.getCommonTeamYears()
      if (teams && Array.isArray(teams)) {
        return teams.map(team => this.mapNBAStatsTeamData(team))
      }
    } catch (error) {
      console.warn('NBA Stats API teams error:', error)
    }
    return []
  }

  // ESPN API methods (free, no key required)
  private async fetchGamesFromESPN(date: string): Promise<GameData[]> {
    try {
      const games = await espnClient.getNBAScoreboard(date)
      if (games && Array.isArray(games)) {
        return games.map(game => this.mapESPNGameData(game))
      }
    } catch (error) {
      console.warn('ESPN API error:', error)
    }
    return []
  }

  private async fetchTeamsFromESPN(): Promise<TeamData[]> {
    try {
      const teams = await espnClient.getTeams('basketball', 'nba')
      if (teams && Array.isArray(teams)) {
        return teams.map(team => this.mapESPNTeamData(team))
      }
    } catch (error) {
      console.warn('ESPN teams API error:', error)
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
      // Following comprehensive sports data API guide priority for basketball teams:
      // 1. NBA Stats API (official, highest quality)
      // 2. TheSportsDB (free, reliable)
      // 3. ESPN (free, good coverage)
      // 4. Ball Don't Lie (basketball-specific)
      // 5. API-Sports (cost-based)

      // First: Try NBA Stats API (official, dynamic teams)
      try {
        const nbaTeams = await this.fetchTeamsFromNBAStats()
        if (nbaTeams.length > 0) {
          teams.push(...nbaTeams)
          return this.removeDuplicateTeams(teams)
        }
      } catch (error) {
        console.warn('NBA Stats API failed for teams, trying fallback:', error instanceof Error ? error.message : 'Unknown error')
      }

      // Second: Try TheSportsDB
      if (this.hasSportsDBKey()) {
        try {
          const sportsDBTeams = await this.fetchTeamsFromSportsDB(params.search)
          if (sportsDBTeams.length > 0) {
            teams.push(...sportsDBTeams)
            return this.removeDuplicateTeams(teams)
          }
        } catch (error) {
          console.warn('SportsDB failed for teams, trying ESPN:', error instanceof Error ? error.message : 'Unknown error')
        }
      }

      // Third: Try ESPN
      try {
        const espnTeams = await this.fetchTeamsFromESPN()
        if (espnTeams.length > 0) {
          teams.push(...espnTeams)
          return this.removeDuplicateTeams(teams)
        }
      } catch (error) {
        console.warn('ESPN failed for teams, trying Ball Don\'t Lie:', error instanceof Error ? error.message : 'Unknown error')
      }

      // Fourth: Try Ball Don't Lie
      if (this.hasBallDontLieKey()) {
        try {
          const ballDontLieTeams = await this.fetchTeamsFromBallDontLie()
          if (ballDontLieTeams.length > 0) {
            teams.push(...ballDontLieTeams)
            return this.removeDuplicateTeams(teams)
          }
        } catch (error) {
          console.warn('Ball Don\'t Lie failed for teams, trying RapidAPI:', error instanceof Error ? error.message : 'Unknown error')
        }
      }

      // Last resort: Try RapidAPI
      if (apiSportsClient.isConfigured && !this.hasRecentRapidAPIError()) {
        try {
          const rapidAPITeams = await this.fetchTeamsFromRapidAPI()
          if (rapidAPITeams.length > 0) {
            teams.push(...rapidAPITeams)
          }
        } catch (error) {
          console.warn('RapidAPI failed for teams:', error instanceof Error ? error.message : 'Unknown error')
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
      // Use dynamic league configuration
      const leagueConfig = this.getLeagueConfig()
      const teams = await apiSportsClient.getTeams(leagueConfig?.rapidApiId || 39, new Date().getFullYear())
      if (teams?.response && Array.isArray(teams.response)) {
        const mappedTeams = await Promise.all(teams.response.map((team: any) => this.mapRapidAPITeamData(team)))
        return mappedTeams
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

  private async mapRapidAPITeamData(team: any): Promise<TeamData> {
    return {
      id: team.team?.id?.toString() || '',
      sport: this.sport,
      league: this.league,
      name: team.team?.name || '',
      city: this.extractCityFromName(team.team?.name),
      abbreviation: await this.getTeamAbbreviation(team.team?.name),
      logo: team.team?.logo || '',
      lastUpdated: new Date().toISOString()
    }
  }


  private extractCityFromName(teamName: string): string {
    // Extract city from team name (e.g., "Los Angeles Lakers" -> "Los Angeles")
    const parts = teamName.split(' ')
    if (parts.length > 1) {
      // Use sport-specific configuration for team suffixes if available
      const leagueConfig = this.getLeagueConfig()
      const suffixes = leagueConfig?.teamSuffixes || []
      
      // If no suffixes configured, try to extract city by removing the last word
      if (suffixes.length === 0) {
        return parts.slice(0, -1).join(' ')
      }
      
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

  private getLeagueConfig(): any {
    // Get league configuration from sport config manager
    try {
      const sportConfig = require('../../core/sport-config').SportConfigManager.getSportConfig(this.sport)
      return sportConfig?.leagues?.find((l: any) => l.name === this.league) || {
        rapidApiId: this.sport === 'basketball' ? 39 : undefined, // NBA default
        teamSuffixes: undefined
      }
    } catch (error) {
      // Fallback configuration
      return {
        rapidApiId: this.sport === 'basketball' ? 39 : undefined,
        teamSuffixes: undefined
      }
    }
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

  private async fetchOdds(_params: any): Promise<any[]> {
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
      venue: fixture.fixture?.venue?.name || 'TBD',
      lastUpdated: new Date().toISOString()
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
      const teams = await this.fetchTeamsFromBallDontLie()
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
          .select(`
            id,
            external_id,
            sport,
            league_id,
            league_name,
            season,
            home_team_id,
            away_team_id,
            home_team_name,
            away_team_name,
            home_team_score,
            away_team_score,
            game_date,
            game_time_local,
            status,
            game_type,
            venue,
            attendance,
            weather_conditions,
            referee_info,
            broadcast_info,
            betting_odds,
            last_updated,
            created_at
          `)
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
        homeScore: rawData.home_team_score || null,
        awayScore: rawData.visitor_team_score || null,
        venue: rawData.arena_name || 'TBD',
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
      homeScore: rawData.intHomeScore ? parseInt(rawData.intHomeScore) : null,
      awayScore: rawData.intAwayScore ? parseInt(rawData.intAwayScore) : null,
      venue: rawData.strVenue || 'TBD',
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
      team: rawData.team?.full_name ?? null,
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

  // NBA Stats API data mapping methods
  private mapNBAStatsGameData(game: any): GameData {
    return {
      id: game.GAME_ID?.toString() || '',
      sport: this.sport,
      league: 'NBA',
      homeTeam: game.HOME_TEAM_NAME || '',
      awayTeam: game.VISITOR_TEAM_NAME || '',
      date: game.GAME_DATE_EST || new Date().toISOString(),
      status: this.mapNBAStatsStatus(game.GAME_STATUS_TEXT),
      homeScore: game.HOME_TEAM_SCORE || null,
      awayScore: game.VISITOR_TEAM_SCORE || null,
      venue: game.ARENA_NAME || 'TBD',
      lastUpdated: new Date().toISOString()
    }
  }

  private mapNBAStatsTeamData(team: any): TeamData {
    return {
      id: team.TEAM_ID?.toString() || '',
      sport: this.sport,
      league: 'NBA',
      name: team.TEAM_NAME || '',
      city: team.TEAM_CITY || '',
      abbreviation: team.TEAM_ABBREVIATION || '',
      lastUpdated: new Date().toISOString()
    }
  }

  private mapNBAStatsStatus(statusText: string): 'scheduled' | 'live' | 'finished' | 'postponed' | 'cancelled' {
    if (!statusText) return 'scheduled'
    
    const status = statusText.toLowerCase()
    if (status.includes('final')) return 'finished'
    if (status.includes('qtr') || status.includes('quarter') || status.includes('ot') || status.includes('halftime')) return 'live'
    if (status.includes('postponed')) return 'postponed'
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
      league: 'NBA',
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

  private mapESPNTeamData(team: any): TeamData {
    return {
      id: team.id?.toString() || '',
      sport: this.sport,
      league: 'NBA',
      name: team.displayName || team.name || '',
      city: team.location || '',
      abbreviation: team.abbreviation || '',
      logo: team.logos?.[0]?.href || '',
      lastUpdated: new Date().toISOString()
    }
  }

  private mapESPNStatus(statusName: string): 'scheduled' | 'live' | 'finished' | 'postponed' | 'cancelled' {
    if (!statusName) return 'scheduled'
    
    const status = statusName.toLowerCase()
    if (status.includes('final')) return 'finished'
    if (status.includes('in progress') || status.includes('halftime') || status.includes('live')) return 'live'
    if (status.includes('postponed')) return 'postponed'
    if (status.includes('cancelled')) return 'cancelled'
    
    return 'scheduled'
  }

}
