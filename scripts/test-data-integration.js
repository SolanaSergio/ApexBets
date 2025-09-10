#!/usr/bin/env node

/**
 * Test Data Integration
 * Verifies that all components receive real data and no mock data exists
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env.local' });

console.log('🧪 Testing Data Integration...');
console.log('==============================\n');

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

class DataIntegrationTester {
  constructor() {
    this.testResults = {
      teams: { total: 0, real: 0, mock: 0 },
      games: { total: 0, real: 0, mock: 0 },
      playerStats: { total: 0, real: 0, mock: 0 },
      predictions: { total: 0, real: 0, mock: 0 },
      odds: { total: 0, real: 0, mock: 0 }
    };
  }

  async runAllTests() {
    console.log('🔍 Running comprehensive data integration tests...\n');
    
    try {
      await Promise.all([
        this.testTeamsData(),
        this.testGamesData(),
        this.testPlayerStatsData(),
        this.testPredictionsData(),
        this.testOddsData()
      ]);

      this.generateTestReport();
      
    } catch (error) {
      console.error('❌ Test failed:', error.message);
    }
  }

  async testTeamsData() {
    console.log('📊 Testing teams data...');
    
    try {
      const { data: teams, error } = await supabase
        .from('teams')
        .select('name, city, abbreviation, logo_url, sport')
        .limit(100);

      if (error) {
        console.log('   ❌ Error fetching teams:', error.message);
        return;
      }

      if (teams) {
        this.testResults.teams.total = teams.length;
        
        teams.forEach(team => {
          if (this.isMockData(team.name) || this.isPlaceholder(team.name)) {
            this.testResults.teams.mock++;
          } else {
            this.testResults.teams.real++;
          }
        });
        
        console.log(`   ✅ Teams: ${this.testResults.teams.real} real, ${this.testResults.teams.mock} mock`);
      }
      
    } catch (error) {
      console.log('   ❌ Error testing teams:', error.message);
    }
  }

  async testGamesData() {
    console.log('🏟️  Testing games data...');
    
    try {
      const { data: games, error } = await supabase
        .from('games')
        .select('home_team_id, away_team_id, venue, status, sport')
        .limit(100);

      if (error) {
        console.log('   ❌ Error fetching games:', error.message);
        return;
      }

      if (games) {
        this.testResults.games.total = games.length;
        
        games.forEach(game => {
          if (this.isMockData(game.home_team_id) || this.isMockData(game.away_team_id)) {
            this.testResults.games.mock++;
          } else {
            this.testResults.games.real++;
          }
        });
        
        console.log(`   ✅ Games: ${this.testResults.games.real} real, ${this.testResults.games.mock} mock`);
      }
      
    } catch (error) {
      console.log('   ❌ Error testing games:', error.message);
    }
  }

  async testPlayerStatsData() {
    console.log('👥 Testing player stats data...');
    
    try {
      const { data: playerStats, error } = await supabase
        .from('player_stats')
        .select('player_name, team_id, position')
        .limit(100);

      if (error) {
        console.log('   ❌ Error fetching player stats:', error.message);
        return;
      }

      if (playerStats) {
        this.testResults.playerStats.total = playerStats.length;
        
        playerStats.forEach(stat => {
          if (this.isMockData(stat.player_name) || this.isPlaceholder(stat.player_name)) {
            this.testResults.playerStats.mock++;
          } else {
            this.testResults.playerStats.real++;
          }
        });
        
        console.log(`   ✅ Player Stats: ${this.testResults.playerStats.real} real, ${this.testResults.playerStats.mock} mock`);
      }
      
    } catch (error) {
      console.log('   ❌ Error testing player stats:', error.message);
    }
  }

  async testPredictionsData() {
    console.log('🔮 Testing predictions data...');
    
    try {
      const { data: predictions, error } = await supabase
        .from('predictions')
        .select('model_name, reasoning, confidence')
        .limit(100);

      if (error) {
        console.log('   ❌ Error fetching predictions:', error.message);
        return;
      }

      if (predictions) {
        this.testResults.predictions.total = predictions.length;
        
        predictions.forEach(pred => {
          if (this.isMockData(pred.model_name) || this.isPlaceholder(pred.model_name)) {
            this.testResults.predictions.mock++;
          } else {
            this.testResults.predictions.real++;
          }
        });
        
        console.log(`   ✅ Predictions: ${this.testResults.predictions.real} real, ${this.testResults.predictions.mock} mock`);
      }
      
    } catch (error) {
      console.log('   ❌ Error testing predictions:', error.message);
    }
  }

  async testOddsData() {
    console.log('💰 Testing odds data...');
    
    try {
      const { data: odds, error } = await supabase
        .from('odds')
        .select('source, home_odds, away_odds, odds_type')
        .limit(100);

      if (error) {
        console.log('   ❌ Error fetching odds:', error.message);
        return;
      }

      if (odds) {
        this.testResults.odds.total = odds.length;
        
        odds.forEach(odd => {
          if (this.isMockData(odd.source) || this.isPlaceholder(odd.source)) {
            this.testResults.odds.mock++;
          } else {
            this.testResults.odds.real++;
          }
        });
        
        console.log(`   ✅ Odds: ${this.testResults.odds.real} real, ${this.testResults.odds.mock} mock`);
      }
      
    } catch (error) {
      console.log('   ❌ Error testing odds:', error.message);
    }
  }

  isMockData(value) {
    if (!value) return false;
    
    const mockPatterns = [
      /mock/i,
      /fake/i,
      /sample/i,
      /test/i,
      /dummy/i,
      /placeholder/i,
      /example/i
    ];
    
    return mockPatterns.some(pattern => pattern.test(value));
  }

  isPlaceholder(value) {
    if (!value) return false;
    
    const placeholderPatterns = [
      /your_.*_key/i,
      /your_.*_url/i,
      /placeholder/i,
      /example/i,
      /sample/i
    ];
    
    return placeholderPatterns.some(pattern => pattern.test(value));
  }

  generateTestReport() {
    console.log('\n📊 TEST REPORT');
    console.log('===============\n');
    
    let totalReal = 0;
    let totalMock = 0;
    let totalRecords = 0;
    
    Object.entries(this.testResults).forEach(([table, results]) => {
      totalReal += results.real;
      totalMock += results.mock;
      totalRecords += results.total;
      
      const percentage = results.total > 0 ? ((results.real / results.total) * 100).toFixed(1) : 0;
      
      console.log(`${table.toUpperCase()}:`);
      console.log(`   Total Records: ${results.total}`);
      console.log(`   Real Data: ${results.real} (${percentage}%)`);
      console.log(`   Mock Data: ${results.mock}`);
      console.log('');
    });
    
    const overallPercentage = totalRecords > 0 ? ((totalReal / totalRecords) * 100).toFixed(1) : 0;
    
    console.log('OVERALL RESULTS:');
    console.log(`   Total Records: ${totalRecords}`);
    console.log(`   Real Data: ${totalReal} (${overallPercentage}%)`);
    console.log(`   Mock Data: ${totalMock}`);
    console.log('');
    
    if (totalMock === 0) {
      console.log('🎉 SUCCESS: No mock data found!');
      console.log('✅ All data is real and properly integrated');
    } else {
      console.log('⚠️  WARNING: Mock data still exists');
      console.log('🔧 Run the data manager to clean up mock data');
    }
    
    if (overallPercentage >= 90) {
      console.log('🌟 EXCELLENT: Data integration is working well');
    } else if (overallPercentage >= 70) {
      console.log('👍 GOOD: Data integration is mostly working');
    } else {
      console.log('❌ POOR: Data integration needs improvement');
    }
  }
}

// Run the tests
const tester = new DataIntegrationTester();
tester.runAllTests().catch(console.error);
