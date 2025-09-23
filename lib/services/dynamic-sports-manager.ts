/**
 * Dynamic Sports Manager Service
 * Manages sports configuration dynamically without hardcoding
 */

import { structuredLogger } from './structured-logger'
import { productionSupabaseClient } from '../supabase/production-client'

export interface SportConfiguration {
  id: string
  name: string
  displayName: string
  isActive: boolean
  leagues: LeagueConfiguration[]
  dataTypes: string[]
  refreshIntervals: Record<string, number> // in minutes
  apiProviders: string[]
  defaultLeague?: string
  seasonFormat: 'year' | 'year-range' | 'custom'
  currentSeason?: string
}

export interface LeagueConfiguration {
  id: string
  name: string
  displayName: string
  sport: string
  isActive: boolean
  country?: string
  season?: string
  apiMapping: Record<string, string> // Maps to different API identifiers
}

export class DynamicSportsManager {
  private static instance: DynamicSportsManager
  private sportsConfig: Map<string, SportConfiguration> = new Map()
  private lastRefresh: number = 0
  private refreshInterval: number = 30 * 60 * 1000 // 30 minutes

  private constructor() {}

  static getInstance(): DynamicSportsManager {
    if (!DynamicSportsManager.instance) {
      DynamicSportsManager.instance = new DynamicSportsManager()
    }
    return DynamicSportsManager.instance
  }

  async initialize(): Promise<void> {
    try {
      await this.loadSportsConfiguration()
      structuredLogger.info('Dynamic sports manager initialized', {
        sportsCount: this.sportsConfig.size,
        sports: Array.from(this.sportsConfig.keys())
      })
    } catch (error) {
      structuredLogger.error('Failed to initialize dynamic sports manager', {
        error: error instanceof Error ? error.message : String(error)
      })
      throw error
    }
  }

  private async loadSportsConfiguration(): Promise<void> {
    try {
      // Load sports from database
      const sportsResult = await productionSupabaseClient.executeSQL(`
        SELECT 
          s.id,
          s.name,
          s.display_name,
          s.is_active,
          s.data_types,
          s.refresh_intervals,
          s.api_providers,
          s.default_league,
          s.season_format,
          s.current_season
        FROM sports s
        WHERE s.is_active = true
        ORDER BY s.display_name
      `)

      if (!sportsResult.success || !sportsResult.data) {
        throw new Error('Failed to load sports configuration from database')
      }

      // Load leagues for each sport
      for (const sportData of sportsResult.data) {
        const leaguesResult = await productionSupabaseClient.executeSQL(`
          SELECT 
            l.id,
            l.name,
            l.display_name,
            l.sport,
            l.is_active,
            l.country,
            l.season,
            l.api_mapping
          FROM leagues l
          WHERE l.sport = $1 AND l.is_active = true
          ORDER BY l.display_name
        `, [sportData.name])

        const leagues: LeagueConfiguration[] = leaguesResult.success && leaguesResult.data 
          ? leaguesResult.data.map((league: any) => ({
              id: league.id,
              name: league.name,
              displayName: league.display_name,
              sport: league.sport,
              isActive: league.is_active,
              country: league.country,
              season: league.season,
              apiMapping: league.api_mapping || {}
            }))
          : []

        const sportConfig: SportConfiguration = {
          id: sportData.id,
          name: sportData.name,
          displayName: sportData.display_name,
          isActive: sportData.is_active,
          leagues,
          dataTypes: sportData.data_types || ['games', 'teams', 'players', 'standings'],
          refreshIntervals: sportData.refresh_intervals || {
            games: 15,
            teams: 30,
            players: 60,
            standings: 60,
            odds: 2,
            predictions: 10
          },
          apiProviders: sportData.api_providers || ['api-sports', 'thesportsdb', 'espn'],
          defaultLeague: sportData.default_league,
          seasonFormat: sportData.season_format || 'year',
          currentSeason: sportData.current_season
        }

        this.sportsConfig.set(sportData.name, sportConfig)
      }

      this.lastRefresh = Date.now()
    } catch (error) {
      structuredLogger.error('Failed to load sports configuration', {
        error: error instanceof Error ? error.message : String(error)
      })
      throw error
    }
  }

  async refreshConfiguration(): Promise<void> {
    const now = Date.now()
    if (now - this.lastRefresh < this.refreshInterval) {
      return // Too soon to refresh
    }

    try {
      await this.loadSportsConfiguration()
      structuredLogger.info('Sports configuration refreshed', {
        sportsCount: this.sportsConfig.size,
        lastRefresh: new Date(this.lastRefresh).toISOString()
      })
    } catch (error) {
      structuredLogger.error('Failed to refresh sports configuration', {
        error: error instanceof Error ? error.message : String(error)
      })
    }
  }

  getSupportedSports(): string[] {
    return Array.from(this.sportsConfig.keys()).filter(sport => 
      this.sportsConfig.get(sport)?.isActive
    )
  }

  getSportConfiguration(sport: string): SportConfiguration | undefined {
    return this.sportsConfig.get(sport)
  }

  getAllSportConfigurations(): Map<string, SportConfiguration> {
    return new Map(this.sportsConfig)
  }

  getLeaguesForSport(sport: string): LeagueConfiguration[] {
    const config = this.sportsConfig.get(sport)
    return config?.leagues.filter(league => league.isActive) || []
  }

  getDefaultLeagueForSport(sport: string): string | undefined {
    const config = this.sportsConfig.get(sport)
    return config?.defaultLeague
  }

  getDataTypesForSport(sport: string): string[] {
    const config = this.sportsConfig.get(sport)
    return config?.dataTypes || []
  }

