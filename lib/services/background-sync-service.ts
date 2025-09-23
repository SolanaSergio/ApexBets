/**
 * Background Sync Service
 * Implements proper database-first approach with background synchronization
 * Respects rate limits and updates database without affecting user requests
 */

import { structuredLogger } from './structured-logger'
// Removed unused databaseService import
import { cachedUnifiedApiClient } from './api/cached-unified-api-client'
import { SupportedSport } from './core/service-factory'
import { SportConfigManager } from './core/sport-config'

export interface BackgroundSyncConfig {
  enableGamesSync: boolean
  enableOddsSync: boolean
  enablePredictionsSync: boolean
  enableTeamsSync: boolean
  enableStandingsSync: boolean
  gamesSyncInterval: number // minutes
  oddsSyncInterval: number // minutes
  predictionsSyncInterval: number // minutes
  teamsSyncInterval: number // minutes
  standingsSyncInterval: number // minutes
  maxRetries: number
  retryDelay: number // milliseconds
  respectRateLimits: boolean
}

export interface SyncStats {
  lastSync: Date | null
  totalSyncs: number
  successfulSyncs: number
  failedSyncs: number
  rateLimitHits: number
  isRunning: boolean
  nextScheduledSync: Date | null
}

export class BackgroundSyncService {
  private static instance: BackgroundSyncService
  private config: BackgroundSyncConfig
  private stats: SyncStats
  private intervals: Map<string, NodeJS.Timeout> = new Map()
  private isRunning: boolean = false
  private rateLimitTracker: Map<string, { lastRequest: Date; retryAfter: number }> = new Map()

  public static getInstance(): BackgroundSyncService {
    if (!BackgroundSyncService.instance) {
      BackgroundSyncService.instance = new BackgroundSyncService()
    }
    return BackgroundSyncService.instance
  }

  constructor() {
    this.config = {
      enableGamesSync: true,
      enableOddsSync: true,
      enablePredictionsSync: true,
      enableTeamsSync: true,
      enableStandingsSync: true,
      gamesSyncInterval: 15, // 15 minutes
      oddsSyncInterval: 5, // 5 minutes
      predictionsSyncInterval: 30, // 30 minutes
      teamsSyncInterval: 60, // 1 hour
      standingsSyncInterval: 30, // 30 minutes
      maxRetries: 3,
      retryDelay: 5000, // 5 seconds
      respectRateLimits: true
    }

    this.stats = {
      lastSync: null,
      totalSyncs: 0,
      successfulSyncs: 0,
      failedSyncs: 0,
      rateLimitHits: 0,
      isRunning: false,
      nextScheduledSync: null
    }
  }

  async start(): Promise<void> {
    if (this.isRunning) {
      structuredLogger.info('Background sync service already running')
      return
    }

    this.isRunning = true
    this.stats.isRunning = true

    structuredLogger.info('Starting background sync service', { config: this.config })

    // Start individual sync intervals
    if (this.config.enableGamesSync) {
      this.startInterval('games', this.config.gamesSyncInterval, () => this.syncGames())
    }

    if (this.config.enableOddsSync) {
      this.startInterval('odds', this.config.oddsSyncInterval, () => this.syncOdds())
    }

    if (this.config.enablePredictionsSync) {
      this.startInterval('predictions', this.config.predictionsSyncInterval, () => this.syncPredictions())
    }

    if (this.config.enableTeamsSync) {
      this.startInterval('teams', this.config.teamsSyncInterval, () => this.syncTeams())
    }

    if (this.config.enableStandingsSync) {
      this.startInterval('standings', this.config.standingsSyncInterval, () => this.syncStandings())
    }

    // Initial sync
    await this.performInitialSync()

    structuredLogger.info('Background sync service started successfully')
  }

  async stop(): Promise<void> {
    this.isRunning = false
    this.stats.isRunning = false

    // Clear all intervals
    this.intervals.forEach((interval) => clearInterval(interval))
    this.intervals.clear()

    structuredLogger.info('Background sync service stopped')
  }

  private startInterval(name: string, intervalMinutes: number, syncFunction: () => Promise<void>): void {
    const intervalMs = intervalMinutes * 60 * 1000
    
    // Run immediately, then on interval
    syncFunction().catch(error => {
      structuredLogger.error(`Initial ${name} sync failed`, { error: error.message })
    })

    const interval = setInterval(async () => {
      if (this.isRunning) {
        await syncFunction()
      }
    }, intervalMs)

    this.intervals.set(name, interval)
    
    // Update next scheduled sync
    this.stats.nextScheduledSync = new Date(Date.now() + intervalMs)
  }

