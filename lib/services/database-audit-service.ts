/**
 * Database Audit Service
 * Comprehensive auditing and testing of database integrity, data flow, and performance
 */

import { MCPDatabaseService } from './mcp-database-service'

export interface AuditResult {
  testName: string
  status: 'PASS' | 'FAIL' | 'WARNING'
  message: string
  details?: any
  timestamp?: string
}

export interface DatabaseAuditReport {
  overallStatus: 'HEALTHY' | 'ISSUES_FOUND' | 'CRITICAL_ISSUES'
  totalTests: number
  passedTests: number
  failedTests: number
  warningTests: number
  results: AuditResult[]
  recommendations: string[]
  timestamp: string
}

export class DatabaseAuditService {
  private dbService: MCPDatabaseService

  constructor() {
    this.dbService = MCPDatabaseService.getInstance()
  }

  /**
   * Run comprehensive database audit
   */
  async runFullAudit(): Promise<DatabaseAuditReport> {
    console.log('🔍 Starting comprehensive database audit...')
    
    const results: AuditResult[] = []
    const recommendations: string[] = []

    // 1. Data Integrity Tests
    results.push(...await this.testDataIntegrity())
    
    // 2. Foreign Key Tests
    results.push(...await this.testForeignKeyIntegrity())
    
    // 3. Data Freshness Tests
    results.push(...await this.testDataFreshness())
    
    // 4. Duplicate Data Tests
    results.push(...await this.testDuplicateData())
    
    // 5. Performance Tests
    results.push(...await this.testPerformance())
    
    // 6. API Data Flow Tests
    results.push(...await this.testAPIDataFlow())
    
    // 7. Real-time Update Tests
    results.push(...await this.testRealTimeUpdates())
    
    // 8. Error Handling Tests
    results.push(...await this.testErrorHandling())

    // Calculate overall status
    const failedTests = results.filter(r => r.status === 'FAIL').length
    const warningTests = results.filter(r => r.status === 'WARNING').length
    const passedTests = results.filter(r => r.status === 'PASS').length

    let overallStatus: 'HEALTHY' | 'ISSUES_FOUND' | 'CRITICAL_ISSUES'
    if (failedTests === 0 && warningTests === 0) {
      overallStatus = 'HEALTHY'
    } else if (failedTests === 0) {
      overallStatus = 'ISSUES_FOUND'
    } else {
      overallStatus = 'CRITICAL_ISSUES'
    }

    // Generate recommendations
    recommendations.push(...this.generateRecommendations(results))

    const report: DatabaseAuditReport = {
      overallStatus,
      totalTests: results.length,
      passedTests,
      failedTests,
      warningTests,
      results,
      recommendations,
      timestamp: new Date().toISOString()
    }

    console.log(`✅ Database audit completed: ${passedTests} passed, ${warningTests} warnings, ${failedTests} failed`)
    return report
  }

