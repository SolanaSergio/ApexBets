/**
 * Generic Sport Service
 * Provides a fallback service for sports that don't have dedicated implementations
 */

import { SportSpecificService, ServiceConfig } from '../../core/sport-specific-service'
import { GameData, TeamData, PlayerData } from '../../../types/sports'
import { sportsDBClient } from '../../../sports-apis/sportsdb-client'
import { espnClient } from '../../../sports-apis/espn-client'

export class GenericSportService extends SportSpecificService {
  private sportMapping: Record<string, string> = {
    'golf': 'Golf',
    'tennis': 'Tennis',
    'mma': 'Fighting',
    'boxing': 'Fighting',
    'cricket': 'Cricket',
    'rugby': 'Rugby',
    'volleyball': 'Volleyball',
    'motorsport': 'Motorsport',
    'cycling': 'Cycling',
    'swimming': 'Swimming',
    'athletics': 'Athletics'
  }

  constructor(sport: string, league: string = 'General') {
    const config: ServiceConfig = {
      name: sport,
      cacheTTL: 10 * 60 * 1000, // 10 minutes for generic sports
      rateLimitService: 'sportsdb',
      retryAttempts: 2,
      retryDelay: 2000
    }
    super(sport, league, config)
  }

  async getGames(params: {
    date?: string
    status?: 'scheduled' | 'live' | 'finished'
    teamId?: string
  } = {}): Promise<GameData[]> {
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
      const sportName = this.sportMapping[this.sport] || this.sport
      const date = params.date || new Date().toISOString().split('T')[0]
      
      // Try SportsDB first
      try {
        const events = await sportsDBClient.getEventsByDate(sportName, date)
        return events.map(event => this.mapGameData(event))
      } catch (sportsDbError) {
        console.warn(`SportsDB failed for ${this.sport}:`, sportsDbError)
        
        // Fallback to ESPN if available
        try {
          const espnSport = this.getESPNSportMapping(this.sport)
          if (espnSport) {
            const games = await espnClient.getGames(espnSport)
            return games.map(game => this.mapESPNGameData(game))
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

  private async fetchTeams(params: any): Promise<TeamData[]> {
    try {
      const sportName = this.sportMapping[this.sport] || this.sport
      const teams = await sportsDBClient.getTeamsBySport(sportName)
      return teams.map(team => this.mapTeamData(team))
    } catch (error) {
      console.error(`Error fetching teams for ${this.sport}:`, error)
      return []
    }
  }

  private async fetchPlayers(params: any): Promise<PlayerData[]> {
    try {
      // Generic sports may not have detailed player data
      // Return empty array or basic placeholder data
      return []
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

  private async fetchStandings(season?: string): Promise<any[]> {
    try {
      // Generic sports may not have standings
      return []
    } catch (error) {
      console.error(`Error fetching standings for ${this.sport}:`, error)
      return []
    }
  }

  private async fetchOdds(params: any): Promise<any[]> {
    try {
      // Generic sports may not have odds data readily available
      console.warn(`Odds not available for ${this.sport}`)
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

  // Data mapping methods
  private mapGameData(event: any): GameData {
    return {
      id: event.idEvent || event.id,
      homeTeam: {
        id: event.idHomeTeam || 'unknown',
        name: event.strHomeTeam || 'Home Team',
        abbreviation: event.strHomeTeamShort || 'HOME',
        logo: event.strHomeTeamBadge || '',
        score: parseInt(event.intHomeScore) || 0
      },
      awayTeam: {
        id: event.idAwayTeam || 'unknown',
        name: event.strAwayTeam || 'Away Team',
        abbreviation: event.strAwayTeamShort || 'AWAY',
        logo: event.strAwayTeamBadge || '',
        score: parseInt(event.intAwayScore) || 0
      },
      date: event.dateEvent || new Date().toISOString().split('T')[0],
      time: event.strTime || '00:00:00',
      status: this.mapGameStatus(event.strStatus),
      venue: event.strVenue || 'TBD',
      league: this.league,
      sport: this.sport,
      season: event.strSeason || new Date().getFullYear().toString(),
      week: event.intRound || 1,
      period: event.strProgress || '',
      clock: event.strProgress || '',
      lastUpdated: new Date().toISOString()
    }
  }

  private mapESPNGameData(game: any): GameData {
    const homeTeam = game.competitions?.[0]?.competitors?.find((c: any) => c.homeAway === 'home')
    const awayTeam = game.competitions?.[0]?.competitors?.find((c: any) => c.homeAway === 'away')

    return {
      id: game.id,
      homeTeam: {
        id: homeTeam?.team?.id || 'unknown',
        name: homeTeam?.team?.displayName || 'Home Team',
        abbreviation: homeTeam?.team?.abbreviation || 'HOME',
        logo: homeTeam?.team?.logo || '',
        score: parseInt(homeTeam?.score) || 0
      },
      awayTeam: {
        id: awayTeam?.team?.id || 'unknown',
        name: awayTeam?.team?.displayName || 'Away Team',
        abbreviation: awayTeam?.team?.abbreviation || 'AWAY',
        logo: awayTeam?.team?.logo || '',
        score: parseInt(awayTeam?.score) || 0
      },
      date: game.date?.split('T')[0] || new Date().toISOString().split('T')[0],
      time: game.date?.split('T')[1]?.split('.')[0] || '00:00:00',
      status: this.mapESPNGameStatus(game.status?.type?.name),
      venue: game.competitions?.[0]?.venue?.fullName || 'TBD',
      league: this.league,
      sport: this.sport,
      season: game.season?.year?.toString() || new Date().getFullYear().toString(),
      week: game.week?.number || 1,
      period: game.status?.period?.toString() || '',
      clock: game.status?.displayClock || '',
      lastUpdated: new Date().toISOString()
    }
  }

  private mapTeamData(team: any): TeamData {
    return {
      id: team.idTeam || team.id,
      name: team.strTeam || team.name,
      abbreviation: team.strTeamShort || team.abbreviation || '',
      logo: team.strTeamBadge || team.logo || '',
      city: team.strLocation || '',
      conference: team.strLeague || '',
      division: team.strDivision || '',
      founded: team.intFormedYear || null,
      colors: {
        primary: team.strColour1 || '#000000',
        secondary: team.strColour2 || '#FFFFFF'
      }
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
      'golf': 'golf',
      'tennis': 'tennis',
      'mma': 'mma',
      'boxing': 'boxing'
    }
    return mapping[sport] || null
  }
}
