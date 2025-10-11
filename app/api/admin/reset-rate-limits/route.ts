import { NextRequest, NextResponse } from 'next/server'
// Removed unused sportsDBClient import
import { apiKeyRotation } from '@/lib/services/api-key-rotation'
import { databaseCacheService } from '@/lib/services/database-cache-service'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { service } = body

    if (service === 'sportsdb' || service === 'all') {
      // Rate limiting is handled by Enhanced Rate Limiter - no reset needed
      console.log('Rate limiting is handled by Enhanced Rate Limiter')
    }

    if (service === 'api-keys' || service === 'all') {
      // Reset API key rotation tracking - get providers dynamically
      const { createClient } = require('@supabase/supabase-js')
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      )

      const { data: providers } = await supabase
        .from('api_providers')
        .select('provider_name')
        .eq('is_active', true)

      if (providers) {
        providers.forEach((provider: { provider_name: string }) => {
          apiKeyRotation.resetKeyUsage(provider.provider_name)
        })
      }
    }

    // Clear database cache
    await databaseCacheService.clear()
    console.log('✅ Cleared database cache')

    return NextResponse.json({
      success: true,
      message: `Rate limits reset for ${service}`,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Rate limit reset error:', error)
    return NextResponse.json(
      {
        error: 'Failed to reset rate limits',
        message: error instanceof Error ? error.message : 'Unknown error',
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
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Rate limit status error:', error)
    return NextResponse.json(
      {
        error: 'Failed to get rate limit status',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
