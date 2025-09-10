#!/usr/bin/env node

/**
 * ApexBets Database Monitor
 * Monitors automatic database updates and data freshness
 * Ensures all sports data is constantly updated with real data
 */

const VerificationTracker = require('./verification-tracker');
const fetch = require('node-fetch');

// Initialize tracker
const tracker = new VerificationTracker();

// Configuration
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
const MONITOR_INTERVAL = 30000; // 30 seconds
const DATA_FRESHNESS_THRESHOLD = 300000; // 5 minutes

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

class DatabaseMonitor {
  constructor() {
    this.isRunning = false;
    this.lastUpdateTimes = {};
    this.dataFreshness = {};
    this.updateCounts = {};
  }

  async checkDataFreshness(endpoint, dataType) {
    try {
      const response = await fetch(`${BASE_URL}${endpoint}`);
      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: `HTTP ${response.status}`,
          fresh: false
        };
      }

      // Check if data has timestamp or lastUpdated field
      let lastUpdate = null;
      if (data.lastUpdated) {
        lastUpdate = new Date(data.lastUpdated);
      } else if (Array.isArray(data) && data.length > 0) {
        // Look for timestamp in first item
        const firstItem = data[0];
        if (firstItem.updatedAt) {
          lastUpdate = new Date(firstItem.updatedAt);
        } else if (firstItem.timestamp) {
          lastUpdate = new Date(firstItem.timestamp);
        } else if (firstItem.date) {
          lastUpdate = new Date(firstItem.date);
        }
      }

      const now = new Date();
      const isFresh = lastUpdate ? (now - lastUpdate) < DATA_FRESHNESS_THRESHOLD : false;

      this.dataFreshness[dataType] = {
        lastUpdate: lastUpdate ? lastUpdate.toISOString() : 'Unknown',
        isFresh,
        dataCount: Array.isArray(data) ? data.length : 1
      };

