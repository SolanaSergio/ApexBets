import { NextResponse } from 'next/server'
import { databaseCacheService } from '@/lib/services/database-cache-service'
import { cacheService } from '@/lib/services/cache-service'
import { databaseCacheService } from '@/lib/services/database-cache-service'

export async function POST() {
  try {
    // Clear both database and memory cache
    await databaseCacheService.clear()
    cacheService.clear()
    await databaseCacheService.delete()
    
    return NextResponse.json({
      success: true,
      message: 'All caches cleared successfully',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Cache clear error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

export async function GET() {
  return POST() // Same functionality for GET
}
