/**
 * SYNC WORKER
 * Event-driven worker for data synchronization
 * Vercel-compatible: No background intervals or cron jobs
 */

class SyncWorker {
  private isRunning: boolean = false

  constructor() {
    // Initialize worker but don't auto-start background processes
    this.initialize()
  }

  /**
   * Initialize the sync worker
   */
  private initialize(): void {
    console.log('Initializing sync worker...')
    this.isRunning = true

    // Handle graceful shutdown
    process.on('SIGINT', () => this.shutdown())
    process.on('SIGTERM', () => this.shutdown())
  }

  /**
   * Start manual sync process
   */
  async startSync(sport?: string): Promise<void> {
    if (!this.isRunning) {
      console.log('Sync worker is not initialized')
      return
    }

    console.log('Starting manual sync process...', { sport })
    
    try {
      // Trigger sync via API endpoint instead of background process
      const response = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sport, force: true })
      })
      
      if (response.ok) {
        console.log('Sync process completed successfully')
      } else {
        console.error('Sync process failed:', await response.text())
      }
    } catch (error) {
      console.error('Sync process error:', error)
    }
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
  }

  /**
   * Perform health check
   */
  async healthCheck(): Promise<{
    isRunning: boolean
    lastSync: string
    stats: any
  }> {
    console.log('Sync worker health check:', {
      isRunning: this.isRunning,
      lastSync: 'Manual sync only',
      totalSynced: 0,
      errors: 0,
      successRate: 0,
    })

    return {
      isRunning: this.isRunning,
      lastSync: 'Manual sync only',
      stats: { message: 'Event-driven sync worker' },
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
      stats: { message: 'Event-driven sync worker' },
    }
  }
}

// Create and export singleton instance
export const syncWorker = new SyncWorker()

// Note: No auto-start in production - Vercel doesn't support background processes
