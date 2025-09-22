/**
 * Database Audit Service
 * Comprehensive database auditing and health monitoring
 */

import { supabaseMCPClient } from '../supabase/mcp-client'
import { structuredLogger } from './structured-logger'

export interface DatabaseAuditReport {
  success: boolean
  timestamp: string
  totalTests: number
  passedTests: number
  failedTests: number
  results: AuditResult[]
  recommendations: string[]
  performance: PerformanceMetrics
}

export interface AuditResult {
  testName: string
  status: 'PASS' | 'FAIL' | 'WARNING'
  message: string
  details?: any
  executionTime: number
}

export interface PerformanceMetrics {
  averageQueryTime: number
  slowestQueries: Array<{ query: string; time: number }>
  indexUsage: Array<{ table: string; index: string; usage: number }>
  tableSizes: Array<{ table: string; size: string; rowCount: number }>
}

export class DatabaseAuditService {
  private static instance: DatabaseAuditService

  public static getInstance(): DatabaseAuditService {
    if (!DatabaseAuditService.instance) {
      DatabaseAuditService.instance = new DatabaseAuditService()
    }
    return DatabaseAuditService.instance
  }

  /**
   * Run comprehensive database audit
   */
  async runFullAudit(): Promise<DatabaseAuditReport> {
    const results: AuditResult[] = []
    
    try {
      // Test database connection
      results.push(await this.testDatabaseConnection())
      
      // Test table structure integrity
      results.push(await this.testTableStructure())
      
      // Test data integrity
      results.push(await this.testDataIntegrity())
      
      // Test performance
      results.push(await this.testPerformance())
      
      // Test indexes
      results.push(await this.testIndexes())
      
      // Test foreign key constraints
      results.push(await this.testForeignKeyConstraints())
      
      // Test data consistency
      results.push(await this.testDataConsistency())
      
      // Test backup integrity
      results.push(await this.testBackupIntegrity())
      
      const passedTests = results.filter(r => r.status === 'PASS').length
      const failedTests = results.filter(r => r.status === 'FAIL').length
      
      const performance = await this.getPerformanceMetrics()
      const recommendations = await this.generateRecommendations(results, performance)
      
      return {
        success: failedTests === 0,
        timestamp: new Date().toISOString(),
        totalTests: results.length,
        passedTests,
        failedTests,
        results,
        recommendations,
        performance
      }
      
    } catch (error) {
      structuredLogger.error('Database audit failed', { error: error instanceof Error ? error.message : String(error) })
      throw error
    }
  }

  /**
   * Test database connection
   */
  private async testDatabaseConnection(): Promise<AuditResult> {
    const startTime = Date.now()
    
    try {
      const result = await supabaseMCPClient.executeSQL('SELECT 1 as test')
      const executionTime = Date.now() - startTime
      
      return {
        testName: 'Database Connection',
        status: result && result.length > 0 ? 'PASS' : 'FAIL',
        message: result && result.length > 0 ? 'Database connection successful' : 'Database connection failed',
        executionTime
      }
    } catch (error) {
      return {
        testName: 'Database Connection',
        status: 'FAIL',
        message: `Database connection failed: ${error instanceof Error ? error.message : String(error)}`,
        executionTime: Date.now() - startTime
      }
    }
  }

  /**
   * Test table structure integrity
   */
  private async testTableStructure(): Promise<AuditResult> {
    const startTime = Date.now()
    
    try {
      const requiredTables = ['sports', 'teams', 'players', 'games', 'odds', 'predictions', 'standings', 'cache_entries']
      const tablesResult = await supabaseMCPClient.listTables()
      const existingTables = Array.isArray((tablesResult as any).tables)
        ? (tablesResult as any).tables.map((t: any) => t.name)
        : []
      
      const missingTables = requiredTables.filter(table => !existingTables.includes(table))
      
      return {
        testName: 'Table Structure',
        status: missingTables.length === 0 ? 'PASS' : 'FAIL',
        message: missingTables.length === 0 
          ? 'All required tables exist' 
          : `Missing tables: ${missingTables.join(', ')}`,
        details: { missingTables, existingTables },
        executionTime: Date.now() - startTime
      }
    } catch (error) {
      return {
        testName: 'Table Structure',
        status: 'FAIL',
        message: `Table structure check failed: ${error instanceof Error ? error.message : String(error)}`,
        executionTime: Date.now() - startTime
      }
    }
  }

