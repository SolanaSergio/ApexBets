import { NextRequest, NextResponse } from "next/server"
import { enhancedApiClient } from "@/lib/services/enhanced-api-client"
import { envValidator } from "@/lib/config/env-validator"
import { rateLimiter } from "@/lib/services/rate-limiter"
import { cacheService } from "@/lib/services/cache-service"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const detailed = searchParams.get("detailed") === "true"

    // Get basic health status
    const healthStatus = await enhancedApiClient.getHealthStatus()
    
    if (!detailed) {
      return NextResponse.json({
        status: healthStatus.status,
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: process.env.NEXT_PUBLIC_APP_VERSION || "1.0.0"
      })
    }

    // Get detailed information
    const environmentStatus = envValidator.getConfigurationReport()
    const rateLimitStats = rateLimiter.getAllUsageStats()
    const cacheStats = cacheService.getStats()
    const cacheSizeInfo = cacheService.getSizeInfo()

    // Test API connectivity
    const apiTests = await testApiConnectivity()

    return NextResponse.json({
      status: healthStatus.status,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.NEXT_PUBLIC_APP_VERSION || "1.0.0",
      
      environment: {
        configured: environmentStatus.isConfigured,
        missingKeys: environmentStatus.missingKeys,
        invalidKeys: environmentStatus.invalidKeys,
        recommendations: environmentStatus.recommendations
      },
      
      services: healthStatus.services,
      
      rateLimits: rateLimitStats,
      
      cache: {
        ...cacheStats,
        sizeInfo: cacheSizeInfo
      },
      
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
