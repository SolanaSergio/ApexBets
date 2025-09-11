#!/usr/bin/env node

/**
 * Dynamic Behavior Test Script
 * Tests all API endpoints and components to ensure they work with different sports/teams/players
 */

const https = require('https');
const http = require('http');

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

// Test sports to verify dynamic behavior
const TEST_SPORTS = ['basketball', 'football', 'soccer', 'hockey', 'baseball'];

// Test leagues for each sport
const TEST_LEAGUES = {
  basketball: ['NBA', 'WNBA'],
  football: ['NFL', 'CFL'],
  soccer: ['Premier League', 'La Liga', 'Bundesliga'],
  hockey: ['NHL', 'AHL'],
  baseball: ['MLB', 'MiLB']
};

async function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    
    protocol.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({ status: res.statusCode, data: jsonData });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    }).on('error', reject);
  });
}

async function testAnalyticsStats(sport, league) {
  console.log(`\n🧪 Testing Analytics Stats for ${sport}${league ? ` (${league})` : ''}`);
  
  const params = new URLSearchParams({
    sport: sport,
    external: 'true'
  });
  if (league) params.set('league', league);
  
  const url = `${BASE_URL}/api/analytics/stats?${params}`;
  const result = await makeRequest(url);
  
  if (result.status === 200) {
    console.log(`✅ Analytics Stats API working for ${sport}`);
    console.log(`   - Total Games: ${result.data.data?.total_games || 0}`);
    console.log(`   - Total Predictions: ${result.data.data?.total_predictions || 0}`);
    console.log(`   - Accuracy Rate: ${(result.data.data?.accuracy_rate * 100 || 0).toFixed(1)}%`);
    console.log(`   - Sport: ${result.data.meta?.sport || 'unknown'}`);
    console.log(`   - League: ${result.data.meta?.league || 'unknown'}`);
  } else {
    console.log(`❌ Analytics Stats API failed for ${sport}: ${result.status}`);
    console.log(`   Error: ${result.data.error || 'Unknown error'}`);
  }
  
  return result.status === 200;
}

async function testTeamsAPI(sport, league) {
  console.log(`\n🏀 Testing Teams API for ${sport}${league ? ` (${league})` : ''}`);
  
  const params = new URLSearchParams({
    sport: sport,
    external: 'true'
  });
  if (league) params.set('league', league);
  
  const url = `${BASE_URL}/api/teams?${params}`;
  const result = await makeRequest(url);
  
  if (result.status === 200) {
    console.log(`✅ Teams API working for ${sport}`);
    console.log(`   - Teams found: ${result.data.data?.length || 0}`);
    if (result.data.data?.length > 0) {
      console.log(`   - Sample team: ${result.data.data[0].name} (${result.data.data[0].abbreviation})`);
      console.log(`   - Sport: ${result.data.data[0].sport}`);
      console.log(`   - League: ${result.data.data[0].league}`);
    }
  } else {
    console.log(`❌ Teams API failed for ${sport}: ${result.status}`);
    console.log(`   Error: ${result.data.error || 'Unknown error'}`);
  }
  
  return result.status === 200;
}

async function testGamesAPI(sport, league) {
  console.log(`\n⚽ Testing Games API for ${sport}${league ? ` (${league})` : ''}`);
  
  const params = new URLSearchParams({
    sport: sport,
    external: 'true',
    date: new Date().toISOString().split('T')[0]
  });
  if (league) params.set('league', league);
  
  const url = `${BASE_URL}/api/games?${params}`;
  const result = await makeRequest(url);
  
  if (result.status === 200) {
    console.log(`✅ Games API working for ${sport}`);
    console.log(`   - Games found: ${result.data.data?.length || 0}`);
    if (result.data.data?.length > 0) {
      const game = result.data.data[0];
      console.log(`   - Sample game: ${game.away_team?.name} vs ${game.home_team?.name}`);
      console.log(`   - Status: ${game.status}`);
      console.log(`   - Date: ${game.game_date}`);
    }
  } else {
    console.log(`❌ Games API failed for ${sport}: ${result.status}`);
    console.log(`   Error: ${result.data.error || 'Unknown error'}`);
  }
  
  return result.status === 200;
}

