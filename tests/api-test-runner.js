/**
 * API TEST RUNNER
 * Tests all APIs using the existing Next.js setup
 */

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

// Test configuration
const TEST_CONFIG = {
  TIMEOUT: 30000,
  RETRIES: 3,
  DELAY_BETWEEN_TESTS: 2000,
}

const testResults = {
  startTime: new Date().toISOString(),
  endTime: null,
  tests: {},
  summary: {
    totalTests: 0,
    passedTests: 0,
    failedTests: 0,
    errors: [],
  },
}

function log(message, type = 'info') {
  const timestamp = new Date().toISOString()
  const prefix =
    type === 'error' ? '❌' : type === 'success' ? '✅' : type === 'warning' ? '⚠️' : 'ℹ️'
  console.log(`${prefix} [${timestamp}] ${message}`)
}

function logHeader(title) {
  console.log('\n' + '='.repeat(80))
  console.log(`  ${title}`)
  console.log('='.repeat(80))
}

async function testApiEndpoint(endpoint, description) {
  log(`Testing ${description}...`)

  try {
    const startTime = Date.now()

    // Use curl to test the API endpoint
    const response = execSync(`curl -s -w "%{http_code}" -o /dev/null "${endpoint}"`, {
      encoding: 'utf8',
      timeout: TEST_CONFIG.TIMEOUT,
    })

    const endTime = Date.now()
    const duration = endTime - startTime
    const httpCode = response.trim()

    const success = httpCode.startsWith('2')

    testResults.tests[description] = {
      success,
      httpCode,
      duration,
      endpoint,
      timestamp: new Date().toISOString(),
    }

    testResults.summary.totalTests++
    if (success) {
      testResults.summary.passedTests++
      log(`${description}: ${httpCode} (${duration}ms)`, 'success')
    } else {
      testResults.summary.failedTests++
      log(`${description}: ${httpCode} (${duration}ms)`, 'error')
    }

    return success
  } catch (error) {
    testResults.summary.failedTests++
    testResults.summary.errors.push(`${description}: ${error.message}`)
    log(`${description}: Error - ${error.message}`, 'error')
    return false
  }
}

async function testSportsDBApi() {
  logHeader('TESTING SPORTSDB API')

  // Test basic endpoints
  await testApiEndpoint(
    'https://www.thesportsdb.com/api/v1/json/3/eventsday.php?d=2024-01-01',
    'SportsDB Events by Date'
  )

  await testApiEndpoint(
    'https://www.thesportsdb.com/api/v1/json/3/searchteams.php?t=basketball',
    'SportsDB Team Search'
  )

  await testApiEndpoint(
    'https://www.thesportsdb.com/api/v1/json/3/search_all_leagues.php?s=basketball',
    'SportsDB Leagues by Sport'
  )
}

async function testBallDontLieApi() {
  logHeader('TESTING BALLDONTLIE API')

  // Test basic endpoints (these require API key, so we'll test the base URL)
  await testApiEndpoint(
    'https://api.balldontlie.io/v1/teams?per_page=1',
    'BallDontLie Teams (requires API key)'
  )

  await testApiEndpoint(
    'https://api.balldontlie.io/v1/players?per_page=1',
    'BallDontLie Players (requires API key)'
  )
}

async function testApiSportsApi() {
  logHeader('TESTING API-SPORTS API')

  // Test basic endpoints (these require API key)
  await testApiEndpoint(
    'https://api-football-v1.p.rapidapi.com/v3/leagues',
    'API-SPORTS Leagues (requires API key)'
  )

  await testApiEndpoint(
    'https://api-football-v1.p.rapidapi.com/v3/fixtures?next=1',
    'API-SPORTS Fixtures (requires API key)'
  )
}

async function testOddsApi() {
  logHeader('TESTING ODDS API')

  // Test basic endpoints (these require API key)
  await testApiEndpoint(
    'https://api.the-odds-api.com/v4/sports',
    'Odds API Sports (requires API key)'
  )

  await testApiEndpoint(
    'https://api.the-odds-api.com/v4/odds?sport=basketball_nba&regions=us&markets=h2h',
    'Odds API Odds (requires API key)'
  )
}

async function testEnvironmentVariables() {
  logHeader('TESTING ENVIRONMENT VARIABLES')

  const requiredVars = [
    'NEXT_PUBLIC_SPORTSDB_API_KEY',
    'NEXT_PUBLIC_BALLDONTLIE_API_KEY',
    'NEXT_PUBLIC_RAPIDAPI_KEY',
    'NEXT_PUBLIC_ODDS_API_KEY',
  ]

  const envFile = path.join(process.cwd(), '.env.local')
  let envContent = ''

  if (fs.existsSync(envFile)) {
    envContent = fs.readFileSync(envFile, 'utf8')
  }

  requiredVars.forEach(varName => {
    const hasVar = envContent.includes(varName)
    const isConfigured =
      hasVar && !envContent.includes(`${varName}=your_`) && !envContent.includes(`${varName}=`)

    testResults.tests[`Environment: ${varName}`] = {
      success: isConfigured,
      configured: isConfigured,
      present: hasVar,
      timestamp: new Date().toISOString(),
    }

    testResults.summary.totalTests++
    if (isConfigured) {
      testResults.summary.passedTests++
      log(`${varName}: Configured`, 'success')
    } else if (hasVar) {
      testResults.summary.failedTests++
      log(`${varName}: Present but not configured`, 'warning')
    } else {
      testResults.summary.failedTests++
      log(`${varName}: Missing`, 'error')
    }
  })
}