  /**
   * Test data integrity across all tables
   */
  private async testDataIntegrity(): Promise<AuditResult[]> {
    const results: AuditResult[] = []

    try {
      // Test teams table integrity
      const teamsQuery = `
        SELECT 
          COUNT(*) as total_records,
          COUNT(CASE WHEN name IS NULL OR name = '' THEN 1 END) as missing_names,
          COUNT(CASE WHEN sport IS NULL OR sport = '' THEN 1 END) as missing_sports,
          COUNT(CASE WHEN league IS NULL OR league = '' THEN 1 END) as missing_leagues,
          COUNT(CASE WHEN created_at IS NULL THEN 1 END) as missing_created_at
        FROM teams
      `
      const teamsResult = await this.dbService.executeSQL(teamsQuery)
      const teamsData = teamsResult[0]

      if (teamsData.missing_names > 0) {
        results.push({
          testName: 'Teams Missing Names',
          status: 'FAIL',
          message: `${teamsData.missing_names} teams have missing or empty names`,
          details: { missing_names: teamsData.missing_names }
        })
      } else {
        results.push({
          testName: 'Teams Missing Names',
          status: 'PASS',
          message: 'All teams have valid names'
        })
      }

      if (teamsData.missing_sports > 0) {
        results.push({
          testName: 'Teams Missing Sports',
          status: 'FAIL',
          message: `${teamsData.missing_sports} teams have missing or empty sports`,
          details: { missing_sports: teamsData.missing_sports }
        })
      } else {
        results.push({
          testName: 'Teams Missing Sports',
          status: 'PASS',
          message: 'All teams have valid sports'
        })
      }

      // Test games table integrity
      const gamesQuery = `
        SELECT 
          COUNT(*) as total_records,
          COUNT(CASE WHEN home_team_id IS NULL THEN 1 END) as missing_home_team,
          COUNT(CASE WHEN away_team_id IS NULL THEN 1 END) as missing_away_team,
          COUNT(CASE WHEN sport IS NULL OR sport = '' THEN 1 END) as missing_sports,
          COUNT(CASE WHEN game_date IS NULL THEN 1 END) as missing_game_date
        FROM games
      `
      const gamesResult = await this.dbService.executeSQL(gamesQuery)
      const gamesData = gamesResult[0]

      if (gamesData.missing_home_team > 0 || gamesData.missing_away_team > 0) {
        results.push({
          testName: 'Games Missing Team References',
          status: 'FAIL',
          message: `${gamesData.missing_home_team} games missing home team, ${gamesData.missing_away_team} missing away team`,
          details: { missing_home_team: gamesData.missing_home_team, missing_away_team: gamesData.missing_away_team }
        })
      } else {
        results.push({
          testName: 'Games Missing Team References',
          status: 'PASS',
          message: 'All games have valid team references'
        })
      }

    } catch (error) {
      results.push({
        testName: 'Data Integrity Test',
        status: 'FAIL',
        message: `Error testing data integrity: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      })
    }

    return results
  }

  /**
   * Test foreign key integrity
   */
  private async testForeignKeyIntegrity(): Promise<AuditResult[]> {
    const results: AuditResult[] = []

    try {
      // Test games -> teams foreign keys
      const fkQuery = `
        SELECT 
          COUNT(*) as total_games,
          COUNT(CASE WHEN ht.id IS NULL THEN 1 END) as broken_home_fk,
          COUNT(CASE WHEN at.id IS NULL THEN 1 END) as broken_away_fk
        FROM games g
        LEFT JOIN teams ht ON g.home_team_id = ht.id
        LEFT JOIN teams at ON g.away_team_id = at.id
      `
      const fkResult = await this.dbService.executeSQL(fkQuery)
      const fkData = fkResult[0]

      if (fkData.broken_home_fk > 0 || fkData.broken_away_fk > 0) {
        results.push({
          testName: 'Foreign Key Integrity',
          status: 'FAIL',
          message: `${fkData.broken_home_fk} broken home team FKs, ${fkData.broken_away_fk} broken away team FKs`,
          details: { broken_home_fk: fkData.broken_home_fk, broken_away_fk: fkData.broken_away_fk }
        })
      } else {
        results.push({
          testName: 'Foreign Key Integrity',
          status: 'PASS',
          message: 'All foreign key relationships are intact'
        })
      }

      // Test odds -> games foreign keys
      const oddsFkQuery = `
        SELECT 
          COUNT(*) as total_odds,
          COUNT(CASE WHEN g.id IS NULL THEN 1 END) as broken_game_fk
        FROM odds o
        LEFT JOIN games g ON o.game_id = g.id
      `
      const oddsFkResult = await this.dbService.executeSQL(oddsFkQuery)
      const oddsFkData = oddsFkResult[0]

      if (oddsFkData.broken_game_fk > 0) {
        results.push({
          testName: 'Odds Foreign Key Integrity',
          status: 'FAIL',
          message: `${oddsFkData.broken_game_fk} odds records have broken game references`,
          details: { broken_game_fk: oddsFkData.broken_game_fk }
        })
      } else {
        results.push({
          testName: 'Odds Foreign Key Integrity',
          status: 'PASS',
          message: 'All odds have valid game references'
        })
      }

    } catch (error) {
      results.push({
        testName: 'Foreign Key Integrity Test',
        status: 'FAIL',
        message: `Error testing foreign key integrity: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      })
    }

    return results
  }

