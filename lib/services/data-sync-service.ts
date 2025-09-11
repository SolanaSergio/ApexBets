/**
 * DATA SYNC SERVICE
 * Automated synchronization of real data from external APIs to database
 * Ensures data is always fresh and up-to-date
 */

import { createClient } from '@/lib/supabase/server'
import { cachedUnifiedApiClient } from './api/cached-unified-api-client'
import { serviceFactory, SupportedSport } from './core/service-factory'

export interface SyncConfig {
  enabled: boolean
  interval: number // milliseconds
  batchSize: number
  retryAttempts: number
  retryDelay: number
}

export interface SyncStats {
  lastSync: Date
  totalSynced: number
  errors: number
  successRate: number
  nextSync: Date
}

export class DataSyncService {
  private config: SyncConfig
  private stats: SyncStats
  private syncInterval: NodeJS.Timeout | null = null
  private isRunning: boolean = false

  constructor(config: Partial<SyncConfig> = {}) {
    this.config = {
      enabled: true,
      interval: 5 * 60 * 1000, // 5 minutes
      batchSize: 50,
      retryAttempts: 3,
      retryDelay: 1000,
      ...config
    }

    this.stats = {
      lastSync: new Date(0),
      totalSynced: 0,
      errors: 0,
      successRate: 100,
      nextSync: new Date(Date.now() + this.config.interval)
    }
  }

  /**
   * Start the automated sync process
   */
  start(): void {
    if (this.isRunning) {
      console.log('Data sync service is already running')
      return
    }

    if (!this.config.enabled) {
      console.log('Data sync service is disabled')
      return
    }

    console.log('Starting data sync service...')
    this.isRunning = true

    // Run initial sync immediately
    this.performSync()

    // Set up interval for regular syncs
    this.syncInterval = setInterval(() => {
      this.performSync()
    }, this.config.interval)
  }

