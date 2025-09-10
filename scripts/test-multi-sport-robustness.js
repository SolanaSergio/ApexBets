#!/usr/bin/env node

/**
 * Multi-Sport Robustness Test Script
 * This script tests all aspects of your multi-sport website
 */

const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');
require('dotenv').config({ path: '.env.local' });

console.log('🧪 ApexBets Multi-Sport Robustness Test');
console.log('=======================================\n');

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Test configuration
const SPORTS = ['basketball', 'football', 'baseball', 'hockey', 'soccer', 'tennis', 'golf'];
const BASE_URL = 'http://localhost:3000';
const LIVE_DATA_URL = 'http://localhost:3001';

let testResults = {
  passed: 0,
  failed: 0,
  total: 0
};

async function runTest(testName, testFunction) {
  testResults.total++;
  console.log(`\n🧪 Testing: ${testName}`);
  
  try {
    await testFunction();
    console.log(`✅ ${testName}: PASSED`);
    testResults.passed++;
  } catch (error) {
    console.log(`❌ ${testName}: FAILED - ${error.message}`);
    testResults.failed++;
  }
}

async function testDatabaseConnection() {
  const { data, error } = await supabase.from('teams').select('count').limit(1);
  if (error) throw new Error(`Database connection failed: ${error.message}`);
}

async function testMultiSportData() {
  for (const sport of SPORTS) {
    const { data: teams, error: teamsError } = await supabase
      .from('teams')
      .select('*')
      .eq('sport', sport);
    
    if (teamsError) throw new Error(`Error fetching ${sport} teams: ${teamsError.message}`);
    if (!teams || teams.length === 0) throw new Error(`No ${sport} teams found`);
    
    const { data: games, error: gamesError } = await supabase
      .from('games')
      .select('*')
      .eq('sport', sport);
    
    if (gamesError) throw new Error(`Error fetching ${sport} games: ${gamesError.message}`);
    if (!games || games.length === 0) throw new Error(`No ${sport} games found`);
    
    console.log(`   ✅ ${sport}: ${teams.length} teams, ${games.length} games`);
  }
}

async function testAPIEndpoints() {
  const endpoints = [
    '/api/health',
    '/api/teams',
    '/api/games',
    '/api/predictions',
    '/api/analytics/stats',
    '/api/analytics/trends',
    '/api/analytics/odds-analysis',
    '/api/analytics/prediction-accuracy',
    '/api/value-bets'
  ];
  
  for (const endpoint of endpoints) {
    const response = await fetch(`${BASE_URL}${endpoint}`);
    if (!response.ok) throw new Error(`HTTP ${response.status} for ${endpoint}`);
    
    const data = await response.json();
    if (!data) throw new Error(`No data returned from ${endpoint}`);
    
    console.log(`   ✅ ${endpoint}: OK`);
  }
}

async function testSportSpecificEndpoints() {
  for (const sport of SPORTS) {
    const response = await fetch(`${BASE_URL}/api/games?sport=${sport}&limit=5`);
    if (!response.ok) throw new Error(`HTTP ${response.status} for ${sport} games`);
    
    const data = await response.json();
    if (!data.data || data.data.length === 0) throw new Error(`No ${sport} games returned`);
    
    console.log(`   ✅ ${sport} games: ${data.data.length} games found`);
  }
}

async function testLiveDataService() {
  const liveEndpoints = [
    '/api/live/games',
    '/api/live/teams',
    '/api/live/predictions',
    '/api/live/odds',
    '/api/live/analytics',
    '/api/live/health'
  ];
  
  for (const endpoint of liveEndpoints) {
    const response = await fetch(`${LIVE_DATA_URL}${endpoint}`);
    if (!response.ok) throw new Error(`HTTP ${response.status} for ${endpoint}`);
    
    const data = await response.json();
    if (!data.success) throw new Error(`Live data service error for ${endpoint}`);
    
    console.log(`   ✅ ${endpoint}: OK`);
  }
}

async function testSportSpecificLiveData() {
  for (const sport of SPORTS) {
    const response = await fetch(`${LIVE_DATA_URL}/api/live/games?sport=${sport}&limit=5`);
    if (!response.ok) throw new Error(`HTTP ${response.status} for ${sport} live games`);
    
    const data = await response.json();
    if (!data.success) throw new Error(`Live data service error for ${sport} games`);
    
    console.log(`   ✅ ${sport} live games: ${data.data.length} games found`);
  }
}

