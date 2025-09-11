/**
 * SIMPLE ENVIRONMENT AND API TEST
 * Quick test to verify environment variables and basic API functionality
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : type === 'warning' ? '⚠️' : 'ℹ️';
  console.log(`${prefix} [${timestamp}] ${message}`);
}

function logHeader(title) {
  console.log('\n' + '='.repeat(60));
  console.log(`  ${title}`);
  console.log('='.repeat(60));
}

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
            size: data.length,
            rawData: data.substring(0, 200)
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

async function testEnvironmentVariables() {
  logHeader('TESTING ENVIRONMENT VARIABLES');
  
  const envFile = path.join(process.cwd(), '..', '.env.local');
  let envContent = '';
  
  if (fs.existsSync(envFile)) {
    envContent = fs.readFileSync(envFile, 'utf8');
  } else {
    log('Environment file not found', 'error');
    return false;
  }
  
  const requiredVars = [
    'NEXT_PUBLIC_SPORTSDB_API_KEY',
    'NEXT_PUBLIC_BALLDONTLIE_API_KEY',
    'NEXT_PUBLIC_RAPIDAPI_KEY',
    'NEXT_PUBLIC_ODDS_API_KEY'
  ];
  
  let allConfigured = true;
  
  for (const varName of requiredVars) {
    const hasVar = envContent.includes(varName);
    
    if (varName === 'NEXT_PUBLIC_SPORTSDB_API_KEY') {
      // SportsDB can use '123' as a valid free key
      const isSportsDBConfigured = hasVar && envContent.includes(`${varName}=123`);
      if (isSportsDBConfigured) {
        log(`${varName}: Configured (free tier)`, 'success');
      } else if (hasVar) {
        log(`${varName}: Present but not configured`, 'warning');
        allConfigured = false;
      } else {
        log(`${varName}: Missing`, 'error');
        allConfigured = false;
      }
    } else {
      // For other APIs, check if they have actual values (not placeholder)
      const regex = new RegExp(`${varName}=([^\\s\\n]+)`);
      const match = envContent.match(regex);
      const hasValue = match && match[1] && 
        match[1] !== 'your_' + varName.toLowerCase().replace('next_public_', '').replace('_key', '') &&
        match[1] !== '' &&
        match[1].length > 5;
      
      if (hasValue) {
        log(`${varName}: Configured`, 'success');
      } else if (hasVar) {
        log(`${varName}: Present but not configured`, 'warning');
        allConfigured = false;
      } else {
        log(`${varName}: Missing`, 'error');
        allConfigured = false;
      }
    }
  }
  
  return allConfigured;
}

async function testSportsDBApi() {
  logHeader('TESTING SPORTSDB API');
  
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
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    log(`Testing ${test.name}...`);
    
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
          
          log(`  ✅ SUCCESS: ${dataCount} items, ${result.duration}ms, ${result.size} bytes`, 'success');
          passed++;
        } else {
          // Log the actual response structure for debugging
          const responseKeys = Object.keys(result.data || {});
          log(`  ❌ FAILED: Missing expected fields. Response keys: ${responseKeys.join(', ')}`, 'error');
          log(`  Raw response: ${JSON.stringify(result.data).substring(0, 200)}...`, 'error');
          failed++;
        }
      } else {
        log(`  ❌ FAILED: ${result.statusCode} - ${result.error || 'Unknown error'}`, 'error');
        failed++;
      }
    } catch (error) {
      log(`  ❌ ERROR: ${error.message}`, 'error');
      failed++;
    }
    
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  log(`SportsDB API Results: ${passed}/${tests.length} passed`, passed === tests.length ? 'success' : 'warning');
  return passed === tests.length;
}

async function testFileStructure() {
  logHeader('TESTING FILE STRUCTURE');
  
  const requiredFiles = [
    '../lib/sports-apis/sportsdb-client.ts',
    '../lib/sports-apis/balldontlie-client.ts',
    '../lib/sports-apis/api-sports-client.ts',
    '../lib/sports-apis/odds-api-client.ts',
    '../lib/services/sports/basketball/basketball-service.ts',
    '../lib/services/predictions/sport-prediction-service.ts',
    '../lib/services/comprehensive-data-population-service.ts'
  ];
  
  let allExist = true;
  
  for (const filePath of requiredFiles) {
    const fullPath = path.join(process.cwd(), filePath);
    const exists = fs.existsSync(fullPath);
    
    if (exists) {
      log(`${filePath}: Exists`, 'success');
    } else {
      log(`${filePath}: Missing`, 'error');
      allExist = false;
    }
  }
  
  return allExist;
}

async function runSimpleTest() {
  logHeader('STARTING SIMPLE API TEST');
  
  try {
    const envOk = await testEnvironmentVariables();
    const filesOk = await testFileStructure();
    const apiOk = await testSportsDBApi();
    
    logHeader('TEST SUMMARY');
    log(`Environment Variables: ${envOk ? '✅' : '❌'}`, envOk ? 'success' : 'error');
    log(`File Structure: ${filesOk ? '✅' : '❌'}`, filesOk ? 'success' : 'error');
    log(`SportsDB API: ${apiOk ? '✅' : '❌'}`, apiOk ? 'success' : 'error');
    
    const overallSuccess = envOk && filesOk && apiOk;
    log(`Overall Status: ${overallSuccess ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`, 
        overallSuccess ? 'success' : 'error');
    
    return overallSuccess;
    
  } catch (error) {
    log(`Fatal error: ${error.message}`, 'error');
    return false;
  }
}

// Run the test
runSimpleTest().catch(console.error);
