/**
 * Comprehensive Database Test Suite
 * Tests all database operations, data flow, and real-time updates
 */

// Simple test runner without Jest dependencies
import { databaseAuditService, DatabaseAuditReport } from '@/lib/services/database-audit-service'
import { MCPDatabaseService } from '@/lib/services/mcp-database-service'
import { dataSyncService } from '@/lib/services/data-sync-service'
import { automatedUpdateService } from '@/lib/services/automated-update-service'

describe('Database Comprehensive Test Suite', () => {
  let dbService: MCPDatabaseService
  let auditReport: DatabaseAuditReport

  beforeAll(async () => {
    dbService = MCPDatabaseService.getInstance()
    console.log('🚀 Starting comprehensive database tests...')
  })

  afterAll(async () => {
    console.log('✅ Comprehensive database tests completed')
  })

  describe('Database Audit Tests', () => {
    test('should run full database audit', async () => {
      auditReport = await databaseAuditService.runFullAudit()
      
      expect(auditReport).toBeDefined()
      expect(auditReport.totalTests).toBeGreaterThan(0)
      expect(auditReport.timestamp).toBeDefined()
      expect(auditReport.results).toBeInstanceOf(Array)
      expect(auditReport.recommendations).toBeInstanceOf(Array)
      
      console.log(`📊 Audit Results: ${auditReport.passedTests} passed, ${auditReport.warningTests} warnings, ${auditReport.failedTests} failed`)
    })

    test('should have no critical data integrity issues', async () => {
      const integrityTests = auditReport.results.filter(r => 
        r.testName.includes('Missing') || 
        r.testName.includes('Foreign Key') ||
        r.testName.includes('Duplicate')
      )
      
      const failedIntegrityTests = integrityTests.filter(r => r.status === 'FAIL')
      
      if (failedIntegrityTests.length > 0) {
        console.warn('⚠️ Critical data integrity issues found:')
        failedIntegrityTests.forEach(test => {
          console.warn(`  - ${test.testName}: ${test.message}`)
        })
      }
      
      expect(failedIntegrityTests.length).toBe(0)
    })

    test('should have acceptable performance', async () => {
      const performanceTests = auditReport.results.filter(r => r.testName.includes('Performance'))
      const slowTests = performanceTests.filter(r => 
        r.status === 'WARNING' && 
        r.details?.queryTime && 
        r.details.queryTime > 10000
      )
      
      if (slowTests.length > 0) {
        console.warn('⚠️ Slow queries detected:')
        slowTests.forEach(test => {
          console.warn(`  - ${test.testName}: ${test.details.queryTime}ms`)
        })
      }
      
      expect(slowTests.length).toBe(0)
    })
  })

  describe('Data Flow Tests', () => {
    test('should fetch teams from database', async () => {
      const teamsQuery = 'SELECT * FROM teams WHERE sport = $1 LIMIT 10'
      const teams = await dbService.executeSQL(teamsQuery, ['basketball'])
      
      expect(teams).toBeDefined()
      expect(Array.isArray(teams)).toBe(true)
      expect(teams.length).toBeGreaterThan(0)
      
      // Validate team structure
      const team = teams[0]
      expect(team.id).toBeDefined()
      expect(team.name).toBeDefined()
      expect(team.sport).toBe('basketball')
      expect(team.league).toBeDefined()
    })

    test('should fetch games with team relationships', async () => {
      const gamesQuery = `
        SELECT g.*, 
               ht.name as home_team_name,
               at.name as away_team_name
        FROM games g
        JOIN teams ht ON g.home_team_id = ht.id
        JOIN teams at ON g.away_team_id = at.id
        WHERE g.sport = $1
        ORDER BY g.game_date DESC
        LIMIT 10
      `
      const games = await dbService.executeSQL(gamesQuery, ['basketball'])
      
      expect(games).toBeDefined()
      expect(Array.isArray(games)).toBe(true)
      
      if (games.length > 0) {
        const game = games[0]
        expect(game.id).toBeDefined()
        expect(game.home_team_name).toBeDefined()
        expect(game.away_team_name).toBeDefined()
        expect(game.sport).toBe('basketball')
      }
    })

    test('should fetch odds with game relationships', async () => {
      const oddsQuery = `
        SELECT o.*, 
               g.game_date,
               ht.name as home_team_name,
               at.name as away_team_name
        FROM odds o
        JOIN games g ON o.game_id = g.id
        JOIN teams ht ON g.home_team_id = ht.id
        JOIN teams at ON g.away_team_id = at.id
        WHERE o.sport = $1
        ORDER BY o.created_at DESC
        LIMIT 10
      `
      const odds = await dbService.executeSQL(oddsQuery, ['basketball'])
      
      expect(odds).toBeDefined()
      expect(Array.isArray(odds)).toBe(true)
      
      if (odds.length > 0) {
        const odd = odds[0]
        expect(odd.id).toBeDefined()
        expect(odd.game_id).toBeDefined()
        expect(odd.home_team_name).toBeDefined()
        expect(odd.away_team_name).toBeDefined()
      }
    })
  })

  describe('Real-time Update Tests', () => {
    test('should detect live games', async () => {
      const liveGamesQuery = `
        SELECT COUNT(*) as live_count
        FROM games 
        WHERE status = 'live' 
        AND game_date BETWEEN NOW() - INTERVAL '2 hours' AND NOW() + INTERVAL '2 hours'
      `
      const result = await dbService.executeSQL(liveGamesQuery)
      const liveCount = result[0].live_count
      
      expect(typeof liveCount).toBe('number')
      expect(liveCount).toBeGreaterThanOrEqual(0)
      
      if (liveCount > 0) {
        console.log(`📺 Found ${liveCount} live games`)
      }
    })

    test('should have recent data updates', async () => {
      const recentUpdatesQuery = `
        SELECT COUNT(*) as recent_updates
        FROM games 
        WHERE updated_at > NOW() - INTERVAL '24 hours'
      `
      const result = await dbService.executeSQL(recentUpdatesQuery)
      const recentUpdates = result[0].recent_updates
      
      expect(typeof recentUpdates).toBe('number')
      expect(recentUpdates).toBeGreaterThanOrEqual(0)
      
      if (recentUpdates > 0) {
        console.log(`🔄 ${recentUpdates} games updated in the last 24 hours`)
      }
    })

    test('should handle data synchronization', async () => {
      // Test if sync service can be started
      expect(() => {
        dataSyncService.start()
      }).not.toThrow()
      
      // Test if sync service is running
      expect(dataSyncService.isServiceRunning()).toBe(true)
      
      // Test sync stats
      const stats = dataSyncService.getStats()
      expect(stats).toBeDefined()
      expect(typeof stats.totalSynced).toBe('number')
      expect(typeof stats.errors).toBe('number')
      
      // Stop sync service
      dataSyncService.stop()
      expect(dataSyncService.isServiceRunning()).toBe(false)
    })
  })

  describe('Error Handling Tests', () => {
    test('should handle invalid queries gracefully', async () => {
      await expect(
        dbService.executeSQL('SELECT * FROM non_existent_table')
      ).rejects.toThrow()
    })

    test('should handle malformed parameters', async () => {
      await expect(
        dbService.executeSQL('SELECT * FROM teams WHERE invalid_column = $1', ['test'])
      ).rejects.toThrow()
    })

    test('should handle empty results', async () => {
      const result = await dbService.executeSQL('SELECT * FROM teams WHERE sport = $1', ['nonexistent_sport'])
      expect(result).toBeDefined()
      expect(Array.isArray(result)).toBe(true)
      expect(result.length).toBe(0)
    })
  })

  describe('Performance Tests', () => {
    test('should execute queries within acceptable time limits', async () => {
      const startTime = Date.now()
      
      await dbService.executeSQL(`
        SELECT t.*, 
               COUNT(g.id) as game_count
        FROM teams t
        LEFT JOIN games g ON (g.home_team_id = t.id OR g.away_team_id = t.id)
        WHERE t.sport = 'basketball'
        GROUP BY t.id
        ORDER BY game_count DESC
        LIMIT 20
      `)
      
      const executionTime = Date.now() - startTime
      expect(executionTime).toBeLessThan(5000) // Should complete within 5 seconds
      
      console.log(`⚡ Query executed in ${executionTime}ms`)
    })

    test('should handle concurrent queries', async () => {
      const queries = Array(5).fill(null).map(() => 
        dbService.executeSQL('SELECT * FROM teams WHERE sport = $1 LIMIT 10', ['basketball'])
      )
      
      const startTime = Date.now()
      const results = await Promise.all(queries)
      const executionTime = Date.now() - startTime
      
      expect(results).toHaveLength(5)
      results.forEach(result => {
        expect(Array.isArray(result)).toBe(true)
      })
      
      expect(executionTime).toBeLessThan(10000) // Should complete within 10 seconds
      console.log(`🔄 Concurrent queries executed in ${executionTime}ms`)
    })
  })

  describe('Data Consistency Tests', () => {
    test('should maintain referential integrity', async () => {
      const integrityQuery = `
        SELECT 
          COUNT(*) as total_games,
          COUNT(CASE WHEN ht.id IS NULL THEN 1 END) as broken_home_fk,
          COUNT(CASE WHEN at.id IS NULL THEN 1 END) as broken_away_fk
        FROM games g
        LEFT JOIN teams ht ON g.home_team_id = ht.id
        LEFT JOIN teams at ON g.away_team_id = at.id
      `
      const result = await dbService.executeSQL(integrityQuery)
      const data = result[0]
      
      expect(data.broken_home_fk).toBe(0)
      expect(data.broken_away_fk).toBe(0)
    })

    test('should have consistent data types', async () => {
      const teamsQuery = 'SELECT * FROM teams LIMIT 1'
      const teams = await dbService.executeSQL(teamsQuery)
      
      if (teams.length > 0) {
        const team = teams[0]
        expect(typeof team.id).toBe('string')
        expect(typeof team.name).toBe('string')
        expect(typeof team.sport).toBe('string')
        expect(typeof team.league).toBe('string')
        expect(team.created_at).toBeDefined()
        expect(team.updated_at).toBeDefined()
      }
    })

    test('should have valid date ranges', async () => {
      const dateQuery = `
        SELECT 
          MIN(game_date) as earliest_game,
          MAX(game_date) as latest_game,
          COUNT(CASE WHEN game_date < '1900-01-01' THEN 1 END) as invalid_dates
        FROM games
      `
      const result = await dbService.executeSQL(dateQuery)
      const data = result[0]
      
      expect(data.invalid_dates).toBe(0)
      expect(new Date(data.earliest_game)).toBeInstanceOf(Date)
      expect(new Date(data.latest_game)).toBeInstanceOf(Date)
    })
  })

  describe('API Integration Tests', () => {
    test('should fetch data from external APIs', async () => {
      const { apiFallbackStrategy } = await import('@/lib/services/api-fallback-strategy')
      
      const result = await apiFallbackStrategy.executeWithFallback({
        sport: 'basketball',
        dataType: 'games',
        params: { date: new Date().toISOString().split('T')[0] },
        priority: 'low'
      })
      
      expect(result).toBeDefined()
      expect(result.success).toBeDefined()
      
      if (result.success) {
        expect(result.data).toBeDefined()
        expect(Array.isArray(result.data)).toBe(true)
        console.log(`🌐 Fetched ${result.data.length} games from external API`)
      } else {
        console.warn('⚠️ External API fetch failed:', result.error)
      }
    })

    test('should handle API rate limiting', async () => {
      const { intelligentRateLimiter } = await import('@/lib/services/intelligent-rate-limiter')
      
      // Test rate limit check
      const rateCheck = await intelligentRateLimiter.checkRateLimit('test_service')
      expect(rateCheck).toBeDefined()
      expect(typeof rateCheck.allowed).toBe('boolean')
      expect(typeof rateCheck.waitTime).toBe('number')
    })
  })

  describe('Automated Update Tests', () => {
    test('should start and stop automated updates', async () => {
      // Test starting updates
      await expect(automatedUpdateService.startAutomatedUpdates()).resolves.not.toThrow()
      
      // Check status
      const status = automatedUpdateService.getStatus()
      expect(status.isRunning).toBe(true)
      
      // Test stopping updates
      automatedUpdateService.stopAutomatedUpdates()
      const stoppedStatus = automatedUpdateService.getStatus()
      expect(stoppedStatus.isRunning).toBe(false)
    })

    test('should perform full update', async () => {
      const updateStats = await automatedUpdateService.performFullUpdate()
      
      expect(updateStats).toBeDefined()
      expect(typeof updateStats.gamesUpdated).toBe('number')
      expect(typeof updateStats.playerStatsUpdated).toBe('number')
      expect(typeof updateStats.oddsUpdated).toBe('number')
      expect(typeof updateStats.predictionsUpdated).toBe('number')
      expect(typeof updateStats.standingsUpdated).toBe('number')
      expect(Array.isArray(updateStats.errors)).toBe(true)
      
      console.log(`🔄 Update completed: ${updateStats.gamesUpdated} games, ${updateStats.errors.length} errors`)
    })
  })

  describe('Issue Resolution Tests', () => {
    test('should fix identified issues', async () => {
      if (auditReport.failedTests > 0) {
        const fixResult = await databaseAuditService.fixIssues(auditReport)
        
        expect(fixResult).toBeDefined()
        expect(typeof fixResult.fixed).toBe('number')
        expect(Array.isArray(fixResult.errors)).toBe(true)
        
        console.log(`🔧 Fixed ${fixResult.fixed} issues, ${fixResult.errors.length} errors`)
        
        if (fixResult.errors.length > 0) {
          console.warn('⚠️ Fix errors:')
          fixResult.errors.forEach(error => console.warn(`  - ${error}`))
        }
      } else {
        console.log('✅ No issues to fix')
      }
    })

    test('should re-audit after fixes', async () => {
      if (auditReport.failedTests > 0) {
        const reAuditReport = await databaseAuditService.runFullAudit()
        
        expect(reAuditReport).toBeDefined()
        expect(reAuditReport.totalTests).toBeGreaterThan(0)
        
        const newFailedTests = reAuditReport.results.filter(r => r.status === 'FAIL')
        console.log(`🔍 Re-audit: ${newFailedTests.length} failed tests remaining`)
        
        // Should have fewer or same number of failed tests
        expect(newFailedTests.length).toBeLessThanOrEqual(auditReport.failedTests)
      }
    })
  })
})
