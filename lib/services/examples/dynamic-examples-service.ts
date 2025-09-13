/**
 * DYNAMIC EXAMPLES SERVICE
 * Provides real data for example components across all sports
 * NO MOCK DATA - Everything is fully dynamic
 */

import { serviceFactory, SupportedSport } from '../core/service-factory'
import { CachedUnifiedApiClient } from '../api/cached-unified-api-client'
import { SportConfigManager } from '../core/sport-config'

export interface ExampleTeam {
  id: string
  name: string
  abbreviation: string
  league: string
  sport: string
  logoUrl?: string
}

export interface ExamplePlayer {
  id: string
  name: string
  position?: string
  team?: string
  league: string
  sport: string
  photoUrl?: string
}

export interface ExampleGame {
  id: string
  homeTeam: string
  awayTeam: string
  date: string
  status: string
  league: string
  sport: string
}

export class DynamicExamplesService {
  private cachedUnifiedApiClient: CachedUnifiedApiClient

  constructor() {
    this.cachedUnifiedApiClient = new CachedUnifiedApiClient()
  }

  /**
   * Get example teams for a specific sport
   */
  async getExampleTeams(sport: SupportedSport, limit: number = 6): Promise<ExampleTeam[]> {
    try {
      const teams = await this.cachedUnifiedApiClient.getTeams(sport, { limit })
      const defaultLeague = await serviceFactory.getDefaultLeague(sport)
      
      return teams.map(team => ({
        id: team.id,
        name: team.name,
        abbreviation: team.abbreviation || team.name.substring(0, 3).toUpperCase(),
        league: team.league || defaultLeague,
        sport: sport,
        logoUrl: team.logoUrl || ''
      }))
    } catch (error) {
      console.error(`Error fetching example teams for ${sport}:`, error)
      return []
    }
  }

  /**
   * Get example players for a specific sport
   */
  async getExamplePlayers(sport: SupportedSport, limit: number = 4): Promise<ExamplePlayer[]> {
    try {
      const players = await this.cachedUnifiedApiClient.getPlayers(sport, { limit })
      const defaultLeague = await serviceFactory.getDefaultLeague(sport)
      
      return players.map(player => ({
        id: player.id,
        name: player.name,
        position: player.position || '',
        team: player.teamName || '',
        league: defaultLeague,
        sport: sport,
        photoUrl: player.headshotUrl || ''
      }))
    } catch (error) {
      console.error(`Error fetching example players for ${sport}:`, error)
      return []
    }
  }

  /**
   * Get example games for a specific sport
   */
  async getExampleGames(sport: SupportedSport, limit: number = 6): Promise<ExampleGame[]> {
    try {
      const games = await this.cachedUnifiedApiClient.getGames(sport, { limit })
      const defaultLeague = await serviceFactory.getDefaultLeague(sport)
      
      return games.map(game => ({
        id: game.id,
        homeTeam: game.homeTeam,
        awayTeam: game.awayTeam,
        date: game.date,
        status: game.status,
        league: game.league || defaultLeague,
        sport: sport
      }))
    } catch (error) {
      console.error(`Error fetching example games for ${sport}:`, error)
      return []
    }
  }

  /**
   * Get all supported sports for examples
   */
  async getSupportedSports(): Promise<SupportedSport[]> {
    return await serviceFactory.getSupportedSports()
  }

  /**
   * Get sport configuration for examples
   */
  async getSportConfig(sport: SupportedSport) {
    return {
      name: sport.charAt(0).toUpperCase() + sport.slice(1),
      league: serviceFactory.getDefaultLeague(sport),
      positions: await this.getPositionsForSport(sport)
    }
  }

  /**
   * Get positions for a specific sport from database configuration
   */
  private async getPositionsForSport(sport: SupportedSport): Promise<string[]> {
    try {
      const config = await SportConfigManager.getSportConfigAsync(sport)
      return config?.positions || []
    } catch (error) {
      console.error('Error getting positions for sport:', sport, error)
      return []
    }
  }

  /**
   * Get random example data for demonstration purposes
   */
  async getRandomExamples(sport: SupportedSport) {
    const [teams, players, games] = await Promise.all([
      this.getExampleTeams(sport, 3),
      this.getExamplePlayers(sport, 2),
      this.getExampleGames(sport, 2)
    ])

    return {
      teams: teams.slice(0, 3),
      players: players.slice(0, 2),
      games: games.slice(0, 2),
      sport: this.getSportConfig(sport)
    }
  }
}

// Export singleton instance
export const dynamicExamplesService = new DynamicExamplesService()
