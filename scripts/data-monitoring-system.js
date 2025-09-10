#!/usr/bin/env node

/**
 * Comprehensive Data Monitoring System
 * Monitors data accuracy, completeness, and freshness across all sports
 */

const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');
require('dotenv').config({ path: '.env.local' });

console.log('🔍 ApexBets Data Monitoring System');
console.log('==================================\n');

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// API configurations
const SPORTSDB_API_KEY = process.env.NEXT_PUBLIC_SPORTSDB_API_KEY || '123';
const RAPIDAPI_KEY = process.env.NEXT_PUBLIC_RAPIDAPI_KEY || '';
const ODDS_API_KEY = process.env.NEXT_PUBLIC_ODDS_API_KEY || '';

class DataMonitor {
  constructor() {
    this.report = {
      timestamp: new Date().toISOString(),
      overallHealth: 'unknown',
      sports: {},
      apis: {},
      database: {},
      recommendations: []
    };
  }

  async runFullCheck() {
    console.log('🔄 Running comprehensive data verification...\n');
    
    try {
      await Promise.all([
        this.checkExternalAPIs(),
        this.checkDatabaseData(),
        this.checkDataFreshness(),
        this.checkDataCompleteness(),
        this.checkDataAccuracy()
      ]);

      this.generateReport();
      this.printReport();
      
    } catch (error) {
      console.error('❌ Monitoring system error:', error);
      this.report.overallHealth = 'error';
      this.report.error = error.message;
    }
  }

  async checkExternalAPIs() {
    console.log('🌐 Checking external API connectivity...');
    
    const apis = {
      sportsdb: await this.testSportsDB(),
      balldontlie: await this.testBallDontLie(),
      odds: await this.testOddsAPI(),
      rapidapi: await this.testRapidAPI()
    };

    this.report.apis = apis;
    
    const workingAPIs = Object.values(apis).filter(api => api.status === 'success').length;
    console.log(`   ✅ ${workingAPIs}/${Object.keys(apis).length} APIs working\n`);
  }

  async testSportsDB() {
    try {
      const response = await fetch(`https://www.thesportsdb.com/api/v1/json/${SPORTSDB_API_KEY}/eventsday.php?d=${new Date().toISOString().split('T')[0]}&s=basketball`);
      const data = await response.json();
      
      return {
        status: 'success',
        responseTime: Date.now(),
        dataCount: data.events?.length || 0,
        sampleData: data.events?.[0] || null
      };
    } catch (error) {
      return {
        status: 'error',
        error: error.message
      };
    }
  }

  async testBallDontLie() {
    try {
      const response = await fetch('https://www.balldontlie.io/api/v1/games');
      const data = await response.json();
      
      return {
        status: 'success',
        responseTime: Date.now(),
        dataCount: data.data?.length || 0,
        sampleData: data.data?.[0] || null
      };
    } catch (error) {
      return {
        status: 'error',
        error: error.message
      };
    }
  }

  async testOddsAPI() {
    if (!ODDS_API_KEY || ODDS_API_KEY === 'your_odds_api_key') {
      return {
        status: 'skipped',
        reason: 'API key not configured'
      };
    }

    try {
      const response = await fetch(`https://api.the-odds-api.com/v4/sports/basketball_nba/odds/?apiKey=${ODDS_API_KEY}`);
      const data = await response.json();
      
      return {
        status: 'success',
        responseTime: Date.now(),
        dataCount: data.length || 0,
        sampleData: data[0] || null
      };
    } catch (error) {
      return {
        status: 'error',
        error: error.message
      };
    }
  }

  async testRapidAPI() {
    if (!RAPIDAPI_KEY || RAPIDAPI_KEY === 'your_rapidapi_key') {
      return {
        status: 'skipped',
        reason: 'API key not configured'
      };
    }

    try {
      const response = await fetch('https://api-sports.p.rapidapi.com/football/fixtures', {
        headers: {
          'X-RapidAPI-Key': RAPIDAPI_KEY,
          'X-RapidAPI-Host': 'api-sports.p.rapidapi.com'
        }
      });
      const data = await response.json();
      
      return {
        status: 'success',
        responseTime: Date.now(),
        dataCount: data.response?.length || 0,
        sampleData: data.response?.[0] || null
      };
    } catch (error) {
      return {
        status: 'error',
        error: error.message
      };
    }
  }

