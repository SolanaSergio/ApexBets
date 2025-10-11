import { NextRequest, NextResponse } from 'next/server'
import { imageMonitoringService } from '@/lib/services/image-monitoring-service'

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const entityName = url.searchParams.get('entity')
    const entityType = url.searchParams.get('type') as 'team' | 'player' | undefined

    let data
    if (entityName) {
      data = imageMonitoringService.getEntityEvents(entityName, entityType)
    } else {
      data = imageMonitoringService.getStats()
    }

    return NextResponse.json({
      success: true,
      data,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error fetching image stats:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch image stats',
      },
      { status: 500 }
    )
  }
}
