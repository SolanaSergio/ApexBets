import { NextRequest, NextResponse } from 'next/server'
import { databaseCacheService } from '@/lib/services/database-cache-service'
import { cacheService } from '@/lib/services/cache-service'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action') || 'stats'

    switch (action) {
      case 'stats':
        const dbStats = await databaseCacheService.getStats()
        const memStats = cacheService.getStats()
        
        return NextResponse.json({
          success: true,
          data: {
            database: dbStats,
            memory: memStats,
            totalEntries: dbStats.totalEntries + memStats.totalEntries,
            totalSize: dbStats.totalSize + memStats.totalSize
          },
          timestamp: new Date().toISOString()
        })

      case 'clear':
        const sport = searchParams.get('sport')
        if (sport) {
          await databaseCacheService.clearBySport(sport)
          // Clear memory cache for the sport
          const keys = cacheService.keys(new RegExp(`.*:${sport}:.*`))
          keys.forEach(key => cacheService.delete(key))
        } else {
          await databaseCacheService.clear()
          cacheService.clear()
        }

        return NextResponse.json({
          success: true,
          message: sport ? `Cache cleared for ${sport}` : 'All cache cleared',
          timestamp: new Date().toISOString()
        })

      case 'test':
        // Test cache functionality
        const testKey = 'test:cache:functionality'
        const testData = { message: 'Cache test successful', timestamp: new Date().toISOString() }
        
        await databaseCacheService.set(testKey, testData, 60, 'test')
        const retrieved = await databaseCacheService.get(testKey)
        
        return NextResponse.json({
          success: true,
          data: {
            stored: testData,
            retrieved,
            match: JSON.stringify(testData) === JSON.stringify(retrieved)
          },
          timestamp: new Date().toISOString()
        })

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action. Use: stats, clear, or test',
          timestamp: new Date().toISOString()
        }, { status: 400 })
    }
  } catch (error) {
    console.error('Cache API error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