  async checkDatabaseData() {
    console.log('🗄️  Checking database data...');
    
    const tables = ['teams', 'games', 'odds', 'predictions', 'league_standings'];
    const dbStats = {};

    for (const table of tables) {
      try {
        const { count, error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });

        if (error) throw error;

        dbStats[table] = {
          count: count || 0,
          status: count > 0 ? 'populated' : 'empty'
        };
      } catch (error) {
        dbStats[table] = {
          count: 0,
          status: 'error',
          error: error.message
        };
      }
    }

    this.report.database = dbStats;
    
    const populatedTables = Object.values(dbStats).filter(table => table.status === 'populated').length;
    console.log(`   📊 ${populatedTables}/${tables.length} tables populated\n`);
  }

  async checkDataFreshness() {
    console.log('⏰ Checking data freshness...');
    
    const freshness = {};
    const now = new Date();
    
    // Check games table for recent data
    try {
      const { data: recentGames, error } = await supabase
        .from('games')
        .select('game_date, created_at')
        .order('created_at', { ascending: false })
        .limit(1);

      if (recentGames && recentGames.length > 0) {
        const lastUpdate = new Date(recentGames[0].created_at);
        const hoursSinceUpdate = (now - lastUpdate) / (1000 * 60 * 60);
        
        freshness.games = {
          lastUpdate: lastUpdate.toISOString(),
          hoursSinceUpdate: Math.round(hoursSinceUpdate * 100) / 100,
          status: hoursSinceUpdate < 24 ? 'fresh' : 'stale'
        };
      } else {
        freshness.games = {
          status: 'no_data',
          message: 'No games found in database'
        };
      }
    } catch (error) {
      freshness.games = {
        status: 'error',
        error: error.message
      };
    }

    this.report.freshness = freshness;
    
    const freshData = Object.values(freshness).filter(item => item.status === 'fresh').length;
    console.log(`   🕐 ${freshData}/${Object.keys(freshness).length} data sources fresh\n`);
  }

  async checkDataCompleteness() {
    console.log('📋 Checking data completeness...');
    
    const sports = ['basketball', 'football', 'baseball', 'hockey', 'soccer', 'tennis', 'golf'];
    const completeness = {};

    for (const sport of sports) {
      try {
        // Check teams
        const { count: teamCount } = await supabase
          .from('teams')
          .select('*', { count: 'exact', head: true })
          .eq('sport', sport);

        // Check games
        const { count: gameCount } = await supabase
          .from('games')
          .select('*', { count: 'exact', head: true })
          .eq('sport', sport);

        // Check standings
        const { count: standingCount } = await supabase
          .from('league_standings')
          .select('*', { count: 'exact', head: true })
          .eq('sport', sport);

        completeness[sport] = {
          teams: teamCount || 0,
          games: gameCount || 0,
          standings: standingCount || 0,
          completeness: this.calculateCompleteness(teamCount, gameCount, standingCount)
        };
      } catch (error) {
        completeness[sport] = {
          status: 'error',
          error: error.message
        };
      }
    }

    this.report.completeness = completeness;
    
    const completeSports = Object.values(completeness).filter(sport => 
      sport.completeness && sport.completeness > 50
    ).length;
    console.log(`   📈 ${completeSports}/${sports.length} sports have good data coverage\n`);
  }

  calculateCompleteness(teams, games, standings) {
    if (!teams) return 0;
    
    const weights = { teams: 0.3, games: 0.5, standings: 0.2 };
    const scores = {
      teams: teams > 0 ? 100 : 0,
      games: games > 0 ? 100 : 0,
      standings: standings > 0 ? 100 : 0
    };
    
    return Math.round(
      scores.teams * weights.teams + 
      scores.games * weights.games + 
      scores.standings * weights.standings
    );
  }

  async checkDataAccuracy() {
    console.log('🎯 Checking data accuracy...');
    
    const accuracy = {
      realData: false,
      noPlaceholders: true,
      validStructure: true,
      issues: []
    };

    // Check if we have real data from external APIs
    const workingAPIs = Object.values(this.report.apis).filter(api => api.status === 'success');
    accuracy.realData = workingAPIs.length > 0;

    // Check for placeholder data in database
    try {
      const { data: teams } = await supabase
        .from('teams')
        .select('name, city')
        .limit(10);

      if (teams) {
        const hasPlaceholders = teams.some(team => 
          team.name.includes('placeholder') || 
          team.name.includes('mock') ||
          team.name.includes('test')
        );
        accuracy.noPlaceholders = !hasPlaceholders;
      }
    } catch (error) {
      accuracy.issues.push(`Error checking for placeholders: ${error.message}`);
    }

    this.report.accuracy = accuracy;
    console.log(`   ✅ Real data: ${accuracy.realData ? 'Yes' : 'No'}`);
    console.log(`   ✅ No placeholders: ${accuracy.noPlaceholders ? 'Yes' : 'No'}\n`);
  }

  generateReport() {
    // Calculate overall health
    const apiHealth = Object.values(this.report.apis).filter(api => api.status === 'success').length;
    const dbHealth = Object.values(this.report.database).filter(table => table.status === 'populated').length;
    const accuracyHealth = this.report.accuracy.realData && this.report.accuracy.noPlaceholders;

    if (apiHealth >= 2 && dbHealth >= 2 && accuracyHealth) {
      this.report.overallHealth = 'excellent';
    } else if (apiHealth >= 1 && dbHealth >= 1) {
      this.report.overallHealth = 'good';
    } else if (apiHealth >= 1 || dbHealth >= 1) {
      this.report.overallHealth = 'fair';
    } else {
      this.report.overallHealth = 'poor';
    }

    // Generate recommendations
    this.generateRecommendations();
  }

  generateRecommendations() {
    const recommendations = [];

    // API recommendations
    const failedAPIs = Object.entries(this.report.apis)
      .filter(([name, api]) => api.status === 'error')
      .map(([name]) => name);

    if (failedAPIs.length > 0) {
      recommendations.push({
        priority: 'high',
        category: 'API',
        issue: `Failed APIs: ${failedAPIs.join(', ')}`,
        solution: 'Check API keys and endpoints, update configuration'
      });
    }

    // Database recommendations
    const emptyTables = Object.entries(this.report.database)
      .filter(([name, table]) => table.status === 'empty')
      .map(([name]) => name);

    if (emptyTables.length > 0) {
      recommendations.push({
        priority: 'high',
        category: 'Database',
        issue: `Empty tables: ${emptyTables.join(', ')}`,
        solution: 'Run data population scripts to populate database'
      });
    }

    // Freshness recommendations
    if (this.report.freshness.games?.status === 'stale') {
      recommendations.push({
        priority: 'medium',
        category: 'Freshness',
        issue: 'Games data is stale',
        solution: 'Update data population schedule or fix update service'
      });
    }

    this.report.recommendations = recommendations;
  }

  printReport() {
    console.log('📊 DATA MONITORING REPORT');
    console.log('========================\n');

    console.log(`Overall Health: ${this.getHealthEmoji(this.report.overallHealth)} ${this.report.overallHealth.toUpperCase()}`);
    console.log(`Timestamp: ${this.report.timestamp}\n`);

    // API Status
    console.log('🌐 API STATUS:');
    Object.entries(this.report.apis).forEach(([name, api]) => {
      const status = api.status === 'success' ? '✅' : api.status === 'error' ? '❌' : '⚠️';
      console.log(`   ${status} ${name.toUpperCase()}: ${api.status}`);
      if (api.dataCount) console.log(`      Data count: ${api.dataCount}`);
      if (api.error) console.log(`      Error: ${api.error}`);
    });

    // Database Status
    console.log('\n🗄️  DATABASE STATUS:');
    Object.entries(this.report.database).forEach(([table, stats]) => {
      const status = stats.status === 'populated' ? '✅' : stats.status === 'empty' ? '❌' : '⚠️';
      console.log(`   ${status} ${table}: ${stats.count} records (${stats.status})`);
    });

    // Recommendations
    if (this.report.recommendations.length > 0) {
      console.log('\n💡 RECOMMENDATIONS:');
      this.report.recommendations.forEach((rec, index) => {
        const priority = rec.priority === 'high' ? '🔴' : rec.priority === 'medium' ? '🟡' : '🟢';
        console.log(`   ${priority} ${rec.category}: ${rec.issue}`);
        console.log(`      Solution: ${rec.solution}\n`);
      });
    }

    console.log('✅ Data monitoring complete!');
  }

  getHealthEmoji(health) {
    switch (health) {
      case 'excellent': return '🟢';
      case 'good': return '🟡';
      case 'fair': return '🟠';
      case 'poor': return '🔴';
      default: return '⚪';
    }
  }
}

// Run the monitoring system
const monitor = new DataMonitor();
monitor.runFullCheck().catch(console.error);
