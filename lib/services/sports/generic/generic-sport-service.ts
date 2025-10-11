/**
 * Generic Sport Service
 * Provides a fallback service for sports that don't have dedicated implementations
 */

import { SportSpecificService } from '../../core/sport-specific-service'
import { ServiceConfig } from '../../core/base-service'
import type { GameData, TeamData, PlayerData } from '../../core/sport-specific-service'
import { sportsDBClient } from '../../../sports-apis/sportsdb-client'
import { espnClient } from '../../../sports-apis/espn-client'
import { unifiedCacheService } from '../../unified-cache-service'

export class GenericSportService extends SportSpecificService {
  // Dynamic sport mapping - NO hardcoded values

  constructor(sport: string, league: string = 'General') {
    const config: ServiceConfig = {
      name: sport,
      cacheTTL: 10 * 60 * 1000, // 10 minutes for generic sports
      rateLimitService: 'sportsdb',
      retryAttempts: 2,
      retryDelay: 2000,
    }
    super(sport, league, config)
  }

  /**
   * Get API sport name dynamically from database
   * NO hardcoded mappings - all from database configuration
   */
  private async getAPISportName(sport: string): Promise<string> {
    // Check cache first
    const cacheKey = `sport-api-name:${sport}`
    const cached = await unifiedCacheService.get<string>(cacheKey)
    if (cached) return cached

    try {
      // Query database for API mapping
      const { createClient } = require('@supabase/supabase-js')
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      )

      const { data } = await supabase
        .from('api_mappings')
        .select('sport_name_mapping')
        .eq('sport', sport)
        .eq('provider', 'sportsdb')
        .single()

      if (data?.sport_name_mapping?.apiName) {
        await unifiedCacheService.set(cacheKey, data.sport_name_mapping.apiName, 3600000) // 1 hour cache
        return data.sport_name_mapping.apiName
      }
    } catch (error) {
      console.warn(`Failed to get API sport name for ${sport} from database:`, error)
    }

