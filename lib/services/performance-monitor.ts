/**
 * Performance Monitoring Service
 * Tracks API performance, identifies bottlenecks, and provides optimization recommendations
 */

interface PerformanceMetric {
  endpoint: string
  method: string
  responseTime: number
  statusCode: number
  success: boolean
  cached: boolean
  timestamp: number
  provider?: string
  sport?: string
}

interface PerformanceStats {
  totalRequests: number
  averageResponseTime: number
  successRate: number
  cacheHitRate: number
  slowestEndpoints: Array<{ endpoint: string, avgTime: number, count: number }>
  errorRate: number
  topErrors: Array<{ error: string, count: number }>
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = []
  private readonly MAX_METRICS = 1000 // Keep last 1000 metrics
  private readonly SLOW_THRESHOLD = 5000 // 5 seconds
  private errorCounts = new Map<string, number>()

  recordMetric(metric: Omit<PerformanceMetric, 'timestamp'>): void {
    const fullMetric: PerformanceMetric = {
      ...metric,
      timestamp: Date.now()
    }

    this.metrics.push(fullMetric)

    // Keep only the most recent metrics
    if (this.metrics.length > this.MAX_METRICS) {
      this.metrics = this.metrics.slice(-this.MAX_METRICS)
    }

    // Track errors
    if (!metric.success) {
      const errorKey = `${metric.endpoint}:${metric.statusCode}`
      this.errorCounts.set(errorKey, (this.errorCounts.get(errorKey) || 0) + 1)
    }

    // Log slow requests
    if (metric.responseTime > this.SLOW_THRESHOLD) {
      console.warn(`Slow API request detected: ${metric.endpoint} took ${metric.responseTime}ms`)
    }
  }

  getStats(timeWindow: number = 300000): PerformanceStats { // 5 minutes default
    const now = Date.now()
    const recentMetrics = this.metrics.filter(m => now - m.timestamp < timeWindow)

    if (recentMetrics.length === 0) {
      return {
        totalRequests: 0,
        averageResponseTime: 0,
        successRate: 0,
        cacheHitRate: 0,
        slowestEndpoints: [],
        errorRate: 0,
        topErrors: []
      }
    }

    const totalRequests = recentMetrics.length
    const successfulRequests = recentMetrics.filter(m => m.success).length
    const cachedRequests = recentMetrics.filter(m => m.cached).length
    const averageResponseTime = recentMetrics.reduce((sum, m) => sum + m.responseTime, 0) / totalRequests

    // Group by endpoint for slowest analysis
    const endpointStats = new Map<string, { totalTime: number, count: number }>()
    recentMetrics.forEach(metric => {
      const key = `${metric.method} ${metric.endpoint}`
      const existing = endpointStats.get(key) || { totalTime: 0, count: 0 }
      endpointStats.set(key, {
        totalTime: existing.totalTime + metric.responseTime,
        count: existing.count + 1
      })
    })

    const slowestEndpoints = Array.from(endpointStats.entries())
      .map(([endpoint, stats]) => ({
        endpoint,
        avgTime: stats.totalTime / stats.count,
        count: stats.count
      }))
      .sort((a, b) => b.avgTime - a.avgTime)
      .slice(0, 10)

    const topErrors = Array.from(this.errorCounts.entries())
      .map(([error, count]) => ({ error, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    return {
      totalRequests,
      averageResponseTime: Math.round(averageResponseTime),
      successRate: Math.round((successfulRequests / totalRequests) * 100),
      cacheHitRate: Math.round((cachedRequests / totalRequests) * 100),
      slowestEndpoints,
      errorRate: Math.round(((totalRequests - successfulRequests) / totalRequests) * 100),
      topErrors
    }
  }

  getProviderStats(provider: string, timeWindow: number = 300000): PerformanceStats {
    const now = Date.now()
    const providerMetrics = this.metrics.filter(
      m => m.provider === provider && now - m.timestamp < timeWindow
    )

    if (providerMetrics.length === 0) {
      return {
        totalRequests: 0,
        averageResponseTime: 0,
        successRate: 0,
        cacheHitRate: 0,
        slowestEndpoints: [],
        errorRate: 0,
        topErrors: []
      }
    }

    // Use the same logic as getStats but with filtered metrics
    const totalRequests = providerMetrics.length
    const successfulRequests = providerMetrics.filter(m => m.success).length
    const cachedRequests = providerMetrics.filter(m => m.cached).length
    const averageResponseTime = providerMetrics.reduce((sum, m) => sum + m.responseTime, 0) / totalRequests

    const endpointStats = new Map<string, { totalTime: number, count: number }>()
    providerMetrics.forEach(metric => {
      const key = `${metric.method} ${metric.endpoint}`
      const existing = endpointStats.get(key) || { totalTime: 0, count: 0 }
      endpointStats.set(key, {
        totalTime: existing.totalTime + metric.responseTime,
        count: existing.count + 1
      })
    })

    const slowestEndpoints = Array.from(endpointStats.entries())
      .map(([endpoint, stats]) => ({
        endpoint,
        avgTime: stats.totalTime / stats.count,
        count: stats.count
      }))
      .sort((a, b) => b.avgTime - a.avgTime)
      .slice(0, 10)

    return {
      totalRequests,
      averageResponseTime: Math.round(averageResponseTime),
      successRate: Math.round((successfulRequests / totalRequests) * 100),
      cacheHitRate: Math.round((cachedRequests / totalRequests) * 100),
      slowestEndpoints,
      errorRate: Math.round(((totalRequests - successfulRequests) / totalRequests) * 100),
      topErrors: []
    }
  }

  getOptimizationRecommendations(): string[] {
    const stats = this.getStats()
    const recommendations: string[] = []

    if (stats.averageResponseTime > 3000) {
      recommendations.push('Consider implementing more aggressive caching for slow endpoints')
    }

    if (stats.cacheHitRate < 50) {
      recommendations.push('Increase cache TTL or implement more comprehensive caching strategy')
    }

    if (stats.errorRate > 10) {
      recommendations.push('High error rate detected - review error handling and retry logic')
    }

    if (stats.slowestEndpoints.length > 0) {
      const slowest = stats.slowestEndpoints[0]
      if (slowest.avgTime > 5000) {
        recommendations.push(`Optimize slowest endpoint: ${slowest.endpoint} (${slowest.avgTime}ms avg)`)
      }
    }

    if (stats.totalRequests > 100 && stats.averageResponseTime > 2000) {
      recommendations.push('Consider implementing request batching or parallel processing')
    }

    return recommendations
  }

  clearMetrics(): void {
    this.metrics = []
    this.errorCounts.clear()
  }

  exportMetrics(): PerformanceMetric[] {
    return [...this.metrics]
  }
}

export const performanceMonitor = new PerformanceMonitor()
export type { PerformanceMetric, PerformanceStats }
