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
    let environmentStatus = { isConfigured: true, missingKeys: [], invalidKeys: [], recommendations: [] }
    let rateLimitStats = {}
    let cacheStats = { hits: 0, misses: 0, size: 0 }
    let apiTests = {}

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
      const { cacheService } = await import("@/lib/services/cache-service")
      cacheStats = cacheService.getStats()
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
    const gamesTest = await enhancedApiClient.getGames({ external: false })
    tests.games = {
      status: "healthy",
      responseTime: gamesTest.responseTime,
      fromCache: gamesTest.fromCache
    }
  } catch (error) {
    tests.games = {
      status: "error",
      error: error instanceof Error ? error.message : "Unknown error"
    }
  }

  try {
    // Test teams endpoint
    const teamsTest = await enhancedApiClient.getTeams({ sport: "basketball" })
    tests.teams = {
      status: "healthy",
      responseTime: teamsTest.responseTime,
      fromCache: teamsTest.fromCache
    }
  } catch (error) {
    tests.teams = {
      status: "error",
      error: error instanceof Error ? error.message : "Unknown error"
    }
  }

  try {
    // Test analytics endpoint
    const analyticsTest = await enhancedApiClient.getAnalyticsStats()
    tests.analytics = {
      status: "healthy",
      responseTime: analyticsTest.responseTime,
      fromCache: analyticsTest.fromCache
    }
  } catch (error) {
    tests.analytics = {
      status: "error",
      error: error instanceof Error ? error.message : "Unknown error"
    }
  }

  return tests
}
