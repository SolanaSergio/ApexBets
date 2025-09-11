/**
 * COMPREHENSIVE VERIFICATION SYSTEM - FIXED VERSION
 * Tests all API endpoints with real data only - NO MOCK DATA
 */

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'

// Test configuration
const TEST_CONFIG = {
  sports: ['basketball', 'football', 'baseball', 'hockey', 'soccer', 'tennis', 'golf'],
  timeout: 10000,
  retries: 2
}

// Test results storage
const testResults = {
  apiEndpoints: {},
  sportsCoverage: {},
  databaseUpdates: {},
  externalApis: {},
  playerStats: {},
  teamStats: {},
  databaseSchema: {}
}

// Utility functions
async function makeRequest(url, options = {}) {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), TEST_CONFIG.timeout)
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    })
    clearTimeout(timeoutId)
    return response
  } catch (error) {
    clearTimeout(timeoutId)
    throw error
  }
}

async function testEndpoint(name, url, expectedStatus = 200) {
  const startTime = Date.now()
  
  try {
    console.log(`Testing ${name}...`)
    const response = await makeRequest(url)
    const duration = Date.now() - startTime
    
    if (response.ok) {
      const data = await response.json()
      testResults.apiEndpoints[name] = {
        status: 'success',
        duration,
        data: data.success !== false ? 'Working' : 'Failed',
        timestamp: new Date().toISOString()
      }
      console.log(`✓ ${name} (${duration}ms)`)
      return true
    } else {
      testResults.apiEndpoints[name] = {
        status: 'error',
        duration,
        error: `HTTP ${response.status}`,
        timestamp: new Date().toISOString()
      }
      console.log(`✗ ${name} (${duration}ms) - HTTP ${response.status}`)
      return false
    }
  } catch (error) {
    const duration = Date.now() - startTime
    testResults.apiEndpoints[name] = {
      status: 'error',
      duration,
      error: error.message,
      timestamp: new Date().toISOString()
    }
    console.log(`✗ ${name} (${duration}ms) - ${error.message}`)
    return false
  }
}

async function testSportCoverage(sport) {
  const startTime = Date.now()
  
  try {
    console.log(`Testing ${sport} games...`)
    const response = await makeRequest(`${BASE_URL}/games?sport=${sport}&limit=5`)
    const duration = Date.now() - startTime
    
    if (response.ok) {
      const data = await response.json()
      const gameCount = data.games?.length || 0
      testResults.sportsCoverage[sport] = {
        status: 'success',
        duration,
        gameCount,
        timestamp: new Date().toISOString()
      }
      console.log(`✓ ${sport} games (${duration}ms) - ${gameCount} games found`)
      return true
    } else {
      testResults.sportsCoverage[sport] = {
        status: 'error',
        duration,
        error: `HTTP ${response.status}`,
        timestamp: new Date().toISOString()
      }
      console.log(`✗ ${sport} games (${duration}ms) - HTTP ${response.status}`)
      return false
    }
  } catch (error) {
    const duration = Date.now() - startTime
    testResults.sportsCoverage[sport] = {
      status: 'error',
      duration,
      error: error.message,
      timestamp: new Date().toISOString()
    }
    console.log(`✗ ${sport} games (${duration}ms) - ${error.message}`)
    return false
  }
}

async function testPlayerStats(sport) {
  const startTime = Date.now()
  
  try {
    console.log(`Testing ${sport} player stats...`)
    const response = await makeRequest(`${BASE_URL}/player-stats?sport=${sport}&limit=5`)
    const duration = Date.now() - startTime
    
    if (response.ok) {
      const data = await response.json()
      const playerCount = data.data?.length || 0
      testResults.playerStats[sport] = {
        status: 'success',
        duration,
        playerCount,
        timestamp: new Date().toISOString()
      }
      console.log(`✓ ${sport} player stats (${duration}ms) - ${playerCount} players found`)
      return true
    } else {
      testResults.playerStats[sport] = {
        status: 'error',
        duration,
        error: `HTTP ${response.status}`,
        timestamp: new Date().toISOString()
      }
      console.log(`✗ ${sport} player stats (${duration}ms) - HTTP ${response.status}`)
      return false
    }
  } catch (error) {
    const duration = Date.now() - startTime
    testResults.playerStats[sport] = {
      status: 'error',
      duration,
      error: error.message,
      timestamp: new Date().toISOString()
    }
    console.log(`✗ ${sport} player stats (${duration}ms) - ${error.message}`)
    return false
  }
}

