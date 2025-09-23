#!/usr/bin/env node

/**
 * Standalone Sports Data Sync Script
 * Can be run independently or via GitHub Actions
 */

const path = require('path');
const { backgroundSyncService } = require('../dist/server/services/background-sync-service.js');

async function runSync() {
  console.log('🚀 Starting sports data sync...');
  console.log('⏰ Timestamp:', new Date().toISOString());
  
  try {
    // Start the background sync service
    await backgroundSyncService.start();
    
    console.log('✅ Background sync service started');
    console.log('⏳ Waiting for initial sync to complete...');
    
    // Wait for initial sync to complete (adjust time as needed)
    await new Promise(resolve => setTimeout(resolve, 60000)); // 60 seconds
    
    console.log('✅ Sync completed successfully');
    console.log('📊 Stats:', backgroundSyncService.getStats());
    
    // Stop the service
    await backgroundSyncService.stop();
    console.log('🛑 Background sync service stopped');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Sync failed:', error);
    console.error('Stack trace:', error.stack);
    
    // Try to stop the service even if it failed
    try {
      await backgroundSyncService.stop();
    } catch (stopError) {
      console.error('Failed to stop service:', stopError);
    }
    
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Received SIGINT, shutting down gracefully...');
  try {
    await backgroundSyncService.stop();
    process.exit(0);
  } catch (error) {
    console.error('Error during shutdown:', error);
    process.exit(1);
  }
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
  try {
    await backgroundSyncService.stop();
    process.exit(0);
  } catch (error) {
    console.error('Error during shutdown:', error);
    process.exit(1);
  }
});

// Run the sync
runSync();
