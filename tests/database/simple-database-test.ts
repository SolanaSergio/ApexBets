/**
 * Simple Database Test Runner
 * Tests database operations without Jest dependencies
 */

import { databaseAuditService } from '../../lib/services/database-audit-service'
import { MCPDatabaseService } from '../../lib/services/mcp-database-service'

interface TestResult {
  testName: string
  status: 'PASS' | 'FAIL' | 'WARNING'
  message: string
  details?: any
}

async function runDatabaseTests() {
  console.log('🚀 Starting Database Test Suite...')
  
  const dbService = MCPDatabaseService.getInstance()
  const testResults: TestResult[] = []

  const addTestResult = (result: TestResult) => {
    testResults.push(result)
    const status = result.status === 'PASS' ? '✅' : result.status === 'FAIL' ? '❌' : '⚠️'
    console.log(`${status} ${result.testName}: ${result.message}`)
  }

  try {
    // Test 1: Database Connection
    console.log('\n📡 Testing database connection...')
    try {
      const tables = await dbService.getAllTables()
      addTestResult({
        testName: 'Database Connection',
        status: 'PASS',
        message: `Successfully connected to database with ${tables.length} tables`,
        details: { tableCount: tables.length }
      })
    } catch (error) {
      addTestResult({
        testName: 'Database Connection',
        status: 'FAIL',
        message: `Failed to connect to database: ${error}`,
        details: { error: String(error) }
      })
    }

    // Test 2: Data Counts
    console.log('\n📊 Testing data counts...')
    try {
      const teamsCount = await dbService.executeSQL('SELECT COUNT(*) as count FROM teams')
      const gamesCount = await dbService.executeSQL('SELECT COUNT(*) as count FROM games')
      const oddsCount = await dbService.executeSQL('SELECT COUNT(*) as count FROM odds')
      
      const teams = teamsCount.data?.[0]?.count || 0
      const games = gamesCount.data?.[0]?.count || 0
      const odds = oddsCount.data?.[0]?.count || 0
      
      addTestResult({
        testName: 'Data Counts',
        status: 'PASS',
        message: `Teams: ${teams}, Games: ${games}, Odds: ${odds}`,
        details: { teams, games, odds }
      })
    } catch (error) {
      addTestResult({
        testName: 'Data Counts',
        status: 'FAIL',
        message: `Failed to get data counts: ${error}`,
        details: { error: String(error) }
      })
    }

    // Test 3: Data Integrity
    console.log('\n🔍 Testing data integrity...')
    try {
      const missingNames = await dbService.executeSQL(`
        SELECT COUNT(*) as count FROM teams 
        WHERE name IS NULL OR name = ''
      `)
      
      const missingSports = await dbService.executeSQL(`
        SELECT COUNT(*) as count FROM teams 
        WHERE sport IS NULL OR sport = ''
      `)
      
      const missingNamesCount = missingNames.data?.[0]?.count || 0
      const missingSportsCount = missingSports.data?.[0]?.count || 0
      
      if (missingNamesCount === 0 && missingSportsCount === 0) {
        addTestResult({
          testName: 'Data Integrity',
          status: 'PASS',
          message: 'No missing essential data found',
          details: { missingNames: missingNamesCount, missingSports: missingSportsCount }
        })
      } else {
        addTestResult({
          testName: 'Data Integrity',
          status: 'WARNING',
          message: `Found ${missingNamesCount} missing names, ${missingSportsCount} missing sports`,
          details: { missingNames: missingNamesCount, missingSports: missingSportsCount }
        })
      }
    } catch (error) {
      addTestResult({
        testName: 'Data Integrity',
        status: 'FAIL',
        message: `Failed to check data integrity: ${error}`,
        details: { error: String(error) }
      })
    }

    // Test 4: Duplicate Detection
    console.log('\n🔍 Testing for duplicates...')
    try {
      const duplicateTeams = await dbService.executeSQL(`
        SELECT name, sport, league, COUNT(*) as count 
        FROM teams 
        GROUP BY name, sport, league 
        HAVING COUNT(*) > 1
        LIMIT 5
      `)
      
      const duplicateGames = await dbService.executeSQL(`
        SELECT home_team_id, away_team_id, game_date, COUNT(*) as count 
        FROM games 
        GROUP BY home_team_id, away_team_id, game_date 
        HAVING COUNT(*) > 1
        LIMIT 5
      `)
      
      const teamDuplicates = duplicateTeams.data?.length || 0
      const gameDuplicates = duplicateGames.data?.length || 0
      
      if (teamDuplicates === 0 && gameDuplicates === 0) {
        addTestResult({
          testName: 'Duplicate Detection',
          status: 'PASS',
          message: 'No duplicate records found',
          details: { teamDuplicates, gameDuplicates }
        })
      } else {
        addTestResult({
          testName: 'Duplicate Detection',
          status: 'WARNING',
          message: `Found ${teamDuplicates} duplicate teams, ${gameDuplicates} duplicate games`,
          details: { teamDuplicates, gameDuplicates }
        })
      }
    } catch (error) {
      addTestResult({
        testName: 'Duplicate Detection',
        status: 'FAIL',
        message: `Failed to check for duplicates: ${error}`,
        details: { error: String(error) }
      })
    }

    // Test 5: Performance Test
    console.log('\n⚡ Testing query performance...')
    try {
      const startTime = Date.now()
      await dbService.executeSQL(`
        SELECT t.name, t.sport, t.league, 
               COUNT(g.id) as game_count,
               AVG(g.home_score) as avg_home_score,
               AVG(g.away_score) as avg_away_score
        FROM teams t
        LEFT JOIN games g ON t.id = g.home_team_id OR t.id = g.away_team_id
        GROUP BY t.id, t.name, t.sport, t.league
        ORDER BY game_count DESC
        LIMIT 10
      `)
      const queryTime = Date.now() - startTime
      
      if (queryTime < 1000) {
        addTestResult({
          testName: 'Query Performance',
          status: 'PASS',
          message: `Complex query completed in ${queryTime}ms`,
          details: { queryTime }
        })
      } else {
        addTestResult({
          testName: 'Query Performance',
          status: 'WARNING',
          message: `Complex query took ${queryTime}ms (consider optimization)`,
          details: { queryTime }
        })
      }
    } catch (error) {
      addTestResult({
        testName: 'Query Performance',
        status: 'FAIL',
        message: `Performance test failed: ${error}`,
        details: { error: String(error) }
      })
    }

    // Test 6: Full Audit
    console.log('\n🔍 Running full database audit...')
    try {
      const auditReport = await databaseAuditService.runFullAudit()
      
      addTestResult({
        testName: 'Full Database Audit',
        status: auditReport.failedTests > 0 ? 'WARNING' : 'PASS',
        message: `Audit completed: ${auditReport.passedTests} passed, ${auditReport.failedTests} failed`,
        details: {
          passed: auditReport.passedTests,
          warnings: 0,
          failed: auditReport.failedTests,
          total: auditReport.totalTests
        }
      })
    } catch (error) {
      addTestResult({
        testName: 'Full Database Audit',
        status: 'FAIL',
        message: `Audit failed: ${error}`,
        details: { error: String(error) }
      })
    }

  } catch (error) {
    console.error('❌ Test suite failed:', error)
  }

  // Summary
  console.log('\n📊 Test Summary:')
  const passed = testResults.filter(r => r.status === 'PASS').length
  const failed = testResults.filter(r => r.status === 'FAIL').length
  const warnings = testResults.filter(r => r.status === 'WARNING').length
  
  console.log(`✅ Passed: ${passed}`)
  console.log(`❌ Failed: ${failed}`)
  console.log(`⚠️  Warnings: ${warnings}`)
  console.log(`📈 Total: ${testResults.length}`)
  
  if (failed > 0) {
    console.log('\n❌ Failed Tests:')
    testResults.filter(r => r.status === 'FAIL').forEach(test => {
      console.log(`  - ${test.testName}: ${test.message}`)
    })
  }
  
  if (warnings > 0) {
    console.log('\n⚠️  Warning Tests:')
    testResults.filter(r => r.status === 'WARNING').forEach(test => {
      console.log(`  - ${test.testName}: ${test.message}`)
    })
  }

  console.log('\n✅ Database test suite completed!')
  return testResults
}

// Run the tests
if (require.main === module) {
  runDatabaseTests().catch(console.error)
}

export { runDatabaseTests }
