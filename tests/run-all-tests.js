#!/usr/bin/env node

/**
 * Comprehensive Test Runner
 * Runs all tests with proper setup and reporting
 */

const { execSync } = require('child_process');
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

function runCommand(command, description) {
  log(`\n${colors.bright}${description}${colors.reset}`);
  log(`${colors.cyan}Running: ${command}${colors.reset}`);
  
  try {
    const output = execSync(command, { 
      encoding: 'utf8', 
      stdio: 'pipe',
      cwd: process.cwd()
    });
    
    log(`${colors.green}✓ ${description} completed successfully${colors.reset}`);
    return { success: true, output };
  } catch (error) {
    log(`${colors.red}✗ ${description} failed${colors.reset}`);
    log(`${colors.red}Error: ${error.message}${colors.reset}`);
    return { success: false, error: error.message, output: error.stdout };
  }
}

function checkPrerequisites() {
  log(`${colors.bright}Checking prerequisites...${colors.reset}`);
  
  // Check if Node.js is available
  try {
    execSync('node --version', { stdio: 'pipe' });
    log(`${colors.green}✓ Node.js is available${colors.reset}`);
  } catch (error) {
    log(`${colors.red}✗ Node.js is not available${colors.reset}`);
    process.exit(1);
  }
  
  // Check if pnpm is available
  try {
    execSync('pnpm --version', { stdio: 'pipe' });
    log(`${colors.green}✓ pnpm is available${colors.reset}`);
  } catch (error) {
    log(`${colors.red}✗ pnpm is not available${colors.reset}`);
    process.exit(1);
  }
  
  // Check if dev server is running
  try {
    execSync('curl -s http://localhost:3000/api/health', { stdio: 'pipe' });
    log(`${colors.green}✓ Dev server is running${colors.reset}`);
  } catch (error) {
    log(`${colors.yellow}⚠ Dev server might not be running. Some tests may fail.${colors.reset}`);
    log(`${colors.yellow}  Please start the dev server with: pnpm dev${colors.reset}`);
  }
}

function installDependencies() {
  log(`${colors.bright}Installing test dependencies...${colors.reset}`);
  
  const result = runCommand('pnpm install', 'Installing dependencies');
  if (!result.success) {
    log(`${colors.red}Failed to install dependencies. Please run: pnpm install${colors.reset}`);
    process.exit(1);
  }
}

function runUnitTests() {
  log(`${colors.bright}Running Unit Tests...${colors.reset}`);
  
  const result = runCommand('pnpm test', 'Unit tests');
  return result;
}

function runIntegrationTests() {
  log(`${colors.bright}Running Integration Tests...${colors.reset}`);
  
  const result = runCommand('pnpm test -- --testPathPattern=integration', 'Integration tests');
  return result;
}

function runE2ETests() {
  log(`${colors.bright}Running End-to-End Tests...${colors.reset}`);
  
  const result = runCommand('pnpm test:e2e', 'E2E tests');
  return result;
}

function runPerformanceTests() {
  log(`${colors.bright}Running Performance Tests...${colors.reset}`);
  
  const result = runCommand('pnpm test -- --testPathPattern=performance', 'Performance tests');
  return result;
}

function runSecurityTests() {
  log(`${colors.bright}Running Security Tests...${colors.reset}`);
  
  const result = runCommand('pnpm test -- --testPathPattern=security', 'Security tests');
  return result;
}

function generateTestReport(results) {
  log(`${colors.bright}Generating Test Report...${colors.reset}`);
  
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      total: results.length,
      passed: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length
    },
    results: results.map(r => ({
      name: r.name,
      success: r.success,
      duration: r.duration,
      error: r.error
    }))
  };
  
  // Write report to file
  const reportPath = path.join(__dirname, 'test-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  log(`${colors.green}✓ Test report saved to: ${reportPath}${colors.reset}`);
  
  // Print summary
  log(`\n${colors.bright}Test Summary:${colors.reset}`);
  log(`${colors.green}✓ Passed: ${report.summary.passed}${colors.reset}`);
  log(`${colors.red}✗ Failed: ${report.summary.failed}${colors.reset}`);
  log(`${colors.blue}Total: ${report.summary.total}${colors.reset}`);
  
  return report;
}

function main() {
  log(`${colors.bright}${colors.cyan}🚀 Starting Comprehensive Test Suite${colors.reset}`);
  log(`${colors.cyan}==========================================${colors.reset}`);
  
  const startTime = Date.now();
  const results = [];
  
  try {
    // Check prerequisites
    checkPrerequisites();
    
    // Install dependencies
    installDependencies();
    
    // Run different test suites
    const unitResult = runUnitTests();
    results.push({ name: 'Unit Tests', ...unitResult, duration: Date.now() - startTime });
    
    const integrationResult = runIntegrationTests();
    results.push({ name: 'Integration Tests', ...integrationResult, duration: Date.now() - startTime });
    
    const performanceResult = runPerformanceTests();
    results.push({ name: 'Performance Tests', ...performanceResult, duration: Date.now() - startTime });
    
    const securityResult = runSecurityTests();
    results.push({ name: 'Security Tests', ...securityResult, duration: Date.now() - startTime });
    
    // E2E tests are optional (require dev server)
    try {
      const e2eResult = runE2ETests();
      results.push({ name: 'E2E Tests', ...e2eResult, duration: Date.now() - startTime });
    } catch (error) {
      log(`${colors.yellow}⚠ E2E tests skipped (dev server not running)${colors.reset}`);
    }
    
    // Generate report
    const report = generateTestReport(results);
    
    const totalDuration = Date.now() - startTime;
    log(`\n${colors.bright}Total execution time: ${totalDuration}ms${colors.reset}`);
    
    // Exit with appropriate code
    if (report.summary.failed > 0) {
      log(`${colors.red}❌ Some tests failed${colors.reset}`);
      process.exit(1);
    } else {
      log(`${colors.green}✅ All tests passed!${colors.reset}`);
      process.exit(0);
    }
    
  } catch (error) {
    log(`${colors.red}❌ Test runner failed: ${error.message}${colors.reset}`);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { main, runCommand, generateTestReport };
