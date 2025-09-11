import { NextRequest, NextResponse } from 'next/server'
import { databaseCacheService } from '@/lib/services/database-cache-service'

export async function GET(request: NextRequest) {
  try {
    // Get detailed status
    const status = databaseCacheService.getStatus()
    
    // Try to set a test cache entry
    let testResult = null
    if (status.available) {
      try {
        await databaseCacheService.set('test:cache', { message: 'Hello from cache!', timestamp: new Date().toISOString() }, 60, 'test')
        testResult = await databaseCacheService.get('test:cache')
      } catch (error) {
        console.error('Cache test failed:', error)
        testResult = { error: error.message }
      }
    }
    
    return NextResponse.json({
      success: true,
      status,
      testResult,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error testing cache:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to test cache',
        details: error.message 
      },
      { status: 500 }
    )
  }
}
