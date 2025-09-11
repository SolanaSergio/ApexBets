/**
 * TEST RUNNING NEXT.JS SERVER
 * Tests the API routes on your running Next.js server
 */

const http = require('http');

const TEST_CONFIG = {
  SERVER_PORT: 3000,
  TIMEOUT: 10000
};

const testResults = {
  startTime: new Date().toISOString(),
  endTime: null,
  tests: {},
  summary: {
    totalTests: 0,
    passedTests: 0,
    failedTests: 0,
    errors: []
  }
};

function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : type === 'warning' ? '⚠️' : 'ℹ️';
  console.log(`${prefix} [${timestamp}] ${message}`);
}

function logHeader(title) {
  console.log('\n' + '='.repeat(80));
  console.log(`  ${title}`);
  console.log('='.repeat(80));
}

function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    
    const req = http.get(url, (res) => {
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
            size: data.length,
            rawData: data.substring(0, 200)
          });
        }
      });
    });
    
    req.on('error', (error) => {
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
    
    req.setTimeout(TEST_CONFIG.TIMEOUT, () => {
      req.destroy();
      resolve({
        success: false,
        error: 'Request timeout',
        statusCode: 0,
        duration: Date.now() - startTime,
        size: 0
      });
    });
  });
}

async function testApiEndpoint(name, url, expectedFields = []) {
  log(`Testing ${name}...`);
  
  try {
    const result = await makeRequest(url);
    
    if (result.success && result.statusCode === 200) {
      // Check if expected fields exist
      const hasExpectedFields = expectedFields.every(field => 
        result.data && result.data[field] !== undefined
      );
      
      if (hasExpectedFields || expectedFields.length === 0) {
        const dataCount = expectedFields.reduce((count, field) => {
          const data = result.data[field];
          return count + (Array.isArray(data) ? data.length : 0);
        }, 0);
        
        log(`  ✅ SUCCESS: ${dataCount} items, ${result.duration}ms, ${result.size} bytes`, 'success');
        
        testResults.tests[name] = {
          success: true,
          duration: result.duration,
          dataCount,
          size: result.size,
          statusCode: result.statusCode,
          data: result.data
        };
        
        testResults.summary.totalTests++;
        testResults.summary.passedTests++;
        
        return true;
      } else {
        const responseKeys = Object.keys(result.data || {});
        log(`  ❌ FAILED: Missing expected fields. Response keys: ${responseKeys.join(', ')}`, 'error');
        log(`  Raw response: ${JSON.stringify(result.data).substring(0, 200)}...`, 'error');
        
        testResults.tests[name] = {
          success: false,
          error: 'Missing expected fields',
          duration: result.duration,
          responseKeys
        };
        testResults.summary.totalTests++;
        testResults.summary.failedTests++;
        return false;
      }
    } else {
      log(`  ❌ FAILED: ${result.statusCode} - ${result.error || 'Unknown error'}`, 'error');
      
      testResults.tests[name] = {
        success: false,
        error: result.error,
        statusCode: result.statusCode,
        duration: result.duration
      };
      testResults.summary.totalTests++;
      testResults.summary.failedTests++;
      return false;
    }
  } catch (error) {
    log(`  ❌ ERROR: ${error.message}`, 'error');
    
    testResults.tests[name] = {
      success: false,
      error: error.message
    };
    testResults.summary.totalTests++;
    testResults.summary.failedTests++;
    return false;
  }
}

async function testServerHealth() {
  logHeader('TESTING SERVER HEALTH');
  
  const healthTests = [
    {
      name: 'Server Root',
      url: `http://localhost:${TEST_CONFIG.SERVER_PORT}/`,
      expectedFields: []
    },
    {
      name: 'API Health Check',
      url: `http://localhost:${TEST_CONFIG.SERVER_PORT}/api/health`,
      expectedFields: []
    }
  ];
  
  for (const test of healthTests) {
    await testApiEndpoint(test.name, test.url, test.expectedFields);
    await new Promise(resolve => setTimeout(resolve, 500));
  }
}

