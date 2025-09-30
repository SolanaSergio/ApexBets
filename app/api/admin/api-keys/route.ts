import { NextRequest, NextResponse } from 'next/server'
import { apiKeyRotation } from '@/lib/services/api-key-rotation'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const provider = searchParams.get('provider')
    const action = searchParams.get('action')

    // Handle different actions
    if (action === 'rotate' && provider) {
      const success = apiKeyRotation.manualRotate(provider)
      return NextResponse.json({
        success,
        message: success ? `API key rotated for ${provider}` : `Failed to rotate API key for ${provider}`,
        stats: apiKeyRotation.getRotationStats(provider)
      })
    }

    if (action === 'history') {
      const limit = parseInt(searchParams.get('limit') || '50')
      const history = apiKeyRotation.getRotationHistory(limit)
      const filtered = provider ? history.filter(h => h.provider === provider) : history
      return NextResponse.json({ history: filtered })
    }

    if (action === 'reset' && provider) {
      const apiKey = searchParams.get('key')
      const success = apiKeyRotation.resetKeyUsage(provider, apiKey || undefined)
      return NextResponse.json({
        success,
        message: success ? 'Usage statistics reset' : 'Failed to reset usage statistics',
        stats: apiKeyRotation.getRotationStats(provider)
      })
    }

    // Default: return rotation statistics
    if (provider) {
      const stats = apiKeyRotation.getRotationStats(provider)
      if (!stats) {
        return NextResponse.json(
          { error: `Provider '${provider}' not found` },
          { status: 404 }
        )
      }
      return NextResponse.json(stats)
    }

    // Return stats for all providers
    const allStats = apiKeyRotation.getRotationStats()
    return NextResponse.json({
      providers: allStats,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('API key rotation endpoint error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, provider, apiKey, priority } = body

    if (action === 'add' && provider && apiKey) {
      const success = apiKeyRotation.addApiKey(provider, apiKey, priority)
      return NextResponse.json({
        success,
        message: success ? 'API key added successfully' : 'Failed to add API key (may already exist)',
        stats: apiKeyRotation.getRotationStats(provider)
      })
    }

    if (action === 'remove' && provider && apiKey) {
      const success = apiKeyRotation.removeApiKey(provider, apiKey)
      return NextResponse.json({
        success,
        message: success ? 'API key removed successfully' : 'Failed to remove API key (not found)',
        stats: apiKeyRotation.getRotationStats(provider)
      })
    }

    if (action === 'validate' && provider && apiKey) {
      const isValid = await apiKeyRotation.validateKey(provider, apiKey)
      return NextResponse.json({
        valid: isValid,
        message: isValid ? 'API key is valid' : 'API key is invalid',
        provider,
        timestamp: new Date().toISOString()
      })
    }

    return NextResponse.json(
      { error: 'Invalid action or missing required parameters' },
      { status: 400 }
    )

  } catch (error) {
    console.error('API key rotation POST error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}