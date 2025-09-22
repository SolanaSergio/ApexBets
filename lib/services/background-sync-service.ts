/**
 * BACKGROUND SYNC SERVICE
 * Keeps database updated with fresh data from external APIs
 * Runs in background to minimize rate limit usage
 */

import { structuredLogger } from './structured-logger'
import { productionSupabaseClient } from '../supabase/production-client'
import { cachedUnifiedApiClient } from './api/cached-unified-api-client'
import { SupportedSport } from './core/service-factory'

export interface SyncResult {
  success: boolean
  sport: string
  dataType: string
  recordsUpdated: number
  recordsAdded: number
  errors: string[]
  executionTime: number
}

export class BackgroundSyncService {
  private static instance: BackgroundSyncService
  private isRunning = false
  private lastSyncTimes = new Map<string, number>()
  private readonly SYNC_INTERVAL = 5 * 60 * 1000 // 5 minutes
  private readonly MAX_SYNC_AGE = 30 * 60 * 1000 // 30 minutes

  public static getInstance(): BackgroundSyncService {
    if (!BackgroundSyncService.instance) {
      BackgroundSyncService.instance = new BackgroundSyncService()
    }
    return BackgroundSyncService.instance
  }

  /**
   * Start background sync service
   */
  start(): void {
    if (this.isRunning) {
      structuredLogger.warn('Background sync service already running')
      return
    }

    this.isRunning = true
    structuredLogger.info('Starting background sync service', {
      interval: this.SYNC_INTERVAL,
      maxAge: this.MAX_SYNC_AGE
    })

    // Run initial sync
    this.runSync()

    // Set up interval
    setInterval(() => {
      this.runSync()
    }, this.SYNC_INTERVAL)
  }

  /**
   * Stop background sync service
   */
  stop(): void {
    this.isRunning = false
    structuredLogger.info('Background sync service stopped')
  }

  /**
   * Run sync for all sports
   */
  private async runSync(): Promise<void> {
    if (!this.isRunning) return

    try {
      const supportedSports = await this.getSupportedSports()
      const syncPromises = supportedSports.map(sport => this.syncSport(sport))
      
      const results = await Promise.allSettled(syncPromises)
      
      const successful = results.filter(r => r.status === 'fulfilled').length
      const failed = results.filter(r => r.status === 'rejected').length
      
      structuredLogger.info('Background sync completed', {
        totalSports: supportedSports.length,
        successful,
        failed
      })
    } catch (error) {
      structuredLogger.error('Background sync failed', {
        error: error instanceof Error ? error.message : String(error)
      })
    }
  }