async function testSportsApis() {
  logHeader('TESTING SPORTS API ROUTES');
  
  const sportsTests = [
    {
      name: 'API Test Route',
      url: `http://localhost:${TEST_CONFIG.SERVER_PORT}/api/test-apis`,
      expectedFields: ['success', 'summary', 'results']
    },
    {
      name: 'Sports API',
      url: `http://localhost:${TEST_CONFIG.SERVER_PORT}/api/sports`,
      expectedFields: []
    },
    {
      name: 'Teams API',
      url: `http://localhost:${TEST_CONFIG.SERVER_PORT}/api/teams`,
      expectedFields: []
    },
    {
      name: 'Games API',
      url: `http://localhost:${TEST_CONFIG.SERVER_PORT}/api/games`,
      expectedFields: []
    },
    {
      name: 'Predictions API',
      url: `http://localhost:${TEST_CONFIG.SERVER_PORT}/api/predictions`,
      expectedFields: []
    }
  ];
  
  for (const test of sportsTests) {
    await testApiEndpoint(test.name, test.url, test.expectedFields);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Rate limiting
  }
}

async function testDataPopulation() {
  logHeader('TESTING DATA POPULATION');
  
  const dataTests = [
    {
      name: 'Populate Data API',
      url: `http://localhost:${TEST_CONFIG.SERVER_PORT}/api/populate-data`,
      expectedFields: []
    },
    {
      name: 'Analytics API',
      url: `http://localhost:${TEST_CONFIG.SERVER_PORT}/api/analytics`,
      expectedFields: []
    }
  ];
  
  for (const test of dataTests) {
    await testApiEndpoint(test.name, test.url, test.expectedFields);
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

async function generateReport() {
  logHeader('GENERATING TEST REPORT');
  
  testResults.endTime = new Date().toISOString();
  
  const report = {
    summary: {
      ...testResults.summary,
      successRate: testResults.summary.totalTests > 0 ? 
        (testResults.summary.passedTests / testResults.summary.totalTests * 100).toFixed(2) : 0,
      startTime: testResults.startTime,
      endTime: testResults.endTime,
      duration: new Date(testResults.endTime) - new Date(testResults.startTime)
    },
    tests: testResults.tests,
    errors: testResults.summary.errors
  };
  
  // Save report
  const fs = require('fs');
  const path = require('path');
  const reportPath = path.join(__dirname, 'server-test-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  // Display summary
  log(`Total Tests: ${report.summary.totalTests}`, 'info');
  log(`Passed: ${report.summary.passedTests}`, 'success');
  log(`Failed: ${report.summary.failedTests}`, report.summary.failedTests > 0 ? 'error' : 'info');
  log(`Success Rate: ${report.summary.successRate}%`, 'info');
  log(`Duration: ${Math.round(report.summary.duration / 1000)}s`, 'info');
  
  if (report.errors.length > 0) {
    log('Errors:', 'error');
    report.errors.forEach(error => log(`  - ${error}`, 'error'));
  }
  
  log(`Report saved to: ${reportPath}`, 'info');
  
  return report;
}

async function runServerTests() {
  logHeader('STARTING SERVER API TESTS');
  
  try {
    // Test server health first
    await testServerHealth();
    
    // Test sports APIs
    await testSportsApis();
    
    // Test data population
    await testDataPopulation();
    
    // Generate final report
    const report = await generateReport();
    
    logHeader('TESTING COMPLETED');
    log(`Overall Status: ${report.summary.successRate >= 80 ? 'PASS' : 'FAIL'}`, 
        report.summary.successRate >= 80 ? 'success' : 'error');
    
    return report;
    
  } catch (error) {
    log(`Fatal error: ${error.message}`, 'error');
    testResults.summary.errors.push(`Fatal error: ${error.message}`);
    return await generateReport();
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runServerTests().catch(console.error);
}

module.exports = { runServerTests };
