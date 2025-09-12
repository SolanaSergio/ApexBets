/**
 * SPORT PLAYER STATISTICS SERVICE
 * Comprehensive player statistics for all sports
 */

import { BaseService, ServiceConfig } from '../core/base-service'
import { serviceFactory, SupportedSport } from '../core/service-factory'
import { SportConfigManager } from '../core/sport-config'

export interface PlayerStats {
  playerId: string
  name: string
  team: string
  position: string
  sport: string
  league: string
  season: string
  gamesPlayed: number
  stats: Record<string, number | string>
  averages: Record<string, number>
  totals: Record<string, number>
  rankings: Record<string, number>
  lastUpdated: string
}

export interface PlayerStatsFilter {
  teamId?: string
  position?: string
  season?: string
  minGames?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  limit?: number
}

export interface PlayerComparison {
  players: PlayerStats[]
  comparison: {
    stat: string
    values: Record<string, number>
    leader: string
    difference: Record<string, number>
  }[]
}

export class SportPlayerStatsService extends BaseService {
  private sport: SupportedSport
  private league: string

  constructor(sport: SupportedSport, league?: string) {
    const config: ServiceConfig = {
      name: `player-stats-${sport}`,
      cacheTTL: 15 * 60 * 1000, // 15 minutes
      rateLimitService: 'player-stats',
      retryAttempts: 2,
      retryDelay: 1000
    }
    super(config)
    this.sport = sport
    this.league = league || ''
  }

  /**
   * Initialize the service with the default league
   */
  async initialize(): Promise<void> {
    if (!this.league) {
      this.league = await serviceFactory.getDefaultLeague(this.sport)
    }
  }

  /**
   * Get player statistics for a specific sport and league
   */
  async getPlayerStats(params: PlayerStatsFilter = {}): Promise<PlayerStats[]> {
    const key = this.getCacheKey('player-stats', this.sport, this.league, JSON.stringify(params))
    
    return this.getCachedOrFetch(key, async () => {
      try {
        // Get player stats directly from database
        const playerStats = await this.getPlayerStatsFromDatabase(params)
        
        // Apply filters and sorting
        return this.applyFiltersAndSorting(playerStats, params)
      } catch (error) {
        console.error(`Error fetching player stats for ${this.sport}:`, error)
        return []
      }
    })
  }

  /**
   * Get statistics for a specific player
   */
  async getPlayerStatsById(playerId: string, season?: string): Promise<PlayerStats | null> {
    const key = this.getCacheKey('player-stats-by-id', this.sport, this.league, playerId, season || 'current')
    
    return this.getCachedOrFetch(key, async () => {
      try {
        return await this.fetchPlayerStats(playerId, season)
      } catch (error) {
        console.error(`Error fetching player stats for ${playerId}:`, error)
        return null
      }
    })
  }

  /**
   * Get player rankings for specific statistics
   */
  async getPlayerRankings(stat: string, params: PlayerStatsFilter = {}): Promise<PlayerStats[]> {
    const key = this.getCacheKey('player-rankings', this.sport, this.league, stat, JSON.stringify(params))
    
    return this.getCachedOrFetch(key, async () => {
      const allStats = await this.getPlayerStats(params)
      
      return allStats
        .filter(player => player.stats[stat] !== undefined)
        .sort((a, b) => {
          const aValue = typeof a.stats[stat] === 'number' ? a.stats[stat] as number : 0
          const bValue = typeof b.stats[stat] === 'number' ? b.stats[stat] as number : 0
          return params.sortOrder === 'asc' ? aValue - bValue : bValue - aValue
        })
        .slice(0, params.limit || 20)
    })
  }

  /**
   * Compare multiple players
   */
  async comparePlayers(playerIds: string[], season?: string): Promise<PlayerComparison | null> {
    const key = this.getCacheKey('player-comparison', this.sport, this.league, playerIds.join(','), season || 'current')
    
    return this.getCachedOrFetch(key, async () => {
      try {
        const players: PlayerStats[] = []
        
        for (const playerId of playerIds) {
          const stats = await this.getPlayerStatsById(playerId, season)
          if (stats) {
            players.push(stats)
          }
        }

        if (players.length === 0) {
          return null
        }

        // Get common statistics for comparison
        const commonStats = this.getCommonStats(players)
        const comparison = this.buildComparison(players, commonStats)

        return {
          players,
          comparison
        }
      } catch (error) {
        console.error('Error comparing players:', error)
        return null
      }
    })
  }

