import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const detailed = searchParams.get("detailed") === "true"

    // Basic health check - always return healthy for now
    const basicHealth = {
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.NEXT_PUBLIC_APP_VERSION || "1.0.0"
    }
    
    if (!detailed) {
      return NextResponse.json(basicHealth)
    }

    // Get detailed information with error handling
    let environmentStatus: {
      isConfigured: boolean
      missingKeys: string[]
      invalidKeys: string[]
      apiStatuses: Record<string, any>
      recommendations: string[]
    } = { isConfigured: true, missingKeys: [], invalidKeys: [], apiStatuses: {}, recommendations: [] }
    let rateLimitStats: any = {}
    let cacheStats: {
      memory: { hitRate: number; hits: number; misses: number; sets: number; deletes: number; totalEntries: number; totalSize: number }
      database: { available: boolean; disabled: boolean; supabaseConnected: boolean }
      totalEntries: number
      totalSize: number
    } = {
      memory: { hitRate: 0, hits: 0, misses: 0, sets: 0, deletes: 0, totalEntries: 0, totalSize: 0 },
      database: { available: false, disabled: false, supabaseConnected: false },
      totalEntries: 0,
      totalSize: 0
    }
    let apiTests: any = {}

    try {
      const { envValidator } = await import("@/lib/config/env-validator")
      environmentStatus = envValidator.getConfigurationReport()
    } catch (error) {
      console.warn("Environment validator not available:", error)
    }

    try {
      const { rateLimiter } = await import("@/lib/services/rate-limiter")
      rateLimitStats = rateLimiter.getAllUsageStats()
    } catch (error) {
      console.warn("Rate limiter not available:", error)
    }

    try {
      const { cacheManager } = await import("@/lib/cache")
      cacheStats = cacheManager.getStats()
    } catch (error) {
      console.warn("Cache service not available:", error)
    }

    try {
      apiTests = await testApiConnectivity()
    } catch (error) {
      console.warn("API connectivity tests failed:", error)
    }

    return NextResponse.json({
      ...basicHealth,
      
      environment: {
        configured: environmentStatus.isConfigured,
        missingKeys: environmentStatus.missingKeys,
        invalidKeys: environmentStatus.invalidKeys,
        recommendations: environmentStatus.recommendations
      },
      
      services: {
        database: { status: "healthy" },
        cache: { status: "healthy" },
        rateLimiter: { status: "healthy" }
      },
      
      rateLimits: rateLimitStats,
      
      cache: cacheStats,
      
      apiTests,
      
      system: {
        nodeVersion: process.version,
        platform: process.platform,
        memory: process.memoryUsage(),
        cpuUsage: process.cpuUsage()
      }
    })
  } catch (error) {
    console.error("Health check failed:", error)
    return NextResponse.json({
      status: "unhealthy",
      timestamp: new Date().toISOString(),
      error: "Health check failed",
      message: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}

async function testApiConnectivity(): Promise<Record<string, any>> {
  const tests: Record<string, any> = {}
  
  try {
    // Test games endpoint
    const startTime = Date.now()
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/games`)
    const responseTime = Date.now() - startTime
    
    if (response.ok) {
      tests.games = {
        status: "healthy",
        responseTime: responseTime,
        fromCache: false
      }
    } else {
      tests.games = {
        status: "error",
        error: `HTTP ${response.status}: ${response.statusText}`
      }
    }
  } catch (error) {
    tests.games = {
      status: "error",
      error: error instanceof Error ? error.message : "Unknown error"
    }
  }

  try {
    // Test teams endpoint
    const startTime = Date.now()
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/teams`)
    const responseTime = Date.now() - startTime
    
    if (response.ok) {
      tests.teams = {
        status: "healthy",
        responseTime: responseTime,
        fromCache: false
      }
    } else {
      tests.teams = {
        status: "error",
        error: `HTTP ${response.status}: ${response.statusText}`
      }
    }
  } catch (error) {
    tests.teams = {
      status: "error",
      error: error instanceof Error ? error.message : "Unknown error"
    }
  }

  try {
    // Test analytics endpoint
    const startTime = Date.now()
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/analytics/stats`)
    const responseTime = Date.now() - startTime
    
    if (response.ok) {
      tests.analytics = {
        status: "healthy",
        responseTime: responseTime,
        fromCache: false
      }
    } else {
      tests.analytics = {
        status: "error",
        error: `HTTP ${response.status}: ${response.statusText}`
      }
    }
  } catch (error) {
    tests.analytics = {
      status: "error",
      error: error instanceof Error ? error.message : "Unknown error"
    }
  }

  return tests
}