  getRefreshInterval(sport: string, dataType: string): number {
    const config = this.sportsConfig.get(sport)
    return config?.refreshIntervals[dataType] || 30 // Default 30 minutes
  }

  getApiProvidersForSport(sport: string): string[] {
    const config = this.sportsConfig.get(sport)
    return config?.apiProviders || []
  }

  getCurrentSeason(sport: string): string | undefined {
    const config = this.sportsConfig.get(sport)
    return config?.currentSeason
  }

  getSeasonFormat(sport: string): 'year' | 'year-range' | 'custom' {
    const config = this.sportsConfig.get(sport)
    return config?.seasonFormat || 'year'
  }

  getApiMapping(sport: string, league: string, provider: string): string | undefined {
    const config = this.sportsConfig.get(sport)
    const leagueConfig = config?.leagues.find(l => l.name === league)
    return leagueConfig?.apiMapping[provider]
  }

  isSportSupported(sport: string): boolean {
    const config = this.sportsConfig.get(sport)
    return config?.isActive || false
  }

  isLeagueSupported(sport: string, league: string): boolean {
    const config = this.sportsConfig.get(sport)
    return config?.leagues.some(l => l.name === league && l.isActive) || false
  }

  async addSport(sportConfig: Omit<SportConfiguration, 'id'>): Promise<void> {
    try {
      // Add sport to database
      const result = await productionSupabaseClient.executeSQL(`
        INSERT INTO sports (name, display_name, is_active, data_types, refresh_intervals, api_providers, default_league, season_format, current_season)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING id
      `, [
        sportConfig.name,
        sportConfig.displayName,
        sportConfig.isActive,
        JSON.stringify(sportConfig.dataTypes),
        JSON.stringify(sportConfig.refreshIntervals),
        JSON.stringify(sportConfig.apiProviders),
        sportConfig.defaultLeague,
        sportConfig.seasonFormat,
        sportConfig.currentSeason
      ])

      if (!result.success || !result.data || result.data.length === 0) {
        throw new Error('Failed to add sport to database')
      }

      const sportId = result.data[0].id

      // Add leagues
      for (const league of sportConfig.leagues) {
        await productionSupabaseClient.executeSQL(`
          INSERT INTO leagues (name, display_name, sport, is_active, country, season, api_mapping)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
        `, [
          league.name,
          league.displayName,
          sportConfig.name,
          league.isActive,
          league.country,
          league.season,
          JSON.stringify(league.apiMapping)
        ])
      }

      // Refresh configuration
      await this.refreshConfiguration()

      structuredLogger.info('Sport added successfully', {
        sport: sportConfig.name,
        sportId,
        leaguesCount: sportConfig.leagues.length
      })
    } catch (error) {
      structuredLogger.error('Failed to add sport', {
        sport: sportConfig.name,
        error: error instanceof Error ? error.message : String(error)
      })
      throw error
    }
  }

  async updateSport(sport: string, updates: Partial<SportConfiguration>): Promise<void> {
    try {
      const config = this.sportsConfig.get(sport)
      if (!config) {
        throw new Error(`Sport ${sport} not found`)
      }

      const updatedConfig = { ...config, ...updates }

      await productionSupabaseClient.executeSQL(`
        UPDATE sports 
        SET display_name = $1, is_active = $2, data_types = $3, refresh_intervals = $4, 
            api_providers = $5, default_league = $6, season_format = $7, current_season = $8
        WHERE name = $9
      `, [
        updatedConfig.displayName,
        updatedConfig.isActive,
        JSON.stringify(updatedConfig.dataTypes),
        JSON.stringify(updatedConfig.refreshIntervals),
        JSON.stringify(updatedConfig.apiProviders),
        updatedConfig.defaultLeague,
        updatedConfig.seasonFormat,
        updatedConfig.currentSeason,
        sport
      ])

      // Refresh configuration
      await this.refreshConfiguration()

      structuredLogger.info('Sport updated successfully', {
        sport,
        updates: Object.keys(updates)
      })
    } catch (error) {
      structuredLogger.error('Failed to update sport', {
        sport,
        error: error instanceof Error ? error.message : String(error)
      })
      throw error
    }
  }

  async removeSport(sport: string): Promise<void> {
    try {
      // Deactivate sport instead of deleting
      await productionSupabaseClient.executeSQL(`
        UPDATE sports SET is_active = false WHERE name = $1
      `, [sport])

      await productionSupabaseClient.executeSQL(`
        UPDATE leagues SET is_active = false WHERE sport = $1
      `, [sport])

      // Refresh configuration
      await this.refreshConfiguration()

      structuredLogger.info('Sport deactivated successfully', { sport })
    } catch (error) {
      structuredLogger.error('Failed to remove sport', {
        sport,
        error: error instanceof Error ? error.message : String(error)
      })
      throw error
    }
  }

  getConfigurationStats(): Record<string, any> {
    const stats = {
      totalSports: this.sportsConfig.size,
      activeSports: 0,
      totalLeagues: 0,
      lastRefresh: new Date(this.lastRefresh).toISOString(),
      sports: {} as Record<string, any>
    }

    for (const [sport, config] of this.sportsConfig.entries()) {
      if (config.isActive) {
        stats.activeSports++
      }
      stats.totalLeagues += config.leagues.length
      stats.sports[sport] = {
        displayName: config.displayName,
        isActive: config.isActive,
        leaguesCount: config.leagues.length,
        dataTypes: config.dataTypes,
        apiProviders: config.apiProviders
      }
    }

    return stats
  }
}

export const dynamicSportsManager = DynamicSportsManager.getInstance()
