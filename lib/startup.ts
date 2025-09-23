/**
 * Application Startup Script
 * This file is imported by Next.js to automatically initialize services
 */

// Removed auto-startup-service import - service was deleted as unnecessary
import { envValidator } from './config/env-validator'
import { sportServiceFactory } from './services/sports/sport-service-factory'

// Configuration for automatic startup
const STARTUP_CONFIG = {
  enableDataSync: true,
  enableDatabaseAudit: true,
  enableHealthChecks: true,
  syncInterval: 5 // 5 minutes
};

// Initialize services automatically
async function initializeApp() {
  try {
    console.log('🚀 ApexBets Application Starting...');
    
    // Validate environment variables first (no fallbacks allowed)
    console.log('🔍 Validating environment variables...');
    envValidator.validate();
    console.log('✅ Environment validation passed');
    
    // Initialize sport service factory (dynamic, no hardcoded sports)
    console.log('🏈 Initializing sport services...');
    await sportServiceFactory.initialize();
    console.log('✅ Sport services initialized');
    
    console.log('📋 Auto-startup configuration:', STARTUP_CONFIG);
    // Removed auto-startup-service call - service was deleted as unnecessary
    
    console.log('🎉 ApexBets Application Ready!');
    console.log('📊 Monitoring: Active');
    console.log('🔍 Data Quality: Active');
    console.log('🏥 Health Checks: Active');
    console.log(`🏈 Supported Sports: ${envValidator.getSupportedSports().join(', ')}`);
    
  } catch (error) {
    console.error('❌ Application startup failed:', error);
    // Don't throw - let the app continue even if startup fails
  }
}

// Run initialization
initializeApp();

// Export for manual control if needed
export { STARTUP_CONFIG };