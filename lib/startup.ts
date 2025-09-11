/**
 * STARTUP SCRIPT
 * Initializes automated data synchronization on application startup
 */

import { dataSyncService } from './services/data-sync-service'

export function initializeDataSync() {
  // Only start in production or when explicitly enabled
  if (process.env.NODE_ENV === 'production' || process.env.ENABLE_AUTO_SYNC === 'true') {
    console.log('Initializing automated data synchronization...')
    
    // Configure sync service
    dataSyncService.updateConfig({
      enabled: true,
      interval: 5 * 60 * 1000, // 5 minutes
      batchSize: 50,
      retryAttempts: 3,
      retryDelay: 1000
    })

    // Start the service
    dataSyncService.start()

    console.log('Automated data synchronization started')
  } else {
    console.log('Auto sync disabled in development mode')
  }
}

// Auto-initialize when this module is imported
initializeDataSync()
