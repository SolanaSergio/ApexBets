#!/usr/bin/env node

/**
 * Quick Verification Script
 * Fast check of critical ApexBets functionality
 * Uses VerificationTracker to avoid repeat testing
 */

const VerificationTracker = require('./verification-tracker');
const fetch = require('node-fetch');

// Initialize tracker
const tracker = new VerificationTracker();

// Configuration
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

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

async function quickTest(name, testFn) {
  const startTime = Date.now();
  try {
    const result = await testFn();
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

async function testApiEndpoint(endpoint, description) {
  return quickTest(description, async () => {
    const response = await fetch(`${BASE_URL}${endpoint}`);
    const data = await response.json();
    
    if (!response.ok) {
      return { success: false, error: `HTTP ${response.status}: ${data.error || 'Unknown error'}` };
    }
    
    return { success: true, data };
  });
}

async function testExternalApi(url, description) {
  return quickTest(description, async () => {
    const response = await fetch(url);
    
    if (!response.ok) {
      return { success: false, error: `HTTP ${response.status}` };
    }
    
    const data = await response.json();
    return { success: true, data };
  });
}

async function runQuickVerification() {
  log(`${colors.bright}${colors.cyan}🚀 ApexBets Quick Verification${colors.reset}`);
  log(`${colors.cyan}====================================${colors.reset}\n`);
  
  const results = [];
  
  // Test critical API endpoints
  log(`${colors.bright}Testing API Endpoints:${colors.reset}`);
  results.push(await testApiEndpoint('/api/health', 'Health Check'));
  results.push(await testApiEndpoint('/api/games?limit=5', 'Games Endpoint'));
  results.push(await testApiEndpoint('/api/teams?limit=5', 'Teams Endpoint'));
  results.push(await testApiEndpoint('/api/live-scores', 'Live Scores'));
  results.push(await testApiEndpoint('/api/odds', 'Odds'));
  results.push(await testApiEndpoint('/api/predictions', 'Predictions'));
  results.push(await testApiEndpoint('/api/analytics/stats', 'Analytics'));
  results.push(await testApiEndpoint('/api/standings', 'Standings'));
  results.push(await testApiEndpoint('/api/value-bets', 'Value Bets'));
  
  log(`\n${colors.bright}Testing External APIs:${colors.reset}`);
  results.push(await testExternalApi('https://www.thesportsdb.com/api/v1/json/123/eventsday.php?d=2024-01-01&s=basketball', 'SportsDB API'));
  
  // Test BallDontLie API only if we have the API key
  if (process.env.NEXT_PUBLIC_BALLDONTLIE_API_KEY && process.env.NEXT_PUBLIC_BALLDONTLIE_API_KEY !== 'your_balldontlie_api_key') {
    results.push(await testExternalApi('https://api.balldontlie.io/v1/teams', 'BallDontLie API'));
  } else {
    log(`${colors.yellow}⚠ BallDontLie API - API key not configured${colors.reset}`);
  }
  
  // Test with API keys if available
  if (process.env.ODDS_API_KEY && process.env.ODDS_API_KEY !== 'your_odds_api_key') {
    results.push(await testExternalApi(`https://api.the-odds-api.com/v4/sports?apiKey=${process.env.ODDS_API_KEY}`, 'Odds API'));
  } else {
    log(`${colors.yellow}⚠${colors.reset} Odds API - API key not configured`, 'yellow');
  }
  
  if (process.env.NEXT_PUBLIC_RAPIDAPI_KEY && process.env.NEXT_PUBLIC_RAPIDAPI_KEY !== 'your_rapidapi_key') {
    results.push(await testExternalApi('https://api-football-v1.p.rapidapi.com/v3/leagues', 'API-SPORTS'));
  } else {
    log(`${colors.yellow}⚠${colors.reset} API-SPORTS - API key not configured`, 'yellow');
  }
  
  // Update tracker with results
  const apiTests = [
    { name: 'health', endpoint: '/api/health' },
    { name: 'games', endpoint: '/api/games' },
    { name: 'teams', endpoint: '/api/teams' },
    { name: 'liveScores', endpoint: '/api/live-scores' },
    { name: 'odds', endpoint: '/api/odds' },
    { name: 'predictions', endpoint: '/api/predictions' },
    { name: 'analytics', endpoint: '/api/analytics/stats' },
    { name: 'standings', endpoint: '/api/standings' },
    { name: 'valueBets', endpoint: '/api/value-bets' }
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
    { name: 'sportsDB', index: apiTests.length }
  ];
  
  // Add BallDontLie if we tested it
  if (process.env.NEXT_PUBLIC_BALLDONTLIE_API_KEY && process.env.NEXT_PUBLIC_BALLDONTLIE_API_KEY !== 'your_balldontlie_api_key') {
    externalApiTests.push({ name: 'ballDontLie', index: apiTests.length + 1 });
  } else {
    tracker.updateTest('dataSources', 'ballDontLie', 'unknown', 'API key not configured');
  }
  
  externalApiTests.forEach((test, i) => {
    const result = results[test.index];
    if (result) {
      tracker.updateTest('dataSources', test.name, result.success ? 'working' : 'broken',
        result.success ? `Working (${result.duration}ms)` : result.error);
    }
  });
  
  // Generate summary
  const successful = results.filter(r => r && r.success).length;
  const total = results.filter(r => r).length;
  const failed = total - successful;
  
  log(`\n${colors.bright}Quick Verification Summary:${colors.reset}`);
  log(`${colors.green}✓ Successful: ${successful}${colors.reset}`);
  log(`${colors.red}✗ Failed: ${failed}${colors.reset}`);
  log(`${colors.blue}Total: ${total}${colors.reset}`);
  
  // Show current status
  log(`\n${colors.bright}Current Status:${colors.reset}`);
  tracker.printStatus();
  
  // Generate report
  tracker.generateReport();
  
  // Return exit code
  if (failed > 0) {
    log(`\n${colors.red}❌ Some tests failed - Check the verification report for details${colors.reset}`);
    process.exit(1);
  } else {
    log(`\n${colors.green}✅ All critical tests passed!${colors.reset}`);
    process.exit(0);
  }
}

// Run if called directly
if (require.main === module) {
  runQuickVerification().catch(error => {
    log(`${colors.red}❌ Quick verification failed: ${error.message}${colors.reset}`);
    process.exit(1);
  });
}

module.exports = { runQuickVerification };
