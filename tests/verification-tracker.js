#!/usr/bin/env node

/**
 * ApexBets Verification Tracker
 * Centralized system to track what works and what doesn't
 * Prevents repeat testing and maintains comprehensive status
 */

const fs = require('fs');
const path = require('path');

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

class VerificationTracker {
  constructor() {
    this.trackerFile = path.join(__dirname, 'verification-status.json');
    this.status = this.loadStatus();
  }

  loadStatus() {
    try {
      if (fs.existsSync(this.trackerFile)) {
        return JSON.parse(fs.readFileSync(this.trackerFile, 'utf8'));
      }
    } catch (error) {
      console.warn('Could not load verification status, starting fresh');
    }

    return {
      lastUpdated: new Date().toISOString(),
      version: '1.0.0',
      categories: {
        apis: {
          name: 'API Endpoints',
          status: 'unknown',
          lastTested: null,
          tests: {
            health: { status: 'unknown', lastTested: null, notes: '' },
            games: { status: 'unknown', lastTested: null, notes: '' },
            teams: { status: 'unknown', lastTested: null, notes: '' },
            liveScores: { status: 'unknown', lastTested: null, notes: '' },
            odds: { status: 'unknown', lastTested: null, notes: '' },
            predictions: { status: 'unknown', lastTested: null, notes: '' },
            analytics: { status: 'unknown', lastTested: null, notes: '' },
            standings: { status: 'unknown', lastTested: null, notes: '' },
            valueBets: { status: 'unknown', lastTested: null, notes: '' }
          }
        },
        dataSources: {
          name: 'Data Sources',
          status: 'unknown',
          lastTested: null,
          tests: {
            sportsDB: { status: 'unknown', lastTested: null, notes: '' },
            ballDontLie: { status: 'unknown', lastTested: null, notes: '' },
            oddsApi: { status: 'unknown', lastTested: null, notes: '' },
            apiSports: { status: 'unknown', lastTested: null, notes: '' }
          }
        },
        database: {
          name: 'Database',
          status: 'unknown',
          lastTested: null,
          tests: {
            connection: { status: 'unknown', lastTested: null, notes: '' },
            schema: { status: 'unknown', lastTested: null, notes: '' },
            dataIntegrity: { status: 'unknown', lastTested: null, notes: '' },
            liveUpdates: { status: 'unknown', lastTested: null, notes: '' }
          }
        },
        sportsData: {
          name: 'Sports Data',
          status: 'unknown',
          lastTested: null,
          tests: {
            basketball: { status: 'unknown', lastTested: null, notes: '' },
            football: { status: 'unknown', lastTested: null, notes: '' },
            baseball: { status: 'unknown', lastTested: null, notes: '' },
            hockey: { status: 'unknown', lastTested: null, notes: '' },
            soccer: { status: 'unknown', lastTested: null, notes: '' },
            tennis: { status: 'unknown', lastTested: null, notes: '' },
            golf: { status: 'unknown', lastTested: null, notes: '' }
          }
        },
        liveData: {
          name: 'Live Data',
          status: 'unknown',
          lastTested: null,
          tests: {
            realTimeUpdates: { status: 'unknown', lastTested: null, notes: '' },
            liveScores: { status: 'unknown', lastTested: null, notes: '' },
            liveOdds: { status: 'unknown', lastTested: null, notes: '' },
            livePredictions: { status: 'unknown', lastTested: null, notes: '' }
          }
        },
        playerStats: {
          name: 'Player Statistics',
          status: 'unknown',
          lastTested: null,
          tests: {
            basketball: { status: 'unknown', lastTested: null, notes: '' },
            football: { status: 'unknown', lastTested: null, notes: '' },
            baseball: { status: 'unknown', lastTested: null, notes: '' },
            hockey: { status: 'unknown', lastTested: null, notes: '' },
            soccer: { status: 'unknown', lastTested: null, notes: '' }
          }
        },
        teamStats: {
          name: 'Team Statistics',
          status: 'unknown',
          lastTested: null,
          tests: {
            standings: { status: 'unknown', lastTested: null, notes: '' },
            performance: { status: 'unknown', lastTested: null, notes: '' },
            historical: { status: 'unknown', lastTested: null, notes: '' }
          }
        }
      },
      issues: [],
      recommendations: []
    };
  }