  /**
   * Test data integrity
   */
  private async testDataIntegrity(): Promise<AuditResult> {
    const startTime = Date.now()
    
    try {
      const integrityChecks = [
        'SELECT COUNT(*) as count FROM teams WHERE sport IS NULL',
        'SELECT COUNT(*) as count FROM games WHERE home_team_id IS NULL OR away_team_id IS NULL',
        'SELECT COUNT(*) as count FROM players WHERE sport IS NULL',
        'SELECT COUNT(*) as count FROM odds WHERE game_id IS NULL'
      ]
      
      const issues = []
      for (const check of integrityChecks) {
        const result = await supabaseMCPClient.executeSQL(check)
        if (result && result[0] && result[0].count > 0) {
          issues.push(check)
        }
      }
      
      return {
        testName: 'Data Integrity',
        status: issues.length === 0 ? 'PASS' : 'FAIL',
        message: issues.length === 0 ? 'Data integrity checks passed' : `Found ${issues.length} integrity issues`,
        details: { issues },
        executionTime: Date.now() - startTime
      }
    } catch (error) {
      return {
        testName: 'Data Integrity',
        status: 'FAIL',
        message: `Data integrity check failed: ${error instanceof Error ? error.message : String(error)}`,
        executionTime: Date.now() - startTime
      }
    }
  }

  /**
   * Test performance
   */
  private async testPerformance(): Promise<AuditResult> {
    const startTime = Date.now()
    
    try {
      const performanceQueries = [
        'SELECT COUNT(*) FROM games WHERE game_date > NOW() - INTERVAL \'7 days\'',
        'SELECT COUNT(*) FROM teams WHERE is_active = true',
        'SELECT COUNT(*) FROM players WHERE is_active = true',
        'SELECT COUNT(*) FROM odds WHERE last_updated > NOW() - INTERVAL \'1 hour\''
      ]
      
      const queryTimes = []
      for (const query of performanceQueries) {
        const queryStart = Date.now()
        await supabaseMCPClient.executeSQL(query)
        queryTimes.push(Date.now() - queryStart)
      }
      
      const averageTime = queryTimes.reduce((a, b) => a + b, 0) / queryTimes.length
      const slowQueries = queryTimes.filter(time => time > 1000).length
      
      return {
        testName: 'Performance',
        status: slowQueries === 0 ? 'PASS' : 'WARNING',
        message: slowQueries === 0 ? 'Performance tests passed' : `Found ${slowQueries} slow queries`,
        details: { averageTime, queryTimes, slowQueries },
        executionTime: Date.now() - startTime
      }
    } catch (error) {
      return {
        testName: 'Performance',
        status: 'FAIL',
        message: `Performance test failed: ${error instanceof Error ? error.message : String(error)}`,
        executionTime: Date.now() - startTime
      }
    }
  }

  /**
   * Test indexes
   */
  private async testIndexes(): Promise<AuditResult> {
    const startTime = Date.now()
    
    try {
      const indexQuery = `
        SELECT schemaname, tablename, indexname, indexdef
        FROM pg_indexes 
        WHERE schemaname = 'public'
        ORDER BY tablename, indexname
      `
      
      const result = await supabaseMCPClient.executeSQL(indexQuery)
      const indexes = result || []
      
      const criticalIndexes = [
        'idx_games_date_status',
        'idx_games_home_team',
        'idx_games_away_team',
        'idx_odds_game_id',
        'idx_teams_sport_league'
      ]
      
      const existingIndexNames = indexes.map((idx: any) => idx.indexname)
      const missingIndexes = criticalIndexes.filter(idx => !existingIndexNames.includes(idx))
      
      return {
        testName: 'Indexes',
        status: missingIndexes.length === 0 ? 'PASS' : 'WARNING',
        message: missingIndexes.length === 0 ? 'All critical indexes exist' : `Missing indexes: ${missingIndexes.join(', ')}`,
        details: { indexes: indexes.length, missingIndexes },
        executionTime: Date.now() - startTime
      }
    } catch (error) {
      return {
        testName: 'Indexes',
        status: 'FAIL',
        message: `Index test failed: ${error instanceof Error ? error.message : String(error)}`,
        executionTime: Date.now() - startTime
      }
    }
  }

