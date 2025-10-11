// Add this to your health check endpoint to debug issues
export async function GET(request) {
  try {
    console.log('Health check started...')

    // Test database connection
    const dbStatus = productionSupabaseClient.isConnected()
    console.log('Database status:', dbStatus)

    // Test rate limiter
    const rateLimiter = enhancedRateLimiter.getInstance()
    const rateLimitStatus = await rateLimiter.getRateLimitStatus('optimized-api')
    console.log('Rate limit status:', rateLimitStatus)

    // Test storage service
    const storageStats = await optimizedSportsStorage.getStorageStats()
    console.log('Storage stats:', storageStats)

    return NextResponse.json({
      success: true,
      database: dbStatus,
      rateLimits: rateLimitStatus,
      storage: storageStats,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Health check error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}
