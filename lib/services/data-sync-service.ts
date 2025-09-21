/**
 * DATA SYNC SERVICE
 * Automated synchronization of real data from external APIs to database
 * Ensures data is always fresh and up-to-date
 */

// Using Supabase MCP tools instead of direct client
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
  private liveSyncInterval: NodeJS.Timeout | null = null

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

    // Optional live-only sync for faster real-time updates (DB-first everywhere)
    if (process.env.ENABLE_LIVE_SYNC === 'true') {
      const liveIntervalMs = Math.max(30000, Number(process.env.LIVE_SYNC_INTERVAL_MS || 60000))
      this.liveSyncInterval = setInterval(() => {
        this.performLiveOnlySync()
      }, liveIntervalMs)
    }
  }

  /**
   * Stop the automated sync process
   */
  stop(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval)
      this.syncInterval = null
    }
    if (this.liveSyncInterval) {
      clearInterval(this.liveSyncInterval)
      this.liveSyncInterval = null
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
      const sports = await serviceFactory.getSupportedSports()
      
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
   * Perform a lightweight sync for live games only (higher frequency)
   */
  async performLiveOnlySync(): Promise<void> {
    if (!this.isRunning) return

    try {
      const sports = await serviceFactory.getSupportedSports()
      for (const sport of sports) {
        try {
          await this.syncLiveGames(sport)
          await this.delay(500)
        } catch (error) {
          console.error(`Live-only sync error for ${sport}:`, error)
          this.stats.errors++
        }
      }
      this.stats.lastSync = new Date()
      this.stats.nextSync = new Date(Date.now() + this.config.interval)
    } catch (error) {
      console.error('Critical error during live-only sync:', error)
      this.stats.errors++
    }
  }

  /**
   * Sync games data for a specific sport
   */
  private async syncGames(sport: SupportedSport): Promise<number> {
    // Using MCP Database Service for database operations
    const { MCPDatabaseService } = await import('./mcp-database-service')
    const dbService = MCPDatabaseService.getInstance()

    let synced = 0

    try {
      // Get live games
      const liveGames = await cachedUnifiedApiClient.getLiveGames(sport)
      for (const game of liveGames) {
        await this.upsertGame(dbService, game, sport)
        synced++
      }

      // Get upcoming games (next 7 days)
      const upcomingGames = await cachedUnifiedApiClient.getGames(sport, {
        status: 'scheduled',
        limit: 100
      })
      for (const game of upcomingGames) {
        await this.upsertGame(dbService, game, sport)
        synced++
      }

      // Get recent completed games (last 7 days)
      const recentGames = await cachedUnifiedApiClient.getGames(sport, {
        status: 'finished',
        limit: 50
      })
      for (const game of recentGames) {
        await this.upsertGame(dbService, game, sport)
        synced++
      }

    } catch (error) {
      console.error(`Error syncing games for ${sport}:`, error)
      throw error
    }

    return synced
  }

  /**
   * Sync only live games for a specific sport (used by live-only sync loop)
   */
  private async syncLiveGames(sport: SupportedSport): Promise<number> {
    // Using MCP Database Service for database operations
    const { MCPDatabaseService } = await import('./mcp-database-service')
    const dbService = MCPDatabaseService.getInstance()
    
    let synced = 0
    try {
      const liveGames = await cachedUnifiedApiClient.getLiveGames(sport)
      for (const game of liveGames) {
        await this.upsertGame(dbService, game, sport)
        synced++
      }
    } catch (error) {
      console.error(`Error live-syncing games for ${sport}:`, error)
      throw error
    }
    return synced
  }

  /**
   * Sync teams data for a specific sport
   */
  private async syncTeams(sport: SupportedSport): Promise<number> {
    // Using MCP Database Service for database operations
    const { MCPDatabaseService } = await import('./mcp-database-service')
    const dbService = MCPDatabaseService.getInstance()

    let synced = 0

    try {
      const teams = await cachedUnifiedApiClient.getTeams(sport)
      
      for (const team of teams) {
        const upsertQuery = `
          INSERT INTO public.teams (
            id, name, abbreviation, sport, league, city, logo_url,
            conference, division, founded_year, stadium_name, stadium_capacity,
            primary_color, secondary_color, country, is_active, updated_at
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, NOW()
          )
          ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name,
            abbreviation = EXCLUDED.abbreviation,
            sport = EXCLUDED.sport,
            league = EXCLUDED.league,
            city = EXCLUDED.city,
            logo_url = EXCLUDED.logo_url,
            conference = EXCLUDED.conference,
            division = EXCLUDED.division,
            founded_year = EXCLUDED.founded_year,
            stadium_name = EXCLUDED.stadium_name,
            stadium_capacity = EXCLUDED.stadium_capacity,
            primary_color = EXCLUDED.primary_color,
            secondary_color = EXCLUDED.secondary_color,
            country = EXCLUDED.country,
            is_active = EXCLUDED.is_active,
            updated_at = NOW()
        `
        
        try {
          await dbService.executeSQL(upsertQuery, [
            team.id,
            team.name,
            team.abbreviation,
            sport,
            team.league,
            team.city,
            team.logoUrl,
            team.conference,
            team.division,
            team.foundedYear,
            team.stadiumName,
            team.stadiumCapacity,
            team.primaryColor,
            team.secondaryColor,
            team.country,
            team.isActive ?? true
          ])
          synced++
        } catch (error) {
          console.error(`Error upserting team ${team.name}:`, error)
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
    // Using MCP Database Service for database operations
    const { MCPDatabaseService } = await import('./mcp-database-service')
    const dbService = MCPDatabaseService.getInstance()

    let synced = 0

    try {
      const games = await cachedUnifiedApiClient.getGames(sport, { limit: 20 })
      
      for (const game of games) {
        if (game.odds && game.odds.length > 0) {
          for (const odd of game.odds) {
            const oddsId = `${game.id}_${odd.odds_type}_${Date.now()}`
            
            const upsertQuery = `
              INSERT INTO public.odds (
                id, game_id, source, odds_type, home_odds, away_odds, 
                spread, total, timestamp, sport, league, created_at
              ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW()
              )
              ON CONFLICT (id) DO UPDATE SET
                home_odds = EXCLUDED.home_odds,
                away_odds = EXCLUDED.away_odds,
                spread = EXCLUDED.spread,
                total = EXCLUDED.total,
                timestamp = EXCLUDED.timestamp,
                updated_at = NOW()
            `
            
            try {
              await dbService.executeSQL(upsertQuery, [
                oddsId,
                game.id,
                odd.source || 'external_api',
                odd.odds_type,
                odd.home_odds,
                odd.away_odds,
                odd.spread,
                odd.total,
                new Date().toISOString(),
                sport,
                game.league || null
              ])
              synced++
            } catch (error) {
              console.error(`Error upserting odds for game ${game.id}:`, error)
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
    // Using MCP Database Service for database operations
    const { MCPDatabaseService } = await import('./mcp-database-service')
    const dbService = MCPDatabaseService.getInstance()

    let synced = 0

    try {
      const standings = await cachedUnifiedApiClient.getStandings(sport)
      
      for (const standing of standings) {
        const upsertQuery = `
          INSERT INTO public.league_standings (
            id, sport, league, team_id, team_name, season, wins, losses, ties,
            win_percentage, games_back, conference, division, updated_at
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW()
          )
          ON CONFLICT (id) DO UPDATE SET
            sport = EXCLUDED.sport,
            league = EXCLUDED.league,
            team_id = EXCLUDED.team_id,
            team_name = EXCLUDED.team_name,
            season = EXCLUDED.season,
            wins = EXCLUDED.wins,
            losses = EXCLUDED.losses,
            ties = EXCLUDED.ties,
            win_percentage = EXCLUDED.win_percentage,
            games_back = EXCLUDED.games_back,
            conference = EXCLUDED.conference,
            division = EXCLUDED.division,
            updated_at = NOW()
        `
        
        try {
          await dbService.executeSQL(upsertQuery, [
            `${sport}_${standing.team_id}_${standing.season}`,
            sport,
            standing.league,
            standing.team_id,
            standing.team_name,
            standing.season,
            standing.wins,
            standing.losses,
            standing.ties || 0,
            standing.win_percentage,
            standing.games_back,
            standing.conference,
            standing.division
          ])
          synced++
        } catch (error) {
          console.error(`Error upserting standing for team ${standing.team_name}:`, error)
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
  private async upsertGame(dbService: any, game: any, sport: SupportedSport): Promise<void> {
    // Find or create team IDs
    const homeTeamId = await this.getOrCreateTeamId(dbService, game.homeTeam, sport, game.league)
    const awayTeamId = await this.getOrCreateTeamId(dbService, game.awayTeam, sport, game.league)

    const upsertQuery = `
      INSERT INTO public.games (
        id, home_team_id, away_team_id, game_date, season, home_score, away_score,
        status, venue, league, sport, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW()
      )
      ON CONFLICT (id) DO UPDATE SET
        home_team_id = EXCLUDED.home_team_id,
        away_team_id = EXCLUDED.away_team_id,
        game_date = EXCLUDED.game_date,
        season = EXCLUDED.season,
        home_score = EXCLUDED.home_score,
        away_score = EXCLUDED.away_score,
        status = EXCLUDED.status,
        venue = EXCLUDED.venue,
        league = EXCLUDED.league,
        sport = EXCLUDED.sport,
        updated_at = NOW()
    `

    try {
      await dbService.executeSQL(upsertQuery, [
        game.id,
        homeTeamId,
        awayTeamId,
        game.date || game.game_date,
        game.season || '2024-25',
        game.homeScore || game.home_score,
        game.awayScore || game.away_score,
        this.mapGameStatus(game.status),
        game.venue || game.location,
        game.league,
        sport
      ])
    } catch (error) {
      console.error(`Error upserting game ${game.id}:`, error)
      throw error
    }
  }

  /**
   * Get or create team ID for a team name
   */
  private async getOrCreateTeamId(dbService: any, teamName: string, sport: SupportedSport, league: string): Promise<string> {
    // Try to find existing team
    const findQuery = `
      SELECT id FROM public.teams 
      WHERE name = $1 AND sport = $2
      LIMIT 1
    `
    
    try {
      const result = await dbService.executeSQL(findQuery, [teamName, sport])
      if (result && result.length > 0) {
        return result[0].id
      }
    } catch (error) {
      console.error(`Error finding team ${teamName}:`, error)
    }

    // Create new team
    const teamId = `team_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const insertQuery = `
      INSERT INTO public.teams (
        id, name, abbreviation, sport, league, is_active, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, NOW(), NOW()
      )
    `
    
    try {
      await dbService.executeSQL(insertQuery, [
        teamId,
        teamName,
        this.generateAbbreviation(teamName),
        sport,
        league,
        true
      ])
      return teamId
    } catch (error) {
      console.error(`Error creating team ${teamName}:`, error)
      // Return a fallback ID
      return `temp_${teamName.replace(/\s+/g, '_').toLowerCase()}`
    }
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
