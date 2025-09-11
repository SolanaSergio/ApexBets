#!/usr/bin/env node

/**
 * ApexBets Comprehensive Verification System
 * Complete accuracy testing for all sports data with automatic database monitoring
 * NO MOCK DATA OR PLACEHOLDERS - REAL DATA ONLY
 */

const VerificationTracker = require('./verification-tracker');
const fetch = require('node-fetch');

// Initialize tracker
const tracker = new VerificationTracker();

// Configuration
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
const REQUEST_TIMEOUT = 10000; // 10 seconds timeout for comprehensive tests

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Helper function to make API requests with timeout
async function makeApiRequest(endpoint, timeout = REQUEST_TIMEOUT) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    const data = await response.json();
    
    return {
      success: response.ok,
      status: response.status,
      data,
      error: response.ok ? null : data.error || 'Unknown error'
    };
  } catch (error) {
    if (error.name === 'AbortError') {
      return {
        success: false,
        status: 0,
        data: null,
        error: `Request timeout after ${timeout}ms`
      };
    }
    return {
      success: false,
      status: 0,
      data: null,
      error: error.message
    };
  }
}

// Helper function to test external API with timeout
async function testExternalApi(url, timeout = REQUEST_TIMEOUT, additionalHeaders = {}) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: additionalHeaders
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return {
        success: false,
        data: null,
        error: `HTTP ${response.status}`
      };
    }

    const data = await response.json();
    return {
      success: true,
      data,
      error: null
    };
  } catch (error) {
    if (error.name === 'AbortError') {
      return {
        success: false,
        data: null,
        error: `Request timeout after ${timeout}ms`
      };
    }
    return {
      success: false,
      data: null,
      error: error.message
    };
  }
}

async function quickTest(name, testFn, timeout = REQUEST_TIMEOUT) {
  const startTime = Date.now();
  try {
    // Add timeout wrapper
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error(`Test timeout after ${timeout}ms`)), timeout);
    });
    
    const result = await Promise.race([testFn(), timeoutPromise]);
    const duration = Date.now() - startTime;
    
    if (result.success) {
      log(`${colors.green}✓${colors.reset} ${name} (${duration}ms)`, 'green');
      return { success: true, duration, result: result.data };
    } else {
      log(`${colors.red}✗${colors.reset} ${name} (${duration}ms) - ${result.error}`, 'red');
      return { success: false, duration, error: result.error };
    }
  } catch (error) {
    const duration = Date.now() - startTime;
    log(`${colors.red}✗${colors.reset} ${name} (${duration}ms) - ${error.message}`, 'red');
    return { success: false, duration, error: error.message };
  }
}

async function testApiEndpoint(endpoint, description, timeout = REQUEST_TIMEOUT) {
  return quickTest(description, async () => {
    return await makeApiRequest(endpoint, timeout);
  }, timeout);
}

async function testExternalApiEndpoint(url, description, timeout = REQUEST_TIMEOUT) {
  return quickTest(description, async () => {
    return await testExternalApi(url, timeout);
  }, timeout);
}

// Enhanced data validation function
async function validateRealData(data, validationRules = {}) {
  const issues = [];
  const jsonStr = JSON.stringify(data);

  // Check for placeholder/mock data
  if (jsonStr.includes('placeholder') || jsonStr.includes('mock') ||
      jsonStr.includes('example') || jsonStr.includes('sample') ||
      jsonStr.includes('TODO') || jsonStr.includes('FIXME') ||
      jsonStr.includes('temp') || jsonStr.includes('test123')) {
    issues.push('Contains placeholder/mock data');
  }

  // Check if data array is empty (unless specifically empty is expected)
  if (!validationRules.allowEmpty && Array.isArray(data)) {
    if (data.length === 0) {
      issues.push('Data array is empty');
    }
  }

  // Check for required properties
  if (validationRules.requiredProps && Array.isArray(data)) {
    data.forEach((item, index) => {
      validationRules.requiredProps.forEach(prop => {
        if (!item.hasOwnProperty(prop) || !item[prop]) {
          issues.push(`Item ${index} missing required property: ${prop}`);
        }
      });
    });
  }

  // Check minimum data count
  if (validationRules.minCount && Array.isArray(data)) {
    if (data.length < validationRules.minCount) {
      issues.push(`Only ${data.length} items, minimum required: ${validationRules.minCount}`);
    }
  }

  // Check for diverse sports (not just basketball)
  if (validationRules.checkSportsDiversity && Array.isArray(data)) {
    const sports = [];
    data.forEach(item => {
      if (item.sport) sports.push(item.sport);
    });
    if (sports.filter(sport => sport === 'basketball').length === sports.length) {
      issues.push('Sports data only contains basketball');
    }
    if (sports.length < 2) {
      issues.push('Only one sport found, should have multiple sports');
    }
  }

  return {
    valid: issues.length === 0,
    issues,
    dataLength: Array.isArray(data) ? data.length : (data ? 1 : 0)
  };
}

