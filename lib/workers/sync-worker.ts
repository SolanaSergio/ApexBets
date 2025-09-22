/**
 * SYNC WORKER
 * Background worker for automated data synchronization
 * Runs independently of the main application
 */

import { dataSyncService } from '../services/data-sync-service'

class SyncWorker {
  private isRunning: boolean = false
  private workerInterval: NodeJS.Timeout | null = null

  constructor() {
    // Auto-start the worker
    this.start()
  }

  /**
   * Start the sync worker
   */
  start(): void {
    if (this.isRunning) {
      console.log('Sync worker is already running')
      return
    }

    console.log('Starting sync worker...')
    this.isRunning = true

    // Start the data sync service
    dataSyncService.start()

    // Set up health check interval
    this.workerInterval = setInterval(() => {
      this.healthCheck()
    }, 60000) // Check every minute

    // Handle graceful shutdown
    process.on('SIGINT', () => this.shutdown())
    process.on('SIGTERM', () => this.shutdown())
  }

  /**
   * Stop the sync worker
   */
  stop(): void {
    if (!this.isRunning) {
      console.log('Sync worker is not running')
      return
    }

    console.log('Stopping sync worker...')
    this.isRunning = false

    // Stop the data sync service
    dataSyncService.stop()

    // Clear the health check interval
    if (this.workerInterval) {
      clearInterval(this.workerInterval)
      this.workerInterval = null
    }
  }

  /**
   * Perform health check
   */
  private healthCheck(): void {
    const stats = dataSyncService.getStats()
    const isServiceRunning = dataSyncService.isServiceRunning()

    console.log('Sync worker health check:', {
      isRunning: this.isRunning,
      serviceRunning: isServiceRunning,
      lastSync: stats.lastSyncTime,
      totalSynced: stats.totalSyncs,
      errors: stats.failedSyncs,
      successRate: stats.totalSyncs > 0 ? Math.round((stats.successfulSyncs / stats.totalSyncs) * 100) : 0
    })

    // If service is not running but worker is, restart it
    if (this.isRunning && !isServiceRunning) {
      console.log('Data sync service stopped unexpectedly, restarting...')
      dataSyncService.start()
    }
  }

  /**
   * Graceful shutdown
   */
  private shutdown(): void {
    console.log('Shutting down sync worker...')
    this.stop()
    process.exit(0)
  }

  /**
   * Get worker status
   */
  getStatus(): {
    isRunning: boolean
    serviceRunning: boolean
    stats: any
  } {
    return {
      isRunning: this.isRunning,
      serviceRunning: dataSyncService.isServiceRunning(),
      stats: dataSyncService.getStats()
    }
  }
}

// Create and export singleton instance
export const syncWorker = new SyncWorker()

// Auto-start in production
if (process.env.NODE_ENV === 'production') {
  syncWorker.start()
}
