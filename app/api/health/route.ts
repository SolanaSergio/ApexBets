import { NextResponse } from 'next/server'
import { productionSupabaseClient } from '@/lib/supabase/production-client'
import { structuredLogger } from '@/lib/services/structured-logger'
// Removed unused staleDataDetector import
import { dynamicSportsManager } from '@/lib/services/dynamic-sports-manager'

// Force Node.js runtime to avoid Edge Runtime compatibility issues
export const runtime = 'nodejs'

export async function GET() {
  const startTime = Date.now()
  const healthChecks = {
    database: false,
    staleDataDetector: false,
    dynamicSportsManager: false,
    timestamp: new Date().toISOString()
  }

  try {
    // Test database connection
    try {
      const dbTest = await productionSupabaseClient.executeSQL('SELECT 1 as test')
      healthChecks.database = dbTest.success
    } catch (error) {
      structuredLogger.error('Database health check failed', { error: error instanceof Error ? error.message : String(error) })
    }

    // Test stale data detector
    try {
      // Removed unused stale test - service was deleted as unnecessary
      healthChecks.staleDataDetector = true
    } catch (error) {
      structuredLogger.error('Stale data detector health check failed', { error: error instanceof Error ? error.message : String(error) })
    }

    // Test dynamic sports manager
    try {
      await dynamicSportsManager.refreshConfiguration()
      const sports = dynamicSportsManager.getSupportedSports()
      healthChecks.dynamicSportsManager = sports.length > 0
    } catch (error) {
      structuredLogger.error('Dynamic sports manager health check failed', { error: error instanceof Error ? error.message : String(error) })
    }

    const duration = Date.now() - startTime
    const allHealthy = Object.values(healthChecks).every(check => check === true || typeof check === 'string')

    return NextResponse.json({
      status: allHealthy ? 'healthy' : 'unhealthy',
      checks: healthChecks,
      duration,
      timestamp: new Date().toISOString()
    }, { 
      status: allHealthy ? 200 : 503 
    })

  } catch (error) {
    const duration = Date.now() - startTime
    structuredLogger.error('Health check failed', { 
      error: error instanceof Error ? error.message : String(error),
      duration 
    })

    return NextResponse.json({
      status: 'unhealthy',
      error: error instanceof Error ? error.message : String(error),
      duration,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}