async function testFileStructure() {
  logHeader('TESTING FILE STRUCTURE')

  const requiredFiles = [
    'lib/sports-apis/sportsdb-client.ts',
    'lib/sports-apis/balldontlie-client.ts',
    'lib/sports-apis/api-sports-client.ts',
    'lib/sports-apis/odds-api-client.ts',
    'lib/services/sports/basketball/basketball-service.ts',
    'lib/services/predictions/sport-prediction-service.ts',
    'lib/services/comprehensive-data-population-service.ts',
  ]

  requiredFiles.forEach(filePath => {
    const fullPath = path.join(process.cwd(), filePath)
    const exists = fs.existsSync(fullPath)

    testResults.tests[`File: ${filePath}`] = {
      success: exists,
      exists,
      path: fullPath,
      timestamp: new Date().toISOString(),
    }

    testResults.summary.totalTests++
    if (exists) {
      testResults.summary.passedTests++
      log(`${filePath}: Exists`, 'success')
    } else {
      testResults.summary.failedTests++
      log(`${filePath}: Missing`, 'error')
    }
  })
}

async function testRateLimitingImplementation() {
  logHeader('TESTING RATE LIMITING IMPLEMENTATION')

  const rateLimitFiles = [
    'lib/sports-apis/sportsdb-client.ts',
    'lib/sports-apis/balldontlie-client.ts',
    'lib/sports-apis/api-sports-client.ts',
    'lib/sports-apis/odds-api-client.ts',
  ]

  rateLimitFiles.forEach(filePath => {
    const fullPath = path.join(process.cwd(), filePath)

    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, 'utf8')

      const hasRateLimit = content.includes('rateLimit') || content.includes('rateLimitDelay')
      const hasDelay = content.includes('setTimeout') || content.includes('delay')
      const hasErrorHandling = content.includes('429') || content.includes('rate limit')

      const success = hasRateLimit && hasDelay && hasErrorHandling

      testResults.tests[`Rate Limiting: ${filePath}`] = {
        success,
        hasRateLimit,
        hasDelay,
        hasErrorHandling,
        timestamp: new Date().toISOString(),
      }

      testResults.summary.totalTests++
      if (success) {
        testResults.summary.passedTests++
        log(`${filePath}: Rate limiting implemented`, 'success')
      } else {
        testResults.summary.failedTests++
        const missing = []
        if (!hasRateLimit) missing.push('rate limiting logic')
        if (!hasDelay) missing.push('delay mechanism')
        if (!hasErrorHandling) missing.push('error handling')
        log(`${filePath}: Missing ${missing.join(', ')}`, 'error')
      }
    }
  })
}

async function generateReport() {
  logHeader('GENERATING TEST REPORT')

  testResults.endTime = new Date().toISOString()

  const report = {
    summary: {
      ...testResults.summary,
      successRate:
        testResults.summary.totalTests > 0
          ? ((testResults.summary.passedTests / testResults.summary.totalTests) * 100).toFixed(2)
          : 0,
      startTime: testResults.startTime,
      endTime: testResults.endTime,
      duration: new Date(testResults.endTime) - new Date(testResults.startTime),
    },
    tests: testResults.tests,
    errors: testResults.summary.errors,
  }

  // Save report
  const reportPath = path.join(__dirname, 'api-test-report.json')
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2))

  // Display summary
  log(`Total Tests: ${report.summary.totalTests}`, 'info')
  log(`Passed: ${report.summary.passedTests}`, 'success')
  log(`Failed: ${report.summary.failedTests}`, report.summary.failedTests > 0 ? 'error' : 'info')
  log(`Success Rate: ${report.summary.successRate}%`, 'info')
  log(`Duration: ${Math.round(report.summary.duration / 1000)}s`, 'info')

  if (report.errors.length > 0) {
    log('Errors:', 'error')
    report.errors.forEach(error => log(`  - ${error}`, 'error'))
  }

  log(`Report saved to: ${reportPath}`, 'info')

  return report
}

async function runAllTests() {
  logHeader('STARTING API TESTING SUITE')

  try {
    await testFileStructure()
    await testEnvironmentVariables()
    await testRateLimitingImplementation()
    await testSportsDBApi()
    await testBallDontLieApi()
    await testApiSportsApi()
    await testOddsApi()

    const report = await generateReport()

    logHeader('TESTING COMPLETED')
    log(
      `Overall Status: ${report.summary.successRate >= 80 ? 'PASS' : 'FAIL'}`,
      report.summary.successRate >= 80 ? 'success' : 'error'
    )

    return report
  } catch (error) {
    log(`Fatal error: ${error.message}`, 'error')
    testResults.summary.errors.push(`Fatal error: ${error.message}`)
    return await generateReport()
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests().catch(console.error)
}

module.exports = { runAllTests }
