const https = require('https');
const http = require('http');

// Test configuration
const BASE_URL = 'http://localhost:3000';
const TIMEOUT = 10000;

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
        'User-Agent': 'API-Test-Script'
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

// Test endpoints configuration
const endpoints = [
  // Core endpoints
  { path: '/api/health', method: 'GET', name: 'Health Check' },
  { path: '/api/sports', method: 'GET', name: 'Sports List' },
  
  // Database-first endpoints
  { path: '/api/database-first/teams?sport=basketball', method: 'GET', name: 'Teams (Basketball)' },
  { path: '/api/database-first/games?sport=basketball&status=live', method: 'GET', name: 'Live Games (Basketball)' },
  { path: '/api/database-first/games?sport=basketball&status=scheduled', method: 'GET', name: 'Scheduled Games (Basketball)' },
  { path: '/api/database-first/odds?sport=basketball', method: 'GET', name: 'Odds (Basketball)' },
  { path: '/api/database-first/standings?sport=basketball', method: 'GET', name: 'Standings (Basketball)' },
  { path: '/api/database-first/predictions?sport=basketball', method: 'GET', name: 'Predictions (Basketball)' },
  
  // Other sports
  { path: '/api/database-first/teams?sport=football', method: 'GET', name: 'Teams (Football)' },
  { path: '/api/database-first/teams?sport=soccer', method: 'GET', name: 'Teams (Soccer)' },
  { path: '/api/database-first/teams?sport=hockey', method: 'GET', name: 'Teams (Hockey)' },
  { path: '/api/database-first/teams?sport=baseball', method: 'GET', name: 'Teams (Baseball)' },
  
  // Analytics endpoints
  { path: '/api/analytics?sport=basketball', method: 'GET', name: 'Analytics (Basketball)' },
  { path: '/api/analytics/trends?sport=basketball', method: 'GET', name: 'Trends (Basketball)' },
  { path: '/api/analytics/team-performance?sport=basketball', method: 'GET', name: 'Team Performance (Basketball)' },
  
  // Player endpoints
  { path: '/api/players?sport=basketball', method: 'GET', name: 'Players (Basketball)' },
  { path: '/api/player-stats?sport=basketball', method: 'GET', name: 'Player Stats (Basketball)' },
  
  // Team endpoints
  { path: '/api/teams?sport=basketball', method: 'GET', name: 'Teams API (Basketball)' },
  { path: '/api/team-stats?sport=basketball', method: 'GET', name: 'Team Stats (Basketball)' },
  
  // Predictions endpoints
  { path: '/api/predictions/upcoming?sport=basketball&limit=5', method: 'GET', name: 'Upcoming Predictions (Basketball)' },
  { path: '/api/predictions/generate?sport=basketball', method: 'POST', name: 'Generate Predictions (Basketball)' },
  
  // Value bets
  { path: '/api/value-bets?sport=basketball&min_value=0.1&limit=5', method: 'GET', name: 'Value Bets (Basketball)' },
  
  // Live data
  { path: '/api/live-scores?sport=basketball', method: 'GET', name: 'Live Scores (Basketball)' },
  { path: '/api/live-updates?sport=basketball', method: 'GET', name: 'Live Updates (Basketball)' },
  
  // Admin endpoints
  { path: '/api/admin/api-status', method: 'GET', name: 'API Status' },
  { path: '/api/admin/database-audit', method: 'GET', name: 'Database Audit' },
  
  // Database endpoints
  { path: '/api/database/status', method: 'GET', name: 'Database Status' },
  { path: '/api/database/schema', method: 'GET', name: 'Database Schema' },
];

// Test results storage
const results = {
  passed: [],
  failed: [],
  errors: []
};

// Run tests
async function runTests() {
  console.log('🚀 Starting API Endpoint Tests...\n');
  
  for (const endpoint of endpoints) {
    try {
      console.log(`Testing: ${endpoint.name} (${endpoint.method} ${endpoint.path})`);
      
      const response = await makeRequest(`${BASE_URL}${endpoint.path}`, endpoint.method);
      
      if (response.status >= 200 && response.status < 300) {
        console.log(`✅ PASSED - Status: ${response.status}`);
        results.passed.push({
          name: endpoint.name,
          path: endpoint.path,
          status: response.status,
          responseTime: response.headers['x-response-time'] || 'N/A'
        });
      } else {
        console.log(`❌ FAILED - Status: ${response.status}`);
        console.log(`   Response: ${JSON.stringify(response.data).substring(0, 200)}...`);
        results.failed.push({
          name: endpoint.name,
          path: endpoint.path,
          status: response.status,
          error: response.data
        });
      }
    } catch (error) {
      console.log(`💥 ERROR - ${error.message}`);
      results.errors.push({
        name: endpoint.name,
        path: endpoint.path,
        error: error.message
      });
    }
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  // Print summary
  console.log('\n📊 TEST SUMMARY');
  console.log('================');
  console.log(`✅ Passed: ${results.passed.length}`);
  console.log(`❌ Failed: ${results.failed.length}`);
  console.log(`💥 Errors: ${results.errors.length}`);
  console.log(`📈 Success Rate: ${Math.round((results.passed.length / endpoints.length) * 100)}%`);
  
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
  fs.writeFileSync('api-test-results.json', JSON.stringify({
    timestamp: new Date().toISOString(),
    summary: {
      total: endpoints.length,
      passed: results.passed.length,
      failed: results.failed.length,
      errors: results.errors.length,
      successRate: Math.round((results.passed.length / endpoints.length) * 100)
    },
    results: {
      passed: results.passed,
      failed: results.failed,
      errors: results.errors
    }
  }, null, 2));
  
  console.log('\n💾 Detailed results saved to api-test-results.json');
}

// Run the tests
runTests().catch(console.error);
