
const cron = require('node-cron');
const { createClient } = require('@supabase/supabase-js');
const { sportsDataService } = require('./lib/services/sports-data-service');

// Update data every 15 minutes
cron.schedule('*/15 * * * *', async () => {
  console.log('🔄 Updating sports data...');
  try {
    await sportsDataService.updateAllSportsData();
    console.log('✅ Sports data updated successfully');
  } catch (error) {
    console.error('❌ Error updating sports data:', error);
  }
});

console.log('🕐 Automatic data updates scheduled every 15 minutes');
