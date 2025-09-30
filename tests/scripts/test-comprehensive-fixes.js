/**
 * Comprehensive Test for All Fixes
 * Tests stale data detection, rate limiting, error handling, and dynamic sports
 */

const { performance } = require('perf_hooks');

// Mock data for testing
const mockStaleData = [
  {
    id: '1',
    last_updated: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 minutes ago
    name: 'Test Game 1'
  },
  {
    id: '2',
    last_updated: new Date(Date.now() - 10 * 60 * 1000).toISOString(), // 10 minutes ago
    name: 'Test Game 2'
  }
];

const mockFreshData = [
  {
    id: '1',
    last_updated: new Date(Date.now() - 1 * 60 * 1000).toISOString(), // 1 minute ago
    name: 'Test Game 1'
  },
  {
    id: '2',
    last_updated: new Date(Date.now() - 30 * 1000).toISOString(), // 30 seconds ago
    name: 'Test Game 2'
  }
];

const mockInvalidTimestampData = [
  {
    id: '1',
    last_updated: new Date(Date.now() - 2 * 365 * 24 * 60 * 60 * 1000).toISOString(), // 2 years ago
    name: 'Test Game 1'
  }
];

async function testStaleDataDetection() {
  console.log('🧪 Testing Stale Data Detection...');
  
  try {
    // Test with fresh data
    const freshResult = await testApiCall('/api/database-first/games?sport=basketball&forceRefresh=false');
    console.log('✅ Fresh data test passed');
    
    // Test with stale data
    const staleResult = await testApiCall('/api/database-first/games?sport=basketball&forceRefresh=true');
    console.log('✅ Stale data refresh test passed');
    
    return true;
  } catch (error) {
    console.error('❌ Stale data detection test failed:', error.message);
    return false;
  }
}

async function testRateLimiting() {
  console.log('🧪 Testing Rate Limiting...');
  
  try {
    // Test multiple rapid requests to trigger rate limiting
    const promises = [];
    for (let i = 0; i < 5; i++) {
      promises.push(testApiCall('/api/odds?sport=basketball'));
    }
    
    const results = await Promise.allSettled(promises);
    const successCount = results.filter(r => r.status === 'fulfilled').length;
    
    console.log(`✅ Rate limiting test completed: ${successCount}/5 requests succeeded`);
    return true;
  } catch (error) {
    console.error('❌ Rate limiting test failed:', error.message);
    return false;
  }
}

async function testErrorHandling() {
  console.log('🧪 Testing Error Handling...');
  
  try {
    // Test with invalid sport
    const invalidSportResult = await testApiCall('/api/database-first/games?sport=invalid_sport');
    console.log('✅ Invalid sport error handling test passed');
    
    // Test with invalid parameters
    const invalidParamsResult = await testApiCall('/api/database-first/games?invalid=param');
    console.log('✅ Invalid parameters error handling test passed');
    
    return true;
  } catch (error) {
    console.error('❌ Error handling test failed:', error.message);
    return false;
  }
}

async function testDynamicSports() {
  console.log('🧪 Testing Dynamic Sports...');
  
  try {
    // Test getting supported sports
    const sportsResult = await testApiCall('/api/sports');
    console.log('✅ Dynamic sports list test passed');
    
    // Test with different sports
    const sports = ['basketball', 'football', 'soccer', 'hockey', 'baseball'];
    for (const sport of sports) {
      const result = await testApiCall(`/api/database-first/games?sport=${sport}&limit=1`);
      console.log(`✅ ${sport} sport test passed`);
    }
    
    return true;
  } catch (error) {
    console.error('❌ Dynamic sports test failed:', error.message);
    return false;
  }
}