  /**
   * Test data freshness and update patterns
   */
  private async testDataFreshness(): Promise<AuditResult[]> {
    const results: AuditResult[] = []

    try {
      // Check when data was last updated
      const freshnessQuery = `
        SELECT 
          'teams' as table_name,
          MIN(created_at) as earliest_record,
          MAX(updated_at) as latest_update,
          COUNT(CASE WHEN updated_at > NOW() - INTERVAL '1 hour' THEN 1 END) as updated_last_hour,
          COUNT(CASE WHEN updated_at > NOW() - INTERVAL '24 hours' THEN 1 END) as updated_last_day
        FROM teams
        UNION ALL
        SELECT 
          'games' as table_name,
          MIN(created_at) as earliest_record,
          MAX(updated_at) as latest_update,
          COUNT(CASE WHEN updated_at > NOW() - INTERVAL '1 hour' THEN 1 END) as updated_last_hour,
          COUNT(CASE WHEN updated_at > NOW() - INTERVAL '24 hours' THEN 1 END) as updated_last_day
        FROM games
        UNION ALL
        SELECT 
          'odds' as table_name,
          MIN(created_at) as earliest_record,
          MAX(created_at) as latest_update,
          COUNT(CASE WHEN created_at > NOW() - INTERVAL '1 hour' THEN 1 END) as updated_last_hour,
          COUNT(CASE WHEN created_at > NOW() - INTERVAL '24 hours' THEN 1 END) as updated_last_day
        FROM odds
      `
      const freshnessResult = await this.dbService.executeSQL(freshnessQuery)

      for (const table of freshnessResult) {
        const lastUpdate = new Date(table.latest_update)
        const hoursSinceUpdate = (Date.now() - lastUpdate.getTime()) / (1000 * 60 * 60)

        if (hoursSinceUpdate > 24) {
          results.push({
            testName: `${table.table_name} Data Freshness`,
            status: 'WARNING',
            message: `${table.table_name} data is ${Math.round(hoursSinceUpdate)} hours old`,
            details: { 
              lastUpdate: table.latest_update, 
              hoursSinceUpdate: Math.round(hoursSinceUpdate),
              updatedLastHour: table.updated_last_hour,
              updatedLastDay: table.updated_last_day
            }
          })
        } else {
          results.push({
            testName: `${table.table_name} Data Freshness`,
            status: 'PASS',
            message: `${table.table_name} data is fresh (${Math.round(hoursSinceUpdate)} hours old)`,
            details: { 
              lastUpdate: table.latest_update, 
              hoursSinceUpdate: Math.round(hoursSinceUpdate)
            }
          })
        }
      }

    } catch (error) {
      results.push({
        testName: 'Data Freshness Test',
        status: 'FAIL',
        message: `Error testing data freshness: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      })
    }

    return results
  }

  /**
   * Test for duplicate data
   */
  private async testDuplicateData(): Promise<AuditResult[]> {
    const results: AuditResult[] = []

    try {
      // Check for duplicate teams
      const duplicateTeamsQuery = `
        SELECT name, sport, league, COUNT(*) as duplicate_count
        FROM teams 
        GROUP BY name, sport, league 
        HAVING COUNT(*) > 1
        ORDER BY duplicate_count DESC
      `
      const duplicateTeams = await this.dbService.executeSQL(duplicateTeamsQuery)

      if (duplicateTeams.length > 0) {
        results.push({
          testName: 'Duplicate Teams',
          status: 'FAIL',
          message: `Found ${duplicateTeams.length} duplicate team entries`,
          details: { duplicates: duplicateTeams }
        })
      } else {
        results.push({
          testName: 'Duplicate Teams',
          status: 'PASS',
          message: 'No duplicate teams found'
        })
      }

      // Check for duplicate games
      const duplicateGamesQuery = `
        SELECT home_team_id, away_team_id, game_date, COUNT(*) as duplicate_count
        FROM games 
        GROUP BY home_team_id, away_team_id, game_date 
        HAVING COUNT(*) > 1
        ORDER BY duplicate_count DESC
        LIMIT 10
      `
      const duplicateGames = await this.dbService.executeSQL(duplicateGamesQuery)

      if (duplicateGames.length > 0) {
        results.push({
          testName: 'Duplicate Games',
          status: 'FAIL',
          message: `Found ${duplicateGames.length} duplicate game entries`,
          details: { duplicates: duplicateGames }
        })
      } else {
        results.push({
          testName: 'Duplicate Games',
          status: 'PASS',
          message: 'No duplicate games found'
        })
      }

    } catch (error) {
      results.push({
        testName: 'Duplicate Data Test',
        status: 'FAIL',
        message: `Error testing for duplicates: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      })
    }

    return results
  }