async function testPlayersAPI(sport, league) {
  console.log(`\n👤 Testing Players API for ${sport}${league ? ` (${league})` : ''}`);
  
  const params = new URLSearchParams({
    sport: sport,
    limit: '10'
  });
  if (league) params.set('league', league);
  
  const url = `${BASE_URL}/api/players?${params}`;
  const result = await makeRequest(url);
  
  if (result.status === 200) {
    console.log(`✅ Players API working for ${sport}`);
    console.log(`   - Players found: ${result.data.data?.length || 0}`);
    if (result.data.data?.length > 0) {
      const player = result.data.data[0];
      console.log(`   - Sample player: ${player.first_name} ${player.last_name}`);
      console.log(`   - Team: ${player.team?.name || 'Unknown'}`);
      console.log(`   - Position: ${player.position || 'Unknown'}`);
    }
  } else {
    console.log(`❌ Players API failed for ${sport}: ${result.status}`);
    console.log(`   Error: ${result.data.error || 'Unknown error'}`);
  }
  
  return result.status === 200;
}

async function testTrendsAPI(sport, league) {
  console.log(`\n📈 Testing Trends API for ${sport}${league ? ` (${league})` : ''}`);
  
  const params = new URLSearchParams({
    sport: sport
  });
  if (league) params.set('league', league);
  
  const url = `${BASE_URL}/api/analytics/trends?${params}`;
  const result = await makeRequest(url);
  
  if (result.status === 200) {
    console.log(`✅ Trends API working for ${sport}`);
    console.log(`   - Volume: ${result.data.trends?.volume || 0}`);
    console.log(`   - Trend Direction: ${result.data.trends?.trend_direction || 'unknown'}`);
    console.log(`   - Confidence: ${result.data.trends?.confidence || 0}%`);
    console.log(`   - Games Analyzed: ${result.data.meta?.games_analyzed || 0}`);
  } else {
    console.log(`❌ Trends API failed for ${sport}: ${result.status}`);
    console.log(`   Error: ${result.data.error || 'Unknown error'}`);
  }
  
  return result.status === 200;
}

async function runTests() {
  console.log('🚀 Starting Dynamic Behavior Tests');
  console.log('=====================================');
  
  const results = {
    total: 0,
    passed: 0,
    failed: 0
  };
  
  for (const sport of TEST_SPORTS) {
    console.log(`\n🏆 Testing ${sport.toUpperCase()}`);
    console.log('='.repeat(30));
    
    // Test without league
    const tests = [
      () => testAnalyticsStats(sport),
      () => testTeamsAPI(sport),
      () => testGamesAPI(sport),
      () => testPlayersAPI(sport),
      () => testTrendsAPI(sport)
    ];
    
    for (const test of tests) {
      results.total++;
      const passed = await test();
      if (passed) {
        results.passed++;
      } else {
        results.failed++;
      }
    }
    
    // Test with leagues if available
    const leagues = TEST_LEAGUES[sport] || [];
    for (const league of leagues) {
      console.log(`\n📊 Testing ${sport} with ${league}`);
      
      const leagueTests = [
        () => testAnalyticsStats(sport, league),
        () => testTeamsAPI(sport, league),
        () => testGamesAPI(sport, league),
        () => testPlayersAPI(sport, league),
        () => testTrendsAPI(sport, league)
      ];
      
      for (const test of leagueTests) {
        results.total++;
        const passed = await test();
        if (passed) {
          results.passed++;
        } else {
          results.failed++;
        }
      }
    }
  }
  
  console.log('\n📊 Test Results Summary');
  console.log('======================');
  console.log(`Total Tests: ${results.total}`);
  console.log(`Passed: ${results.passed} ✅`);
  console.log(`Failed: ${results.failed} ❌`);
  console.log(`Success Rate: ${((results.passed / results.total) * 100).toFixed(1)}%`);
  
  if (results.failed === 0) {
    console.log('\n🎉 All tests passed! The application is fully dynamic.');
  } else {
    console.log('\n⚠️  Some tests failed. Check the logs above for details.');
  }
  
  process.exit(results.failed === 0 ? 0 : 1);
}

// Run the tests
runTests().catch(console.error);