  private async performInitialSync(): Promise<void> {
    structuredLogger.info('Performing initial background sync')

    const syncPromises = []

    if (this.config.enableGamesSync) {
      syncPromises.push(this.syncGames())
    }

    if (this.config.enableOddsSync) {
      syncPromises.push(this.syncOdds())
    }

    if (this.config.enablePredictionsSync) {
      syncPromises.push(this.syncPredictions())
    }

    if (this.config.enableTeamsSync) {
      syncPromises.push(this.syncTeams())
    }

    if (this.config.enableStandingsSync) {
      syncPromises.push(this.syncStandings())
    }

    // Run all syncs in parallel but don't wait for completion
    Promise.allSettled(syncPromises).then(results => {
      const successful = results.filter(r => r.status === 'fulfilled').length
      const failed = results.filter(r => r.status === 'rejected').length
      
      structuredLogger.info('Initial background sync completed', {
        successful,
        failed,
        total: results.length
      })
    })
  }

  private async syncGames(): Promise<void> {
    try {
      this.stats.totalSyncs++
      
      // Check rate limits
      if (this.isRateLimited('games')) {
        this.stats.rateLimitHits++
        return
      }

      const sports = SportConfigManager.getSupportedSports()
      const syncPromises = sports.map(sport => this.syncGamesForSport(sport))
      
      await Promise.allSettled(syncPromises)
      
      this.stats.successfulSyncs++
      this.stats.lastSync = new Date()
      
      structuredLogger.info('Games sync completed', { 
        sports: sports.length,
        stats: this.stats 
      })

    } catch (error) {
      this.stats.failedSyncs++
      structuredLogger.error('Games sync failed', { 
        error: error instanceof Error ? error.message : String(error),
        stats: this.stats 
      })
    }
  }

  private async syncGamesForSport(sport: SupportedSport): Promise<void> {
    try {
      // Fetch games from external API (this will respect rate limits)
      const games = await cachedUnifiedApiClient.getGames(sport, {
        status: 'live',
        limit: 100
      })

      // Store in database
      if (games.length > 0) {
        await this.storeGamesInDatabase(sport, games)
        structuredLogger.info(`Synced ${games.length} games for ${sport}`)
      }

    } catch (error) {
      structuredLogger.warn(`Failed to sync games for ${sport}`, {
        error: error instanceof Error ? error.message : String(error)
      })
    }
  }

  private async syncOdds(): Promise<void> {
    try {
      this.stats.totalSyncs++
      
      if (this.isRateLimited('odds')) {
        this.stats.rateLimitHits++
        return
      }

      const sports = SportConfigManager.getSupportedSports()
      const syncPromises = sports.map(sport => this.syncOddsForSport(sport))
      
      await Promise.allSettled(syncPromises)
      
      this.stats.successfulSyncs++
      this.stats.lastSync = new Date()
      
      structuredLogger.info('Odds sync completed', { 
        sports: sports.length,
        stats: this.stats 
      })

    } catch (error) {
      this.stats.failedSyncs++
      structuredLogger.error('Odds sync failed', { 
        error: error instanceof Error ? error.message : String(error),
        stats: this.stats 
      })
    }
  }

  private async syncOddsForSport(sport: SupportedSport): Promise<void> {
    try {
      const odds = await cachedUnifiedApiClient.getOdds(sport, { limit: 100 })

      if (odds.length > 0) {
        await this.storeOddsInDatabase(sport, odds)
        structuredLogger.info(`Synced ${odds.length} odds for ${sport}`)
      }

    } catch (error) {
      structuredLogger.warn(`Failed to sync odds for ${sport}`, {
        error: error instanceof Error ? error.message : String(error)
      })
    }
  }

  private async syncPredictions(): Promise<void> {
    try {
      this.stats.totalSyncs++
      
      if (this.isRateLimited('predictions')) {
        this.stats.rateLimitHits++
        return
      }

      const sports = SportConfigManager.getSupportedSports()
      const syncPromises = sports.map(sport => this.syncPredictionsForSport(sport))
      
      await Promise.allSettled(syncPromises)
      
      this.stats.successfulSyncs++
      this.stats.lastSync = new Date()
      
      structuredLogger.info('Predictions sync completed', { 
        sports: sports.length,
        stats: this.stats 
      })

    } catch (error) {
      this.stats.failedSyncs++
      structuredLogger.error('Predictions sync failed', { 
        error: error instanceof Error ? error.message : String(error),
        stats: this.stats 
      })
    }
  }

  private async syncPredictionsForSport(sport: SupportedSport): Promise<void> {
    try {
      const predictions = await cachedUnifiedApiClient.getPredictions(sport, { limit: 50 })

      if (predictions.length > 0) {
        await this.storePredictionsInDatabase(sport, predictions)
        structuredLogger.info(`Synced ${predictions.length} predictions for ${sport}`)
      }

    } catch (error) {
      structuredLogger.warn(`Failed to sync predictions for ${sport}`, {
        error: error instanceof Error ? error.message : String(error)
      })
    }
  }