  /**
   * Test database performance
   */
  private async testPerformance(): Promise<AuditResult[]> {
    const results: AuditResult[] = []

    try {
      // Test query performance for common operations
      const startTime = Date.now()
      
      // Test teams query performance
      const teamsQuery = `
        SELECT t.*, 
               COUNT(g.id) as game_count
        FROM teams t
        LEFT JOIN games g ON (g.home_team_id = t.id OR g.away_team_id = t.id)
        WHERE t.sport = 'basketball'
        GROUP BY t.id
        ORDER BY game_count DESC
        LIMIT 20
      `
      await this.dbService.executeSQL(teamsQuery)
      const teamsQueryTime = Date.now() - startTime

      if (teamsQueryTime > 5000) {
        results.push({
          testName: 'Teams Query Performance',
          status: 'WARNING',
          message: `Teams query took ${teamsQueryTime}ms (slow)`,
          details: { queryTime: teamsQueryTime }
        })
      } else {
        results.push({
          testName: 'Teams Query Performance',
          status: 'PASS',
          message: `Teams query completed in ${teamsQueryTime}ms`,
          details: { queryTime: teamsQueryTime }
        })
      }

      // Test games query performance
      const gamesStartTime = Date.now()
      const gamesQuery = `
        SELECT g.*, 
               ht.name as home_team_name,
               at.name as away_team_name
        FROM games g
        JOIN teams ht ON g.home_team_id = ht.id
        JOIN teams at ON g.away_team_id = at.id
        WHERE g.sport = 'basketball'
        ORDER BY g.game_date DESC
        LIMIT 50
      `
      await this.dbService.executeSQL(gamesQuery)
      const gamesQueryTime = Date.now() - gamesStartTime

      if (gamesQueryTime > 3000) {
        results.push({
          testName: 'Games Query Performance',
          status: 'WARNING',
          message: `Games query took ${gamesQueryTime}ms (slow)`,
          details: { queryTime: gamesQueryTime }
        })
      } else {
        results.push({
          testName: 'Games Query Performance',
          status: 'PASS',
          message: `Games query completed in ${gamesQueryTime}ms`,
          details: { queryTime: gamesQueryTime }
        })
      }

    } catch (error) {
      results.push({
        testName: 'Performance Test',
        status: 'FAIL',
        message: `Error testing performance: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      })
    }

    return results
  }

  /**
   * Test API data flow
   */
  private async testAPIDataFlow(): Promise<AuditResult[]> {
    const results: AuditResult[] = []

    try {
      // Test if we can fetch data from external APIs
      const { apiFallbackStrategy } = await import('./api-fallback-strategy')
      
      const testResult = await apiFallbackStrategy.executeWithFallback({
        sport: 'basketball',
        dataType: 'games',
        params: { date: new Date().toISOString().split('T')[0] },
        priority: 'low'
      })

      if (testResult.success && testResult.data && Array.isArray(testResult.data) && testResult.data.length > 0) {
        results.push({
          testName: 'API Data Flow',
          status: 'PASS',
          message: `Successfully fetched ${testResult.data.length} games from external API`,
          details: { 
            provider: testResult.provider,
            responseTime: testResult.responseTime,
            dataCount: testResult.data.length
          }
        })
      } else {
        results.push({
          testName: 'API Data Flow',
          status: 'FAIL',
          message: 'Failed to fetch data from external APIs',
          details: { 
            success: testResult.success,
            error: testResult.error,
            dataCount: Array.isArray(testResult.data) ? testResult.data.length : 0
          }
        })
      }

    } catch (error) {
      results.push({
        testName: 'API Data Flow Test',
        status: 'FAIL',
        message: `Error testing API data flow: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      })
    }

    return results
  }

