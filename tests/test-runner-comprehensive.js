#!/usr/bin/env node

/**
 * ApexBets Comprehensive Test Runner
 * Runs all verification tests and monitoring systems
 * Ensures full accuracy and functionality across all sports data
 */

const { runComprehensiveVerification } = require('./quick-verification-fixed');
const DatabaseMonitor = require('./database-monitor');
const VerificationTracker = require('./verification-tracker');

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

class ComprehensiveTestRunner {
  constructor() {
    this.tracker = new VerificationTracker();
    this.monitor = new DatabaseMonitor();
    this.testResults = {};
  }

  async runFullVerification() {
    log(`${colors.bright}${colors.cyan}🚀 Starting Full ApexBets Verification${colors.reset}`);
    log(`${colors.cyan}==============================================${colors.reset}\n`);

    const startTime = Date.now();

    try {
      // Run comprehensive verification
      log(`${colors.bright}Step 1: Running Comprehensive Verification${colors.reset}`);
      await runComprehensiveVerification();
      
      this.testResults.verification = { success: true, timestamp: new Date().toISOString() };
      log(`${colors.green}✅ Comprehensive verification completed${colors.reset}\n`);

      // Run database monitoring cycle
      log(`${colors.bright}Step 2: Running Database Monitoring Cycle${colors.reset}`);
      const monitoringResults = await this.monitor.runMonitoringCycle();
      
      this.testResults.monitoring = { 
        success: true, 
        timestamp: new Date().toISOString(),
        results: monitoringResults
      };
      log(`${colors.green}✅ Database monitoring completed${colors.reset}\n`);

      // Generate final report
      log(`${colors.bright}Step 3: Generating Final Report${colors.reset}`);
      const finalReport = this.tracker.generateReport();
      
      const duration = Date.now() - startTime;
      
      log(`\n${colors.bright}${colors.cyan}📊 Final Test Results${colors.reset}`);
      log(`${colors.cyan}====================${colors.reset}`);
      log(`${colors.green}✓ Verification: Completed${colors.reset}`);
      log(`${colors.green}✓ Monitoring: Completed${colors.reset}`);
      log(`${colors.green}✓ Report: Generated${colors.reset}`);
      log(`${colors.blue}Total Duration: ${duration}ms${colors.reset}`);

      // Show current status
      log(`\n${colors.bright}Current System Status:${colors.reset}`);
      this.tracker.printStatus();

      return {
        success: true,
        duration,
        verification: this.testResults.verification,
        monitoring: this.testResults.monitoring,
        report: finalReport
      };

    } catch (error) {
      log(`${colors.red}❌ Full verification failed: ${error.message}${colors.reset}`);
      this.testResults.error = { message: error.message, timestamp: new Date().toISOString() };
      return { success: false, error: error.message };
    }
  }

  async runContinuousMonitoring() {
    log(`${colors.bright}${colors.green}🔄 Starting Continuous Monitoring${colors.reset}`);
    log(`${colors.green}This will run indefinitely until stopped (Ctrl+C)${colors.reset}\n`);

    try {
      await this.monitor.startMonitoring();
      
      // Keep the process running
      process.on('SIGINT', () => {
        log(`\n${colors.yellow}🛑 Stopping continuous monitoring...${colors.reset}`);
        this.monitor.stopMonitoring();
        process.exit(0);
      });

      // Keep alive
      setInterval(() => {
        // Just keep the process running
      }, 1000);

    } catch (error) {
      log(`${colors.red}❌ Continuous monitoring failed: ${error.message}${colors.reset}`);
      process.exit(1);
    }
  }

  async runQuickTest() {
    log(`${colors.bright}${colors.yellow}⚡ Running Quick Test${colors.reset}`);
    log(`${colors.yellow}This will run a fast verification of critical systems${colors.reset}\n`);

    try {
      // Run just the verification without full monitoring
      await runComprehensiveVerification();
      
      log(`${colors.green}✅ Quick test completed${colors.reset}`);
      return { success: true };

    } catch (error) {
      log(`${colors.red}❌ Quick test failed: ${error.message}${colors.reset}`);
      return { success: false, error: error.message };
    }
  }

