/**
 * QUICK API VERIFICATION
 * Simple test to verify APIs are working correctly
 */

const https = require('https');

// Test configuration
const TESTS = [
  {
    name: 'SportsDB Events',
    url: 'https://www.thesportsdb.com/api/v1/json/3/eventsday.php?d=2024-01-01',
    expectedFields: ['events']
  },
  {
    name: 'SportsDB Teams',
    url: 'https://www.thesportsdb.com/api/v1/json/3/searchteams.php?t=basketball',
    expectedFields: ['teams']
  },
  {
    name: 'SportsDB Leagues',
    url: 'https://www.thesportsdb.com/api/v1/json/3/search_all_leagues.php?s=basketball',
    expectedFields: ['leagues']
  }
];

function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    
    https.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        try {
          const jsonData = JSON.parse(data);
          resolve({
            success: true,
            data: jsonData,
            statusCode: res.statusCode,
            duration,
            size: data.length
          });
        } catch (error) {
          resolve({
            success: false,
            error: 'Invalid JSON response',
            statusCode: res.statusCode,
            duration,
            size: data.length
          });
        }
      });
    }).on('error', (error) => {
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      resolve({
        success: false,
        error: error.message,
        statusCode: 0,
        duration,
        size: 0
      });
    });
  });
}

async function runTests() {
  console.log('🚀 Starting Quick API Verification...\n');
  
  const results = [];
  let passed = 0;
  let failed = 0;
  
  for (const test of TESTS) {
    console.log(`Testing ${test.name}...`);
    
    try {
      const result = await makeRequest(test.url);
      
      if (result.success && result.statusCode === 200) {
        // Check if expected fields exist
        const hasExpectedFields = test.expectedFields.every(field => 
          result.data && result.data[field] !== undefined
        );
        
        if (hasExpectedFields) {
          const dataCount = test.expectedFields.reduce((count, field) => {
            const data = result.data[field];
            return count + (Array.isArray(data) ? data.length : 0);
          }, 0);
          
          console.log(`  ✅ SUCCESS: ${dataCount} items, ${result.duration}ms, ${result.size} bytes`);
          passed++;
        } else {
          console.log(`  ❌ FAILED: Missing expected fields`);
          failed++;
        }
      } else {
        console.log(`  ❌ FAILED: ${result.statusCode} - ${result.error || 'Unknown error'}`);
        failed++;
      }
      
      results.push({
        name: test.name,
        success: result.success && result.statusCode === 200,
        statusCode: result.statusCode,
        duration: result.duration,
        size: result.size,
        error: result.error
      });
      
    } catch (error) {
      console.log(`  ❌ ERROR: ${error.message}`);
      failed++;
      results.push({
        name: test.name,
        success: false,
        error: error.message
      });
    }
    
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n📊 VERIFICATION SUMMARY');
  console.log(`Total Tests: ${TESTS.length}`);
  console.log(`Passed: ${passed} ✅`);
  console.log(`Failed: ${failed} ❌`);
  console.log(`Success Rate: ${((passed / TESTS.length) * 100).toFixed(1)}%`);
  
  if (passed === TESTS.length) {
    console.log('\n🎉 ALL TESTS PASSED! Your APIs are working correctly.');
  } else {
    console.log('\n⚠️  Some tests failed. Check the errors above.');
  }
  
  return results;
}

// Run the tests
runTests().catch(console.error);
