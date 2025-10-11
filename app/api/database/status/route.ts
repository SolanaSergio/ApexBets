/**
 * DATABASE STATUS API
 * Comprehensive database status and health monitoring
 */

import { NextRequest, NextResponse } from 'next/server'
import { databaseService } from '@/lib/services/database-service'
import { productionSupabaseClient } from '@/lib/supabase/production-client'

// Explicitly set runtime to suppress warnings
export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const includeStats = searchParams.get('includeStats') === 'true'
    const includeTables = searchParams.get('includeTables') === 'true'

    // Get basic health check
    const healthCheck = await databaseService.healthCheck()

    // Get connection status
    const isConnected = await databaseService.getConnectionStatus()

    // Get all tables if requested
    let tables: string[] = []
    if (includeTables) {
      // Use a simple query to get table information
      const { edgeFunctionClient } = await import('@/lib/services/edge-function-client')
      const result = await edgeFunctionClient.queryGames({ limit: 1 })
      if (result.success) {
        // For now, return empty array as we don't have a specific get-tables function
        tables = []
      }
    }

    // Get database stats if requested
    let stats = null
    if (includeStats) {
      // Use a simple query to get stats
      const { edgeFunctionClient } = await import('@/lib/services/edge-function-client')
      const result = await edgeFunctionClient.queryGames({ limit: 1 })
      if (result.success) {
        // For now, return null as we don't have a specific get-stats function
        stats = null
      }
    }

    // Get Supabase client status
    const supabaseStatus = {
      connected: productionSupabaseClient.isConnected(),
      url: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'configured' : 'missing',
      key: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'configured' : 'missing',
    }

    // Get cache status
    let cacheStatus = 'disconnected'
    try {
      const { databaseCacheService } = await import('@/lib/services/database-cache-service')
      await databaseCacheService.set('status-check', 'ok', 10)
      cacheStatus = 'connected'
    } catch (error) {
      // ignore
    }

    return NextResponse.json({
      success: true,
      data: {
        health: healthCheck,
        connection: {
          database: isConnected,
          supabase: supabaseStatus,
          cache: cacheStatus,
        },
        tables: includeTables ? tables : undefined,
        stats: includeStats ? stats : undefined,
        timestamp: new Date().toISOString(),
      },
      meta: {
        includeStats,
        includeTables,
        responseTime: (healthCheck as any)?.details?.responseTime || 0,
      },
    })
  } catch (error) {
    console.error('Database status API error:', error)

    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get database status',
        details: errorMessage,
        data: null,
      },
      { status: 500 }
    )
  }
}
