/**
 * COMPREHENSIVE API TEST RUNNER
 * Tests all APIs using Next.js development server
 */

const { spawn } = require('child_process');
const https = require('https');
const http = require('http');

const TEST_CONFIG = {
  DEV_SERVER_PORT: 3000,
  TEST_TIMEOUT: 30000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 2000
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
    const client = url.startsWith('https') ? https : http;
    
    const req = client.get(url, (res) => {
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
    
    req.setTimeout(TEST_CONFIG.TEST_TIMEOUT, () => {
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

async function waitForServer(port, maxAttempts = 30) {
  log(`Waiting for server to start on port ${port}...`);
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const result = await makeRequest(`http://localhost:${port}/api/test-apis`);
      if (result.success && result.statusCode === 200) {
        log(`Server is ready on port ${port}`, 'success');
        return true;
      }
    } catch (error) {
      // Server not ready yet
    }
    
    if (attempt < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  return false;
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
          statusCode: result.statusCode
        };
        
        testResults.summary.totalTests++;
        testResults.summary.passedTests++;
        
        return true;
      } else {
        log(`  ❌ FAILED: Missing expected fields`, 'error');
        testResults.tests[name] = {
          success: false,
          error: 'Missing expected fields',
          duration: result.duration
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

async function testDirectApis() {
  logHeader('TESTING DIRECT API ENDPOINTS');
  
  const tests = [
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
      expectedFields: ['countries']
    }
  ];
  
  for (const test of tests) {
    await testApiEndpoint(test.name, test.url, test.expectedFields);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Rate limiting
  }
}

async function testNextJsApis() {
  logHeader('TESTING NEXT.JS API ROUTES');
  
  const serverReady = await waitForServer(TEST_CONFIG.DEV_SERVER_PORT);
  
  if (!serverReady) {
    log('Next.js server not ready, skipping API route tests', 'warning');
    return;
  }
  
  await testApiEndpoint(
    'Next.js API Test Route',
    `http://localhost:${TEST_CONFIG.DEV_SERVER_PORT}/api/test-apis`,
    ['success', 'summary', 'results']
  );
}

async function testEnvironmentVariables() {
  logHeader('TESTING ENVIRONMENT VARIABLES');
  
  const requiredVars = [
    'NEXT_PUBLIC_SPORTSDB_API_KEY',
    'NEXT_PUBLIC_BALLDONTLIE_API_KEY',
    'NEXT_PUBLIC_RAPIDAPI_KEY',
    'NEXT_PUBLIC_ODDS_API_KEY'
  ];
  
  const fs = require('fs');
  const path = require('path');
  const envFile = path.join(process.cwd(), '..', '.env.local');
  
  let envContent = '';
  if (fs.existsSync(envFile)) {
    envContent = fs.readFileSync(envFile, 'utf8');
  }
  
  // Parse environment variables from file content
  const envVars = {};
  envContent.split('\n').forEach(line => {
    const trimmedLine = line.trim();
    if (trimmedLine && !trimmedLine.startsWith('#')) {
      const [key, ...valueParts] = trimmedLine.split('=');
      if (key && valueParts.length > 0) {
        envVars[key.trim()] = valueParts.join('=').trim();
      }
    }
  });
  
  for (const varName of requiredVars) {
    const hasVar = varName in envVars;
    const value = envVars[varName] || '';
    const isConfigured = hasVar && value && value.length > 0 && !value.includes('your_') && !value.includes('placeholder');
    
    if (varName === 'NEXT_PUBLIC_SPORTSDB_API_KEY') {
      // SportsDB can use '123' as a valid free key
      const isSportsDBConfigured = hasVar && (value === '123' || (value && value.length > 0 && !value.includes('your_') && !value.includes('placeholder')));
      testResults.tests[`Environment: ${varName}`] = {
        success: isSportsDBConfigured,
        configured: isSportsDBConfigured,
        present: hasVar,
        value: value ? value.substring(0, 10) + '...' : 'not found'
      };
      
      testResults.summary.totalTests++;
      if (isSportsDBConfigured) {
        testResults.summary.passedTests++;
        log(`${varName}: Configured (${value === '123' ? 'free tier' : 'custom key'})`, 'success');
      } else if (hasVar) {
        testResults.summary.failedTests++;
        log(`${varName}: Present but not configured (${value})`, 'warning');
      } else {
        testResults.summary.failedTests++;
        log(`${varName}: Missing`, 'error');
      }
    } else {
      testResults.tests[`Environment: ${varName}`] = {
        success: isConfigured,
        configured: isConfigured,
        present: hasVar,
        value: value ? value.substring(0, 10) + '...' : 'not found'
      };
      
      testResults.summary.totalTests++;
      if (isConfigured) {
        testResults.summary.passedTests++;
        log(`${varName}: Configured`, 'success');
      } else if (hasVar) {
        testResults.summary.failedTests++;
        log(`${varName}: Present but not configured (${value})`, 'warning');
      } else {
        testResults.summary.failedTests++;
        log(`${varName}: Missing`, 'error');
      }
    }
  }
}

async function generateReport() {
  logHeader('GENERATING COMPREHENSIVE TEST REPORT');
  
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
  const reportPath = path.join(__dirname, 'comprehensive-test-report.json');
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

async function runComprehensiveTests() {
  logHeader('STARTING COMPREHENSIVE API TESTING SUITE');
  
  try {
    // Test environment variables first
    await testEnvironmentVariables();
    
    // Test direct API endpoints
    await testDirectApis();
    
    // Test Next.js API routes (if server is running)
    await testNextJsApis();
    
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
  runComprehensiveTests().catch(console.error);
}

module.exports = { runComprehensiveTests };
