import { NextRequest, NextResponse } from 'next/server'
// Removed unused sportsDBClient import
import { apiKeyRotation } from '@/lib/services/api-key-rotation'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { service } = body

    if (service === 'sportsdb' || service === 'all') {
      // Rate limiting is handled by Enhanced Rate Limiter - no reset needed
      console.log('Rate limiting is handled by Enhanced Rate Limiter')
    }

    if (service === 'api-keys' || service === 'all') {
      // Reset API key rotation tracking
      const providers = ['api-sports', 'odds-api', 'sportsdb', 'balldontlie']
      providers.forEach(provider => {
        apiKeyRotation.resetKeyUsage(provider)
      })
    }

    return NextResponse.json({
      success: true,
      message: `Rate limits reset for ${service}`,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Rate limit reset error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to reset rate limits',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    // Rate limiting is handled by Enhanced Rate Limiter
    const sportsDbStatus = { message: 'Rate limiting handled by Enhanced Rate Limiter' }
    
    return NextResponse.json({
      sportsdb: sportsDbStatus,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Rate limit status error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to get rate limit status',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