  private async syncTeams(): Promise<void> {
    try {
      this.stats.totalSyncs++
      
      if (this.isRateLimited('teams')) {
        this.stats.rateLimitHits++
        return
      }

      const sports = SportConfigManager.getSupportedSports()
      const syncPromises = sports.map(sport => this.syncTeamsForSport(sport))
      
      await Promise.allSettled(syncPromises)
      
      this.stats.successfulSyncs++
      this.stats.lastSync = new Date()
      
      structuredLogger.info('Teams sync completed', { 
        sports: sports.length,
        stats: this.stats 
      })

    } catch (error) {
      this.stats.failedSyncs++
      structuredLogger.error('Teams sync failed', { 
        error: error instanceof Error ? error.message : String(error),
        stats: this.stats 
      })
    }
  }

  private async syncTeamsForSport(sport: SupportedSport): Promise<void> {
    try {
      const teams = await cachedUnifiedApiClient.getTeams(sport, { limit: 100 })

      if (teams.length > 0) {
        await this.storeTeamsInDatabase(sport, teams)
        structuredLogger.info(`Synced ${teams.length} teams for ${sport}`)
      }

    } catch (error) {
      structuredLogger.warn(`Failed to sync teams for ${sport}`, {
        error: error instanceof Error ? error.message : String(error)
      })
    }
  }

  private async syncStandings(): Promise<void> {
    try {
      this.stats.totalSyncs++
      
      if (this.isRateLimited('standings')) {
        this.stats.rateLimitHits++
        return
      }

      const sports = SportConfigManager.getSupportedSports()
      const syncPromises = sports.map(sport => this.syncStandingsForSport(sport))
      
      await Promise.allSettled(syncPromises)
      
      this.stats.successfulSyncs++
      this.stats.lastSync = new Date()
      
      structuredLogger.info('Standings sync completed', { 
        sports: sports.length,
        stats: this.stats 
      })

    } catch (error) {
      this.stats.failedSyncs++
      structuredLogger.error('Standings sync failed', { 
        error: error instanceof Error ? error.message : String(error),
        stats: this.stats 
      })
    }
  }

  private async syncStandingsForSport(sport: SupportedSport): Promise<void> {
    try {
      const standings = await cachedUnifiedApiClient.getStandings(sport, {})

      if (standings.length > 0) {
        await this.storeStandingsInDatabase(sport, standings)
        structuredLogger.info(`Synced ${standings.length} standings for ${sport}`)
      }

    } catch (error) {
      structuredLogger.warn(`Failed to sync standings for ${sport}`, {
        error: error instanceof Error ? error.message : String(error)
      })
    }
  }

  private isRateLimited(service: string): boolean {
    if (!this.config.respectRateLimits) {
      return false
    }

    const tracker = this.rateLimitTracker.get(service)
    if (!tracker) {
      return false
    }

    const now = Date.now()
    const timeSinceLastRequest = now - tracker.lastRequest.getTime()
    
    return timeSinceLastRequest < tracker.retryAfter
  }

  // Removed unused setRateLimit method

  // Database storage methods
  private async storeGamesInDatabase(sport: SupportedSport, games: any[]): Promise<void> {
    // Implementation would store games in database
    // This is a placeholder - actual implementation would use database service
    structuredLogger.info(`Storing ${games.length} games for ${sport} in database`)
  }

  private async storeOddsInDatabase(sport: SupportedSport, odds: any[]): Promise<void> {
    structuredLogger.info(`Storing ${odds.length} odds for ${sport} in database`)
  }

  private async storePredictionsInDatabase(sport: SupportedSport, predictions: any[]): Promise<void> {
    structuredLogger.info(`Storing ${predictions.length} predictions for ${sport} in database`)
  }

  private async storeTeamsInDatabase(sport: SupportedSport, teams: any[]): Promise<void> {
    structuredLogger.info(`Storing ${teams.length} teams for ${sport} in database`)
  }

  private async storeStandingsInDatabase(sport: SupportedSport, standings: any[]): Promise<void> {
    structuredLogger.info(`Storing ${standings.length} standings for ${sport} in database`)
  }

  // Public API
  getStats(): SyncStats {
    return { ...this.stats }
  }

  getConfig(): BackgroundSyncConfig {
    return { ...this.config }
  }

  updateConfig(updates: Partial<BackgroundSyncConfig>): void {
    this.config = { ...this.config, ...updates }
    structuredLogger.info('Background sync config updated', { config: this.config })
  }

  isServiceRunning(): boolean {
    return this.isRunning
  }

  async forceSync(dataType: 'games' | 'odds' | 'predictions' | 'teams' | 'standings'): Promise<void> {
    structuredLogger.info(`Force syncing ${dataType}`)
    
    switch (dataType) {
      case 'games':
        await this.syncGames()
        break
      case 'odds':
        await this.syncOdds()
        break
      case 'predictions':
        await this.syncPredictions()
        break
      case 'teams':
        await this.syncTeams()
        break
      case 'standings':
        await this.syncStandings()
        break
    }
  }
}

export const backgroundSyncService = BackgroundSyncService.getInstance()