  /**
   * Test real-time updates
   */
  private async testRealTimeUpdates(): Promise<AuditResult[]> {
    const results: AuditResult[] = []

    try {
      // Check if we have recent live games
      const liveGamesQuery = `
        SELECT COUNT(*) as live_count
        FROM games 
        WHERE status = 'live' 
        AND game_date BETWEEN NOW() - INTERVAL '2 hours' AND NOW() + INTERVAL '2 hours'
      `
      const liveGamesResult = await this.dbService.executeSQL(liveGamesQuery)
      const liveCount = liveGamesResult[0].live_count

      if (liveCount > 0) {
        results.push({
          testName: 'Live Games Detection',
          status: 'PASS',
          message: `Found ${liveCount} live games`,
          details: { liveCount }
        })
      } else {
        results.push({
          testName: 'Live Games Detection',
          status: 'WARNING',
          message: 'No live games currently detected',
          details: { liveCount }
        })
      }

      // Check if we have recent updates
      const recentUpdatesQuery = `
        SELECT COUNT(*) as recent_updates
        FROM games 
        WHERE updated_at > NOW() - INTERVAL '1 hour'
      `
      const recentUpdatesResult = await this.dbService.executeSQL(recentUpdatesQuery)
      const recentUpdates = recentUpdatesResult[0].recent_updates

      if (recentUpdates > 0) {
        results.push({
          testName: 'Recent Updates',
          status: 'PASS',
          message: `${recentUpdates} games updated in the last hour`,
          details: { recentUpdates }
        })
      } else {
        results.push({
          testName: 'Recent Updates',
          status: 'WARNING',
          message: 'No games updated in the last hour',
          details: { recentUpdates }
        })
      }

    } catch (error) {
      results.push({
        testName: 'Real-time Updates Test',
        status: 'FAIL',
        message: `Error testing real-time updates: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      })
    }

    return results
  }

  /**
   * Test error handling
   */
  private async testErrorHandling(): Promise<AuditResult[]> {
    const results: AuditResult[] = []

    try {
      // Test invalid query handling
      try {
        await this.dbService.executeSQL('SELECT * FROM non_existent_table')
        results.push({
          testName: 'Error Handling',
          status: 'FAIL',
          message: 'Database should have thrown an error for invalid table'
        })
      } catch (error) {
        results.push({
          testName: 'Error Handling',
          status: 'PASS',
          message: 'Database properly handles invalid queries',
          details: { errorType: error instanceof Error ? error.constructor.name : 'Unknown' }
        })
      }

      // Test malformed query handling
      try {
        await this.dbService.executeSQL('SELECT * FROM teams WHERE invalid_column = ?', ['test'])
        results.push({
          testName: 'Malformed Query Handling',
          status: 'FAIL',
          message: 'Database should have thrown an error for invalid column'
        })
      } catch (error) {
        results.push({
          testName: 'Malformed Query Handling',
          status: 'PASS',
          message: 'Database properly handles malformed queries',
          details: { errorType: error instanceof Error ? error.constructor.name : 'Unknown' }
        })
      }

    } catch (error) {
      results.push({
        testName: 'Error Handling Test',
        status: 'FAIL',
        message: `Error testing error handling: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      })
    }

    return results
  }

