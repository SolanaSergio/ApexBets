import { NextRequest, NextResponse } from 'next/server'
import { databaseCacheService } from '@/lib/services/database-cache-service'

export async function GET(request: NextRequest) {
  try {
    // Test if database cache is available
    const isAvailable = databaseCacheService.isAvailable()
    
    // Try to set a test cache entry
    let testResult = null
    if (isAvailable) {
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
      databaseCacheAvailable: isAvailable,
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