  /**
   * Stop the automated sync process
   */
  stop(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval)
      this.syncInterval = null
    }
    this.isRunning = false
    console.log('Data sync service stopped')
  }

  /**
   * Perform a complete data synchronization
   */
  async performSync(): Promise<void> {
    if (!this.isRunning) return

    console.log('Starting data synchronization...')
    const startTime = Date.now()
    let totalSynced = 0
    let errors = 0

    try {
      // Sync all supported sports
      const sports = serviceFactory.getSupportedSports()
      
      for (const sport of sports) {
        try {
          console.log(`Syncing data for ${sport}...`)
          
          // Sync games (live, upcoming, recent)
          const gamesSynced = await this.syncGames(sport)
          totalSynced += gamesSynced

          // Sync teams
          const teamsSynced = await this.syncTeams(sport)
          totalSynced += teamsSynced

          // Sync odds
          const oddsSynced = await this.syncOdds(sport)
          totalSynced += oddsSynced

          // Sync standings
          const standingsSynced = await this.syncStandings(sport)
          totalSynced += standingsSynced

          // Add delay between sports to respect rate limits
          await this.delay(2000)

        } catch (error) {
          console.error(`Error syncing ${sport}:`, error)
          errors++
        }
      }

      // Update stats
      this.stats.lastSync = new Date()
      this.stats.totalSynced += totalSynced
      this.stats.errors += errors
      this.stats.successRate = totalSynced > 0 ? ((totalSynced - errors) / totalSynced) * 100 : 100
      this.stats.nextSync = new Date(Date.now() + this.config.interval)

      const duration = Date.now() - startTime
      console.log(`Data sync completed in ${duration}ms. Synced: ${totalSynced}, Errors: ${errors}`)

    } catch (error) {
      console.error('Critical error during data sync:', error)
      this.stats.errors++
    }
  }

  /**
   * Sync games data for a specific sport
   */
  private async syncGames(sport: SupportedSport): Promise<number> {
    const supabase = await createClient()
    if (!supabase) throw new Error('Supabase client not available')

    let synced = 0

    try {
      // Get live games
      const liveGames = await cachedUnifiedApiClient.getLiveGames(sport)
      for (const game of liveGames) {
        await this.upsertGame(supabase, game, sport)
        synced++
      }

      // Get upcoming games (next 7 days)
      const upcomingGames = await cachedUnifiedApiClient.getGames(sport, {
        status: 'scheduled',
        limit: 100
      })
      for (const game of upcomingGames) {
        await this.upsertGame(supabase, game, sport)
        synced++
      }

      // Get recent completed games (last 7 days)
      const recentGames = await cachedUnifiedApiClient.getGames(sport, {
        status: 'finished',
        limit: 50
      })
      for (const game of recentGames) {
        await this.upsertGame(supabase, game, sport)
        synced++
      }

    } catch (error) {
      console.error(`Error syncing games for ${sport}:`, error)
      throw error
    }

    return synced
  }

  /**
   * Sync teams data for a specific sport
   */
  private async syncTeams(sport: SupportedSport): Promise<number> {
    const supabase = await createClient()
    if (!supabase) throw new Error('Supabase client not available')

    let synced = 0

    try {
      const teams = await cachedUnifiedApiClient.getTeams(sport)
      
      for (const team of teams) {
        const { error } = await supabase
          .from('teams')
          .upsert({
            id: team.id,
            name: team.name,
            abbreviation: team.abbreviation,
            sport: sport,
            league: team.league,
            city: team.city,
            logo_url: team.logoUrl,
            conference: team.conference,
            division: team.division,
            founded_year: team.foundedYear,
            stadium_name: team.stadiumName,
            stadium_capacity: team.stadiumCapacity,
            primary_color: team.primaryColor,
            secondary_color: team.secondaryColor,
            country: team.country,
            is_active: team.isActive ?? true,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'id'
          })

        if (error) {
          console.error(`Error upserting team ${team.name}:`, error)
        } else {
          synced++
        }
      }

    } catch (error) {
      console.error(`Error syncing teams for ${sport}:`, error)
      throw error
    }

    return synced
  }

  /**
   * Sync odds data for a specific sport
   */
  private async syncOdds(sport: SupportedSport): Promise<number> {
    const supabase = await createClient()
    if (!supabase) throw new Error('Supabase client not available')

    let synced = 0

    try {
      const games = await cachedUnifiedApiClient.getGames(sport, { limit: 20 })
      
      for (const game of games) {
        if (game.odds && game.odds.length > 0) {
          for (const odd of game.odds) {
            const { error } = await supabase
              .from('odds')
              .upsert({
                id: `${game.id}_${odd.odds_type}_${Date.now()}`,
                game_id: game.id,
                source: odd.source || 'external_api',
                odds_type: odd.odds_type,
                home_odds: odd.home_odds,
                away_odds: odd.away_odds,
                spread: odd.spread,
                total: odd.total,
                timestamp: new Date().toISOString()
              }, {
                onConflict: 'id'
              })

            if (error) {
              console.error(`Error upserting odds for game ${game.id}:`, error)
            } else {
              synced++
            }
          }
        }
      }

    } catch (error) {
      console.error(`Error syncing odds for ${sport}:`, error)
      throw error
    }

    return synced
  }

  /**
   * Sync standings data for a specific sport
   */
  private async syncStandings(sport: SupportedSport): Promise<number> {
    const supabase = await createClient()
    if (!supabase) throw new Error('Supabase client not available')

    let synced = 0

    try {
      const standings = await cachedUnifiedApiClient.getStandings(sport)
      
      for (const standing of standings) {
        const { error } = await supabase
          .from('league_standings')
          .upsert({
            id: `${sport}_${standing.team_id}_${standing.season}`,
            sport: sport,
            league: standing.league,
            team_id: standing.team_id,
            team_name: standing.team_name,
            season: standing.season,
            wins: standing.wins,
            losses: standing.losses,
            ties: standing.ties || 0,
            win_percentage: standing.win_percentage,
            games_back: standing.games_back,
            conference: standing.conference,
            division: standing.division,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'id'
          })

        if (error) {
          console.error(`Error upserting standing for team ${standing.team_name}:`, error)
        } else {
          synced++
        }
      }

    } catch (error) {
      console.error(`Error syncing standings for ${sport}:`, error)
      throw error
    }

    return synced
  }

  /**
   * Upsert a game into the database
   */
  private async upsertGame(supabase: any, game: any, sport: SupportedSport): Promise<void> {
    // Find or create team IDs
    const homeTeamId = await this.getOrCreateTeamId(supabase, game.homeTeam, sport, game.league)
    const awayTeamId = await this.getOrCreateTeamId(supabase, game.awayTeam, sport, game.league)

    const { error } = await supabase
      .from('games')
      .upsert({
        id: game.id,
        home_team_id: homeTeamId,
        away_team_id: awayTeamId,
        game_date: game.date || game.game_date,
        season: game.season || '2024-25',
        home_score: game.homeScore || game.home_score,
        away_score: game.awayScore || game.away_score,
        status: this.mapGameStatus(game.status),
        venue: game.venue || game.location,
        league: game.league,
        sport: sport,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'id'
      })

    if (error) {
      console.error(`Error upserting game ${game.id}:`, error)
      throw error
    }
  }

  /**
   * Get or create team ID for a team name
   */
  private async getOrCreateTeamId(supabase: any, teamName: string, sport: SupportedSport, league: string): Promise<string> {
    // Try to find existing team
    const { data: existingTeam } = await supabase
      .from('teams')
      .select('id')
      .eq('name', teamName)
      .eq('sport', sport)
      .single()

    if (existingTeam) {
      return existingTeam.id
    }

    // Create new team
    const { data: newTeam, error } = await supabase
      .from('teams')
      .insert({
        name: teamName,
        abbreviation: this.generateAbbreviation(teamName),
        sport: sport,
        league: league,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select('id')
      .single()

    if (error) {
      console.error(`Error creating team ${teamName}:`, error)
      // Return a fallback ID
      return `temp_${teamName.replace(/\s+/g, '_').toLowerCase()}`
    }

    return newTeam.id
  }

  /**
   * Generate abbreviation from team name
   */
  private generateAbbreviation(teamName: string): string {
    const words = teamName.split(' ')
    if (words.length === 1) {
      return teamName.substring(0, 3).toUpperCase()
    }
    return words.map(word => word[0]).join('').toUpperCase().substring(0, 3)
  }

  /**
   * Map external API status to our internal status
   */
  private mapGameStatus(status: string): string {
    const statusMap: Record<string, string> = {
      'live': 'in_progress',
      'in_progress': 'in_progress',
      'scheduled': 'scheduled',
      'finished': 'completed',
      'completed': 'completed',
      'postponed': 'postponed',
      'cancelled': 'cancelled'
    }
    return statusMap[status.toLowerCase()] || 'scheduled'
  }

  /**
   * Get current sync statistics
   */
  getStats(): SyncStats {
    return { ...this.stats }
  }

  /**
   * Get sync configuration
   */
  getConfig(): SyncConfig {
    return { ...this.config }
  }

  /**
   * Update sync configuration
   */
  updateConfig(newConfig: Partial<SyncConfig>): void {
    this.config = { ...this.config, ...newConfig }
  }

  /**
   * Check if sync service is running
   */
  isServiceRunning(): boolean {
    return this.isRunning
  }

  /**
   * Utility delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

// Export singleton instance
export const dataSyncService = new DataSyncService()
