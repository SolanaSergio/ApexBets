#!/usr/bin/env node

/**
 * Verify No Mock Data Script
 * This script will test all API endpoints and verify no mock data is being returned
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

console.log('🔍 ApexBets Mock Data Verification');
console.log('===================================\n');

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Test API endpoints
const BASE_URL = 'http://localhost:3000';

async function testEndpoint(endpoint, description) {
  try {
    console.log(`Testing ${description}...`);
    const response = await fetch(`${BASE_URL}${endpoint}`);
    
    if (!response.ok) {
      console.log(`❌ ${description}: HTTP ${response.status}`);
      return false;
    }
    
    const data = await response.json();
    
    // Check for mock data patterns
    const mockPatterns = [
      'mock',
      'Mock',
      'MOCK',
      'placeholder',
      'Placeholder',
      'PLACEHOLDER',
      'fake',
      'Fake',
      'FAKE',
      'dummy',
      'Dummy',
      'DUMMY',
      'test',
      'Test',
      'TEST',
      'sample',
      'Sample',
      'SAMPLE'
    ];
    
    const dataString = JSON.stringify(data).toLowerCase();
    const foundMockData = mockPatterns.filter(pattern => 
      dataString.includes(pattern.toLowerCase())
    );
    
    if (foundMockData.length > 0) {
      console.log(`⚠️  ${description}: Potential mock data found: ${foundMockData.join(', ')}`);
      return false;
    }
    
    console.log(`✅ ${description}: No mock data detected`);
    return true;
  } catch (error) {
    console.log(`❌ ${description}: Error - ${error.message}`);
    return false;
  }
}

async function testDatabaseData() {
  console.log('\n📊 Testing Database Data...');
  
  try {
    // Test teams
    const { data: teams, error: teamsError } = await supabase
      .from('teams')
      .select('*')
      .limit(5);
    
    if (teamsError) {
      console.log('❌ Teams: Database error -', teamsError.message);
      return false;
    }
    
    if (!teams || teams.length === 0) {
      console.log('⚠️  Teams: No data found');
      return false;
    }
    
    console.log(`✅ Teams: ${teams.length} records found`);
    
    // Test games
    const { data: games, error: gamesError } = await supabase
      .from('games')
      .select('*')
      .limit(5);
    
    if (gamesError) {
      console.log('❌ Games: Database error -', gamesError.message);
      return false;
    }
    
    if (!games || games.length === 0) {
      console.log('⚠️  Games: No data found');
      return false;
    }
    
    console.log(`✅ Games: ${games.length} records found`);
    
    // Test predictions
    const { data: predictions, error: predictionsError } = await supabase
      .from('predictions')
      .select('*')
      .limit(5);
    
    if (predictionsError) {
      console.log('❌ Predictions: Database error -', predictionsError.message);
      return false;
    }
    
    if (!predictions || predictions.length === 0) {
      console.log('⚠️  Predictions: No data found');
      return false;
    }
    
    console.log(`✅ Predictions: ${predictions.length} records found`);
    
    return true;
  } catch (error) {
    console.log('❌ Database test failed:', error.message);
    return false;
  }
}

async function runTests() {
  console.log('🚀 Starting verification tests...\n');
  
  const endpoints = [
    { path: '/api/health', description: 'Health Check' },
    { path: '/api/teams', description: 'Teams API' },
    { path: '/api/games', description: 'Games API' },
    { path: '/api/predictions', description: 'Predictions API' },
    { path: '/api/analytics/stats', description: 'Analytics Stats API' },
    { path: '/api/analytics/trends', description: 'Trends API' },
    { path: '/api/analytics/odds-analysis', description: 'Odds Analysis API' },
    { path: '/api/analytics/prediction-accuracy', description: 'Prediction Accuracy API' },
    { path: '/api/value-bets', description: 'Value Bets API' },
    { path: '/api/debug/external-apis', description: 'External APIs Debug' }
  ];
  
  let passedTests = 0;
  let totalTests = endpoints.length + 1; // +1 for database test
  
  // Test API endpoints
  for (const endpoint of endpoints) {
    const passed = await testEndpoint(endpoint.path, endpoint.description);
    if (passed) passedTests++;
  }
  
  // Test database data
  const dbPassed = await testDatabaseData();
  if (dbPassed) passedTests++;
  
  console.log('\n📋 Test Results Summary');
  console.log('========================');
  console.log(`Passed: ${passedTests}/${totalTests}`);
  console.log(`Success Rate: ${Math.round((passedTests / totalTests) * 100)}%`);
  
  if (passedTests === totalTests) {
    console.log('\n🎉 All tests passed! No mock data detected.');
    console.log('✅ Your ApexBets website is ready for production!');
  } else {
    console.log('\n⚠️  Some tests failed. Please review the issues above.');
    console.log('🔧 Make sure to:');
    console.log('   1. Start the development server (npm run dev)');
    console.log('   2. Populate the database with real data');
    console.log('   3. Check your environment variables');
  }
}

// Run the tests
runTests().catch(console.error);