  saveStatus() {
    this.status.lastUpdated = new Date().toISOString();
    fs.writeFileSync(this.trackerFile, JSON.stringify(this.status, null, 2));
  }

  updateTest(category, test, status, notes = '') {
    const now = new Date().toISOString();
    
    if (this.status.categories[category] && this.status.categories[category].tests[test]) {
      this.status.categories[category].tests[test].status = status;
      this.status.categories[category].tests[test].lastTested = now;
      this.status.categories[category].tests[test].notes = notes;
      
      // Update category status based on test results
      this.updateCategoryStatus(category);
      
      this.saveStatus();
      return true;
    }
    
    return false;
  }

  updateCategoryStatus(category) {
    if (!this.status.categories[category]) return;
    
    const tests = Object.values(this.status.categories[category].tests);
    const statuses = tests.map(t => t.status);
    
    if (statuses.every(s => s === 'working')) {
      this.status.categories[category].status = 'working';
    } else if (statuses.some(s => s === 'working')) {
      this.status.categories[category].status = 'partial';
    } else if (statuses.every(s => s === 'broken')) {
      this.status.categories[category].status = 'broken';
    } else {
      this.status.categories[category].status = 'unknown';
    }
    
    this.status.categories[category].lastTested = new Date().toISOString();
  }

  addIssue(issue) {
    this.status.issues.push({
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      ...issue
    });
    this.saveStatus();
  }

  addRecommendation(recommendation) {
    this.status.recommendations.push({
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      ...recommendation
    });
    this.saveStatus();
  }

  getStatus(category = null, test = null) {
    if (category && test) {
      return this.status.categories[category]?.tests[test] || null;
    } else if (category) {
      return this.status.categories[category] || null;
    }
    return this.status;
  }

  getWorkingTests() {
    const working = [];
    Object.entries(this.status.categories).forEach(([categoryName, category]) => {
      Object.entries(category.tests).forEach(([testName, test]) => {
        if (test.status === 'working') {
          working.push({ category: categoryName, test: testName, lastTested: test.lastTested });
        }
      });
    });
    return working;
  }

  getBrokenTests() {
    const broken = [];
    Object.entries(this.status.categories).forEach(([categoryName, category]) => {
      Object.entries(category.tests).forEach(([testName, test]) => {
        if (test.status === 'broken') {
          broken.push({ category: categoryName, test: testName, lastTested: test.lastTested, notes: test.notes });
        }
      });
    });
    return broken;
  }

  getUnknownTests() {
    const unknown = [];
    Object.entries(this.status.categories).forEach(([categoryName, category]) => {
      Object.entries(category.tests).forEach(([testName, test]) => {
        if (test.status === 'unknown') {
          unknown.push({ category: categoryName, test: testName, lastTested: test.lastTested });
        }
      });
    });
    return unknown;
  }

  shouldTest(category, test) {
    const testStatus = this.getStatus(category, test);
    if (!testStatus) return true;
    
    // Test if never tested or if it's broken
    if (testStatus.status === 'unknown' || testStatus.status === 'broken') {
      return true;
    }
    
    // Test if it's been more than 24 hours since last test
    const lastTested = new Date(testStatus.lastTested);
    const now = new Date();
    const hoursSinceLastTest = (now - lastTested) / (1000 * 60 * 60);
    
    return hoursSinceLastTest > 24;
  }

