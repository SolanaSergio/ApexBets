import { NextRequest, NextResponse } from 'next/server'
import { databaseAuditService } from '@/lib/services/database-audit-service'
import { databaseCleanupService } from '@/lib/services/database-cleanup-service'
import { enhancedApiClient } from '@/lib/services/enhanced-api-client'
// Removed automatedMonitoringService import - service was deleted
import { dataIntegrityService } from '@/lib/services/data-integrity-service'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action') || 'audit'
    const fixIssues = searchParams.get('fix') === 'true'

    console.log(`🔍 Running database ${action}...`)

    if (action === 'audit') {
      // Run comprehensive database audit
      const auditReport = await databaseAuditService.runFullAudit()
      
      let fixResult = null
      if (fixIssues && auditReport.failedTests > 0) {
        console.log('🔧 Fixing identified issues...')
        fixResult = await databaseAuditService.fixIssues(auditReport)
      }

      return NextResponse.json({
        success: true,
        action: 'audit',
        report: auditReport,
        fixResult,
        timestamp: new Date().toISOString()
      })

    } else if (action === 'cleanup') {
      // Run database cleanup
      const cleanupReport = await databaseCleanupService.runFullCleanup()
      
      return NextResponse.json({
        success: true,
        action: 'cleanup',
        report: cleanupReport,
        timestamp: new Date().toISOString()
      })

    } else if (action === 'recommendations') {
      // Get cleanup recommendations
      const recommendations = await databaseCleanupService.getCleanupRecommendations()
      
      return NextResponse.json({
        success: true,
        action: 'recommendations',
        recommendations,
        timestamp: new Date().toISOString()
      })

    } else if (action === 'integrity') {
      // Run data integrity check
      const integrityResults = await dataIntegrityService.runIntegrityCheck()
      
      return NextResponse.json({
        success: true,
        action: 'integrity',
        results: integrityResults,
        timestamp: new Date().toISOString()
      })

    } else if (action === 'monitoring') {
      // Get monitoring metrics and alerts
      // Monitoring service removed - using Supabase Edge Functions
      const metrics: any[] = []
      const alerts: any[] = []
      const status = { running: false, totalAlerts: 0, activeAlerts: 0 }
      
      return NextResponse.json({
        success: true,
        action: 'monitoring',
        metrics,
        alerts,
        status,
        timestamp: new Date().toISOString()
      })

    } else if (action === 'health') {
      // Force health check
      const healthCheck = await enhancedApiClient.forceHealthCheck()
      
      return NextResponse.json({
        success: true,
        action: 'health',
        health: healthCheck,
        timestamp: new Date().toISOString()
      })

    } else if (action === 'cleanup-duplicates') {
      // Clean up duplicates using enhanced client
      const cleanupResults = await enhancedApiClient.cleanupDuplicates()
      
      return NextResponse.json({
        success: true,
        action: 'cleanup-duplicates',
        results: cleanupResults,
        timestamp: new Date().toISOString()
      })

    } else {
      return NextResponse.json({
        success: false,
        error: 'Invalid action. Use: audit, cleanup, recommendations, integrity, monitoring, health, or cleanup-duplicates'
      }, { status: 400 })
    }

  } catch (error) {
    console.error('❌ Database audit error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    let body = {}
    try {
      body = await request.json()
    } catch (jsonError) {
      // If no JSON body provided, use default values
      body = { action: 'audit', options: {} }
    }
    
    const { action = 'audit', options = {} } = body as { action?: string; options?: any }

    console.log(`🔧 Running database ${action} with options:`, options)

    if (action === 'audit') {
      const auditReport = await databaseAuditService.runFullAudit()
      
      let fixResult = null
      if (options.fixIssues && auditReport.failedTests > 0) {
        fixResult = await databaseAuditService.fixIssues(auditReport)
      }

      return NextResponse.json({
        success: true,
        action: 'audit',
        report: auditReport,
        fixResult,
        timestamp: new Date().toISOString()
      })

    } else if (action === 'cleanup') {
      const cleanupReport = await databaseCleanupService.runFullCleanup()
      
      return NextResponse.json({
        success: true,
        action: 'cleanup',
        report: cleanupReport,
        timestamp: new Date().toISOString()
      })

    } else if (action === 'test') {
      // Run specific tests
      const testResults = await runSpecificTests(options.tests || [])
      
      return NextResponse.json({
        success: true,
        action: 'test',
        results: testResults,
        timestamp: new Date().toISOString()
      })

    } else if (action === 'start-monitoring') {
      // Monitoring service removed - using Supabase Edge Functions
      console.log('ℹ️ Monitoring service removed - using Supabase Edge Functions')
      
      return NextResponse.json({
        success: true,
        action: 'start-monitoring',
        message: 'Monitoring service removed - using Supabase Edge Functions',
        timestamp: new Date().toISOString()
      })

    } else if (action === 'stop-monitoring') {
      // Monitoring service removed - using Supabase Edge Functions
      console.log('ℹ️ Monitoring service removed - using Supabase Edge Functions')
      
      return NextResponse.json({
        success: true,
        action: 'stop-monitoring',
        message: 'Monitoring service removed - using Supabase Edge Functions',
        timestamp: new Date().toISOString()
      })

    } else if (action === 'insert-team') {
      // Insert team with validation and retry
      const result = await enhancedApiClient.insertTeam(options.data)
      
      return NextResponse.json({
        success: result.success,
        action: 'insert-team',
        result,
        timestamp: new Date().toISOString()
      })

    } else if (action === 'insert-game') {
      // Insert game with validation and retry
      const result = await enhancedApiClient.insertGame(options.data)
      
      return NextResponse.json({
        success: result.success,
        action: 'insert-game',
        result,
        timestamp: new Date().toISOString()
      })

    } else if (action === 'insert-odds') {
      // Insert odds with validation and retry
      const result = await enhancedApiClient.insertOdds(options.data)
      
      return NextResponse.json({
        success: result.success,
        action: 'insert-odds',
        result,
        timestamp: new Date().toISOString()
      })

    } else if (action === 'batch-insert-teams') {
      // Batch insert teams
      const result = await enhancedApiClient.batchInsertTeams(options.data)
      
      return NextResponse.json({
        success: true,
        action: 'batch-insert-teams',
        result,
        timestamp: new Date().toISOString()
      })

    } else if (action === 'batch-insert-games') {
      // Batch insert games
      const result = await enhancedApiClient.batchInsertGames(options.data)
      
      return NextResponse.json({
        success: true,
        action: 'batch-insert-games',
        result,
        timestamp: new Date().toISOString()
      })

    } else if (action === 'batch-insert-odds') {
      // Batch insert odds
      const result = await enhancedApiClient.batchInsertOdds(options.data)
      
      return NextResponse.json({
        success: true,
        action: 'batch-insert-odds',
        result,
        timestamp: new Date().toISOString()
      })

    } else {
      return NextResponse.json({
        success: false,
        error: 'Invalid action. Use: audit, cleanup, test, start-monitoring, stop-monitoring, insert-team, insert-game, insert-odds, batch-insert-teams, batch-insert-games, or batch-insert-odds'
      }, { status: 400 })
    }

  } catch (error) {
    console.error('❌ Database operation error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

/**
 * Run specific database tests
 */
async function runSpecificTests(tests: string[]): Promise<any> {
  const results: any = {}

  const testPromises = tests.map(async (test) => {
    try {
      switch (test) {
        case 'data_integrity':
          results.dataIntegrity = await testDataIntegrity()
          break
        case 'foreign_keys':
          results.foreignKeys = await testForeignKeyIntegrity()
          break
        case 'performance':
          results.performance = await testPerformance()
          break
        case 'api_flow':
          results.apiFlow = await testAPIDataFlow()
          break
        case 'real_time':
          results.realTime = await testRealTimeUpdates()
          break
        default:
          results[test] = { error: 'Unknown test type' }
      }
    } catch (error) {
      results[test] = { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  });

  await Promise.all(testPromises);

  return results
}

async function testDataIntegrity(): Promise<any> {
  const { databaseService } = await import('@/lib/services/database-service')
  const dbService = databaseService

  const query = `
    SELECT 
      COUNT(*) as total_teams,
      COUNT(CASE WHEN name IS NULL OR name = '' THEN 1 END) as missing_names,
      COUNT(CASE WHEN sport IS NULL OR sport = '' THEN 1 END) as missing_sports
    FROM teams
  `
  const result = await dbService.executeSQL(query)
  return (result.data as any[])[0]
}

async function testForeignKeyIntegrity(): Promise<any> {
  const { databaseService } = await import('@/lib/services/database-service')
  const dbService = databaseService

  const query = `
    SELECT 
      COUNT(*) as total_games,
      COUNT(CASE WHEN ht.id IS NULL THEN 1 END) as broken_home_fk,
      COUNT(CASE WHEN at.id IS NULL THEN 1 END) as broken_away_fk
    FROM games g
    LEFT JOIN teams ht ON g.home_team_id = ht.id
    LEFT JOIN teams at ON g.away_team_id = at.id
  `
  const result = await dbService.executeSQL(query)
  return (result.data as any[])[0]
}

async function testPerformance(): Promise<any> {
  const { databaseService } = await import('@/lib/services/database-service')
  const dbService = databaseService

  const startTime = Date.now()
  
  await dbService.executeSQL(`
    SELECT t.*, COUNT(g.id) as game_count
    FROM teams t
    LEFT JOIN games g ON (g.home_team_id = t.id OR g.away_team_id = t.id)
    WHERE t.sport = 'basketball'
    GROUP BY t.id
    ORDER BY game_count DESC
    LIMIT 20
  `)
  
  const executionTime = Date.now() - startTime
  return { executionTime, status: executionTime < 5000 ? 'GOOD' : 'SLOW' }
}

async function testAPIDataFlow(): Promise<any> {
  try {
    const { apiFallbackStrategy } = await import('@/lib/services/api-fallback-strategy')
    
    const result = await apiFallbackStrategy.executeWithFallback({
      sport: 'basketball',
      dataType: 'games',
      params: { date: new Date().toISOString().split('T')[0] },
      priority: 'low'
    })
    
    return {
      success: result.success,
      dataCount: Array.isArray(result.data) ? result.data.length : 0,
      provider: result.provider,
      responseTime: result.responseTime
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

async function testRealTimeUpdates(): Promise<any> {
  const { databaseService } = await import('@/lib/services/database-service')
  const dbService = databaseService

  const liveQuery = `
    SELECT COUNT(*) as live_count
    FROM games 
    WHERE status = 'live' 
    AND game_date BETWEEN NOW() - INTERVAL '2 hours' AND NOW() + INTERVAL '2 hours'
  `
  const liveResult = await dbService.executeSQL(liveQuery)

  const recentQuery = `
    SELECT COUNT(*) as recent_count
    FROM games 
    WHERE updated_at > NOW() - INTERVAL '24 hours'
  `
  const recentResult = await dbService.executeSQL(recentQuery)

  return {
    liveGames: (liveResult.data as any[])[0]?.live_count,
    recentUpdates: (recentResult.data as any[])[0]?.recent_count
  }
}
