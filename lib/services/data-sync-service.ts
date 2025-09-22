/**
 * Data Sync Service
 * Handles data synchronization between external APIs and database
 */

import { structuredLogger } from './structured-logger'
import { optimizedSportsStorage } from './optimized-sports-storage'
import { apiFallbackStrategy } from './api-fallback-strategy'
import { SupportedSport, SportConfigManager } from './core/sport-config'

export interface SyncStats {
  totalSyncs: number
  successfulSyncs: number
  failedSyncs: number
  lastSyncTime: Date | null
  averageSyncTime: number
  isRunning: boolean
}

export interface DataSyncConfig {
  intervalMinutes: number
  sports: SupportedSport[]
}

export class DataSyncService {
  private static instance: DataSyncService
  private stats: SyncStats = {
    totalSyncs: 0,
    successfulSyncs: 0,
    failedSyncs: 0,
    lastSyncTime: null,
    averageSyncTime: 0,
    isRunning: false
  }
  private config: DataSyncConfig = {
    intervalMinutes: 30,
    sports: [] as SupportedSport[]
  }

  public static getInstance(): DataSyncService {
    if (!DataSyncService.instance) {
      DataSyncService.instance = new DataSyncService()
    }
    return DataSyncService.instance
  }

  async performSync(sport?: SupportedSport): Promise<{ success: boolean; message: string; stats: SyncStats }> {
    const startTime = Date.now()
    this.stats.isRunning = true
    this.stats.totalSyncs++

    try {
      structuredLogger.info('Starting data sync', { sport })

      if (sport) {
        await this.syncSportData(sport)
      } else {
        // Load supported sports dynamically from configuration
        const activeSports: SupportedSport[] = SportConfigManager.getSupportedSports()
        for (const sportToSync of activeSports) {
          await this.syncSportData(sportToSync)
        }
      }

      const syncTime = Date.now() - startTime
      this.stats.successfulSyncs++
      this.stats.lastSyncTime = new Date()
      this.stats.averageSyncTime = (this.stats.averageSyncTime + syncTime) / 2
      this.stats.isRunning = false

      structuredLogger.info('Data sync completed successfully', { 
        sport, 
        syncTime,
        stats: this.stats 
      })

      return {
        success: true,
        message: `Sync completed successfully for ${sport || 'all sports'}`,
        stats: this.stats
      }

    } catch (error) {
      const syncTime = Date.now() - startTime
      this.stats.failedSyncs++
      this.stats.isRunning = false

      structuredLogger.error('Data sync failed', {
        sport,
        error: error instanceof Error ? error.message : String(error),
        syncTime
      })

      return {
        success: false,
        message: `Sync failed: ${error instanceof Error ? error.message : String(error)}`,
        stats: this.stats
      }
    }
  }

  private async syncSportData(sport: SupportedSport): Promise<void> {
    // Sync games
    const gamesResult = await apiFallbackStrategy.fetchData('games', { sport })
    if (Array.isArray(gamesResult)) {
      await optimizedSportsStorage.storeGames(sport, 'default', gamesResult)
    }

    // Sync teams
    const teamsResult = await apiFallbackStrategy.fetchData('teams', { sport })
    if (Array.isArray(teamsResult)) {
      await optimizedSportsStorage.storeTeams(sport, 'default', teamsResult)
    }

    // Sync players
    const playersResult = await apiFallbackStrategy.fetchData('players', { sport })
    if (Array.isArray(playersResult)) {
      await optimizedSportsStorage.storePlayers(sport, 'default', playersResult)
    }

    // Sync standings
    const standingsResult = await apiFallbackStrategy.fetchData('standings', { sport })
    if (Array.isArray(standingsResult)) {
      await optimizedSportsStorage.storeStandings(sport, 'default', standingsResult)
    }
  }

  start(): void {
    this.stats.isRunning = true
    structuredLogger.info('Data sync service started')
  }

  stop(): void {
    this.stats.isRunning = false
    structuredLogger.info('Data sync service stopped')
  }

  getStats(): SyncStats {
    return { ...this.stats }
  }

  getConfig(): DataSyncConfig {
    return { ...this.config }
  }

  updateConfig(updates: Partial<DataSyncConfig>): void {
    // If sports not provided, refresh dynamically from config to avoid hardcodes
    const dynamicSports = SportConfigManager.getSupportedSports()
    this.config = { ...this.config, sports: dynamicSports, ...updates }
    structuredLogger.info('Data sync config updated', { config: this.config })
  }

  isServiceRunning(): boolean {
    return this.stats.isRunning
  }

  resetStats(): void {
    this.stats = {
      totalSyncs: 0,
      successfulSyncs: 0,
      failedSyncs: 0,
      lastSyncTime: null,
      averageSyncTime: 0,
      isRunning: false
    }
  }
}

export const dataSyncService = DataSyncService.getInstance()