  async runDataAccuracyTest() {
    log(`${colors.bright}${colors.magenta}🎯 Running Data Accuracy Test${colors.reset}`);
    log(`${colors.magenta}This will verify all data is real and accurate${colors.reset}\n`);

    try {
      // Run comprehensive verification with extra data validation
      await runComprehensiveVerification();
      
      // Run additional data accuracy checks
      const monitor = new DatabaseMonitor();
      const monitoringResults = await monitor.runMonitoringCycle();
      
      log(`${colors.green}✅ Data accuracy test completed${colors.reset}`);
      return { success: true, monitoringResults };

    } catch (error) {
      log(`${colors.red}❌ Data accuracy test failed: ${error.message}${colors.reset}`);
      return { success: false, error: error.message };
    }
  }

  printHelp() {
    log(`${colors.bright}ApexBets Comprehensive Test Runner${colors.reset}`);
    log(`${colors.cyan}===================================${colors.reset}\n`);
    log(`${colors.bright}Usage:${colors.reset}`);
    log(`  node test-runner-comprehensive.js [command]\n`);
    log(`${colors.bright}Commands:${colors.reset}`);
    log(`  ${colors.green}full${colors.reset}        - Run complete verification and monitoring`);
    log(`  ${colors.green}quick${colors.reset}       - Run quick verification test`);
    log(`  ${colors.green}monitor${colors.reset}     - Start continuous monitoring`);
    log(`  ${colors.green}accuracy${colors.reset}    - Run data accuracy verification`);
    log(`  ${colors.green}help${colors.reset}        - Show this help message\n`);
    log(`${colors.bright}Examples:${colors.reset}`);
    log(`  node test-runner-comprehensive.js full`);
    log(`  node test-runner-comprehensive.js quick`);
    log(`  node test-runner-comprehensive.js monitor`);
  }
}

// CLI usage
if (require.main === module) {
  const runner = new ComprehensiveTestRunner();
  const command = process.argv[2] || 'help';

  switch (command) {
    case 'full':
      runner.runFullVerification().then(result => {
        if (result.success) {
          log(`\n${colors.green}✅ Full verification completed successfully${colors.reset}`);
          process.exit(0);
        } else {
          log(`\n${colors.red}❌ Full verification failed${colors.reset}`);
          process.exit(1);
        }
      }).catch(error => {
        log(`${colors.red}❌ Unexpected error: ${error.message}${colors.reset}`);
        process.exit(1);
      });
      break;

    case 'quick':
      runner.runQuickTest().then(result => {
        if (result.success) {
          log(`\n${colors.green}✅ Quick test completed successfully${colors.reset}`);
          process.exit(0);
        } else {
          log(`\n${colors.red}❌ Quick test failed${colors.reset}`);
          process.exit(1);
        }
      }).catch(error => {
        log(`${colors.red}❌ Unexpected error: ${error.message}${colors.reset}`);
        process.exit(1);
      });
      break;

    case 'monitor':
      runner.runContinuousMonitoring();
      break;

    case 'accuracy':
      runner.runDataAccuracyTest().then(result => {
        if (result.success) {
          log(`\n${colors.green}✅ Data accuracy test completed successfully${colors.reset}`);
          process.exit(0);
        } else {
          log(`\n${colors.red}❌ Data accuracy test failed${colors.reset}`);
          process.exit(1);
        }
      }).catch(error => {
        log(`${colors.red}❌ Unexpected error: ${error.message}${colors.reset}`);
        process.exit(1);
      });
      break;

    case 'help':
    default:
      runner.printHelp();
      break;
  }
}

module.exports = ComprehensiveTestRunner;