  /**
   * Generate recommendations based on audit results
   */
  private generateRecommendations(results: AuditResult[]): string[] {
    const recommendations: string[] = []

    const failedTests = results.filter(r => r.status === 'FAIL')
    const warningTests = results.filter(r => r.status === 'WARNING')

    // Check for duplicate data issues
    const duplicateIssues = results.filter(r => r.testName.includes('Duplicate'))
    if (duplicateIssues.some(r => r.status === 'FAIL')) {
      recommendations.push('CRITICAL: Remove duplicate data entries to prevent data inconsistency')
      recommendations.push('Implement unique constraints to prevent future duplicates')
    }

    // Check for foreign key issues
    const fkIssues = results.filter(r => r.testName.includes('Foreign Key'))
    if (fkIssues.some(r => r.status === 'FAIL')) {
      recommendations.push('CRITICAL: Fix broken foreign key relationships')
      recommendations.push('Implement data validation before inserting records')
    }

    // Check for data freshness issues
    const freshnessIssues = results.filter(r => r.testName.includes('Freshness'))
    if (freshnessIssues.some(r => r.status === 'WARNING')) {
      recommendations.push('Set up automated data refresh schedules')
      recommendations.push('Implement real-time data synchronization')
    }

    // Check for performance issues
    const performanceIssues = results.filter(r => r.testName.includes('Performance'))
    if (performanceIssues.some(r => r.status === 'WARNING')) {
      recommendations.push('Optimize database queries and add indexes')
      recommendations.push('Consider implementing query caching')
    }

    // Check for API issues
    const apiIssues = results.filter(r => r.testName.includes('API'))
    if (apiIssues.some(r => r.status === 'FAIL')) {
      recommendations.push('Check API credentials and rate limits')
      recommendations.push('Implement API fallback strategies')
    }

    if (recommendations.length === 0) {
      recommendations.push('Database is in good health - continue monitoring')
    }

    return recommendations
  }

  /**
   * Fix identified issues
   */
  async fixIssues(auditReport: DatabaseAuditReport): Promise<{ fixed: number; errors: string[] }> {
    let fixed = 0
    const errors: string[] = []

    try {
      // Fix duplicate teams
      const duplicateTeams = auditReport.results.find(r => r.testName === 'Duplicate Teams' && r.status === 'FAIL')
      if (duplicateTeams && duplicateTeams.details?.duplicates) {
        try {
          await this.fixDuplicateTeams(duplicateTeams.details.duplicates)
          fixed++
        } catch (error) {
          errors.push(`Failed to fix duplicate teams: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
      }

      // Fix duplicate games
      const duplicateGames = auditReport.results.find(r => r.testName === 'Duplicate Games' && r.status === 'FAIL')
      if (duplicateGames && duplicateGames.details?.duplicates) {
        try {
          await this.fixDuplicateGames(duplicateGames.details.duplicates)
          fixed++
        } catch (error) {
          errors.push(`Failed to fix duplicate games: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
      }

    } catch (error) {
      errors.push(`Error fixing issues: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }

    return { fixed, errors }
  }

  /**
   * Fix duplicate teams by keeping the most recent one
   */
  private async fixDuplicateTeams(duplicates: any[]): Promise<void> {
    for (const duplicate of duplicates) {
      const deleteQuery = `
        DELETE FROM teams 
        WHERE name = $1 AND sport = $2 AND league = $3
        AND id NOT IN (
          SELECT id FROM teams 
          WHERE name = $1 AND sport = $2 AND league = $3
          ORDER BY updated_at DESC, created_at DESC
          LIMIT 1
        )
      `
      await this.dbService.executeSQL(deleteQuery, [duplicate.name, duplicate.sport, duplicate.league])
    }
  }

  /**
   * Fix duplicate games by keeping the most recent one
   */
  private async fixDuplicateGames(duplicates: any[]): Promise<void> {
    for (const duplicate of duplicates) {
      const deleteQuery = `
        DELETE FROM games 
        WHERE home_team_id = $1 AND away_team_id = $2 AND game_date = $3
        AND id NOT IN (
          SELECT id FROM games 
          WHERE home_team_id = $1 AND away_team_id = $2 AND game_date = $3
          ORDER BY updated_at DESC, created_at DESC
          LIMIT 1
        )
      `
      await this.dbService.executeSQL(deleteQuery, [duplicate.home_team_id, duplicate.away_team_id, duplicate.game_date])
    }
  }
}

// Export singleton instance
export const databaseAuditService = new DatabaseAuditService()