  /**
   * Get team statistics summary
   */
  async getTeamStats(teamId: string, season?: string): Promise<{
    teamId: string
    teamName: string
    players: PlayerStats[]
    teamTotals: Record<string, number>
    teamAverages: Record<string, number>
    leagueRankings: Record<string, Record<string, number>>
  } | null> {
    const key = this.getCacheKey('team-stats', this.sport, this.league, teamId, season || 'current')
    
    return this.getCachedOrFetch(key, async () => {
      try {
        const playerStats = await this.getPlayerStats({
          teamId,
          season: season || undefined,
          limit: 100
        })

        if (playerStats.length === 0) {
          return null
        }

        const teamTotals = this.calculateTeamTotals(playerStats)
        const teamAverages = this.calculateTeamAverages(playerStats)
        const leagueRankings = await this.calculateLeagueRankings(teamTotals)

        return {
          teamId,
          teamName: playerStats[0]?.team || 'Unknown',
          players: playerStats,
          teamTotals,
          teamAverages,
          leagueRankings
        }
      } catch (error) {
        console.error('Error fetching team stats:', error)
        return null
      }
    })
  }

  /**
   * Get player statistics from database
   */
  private async getPlayerStatsFromDatabase(params: PlayerStatsFilter): Promise<PlayerStats[]> {
    try {
      const { createClient } = await import('../../supabase/server')
      const supabase = await createClient()
      
      if (!supabase) {
        throw new Error('Database connection failed')
      }

      // Get the appropriate table based on sport
      const tableName = await this.getStatsTableName()
      
      let query = supabase
        .from(tableName)
        .select('*')
        
      // Sport-specific tables don't have a sport column since they're already sport-specific
      // The table name itself indicates the sport, so no need to filter by sport column

      if (params.teamId) {
        query = query.eq('team_id', params.teamId)
      }

      if (params.position) {
        query = query.eq('position', params.position)
      }

      if (params.season) {
        query = query.eq('season', params.season)
      }

      const { data, error } = await query.limit(params.limit || 50)

      if (error) {
        console.error('Database error:', error)
        return []
      }

      // Group stats by player and calculate aggregates
      const playerStatsMap = new Map<string, any>()

      for (const stat of data || []) {
        const playerName = stat.player_name
        if (!playerStatsMap.has(playerName)) {
          playerStatsMap.set(playerName, {
            playerId: stat.id,
            name: playerName,
            team: 'Unknown', // Will be resolved separately if needed
            position: stat.position || 'Unknown',
            sport: this.sport,
            league: this.league,
            season: params.season || await this.getCurrentSeason(),
            gamesPlayed: 0,
            stats: {},
            averages: {},
            totals: {},
            rankings: {},
            lastUpdated: new Date().toISOString()
          })
        }

        const player = playerStatsMap.get(playerName)!
        player.gamesPlayed++
        
        // Add stats to totals
        for (const [key, value] of Object.entries(stat)) {
          if (typeof value === 'number' && key !== 'id' && key !== 'team_id' && key !== 'game_id' && key !== 'created_at') {
            if (!player.totals[key]) player.totals[key] = 0
            player.totals[key] += value
          }
        }
      }

      // Calculate averages
      for (const player of Array.from(playerStatsMap.values())) {
        for (const [key, total] of Object.entries(player.totals)) {
          if (typeof total === 'number' && player.gamesPlayed > 0) {
            player.averages[key] = Math.round((total / player.gamesPlayed) * 100) / 100
            player.stats[key] = player.averages[key]
          }
        }
      }

      return Array.from(playerStatsMap.values())
    } catch (error) {
      console.error('Error getting player stats from database:', error)
      return []
    }
  }

  /**
   * Get the appropriate stats table name for the sport
   */
  private async getStatsTableName(): Promise<string> {
    try {
      // Get table name from database configuration
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      
      const response = await supabase
        ?.from('sports')
        .select('name, player_stats_table')
        .eq('name', this.sport)
        .eq('is_active', true)
        .single()
      
      if (response && !response.error && response.data?.player_stats_table) {
        return response.data.player_stats_table
      }
    } catch (error) {
      console.warn(`Failed to get player stats table for ${this.sport}:`, error)
    }
    
    // Fallback to generic table name
    return 'player_stats'
  }

