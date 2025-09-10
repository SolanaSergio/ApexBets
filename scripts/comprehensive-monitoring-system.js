#!/usr/bin/env node

/**
 * Comprehensive Monitoring and Cleanup System
 * 
 * This script provides:
 * 1. Real-time monitoring of all systems
 * 2. Automatic cleanup of old data
 * 3. Performance monitoring
 * 4. Error tracking and alerting
 * 5. Data integrity checks
 */

const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');
const cron = require('node-cron');
require('dotenv').config({ path: '.env.local' });

const BASE_URL = 'http://localhost:3000';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('🔍 ApexBets Comprehensive Monitoring System');
console.log('===========================================\n');

class MonitoringSystem {
  constructor() {
    this.metrics = {
      apiResponseTimes: [],
      errorCounts: {},
      dataIntegrity: {},
      performance: {},
      lastCleanup: null,
      lastUpdate: null
    };
    this.isRunning = false;
  }

  async start() {
    console.log('🚀 Starting monitoring system...');
    this.isRunning = true;
    
    // Schedule monitoring tasks
    this.scheduleTasks();
    
    // Start real-time monitoring
    this.startRealTimeMonitoring();
    
    console.log('✅ Monitoring system started');
  }

  scheduleTasks() {
    // Clean up old data every hour
    cron.schedule('0 * * * *', async () => {
      console.log('🧹 Running scheduled cleanup...');
      await this.cleanupOldData();
    });

    // Check data integrity every 30 minutes
    cron.schedule('*/30 * * * *', async () => {
      console.log('🔍 Running data integrity check...');
      await this.checkDataIntegrity();
    });

    // Update sports data every 15 minutes
    cron.schedule('*/15 * * * *', async () => {
      console.log('🔄 Updating sports data...');
      await this.updateSportsData();
    });

    // Performance monitoring every 5 minutes
    cron.schedule('*/5 * * * *', async () => {
      console.log('📊 Running performance check...');
      await this.checkPerformance();
    });

    // Generate daily report at midnight
    cron.schedule('0 0 * * *', async () => {
      console.log('📋 Generating daily report...');
      await this.generateDailyReport();
    });
  }

  async startRealTimeMonitoring() {
    console.log('📡 Starting real-time monitoring...');
    
    // Monitor API endpoints
    setInterval(async () => {
      await this.monitorApiEndpoints();
    }, 30000); // Every 30 seconds

    // Monitor database health
    setInterval(async () => {
      await this.monitorDatabaseHealth();
    }, 60000); // Every minute

    // Monitor external APIs
    setInterval(async () => {
      await this.monitorExternalApis();
    }, 300000); // Every 5 minutes
  }

  async monitorApiEndpoints() {
    const endpoints = [
      '/api/health',
      '/api/teams',
      '/api/games',
      '/api/predictions',
      '/api/odds',
      '/api/live-scores'
    ];

    for (const endpoint of endpoints) {
      try {
        const startTime = Date.now();
        const response = await fetch(`${BASE_URL}${endpoint}`);
        const endTime = Date.now();
        const responseTime = endTime - startTime;

        this.metrics.apiResponseTimes.push({
          endpoint,
          responseTime,
          status: response.status,
          timestamp: new Date()
        });

        // Keep only last 1000 entries
        if (this.metrics.apiResponseTimes.length > 1000) {
          this.metrics.apiResponseTimes = this.metrics.apiResponseTimes.slice(-1000);
        }

        if (!response.ok) {
          this.recordError(`API_${endpoint}`, `HTTP ${response.status}`);
        }
      } catch (error) {
        this.recordError(`API_${endpoint}`, error.message);
      }
    }
  }

  async monitorDatabaseHealth() {
    try {
      const { data, error } = await supabase
        .from('teams')
        .select('count')
        .limit(1);

      if (error) {
        this.recordError('DATABASE', error.message);
      } else {
        this.metrics.dataIntegrity.database = 'healthy';
      }
    } catch (error) {
      this.recordError('DATABASE', error.message);
    }
  }

