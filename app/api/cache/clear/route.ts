import { NextRequest, NextResponse } from 'next/server'
import { cachedUnifiedApiClient } from '@/lib/services/api/cached-unified-api-client'

export async function POST(request: NextRequest) {
  try {
    const { sport } = await request.json().catch(() => ({}))
    
    // Clear cache for specific sport or all sports
    await cachedUnifiedApiClient.clearCache(sport)
    
    return NextResponse.json({
      success: true,
      message: sport ? `Cache cleared for ${sport}` : 'All cache cleared successfully'
    })
  } catch (error) {
    console.error('Error clearing cache:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to clear cache' 
      },
      { status: 500 }
    )
  }
}