  /**
   * Fetch player statistics from the appropriate data source
   */
  private async fetchPlayerStats(playerId: string, season?: string): Promise<PlayerStats | null> {
    try {
      const service = await serviceFactory.getService(this.sport, this.league)
      const player = await service.getPlayerById(playerId)
      
      if (!player) {
        return null
      }

      // Get sport-specific statistics
      const stats = await this.getSportSpecificStats(playerId, season)
      const averages = this.calculateAverages(stats)
      const totals = this.calculateTotals(stats)

      return {
        playerId: player.id,
        name: player.name,
        team: player.team,
        position: player.position || 'Unknown',
        sport: this.sport,
        league: this.league,
        season: season || await this.getCurrentSeason(),
        gamesPlayed: stats.gamesPlayed || 0,
        stats: stats.rawStats || {},
        averages,
        totals,
        rankings: {}, // Will be calculated separately
        lastUpdated: new Date().toISOString()
      }
    } catch (error) {
      console.error(`Error fetching stats for player ${playerId}:`, error)
      return null
    }
  }

  /**
   * Get sport-specific statistics
   */
  private async getSportSpecificStats(playerId: string, season?: string): Promise<any> {
    const sportConfig = await SportConfigManager.getSportConfig(this.sport)
    
    switch (sportConfig?.dataSource) {
      case 'balldontlie':
        return await this.getBalldontlieStats(playerId, season)
      case 'sportsdb':
        return await this.getSportsDBStats(playerId, season)
      default:
        return await this.getGenericStats(playerId, season)
    }
  }

  /**
   * Get statistics from BallDontLie API
   */
  private async getBalldontlieStats(playerId: string, season?: string): Promise<any> {
    try {
      const { ballDontLieClient } = await import('../../sports-apis')
      
      if (!ballDontLieClient.isConfigured) {
        return this.getGenericStats(playerId, season)
      }

      const currentSeason = season || await this.getCurrentSeason()
      const seasonNumber = parseInt(currentSeason)
      
      const stats = await ballDontLieClient.getStats({
        player_ids: [parseInt(playerId)],
        seasons: [seasonNumber],
        per_page: 100
      })

      if (!stats.data || stats.data.length === 0) {
        return this.getGenericStats(playerId, season)
      }

      const rawStats = stats.data[0]
      const gamesPlayed = stats.data.length

      return {
        gamesPlayed,
        rawStats: {
          points: rawStats.pts,
          rebounds: rawStats.reb,
          assists: rawStats.ast,
          steals: rawStats.stl,
          blocks: rawStats.blk,
          turnovers: rawStats.turnover,
          field_goals_made: rawStats.fgm,
          field_goals_attempted: rawStats.fga,
          field_goal_percentage: rawStats.fg_pct,
          three_pointers_made: rawStats.fg3m,
          three_pointers_attempted: rawStats.fg3a,
          three_point_percentage: rawStats.fg3_pct,
          free_throws_made: rawStats.ftm,
          free_throws_attempted: rawStats.fta,
          free_throw_percentage: rawStats.ft_pct,
          minutes: rawStats.min,
          personal_fouls: rawStats.pf,
          offensive_rebounds: rawStats.oreb,
          defensive_rebounds: rawStats.dreb
        }
      }
    } catch (error) {
      console.error('Error fetching basketball stats:', error)
      return this.getGenericStats(playerId, season)
    }
  }

  /**
   * Get statistics from SportsDB
   */
  private async getSportsDBStats(playerId: string, season?: string): Promise<any> {
    try {
      const { } = await import('../../sports-apis')
      
      // SportsDB doesn't have detailed player stats, return generic stats
      return this.getGenericStats(playerId, season)
    } catch (error) {
      console.error('Error fetching SportsDB stats:', error)
      return this.getGenericStats(playerId, season)
    }
  }

  /**
   * Get generic statistics when specific APIs are not available
   */
  private async getGenericStats(_playerId: string, _season?: string): Promise<any> {
    // Return empty structure when no real data is available
    return {
      gamesPlayed: 0,
      rawStats: {}
    }
  }

  /**
   * Calculate averages from raw stats
   */
  private calculateAverages(stats: any): Record<string, number> {
    const averages: Record<string, number> = {}
    const gamesPlayed = stats.gamesPlayed || 1

    for (const [key, value] of Object.entries(stats.rawStats || {})) {
      if (typeof value === 'number' && !key.includes('percentage') && !key.includes('average')) {
        averages[key] = Math.round((value / gamesPlayed) * 100) / 100
      }
    }

    return averages
  }

