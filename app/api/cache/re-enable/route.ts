import { NextRequest, NextResponse } from 'next/server'
import { cachedUnifiedApiClient } from '@/lib/services/api/cached-unified-api-client'

export async function POST(request: NextRequest) {
  try {
    // Re-enable the database cache
    cachedUnifiedApiClient.reEnableDatabaseCache()
    
    return NextResponse.json({
      success: true,
      message: 'Database cache re-enabled successfully'
    })
  } catch (error) {
    console.error('Error re-enabling database cache:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to re-enable database cache' 
      },
      { status: 500 }
    )
  }
}
