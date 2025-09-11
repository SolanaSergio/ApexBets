/**
 * BASKETBALL SERVICE
 * NBA-specific implementation with BallDontLie and SportsDB integration
 */

import { SportSpecificService, GameData, TeamData, PlayerData } from '../../core/sport-specific-service'
import { ballDontLieClient, sportsDBClient, oddsApiClient } from '../../../sports-apis'
import { ServiceConfig } from '../../core/base-service'

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

    try {
      // Try BallDontLie first (NBA-specific, high quality)
      if (this.hasBallDontLieKey()) {
        try {
          const nbaGames = await ballDontLieClient.getGames({
            start_date: params.date || new Date().toISOString().split('T')[0],
            end_date: params.date || new Date().toISOString().split('T')[0]
          })
          if (nbaGames && nbaGames.data && Array.isArray(nbaGames.data)) {
            games.push(...nbaGames.data.map(game => this.mapGameData(game)))
          }
        } catch (error) {
          console.warn('BallDontLie API error:', error)
        }
      }

      // Fallback to SportsDB for broader coverage
      try {
        const events = await sportsDBClient.getEventsByDate(
          params.date || new Date().toISOString().split('T')[0],
          'basketball'
        )
        if (events && Array.isArray(events)) {
          games.push(...events.map(event => this.mapGameData(event)))
        }
      } catch (error) {
        console.warn('SportsDB API error:', error)
      }

      return games
    } catch (error) {
      console.error('Error fetching basketball games:', error)
      return []
    }
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
      // Try BallDontLie for NBA teams
      if (this.hasBallDontLieKey()) {
        try {
          const nbaTeams = await ballDontLieClient.getTeams()
          if (nbaTeams && nbaTeams.data && Array.isArray(nbaTeams.data)) {
            teams.push(...nbaTeams.data.map(team => this.mapTeamData(team)))
          }
        } catch (error) {
          console.warn('BallDontLie teams error:', error)
        }
      }

      // Fallback to SportsDB
      try {
        const sportsDBTeams = await sportsDBClient.searchTeams(params.search || 'basketball')
        if (sportsDBTeams && Array.isArray(sportsDBTeams)) {
          teams.push(...sportsDBTeams.map(team => this.mapTeamData(team)))
        }
      } catch (error) {
        console.warn('SportsDB teams error:', error)
      }

      return teams
    } catch (error) {
      console.error('Error fetching basketball teams:', error)
      return []
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
    try {
      if (this.hasBallDontLieKey()) {
        const players = await ballDontLieClient.getPlayers({
          search: params.search
        })
        
        if (players && players.data && Array.isArray(players.data)) {
          return players.data.map(player => this.mapPlayerData(player))
        }
      }
      
      return []
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
  private hasBallDontLieKey(): boolean {
    const apiKey = process.env.NEXT_PUBLIC_BALLDONTLIE_API_KEY
    return !!(apiKey && 
              apiKey !== '' && 
              apiKey.length > 10)
  }
}
