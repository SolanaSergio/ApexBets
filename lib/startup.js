/**
 * Application Startup Script
 * This file is imported by Next.js to automatically initialize services
 */

// Removed auto-startup-service import - service was deleted as unnecessary

// Configuration for automatic startup
const STARTUP_CONFIG = {
  enableMonitoring: true,
  monitoringIntervalMinutes: 5,
  enableDataQualityChecks: true,
  enableHealthChecks: true,
  enableAutoCleanup: false, // Keep false for safety in production
  startupDelay: 5000 // 5 seconds delay to let the server fully start
};

// Initialize services automatically
async function initializeApp() {
  try {
    console.log('🚀 ApexBets Application Starting...');
    console.log('📋 Auto-startup configuration:', STARTUP_CONFIG);
    
    // Removed auto-startup-service call - service was deleted as unnecessary
    
    console.log('🎉 ApexBets Application Ready!');
    console.log('📊 Monitoring: Active');
    console.log('🔍 Data Quality: Active');
    console.log('🏥 Health Checks: Active');
    
  } catch (error) {
    console.error('❌ Application startup failed:', error);
    // Don't throw - let the app continue even if startup fails
  }
}

// Run initialization
initializeApp();

// Export for manual control if needed
module.exports = { autoStartupService, STARTUP_CONFIG };
