/**
 * SERVER-SIDE SPORT CONFIGURATION
 * Loads sport configuration directly from database on server side
 */

import { createClient } from '@supabase/supabase-js'
import { SportConfig } from './sport-config'

export class ServerSportConfigManager {
  private static configs: Record<string, SportConfig> = {}
  private static initialized = false

  /**
   * Initialize sport configurations from database on server side
   */
  static async initialize(): Promise<void> {
    if (this.initialized) return

    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )

      const { data: sportsData, error: sportsError } = await supabase
        .from('sports')
        .select('name, display_name, icon, color, is_active, data_source, api_key, player_stats_table, positions, scoring_fields, betting_markets, season_config, rate_limits, update_frequency')
        .eq('is_active', true)
        .order('name')

      if (sportsError) {
        throw new Error(`Failed to fetch sports: ${sportsError.message}`)
      }

      const result = { success: true, data: sportsData || [] }

      const sports = result.data

      if (sports && sports.length > 0) {
        for (const sport of sports) {
          this.configs[sport.name] = {
            name: sport.name,
            displayName: sport.display_name || sport.name,
            icon: sport.icon || '🏆',
            color: sport.color || '#666666',
            isActive: !!sport.is_active,
            dataSource: sport.data_source || 'sportsdb',
            apiKey: sport.api_key || undefined,
            playerStatsTable: sport.player_stats_table || undefined,
            leagues: [],
            positions: Array.isArray(sport.positions) ? sport.positions : [],
            scoringFields: Array.isArray(sport.scoring_fields) ? sport.scoring_fields : [],
            bettingMarkets: Array.isArray(sport.betting_markets) ? sport.betting_markets : [],
            seasonConfig: sport.season_config || { startMonth: 1, endMonth: 12, currentSeason: '' },
            rateLimits: sport.rate_limits || { requests: 30, interval: '1m' },
            updateFrequency: String(sport.update_frequency ?? '30m'),
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