  /**
   * Calculate totals from raw stats
   */
  private calculateTotals(stats: any): Record<string, number> {
    const totals: Record<string, number> = {}

    for (const [key, value] of Object.entries(stats.rawStats || {})) {
      if (typeof value === 'number' && !key.includes('percentage') && !key.includes('average')) {
        totals[key] = value
      }
    }

    return totals
  }

  /**
   * Apply filters and sorting to player stats
   */
  private applyFiltersAndSorting(players: PlayerStats[], params: PlayerStatsFilter): PlayerStats[] {
    let filtered = players

    // Apply filters
    if (params.position) {
      filtered = filtered.filter(player => player.position === params.position)
    }

    if (params.minGames !== undefined && params.minGames !== null) {
      const minGames = params.minGames
      filtered = filtered.filter(player => player.gamesPlayed >= minGames)
    }

    // Apply sorting
    if (params.sortBy) {
      filtered.sort((a, b) => {
        const aValue = a.stats[params.sortBy!] as number || 0
        const bValue = b.stats[params.sortBy!] as number || 0
        return params.sortOrder === 'asc' ? aValue - bValue : bValue - aValue
      })
    }

    return filtered.slice(0, params.limit || 50)
  }

  /**
   * Get common statistics across players
   */
  private getCommonStats(players: PlayerStats[]): string[] {
    if (players.length === 0) return []

    const allStats = new Set<string>()
    players.forEach(player => {
      Object.keys(player.stats).forEach(stat => allStats.add(stat))
    })

    return Array.from(allStats)
  }

  /**
   * Build comparison data
   */
  private buildComparison(players: PlayerStats[], commonStats: string[]): any[] {
    return commonStats.map(stat => {
      const values: Record<string, number> = {}
      const numericValues: number[] = []

      players.forEach(player => {
        const value = player.stats[stat] as number || 0
        values[player.name] = value
        numericValues.push(value)
      })

      const maxValue = Math.max(...numericValues)
      const leader = players.find(p => (p.stats[stat] as number || 0) === maxValue)?.name || ''

      const difference: Record<string, number> = {}
      players.forEach(player => {
        const value = player.stats[stat] as number || 0
        difference[player.name] = value - maxValue
      })

      return {
        stat,
        values,
        leader,
        difference
      }
    })
  }

  /**
   * Calculate team totals
   */
  private calculateTeamTotals(players: PlayerStats[]): Record<string, number> {
    const totals: Record<string, number> = {}

    players.forEach(player => {
      Object.entries(player.totals).forEach(([stat, value]) => {
        totals[stat] = (totals[stat] || 0) + value
      })
    })

    return totals
  }

  /**
   * Calculate team averages
   */
  private calculateTeamAverages(players: PlayerStats[]): Record<string, number> {
    const averages: Record<string, number> = {}
    const totals = this.calculateTeamTotals(players)
    const totalGames = players.reduce((sum, player) => sum + player.gamesPlayed, 0)

    Object.entries(totals).forEach(([stat, total]) => {
      averages[stat] = totalGames > 0 ? Math.round((total / totalGames) * 100) / 100 : 0
    })

    return averages
  }

  /**
   * Calculate league rankings
   */
  private async calculateLeagueRankings(teamTotals: Record<string, number>): Promise<Record<string, Record<string, number>>> {
    // Calculate real rankings based on team totals
    const rankings: Record<string, Record<string, number>> = {}
    
    // Sort teams by each stat and assign rankings
    Object.keys(teamTotals).forEach(stat => {
      const sortedTeams = Object.entries(teamTotals)
        .sort(([,a], [,b]) => b - a) // Sort descending
      
      sortedTeams.forEach(([teamId, _value], index) => {
        if (!rankings[teamId]) {
          rankings[teamId] = {}
        }
        rankings[teamId][stat] = index + 1
      })
    })

    return rankings
  }

  /**
   * Get current season dynamically based on sport configuration
   */
  private async getCurrentSeason(): Promise<string> {
    try {
      const { SportConfigManager } = await import('../core/sport-config')
      return await SportConfigManager.getCurrentSeason(this.sport)
    } catch (error) {
      console.error(`Error getting current season for ${this.sport}:`, error)
      // Fallback to current year
      return new Date().getFullYear().toString()
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.getPlayerStats({ limit: 1 })
      return true
    } catch (error) {
      console.error(`${this.sport} player stats service health check failed:`, error)
      return false
    }
  }
}