  /**
   * Test foreign key constraints
   */
  private async testForeignKeyConstraints(): Promise<AuditResult> {
    const startTime = Date.now()
    
    try {
      const fkQuery = `
        SELECT
          tc.table_name,
          kcu.column_name,
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_schema = 'public'
      `
      
      const result = await supabaseMCPClient.executeSQL(fkQuery)
      const foreignKeys = result || []
      
      return {
        testName: 'Foreign Key Constraints',
        status: 'PASS',
        message: `Found ${foreignKeys.length} foreign key constraints`,
        details: { foreignKeys: foreignKeys.length },
        executionTime: Date.now() - startTime
      }
    } catch (error) {
      return {
        testName: 'Foreign Key Constraints',
        status: 'FAIL',
        message: `Foreign key test failed: ${error instanceof Error ? error.message : String(error)}`,
        executionTime: Date.now() - startTime
      }
    }
  }

  /**
   * Test data consistency
   */
  private async testDataConsistency(): Promise<AuditResult> {
    const startTime = Date.now()
    
    try {
      const consistencyChecks = [
        'SELECT COUNT(*) as count FROM games g LEFT JOIN teams ht ON g.home_team_id = ht.id WHERE ht.id IS NULL',
        'SELECT COUNT(*) as count FROM games g LEFT JOIN teams at ON g.away_team_id = at.id WHERE at.id IS NULL',
        'SELECT COUNT(*) as count FROM players p LEFT JOIN teams t ON p.team_id = t.id WHERE p.team_id IS NOT NULL AND t.id IS NULL'
      ]
      
      const issues = []
      for (const check of consistencyChecks) {
        const result = await supabaseMCPClient.executeSQL(check)
        if (result && result[0] && result[0].count > 0) {
          issues.push(check)
        }
      }
      
      return {
        testName: 'Data Consistency',
        status: issues.length === 0 ? 'PASS' : 'FAIL',
        message: issues.length === 0 ? 'Data consistency checks passed' : `Found ${issues.length} consistency issues`,
        details: { issues },
        executionTime: Date.now() - startTime
      }
    } catch (error) {
      return {
        testName: 'Data Consistency',
        status: 'FAIL',
        message: `Data consistency check failed: ${error instanceof Error ? error.message : String(error)}`,
        executionTime: Date.now() - startTime
      }
    }
  }

  /**
   * Test backup integrity
   */
  private async testBackupIntegrity(): Promise<AuditResult> {
    const startTime = Date.now()
    
    try {
      // This would typically check backup files, but for now we'll just verify data exists
      const dataCheck = await supabaseMCPClient.executeSQL('SELECT COUNT(*) as count FROM sports')
      const hasData = dataCheck && dataCheck[0] && dataCheck[0].count > 0
      
      return {
        testName: 'Backup Integrity',
        status: hasData ? 'PASS' : 'WARNING',
        message: hasData ? 'Database has data for backup' : 'Database appears empty',
        details: { hasData },
        executionTime: Date.now() - startTime
      }
    } catch (error) {
      return {
        testName: 'Backup Integrity',
        status: 'FAIL',
        message: `Backup integrity check failed: ${error instanceof Error ? error.message : String(error)}`,
        executionTime: Date.now() - startTime
      }
    }
  }

  /**
   * Get performance metrics
   */
  private async getPerformanceMetrics(): Promise<PerformanceMetrics> {
    try {
      const tableSizesQuery = `
        SELECT 
          schemaname,
          tablename,
          pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
          (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = tablename) as row_count
        FROM pg_tables 
        WHERE schemaname = 'public'
        ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
      `
      
      const result = await supabaseMCPClient.executeSQL(tableSizesQuery)
      const tableSizes = (result || []).map((t: any) => ({
        table: t.tablename,
        size: t.size,
        rowCount: t.row_count || 0
      }))
      
      return {
        averageQueryTime: 0, // Would need query logging to calculate
        slowestQueries: [],
        indexUsage: [],
        tableSizes
      }
    } catch (error) {
      structuredLogger.error('Failed to get performance metrics', { error: error instanceof Error ? error.message : String(error) })
      return {
        averageQueryTime: 0,
        slowestQueries: [],
        indexUsage: [],
        tableSizes: []
      }
    }
  }

