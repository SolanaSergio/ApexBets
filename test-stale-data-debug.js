/**
 * Debug test for stale data detection
 */

const http = require('http');

async function makeRequest(endpoint) {
  return new Promise((resolve, reject) => {
    const req = http.request(`http://localhost:3000${endpoint}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({ status: res.statusCode, data: jsonData });
        } catch (error) {
          resolve({ status: res.statusCode, data: data, parseError: error.message });
        }
      });
    });
    
    req.on('error', reject);
    req.end();
  });
}

async function debugStaleDataDetection() {
  console.log('🔍 Debugging Stale Data Detection...\n');
  
  try {
    // Test 1: Basic games endpoint
    console.log('1. Testing basic games endpoint...');
    const gamesResponse = await makeRequest('/api/database-first/games?sport=basketball&limit=5');
    console.log(`   Status: ${gamesResponse.status}`);
    console.log(`   Data source: ${gamesResponse.data?.meta?.source}`);
    console.log(`   Games count: ${gamesResponse.data?.data?.length || 0}`);
    console.log(`   Has data: ${Array.isArray(gamesResponse.data?.data)}`);
    
    if (gamesResponse.parseError) {
      console.log(`   Parse error: ${gamesResponse.parseError}`);
    }
    
    // Test 2: Force refresh
    console.log('\n2. Testing force refresh...');
    const forceRefreshResponse = await makeRequest('/api/database-first/games?sport=basketball&forceRefresh=true&limit=5');
    console.log(`   Status: ${forceRefreshResponse.status}`);
    console.log(`   Data source: ${forceRefreshResponse.data?.meta?.source}`);
    console.log(`   Games count: ${forceRefreshResponse.data?.data?.length || 0}`);
    
    // Test 3: Different data types
    console.log('\n3. Testing different data types...');
    const dataTypes = ['teams', 'standings', 'odds'];
    
    for (const dataType of dataTypes) {
      const endpoint = `/api/database-first/${dataType}?sport=basketball&limit=3`;
      console.log(`   Testing ${dataType}...`);
      
      try {
        const response = await makeRequest(endpoint);
        console.log(`     Status: ${response.status}`);
        console.log(`     Data source: ${response.data?.meta?.source}`);
        console.log(`     Count: ${response.data?.data?.length || 0}`);
      } catch (error) {
        console.log(`     Error: ${error.message}`);
      }
    }
    
    // Test 4: Check server logs
    console.log('\n4. Checking if server is logging properly...');
    const logTestResponse = await makeRequest('/api/database-first/games?sport=basketball&limit=1');
    console.log(`   Status: ${logTestResponse.status}`);
    console.log(`   Response time: ${logTestResponse.data?.meta?.responseTime || 'N/A'}`);
    
  } catch (error) {
    console.error('❌ Debug test failed:', error.message);
  }
}

debugStaleDataDetection().catch(console.error);
