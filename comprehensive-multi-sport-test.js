const https = require('https');
const http = require('http');

// Test configuration
const BASE_URL = 'http://localhost:3000';
const TIMEOUT = 15000;

// All supported sports
const SPORTS = ['basketball', 'football', 'soccer', 'hockey', 'baseball'];

// Helper function to make HTTP requests
function makeRequest(url, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || 80,
      path: urlObj.pathname + urlObj.search,
      method: method,
      timeout: TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Multi-Sport-Test-Script'
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const parsedBody = body ? JSON.parse(body) : {};
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: parsedBody,
            rawBody: body
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: body,
            rawBody: body
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

// Comprehensive test endpoints for each sport
const getSportEndpoints = (sport) => [
  // Core data endpoints
  { path: `/api/database-first/teams?sport=${sport}`, method: 'GET', name: `Teams (${sport})` },
  { path: `/api/database-first/games?sport=${sport}&status=live`, method: 'GET', name: `Live Games (${sport})` },
  { path: `/api/database-first/games?sport=${sport}&status=scheduled`, method: 'GET', name: `Scheduled Games (${sport})` },
  { path: `/api/database-first/odds?sport=${sport}`, method: 'GET', name: `Odds (${sport})` },
  { path: `/api/database-first/standings?sport=${sport}`, method: 'GET', name: `Standings (${sport})` },
  { path: `/api/database-first/predictions?sport=${sport}`, method: 'GET', name: `Predictions (${sport})` },
  
  // Analytics endpoints
  { path: `/api/analytics?sport=${sport}`, method: 'GET', name: `Analytics (${sport})` },
  { path: `/api/players?sport=${sport}`, method: 'GET', name: `Players (${sport})` },
  { path: `/api/player-stats?sport=${sport}`, method: 'GET', name: `Player Stats (${sport})` },
  { path: `/api/teams?sport=${sport}`, method: 'GET', name: `Teams API (${sport})` },
  { path: `/api/team-stats?sport=${sport}`, method: 'GET', name: `Team Stats (${sport})` },
  
  // Predictions and betting
  { path: `/api/predictions/upcoming?sport=${sport}&limit=5`, method: 'GET', name: `Upcoming Predictions (${sport})` },
  { path: `/api/value-bets?sport=${sport}&min_value=0.1&limit=5`, method: 'GET', name: `Value Bets (${sport})` },
  
  // Live data
  { path: `/api/live-scores?sport=${sport}`, method: 'GET', name: `Live Scores (${sport})` },
  { path: `/api/live-updates?sport=${sport}`, method: 'GET', name: `Live Updates (${sport})` },
];

// Edge case and special scenario tests
const getEdgeCaseEndpoints = () => [
  // Cross-sport tests
  { path: '/api/sports', method: 'GET', name: 'All Sports List' },
  { path: '/api/health', method: 'GET', name: 'Health Check' },
  
  // Parameter variations
  { path: '/api/database-first/teams?sport=all', method: 'GET', name: 'Teams (All Sports)' },
  { path: '/api/database-first/games?status=all', method: 'GET', name: 'Games (All Status)' },
  { path: '/api/players?limit=1', method: 'GET', name: 'Players (Limit 1)' },
  { path: '/api/players?limit=1000', method: 'GET', name: 'Players (Limit 1000)' },
  
  // Date range tests
  { path: '/api/database-first/games?date_from=2024-01-01&date_to=2024-12-31', method: 'GET', name: 'Games (Full Year)' },
  { path: '/api/database-first/games?date_from=2025-01-01&date_to=2025-01-02', method: 'GET', name: 'Games (Single Day)' },
  
  // Admin and monitoring
  { path: '/api/admin/api-status', method: 'GET', name: 'API Status' },
  { path: '/api/admin/database-audit', method: 'GET', name: 'Database Audit' },
  { path: '/api/database/status', method: 'GET', name: 'Database Status' },
  { path: '/api/database/schema', method: 'GET', name: 'Database Schema' },
  
  // Error handling tests
  { path: '/api/database-first/teams?sport=invalid', method: 'GET', name: 'Teams (Invalid Sport)' },
  { path: '/api/players?sport=nonexistent', method: 'GET', name: 'Players (Nonexistent Sport)' },
];

// Test results storage
const results = {
  passed: [],
  failed: [],
  errors: [],
  sportStats: {},
  edgeCaseStats: { passed: 0, failed: 0, errors: 0 }
};

// Run tests for a specific sport
async function testSport(sport) {
  console.log(`\n🏀 Testing ${sport.toUpperCase()}...`);
  
  const endpoints = getSportEndpoints(sport);
  const sportResults = { passed: 0, failed: 0, errors: 0 };
  
  for (const endpoint of endpoints) {
    try {
      console.log(`  Testing: ${endpoint.name}`);
      
      const response = await makeRequest(`${BASE_URL}${endpoint.path}`, endpoint.method);
      
      if (response.status >= 200 && response.status < 300) {
        console.log(`    ✅ PASSED - Status: ${response.status}`);
        results.passed.push({
          name: endpoint.name,
          path: endpoint.path,
          status: response.status,
          sport: sport
        });
        sportResults.passed++;
      } else {
        console.log(`    ❌ FAILED - Status: ${response.status}`);
        console.log(`       Response: ${JSON.stringify(response.data).substring(0, 100)}...`);
        results.failed.push({
          name: endpoint.name,
          path: endpoint.path,
          status: response.status,
          error: response.data,
          sport: sport
        });
        sportResults.failed++;
      }
    } catch (error) {
      console.log(`    💥 ERROR - ${error.message}`);
      results.errors.push({
        name: endpoint.name,
        path: endpoint.path,
        error: error.message,
        sport: sport
      });
      sportResults.errors++;
    }
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  results.sportStats[sport] = sportResults;
  const successRate = Math.round((sportResults.passed / endpoints.length) * 100);
  console.log(`  📊 ${sport.toUpperCase()} Results: ${sportResults.passed}/${endpoints.length} (${successRate}%)`);
}

// Run edge case tests
async function testEdgeCases() {
  console.log(`\n🔍 Testing Edge Cases and Special Scenarios...`);
  
  const endpoints = getEdgeCaseEndpoints();
  
  for (const endpoint of endpoints) {
    try {
      console.log(`  Testing: ${endpoint.name}`);
      
      const response = await makeRequest(`${BASE_URL}${endpoint.path}`, endpoint.method);
      
      if (response.status >= 200 && response.status < 300) {
        console.log(`    ✅ PASSED - Status: ${response.status}`);
        results.edgeCaseStats.passed++;
      } else {
        console.log(`    ❌ FAILED - Status: ${response.status}`);
        console.log(`       Response: ${JSON.stringify(response.data).substring(0, 100)}...`);
        results.edgeCaseStats.failed++;
      }
    } catch (error) {
      console.log(`    💥 ERROR - ${error.message}`);
      results.edgeCaseStats.errors++;
    }
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 100));
  }
}

