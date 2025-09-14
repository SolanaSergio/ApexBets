/**
 * SERVER-SIDE SPORT CONFIGURATION
 * Loads sport configuration directly from database on server side
 */

import { createClient } from "@/lib/supabase/server"
import { SportConfig } from "./sport-config"

export class ServerSportConfigManager {
  private static configs: Record<string, SportConfig> = {}
  private static initialized = false

  /**
   * Initialize sport configurations from database on server side
   */
  static async initialize(): Promise<void> {
    if (this.initialized) return

    try {
      const supabase = await createClient()
      
      if (!supabase) {
        throw new Error('Supabase client not available')
      }

      const { data: sports, error } = await supabase
        .from("sports")
        .select(`
          name,
          display_name,
          icon,
          color,
          is_active,
          data_source,
          api_key,
          player_stats_table,
          positions,
          scoring_fields,
          betting_markets,
          season_config,
          rate_limits,
          update_frequency
        `)
        .eq("is_active", true)
        .order("name")

      if (error) {
        throw new Error(`Failed to fetch sports: ${error.message}`)
      }

      if (sports && sports.length > 0) {
        for (const sport of sports) {
          this.configs[sport.name] = {
            name: sport.display_name || sport.name,
            leagues: [], // Will be loaded separately
            defaultLeague: '', // Will be set from leagues
            icon: sport.icon || '🏆',
            color: sport.color || 'text-gray-500',
            apiKey: sport.api_key || '',
            dataSource: sport.data_source || 'sportsdb',
            positions: sport.positions || [],
            scoringFields: sport.scoring_fields || {},
            bettingMarkets: sport.betting_markets || [],
            seasonConfig: sport.season_config || {},
            rateLimits: sport.rate_limits || {
              requestsPerMinute: 30,
              requestsPerHour: 500,
              requestsPerDay: 5000,
              burstLimit: 5
            },
            updateFrequency: sport.update_frequency || 30
          }
        }
      } else {
        // Fallback to empty config if no database data
        this.configs = {}
      }
      
      this.initialized = true
    } catch (error) {
      console.error('Failed to initialize server sport configurations:', error)
      // Fallback to empty config
      this.configs = {}
      this.initialized = true
    }
  }

  static getSportConfig(sport: string): SportConfig | null {
    return this.configs[sport] || null
  }

  static getSupportedSports(): string[] {
    return Object.keys(this.configs)
  }

  static isInitialized(): boolean {
    return this.initialized
  }
}