  printStatus() {
    log(`${colors.bright}${colors.cyan}📊 ApexBets Verification Status${colors.reset}`);
    log(`${colors.cyan}=====================================${colors.reset}\n`);
    
    Object.entries(this.status.categories).forEach(([categoryName, category]) => {
      const statusColor = category.status === 'working' ? 'green' : 
                         category.status === 'partial' ? 'yellow' : 
                         category.status === 'broken' ? 'red' : 'blue';
      
      log(`${colors.bright}${category.name}${colors.reset} - ${colors[statusColor]}${category.status.toUpperCase()}${colors.reset}`);
      
      Object.entries(category.tests).forEach(([testName, test]) => {
        const testColor = test.status === 'working' ? 'green' : 
                         test.status === 'broken' ? 'red' : 'blue';
        const lastTested = test.lastTested ? new Date(test.lastTested).toLocaleString() : 'Never';
        
        log(`  ${colors[testColor]}${test.status === 'working' ? '✓' : test.status === 'broken' ? '✗' : '?'}${colors.reset} ${testName} (${lastTested})`);
        if (test.notes) {
          log(`    ${colors.yellow}Note: ${test.notes}${colors.reset}`);
        }
      });
      log('');
    });
    
    // Print issues
    if (this.status.issues.length > 0) {
      log(`${colors.bright}${colors.red}🚨 Issues Found:${colors.reset}`);
      this.status.issues.forEach(issue => {
        log(`${colors.red}  • ${issue.description}${colors.reset}`);
      });
      log('');
    }
    
    // Print recommendations
    if (this.status.recommendations.length > 0) {
      log(`${colors.bright}${colors.yellow}💡 Recommendations:${colors.reset}`);
      this.status.recommendations.forEach(rec => {
        log(`${colors.yellow}  • ${rec.description}${colors.reset}`);
      });
      log('');
    }
  }

  generateReport() {
    const working = this.getWorkingTests();
    const broken = this.getBrokenTests();
    const unknown = this.getUnknownTests();
    
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        total: working.length + broken.length + unknown.length,
        working: working.length,
        broken: broken.length,
        unknown: unknown.length
      },
      working,
      broken,
      unknown,
      issues: this.status.issues,
      recommendations: this.status.recommendations
    };
    
    const reportFile = path.join(__dirname, 'verification-report.json');
    fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
    
    log(`${colors.green}✓ Verification report saved to: ${reportFile}${colors.reset}`);
    return report;
  }
}

// Export for use in other scripts
module.exports = VerificationTracker;

// CLI usage
if (require.main === module) {
  const tracker = new VerificationTracker();
  const command = process.argv[2];
  
  switch (command) {
    case 'status':
      tracker.printStatus();
      break;
    case 'report':
      tracker.generateReport();
      break;
    case 'working':
      const working = tracker.getWorkingTests();
      log(`${colors.green}✓ Working tests: ${working.length}${colors.reset}`);
      working.forEach(test => {
        log(`  ${test.category}.${test.test} (${test.lastTested})`);
      });
      break;
    case 'broken':
      const broken = tracker.getBrokenTests();
      log(`${colors.red}✗ Broken tests: ${broken.length}${colors.reset}`);
      broken.forEach(test => {
        log(`  ${test.category}.${test.test} (${test.lastTested}) - ${test.notes}`);
      });
      break;
    case 'unknown':
      const unknown = tracker.getUnknownTests();
      log(`${colors.blue}? Unknown tests: ${unknown.length}${colors.reset}`);
      unknown.forEach(test => {
        log(`  ${test.category}.${test.test}`);
      });
      break;
    default:
      log(`${colors.bright}Usage:${colors.reset}`);
      log(`  node verification-tracker.js status    - Show current status`);
      log(`  node verification-tracker.js report    - Generate report`);
      log(`  node verification-tracker.js working   - Show working tests`);
      log(`  node verification-tracker.js broken    - Show broken tests`);
      log(`  node verification-tracker.js unknown   - Show unknown tests`);
      break;
  }
}