// Run all tests
async function runComprehensiveTests() {
  console.log('🚀 Starting Comprehensive Multi-Sport API Tests...\n');
  
  // Test each sport
  for (const sport of SPORTS) {
    await testSport(sport);
  }
  
  // Test edge cases
  await testEdgeCases();
  
  // Calculate totals
  const totalEndpoints = results.passed.length + results.failed.length + results.errors.length;
  const totalPassed = results.passed.length + results.edgeCaseStats.passed;
  const totalFailed = results.failed.length + results.edgeCaseStats.failed;
  const totalErrors = results.errors.length + results.edgeCaseStats.errors;
  const overallSuccessRate = Math.round((totalPassed / totalEndpoints) * 100);
  
  // Print comprehensive summary
  console.log('\n📊 COMPREHENSIVE TEST SUMMARY');
  console.log('================================');
  console.log(`✅ Total Passed: ${totalPassed}`);
  console.log(`❌ Total Failed: ${totalFailed}`);
  console.log(`💥 Total Errors: ${totalErrors}`);
  console.log(`📈 Overall Success Rate: ${overallSuccessRate}%`);
  
  // Sport-specific breakdown
  console.log('\n🏆 SPORT-SPECIFIC RESULTS:');
  for (const sport of SPORTS) {
    const stats = results.sportStats[sport];
    const sportTotal = stats.passed + stats.failed + stats.errors;
    const sportRate = Math.round((stats.passed / sportTotal) * 100);
    console.log(`  ${sport.toUpperCase()}: ${stats.passed}/${sportTotal} (${sportRate}%)`);
  }
  
  // Edge case results
  const edgeTotal = results.edgeCaseStats.passed + results.edgeCaseStats.failed + results.edgeCaseStats.errors;
  const edgeRate = Math.round((results.edgeCaseStats.passed / edgeTotal) * 100);
  console.log(`  EDGE CASES: ${results.edgeCaseStats.passed}/${edgeTotal} (${edgeRate}%)`);
  
  if (results.failed.length > 0) {
    console.log('\n❌ FAILED ENDPOINTS:');
    results.failed.forEach(fail => {
      console.log(`   ${fail.name}: ${fail.status} - ${fail.path}`);
    });
  }
  
  if (results.errors.length > 0) {
    console.log('\n💥 ERROR ENDPOINTS:');
    results.errors.forEach(error => {
      console.log(`   ${error.name}: ${error.error} - ${error.path}`);
    });
  }
  
  // Save detailed results
  const fs = require('fs');
  const detailedResults = {
    timestamp: new Date().toISOString(),
    summary: {
      total: totalEndpoints,
      passed: totalPassed,
      failed: totalFailed,
      errors: totalErrors,
      successRate: overallSuccessRate
    },
    sportStats: results.sportStats,
    edgeCaseStats: results.edgeCaseStats,
    results: {
      passed: results.passed,
      failed: results.failed,
      errors: results.errors
    }
  };
  
  fs.writeFileSync('comprehensive-test-results.json', JSON.stringify(detailedResults, null, 2));
  console.log('\n💾 Detailed results saved to comprehensive-test-results.json');
  
  return detailedResults;
}

// Run the comprehensive tests
runComprehensiveTests().catch(console.error);
