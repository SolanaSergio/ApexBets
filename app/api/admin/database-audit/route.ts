import { NextRequest, NextResponse } from 'next/server'
import { databaseAuditService } from '@/lib/services/database-audit-service'
import { databaseCleanupService } from '@/lib/services/database-cleanup-service'
import { enhancedApiClient } from '@/lib/services/enhanced-api-client'
import { dataIntegrityService } from '@/lib/services/data-integrity-service'
import { createClient } from '@supabase/supabase-js'

function getSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

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
        timestamp: new Date().toISOString(),
      })
    } else if (action === 'cleanup') {
      // Run database cleanup
      const cleanupReport = await databaseCleanupService.runFullCleanup()

      return NextResponse.json({
        success: true,
        action: 'cleanup',
        report: cleanupReport,
        timestamp: new Date().toISOString(),
      })
    } else if (action === 'recommendations') {
      // Get cleanup recommendations
      const recommendations = await databaseCleanupService.getCleanupRecommendations()

      return NextResponse.json({
        success: true,
        action: 'recommendations',
        recommendations,
        timestamp: new Date().toISOString(),
      })
    } else if (action === 'integrity') {
      // Run data integrity check
      const integrityResults = await dataIntegrityService.runIntegrityCheck()

      return NextResponse.json({
        success: true,
        action: 'integrity',
        results: integrityResults,
        timestamp: new Date().toISOString(),
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
        timestamp: new Date().toISOString(),
      })
    } else if (action === 'health') {
      // Force health check
      const healthCheck = await enhancedApiClient.forceHealthCheck()

      return NextResponse.json({
        success: true,
        action: 'health',
        health: healthCheck,
        timestamp: new Date().toISOString(),
      })
    } else if (action === 'cleanup-duplicates') {
      // Clean up duplicates using enhanced client
      const cleanupResults = await enhancedApiClient.cleanupDuplicates()

      return NextResponse.json({
        success: true,
        action: 'cleanup-duplicates',
        results: cleanupResults,
        timestamp: new Date().toISOString(),
      })
    } else {
      return NextResponse.json(
        {
          success: false,
          error:
            'Invalid action. Use: audit, cleanup, recommendations, integrity, monitoring, health, or cleanup-duplicates',
        },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('❌ Database audit error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
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
        timestamp: new Date().toISOString(),
      })
    } else if (action === 'cleanup') {
      const cleanupReport = await databaseCleanupService.runFullCleanup()

      return NextResponse.json({
        success: true,
        action: 'cleanup',
        report: cleanupReport,
        timestamp: new Date().toISOString(),
      })
    } else if (action === 'test') {
      // Run specific tests
      const testResults = await runSpecificTests(options.tests || [])

      return NextResponse.json({
        success: true,
        action: 'test',
        results: testResults,
        timestamp: new Date().toISOString(),
      })
    } else if (action === 'start-monitoring') {
      // Monitoring service removed - using Supabase Edge Functions
      console.log('ℹ️ Monitoring service removed - using Supabase Edge Functions')

      return NextResponse.json({
        success: true,
        action: 'start-monitoring',
        message: 'Monitoring service removed - using Supabase Edge Functions',
        timestamp: new Date().toISOString(),
      })
    } else if (action === 'stop-monitoring') {
      // Monitoring service removed - using Supabase Edge Functions
      console.log('ℹ️ Monitoring service removed - using Supabase Edge Functions')

      return NextResponse.json({
        success: true,
        action: 'stop-monitoring',
        message: 'Monitoring service removed - using Supabase Edge Functions',
        timestamp: new Date().toISOString(),
      })
    } else if (action === 'insert-team') {
      // Insert team with validation and retry
      const result = await enhancedApiClient.insertTeam(options.data)

      return NextResponse.json({
        success: result.success,
        action: 'insert-team',
        result,
        timestamp: new Date().toISOString(),
      })
    } else if (action === 'insert-game') {
      // Insert game with validation and retry
      const result = await enhancedApiClient.insertGame(options.data)

      return NextResponse.json({
        success: result.success,
        action: 'insert-game',
        result,
        timestamp: new Date().toISOString(),
      })
    } else if (action === 'insert-odds') {
      // Insert odds with validation and retry
      const result = await enhancedApiClient.insertOdds(options.data)

      return NextResponse.json({
        success: result.success,
        action: 'insert-odds',
        result,
        timestamp: new Date().toISOString(),
      })
    } else if (action === 'batch-insert-teams') {
      // Batch insert teams
      const result = await enhancedApiClient.batchInsertTeams(options.data)

      return NextResponse.json({
        success: true,
        action: 'batch-insert-teams',
        result,
        timestamp: new Date().toISOString(),
      })
    } else if (action === 'batch-insert-games') {
      // Batch insert games
      const result = await enhancedApiClient.batchInsertGames(options.data)

      return NextResponse.json({
        success: true,
        action: 'batch-insert-games',
        result,
        timestamp: new Date().toISOString(),
      })
    } else if (action === 'batch-insert-odds') {
      // Batch insert odds
      const result = await enhancedApiClient.batchInsertOdds(options.data)

      return NextResponse.json({
        success: true,
        action: 'batch-insert-odds',
        result,
        timestamp: new Date().toISOString(),
      })
    } else {
      return NextResponse.json(
        {
          success: false,
          error:
            'Invalid action. Use: audit, cleanup, test, start-monitoring, stop-monitoring, insert-team, insert-game, insert-odds, batch-insert-teams, batch-insert-games, or batch-insert-odds',
        },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('❌ Database operation error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}

/**
 * Run specific database tests
 */
async function runSpecificTests(tests: string[]): Promise<any> {
  const results: any = {}

  const testPromises = tests.map(async test => {
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
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  })

  await Promise.all(testPromises)

  return results
}

async function testDataIntegrity(): Promise<any> {
  const supabase = getSupabaseClient()

  const { data, error } = await supabase
    .from('teams')
    .select('name, sport')
    .limit(1000)

  if (error) {
    throw new Error(`Failed to test data integrity: ${error.message}`)
  }

  const totalTeams = data?.length || 0
  const missingNames = data?.filter(team => !team.name || team.name === '').length || 0
  const missingSports = data?.filter(team => !team.sport || team.sport === '').length || 0

  return {
    total_teams: totalTeams,
    missing_names: missingNames,
    missing_sports: missingSports,
  }
}

async function testForeignKeyIntegrity(): Promise<any> {
  const supabase = getSupabaseClient()

  const { data: games, error: gamesError } = await supabase
    .from('games')
    .select('home_team_id, away_team_id')
    .limit(1000)

  if (gamesError) {
    throw new Error(`Failed to test foreign key integrity: ${gamesError.message}`)
  }

  const totalGames = games?.length || 0
  let brokenHomeFk = 0
  let brokenAwayFk = 0

  // Check for broken foreign keys
  for (const game of games || []) {
    if (game.home_team_id) {
      const { error: homeError } = await supabase
        .from('teams')
        .select('id')
        .eq('id', game.home_team_id)
        .single()
      if (homeError) brokenHomeFk++
    }
    
    if (game.away_team_id) {
      const { error: awayError } = await supabase
        .from('teams')
        .select('id')
        .eq('id', game.away_team_id)
        .single()
      if (awayError) brokenAwayFk++
    }
  }

  return {
    total_games: totalGames,
    broken_home_fk: brokenHomeFk,
    broken_away_fk: brokenAwayFk,
  }
}

async function testPerformance(): Promise<any> {
  const supabase = getSupabaseClient()
  const startTime = Date.now()

  const { error } = await supabase
    .from('teams')
    .select('*, games!home_team_id(*), games!away_team_id(*)')
    .eq('sport', 'basketball')
    .limit(20)

  // Log error if present for debugging
  if (error) {
    console.warn('Performance test query error:', error.message)
  }

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
      priority: 'low',
    })

    return {
      success: result.success,
      dataCount: Array.isArray(result.data) ? result.data.length : 0,
      provider: result.provider,
      responseTime: result.responseTime,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

async function testRealTimeUpdates(): Promise<any> {
  const supabase = getSupabaseClient()

  const twoHoursAgo = new Date()
  twoHoursAgo.setHours(twoHoursAgo.getHours() - 2)
  const twoHoursFromNow = new Date()
  twoHoursFromNow.setHours(twoHoursFromNow.getHours() + 2)

  const { count: liveCount, error: liveError } = await supabase
    .from('games')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'live')
    .gte('game_date', twoHoursAgo.toISOString())
    .lte('game_date', twoHoursFromNow.toISOString())

  if (liveError) {
    throw new Error(`Failed to test live games: ${liveError.message}`)
  }

  const twentyFourHoursAgo = new Date()
  twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24)

  const { count: recentCount, error: recentError } = await supabase
    .from('games')
    .select('*', { count: 'exact', head: true })
    .gte('updated_at', twentyFourHoursAgo.toISOString())

  if (recentError) {
    throw new Error(`Failed to test recent games: ${recentError.message}`)
  }

  return {
    liveGames: liveCount || 0,
    recentUpdates: recentCount || 0,
  }
}