  async monitorExternalApis() {
    const apis = [
      { name: 'SportsDB', url: 'https://www.thesportsdb.com/api/v1/json/3/all_leagues.php' },
      { name: 'BallDontLie', url: 'https://www.balldontlie.io/api/v1/teams' }
    ];

    for (const api of apis) {
      try {
        const response = await fetch(api.url);
        if (!response.ok) {
          this.recordError(`EXTERNAL_${api.name}`, `HTTP ${response.status}`);
        }
      } catch (error) {
        this.recordError(`EXTERNAL_${api.name}`, error.message);
      }
    }
  }

  async cleanupOldData() {
    console.log('🧹 Cleaning up old data...');
    
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // Clean up old predictions
      const { error: predictionsError } = await supabase
        .from('predictions')
        .delete()
        .lt('created_at', thirtyDaysAgo.toISOString());

      if (predictionsError) {
        console.log('⚠️  Error cleaning old predictions:', predictionsError.message);
      } else {
        console.log('✅ Old predictions cleaned up');
      }

      // Clean up old odds
      const { error: oddsError } = await supabase
        .from('odds')
        .delete()
        .lt('created_at', thirtyDaysAgo.toISOString());

      if (oddsError) {
        console.log('⚠️  Error cleaning old odds:', oddsError.message);
      } else {
        console.log('✅ Old odds cleaned up');
      }

      // Clean up old games (keep last 90 days)
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

      const { error: gamesError } = await supabase
        .from('games')
        .delete()
        .lt('game_date', ninetyDaysAgo.toISOString())
        .eq('status', 'completed');

      if (gamesError) {
        console.log('⚠️  Error cleaning old games:', gamesError.message);
      } else {
        console.log('✅ Old games cleaned up');
      }

      this.metrics.lastCleanup = new Date();
      console.log('✅ Data cleanup completed');
    } catch (error) {
      console.log('❌ Error during cleanup:', error.message);
      this.recordError('CLEANUP', error.message);
    }
  }

  async checkDataIntegrity() {
    console.log('🔍 Checking data integrity...');
    
    try {
      // Check for orphaned records
      const { data: orphanedGames } = await supabase
        .from('games')
        .select('id')
        .is('home_team_id', null);

      if (orphanedGames && orphanedGames.length > 0) {
        console.log(`⚠️  Found ${orphanedGames.length} orphaned games`);
        this.recordError('DATA_INTEGRITY', `Found ${orphanedGames.length} orphaned games`);
      }

      // Check for duplicate teams
      const { data: duplicateTeams } = await supabase
        .from('teams')
        .select('name, league, count')
        .group('name, league')
        .having('count', '>', 1);

      if (duplicateTeams && duplicateTeams.length > 0) {
        console.log(`⚠️  Found ${duplicateTeams.length} duplicate teams`);
        this.recordError('DATA_INTEGRITY', `Found ${duplicateTeams.length} duplicate teams`);
      }

      // Check for invalid scores
      const { data: invalidScores } = await supabase
        .from('games')
        .select('id, home_score, away_score')
        .or('home_score.lt.0,away_score.lt.0');

      if (invalidScores && invalidScores.length > 0) {
        console.log(`⚠️  Found ${invalidScores.length} games with invalid scores`);
        this.recordError('DATA_INTEGRITY', `Found ${invalidScores.length} games with invalid scores`);
      }

      this.metrics.dataIntegrity.lastCheck = new Date();
      console.log('✅ Data integrity check completed');
    } catch (error) {
      console.log('❌ Error checking data integrity:', error.message);
      this.recordError('DATA_INTEGRITY', error.message);
    }
  }

  async updateSportsData() {
    console.log('🔄 Updating sports data...');
    
    try {
      // Update live scores
      const { sportsDataService } = require('./lib/services/sports-data-service');
      await sportsDataService.getLiveScores();
      
      // Update odds
      await sportsDataService.getOdds();
      
      // Update games
      await sportsDataService.getGames();
      
      this.metrics.lastUpdate = new Date();
      console.log('✅ Sports data updated');
    } catch (error) {
      console.log('❌ Error updating sports data:', error.message);
      this.recordError('DATA_UPDATE', error.message);
    }
  }

  async checkPerformance() {
    console.log('📊 Checking performance...');
    
    try {
      // Calculate average response times
      const recentResponses = this.metrics.apiResponseTimes.slice(-100);
      if (recentResponses.length > 0) {
        const avgResponseTime = recentResponses.reduce((sum, r) => sum + r.responseTime, 0) / recentResponses.length;
        this.metrics.performance.avgResponseTime = avgResponseTime;
        
        if (avgResponseTime > 2000) {
          this.recordError('PERFORMANCE', `Average response time too high: ${avgResponseTime}ms`);
        }
      }

      // Check error rates
      const totalErrors = Object.values(this.metrics.errorCounts).reduce((sum, count) => sum + count, 0);
      this.metrics.performance.totalErrors = totalErrors;
      
      if (totalErrors > 100) {
        this.recordError('PERFORMANCE', `High error count: ${totalErrors}`);
      }

      console.log('✅ Performance check completed');
    } catch (error) {
      console.log('❌ Error checking performance:', error.message);
      this.recordError('PERFORMANCE', error.message);
    }
  }

  async generateDailyReport() {
    console.log('📋 Generating daily report...');
    
    try {
      const report = {
        date: new Date().toISOString().split('T')[0],
        summary: {
          totalApiCalls: this.metrics.apiResponseTimes.length,
          averageResponseTime: this.metrics.performance.avgResponseTime || 0,
          totalErrors: this.metrics.performance.totalErrors || 0,
          lastCleanup: this.metrics.lastCleanup,
          lastUpdate: this.metrics.lastUpdate
        },
        errors: this.metrics.errorCounts,
        recommendations: this.generateRecommendations()
      };

      console.log('📊 Daily Report:');
      console.log('================');
      console.log(`Date: ${report.date}`);
      console.log(`Total API Calls: ${report.summary.totalApiCalls}`);
      console.log(`Average Response Time: ${report.summary.averageResponseTime}ms`);
      console.log(`Total Errors: ${report.summary.totalErrors}`);
      console.log(`Last Cleanup: ${report.summary.lastCleanup}`);
      console.log(`Last Update: ${report.summary.lastUpdate}`);
      
      if (Object.keys(report.errors).length > 0) {
        console.log('\nErrors:');
        Object.entries(report.errors).forEach(([error, count]) => {
          console.log(`  ${error}: ${count}`);
        });
      }
      
      if (report.recommendations.length > 0) {
        console.log('\nRecommendations:');
        report.recommendations.forEach((rec, index) => {
          console.log(`  ${index + 1}. ${rec}`);
        });
      }

      // Reset daily metrics
      this.metrics.errorCounts = {};
      this.metrics.apiResponseTimes = [];
      
      console.log('✅ Daily report generated');
    } catch (error) {
      console.log('❌ Error generating daily report:', error.message);
    }
  }

  generateRecommendations() {
    const recommendations = [];
    
    if (this.metrics.performance.avgResponseTime > 1000) {
      recommendations.push('Consider implementing caching to improve response times');
    }
    
    if (this.metrics.performance.totalErrors > 50) {
      recommendations.push('Investigate and fix recurring errors');
    }
    
    if (Object.keys(this.metrics.errorCounts).length > 5) {
      recommendations.push('Review error handling and add more robust error recovery');
    }
    
    if (!this.metrics.lastCleanup || (new Date() - this.metrics.lastCleanup) > 24 * 60 * 60 * 1000) {
      recommendations.push('Run data cleanup to remove old records');
    }
    
    return recommendations;
  }

  recordError(type, message) {
    if (!this.metrics.errorCounts[type]) {
      this.metrics.errorCounts[type] = 0;
    }
    this.metrics.errorCounts[type]++;
    
    console.log(`❌ ${type}: ${message}`);
  }

  getMetrics() {
    return this.metrics;
  }

  stop() {
    console.log('🛑 Stopping monitoring system...');
    this.isRunning = false;
    console.log('✅ Monitoring system stopped');
  }
}

// Create and start monitoring system
const monitoringSystem = new MonitoringSystem();

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Received SIGINT, shutting down gracefully...');
  monitoringSystem.stop();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
  monitoringSystem.stop();
  process.exit(0);
});

// Start the monitoring system
if (require.main === module) {
  monitoringSystem.start();
}

module.exports = MonitoringSystem;
