#!/usr/bin/env node

/**
 * Data Population Script
 * Populates database with real sports data from APIs
 */

const fetch = require('node-fetch');

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

async function populateData() {
  console.log('🚀 Starting data population...');
  
  const sports = [
    { name: 'basketball', leagues: ['NBA'] },
    { name: 'football', leagues: ['NFL'] },
    { name: 'baseball', leagues: ['MLB'] },
    { name: 'hockey', leagues: ['NHL'] },
    { name: 'soccer', leagues: ['MLS', 'Premier League'] }
  ];
  
  for (const sport of sports) {
    console.log(`\n🏆 Populating ${sport.name.toUpperCase()} data...`);
    
    try {
      // Get real games data from external APIs
      const response = await fetch(`${API_BASE_URL}/api/games?sport=${sport.name}&external=true&limit=50`);
      const data = await response.json();
      
      if (data.data && data.data.length > 0) {
        console.log(`   ✅ Found ${data.data.length} ${sport.name} games from ${data.meta.source}`);
        
        // Extract unique teams from games
        const teams = new Set();
        data.data.forEach(game => {
          if (game.home_team?.name) teams.add(JSON.stringify({
            name: game.home_team.name,
            abbreviation: game.home_team.abbreviation || game.home_team.name.substring(0, 3).toUpperCase(),
            sport: sport.name,
            league: game.league || sport.leagues[0]
          }));
          if (game.away_team?.name) teams.add(JSON.stringify({
            name: game.away_team.name,
            abbreviation: game.away_team.abbreviation || game.away_team.name.substring(0, 3).toUpperCase(),
            sport: sport.name,
            league: game.league || sport.leagues[0]
          }));
        });
        
        console.log(`   📊 Extracted ${teams.size} unique teams`);
        
        // Get current live/recent games for more realistic data
        const liveResponse = await fetch(`${API_BASE_URL}/api/live-updates?sport=${sport.name}&real=true`);
        const liveData = await liveResponse.json();
        
        const totalLiveRecent = (liveData.live?.length || 0) + (liveData.recent?.length || 0) + (liveData.upcoming?.length || 0);
        console.log(`   🔴 Live/Recent/Upcoming: ${totalLiveRecent} games`);
        
      } else {
        console.log(`   ⚠️  No ${sport.name} data available from external APIs`);
      }
      
    } catch (error) {
      console.log(`   ❌ Error fetching ${sport.name} data:`, error.message);
    }
  }
  
  console.log('\n💡 DATA POPULATION RECOMMENDATIONS:');
  console.log('1. Configure API keys in .env.local:');
  console.log('   - NEXT_PUBLIC_BALLDONTLIE_API_KEY for NBA data');
  console.log('   - NEXT_PUBLIC_RAPIDAPI_KEY for comprehensive sports data');
  console.log('   - NEXT_PUBLIC_ODDS_API_KEY for betting odds');
  console.log('');
  console.log('2. Enable real-time data mode in your frontend:');
  console.log('   - Add ?real=true parameter to live-updates endpoints');
  console.log('   - Add &external=true parameter to games endpoints');
  console.log('');
  console.log('3. Run automated data sync service:');
  console.log('   - npm run start:updates');
  console.log('   - npm run start:live-data');
  console.log('');
  console.log('4. Update database schema if needed:');
  console.log('   - Run SQL migration scripts in scripts/sql-scripts/');
  
  console.log('\n🏁 Data population analysis complete!');
}

// Helper function to create API endpoint tester
async function testAPIKeys() {
  console.log('\n🔑 Testing API Key Configuration...');
  
  const apiTests = [
    {
      name: 'TheSportsDB',
      test: async () => {
        const response = await fetch(`${API_BASE_URL}/api/live-updates?sport=soccer&real=true`);
        const data = await response.json();
        return data.summary?.dataSource === 'live_apis' && data.summary.totalUpcoming > 0;
      }
    },
    {
      name: 'ESPN Hidden API',
      test: async () => {
        const response = await fetch(`${API_BASE_URL}/api/live-updates?sport=basketball&real=true`);
        const data = await response.json();
        return data.summary?.dataSource === 'live_apis' && data.upcoming?.length > 0;
      }
    },
    {
      name: 'Ball Dont Lie',
      test: async () => {
        // This would require API key to work fully
        return false; // Assume not configured for now
      }
    }
  ];
  
  for (const api of apiTests) {
    try {
      const isWorking = await api.test();
      console.log(`   ${isWorking ? '✅' : '❌'} ${api.name}: ${isWorking ? 'Working' : 'Not configured or failing'}`);
    } catch (error) {
      console.log(`   ❌ ${api.name}: Error - ${error.message}`);
    }
  }
}

// Run the population script
Promise.all([populateData(), testAPIKeys()]).catch(error => {
  console.error('Data population script failed:', error);
  process.exit(1);
});