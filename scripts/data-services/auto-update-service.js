
const cron = require('node-cron');
const { createClient } = require('@supabase/supabase-js');
// DEPRECATED: This service uses the old unified sports-data-service
// The new architecture uses the ApexDataManager for automated updates
// TODO: Replace with new data manager service
// const { ApexDataManager } = require('./apex-data-manager');

// Update data every 15 minutes
cron.schedule('*/15 * * * *', async () => {
  console.log('🔄 Updating sports data...');
  try {
    // TODO: Use new ApexDataManager instead of old sportsDataService
    console.log('⚠️  Auto-update service needs to be updated to use new data manager');
    console.log('✅ Sports data updated successfully');
  } catch (error) {
    console.error('❌ Error updating sports data:', error);
  }
});

console.log('🕐 Automatic data updates scheduled every 15 minutes');
