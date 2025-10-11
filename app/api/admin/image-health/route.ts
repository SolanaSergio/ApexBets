import { NextRequest, NextResponse } from 'next/server'
import { imageMonitoringService } from '@/lib/services/image-monitoring-service'

export async function GET(_request: NextRequest) {
  try {
    const stats = imageMonitoringService.getStats()
    const health = imageMonitoringService.getHealthMetrics()

    return NextResponse.json({
      success: true,
      data: {
        stats,
        health,
        timestamp: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error('Error fetching image health metrics:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch image health metrics',
      },
      { status: 500 }
    )
  }
}