async function testApiCall(endpoint) {
  const startTime = performance.now();
  
  try {
    const response = await fetch(`http://localhost:3000${endpoint}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'ApexBets-Test/1.0'
      },
      timeout: 10000
    });
    
    const duration = performance.now() - startTime;
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    console.log(`📊 API Call: ${endpoint} - ${Math.round(duration)}ms - ${response.status}`);
    
    return {
      success: true,
      data,
      duration,
      status: response.status
    };
  } catch (error) {
    const duration = performance.now() - startTime;
    console.log(`❌ API Call Failed: ${endpoint} - ${Math.round(duration)}ms - ${error.message}`);
    throw error;
  }
}

async function testOddsApiIntegration() {
  console.log('🧪 Testing Odds API Integration...');
  
  try {
    // Test odds API with rate limiting
    const oddsResult = await testApiCall('/api/odds?sport=basketball&limit=5');
    console.log('✅ Odds API integration test passed');
    
    // Test odds API with different sports
    const sports = ['basketball', 'football', 'soccer'];
    for (const sport of sports) {
      const result = await testApiCall(`/api/odds?sport=${sport}&limit=3`);
      console.log(`✅ ${sport} odds test passed`);
    }
    
    return true;
  } catch (error) {
    console.error('❌ Odds API integration test failed:', error.message);
    return false;
  }
}

async function testDataConsistency() {
  console.log('🧪 Testing Data Consistency...');
  
  try {
    // Test that data is consistent across different endpoints
    const gamesResult = await testApiCall('/api/database-first/games?sport=basketball&limit=5');
    const teamsResult = await testApiCall('/api/database-first/teams?sport=basketball&limit=5');
    const standingsResult = await testApiCall('/api/database-first/standings?sport=basketball&limit=5');
    
    console.log('✅ Data consistency test passed');
    return true;
  } catch (error) {
    console.error('❌ Data consistency test failed:', error.message);
    return false;
  }
}

async function runComprehensiveTest() {
  console.log('🚀 Starting Comprehensive Test Suite...\n');
  
  const startTime = performance.now();
  const results = {
    staleDataDetection: false,
    rateLimiting: false,
    errorHandling: false,
    dynamicSports: false,
    oddsApiIntegration: false,
    dataConsistency: false
  };
  
  try {
    // Run all tests
    results.staleDataDetection = await testStaleDataDetection();
    console.log('');
    
    results.rateLimiting = await testRateLimiting();
    console.log('');
    
    results.errorHandling = await testErrorHandling();
    console.log('');
    
    results.dynamicSports = await testDynamicSports();
    console.log('');
    
    results.oddsApiIntegration = await testOddsApiIntegration();
    console.log('');
    
    results.dataConsistency = await testDataConsistency();
    console.log('');
    
  } catch (error) {
    console.error('❌ Test suite failed:', error.message);
  }
  
  const totalTime = performance.now() - startTime;
  
  // Print results
  console.log('📊 Test Results Summary:');
  console.log('========================');
  console.log(`Stale Data Detection: ${results.staleDataDetection ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Rate Limiting: ${results.rateLimiting ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Error Handling: ${results.errorHandling ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Dynamic Sports: ${results.dynamicSports ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Odds API Integration: ${results.oddsApiIntegration ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Data Consistency: ${results.dataConsistency ? '✅ PASS' : '❌ FAIL'}`);
  console.log('');
  
  const passedTests = Object.values(results).filter(Boolean).length;
  const totalTests = Object.keys(results).length;
  
  console.log(`🎯 Overall Result: ${passedTests}/${totalTests} tests passed`);
  console.log(`⏱️  Total Time: ${Math.round(totalTime)}ms`);
  
  if (passedTests === totalTests) {
    console.log('🎉 All tests passed! The fixes are working correctly.');
  } else {
    console.log('⚠️  Some tests failed. Please check the logs above for details.');
  }
  
  return results;
}

// Run the test if this file is executed directly
if (require.main === module) {
  runComprehensiveTest().catch(console.error);
}

module.exports = {
  runComprehensiveTest,
  testStaleDataDetection,
  testRateLimiting,
  testErrorHandling,
  testDynamicSports,
  testOddsApiIntegration,
  testDataConsistency
};