      return {
        success: true,
        fresh: isFresh,
        lastUpdate: lastUpdate ? lastUpdate.toISOString() : 'Unknown',
        dataCount: Array.isArray(data) ? data.length : 1
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        fresh: false
      };
    }
  }

  async checkLiveDataUpdates() {
    const endpoints = [
      { endpoint: '/api/live-scores', type: 'liveScores' },
      { endpoint: '/api/live-updates', type: 'liveUpdates' },
      { endpoint: '/api/odds?live=true', type: 'liveOdds' }
    ];

    const results = {};

    for (const { endpoint, type } of endpoints) {
      const result = await this.checkDataFreshness(endpoint, type);
      results[type] = result;

      if (result.success) {
        if (result.fresh) {
          log(`${colors.green}✓${colors.reset} ${type} - Fresh data (${result.dataCount} items)`, 'green');
          tracker.updateTest('liveData', type, 'working', 
            `Fresh data - ${result.dataCount} items, updated: ${result.lastUpdate}`);
        } else {
          log(`${colors.yellow}⚠${colors.reset} ${type} - Stale data (last update: ${result.lastUpdate})`, 'yellow');
          tracker.updateTest('liveData', type, 'partial', 
            `Stale data - last update: ${result.lastUpdate}`);
        }
      } else {
        log(`${colors.red}✗${colors.reset} ${type} - Error: ${result.error}`, 'red');
        tracker.updateTest('liveData', type, 'broken', result.error);
      }
    }

    return results;
  }

  async checkSportsDataUpdates() {
    const sports = ['basketball', 'football', 'baseball', 'hockey', 'soccer', 'tennis', 'golf'];
    const results = {};

    for (const sport of sports) {
      const result = await this.checkDataFreshness(`/api/games?sport=${sport}&limit=10`, `${sport}Games`);
      results[`${sport}Games`] = result;

      if (result.success) {
        if (result.fresh) {
          log(`${colors.green}✓${colors.reset} ${sport} games - Fresh data (${result.dataCount} items)`, 'green');
          tracker.updateTest('sportsData', sport, 'working', 
            `Fresh data - ${result.dataCount} games, updated: ${result.lastUpdate}`);
        } else {
          log(`${colors.yellow}⚠${colors.reset} ${sport} games - Stale data (last update: ${result.lastUpdate})`, 'yellow');
          tracker.updateTest('sportsData', sport, 'partial', 
            `Stale data - last update: ${result.lastUpdate}`);
        }
      } else {
        log(`${colors.red}✗${colors.reset} ${sport} games - Error: ${result.error}`, 'red');
        tracker.updateTest('sportsData', sport, 'broken', result.error);
      }

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return results;
  }

  async checkDatabaseHealth() {
    try {
      const response = await fetch(`${BASE_URL}/api/health?detailed=true`);
      const data = await response.json();

      if (!response.ok) {
        log(`${colors.red}✗${colors.reset} Database health check failed: ${data.error}`, 'red');
        tracker.updateTest('database', 'connection', 'broken', data.error);
        return { success: false, error: data.error };
      }

      const isHealthy = data.status === 'healthy' && data.database && data.database.status === 'connected';
      
      if (isHealthy) {
        log(`${colors.green}✓${colors.reset} Database - Healthy and connected`, 'green');
        tracker.updateTest('database', 'connection', 'working', 'Database healthy and connected');
      } else {
        log(`${colors.yellow}⚠${colors.reset} Database - Issues detected`, 'yellow');
        tracker.updateTest('database', 'connection', 'partial', 'Database has issues');
      }

      return { success: true, healthy: isHealthy, data };
    } catch (error) {
      log(`${colors.red}✗${colors.reset} Database health check error: ${error.message}`, 'red');
      tracker.updateTest('database', 'connection', 'broken', error.message);
      return { success: false, error: error.message };
    }
  }

  async runMonitoringCycle() {
    const cycleStart = new Date();
    log(`\n${colors.bright}${colors.cyan}🔄 Database Monitoring Cycle - ${cycleStart.toLocaleTimeString()}${colors.reset}`);
    log(`${colors.cyan}================================================${colors.reset}`);

    // Check database health
    log(`${colors.bright}Checking Database Health:${colors.reset}`);
    const dbHealth = await this.checkDatabaseHealth();

    // Check live data updates
    log(`\n${colors.bright}Checking Live Data Updates:${colors.reset}`);
    const liveData = await this.checkLiveDataUpdates();

    // Check sports data updates
    log(`\n${colors.bright}Checking Sports Data Updates:${colors.reset}`);
    const sportsData = await this.checkSportsDataUpdates();

    // Update monitoring statistics
    this.lastUpdateTimes[cycleStart.toISOString()] = {
      dbHealth,
      liveData,
      sportsData
    };

    // Generate summary
    const freshDataCount = Object.values(this.dataFreshness).filter(d => d.isFresh).length;
    const totalDataCount = Object.keys(this.dataFreshness).length;

    log(`\n${colors.bright}Monitoring Summary:${colors.reset}`);
    log(`${colors.green}✓ Fresh Data: ${freshDataCount}/${totalDataCount}${colors.reset}`);
    log(`${colors.blue}Total Data Sources: ${totalDataCount}${colors.reset}`);

    // Generate report
    tracker.generateReport();

    return {
      cycleStart,
      dbHealth,
      liveData,
      sportsData,
      freshDataCount,
      totalDataCount
    };
  }

  async startMonitoring() {
    if (this.isRunning) {
      log(`${colors.yellow}⚠ Monitoring is already running${colors.reset}`);
      return;
    }

    this.isRunning = true;
    log(`${colors.bright}${colors.green}🚀 Starting Database Monitoring${colors.reset}`);
    log(`${colors.green}Monitoring interval: ${MONITOR_INTERVAL / 1000} seconds${colors.reset}`);
    log(`${colors.green}Data freshness threshold: ${DATA_FRESHNESS_THRESHOLD / 1000} seconds${colors.reset}\n`);

    // Run initial cycle
    await this.runMonitoringCycle();

    // Set up interval
    this.monitoringInterval = setInterval(async () => {
      try {
        await this.runMonitoringCycle();
      } catch (error) {
        log(`${colors.red}❌ Monitoring cycle error: ${error.message}${colors.reset}`);
      }
    }, MONITOR_INTERVAL);

    log(`${colors.green}✅ Database monitoring started successfully${colors.reset}`);
  }

  stopMonitoring() {
    if (!this.isRunning) {
      log(`${colors.yellow}⚠ Monitoring is not running${colors.reset}`);
      return;
    }

    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    this.isRunning = false;
    log(`${colors.red}🛑 Database monitoring stopped${colors.reset}`);
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      dataFreshness: this.dataFreshness,
      lastUpdateTimes: this.lastUpdateTimes,
      updateCounts: this.updateCounts
    };
  }
}

// CLI usage
if (require.main === module) {
  const monitor = new DatabaseMonitor();
  const command = process.argv[2];

  switch (command) {
    case 'start':
      monitor.startMonitoring();
      break;
    case 'stop':
      monitor.stopMonitoring();
      break;
    case 'status':
      const status = monitor.getStatus();
      log(`${colors.bright}Database Monitor Status:${colors.reset}`);
      log(`Running: ${status.isRunning ? 'Yes' : 'No'}`);
      log(`Data Sources: ${Object.keys(status.dataFreshness).length}`);
      break;
    case 'cycle':
      monitor.runMonitoringCycle().then(() => {
        process.exit(0);
      }).catch(error => {
        log(`${colors.red}❌ Monitoring cycle failed: ${error.message}${colors.reset}`);
        process.exit(1);
      });
      break;
    default:
      log(`${colors.bright}Usage:${colors.reset}`);
      log(`  node database-monitor.js start   - Start continuous monitoring`);
      log(`  node database-monitor.js stop    - Stop monitoring`);
      log(`  node database-monitor.js status  - Show status`);
      log(`  node database-monitor.js cycle   - Run single monitoring cycle`);
      break;
  }
}

module.exports = DatabaseMonitor;
