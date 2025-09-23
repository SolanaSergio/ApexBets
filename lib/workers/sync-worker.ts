/**
 * SYNC WORKER
 * Background worker for automated data synchronization
 * Runs independently of the main application
 */

// Removed data-sync-service import - service was deleted as unnecessary

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
    // Data sync service was removed

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
    // Data sync service was removed

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
    const isServiceRunning = false

    console.log('Sync worker health check:', {
      isRunning: this.isRunning,
      serviceRunning: isServiceRunning,
      lastSync: 'N/A',
      totalSynced: 0,
      errors: 0,
      successRate: 0
    })

    // If service is not running but worker is, restart it
    if (this.isRunning && !isServiceRunning) {
      console.log('Data sync service stopped unexpectedly, restarting...')
      // Data sync service was removed
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
      serviceRunning: false,
      stats: { message: 'Data sync service was removed' }
    }
  }
}

// Create and export singleton instance
export const syncWorker = new SyncWorker()

// Auto-start in production
if (process.env.NODE_ENV === 'production') {
  syncWorker.start()
}
