#!/usr/bin/env node

/**
 * Comprehensive Test Runner
 * Runs all tests with proper configuration and reporting
 */

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

// Test configuration
const TEST_CONFIG = {
  unit: {
    command: 'jest tests/unit --config tests/jest.config.js --passWithNoTests',
    timeout: 60000,
    description: 'Unit Tests'
  },
  integration: {
    command: 'jest tests/integration --config tests/jest.config.js --passWithNoTests',
    timeout: 120000,
    description: 'Integration Tests'
  },
  e2e: {
    command: 'playwright test tests/e2e --config tests/playwright.config.ts',
    timeout: 300000,
    description: 'End-to-End Tests'
  },
  api: {
    command: 'node tests/scripts/test-comprehensive-system.js',
    timeout: 180000,
    description: 'API System Tests'
  }
}

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
}

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

function logSection(title) {
  log(`\n${'='.repeat(60)}`, 'cyan')
  log(`  ${title}`, 'bright')
  log(`${'='.repeat(60)}`, 'cyan')
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green')
}

function logError(message) {
  log(`❌ ${message}`, 'red')
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow')
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue')
}

// Test results storage
const testResults = {
  unit: { passed: false, duration: 0, output: '' },
  integration: { passed: false, duration: 0, output: '' },
  e2e: { passed: false, duration: 0, output: '' },
  api: { passed: false, duration: 0, output: '' }
}

// Run a single test suite
async function runTestSuite(testName, config) {
  logSection(`${config.description}`)
  
  const startTime = Date.now()
  
  try {
    logInfo(`Running: ${config.command}`)
    
    const output = execSync(config.command, {
      encoding: 'utf8',
      timeout: config.timeout,
      stdio: 'pipe'
    })
    
    const duration = Date.now() - startTime
    testResults[testName] = {
      passed: true,
      duration,
      output: output.toString()
    }
    
    logSuccess(`${config.description} completed in ${(duration / 1000).toFixed(2)}s`)
    
  } catch (error) {
    const duration = Date.now() - startTime
    testResults[testName] = {
      passed: false,
      duration,
      output: error.stdout?.toString() || error.message
    }
    
    logError(`${config.description} failed after ${(duration / 1000).toFixed(2)}s`)
    logError(`Error: ${error.message}`)
    
    if (error.stdout) {
      logInfo('Output:')
      console.log(error.stdout.toString())
    }
  }
}

// Generate test report
function generateReport() {
  logSection('Test Report Summary')
  
  const totalTests = Object.keys(testResults).length
  const passedTests = Object.values(testResults).filter(result => result.passed).length
  const totalDuration = Object.values(testResults).reduce((sum, result) => sum + result.duration, 0)
  
  logInfo(`Total Test Suites: ${totalTests}`)
  logInfo(`Passed: ${passedTests}`)
  logInfo(`Failed: ${totalTests - passedTests}`)
  logInfo(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`)
  logInfo(`Total Duration: ${(totalDuration / 1000).toFixed(2)}s`)
  
  logSection('Detailed Results')
  
  Object.entries(testResults).forEach(([testName, result]) => {
    const status = result.passed ? '✅ PASSED' : '❌ FAILED'
    const duration = `${(result.duration / 1000).toFixed(2)}s`
    
    log(`${status} ${TEST_CONFIG[testName].description} (${duration})`, result.passed ? 'green' : 'red')
  })
  
  // Save detailed report
  const reportPath = path.join(__dirname, 'reports', 'comprehensive-test-report.json')
  const reportDir = path.dirname(reportPath)
  
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true })
  }
  
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      totalTests,
      passedTests,
      failedTests: totalTests - passedTests,
      successRate: (passedTests / totalTests) * 100,
      totalDuration
    },
    results: testResults,
    environment: {
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch
    }
  }
  
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2))
  logInfo(`Detailed report saved to: ${reportPath}`)
  
  return passedTests === totalTests
}

// Check prerequisites
function checkPrerequisites() {
  logSection('Checking Prerequisites')
  
  const checks = [
    {
      name: 'Node.js',
      check: () => process.version,
      required: true
    },
    {
      name: 'Jest',
      check: () => {
        try {
          execSync('jest --version', { stdio: 'pipe' })
          return true
        } catch {
          return false
        }
      },
      required: true
    },
    {
      name: 'Playwright',
      check: () => {
        try {
          execSync('playwright --version', { stdio: 'pipe' })
          return true
        } catch {
          return false
        }
      },
      required: true
    },
    {
      name: 'Test Environment Variables',
      check: () => {
        const required = [
          'NEXT_PUBLIC_SUPABASE_URL',
          'NEXT_PUBLIC_SUPABASE_ANON_KEY'
        ]
        return required.every(env => process.env[env])
      },
      required: true
    }
  ]
  
  let allPassed = true
  
  checks.forEach(check => {
    try {
      const result = check.check()
      if (result) {
        logSuccess(`${check.name}: OK`)
      } else {
        logError(`${check.name}: FAILED`)
        if (check.required) allPassed = false
      }
    } catch (error) {
      logError(`${check.name}: ERROR - ${error.message}`)
      if (check.required) allPassed = false
    }
  })
  
  if (!allPassed) {
    logError('Prerequisites check failed. Please fix the issues above.')
    process.exit(1)
  }
  
  logSuccess('All prerequisites met!')
}

// Main execution
async function main() {
  logSection('ApexBets Comprehensive Test Suite')
  logInfo('Starting comprehensive test execution...')
  
  // Check prerequisites
  checkPrerequisites()
  
  // Parse command line arguments
  const args = process.argv.slice(2)
  const runSpecific = args.length > 0 ? args : Object.keys(TEST_CONFIG)
  
  logSection('Test Execution Plan')
  runSpecific.forEach(testName => {
    if (TEST_CONFIG[testName]) {
      logInfo(`- ${TEST_CONFIG[testName].description}`)
    } else {
      logWarning(`Unknown test suite: ${testName}`)
    }
  })
  
  // Run tests
  for (const testName of runSpecific) {
    if (TEST_CONFIG[testName]) {
      await runTestSuite(testName, TEST_CONFIG[testName])
    }
  }
  
  // Generate report
  const allPassed = generateReport()
  
  // Exit with appropriate code
  if (allPassed) {
    logSuccess('All tests passed! 🎉')
    process.exit(0)
  } else {
    logError('Some tests failed. Please check the report above.')
    process.exit(1)
  }
}

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  logError(`Uncaught Exception: ${error.message}`)
  process.exit(1)
})

process.on('unhandledRejection', (reason) => {
  logError(`Unhandled Rejection: ${reason}`)
  process.exit(1)
})

// Run the main function
if (require.main === module) {
  main().catch(error => {
    logError(`Test runner failed: ${error.message}`)
    process.exit(1)
  })
}

module.exports = {
  runTestSuite,
  generateReport,
  checkPrerequisites
}