  /**
   * Sync data for a specific sport
   */
  private async syncSport(sport: SupportedSport): Promise<SyncResult> {
    const startTime = Date.now()
    const errors: string[] = []
    let recordsUpdated = 0
    let recordsAdded = 0

    try {
      // Check if sync is needed
      const lastSync = this.lastSyncTimes.get(sport) || 0
      const timeSinceLastSync = Date.now() - lastSync
      
      if (timeSinceLastSync < this.SYNC_INTERVAL) {
        return {
          success: true,
          sport,
          dataType: 'all',
          recordsUpdated: 0,
          recordsAdded: 0,
          errors: [],
          executionTime: Date.now() - startTime
        }
      }

      structuredLogger.info(`Starting sync for ${sport}`)

      // Sync teams
      try {
        const teamResult = await this.syncTeams(sport)
        recordsUpdated += teamResult.recordsUpdated
        recordsAdded += teamResult.recordsAdded
      } catch (error) {
        errors.push(`Teams sync failed: ${error instanceof Error ? error.message : String(error)}`)
      }

      // Sync games
      try {
        const gameResult = await this.syncGames(sport)
        recordsUpdated += gameResult.recordsUpdated
        recordsAdded += gameResult.recordsAdded
      } catch (error) {
        errors.push(`Games sync failed: ${error instanceof Error ? error.message : String(error)}`)
      }

      // Sync players
      try {
        const playerResult = await this.syncPlayers(sport)
        recordsUpdated += playerResult.recordsUpdated
        recordsAdded += playerResult.recordsAdded
      } catch (error) {
        errors.push(`Players sync failed: ${error instanceof Error ? error.message : String(error)}`)
      }

      this.lastSyncTimes.set(sport, Date.now())

      return {
        success: errors.length === 0,
        sport,
        dataType: 'all',
        recordsUpdated,
        recordsAdded,
        errors,
        executionTime: Date.now() - startTime
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      errors.push(errorMessage)
      
      return {
        success: false,
        sport,
        dataType: 'all',
        recordsUpdated,
        recordsAdded,
        errors,
        executionTime: Date.now() - startTime
      }
    }
  }

  /**
   * Sync teams for a sport
   */
  private async syncTeams(sport: SupportedSport): Promise<{ recordsUpdated: number; recordsAdded: number }> {
    try {
      // Get teams from external API
      const externalTeams = await cachedUnifiedApiClient.getTeams(sport, { limit: 100 })
      
      if (!externalTeams || externalTeams.length === 0) {
        return { recordsUpdated: 0, recordsAdded: 0 }
      }

      // Get existing teams from database
      const existingTeams = await productionSupabaseClient.getTeams(sport)
      const existingTeamMap = new Map(existingTeams.map((t: any) => [t.name, t]))

      let recordsUpdated = 0
      let recordsAdded = 0

      // Process each external team
      for (const externalTeam of externalTeams) {
        const existingTeam = existingTeamMap.get(externalTeam.name)
        
        if (existingTeam) {
          // Update existing team
          const updateData = {
            ...existingTeam,
            ...externalTeam,
            last_updated: new Date().toISOString()
          }
          
          await productionSupabaseClient.supabase
            .from('teams')
            .update(updateData)
            .eq('id', (existingTeam as any).id)
          
          recordsUpdated++
        } else {
          // Add new team
          const newTeam = {
            id: externalTeam.id || `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name: externalTeam.name,
            sport: sport,
            league: externalTeam.league || 'default',
            abbreviation: externalTeam.abbreviation || '',
            city: externalTeam.city || '',
            logo_url: externalTeam.logoUrl || null,
            is_active: true,
            last_updated: new Date().toISOString()
          }
          
          await productionSupabaseClient.supabase
            .from('teams')
            .insert([newTeam])
          
          recordsAdded++
        }
      }

      return { recordsUpdated, recordsAdded }
    } catch (error) {
      throw new Error(`Teams sync failed: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  /**
   * Sync games for a sport
   */
  private async syncGames(sport: SupportedSport): Promise<{ recordsUpdated: number; recordsAdded: number }> {
    try {
      // Get games from external API
      const externalGames = await cachedUnifiedApiClient.getGames(sport, { limit: 50 })
      
      if (!externalGames || externalGames.length === 0) {
        return { recordsUpdated: 0, recordsAdded: 0 }
      }

      // Get existing games from database
      const existingGames = await productionSupabaseClient.getGames(sport)
      const existingGameMap = new Map(existingGames.map((g: any) => [g.id, g]))

      let recordsUpdated = 0
      let recordsAdded = 0

      // Process each external game
      for (const externalGame of externalGames) {
        const existingGame = existingGameMap.get(externalGame.id)
        
        if (existingGame) {
          // Update existing game
          const updateData = {
            ...existingGame,
            ...externalGame,
            last_updated: new Date().toISOString()
          }
          
          await productionSupabaseClient.supabase
            .from('games')
            .update(updateData)
            .eq('id', (existingGame as any).id)
          
          recordsUpdated++
        } else {
          // Add new game
          const newGame = {
            id: externalGame.id || `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            home_team_id: externalGame.homeTeam || null,
            away_team_id: externalGame.awayTeam || null,
            game_date: externalGame.date || new Date().toISOString(),
            season: '2024-25',
            status: externalGame.status || 'scheduled',
            home_score: externalGame.homeScore || null,
            away_score: externalGame.awayScore || null,
            venue: externalGame.venue || null,
            sport: sport,
            league: externalGame.league || 'default',
            last_updated: new Date().toISOString()
          }
          
          await productionSupabaseClient.supabase
            .from('games')
            .insert([newGame])
          
          recordsAdded++
        }
      }

      return { recordsUpdated, recordsAdded }
    } catch (error) {
      throw new Error(`Games sync failed: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  /**
   * Sync players for a sport
   */
  private async syncPlayers(sport: SupportedSport): Promise<{ recordsUpdated: number; recordsAdded: number }> {
    try {
      // Get players from external API
      const externalPlayers = await cachedUnifiedApiClient.getPlayers(sport, { limit: 100 })
      
      if (!externalPlayers || externalPlayers.length === 0) {
        return { recordsUpdated: 0, recordsAdded: 0 }
      }

      // Get existing players from database
      const existingPlayers = await productionSupabaseClient.getPlayers(sport)
      const existingPlayerMap = new Map(existingPlayers.map((p: any) => [p.id, p]))

      let recordsUpdated = 0
      let recordsAdded = 0

      // Process each external player
      for (const externalPlayer of externalPlayers) {
        const existingPlayer = existingPlayerMap.get(externalPlayer.id)
        
        if (existingPlayer) {
          // Update existing player
          const updateData = {
            ...existingPlayer,
            ...externalPlayer,
            last_updated: new Date().toISOString()
          }
          
          await productionSupabaseClient.supabase
            .from('players')
            .update(updateData)
            .eq('id', (existingPlayer as any).id)
          
          recordsUpdated++
        } else {
          // Add new player
          const newPlayer = {
            id: externalPlayer.id || `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name: externalPlayer.name,
            sport: sport,
            position: externalPlayer.position || null,
            team_id: externalPlayer.teamId || null,
            team_name: externalPlayer.teamName || null,
            is_active: true,
            last_updated: new Date().toISOString()
          }
          
          await productionSupabaseClient.supabase
            .from('players')
            .insert([newPlayer])
          
          recordsAdded++
        }
      }

      return { recordsUpdated, recordsAdded }
    } catch (error) {
      throw new Error(`Players sync failed: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  /**
   * Get supported sports
   */
  private async getSupportedSports(): Promise<SupportedSport[]> {
    try {
      // Get from database first
      const { data: sportsConfig } = await productionSupabaseClient.supabase
        .from('sports_config')
        .select('sport')
        .eq('is_active', true)

      if (sportsConfig && sportsConfig.length > 0) {
        return sportsConfig.map((s: any) => s.sport as SupportedSport)
      }

      // Fallback to default sports
      return ['basketball', 'football', 'soccer', 'baseball', 'hockey']
    } catch (error) {
      structuredLogger.error('Failed to get supported sports', {
        error: error instanceof Error ? error.message : String(error)
      })
      return ['basketball', 'football']
    }
  }

  /**
   * Get sync status
   */
  getSyncStatus(): { isRunning: boolean; lastSyncTimes: Record<string, number> } {
    return {
      isRunning: this.isRunning,
      lastSyncTimes: Object.fromEntries(this.lastSyncTimes)
    }
  }
}

export const backgroundSyncService = BackgroundSyncService.getInstance()
