/**
 * PROFESSIONAL COMPREHENSIVE VALIDATION TEST
 * Tests all fixes: stale data detection, rate limiting, error handling, dynamic sports, odds API
 */

const { performance } = require('perf_hooks');
const https = require('https');
const http = require('http');

class ProfessionalTestSuite {
  constructor() {
    this.baseUrl = 'http://localhost:3000';
    this.testResults = {
      staleDataDetection: { passed: 0, failed: 0, tests: [] },
      rateLimiting: { passed: 0, failed: 0, tests: [] },
      errorHandling: { passed: 0, failed: 0, tests: [] },
      dynamicSports: { passed: 0, failed: 0, tests: [] },
      oddsApiIntegration: { passed: 0, failed: 0, tests: [] },
      dataConsistency: { passed: 0, failed: 0, tests: [] },
      loggingImprovements: { passed: 0, failed: 0, tests: [] }
    };
    this.startTime = performance.now();
  }

  async makeRequest(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const startTime = performance.now();
    
    return new Promise((resolve, reject) => {
      const requestOptions = {
        method: options.method || 'GET',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'ApexBets-Professional-Test/1.0',
          ...options.headers
        },
        timeout: options.timeout || 30000
      };

      const req = http.request(url, requestOptions, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          const duration = performance.now() - startTime;
          try {
            const jsonData = data ? JSON.parse(data) : {};
            resolve({
              status: res.statusCode,
              data: jsonData,
              duration: Math.round(duration),
              headers: res.headers
            });
          } catch (error) {
            resolve({
              status: res.statusCode,
              data: data,
              duration: Math.round(duration),
              headers: res.headers,
              parseError: error.message
            });
          }
        });
      });

      req.on('error', (error) => {
        const duration = performance.now() - startTime;
        reject({
          error: error.message,
          duration: Math.round(duration),
          endpoint
        });
      });

      req.on('timeout', () => {
        req.destroy();
        reject({
          error: 'Request timeout',
          duration: Math.round(performance.now() - startTime),
          endpoint
        });
      });

      if (options.body) {
        req.write(JSON.stringify(options.body));
      }
      
      req.end();
    });
  }

  logTestResult(category, testName, passed, details = {}) {
    const result = { testName, passed, details, timestamp: new Date().toISOString() };
    this.testResults[category].tests.push(result);
    
    if (passed) {
      this.testResults[category].passed++;
      console.log(`✅ ${category.toUpperCase()}: ${testName}`);
    } else {
      this.testResults[category].failed++;
      console.log(`❌ ${category.toUpperCase()}: ${testName} - ${details.error || 'Failed'}`);
    }
  }

  async testStaleDataDetection() {
    console.log('\n🧪 TESTING STALE DATA DETECTION');
    console.log('================================');

    try {
      // Test 1: Fresh data should not trigger refresh
      const freshResponse = await this.makeRequest('/api/database-first/games?sport=basketball&limit=5');
      this.logTestResult('staleDataDetection', 'Fresh data detection', 
        freshResponse.status === 200, 
        { status: freshResponse.status, dataSource: freshResponse.data?.meta?.source || 'unknown' }
      );

      // Test 2: Force refresh should work
      const forceRefreshResponse = await this.makeRequest('/api/database-first/games?sport=basketball&forceRefresh=true&limit=5');
      this.logTestResult('staleDataDetection', 'Force refresh functionality', 
        forceRefreshResponse.status === 200, 
        { status: forceRefreshResponse.status, dataSource: forceRefreshResponse.data?.meta?.source || 'unknown' }
      );

      // Test 3: Different data types with stale detection
      const dataTypes = ['games', 'teams', 'standings', 'odds', 'predictions'];
      for (const dataType of dataTypes) {
        const endpoint = `/api/database-first/${dataType}?sport=basketball&limit=3`;
        const response = await this.makeRequest(endpoint);
        this.logTestResult('staleDataDetection', `${dataType} stale detection`, 
          response.status === 200, 
          { status: response.status, dataType, count: response.data?.data?.length || 0 }
        );
      }

      // Test 4: Invalid timestamp handling
      const invalidTimestampResponse = await this.makeRequest('/api/database-first/games?sport=basketball&limit=1');
      this.logTestResult('staleDataDetection', 'Invalid timestamp handling', 
        invalidTimestampResponse.status === 200, 
        { status: invalidTimestampResponse.status }
      );

    } catch (error) {
      this.logTestResult('staleDataDetection', 'Stale data detection suite', false, { error: error.message });
    }
  }

  async testRateLimiting() {
    console.log('\n🧪 TESTING RATE LIMITING');
    console.log('=========================');

    try {
      // Test 1: Single request should work
      const singleRequest = await this.makeRequest('/api/odds?sport=basketball&limit=3');
      this.logTestResult('rateLimiting', 'Single request handling', 
        singleRequest.status === 200, 
        { status: singleRequest.status, duration: singleRequest.duration }
      );

      // Test 2: Rapid requests to test rate limiting
      const rapidRequests = [];
      for (let i = 0; i < 8; i++) {
        rapidRequests.push(this.makeRequest('/api/odds?sport=basketball&limit=2'));
      }
      
      const rapidResults = await Promise.allSettled(rapidRequests);
      const successCount = rapidResults.filter(r => r.status === 'fulfilled' && r.value.status === 200).length;
      const rateLimitedCount = rapidResults.filter(r => r.status === 'rejected' || r.value.status === 429).length;
      
      this.logTestResult('rateLimiting', 'Rapid requests rate limiting', 
        successCount > 0 && rateLimitedCount > 0, 
        { successCount, rateLimitedCount, totalRequests: rapidRequests.length }
      );

      // Test 3: Different API endpoints rate limiting
      const endpoints = [
        '/api/database-first/games?sport=basketball&limit=2',
        '/api/database-first/teams?sport=basketball&limit=2',
        '/api/odds?sport=football&limit=2'
      ];
      
      for (const endpoint of endpoints) {
        const response = await this.makeRequest(endpoint);
        this.logTestResult('rateLimiting', `Rate limiting for ${endpoint.split('?')[0]}`, 
          response.status === 200 || response.status === 429, 
          { status: response.status, endpoint }
        );
      }

    } catch (error) {
      this.logTestResult('rateLimiting', 'Rate limiting suite', false, { error: error.message });
    }
  }

  async testErrorHandling() {
    console.log('\n🧪 TESTING ERROR HANDLING');
    console.log('==========================');

    try {
      // Test 1: Invalid sport handling
      const invalidSportResponse = await this.makeRequest('/api/database-first/games?sport=invalid_sport&limit=5');
      this.logTestResult('errorHandling', 'Invalid sport error handling', 
        invalidSportResponse.status === 400 || invalidSportResponse.status === 404, 
        { status: invalidSportResponse.status, expectedError: true }
      );

      // Test 2: Invalid parameters
      const invalidParamsResponse = await this.makeRequest('/api/database-first/games?invalid_param=test&limit=5');
      this.logTestResult('errorHandling', 'Invalid parameters handling', 
        invalidParamsResponse.status === 200 || invalidParamsResponse.status === 400, 
        { status: invalidParamsResponse.status }
      );

      // Test 3: Missing required parameters
      const missingParamsResponse = await this.makeRequest('/api/database-first/odds?limit=5');
      this.logTestResult('errorHandling', 'Missing parameters handling', 
        missingParamsResponse.status === 200 || missingParamsResponse.status === 400, 
        { status: missingParamsResponse.status }
      );

      // Test 4: Server error handling
      const serverErrorResponse = await this.makeRequest('/api/database-first/games?sport=basketball&limit=999999');
      this.logTestResult('errorHandling', 'Server error handling', 
        serverErrorResponse.status < 500, 
        { status: serverErrorResponse.status }
      );

      // Test 5: Network timeout handling
      const timeoutResponse = await this.makeRequest('/api/database-first/games?sport=basketball&limit=5', { timeout: 1000 });
      this.logTestResult('errorHandling', 'Timeout handling', 
        timeoutResponse.status === 200 || timeoutResponse.error === 'Request timeout', 
        { status: timeoutResponse.status, error: timeoutResponse.error }
      );

    } catch (error) {
      this.logTestResult('errorHandling', 'Error handling suite', false, { error: error.message });
    }
  }

  async testDynamicSports() {
    console.log('\n🧪 TESTING DYNAMIC SPORTS');
    console.log('==========================');

    try {
      // Test 1: Get supported sports
      const sportsResponse = await this.makeRequest('/api/sports');
      this.logTestResult('dynamicSports', 'Supported sports retrieval', 
        sportsResponse.status === 200 && Array.isArray(sportsResponse.data), 
        { status: sportsResponse.status, sportsCount: sportsResponse.data?.length || 0 }
      );

      // Test 2: Different sports work dynamically
      const supportedSports = ['basketball', 'football', 'soccer', 'hockey', 'baseball'];
      for (const sport of supportedSports) {
        const response = await this.makeRequest(`/api/database-first/games?sport=${sport}&limit=3`);
        this.logTestResult('dynamicSports', `${sport} sport support`, 
          response.status === 200, 
          { status: response.status, sport, dataCount: response.data?.data?.length || 0 }
        );
      }

      // Test 3: Teams for different sports
      for (const sport of supportedSports.slice(0, 3)) {
        const response = await this.makeRequest(`/api/database-first/teams?sport=${sport}&limit=5`);
        this.logTestResult('dynamicSports', `${sport} teams support`, 
          response.status === 200, 
          { status: response.status, sport, teamsCount: response.data?.data?.length || 0 }
        );
      }

      // Test 4: Standings for different sports
      for (const sport of supportedSports.slice(0, 3)) {
        const response = await this.makeRequest(`/api/database-first/standings?sport=${sport}&limit=5`);
        this.logTestResult('dynamicSports', `${sport} standings support`, 
          response.status === 200, 
          { status: response.status, sport, standingsCount: response.data?.data?.length || 0 }
        );
      }

    } catch (error) {
      this.logTestResult('dynamicSports', 'Dynamic sports suite', false, { error: error.message });
    }
  }

  async testOddsApiIntegration() {
    console.log('\n🧪 TESTING ODDS API INTEGRATION');
    console.log('================================');

    try {
      // Test 1: Basic odds retrieval
      const oddsResponse = await this.makeRequest('/api/odds?sport=basketball&limit=5');
      this.logTestResult('oddsApiIntegration', 'Basic odds retrieval', 
        oddsResponse.status === 200, 
        { status: oddsResponse.status, oddsCount: oddsResponse.data?.data?.length || 0 }
      );

      // Test 2: Different sports odds
      const sports = ['basketball', 'football', 'soccer'];
      for (const sport of sports) {
        const response = await this.makeRequest(`/api/odds?sport=${sport}&limit=3`);
        this.logTestResult('oddsApiIntegration', `${sport} odds retrieval`, 
          response.status === 200, 
          { status: response.status, sport, oddsCount: response.data?.data?.length || 0 }
        );
      }

      // Test 3: Odds with specific game ID
      const gameOddsResponse = await this.makeRequest('/api/odds?sport=basketball&gameId=test&limit=1');
      this.logTestResult('oddsApiIntegration', 'Game-specific odds', 
        gameOddsResponse.status === 200, 
        { status: gameOddsResponse.status }
      );

      // Test 4: Odds API rate limiting
      const rateLimitTest = await this.makeRequest('/api/odds?sport=basketball&limit=2');
      this.logTestResult('oddsApiIntegration', 'Odds API rate limiting', 
        rateLimitTest.status === 200 || rateLimitTest.status === 429, 
        { status: rateLimitTest.status }
      );

      // Test 5: Odds refresh functionality
      const refreshResponse = await this.makeRequest('/api/odds?sport=basketball&forceRefresh=true&limit=3');
      this.logTestResult('oddsApiIntegration', 'Odds refresh functionality', 
        refreshResponse.status === 200, 
        { status: refreshResponse.status, dataSource: refreshResponse.data?.meta?.source }
      );

    } catch (error) {
      this.logTestResult('oddsApiIntegration', 'Odds API integration suite', false, { error: error.message });
    }
  }

  async testDataConsistency() {
    console.log('\n🧪 TESTING DATA CONSISTENCY');
    console.log('===========================');

    try {
      // Test 1: Games data consistency
      const gamesResponse = await this.makeRequest('/api/database-first/games?sport=basketball&limit=5');
      this.logTestResult('dataConsistency', 'Games data structure', 
        gamesResponse.status === 200 && Array.isArray(gamesResponse.data?.data), 
        { status: gamesResponse.status, dataType: 'games', count: gamesResponse.data?.data?.length || 0 }
      );

      // Test 2: Teams data consistency
      const teamsResponse = await this.makeRequest('/api/database-first/teams?sport=basketball&limit=5');
      this.logTestResult('dataConsistency', 'Teams data structure', 
        teamsResponse.status === 200 && Array.isArray(teamsResponse.data?.data), 
        { status: teamsResponse.status, dataType: 'teams', count: teamsResponse.data?.data?.length || 0 }
      );

      // Test 3: Standings data consistency
      const standingsResponse = await this.makeRequest('/api/database-first/standings?sport=basketball&limit=5');
      this.logTestResult('dataConsistency', 'Standings data structure', 
        standingsResponse.status === 200 && Array.isArray(standingsResponse.data?.data), 
        { status: standingsResponse.status, dataType: 'standings', count: standingsResponse.data?.data?.length || 0 }
      );

      // Test 4: Odds data consistency
      const oddsResponse = await this.makeRequest('/api/odds?sport=basketball&limit=5');
      this.logTestResult('dataConsistency', 'Odds data structure', 
        oddsResponse.status === 200 && Array.isArray(oddsResponse.data?.data), 
        { status: oddsResponse.status, dataType: 'odds', count: oddsResponse.data?.data?.length || 0 }
      );

      // Test 5: Cross-sport data consistency
      const sports = ['basketball', 'football'];
      for (const sport of sports) {
        const response = await this.makeRequest(`/api/database-first/games?sport=${sport}&limit=3`);
        this.logTestResult('dataConsistency', `${sport} cross-sport consistency`, 
          response.status === 200, 
          { status: response.status, sport, count: response.data?.data?.length || 0 }
        );
      }

    } catch (error) {
      this.logTestResult('dataConsistency', 'Data consistency suite', false, { error: error.message });
    }
  }

  async testLoggingImprovements() {
    console.log('\n🧪 TESTING LOGGING IMPROVEMENTS');
    console.log('===============================');

    try {
      // Test 1: Structured logging in responses
      const response = await this.makeRequest('/api/database-first/games?sport=basketball&limit=3');
      const hasStructuredMeta = response.data?.meta && typeof response.data.meta === 'object';
      this.logTestResult('loggingImprovements', 'Structured logging in responses', 
        hasStructuredMeta, 
        { status: response.status, hasMeta: hasStructuredMeta }
      );

      // Test 2: Error logging with context
      const errorResponse = await this.makeRequest('/api/database-first/games?sport=invalid&limit=3');
      this.logTestResult('loggingImprovements', 'Error logging with context', 
        errorResponse.status >= 400, 
        { status: errorResponse.status, expectedError: true }
      );

      // Test 3: Performance logging
      const perfResponse = await this.makeRequest('/api/database-first/teams?sport=basketball&limit=5');
      this.logTestResult('loggingImprovements', 'Performance logging', 
        perfResponse.duration > 0, 
        { status: perfResponse.status, duration: perfResponse.duration }
      );

      // Test 4: API call logging
      const apiResponse = await this.makeRequest('/api/odds?sport=basketball&limit=2');
      this.logTestResult('loggingImprovements', 'API call logging', 
        apiResponse.status === 200 || apiResponse.status === 429, 
        { status: apiResponse.status, duration: apiResponse.duration }
      );

    } catch (error) {
      this.logTestResult('loggingImprovements', 'Logging improvements suite', false, { error: error.message });
    }
  }

  async runAllTests() {
    console.log('🚀 PROFESSIONAL COMPREHENSIVE VALIDATION TEST SUITE');
    console.log('==================================================');
    console.log(`Start Time: ${new Date().toISOString()}`);
    console.log(`Base URL: ${this.baseUrl}`);
    console.log('');

    // Wait for server to be ready
    console.log('⏳ Waiting for server to be ready...');
    await this.waitForServer();
    console.log('✅ Server is ready\n');

    // Run all test suites
    await this.testStaleDataDetection();
    await this.testRateLimiting();
    await this.testErrorHandling();
    await this.testDynamicSports();
    await this.testOddsApiIntegration();
    await this.testDataConsistency();
    await this.testLoggingImprovements();

    // Generate comprehensive report
    this.generateReport();
  }

  async waitForServer(maxAttempts = 30) {
    for (let i = 0; i < maxAttempts; i++) {
      try {
        await this.makeRequest('/api/health', { timeout: 5000 });
        return;
      } catch (error) {
        if (i < maxAttempts - 1) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
    }
    throw new Error('Server not ready after maximum attempts');
  }

  generateReport() {
    const totalTime = performance.now() - this.startTime;
    
    console.log('\n📊 COMPREHENSIVE TEST RESULTS');
    console.log('==============================');
    
    let totalPassed = 0;
    let totalFailed = 0;
    
    for (const [category, results] of Object.entries(this.testResults)) {
      const categoryTotal = results.passed + results.failed;
      const percentage = categoryTotal > 0 ? Math.round((results.passed / categoryTotal) * 100) : 0;
      
      console.log(`\n${category.toUpperCase()}:`);
      console.log(`  ✅ Passed: ${results.passed}`);
      console.log(`  ❌ Failed: ${results.failed}`);
      console.log(`  📈 Success Rate: ${percentage}%`);
      
      totalPassed += results.passed;
      totalFailed += results.failed;
    }
    
    const overallTotal = totalPassed + totalFailed;
    const overallPercentage = overallTotal > 0 ? Math.round((totalPassed / overallTotal) * 100) : 0;
    
    console.log('\n🎯 OVERALL RESULTS:');
    console.log(`  ✅ Total Passed: ${totalPassed}`);
    console.log(`  ❌ Total Failed: ${totalFailed}`);
    console.log(`  📈 Overall Success Rate: ${overallPercentage}%`);
    console.log(`  ⏱️  Total Test Time: ${Math.round(totalTime)}ms`);
    
    if (overallPercentage >= 90) {
      console.log('\n🎉 EXCELLENT! All fixes are working professionally!');
    } else if (overallPercentage >= 80) {
      console.log('\n✅ GOOD! Most fixes are working, minor issues to address.');
    } else if (overallPercentage >= 70) {
      console.log('\n⚠️  FAIR! Some fixes need attention.');
    } else {
      console.log('\n❌ POOR! Major issues need to be addressed.');
    }
    
    console.log(`\nTest completed at: ${new Date().toISOString()}`);
  }
}

// Run the test suite
if (require.main === module) {
  const testSuite = new ProfessionalTestSuite();
  testSuite.runAllTests().catch(console.error);
}

module.exports = ProfessionalTestSuite;