async function testDataConsistency() {
  // Test that all games have valid team references
  const { data: games, error: gamesError } = await supabase
    .from('games')
    .select(`
      *,
      home_team:teams!games_home_team_id_fkey(id, name),
      away_team:teams!games_away_team_id_fkey(id, name)
    `)
    .limit(100);
  
  if (gamesError) throw new Error(`Error fetching games: ${gamesError.message}`);
  
  for (const game of games) {
    if (!game.home_team) throw new Error(`Game ${game.id} has invalid home team reference`);
    if (!game.away_team) throw new Error(`Game ${game.id} has invalid away team reference`);
    if (game.home_team_id === game.away_team_id) throw new Error(`Game ${game.id} has same team for home and away`);
  }
  
  console.log(`   ✅ Data consistency: ${games.length} games validated`);
}

async function testRealTimeUpdates() {
  // Test that we can get live data
  const response = await fetch(`${LIVE_DATA_URL}/api/live/games?status=live&limit=10`);
  if (!response.ok) throw new Error(`HTTP ${response.status} for live games`);
  
  const data = await response.json();
  if (!data.success) throw new Error(`Live data service error for live games`);
  
  console.log(`   ✅ Real-time updates: ${data.data.length} live games found`);
}

async function testAnalyticsCalculations() {
  // Test that analytics are calculated correctly
  const response = await fetch(`${BASE_URL}/api/analytics/stats`);
  if (!response.ok) throw new Error(`HTTP ${response.status} for analytics stats`);
  
  const data = await response.json();
  if (!data.data) throw new Error(`No analytics data returned`);
  
  // Check that accuracy rate is a valid number
  if (typeof data.data.accuracy_rate !== 'number') {
    throw new Error(`Invalid accuracy rate: ${data.data.accuracy_rate}`);
  }
  
  console.log(`   ✅ Analytics calculations: Accuracy rate ${(data.data.accuracy_rate * 100).toFixed(1)}%`);
}

async function testErrorHandling() {
  // Test that invalid requests are handled gracefully
  const response = await fetch(`${BASE_URL}/api/games?sport=invalid_sport`);
  if (!response.ok) throw new Error(`HTTP ${response.status} for invalid sport`);
  
  const data = await response.json();
  if (!data.data) throw new Error(`No data returned for invalid sport`);
  
  console.log(`   ✅ Error handling: Invalid sport handled gracefully`);
}

async function testPerformance() {
  const startTime = Date.now();
  
  // Test multiple concurrent requests
  const promises = [];
  for (let i = 0; i < 10; i++) {
    promises.push(fetch(`${BASE_URL}/api/health`));
  }
  
  await Promise.all(promises);
  
  const endTime = Date.now();
  const duration = endTime - startTime;
  
  if (duration > 5000) throw new Error(`Performance test failed: ${duration}ms for 10 requests`);
  
  console.log(`   ✅ Performance: ${duration}ms for 10 concurrent requests`);
}

async function runAllTests() {
  console.log('🚀 Starting comprehensive multi-sport robustness tests...\n');
  
  // Database tests
  await runTest('Database Connection', testDatabaseConnection);
  await runTest('Multi-Sport Data', testMultiSportData);
  await runTest('Data Consistency', testDataConsistency);
  
  // API tests
  await runTest('API Endpoints', testAPIEndpoints);
  await runTest('Sport-Specific Endpoints', testSportSpecificEndpoints);
  
  // Live data tests
  await runTest('Live Data Service', testLiveDataService);
  await runTest('Sport-Specific Live Data', testSportSpecificLiveData);
  await runTest('Real-Time Updates', testRealTimeUpdates);
  
  // Analytics tests
  await runTest('Analytics Calculations', testAnalyticsCalculations);
  
  // Error handling tests
  await runTest('Error Handling', testErrorHandling);
  
  // Performance tests
  await runTest('Performance', testPerformance);
  
  // Results summary
  console.log('\n📊 Test Results Summary');
  console.log('========================');
  console.log(`Total Tests: ${testResults.total}`);
  console.log(`Passed: ${testResults.passed}`);
  console.log(`Failed: ${testResults.failed}`);
  console.log(`Success Rate: ${Math.round((testResults.passed / testResults.total) * 100)}%`);
  
  if (testResults.failed === 0) {
    console.log('\n🎉 All tests passed! Your multi-sport website is robust and ready!');
    console.log('✅ Multi-sport support: Working');
    console.log('✅ Real-time data: Working');
    console.log('✅ Live updates: Working');
    console.log('✅ Analytics: Working');
    console.log('✅ Error handling: Working');
    console.log('✅ Performance: Good');
  } else {
    console.log('\n⚠️  Some tests failed. Please review the issues above.');
    console.log('🔧 Make sure to:');
    console.log('   1. Start the development server (npm run dev)');
    console.log('   2. Start the live data service (npm run start-live-data)');
    console.log('   3. Populate the database with data');
    console.log('   4. Check your environment variables');
  }
}

// Run all tests
runAllTests().catch(console.error);