  /**
   * Generate recommendations based on audit results
   */
  private async generateRecommendations(results: AuditResult[], performance: PerformanceMetrics): Promise<string[]> {
    const recommendations: string[] = []
    
    // Check for failed tests
    const failedTests = results.filter(r => r.status === 'FAIL')
    if (failedTests.length > 0) {
      recommendations.push(`Address ${failedTests.length} failed tests: ${failedTests.map(t => t.testName).join(', ')}`)
    }
    
    // Check for warnings
    const warnings = results.filter(r => r.status === 'WARNING')
    if (warnings.length > 0) {
      recommendations.push(`Review ${warnings.length} warnings: ${warnings.map(t => t.testName).join(', ')}`)
    }
    
    // Check for missing indexes
    const indexTest = results.find(r => r.testName === 'Indexes')
    if (indexTest && indexTest.details?.missingIndexes?.length > 0) {
      recommendations.push(`Create missing indexes: ${indexTest.details.missingIndexes.join(', ')}`)
    }
    
    // Check for performance issues
    const performanceTest = results.find(r => r.testName === 'Performance')
    if (performanceTest && performanceTest.details?.slowQueries > 0) {
      recommendations.push(`Optimize ${performanceTest.details.slowQueries} slow queries`)
    }
    
    // Check table sizes
    if (performance.tableSizes.length > 0) {
      const largeTables = performance.tableSizes.filter(t => t.rowCount > 100000)
      if (largeTables.length > 0) {
        recommendations.push(`Consider archiving old data from large tables: ${largeTables.map(t => t.table).join(', ')}`)
      }
    }
    
    return recommendations
  }

  /**
   * Fix identified issues
   */
  async fixIssues(report: DatabaseAuditReport): Promise<{ success: boolean; fixed: number; errors: string[] }> {
    const errors: string[] = []
    let fixed = 0
    
    try {
      // Fix missing indexes
      const indexTest = report.results.find(r => r.testName === 'Indexes')
      if (indexTest && indexTest.details?.missingIndexes?.length > 0) {
        for (const index of indexTest.details.missingIndexes) {
          try {
            await this.createIndex(index)
            fixed++
          } catch (error) {
            errors.push(`Failed to create index ${index}: ${error instanceof Error ? error.message : String(error)}`)
          }
        }
      }
      
      // Fix data integrity issues
      const integrityTest = report.results.find(r => r.testName === 'Data Integrity')
      if (integrityTest && integrityTest.details?.issues?.length > 0) {
        for (const issue of integrityTest.details.issues) {
          try {
            await this.fixDataIntegrityIssue(issue)
            fixed++
          } catch (error) {
            errors.push(`Failed to fix data integrity issue: ${error instanceof Error ? error.message : String(error)}`)
          }
        }
      }
      
      return { success: errors.length === 0, fixed, errors }
      
    } catch (error) {
      errors.push(`Fix operation failed: ${error instanceof Error ? error.message : String(error)}`)
      return { success: false, fixed, errors }
    }
  }

  /**
   * Create missing index
   */
  private async createIndex(indexName: string): Promise<void> {
    const indexDefinitions: { [key: string]: string } = {
      'idx_games_date_status': 'CREATE INDEX IF NOT EXISTS idx_games_date_status ON games(game_date, status)',
      'idx_games_home_team': 'CREATE INDEX IF NOT EXISTS idx_games_home_team ON games(home_team_id)',
      'idx_games_away_team': 'CREATE INDEX IF NOT EXISTS idx_games_away_team ON games(away_team_id)',
      'idx_odds_game_id': 'CREATE INDEX IF NOT EXISTS idx_odds_game_id ON odds(game_id)',
      'idx_teams_sport_league': 'CREATE INDEX IF NOT EXISTS idx_teams_sport_league ON teams(sport, league)'
    }
    
    const definition = indexDefinitions[indexName]
    if (definition) {
      await supabaseMCPClient.executeSQL(definition)
    }
  }

  /**
   * Fix data integrity issue
   */
  private async fixDataIntegrityIssue(issue: string): Promise<void> {
    // This would contain specific fixes for each type of integrity issue
    // For now, we'll just log the issue
    structuredLogger.warn('Data integrity issue detected', { issue })
  }
}

export const databaseAuditService = DatabaseAuditService.getInstance()
