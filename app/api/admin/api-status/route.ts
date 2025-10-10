/**
 * API Status Dashboard
 * Monitor rate limits and API health based on comprehensive guide
 */

import { NextRequest, NextResponse } from 'next/server'
import { intelligentRateLimiter, enhancedRateLimiter } from '@/lib/services/enhanced-rate-limiter'

export async function GET(_request: NextRequest) {
  try {
    const providers = [
      'thesportsdb',
      'nba-stats', 
      'mlb-stats',
      'nhl',
      'espn',
      'balldontlie',
      'api-sports',
      'odds-api'
    ]

    const status = await Promise.all(providers.map(async (provider) => {
      const limits = intelligentRateLimiter.getProviderStatus(provider)
      const recommended = intelligentRateLimiter.getRecommendedDelay(provider)
      
      return {
        provider,
        status: {
          minute: {
            used: limits.minute.used,
            limit: limits.minute.limit,
            percentage: limits.minute.limit > 0 ? (limits.minute.used / limits.minute.limit * 100).toFixed(1) : '0',
            resetIn: Math.ceil(limits.minute.resetIn / 1000), // seconds
          },
          hour: {
            used: limits.hour.used,
            limit: limits.hour.limit,
            percentage: limits.hour.limit > 0 ? (limits.hour.used / limits.hour.limit * 100).toFixed(1) : '0',
            resetIn: Math.ceil(limits.hour.resetIn / 1000 / 60), // minutes
          },
          day: {
            used: limits.day.used,
            limit: limits.day.limit,
            percentage: limits.day.limit > 0 ? (limits.day.used / limits.day.limit * 100).toFixed(1) : '0',
            resetIn: Math.ceil(limits.day.resetIn / 1000 / 60 / 60), // hours
          }
        },
        recommendedDelay: recommended,
        healthCheck: await checkProviderHealth(provider)
      }
    }))

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      providers: status,
      recommendations: generateRecommendations(status)
    })

  } catch (error) {
    console.error('Error getting API status:', error)
    return NextResponse.json(
      { 
        error: 'Failed to get API status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

async function checkProviderHealth(provider: string): Promise<{
  status: 'healthy' | 'degraded' | 'down'
  responseTime?: number
  lastCheck: string
}> {
  // Load health endpoints from environment configuration (JSON string map)
  const endpointsEnv = process.env.EXTERNAL_HEALTH_ENDPOINTS
  const healthEndpoints: Record<string, string> = endpointsEnv ? JSON.parse(endpointsEnv) : {}

  const endpoint = healthEndpoints[provider]
  if (!endpoint) {
    return {
      status: 'healthy',
      lastCheck: new Date().toISOString()
    }
  }

  try {
    const start = Date.now()
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)
    
    const response = await fetch(endpoint, {
      method: 'GET',
      signal: controller.signal
    })
    
    clearTimeout(timeoutId)
    const responseTime = Date.now() - start

    return {
      status: response.ok ? 'healthy' : 'degraded',
      responseTime,
      lastCheck: new Date().toISOString()
    }
  } catch (error) {
    return {
      status: 'down',
      lastCheck: new Date().toISOString()
    }
  }
}

function generateRecommendations(status: any[]): string[] {
  const recommendations: string[] = []

  status.forEach(provider => {
    const { provider: name, status: limits } = provider

    // Check if approaching limits
    if (parseFloat(limits.minute.percentage) > 80) {
      recommendations.push(`${name}: Approaching minute limit (${limits.minute.percentage}%), consider slowing requests`)
    }

    if (parseFloat(limits.hour.percentage) > 90) {
      recommendations.push(`${name}: Critical hour limit (${limits.hour.percentage}%), switch to alternative provider`)
    }

    if (parseFloat(limits.day.percentage) > 95) {
      recommendations.push(`${name}: Daily limit nearly exceeded (${limits.day.percentage}%), use cached data only`)
    }

    // Provider-specific recommendations based on comprehensive guide
    if (name === 'balldontlie' && parseFloat(limits.minute.percentage) > 60) {
      recommendations.push(`${name}: Known for aggressive rate limiting, consider using NBA Stats API instead`)
    }

    if (name === 'api-sports' && parseFloat(limits.day.percentage) > 70) {
      recommendations.push(`${name}: Free tier limit approaching, prioritize TheSportsDB for remaining requests`)
    }

    if (name === 'odds-api' && parseFloat(limits.day.percentage) > 50) {
      recommendations.push(`${name}: Expensive API credits being used, cache aggressively`)
    }
  })

  // General recommendations based on comprehensive guide
  if (recommendations.length === 0) {
    recommendations.push('All APIs within safe limits. Following comprehensive guide recommendations.')
  }

  return recommendations
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { provider } = body

    if (provider) {
      await enhancedRateLimiter.resetRateLimits(provider)
      return NextResponse.json({
        success: true,
        message: `Rate limits reset for ${provider}`
      })
    }

    return NextResponse.json(
      { error: 'Provider is required' },
      { status: 400 }
    )

  } catch (error) {
    console.error('Error resetting rate limits:', error)
    return NextResponse.json(
      { 
        error: 'Failed to reset rate limits',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