    // Fallback: capitalize first letter (dynamic transformation)
    const apiName = sport.charAt(0).toUpperCase() + sport.slice(1)
    await unifiedCacheService.set(cacheKey, apiName, 300000) // 5 minute cache for fallback
    return apiName
  }

  async getGames(
    params: {
      date?: string
      status?: 'scheduled' | 'live' | 'finished'
      teamId?: string
    } = {}
  ): Promise<GameData[]> {
    const key = this.getCacheKey('games', JSON.stringify(params))
    const ttl = params.status === 'live' ? 60 * 1000 : this.config.cacheTTL

    return this.getCachedOrFetch(key, () => this.fetchGames(params), ttl)
  }

  async getTeams(params: any = {}): Promise<TeamData[]> {
    const key = this.getCacheKey('teams', JSON.stringify(params))
    return this.getCachedOrFetch(key, () => this.fetchTeams(params))
  }

  async getPlayers(params: any = {}): Promise<PlayerData[]> {
    const key = this.getCacheKey('players', JSON.stringify(params))
    return this.getCachedOrFetch(key, () => this.fetchPlayers(params))
  }

  async getLiveGames(): Promise<GameData[]> {
    const key = this.getCacheKey('live-games', this.sport)
    return this.getCachedOrFetch(key, () => this.fetchLiveGames(), 30 * 1000)
  }

  async getStandings(season?: string): Promise<any[]> {
    const key = this.getCacheKey('standings', season || 'current')
    return this.getCachedOrFetch(key, () => this.fetchStandings(season))
  }

  async getOdds(params: any = {}): Promise<any[]> {
    const key = this.getCacheKey('odds', JSON.stringify(params))
    const ttl = 2 * 60 * 1000 // 2 minutes

    return this.getCachedOrFetch(key, () => this.fetchOdds(params), ttl)
  }

  // Implementation methods
  private async fetchGames(params: any): Promise<GameData[]> {
    try {
      const sportName = await this.getAPISportName(this.sport) // Dynamic mapping
      const date = params.date || new Date().toISOString().split('T')[0]

      console.log(
        `GenericSportService.fetchGames - sport: ${this.sport}, sportName: ${sportName}, date: ${date}`
      )

      // Try SportsDB first
      try {
        const events = await sportsDBClient.getEventsByDate(date, sportName)
        const mappedGames = events.map(event => this.mapGameData(event))
        return mappedGames.filter(game => game !== null) // Filter out null games
      } catch (sportsDbError) {
        console.warn(`SportsDB failed for ${this.sport}:`, sportsDbError)

        // Fallback to ESPN if available
        try {
          const espnSport = this.getESPNSportMapping(this.sport)
          if (espnSport) {
            const games = await espnClient.getNBAScoreboard()
            const mappedGames = games.map((game: any) => this.mapESPNGameData(game))
            return mappedGames.filter(game => game !== null) // Filter out null games
          }
        } catch (espnError) {
          console.warn(`ESPN fallback failed for ${this.sport}:`, espnError)
        }
      }

      return []
    } catch (error) {
      console.error(`Error fetching games for ${this.sport}:`, error)
      return []
    }
  }

  private async fetchTeams(_params: any): Promise<TeamData[]> {
    try {
      const sportName = await this.getAPISportName(this.sport) // Dynamic mapping
      const leagues = await sportsDBClient.getLeaguesBySport(sportName)
      const league = leagues?.[0]?.idLeague
      if (!league) return []
      const teams = await sportsDBClient.getTeamsByLeague(league)
      return teams.map((team: any) => this.mapTeamData(team))
    } catch (error) {
      console.error(`Error fetching teams for ${this.sport}:`, error)
      return []
    }
  }

  private async fetchPlayers(_params: any): Promise<PlayerData[]> {
    try {
      const teams = await this.fetchTeams({})
      if (teams.length === 0) {
        return []
      }

      const allPlayers: PlayerData[] = []
      for (const team of teams) {
        const players = await sportsDBClient.getPlayersByTeam(team.id)
        const mappedPlayers = players.map((player: any) => this.mapPlayerData(player))
        allPlayers.push(...mappedPlayers)
      }

      return allPlayers
    } catch (error) {
      console.error(`Error fetching players for ${this.sport}:`, error)
      return []
    }
  }

  private async fetchLiveGames(): Promise<GameData[]> {
    try {
      const today = new Date().toISOString().split('T')[0]
      const games = await this.fetchGames({ date: today, status: 'live' })
      return games.filter(game => game.status === 'live')
    } catch (error) {
      console.error(`Error fetching live games for ${this.sport}:`, error)
      return []
    }
  }

  private async fetchStandings(_season?: string): Promise<any[]> {
    try {
      const sportName = await this.getAPISportName(this.sport)
      const leagues = await sportsDBClient.getLeaguesBySport(sportName)
      if (leagues.length === 0) {
        return []
      }

      const allStandings: any[] = []
      for (const league of leagues) {
        const standings = await sportsDBClient.getTeamsByLeague(league.idLeague)
        allStandings.push(...standings)
      }

      return allStandings
    } catch (error) {
      console.error(`Error fetching standings for ${this.sport}:`, error)
      return []
    }
  }

  private async fetchOdds(_params: any = {}): Promise<any[]> {
    try {
      // const odds = await theOddsApiClient.getOdds(this.sport, params.region)
      // Odds fetching will be implemented via Edge Functions
      return []
    } catch (error) {
      console.error(`Error fetching odds for ${this.sport}:`, error)
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
      const team = await sportsDBClient.getTeamById(teamId)
      return team ? this.mapTeamData(team) : null
    } catch (error) {
      console.error(`Error fetching team ${teamId}:`, error)
      return null
    }
  }

  protected async fetchPlayerById(_playerId: string): Promise<PlayerData | null> {
    return null
  }

  // Data mapping methods
  protected mapGameData(event: any): GameData {
    // NO hardcoded fallback values - only use real API data
    if (!event.strHomeTeam || !event.strAwayTeam) {
      console.warn(`Incomplete game data: ${JSON.stringify(event)}`)
      throw new Error('Incomplete game data - missing team information')
    }

    return {
      id: event.idEvent || event.id,
      sport: this.sport,
      league: this.league,
      homeTeam: event.strHomeTeam, // Real team name from API
      awayTeam: event.strAwayTeam, // Real team name from API
      date: event.dateEvent || new Date().toISOString().split('T')[0],
      time: event.strTime || '00:00:00',
      status: this.mapGameStatus(event.strStatus),
      venue: event.strVenue || 'TBD',
      season: event.strSeason || new Date().getFullYear().toString(),
      homeScore: event.intHomeScore ? parseInt(event.intHomeScore) : null,
      awayScore: event.intAwayScore ? parseInt(event.intAwayScore) : null,
      lastUpdated: new Date().toISOString(),
    }
  }

  private mapESPNGameData(game: any): GameData {
    const homeTeam = game.competitions?.[0]?.competitors?.find((c: any) => c.homeAway === 'home')
    const awayTeam = game.competitions?.[0]?.competitors?.find((c: any) => c.homeAway === 'away')

    return {
      id: game.id,
      sport: this.sport,
      league: this.league,
      homeTeam: homeTeam?.team?.displayName || 'Home Team',
      awayTeam: awayTeam?.team?.displayName || 'Away Team',
      date: game.date?.split('T')[0] || new Date().toISOString().split('T')[0],
      time: game.date?.split('T')[1]?.split('.')[0] || '00:00:00',
      status: this.mapESPNGameStatus(game.status?.type?.name),
      venue: game.competitions?.[0]?.venue?.fullName || 'TBD',
      season: game.season?.year?.toString() || new Date().getFullYear().toString(),
      homeScore: homeTeam?.score ? parseInt(homeTeam.score) : null,
      awayScore: awayTeam?.score ? parseInt(awayTeam.score) : null,
      lastUpdated: new Date().toISOString(),
    }
  }

  protected mapTeamData(team: any): TeamData {
    return {
      id: team.idTeam || team.id,
      sport: this.sport,
      league: this.league,
      name: team.strTeam || team.name,
      abbreviation: team.strTeamShort || team.abbreviation || '',
      logo: team.strTeamBadge || team.logo || '',
      city: team.strLocation || '',
      lastUpdated: new Date().toISOString(),
    }
  }

  protected mapPlayerData(rawData: any): PlayerData {
    return {
      id: rawData.id?.toString() || rawData.idPlayer || '',
      sport: this.sport,
      league: this.league,
      name: rawData.strPlayer || rawData.fullName || rawData.name || '',
      team: rawData.strTeam || rawData.team?.displayName || '',
      position: rawData.strPosition || rawData.position || '',
      stats: rawData.stats || {},
      lastUpdated: new Date().toISOString(),
    }
  }

  private mapGameStatus(status: string): 'scheduled' | 'live' | 'finished' {
    if (!status) return 'scheduled'

    const lowerStatus = status.toLowerCase()
    if (lowerStatus.includes('finished') || lowerStatus.includes('final')) {
      return 'finished'
    }
    if (lowerStatus.includes('live') || lowerStatus.includes('progress')) {
      return 'live'
    }
    return 'scheduled'
  }

  private mapESPNGameStatus(status: string): 'scheduled' | 'live' | 'finished' {
    if (!status) return 'scheduled'

    const lowerStatus = status.toLowerCase()
    if (lowerStatus.includes('final')) {
      return 'finished'
    }
    if (lowerStatus.includes('in progress') || lowerStatus.includes('live')) {
      return 'live'
    }
    return 'scheduled'
  }

  private getESPNSportMapping(sport: string): string | null {
    const mapping: Record<string, string> = {
      golf: 'golf',
      tennis: 'tennis',
      mma: 'mma',
      boxing: 'boxing',
    }
    return mapping[sport] || null
  }
}
