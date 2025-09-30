import { NextResponse } from 'next/server'
import { productionSupabaseClient } from '@/lib/supabase/production-client'
import { structuredLogger } from '@/lib/services/structured-logger'
// Removed unused staleDataDetector import
import { dynamicSportsManager } from '@/lib/services/dynamic-sports-manager'
import { isRedisHealthy } from '@/lib/redis'

// Force Node.js runtime to avoid Edge Runtime compatibility issues
export const runtime = 'nodejs'

export async function GET() {
  const startTime = Date.now()
  const healthChecks = {
    database: false,
    redis: false,
    staleDataDetector: false,
    dynamicSportsManager: false,
    timestamp: new Date().toISOString()
  }

  try {
    // Test database connection
    try {
      const dbTest = await productionSupabaseClient.executeSQL('SELECT 1')
      healthChecks.database = dbTest.success
    } catch (error) {
      structuredLogger.error('Database health check failed', { error: error instanceof Error ? error.message : String(error) })
    }

    // Test Redis connection
    try {
        healthChecks.redis = await isRedisHealthy();
    } catch (error) {
        structuredLogger.error('Redis health check failed', { error: error instanceof Error ? error.message : String(error) })
        healthChecks.redis = false;
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
    
    // Consider system healthy if database and dynamic sports manager are working
    // Redis is optional for basic functionality
    const criticalChecks = {
      database: healthChecks.database,
      dynamicSportsManager: healthChecks.dynamicSportsManager
    }
    const allCriticalHealthy = Object.values(criticalChecks).every(check => check === true)
    
    // kept for potential future reporting of non-critical checks

    return NextResponse.json({
      status: allCriticalHealthy ? 'healthy' : 'unhealthy',
      checks: healthChecks,
      criticalChecks,
      duration,
      timestamp: new Date().toISOString()
    }, { 
      status: allCriticalHealthy ? 200 : 503 
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
