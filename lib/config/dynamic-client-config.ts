/**
 * DYNAMIC CLIENT CONFIGURATION
 * Loads configuration from database instead of hardcoded values
 */

import { createClient } from '@supabase/supabase-js'

export interface DynamicCacheConfig {
  games: number
  teams: number
  players: number
  health: number
}

export interface DynamicUIConfig {
  refreshInterval: number
  debounceDelay: number
  animationDuration: number
}

export interface DynamicErrorConfig {
  maxRetries: number
  retryDelay: number
  timeout: number
}

export interface DynamicConfig {
  cache: DynamicCacheConfig
  ui: DynamicUIConfig
  error: DynamicErrorConfig
}

class DynamicClientConfigManager {
  private static instance: DynamicClientConfigManager
  private config: DynamicConfig | null = null
  private lastUpdated: Date | null = null
  private readonly CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

  public static getInstance(): DynamicClientConfigManager {
    if (!DynamicClientConfigManager.instance) {
      DynamicClientConfigManager.instance = new DynamicClientConfigManager()
    }
    return DynamicClientConfigManager.instance
  }

  private getSupabaseClient() {
    return createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
  }

  /**
   * Get dynamic configuration, loading from database if needed
   */
  async getConfig(): Promise<DynamicConfig> {
    const now = new Date()

    // Return cached config if still valid
    if (
      this.config &&
      this.lastUpdated &&
      now.getTime() - this.lastUpdated.getTime() < this.CACHE_DURATION
    ) {
      return this.config
    }

    try {
      // Load configuration from database
      const supabase = this.getSupabaseClient()
      const { data: sportsData, error: sportsError } = await supabase
        .from('sports')
        .select('name, refresh_intervals, rate_limits, update_frequency')
        .eq('is_active', true)
        .order('name')

      if (sportsError || !sportsData) {
        throw new Error('Failed to load sports configuration from database')
      }

      // Calculate dynamic intervals based on sports configuration
      const sports = sportsData as any[]
      const config = this.calculateDynamicConfig(sports)

      this.config = config
      this.lastUpdated = now

      return config
    } catch (error) {
      console.error('Failed to load dynamic configuration:', error)

      // Return fallback configuration if database fails
      return this.getFallbackConfig()
    }
  }

  /**
   * Calculate dynamic configuration based on sports data
   */
  private calculateDynamicConfig(sports: any[]): DynamicConfig {
    // Calculate average refresh intervals across all sports
    let totalGamesInterval = 0
    let totalTeamsInterval = 0
    let totalPlayersInterval = 0
    let sportCount = 0

    sports.forEach(sport => {
      const intervals = sport.refresh_intervals
      if (intervals) {
        totalGamesInterval += intervals.games || 120 // Default 2 minutes
        totalTeamsInterval += intervals.teams || 300 // Default 5 minutes
        totalPlayersInterval += intervals.players || 300 // Default 5 minutes
        sportCount++
      }
    })

    // Use averages or defaults
    const avgGamesInterval = sportCount > 0 ? totalGamesInterval / sportCount : 120
    const avgTeamsInterval = sportCount > 0 ? totalTeamsInterval / sportCount : 300
    const avgPlayersInterval = sportCount > 0 ? totalPlayersInterval / sportCount : 300

    return {
      cache: {
        games: avgGamesInterval * 1000, // Convert to milliseconds
        teams: avgTeamsInterval * 1000,
        players: avgPlayersInterval * 1000,
        health: 30 * 1000, // Always 30 seconds for health checks
      },
      ui: {
        refreshInterval: Math.min(avgGamesInterval * 1000, 30000), // Max 30 seconds
        debounceDelay: 300, // Static - UI behavior
        animationDuration: 200, // Static - UI behavior
      },
      error: {
        maxRetries: 3, // Static - error handling
        retryDelay: 1000, // Static - error handling
        timeout: 10000, // Static - error handling
      },
    }
  }

  /**
   * Get fallback configuration when database is unavailable
   */
  private getFallbackConfig(): DynamicConfig {
    return {
      cache: {
        games: 2 * 60 * 1000, // 2 minutes
        teams: 5 * 60 * 1000, // 5 minutes
        players: 5 * 60 * 1000, // 5 minutes
        health: 30 * 1000, // 30 seconds
      },
      ui: {
        refreshInterval: 30000, // 30 seconds
        debounceDelay: 300,
        animationDuration: 200,
      },
      error: {
        maxRetries: 3,
        retryDelay: 1000,
        timeout: 10000,
      },
    }
  }

  /**
   * Clear cached configuration to force reload
   */
  clearCache(): void {
    this.config = null
    this.lastUpdated = null
  }

  /**
   * Get sport-specific refresh interval
   */
  async getSportRefreshInterval(
    sport: string,
    dataType: 'games' | 'teams' | 'players'
  ): Promise<number> {
    try {
      const supabase = this.getSupabaseClient()
      const { data: sportData, error: sportError } = await supabase
        .from('sports')
        .select('refresh_intervals')
        .eq('name', sport)
        .eq('is_active', true)
        .limit(1)
        .maybeSingle()

      if (sportError || !sportData) {
        // Return default if not found
        const defaults = { games: 120, teams: 300, players: 300 }
        return defaults[dataType] * 1000
      }

      const intervals = sportData.refresh_intervals
      if (intervals && intervals[dataType]) {
        return intervals[dataType] * 1000 // Convert to milliseconds
      }

      // Return default if not found
      const defaults = { games: 120, teams: 300, players: 300 }
      return defaults[dataType] * 1000
    } catch (error) {
      console.error(`Failed to get sport refresh interval for ${sport}:`, error)
      const defaults = { games: 120, teams: 300, players: 300 }
      return defaults[dataType] * 1000
    }
  }
}

export const dynamicClientConfig = DynamicClientConfigManager.getInstance()
