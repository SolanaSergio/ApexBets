import { NextRequest, NextResponse } from "next/server"
import { cacheService } from "@/lib/services/cache-service"

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const pattern = searchParams.get("pattern")
    
    if (pattern) {
      // Clear cache entries matching pattern
      const regex = new RegExp(pattern)
      const keys = cacheService.keys(regex)
      keys.forEach(key => cacheService.delete(key))
      
      return NextResponse.json({
        success: true,
        message: `Cleared ${keys.length} cache entries matching pattern: ${pattern}`,
        clearedEntries: keys.length
      })
    } else {
      // Clear all cache
      cacheService.clear()
      
      return NextResponse.json({
        success: true,
        message: "All cache entries cleared",
        clearedEntries: "all"
      })
    }
  } catch (error) {
    console.error("Cache clear failed:", error)
    return NextResponse.json({
      success: false,
      error: "Failed to clear cache",
      message: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}
