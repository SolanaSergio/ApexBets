/**
 * DYNAMIC SPORT CONFIGURATION SERVICE
 * Replaces all hardcoded sport-specific logic with dynamic database-driven configuration
 * Handles any sport without hardcoding team names, dates, or leagues
 */

export interface DynamicSportConfig {
  id: string
  name: string
  displayName: string
  icon: string
  color: string
  isActive: boolean
  dataSource: string
  apiKey?: string
  playerStatsTable: string
  positions: string[]
  scoringFields: {
    primary: string
    for: string
    against: string
  }
  bettingMarkets: {
    id: string
    name: string
    description: string
  }[]
  seasonConfig: {
    startMonth: number
    endMonth: number
    seasonYearOffset?: number
  }
  updateFrequency: number
}

export interface SportStatsColumns {
  tableName: string
  columns: string
  primaryStat: string
  statFields: Record<string, string>
}

export class DynamicSportConfigService {
  private static configs: Map<string, DynamicSportConfig> = new Map()
  private static initialized = false
  private static projectId: string | null = null

  /**
   * Initialize the service with Supabase project ID
   */
  static async initialize(projectId: string): Promise<void> {
    if (this.initialized && this.projectId === projectId) return
    
    this.projectId = projectId
    await this.loadConfigurations()
    this.initialized = true
  }

  /**
   * Load all sport configurations from database
   */
  private static async loadConfigurations(): Promise<void> {
    if (!this.projectId) {
      throw new Error('Project ID not set. Call initialize() first.')
    }

    try {
      // Load from database; no hardcoded defaults
      this.configs.clear()

      const { productionSupabaseClient } = await import('../../supabase/production-client')
      const sql = `
        SELECT id,
               name,
               display_name,
               icon_url,
               color_primary,
               color_secondary,
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
        FROM sports
        WHERE is_active = true
        ORDER BY display_name
      `
      const rows = await productionSupabaseClient.executeSQL(sql)

      for (const row of rows.success ? rows.data : []) {
        const cfg: DynamicSportConfig = {
          id: row.id,
          name: row.name,
          displayName: row.display_name,
          icon: row.icon_url,
          color: row.color_primary,
          isActive: row.is_active,
          dataSource: row.data_source,
          apiKey: row.api_key || undefined,
          playerStatsTable: row.player_stats_table,
          positions: Array.isArray(row.positions) ? row.positions : [],
          scoringFields: row.scoring_fields,
          bettingMarkets: Array.isArray(row.betting_markets) ? row.betting_markets : [],
          seasonConfig: row.season_config,
          updateFrequency: typeof row.update_frequency === 'number' ? row.update_frequency : 30
        }
        this.configs.set(cfg.name, cfg)
      }
    } catch (error) {
      console.error('Failed to load sport configurations:', error)
      throw error
    }
  }

  /**
   * Get sport configuration by name
   */
  static getSportConfig(sport: string): DynamicSportConfig | null {
    if (!this.initialized) {
      throw new Error('Service not initialized. Call initialize() first.')
    }
    return this.configs.get(sport) || null
  }

  /**
   * Get all active sports
   */
  static getAllSports(): string[] {
    if (!this.initialized) {
      throw new Error('Service not initialized. Call initialize() first.')
    }
    return Array.from(this.configs.keys())
  }

  /**
   * Get sport configuration for stats columns
   */
  static getSportStatsColumns(sport: string): SportStatsColumns {
    const config = this.getSportConfig(sport)
    if (!config) {
      throw new Error(`Sport '${sport}' not found or not active`)
    }

    // Get dynamic column configuration based on sport
    const statFields = this.getStatFieldsForSport(sport)
    const columns = this.buildColumnsString(statFields)
    
    // Safely access scoringFields with fallback
    const scoringFields = config.scoringFields || { primary: 'points', for: 'points_for', against: 'points_against' }
    const primaryStat = scoringFields.primary || 'points'

    return {
      tableName: config.playerStatsTable,
      columns,
      primaryStat,
      statFields
    }
  }

  /**
   * Get stat fields configuration for a sport
   */
  private static getStatFieldsForSport(sport: string): Record<string, string> {
    const config = this.getSportConfig(sport)
    if (!config) {
      return {}
    }
    
    // Use dynamic stat fields from configuration with fallback
    const scoringFields = config.scoringFields || { primary: 'points', for: 'points_for', against: 'points_against' }
    return {
      [scoringFields.primary]: scoringFields.primary,
      [scoringFields.for]: scoringFields.for,
      [scoringFields.against]: scoringFields.against
    }
  }

  /**
   * Build columns string for SQL query
   */
  private static buildColumnsString(statFields: Record<string, string>): string {
    const baseColumns = ['player_name', 'position', 'created_at']
    const statColumns = Object.values(statFields)
    return [...baseColumns, ...statColumns].join(',\n      ')
  }

  /**
   * Get positions for a sport
   */
  static getPositionsForSport(sport: string): string[] {
    const config = this.getSportConfig(sport)
    return config?.positions || []
  }

  /**
   * Get betting markets for a sport
   */
  static getBettingMarkets(sport: string): { id: string; name: string; description: string }[] {
    const config = this.getSportConfig(sport)
    return config?.bettingMarkets || []
  }

  /**
   * Get current season for a sport
   */
  static getCurrentSeason(sport: string): string {
    const config = this.getSportConfig(sport)
    if (!config) {
      return new Date().getFullYear().toString()
    }

    const { startMonth, seasonYearOffset = 0 } = config.seasonConfig
    const year = new Date().getFullYear()
    const month = new Date().getMonth()
    
    // If current month is before start month, we're in the previous year's season
    if (month < startMonth) {
      return (year - 1 + seasonYearOffset).toString()
    }
    
    return (year + seasonYearOffset).toString()
  }

  /**
   * Get update frequency for a sport
   */
  static getUpdateFrequency(sport: string): number {
    const config = this.getSportConfig(sport)
    return config?.updateFrequency || 30
  }

  /**
   * Check if sport is supported
   */
  static isSportSupported(sport: string): boolean {
    return this.configs.has(sport)
  }

  /**
   * Refresh configurations from database
   */
  static async refresh(): Promise<void> {
    if (!this.projectId) {
      throw new Error('Project ID not set. Call initialize() first.')
    }
    await this.loadConfigurations()
  }

  /**
   * Get all sport configurations
   */
  static getAllConfigs(): DynamicSportConfig[] {
    if (!this.initialized) {
      throw new Error('Service not initialized. Call initialize() first.')
    }
    return Array.from(this.configs.values())
  }
}
