/**
 * COMPREHENSIVE API TEST
 * Tests all API endpoints with the new split architecture
 * NO MOCK DATA - Only real API calls with proper validation
 */

const fetch = require('node-fetch');
const { performance } = require('perf_hooks');

const BASE_URL = 'http://localhost:3000/api';

// Test configuration
const TEST_CONFIG = {
  TIMEOUT: 10000, // 10 second timeout per request
  SPORTS: ['basketball', 'football', 'baseball', 'hockey', 'soccer'],
  RATE_LIMIT_DELAY: 1000 // 1 second delay between requests
};

// Test results storage
const testResults = {
  startTime: null,
  endTime: null,
  totalTests: 0,
  passedTests: 0,
  failedTests: 0,
  errors: [],
  apiHealth: {},
  performance: {}
};

function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : type === 'warning' ? '⚠️' : 'ℹ️';
  console.log(`${prefix} [${timestamp}] ${message}`);
}

async function testApiEndpoint(name, url, expectedStatus = 200, validateData = null) {
  const startTime = performance.now();
  
  try {
    log(`Testing ${name}...`);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: TEST_CONFIG.TIMEOUT
    });
    
    const endTime = performance.now();
    const duration = Math.round(endTime - startTime);
    
    if (response.status === expectedStatus) {
      let data = null;
      try {
        data = await response.json();
      } catch (e) {
        log(`Could not parse JSON response for ${name}`, 'warning');
      }
      
      // Validate data if validator provided
      if (validateData && data) {
        const validation = validateData(data);
        if (!validation.valid) {
          log(`${name} data validation failed: ${validation.error}`, 'error');
          return { success: false, error: validation.error, duration };
        }
      }
      
      log(`${name}: ${response.status} (${duration}ms)`, 'success');
      
      if (data) {
        const dataKeys = Object.keys(data);
        log(`   📊 Response keys: ${dataKeys.join(', ')}`);
        
        // Log data counts for arrays
        dataKeys.forEach(key => {
          if (Array.isArray(data[key])) {
            log(`   📈 ${key}: ${data[key].length} items`);
          }
        });
      }
      
      return { success: true, data, duration, status: response.status };
    } else {
      log(`${name}: Expected ${expectedStatus}, got ${response.status} (${duration}ms)`, 'error');
      return { success: false, error: `Expected ${expectedStatus}, got ${response.status}`, duration };
    }
    
  } catch (error) {
    const endTime = performance.now();
    const duration = Math.round(endTime - startTime);
    log(`${name}: Error - ${error.message} (${duration}ms)`, 'error');
    return { success: false, error: error.message, duration };
  }
}

async function testHealthEndpoints() {
  log('🏥 Testing Health Endpoints...');
  
  const healthTests = [
    {
      name: 'Health Check',
      url: `${BASE_URL}/health`,
      expectedStatus: 200
    },
    {
      name: 'Health Status',
      url: `${BASE_URL}/health/status`,
      expectedStatus: 200
    }
  ];
  
  for (const test of healthTests) {
    const result = await testApiEndpoint(test.name, test.url, test.expectedStatus);
    testResults.apiHealth[test.name.toLowerCase().replace(/\s+/g, '_')] = result;
    testResults.totalTests++;
    if (result.success) testResults.passedTests++;
    else testResults.failedTests++;
    
    // Rate limiting delay
    await new Promise(resolve => setTimeout(resolve, TEST_CONFIG.RATE_LIMIT_DELAY));
  }
}

async function testSportsEndpoints() {
  log('🏀 Testing Sports Endpoints...');
  
  for (const sport of TEST_CONFIG.SPORTS) {
    const result = await testApiEndpoint(
      `Sports API (${sport})`,
      `${BASE_URL}/sports?sport=${sport}`,
      200,
      (data) => {
        if (!data.success) return { valid: false, error: 'Response not successful' };
        if (!data.sources) return { valid: false, error: 'No sources in response' };
        return { valid: true };
      }
    );
    
    testResults.apiHealth[`sports_${sport}`] = result;
    testResults.totalTests++;
    if (result.success) testResults.passedTests++;
    else testResults.failedTests++;
    
    // Rate limiting delay
    await new Promise(resolve => setTimeout(resolve, TEST_CONFIG.RATE_LIMIT_DELAY));
  }
}

