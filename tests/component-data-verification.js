#!/usr/bin/env node

/**
 * Component Data Verification Script
 * Verifies that each component has access to the correct data it needs
 * Tests real data accuracy and component functionality
 */

const fetch = require('node-fetch');

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

async function testApiEndpoint(endpoint, description) {
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`);
    const data = await response.json();
    
    if (!response.ok) {
      return {
        success: false,
        error: `HTTP ${response.status}: ${data.error || 'Unknown error'}`,
        data: null
      };
    }
    
    return {
      success: true,
      data,
      error: null
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      data: null
    };
  }
}

async function verifyComponentData() {
  log(`${colors.bright}${colors.cyan}🔍 Component Data Verification${colors.reset}`);
  log(`${colors.cyan}====================================${colors.reset}\n`);

  const results = {};

  // Test Stats Cards Component Data
  log(`${colors.bright}Testing Stats Cards Component:${colors.reset}`);
  const analyticsResult = await testApiEndpoint('/api/analytics/stats', 'Analytics Stats');
  results.statsCards = analyticsResult;
  
  if (analyticsResult.success) {
    const stats = analyticsResult.data.data;
    log(`${colors.green}✓ Analytics API working${colors.reset}`);
    log(`  - Total Games: ${stats.total_games || 0}`);
    log(`  - Total Predictions: ${stats.total_predictions || 0}`);
    log(`  - Total Teams: ${stats.total_teams || 0}`);
    log(`  - Accuracy Rate: ${Math.round((stats.accuracy_rate || 0) * 100)}%`);
    log(`  - Recent Predictions: ${stats.recent_predictions || 0}`);
  } else {
    log(`${colors.red}✗ Analytics API failed: ${analyticsResult.error}${colors.reset}`);
  }

  // Test Dashboard Overview Component Data
  log(`\n${colors.bright}Testing Dashboard Overview Component:${colors.reset}`);
  
  // Test upcoming games
  const upcomingGamesResult = await testApiEndpoint('/api/games?external=true&status=scheduled&limit=5', 'Upcoming Games');
  results.upcomingGames = upcomingGamesResult;
  
  if (upcomingGamesResult.success) {
    const games = upcomingGamesResult.data.data || upcomingGamesResult.data;
    log(`${colors.green}✓ Upcoming Games API working${colors.reset}`);
    log(`  - Found ${games.length} upcoming games`);
    if (games.length > 0) {
      const game = games[0];
      log(`  - Sample game: ${game.away_team?.name} @ ${game.home_team?.name}`);
      log(`  - Game date: ${game.game_date}`);
      log(`  - Status: ${game.status}`);
    }
  } else {
    log(`${colors.red}✗ Upcoming Games API failed: ${upcomingGamesResult.error}${colors.reset}`);
  }

  // Test live games
  const liveGamesResult = await testApiEndpoint('/api/games?external=true&status=in_progress&limit=5', 'Live Games');
  results.liveGames = liveGamesResult;
  
  if (liveGamesResult.success) {
    const games = liveGamesResult.data.data || liveGamesResult.data;
    log(`${colors.green}✓ Live Games API working${colors.reset}`);
    log(`  - Found ${games.length} live games`);
    if (games.length > 0) {
      const game = games[0];
      log(`  - Sample live game: ${game.away_team?.name} @ ${game.home_team?.name}`);
      log(`  - Score: ${game.away_score} - ${game.home_score}`);
    }
  } else {
    log(`${colors.red}✗ Live Games API failed: ${liveGamesResult.error}${colors.reset}`);
  }

  // Test Recent Games Component Data
  log(`\n${colors.bright}Testing Recent Games Component:${colors.reset}`);
  const recentGamesResult = await testApiEndpoint('/api/games?external=true&status=completed&limit=5', 'Recent Games');
  results.recentGames = recentGamesResult;
  
  if (recentGamesResult.success) {
    const games = recentGamesResult.data.data || recentGamesResult.data;
    log(`${colors.green}✓ Recent Games API working${colors.reset}`);
    log(`  - Found ${games.length} recent games`);
    if (games.length > 0) {
      const game = games[0];
      log(`  - Sample recent game: ${game.away_team?.name} @ ${game.home_team?.name}`);
      log(`  - Final score: ${game.away_score} - ${game.home_score}`);
      log(`  - Game date: ${game.game_date}`);
    }
  } else {
    log(`${colors.red}✗ Recent Games API failed: ${recentGamesResult.error}${colors.reset}`);
  }

  // Test Predictions Panel Component Data
  log(`\n${colors.bright}Testing Predictions Panel Component:${colors.reset}`);
  const predictionsResult = await testApiEndpoint('/api/predictions?limit=5', 'Predictions');
  results.predictions = predictionsResult;
  
  if (predictionsResult.success) {
    const predictions = predictionsResult.data.data || predictionsResult.data;
    log(`${colors.green}✓ Predictions API working${colors.reset}`);
    log(`  - Found ${predictions.length} predictions`);
    if (predictions.length > 0) {
      const prediction = predictions[0];
      log(`  - Sample prediction: ${prediction.prediction_type}`);
      log(`  - Confidence: ${Math.round((prediction.confidence || 0) * 100)}%`);
      log(`  - Model: ${prediction.model_name || 'Unknown'}`);
    } else {
      log(`${colors.yellow}⚠ No predictions found in database${colors.reset}`);
    }
  } else {
    log(`${colors.red}✗ Predictions API failed: ${predictionsResult.error}${colors.reset}`);
  }

  // Test Teams Data
  log(`\n${colors.bright}Testing Teams Data:${colors.reset}`);
  const teamsResult = await testApiEndpoint('/api/teams?external=true&sport=basketball&limit=5', 'Teams');
  results.teams = teamsResult;
  
  if (teamsResult.success) {
    const teams = teamsResult.data.data || teamsResult.data;
    log(`${colors.green}✓ Teams API working${colors.reset}`);
    log(`  - Found ${teams.length} teams`);
    if (teams.length > 0) {
      const team = teams[0];
      log(`  - Sample team: ${team.name} (${team.abbreviation})`);
      log(`  - City: ${team.city}`);
      log(`  - League: ${team.league}`);
    }
  } else {
    log(`${colors.red}✗ Teams API failed: ${teamsResult.error}${colors.reset}`);
  }

  // Test Live Data
  log(`\n${colors.bright}Testing Live Data:${colors.reset}`);
  const liveScoresResult = await testApiEndpoint('/api/live-scores', 'Live Scores');
  results.liveScores = liveScoresResult;
  
  if (liveScoresResult.success) {
    const liveScores = liveScoresResult.data.data || liveScoresResult.data;
    log(`${colors.green}✓ Live Scores API working${colors.reset}`);
    log(`  - Found ${liveScores.length} live scores`);
  } else {
    log(`${colors.red}✗ Live Scores API failed: ${liveScoresResult.error}${colors.reset}`);
  }

  // Test Odds Data
  log(`\n${colors.bright}Testing Odds Data:${colors.reset}`);
  const oddsResult = await testApiEndpoint('/api/odds?limit=5', 'Odds');
  results.odds = oddsResult;
  
  if (oddsResult.success) {
    const odds = oddsResult.data.data || oddsResult.data;
    log(`${colors.green}✓ Odds API working${colors.reset}`);
    log(`  - Found ${odds.length} odds entries`);
  } else {
    log(`${colors.red}✗ Odds API failed: ${oddsResult.error}${colors.reset}`);
  }

  // Test Standings Data
  log(`\n${colors.bright}Testing Standings Data:${colors.reset}`);
  const standingsResult = await testApiEndpoint('/api/standings?limit=5', 'Standings');
  results.standings = standingsResult;
  
  if (standingsResult.success) {
    const standings = standingsResult.data.data || standingsResult.data;
    log(`${colors.green}✓ Standings API working${colors.reset}`);
    log(`  - Found ${standings.length} standings entries`);
  } else {
    log(`${colors.red}✗ Standings API failed: ${standingsResult.error}${colors.reset}`);
  }

  // Generate Summary
  log(`\n${colors.bright}${colors.cyan}📊 Component Data Verification Summary${colors.reset}`);
  log(`${colors.cyan}==========================================${colors.reset}`);

  const workingApis = Object.values(results).filter(r => r.success).length;
  const totalApis = Object.keys(results).length;

  log(`${colors.green}✓ Working APIs: ${workingApis}/${totalApis}${colors.reset}`);
  
  // Component-specific status
  log(`\n${colors.bright}Component Status:${colors.reset}`);
  
  // Stats Cards
  if (results.statsCards?.success) {
    log(`${colors.green}✓ Stats Cards - Has analytics data${colors.reset}`);
  } else {
    log(`${colors.red}✗ Stats Cards - Missing analytics data${colors.reset}`);
  }

  // Dashboard Overview
  if (results.upcomingGames?.success || results.liveGames?.success) {
    log(`${colors.green}✓ Dashboard Overview - Has game data${colors.reset}`);
  } else {
    log(`${colors.red}✗ Dashboard Overview - Missing game data${colors.reset}`);
  }

  // Recent Games
  if (results.recentGames?.success) {
    log(`${colors.green}✓ Recent Games - Has completed games data${colors.reset}`);
  } else {
    log(`${colors.red}✗ Recent Games - Missing completed games data${colors.reset}`);
  }

  // Predictions Panel
  if (results.predictions?.success) {
    const predictions = results.predictions.data.data || results.predictions.data;
    if (predictions.length > 0) {
      log(`${colors.green}✓ Predictions Panel - Has prediction data${colors.reset}`);
    } else {
      log(`${colors.yellow}⚠ Predictions Panel - No predictions in database${colors.reset}`);
    }
  } else {
    log(`${colors.red}✗ Predictions Panel - Missing prediction data${colors.reset}`);
  }

  // Teams
  if (results.teams?.success) {
    log(`${colors.green}✓ Teams - Has team data${colors.reset}`);
  } else {
    log(`${colors.red}✗ Teams - Missing team data${colors.reset}`);
  }

  // Live Data
  if (results.liveScores?.success) {
    log(`${colors.green}✓ Live Data - Has live scores${colors.reset}`);
  } else {
    log(`${colors.red}✗ Live Data - Missing live scores${colors.reset}`);
  }

  // Recommendations
  log(`\n${colors.bright}${colors.yellow}💡 Recommendations:${colors.reset}`);
  
  if (!results.predictions?.success || (results.predictions.data.data || results.predictions.data).length === 0) {
    log(`${colors.yellow}  • Consider implementing prediction generation for upcoming games${colors.reset}`);
  }
  
  if (!results.liveScores?.success) {
    log(`${colors.yellow}  • Check live scores API implementation${colors.reset}`);
  }
  
  if (!results.odds?.success) {
    log(`${colors.yellow}  • Verify odds API configuration${colors.reset}`);
  }

  return results;
}

// Run if called directly
if (require.main === module) {
  verifyComponentData().then(results => {
    const workingApis = Object.values(results).filter(r => r.success).length;
    const totalApis = Object.keys(results).length;
    
    if (workingApis === totalApis) {
      log(`\n${colors.green}✅ All components have access to correct data!${colors.reset}`);
      process.exit(0);
    } else {
      log(`\n${colors.red}❌ Some components are missing data - Check the report above${colors.reset}`);
      process.exit(1);
    }
  }).catch(error => {
    log(`${colors.red}❌ Component verification failed: ${error.message}${colors.reset}`);
    process.exit(1);
  });
}

module.exports = { verifyComponentData };