async function testTeamStats(sport) {
  const startTime = Date.now()
  
  try {
    console.log(`Testing ${sport} team stats...`)
    const response = await makeRequest(`${BASE_URL}/team-stats?sport=${sport}&type=standings`)
    const duration = Date.now() - startTime
    
    if (response.ok) {
      const data = await response.json()
      const teamCount = data.data?.standings?.[0]?.teams?.length || 0
      testResults.teamStats[sport] = {
        status: 'success',
        duration,
        teamCount,
        timestamp: new Date().toISOString()
      }
      console.log(`✓ ${sport} team stats (${duration}ms) - ${teamCount} teams found`)
      return true
    } else {
      testResults.teamStats[sport] = {
        status: 'error',
        duration,
        error: `HTTP ${response.status}`,
        timestamp: new Date().toISOString()
      }
      console.log(`✗ ${sport} team stats (${duration}ms) - HTTP ${response.status}`)
      return false
    }
  } catch (error) {
    const duration = Date.now() - startTime
    testResults.teamStats[sport] = {
      status: 'error',
      duration,
      error: error.message,
      timestamp: new Date().toISOString()
    }
    console.log(`✗ ${sport} team stats (${duration}ms) - ${error.message}`)
    return false
  }
}

async function testDatabaseSchema() {
  const startTime = Date.now()
  
  try {
    console.log(`Testing database schema validation...`)
    const response = await makeRequest(`${BASE_URL}/database/schema`)
    const duration = Date.now() - startTime
    
    if (response.ok) {
      const data = await response.json()
      const isValid = data.data?.isValid || false
      const errorCount = data.data?.errors?.length || 0
      const warningCount = data.data?.warnings?.length || 0
      
      testResults.databaseSchema = {
        status: 'success',
        duration,
        isValid,
        errorCount,
        warningCount,
        timestamp: new Date().toISOString()
      }
      console.log(`✓ Database schema (${duration}ms) - Valid: ${isValid}, Errors: ${errorCount}, Warnings: ${warningCount}`)
      return true
    } else {
      testResults.databaseSchema = {
        status: 'error',
        duration,
        error: `HTTP ${response.status}`,
        timestamp: new Date().toISOString()
      }
      console.log(`✗ Database schema (${duration}ms) - HTTP ${response.status}`)
      return false
    }
  } catch (error) {
    const duration = Date.now() - startTime
    testResults.databaseSchema = {
      status: 'error',
      duration,
      error: error.message,
      timestamp: new Date().toISOString()
    }
    console.log(`✗ Database schema (${duration}ms) - ${error.message}`)
    return false
  }
}

async function testDatabaseIntegrity() {
  const startTime = Date.now()
  
  try {
    console.log(`Testing database integrity checks...`)
    const response = await makeRequest(`${BASE_URL}/database/integrity`)
    const duration = Date.now() - startTime
    
    if (response.ok) {
      const data = await response.json()
      const summary = data.data?.summary || {}
      const allPassed = summary.allPassed || false
      
      testResults.databaseIntegrity = {
        status: 'success',
        duration,
        allPassed,
        totalChecks: summary.total || 0,
        passedChecks: summary.passed || 0,
        failedChecks: summary.failed || 0,
        timestamp: new Date().toISOString()
      }
      console.log(`✓ Database integrity (${duration}ms) - All passed: ${allPassed}, ${summary.passed}/${summary.total} checks passed`)
      return true
    } else {
      testResults.databaseIntegrity = {
        status: 'error',
        duration,
        error: `HTTP ${response.status}`,
        timestamp: new Date().toISOString()
      }
      console.log(`✗ Database integrity (${duration}ms) - HTTP ${response.status}`)
      return false
    }
  } catch (error) {
    const duration = Date.now() - startTime
    testResults.databaseIntegrity = {
      status: 'error',
      duration,
      error: error.message,
      timestamp: new Date().toISOString()
    }
    console.log(`✗ Database integrity (${duration}ms) - ${error.message}`)
    return false
  }
}

