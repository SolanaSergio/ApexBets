import { NextRequest, NextResponse } from 'next/server'
import { cachedUnifiedApiClient } from '@/lib/services/api/cached-unified-api-client'

export async function POST(request: NextRequest) {
  try {
    // Force re-enable database cache
    cachedUnifiedApiClient.reEnableDatabaseCache()
    
    // Get current status
    const status = cachedUnifiedApiClient.getDatabaseCacheStatus()
    
    return NextResponse.json({
      success: true,
      message: 'Cache service refreshed successfully',
      status,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error refreshing cache service:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to refresh cache service',
        details: error.message 
      },
      { status: 500 }
    )
  }
}