async function testDataEndpoints() {
  log('📊 Testing Data Endpoints...');
  
  const dataTests = [
    {
      name: 'Teams API',
      url: `${BASE_URL}/teams`,
      expectedStatus: 200,
      validateData: (data) => {
        if (!data.data || !Array.isArray(data.data)) {
          return { valid: false, error: 'No data array in response' };
        }
        if (data.data.length === 0) {
          return { valid: false, error: 'Empty data array' };
        }
        return { valid: true };
      }
    },
    {
      name: 'Games API',
      url: `${BASE_URL}/games`,
      expectedStatus: 200,
      validateData: (data) => {
        if (!data.data || !Array.isArray(data.data)) {
          return { valid: false, error: 'No data array in response' };
        }
        return { valid: true };
      }
    },
    {
      name: 'Players API',
      url: `${BASE_URL}/players`,
      expectedStatus: 200
    },
    {
      name: 'Standings API',
      url: `${BASE_URL}/standings`,
      expectedStatus: 200
    }
  ];
  
  for (const test of dataTests) {
    const result = await testApiEndpoint(test.name, test.url, test.expectedStatus, test.validateData);
    testResults.apiHealth[test.name.toLowerCase().replace(/\s+/g, '_')] = result;
    testResults.totalTests++;
    if (result.success) testResults.passedTests++;
    else testResults.failedTests++;
    
    // Rate limiting delay
    await new Promise(resolve => setTimeout(resolve, TEST_CONFIG.RATE_LIMIT_DELAY));
  }
}

async function testOddsEndpoints() {
  log('💰 Testing Odds Endpoints...');
  
  for (const sport of TEST_CONFIG.SPORTS) {
    const result = await testApiEndpoint(
      `Odds API (${sport})`,
      `${BASE_URL}/odds/${sport}`,
      200
    );
    
    testResults.apiHealth[`odds_${sport}`] = result;
    testResults.totalTests++;
    if (result.success) testResults.passedTests++;
    else testResults.failedTests++;
    
    // Rate limiting delay
    await new Promise(resolve => setTimeout(resolve, TEST_CONFIG.RATE_LIMIT_DELAY));
  }
}

async function testAnalyticsEndpoints() {
  log('📈 Testing Analytics Endpoints...');
  
  const analyticsTests = [
    {
      name: 'Analytics API',
      url: `${BASE_URL}/analytics`,
      expectedStatus: 200
    },
    {
      name: 'Analytics Stats',
      url: `${BASE_URL}/analytics/stats`,
      expectedStatus: 200
    }
  ];
  
  for (const test of analyticsTests) {
    const result = await testApiEndpoint(test.name, test.url, test.expectedStatus);
    testResults.apiHealth[test.name.toLowerCase().replace(/\s+/g, '_')] = result;
    testResults.totalTests++;
    if (result.success) testResults.passedTests++;
    else testResults.failedTests++;
    
    // Rate limiting delay
    await new Promise(resolve => setTimeout(resolve, TEST_CONFIG.RATE_LIMIT_DELAY));
  }
}

async function runComprehensiveTest() {
  testResults.startTime = performance.now();
  log('🚀 Starting Comprehensive API Test Suite...');
  
  try {
    // Run all test suites
    await testHealthEndpoints();
    await testSportsEndpoints();
    await testDataEndpoints();
    await testOddsEndpoints();
    await testAnalyticsEndpoints();
    
  } catch (error) {
    log(`Test suite error: ${error.message}`, 'error');
    testResults.errors.push(error.message);
  }
  
  testResults.endTime = performance.now();
  const totalDuration = Math.round(testResults.endTime - testResults.startTime);
  
  // Print results
  log('\n📊 COMPREHENSIVE TEST RESULTS:');
  log(`   ⏱️  Total Duration: ${totalDuration}ms`);
  log(`   📈 Total Tests: ${testResults.totalTests}`);
  log(`   ✅ Passed: ${testResults.passedTests}`);
  log(`   ❌ Failed: ${testResults.failedTests}`);
  log(`   📊 Success Rate: ${Math.round((testResults.passedTests / testResults.totalTests) * 100)}%`);
  
  if (testResults.errors.length > 0) {
    log('\n❌ Errors encountered:');
    testResults.errors.forEach(error => log(`   - ${error}`, 'error'));
  }
  
  if (testResults.failedTests === 0) {
    log('\n🎉 All tests passed! The API is working correctly with the new split architecture.');
  } else {
    log('\n⚠️  Some tests failed. Check the server logs for details.');
  }
  
  // Performance summary
  log('\n⚡ Performance Summary:');
  Object.entries(testResults.apiHealth).forEach(([name, result]) => {
    if (result.duration) {
      log(`   ${name}: ${result.duration}ms`);
    }
  });
}

// Run the comprehensive test
runComprehensiveTest().catch(console.error);