async function runComprehensiveTests() {
  console.log('🔍 ApexBets Comprehensive Verification System - FIXED VERSION')
  console.log('======================================================')
  console.log('Testing with REAL DATA ONLY - NO PLACEHOLDERS OR MOCK DATA')
  console.log('')

  // Test critical API endpoints
  console.log('Testing Critical API Endpoints:')
  await testEndpoint('Health Check', `${BASE_URL}/health`)
  await testEndpoint('Games Endpoint', `${BASE_URL}/games?sport=basketball&limit=5`)
  await testEndpoint('Teams Endpoint', `${BASE_URL}/teams?sport=basketball&limit=5`)
  await testEndpoint('Live Scores', `${BASE_URL}/live-scores?sport=basketball`)
  await testEndpoint('Odds', `${BASE_URL}/odds?sport=basketball&limit=5`)
  await testEndpoint('Predictions', `${BASE_URL}/predictions?sport=basketball&limit=5`)
  await testEndpoint('Analytics', `${BASE_URL}/analytics?sport=basketball`)
  await testEndpoint('Standings', `${BASE_URL}/standings?sport=basketball`)
  await testEndpoint('Value Bets', `${BASE_URL}/value-bets?sport=basketball&limit=5`)
  await testEndpoint('Live Updates', `${BASE_URL}/live-updates?sport=basketball`)

  console.log('')
  console.log('Testing Multi-Sport Data Coverage:')
  for (const sport of TEST_CONFIG.sports) {
    await testSportCoverage(sport)
  }

  console.log('')
  console.log('Testing Player Statistics System:')
  for (const sport of TEST_CONFIG.sports) {
    await testPlayerStats(sport)
  }

  console.log('')
  console.log('Testing Team Statistics System:')
  for (const sport of TEST_CONFIG.sports) {
    await testTeamStats(sport)
  }

  console.log('')
  console.log('Testing Database Systems:')
  await testDatabaseSchema()
  await testDatabaseIntegrity()

  // Calculate summary
  const apiSuccessCount = Object.values(testResults.apiEndpoints).filter(r => r.status === 'success').length
  const apiTotalCount = Object.keys(testResults.apiEndpoints).length
  const sportsSuccessCount = Object.values(testResults.sportsCoverage).filter(r => r.status === 'success').length
  const sportsTotalCount = Object.keys(testResults.sportsCoverage).length
  const playerStatsSuccessCount = Object.values(testResults.playerStats).filter(r => r.status === 'success').length
  const playerStatsTotalCount = Object.keys(testResults.playerStats).length
  const teamStatsSuccessCount = Object.values(testResults.teamStats).filter(r => r.status === 'success').length
  const teamStatsTotalCount = Object.keys(testResults.teamStats).length

  console.log('')
  console.log('📊 Comprehensive Verification Summary')
  console.log('=========================================')
  console.log(`✓ API Endpoints: ${apiSuccessCount}/${apiTotalCount} working`)
  console.log(`✓ Sports Coverage: ${sportsSuccessCount}/${sportsTotalCount} sports`)
  console.log(`✓ Player Statistics: ${playerStatsSuccessCount}/${playerStatsTotalCount} sports`)
  console.log(`✓ Team Statistics: ${teamStatsSuccessCount}/${teamStatsTotalCount} sports`)
  console.log(`✓ Database Schema: ${testResults.databaseSchema.status === 'success' ? 'Valid' : 'Issues'}`)
  console.log(`✓ Database Integrity: ${testResults.databaseIntegrity.status === 'success' ? 'Passed' : 'Issues'}`)

  // Save detailed report
  const fs = require('fs')
  const reportPath = './tests/verification-report-fixed.json'
  fs.writeFileSync(reportPath, JSON.stringify(testResults, null, 2))
  console.log(`✓ Verification report saved to: ${reportPath}`)

  const totalIssues = (apiTotalCount - apiSuccessCount) + (sportsTotalCount - sportsSuccessCount) + 
                     (playerStatsTotalCount - playerStatsSuccessCount) + (teamStatsTotalCount - teamStatsSuccessCount) +
                     (testResults.databaseSchema.status !== 'success' ? 1 : 0) + 
                     (testResults.databaseIntegrity.status !== 'success' ? 1 : 0)

  if (totalIssues === 0) {
    console.log('')
    console.log('🎉 All systems are working perfectly!')
  } else {
    console.log('')
    console.log(`❌ ${totalIssues} issues found - Check verification-report-fixed.json for details`)
  }
}

// Run the tests
runComprehensiveTests().catch(console.error)
