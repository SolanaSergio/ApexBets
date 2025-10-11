/**
 * Dynamic Sports Manager Service
 * Manages sports configuration dynamically without hardcoding
 */

import { structuredLogger } from './structured-logger'
import { createClient } from '@supabase/supabase-js'

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
  abbreviation?: string
  level?: number
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
        sports: Array.from(this.sportsConfig.keys()),
      })
    } catch (error) {
      structuredLogger.error('Failed to initialize dynamic sports manager', {
        error: error instanceof Error ? error.message : String(error),
      })
      throw error
    }
  }

  private getSupabaseClient() {
    return createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
  }

  private async loadSportsConfiguration(): Promise<void> {
    try {
      // Load sports from database
      const supabase = this.getSupabaseClient()
      const { data: sportsData, error: sportsError } = await supabase
        .from('sports')
        .select('*')
        .eq('is_active', true)
        .order('display_name')

      if (sportsError) {
        throw new Error(`Failed to load sports: ${sportsError.message}`)
      }

      if (!sportsData) {
        throw new Error('No sports data returned from database')
      }

      // Load leagues for each sport
      for (const sportData of sportsData) {
        const { data: leagues, error: leaguesError } = await supabase
          .from('leagues')
          .select('*')
          .eq('sport', sportData.name)
          .eq('is_active', true)
          .order('display_name')

        if (leaguesError) {
          structuredLogger.warn('Failed to load leagues for sport', {
            sport: sportData.name,
            error: leaguesError.message,
          })
          continue
        }

        const leaguesConfig: LeagueConfiguration[] = leagues || []

        const sportConfig: SportConfiguration = {
          id: sportData.id,
          name: sportData.name,
          displayName: sportData.display_name,
          isActive: sportData.is_active,
          leagues: leaguesConfig,
          dataTypes: sportData.data_types || ['games', 'teams', 'players', 'standings'],
          refreshIntervals: sportData.refresh_intervals || {
            games: 15,
            teams: 30,
            players: 60,
            standings: 60,
            odds: 2,
            predictions: 10,
          },
          apiProviders: sportData.api_providers || ['api-sports', 'thesportsdb', 'espn'],
          defaultLeague: sportData.season_config?.defaultLeague || null,
          seasonFormat: sportData.season_config?.seasonFormat || 'year',
          currentSeason: sportData.current_season,
        }

        this.sportsConfig.set(sportData.name, sportConfig)
      }

      this.lastRefresh = Date.now()
    } catch (error) {
      structuredLogger.error('Failed to load sports configuration', {
        error: error instanceof Error ? error.message : String(error),
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
        lastRefresh: new Date(this.lastRefresh).toISOString(),
      })
    } catch (error) {
      structuredLogger.error('Failed to refresh sports configuration', {
        error: error instanceof Error ? error.message : String(error),
      })
    }
  }

  getSupportedSports(): string[] {
    return Array.from(this.sportsConfig.keys()).filter(
      sport => this.sportsConfig.get(sport)?.isActive
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
      const supabase = this.getSupabaseClient()
      const { data, error } = await supabase
        .from('sports')
        .insert({
          name: sportConfig.name,
          display_name: sportConfig.displayName,
          is_active: sportConfig.isActive,
          data_types: sportConfig.dataTypes,
          refresh_intervals: sportConfig.refreshIntervals,
          api_providers: sportConfig.apiProviders,
          default_league: sportConfig.defaultLeague,
          season_format: sportConfig.seasonFormat,
          current_season: sportConfig.currentSeason,
        })
        .select('id')
        .single()

      if (error) {
        throw new Error(`Failed to add sport: ${error.message}`)
      }

      const sportId = data.id

      // Add leagues
      for (const league of sportConfig.leagues) {
        const { error: leagueError } = await supabase
          .from('leagues')
          .insert({
            name: league.name,
            display_name: league.displayName,
            sport: sportConfig.name,
            is_active: league.isActive,
            country: league.country,
            season: league.season,
            api_mapping: league.apiMapping,
          })

        if (leagueError) {
          throw new Error(`Failed to add league ${league.name}: ${leagueError.message}`)
        }
      }

      // Refresh configuration
      await this.refreshConfiguration()

      structuredLogger.info('Sport added successfully', {
        sport: sportConfig.name,
        sportId,
        leaguesCount: sportConfig.leagues.length,
      })
    } catch (error) {
      structuredLogger.error('Failed to add sport', {
        sport: sportConfig.name,
        error: error instanceof Error ? error.message : String(error),
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

      const supabase = this.getSupabaseClient()
      const { error } = await supabase
        .from('sports')
        .update({
          display_name: updatedConfig.displayName,
          is_active: updatedConfig.isActive,
          data_types: updatedConfig.dataTypes,
          refresh_intervals: updatedConfig.refreshIntervals,
          api_providers: updatedConfig.apiProviders,
          default_league: updatedConfig.defaultLeague,
          season_format: updatedConfig.seasonFormat,
          current_season: updatedConfig.currentSeason,
        })
        .eq('name', sport)

      if (error) {
        throw new Error(`Failed to update sport: ${error.message}`)
      }

      // Refresh configuration
      await this.refreshConfiguration()

      structuredLogger.info('Sport updated successfully', {
        sport,
        updates: Object.keys(updates),
      })
    } catch (error) {
      structuredLogger.error('Failed to update sport', {
        sport,
        error: error instanceof Error ? error.message : String(error),
      })
      throw error
    }
  }

  async removeSport(sport: string): Promise<void> {
    try {
      // Deactivate sport instead of deleting
      const supabase = this.getSupabaseClient()
      
      const { error: sportError } = await supabase
        .from('sports')
        .update({ is_active: false })
        .eq('name', sport)

      if (sportError) {
        throw new Error(`Failed to deactivate sport: ${sportError.message}`)
      }

      const { error: leagueError } = await supabase
        .from('leagues')
        .update({ is_active: false })
        .eq('sport', sport)

      if (leagueError) {
        throw new Error(`Failed to deactivate leagues: ${leagueError.message}`)
      }

      // Refresh configuration
      await this.refreshConfiguration()

      structuredLogger.info('Sport deactivated successfully', { sport })
    } catch (error) {
      structuredLogger.error('Failed to remove sport', {
        sport,
        error: error instanceof Error ? error.message : String(error),
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
      sports: {} as Record<string, any>,
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
        apiProviders: config.apiProviders,
      }
    }

    return stats
  }
}

export const dynamicSportsManager = DynamicSportsManager.getInstance()