async function testApiEndpointWithValidation(endpoint, description, validation = {}) {
  return quickTest(description, async () => {
    const result = await makeApiRequest(endpoint);
    
    if (!result.success) {
      return result;
    }

    // Validate real data
    const validationResult = await validateRealData(result.data, validation);
    
    if (!validationResult.valid) {
      return {
        success: false,
        error: `Data validation failed: ${validationResult.issues.join(', ')}`
      };
    }

    return {
      success: true,
      data: result.data,
      validation: validationResult
    };
  });
}

async function testMultiSportCoverage() {
  log(`${colors.bright}Testing Multi-Sport Data Coverage:${colors.reset}`);
  
  const sports = [
    { name: 'basketball', displayName: 'Basketball', leagues: ['NBA', 'WNBA'] },
    { name: 'football', displayName: 'Football', leagues: ['NFL', 'NCAA'] },
    { name: 'baseball', displayName: 'Baseball', leagues: ['MLB'] },
    { name: 'hockey', displayName: 'Hockey', leagues: ['NHL'] },
    { name: 'soccer', displayName: 'Soccer', leagues: ['Premier League', 'La Liga'] },
    { name: 'tennis', displayName: 'Tennis', leagues: ['ATP', 'WTA'] },
    { name: 'golf', displayName: 'Golf', leagues: ['PGA Tour', 'LPGA'] }
  ];

  let workingSports = 0;
  let totalSports = sports.length;

  for (const sport of sports) {
    const result = await testApiEndpointWithValidation(
      `/api/games?sport=${sport.name}&limit=5`,
      `${sport.displayName} Games`,
      {
        minCount: 1,
        allowEmpty: false,
        requiredProps: ['id', 'homeTeam', 'awayTeam']
      }
    );

    if (result.success) {
      workingSports++;
      const dataLength = result.validation ? result.validation.dataLength : 'unknown';
      tracker.updateTest('sportsData', sport.name, 'working',
        `${dataLength} games found`);
    } else {
      tracker.updateTest('sportsData', sport.name, 'broken', result.error);
    }

    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  log(`${colors.green}✓ Sports coverage: ${workingSports}/${totalSports} sports working${colors.reset}`);
  return { workingSports, totalSports };
}

async function testDatabaseUpdates() {
  log(`${colors.bright}Testing Database Update System:${colors.reset}`);
  
  // Test live data updates
  const liveResult = await testApiEndpointWithValidation(
    '/api/live-scores?sport=basketball',
    'Live Scores Update',
    { allowEmpty: false, requiredProps: ['games'] }
  );

  if (liveResult.success) {
    const dataLength = liveResult.validation ? liveResult.validation.dataLength : 'unknown';
    tracker.updateTest('liveData', 'liveScores', 'working',
      `${dataLength} live scores found`);
  } else {
    tracker.updateTest('liveData', 'liveScores', 'broken', liveResult.error);
  }

  // Test live updates endpoint
  const updatesResult = await testApiEndpointWithValidation(
    '/api/live-updates',
    'Live Updates System',
    { allowEmpty: false }
  );

  if (updatesResult.success) {
    tracker.updateTest('liveData', 'realTimeUpdates', 'working',
      'Live updates system responding');
  } else {
    tracker.updateTest('liveData', 'realTimeUpdates', 'broken', updatesResult.error);
  }

  return { liveResult, updatesResult };
}

async function runComprehensiveVerification() {
  log(`${colors.bright}${colors.cyan}🔍 ApexBets Comprehensive Verification System${colors.reset}`);
  log(`${colors.cyan}======================================================${colors.reset}`);
  log(`${colors.yellow}Testing with REAL DATA ONLY - NO PLACEHOLDERS OR MOCK DATA${colors.reset}\n`);
  
  const results = [];
  
  // Test critical API endpoints with real data validation
  log(`${colors.bright}Testing Critical API Endpoints:${colors.reset}`);
  results.push(await testApiEndpointWithValidation('/api/health', 'Health Check', { allowEmpty: false }));
  results.push(await testApiEndpointWithValidation('/api/games?limit=5', 'Games Endpoint', {
    minCount: 1,
    allowEmpty: false,
    requiredProps: ['id', 'homeTeam', 'awayTeam'],
    checkSportsDiversity: true
  }));
  results.push(await testApiEndpointWithValidation('/api/teams?limit=5', 'Teams Endpoint', {
    minCount: 1,
    allowEmpty: false,
    requiredProps: ['id', 'name'],
    checkSportsDiversity: true
  }));
  results.push(await testApiEndpointWithValidation('/api/live-scores?sport=basketball', 'Live Scores', {
    allowEmpty: false,
    requiredProps: ['games']
  }));
  results.push(await testApiEndpointWithValidation('/api/odds/basketball', 'Odds', {
    allowEmpty: false,
    requiredProps: ['data']
  }));
  results.push(await testApiEndpointWithValidation('/api/predictions/upcoming?sport=basketball', 'Predictions', {
    allowEmpty: false,
    requiredProps: ['game_id', 'prediction']
  }));
  results.push(await testApiEndpointWithValidation('/api/analytics/team-performance?sport=basketball', 'Analytics', {
    allowEmpty: false,
    requiredProps: ['team', 'stats']
  }));
  results.push(await testApiEndpointWithValidation('/api/standings', 'Standings', {
    allowEmpty: false,
    minCount: 1
  }));
  results.push(await testApiEndpointWithValidation('/api/value-bets?sport=basketball', 'Value Bets', {
    allowEmpty: true // May be empty if no value bets found
  }));
  
  // Test multi-sport coverage
  log(`\n${colors.bright}Testing Multi-Sport Data Coverage:${colors.reset}`);
  const sportsCoverage = await testMultiSportCoverage();
  
  // Test database update system
  log(`\n${colors.bright}Testing Database Update System:${colors.reset}`);
  const databaseUpdates = await testDatabaseUpdates();
  
  log(`\n${colors.bright}Testing External APIs:${colors.reset}`);
  results.push(await testExternalApiEndpoint('https://www.thesportsdb.com/api/v1/json/123/eventsday.php?d=2024-01-01&s=basketball', 'SportsDB API', 5000));
  results.push(await testExternalApiEndpoint('https://api.balldontlie.io/v1/teams', 'BallDontLie API', 5000));
  
  // Test BallDontLie API with user's key (check multiple variable names)
  const ballDontLieKey = process.env.BALLDONTLIE_API_KEY ||
                         process.env.NEXT_PUBLIC_BALLDONTLIE_API_KEY;

  if (ballDontLieKey) {
    const ballDontLieResult = await quickTest('BallDontLie API (with key)', async () => {
      return await testExternalApi('https://api.balldontlie.io/v1/teams', 5000, {
        'Authorization': `Bearer ${ballDontLieKey}`
      });
    }, 5000);
    results.push(ballDontLieResult);
  }

  // Test with API keys if available
  if (process.env.ODDS_API_KEY && process.env.ODDS_API_KEY !== 'your_odds_api_key') {
    results.push(await testExternalApiEndpoint(`https://api.the-odds-api.com/v4/sports?apiKey=${process.env.ODDS_API_KEY}`, 'Odds API', 5000));
  } else {
    log(`${colors.yellow}⚠${colors.reset} Odds API - API key not configured`, 'yellow');
  }

  if (process.env.NEXT_PUBLIC_RAPIDAPI_KEY && process.env.NEXT_PUBLIC_RAPIDAPI_KEY !== 'your_rapidapi_key') {
    results.push(await testExternalApiEndpoint('https://api-football-v1.p.rapidapi.com/v3/leagues', 'API-SPORTS', 5000));
  } else {
    log(`${colors.yellow}⚠${colors.reset} API-SPORTS - API key not configured`, 'yellow');
  }
  
  // Update tracker with results
  const apiTests = [
    { name: 'health', endpoint: '/api/health' },
    { name: 'games', endpoint: '/api/games' },
    { name: 'teams', endpoint: '/api/teams' },
    { name: 'liveScores', endpoint: '/api/live-scores?sport=basketball' },
    { name: 'odds', endpoint: '/api/odds/basketball' },
    { name: 'predictions', endpoint: '/api/predictions/upcoming?sport=basketball' },
    { name: 'analytics', endpoint: '/api/analytics/team-performance?sport=basketball' },
    { name: 'standings', endpoint: '/api/standings' },
    { name: 'valueBets', endpoint: '/api/value-bets?sport=basketball' }
  ];
  
  apiTests.forEach((test, index) => {
    const result = results[index];
    if (result) {
      tracker.updateTest('apis', test.name, result.success ? 'working' : 'broken', 
        result.success ? `Working (${result.duration}ms)` : result.error);
    }
  });
  
  // Update external API results
  const externalApiTests = [
    { name: 'sportsDB', index: apiTests.length },
    { name: 'ballDontLie', index: apiTests.length + 1 }
  ];

  externalApiTests.forEach((test, i) => {
    const result = results[test.index];
    if (result) {
      tracker.updateTest('dataSources', test.name, result.success ? 'working' : 'broken',
        result.success ? `Working (${result.duration}ms)` : result.error);
    }
  });

  // Update BallDontLie API with key if available
  if (ballDontLieKey) {
    const ballDontLieWithKeyResult = results[externalApiTests.length + 1];
    if (ballDontLieWithKeyResult) {
      tracker.updateTest('dataSources', 'ballDontLie', ballDontLieWithKeyResult.success ? 'working' : 'broken',
        ballDontLieWithKeyResult.success ? `Working with API key (${ballDontLieWithKeyResult.duration}ms)` : ballDontLieWithKeyResult.error);
    }
  }
  
  // Generate comprehensive summary
  const successful = results.filter(r => r && r.success).length;
  const total = results.filter(r => r).length;
  const failed = total - successful;
  
  log(`\n${colors.bright}${colors.cyan}📊 Comprehensive Verification Summary${colors.reset}`);
  log(`${colors.cyan}=========================================${colors.reset}`);
  log(`${colors.green}✓ API Endpoints: ${successful}/${total} working${colors.reset}`);
  log(`${colors.green}✓ Sports Coverage: ${sportsCoverage.workingSports}/${sportsCoverage.totalSports} sports${colors.reset}`);
  log(`${colors.green}✓ Database Updates: ${databaseUpdates.liveResult.success ? 'Working' : 'Issues'}${colors.reset}`);
  log(`${colors.green}✓ Live Data: ${databaseUpdates.updatesResult.success ? 'Working' : 'Issues'}${colors.reset}`);
  
  // Show current status
  log(`\n${colors.bright}Current Status:${colors.reset}`);
  tracker.printStatus();
  
  // Generate report
  tracker.generateReport();
  
  // Return exit code based on critical failures
  const criticalFailures = failed + (sportsCoverage.totalSports - sportsCoverage.workingSports);
  
  if (criticalFailures > 0) {
    log(`\n${colors.red}❌ ${criticalFailures} critical issues found - Check verification-report.json for details${colors.reset}`);
    process.exit(1);
  } else {
    log(`\n${colors.green}✅ All critical tests passed! Real data verified across all endpoints.${colors.reset}`);
    process.exit(0);
  }
}

// Run if called directly
if (require.main === module) {
  runComprehensiveVerification().catch(error => {
    log(`${colors.red}❌ Comprehensive verification failed: ${error.message}${colors.reset}`);
    process.exit(1);
  });
}

module.exports = { runComprehensiveVerification };
