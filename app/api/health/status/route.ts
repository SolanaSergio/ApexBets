import { NextResponse } from 'next/server'
import { envValidator } from '@/lib/config/env-validator'

export async function GET() {
  try {
    const environmentStatus = envValidator.getConfigurationReport()

    return NextResponse.json({
      environment: {
        configured: environmentStatus.isConfigured,
        missingKeys: environmentStatus.missingKeys,
        invalidKeys: environmentStatus.invalidKeys,
        recommendations: environmentStatus.recommendations,
        apiStatuses: environmentStatus.apiStatuses,
      },
      timestamp: new Date().toISOString(),
      status: environmentStatus.isConfigured ? 'healthy' : 'degraded',
    })
  } catch (error) {
    console.error('Environment status check failed:', error)
    return NextResponse.json(
      {
        environment: {
          configured: false,
          missingKeys: [],
          invalidKeys: [],
          recommendations: ['Environment check failed'],
          apiStatuses: {},
        },
        timestamp: new Date().toISOString(),
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
