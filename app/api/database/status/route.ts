/**
 * DATABASE STATUS API
 * Comprehensive database status and health monitoring
 */

import { NextRequest, NextResponse } from 'next/server'
import { databaseService } from '@/lib/services/database-service'
import { productionSupabaseClient } from '@/lib/supabase/production-client'

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
      tables = await databaseService.getAllTables()
    }

    // Get database stats if requested
    let stats = null
    if (includeStats) {
      stats = await databaseService.getTableStats()
    }

    // Get Supabase client status
    const supabaseStatus = {
      connected: productionSupabaseClient.isConnected(),
      url: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'configured' : 'missing',
      key: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'configured' : 'missing'
    }

    return NextResponse.json({
      success: true,
      data: {
        health: healthCheck,
        connection: {
          database: isConnected,
          supabase: supabaseStatus
        },
        tables: includeTables ? tables : undefined,
        stats: includeStats ? stats : undefined,
        timestamp: new Date().toISOString()
      },
      meta: {
        includeStats,
        includeTables,
        responseTime: healthCheck.details?.responseTime || 0
      }
    })

  } catch (error) {
    console.error('Database status API error:', error)
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to get database status',
        details: errorMessage,
        data: null
      },
      { status: 500 }
    )
  }
}
