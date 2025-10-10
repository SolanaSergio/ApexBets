/**
 * Image Monitoring Service
 * Tracks image load success/failure rates, sources, and provides analytics
 */

import { structuredLogger } from './structured-logger'

export interface ImageLoadEvent {
  entityType: 'team' | 'player' | 'sports'
  entityName: string
  sport?: string
  source: 'database' | 'espn-cdn' | 'svg'
  success: boolean
  url?: string
  error?: string
  loadTime?: number
  timestamp: string
}

export interface ImageStats {
  totalLoads: number
  successRate: number
  bySource: {
    database: { loads: number; success: number; failure: number }
    'espn-cdn': { loads: number; success: number; failure: number }
    svg: { loads: number; success: number; failure: number }
  }
  bySport: Record<string, { loads: number; success: number; failure: number }>
  recentFailures: ImageLoadEvent[]
  averageLoadTime: number
}

export class ImageMonitoringService {
  private static instance: ImageMonitoringService
  private events: ImageLoadEvent[] = []
  private maxEvents = 1000 // Keep last 1000 events in memory

  public static getInstance(): ImageMonitoringService {
    if (!ImageMonitoringService.instance) {
      ImageMonitoringService.instance = new ImageMonitoringService()
    }
    return ImageMonitoringService.instance
  }

  /**
   * Track an image load event
   */
  trackImageLoad(event: Omit<ImageLoadEvent, 'timestamp'>): void {
    const fullEvent: ImageLoadEvent = {
      ...event,
      timestamp: new Date().toISOString()
    }

    this.events.push(fullEvent)

    // Keep only the most recent events
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents)
    }

    // Log significant events
    if (!event.success) {
      structuredLogger.warn('Image load failed', {
        entityType: event.entityType,
        entityName: event.entityName,
        sport: event.sport,
        source: event.source,
        error: event.error,
        url: event.url
      })
    }

    // Log high SVG fallback usage
    if (event.source === 'svg') {
      const recentSvgCount = this.events
        .filter(e => e.source === 'svg' && 
          new Date(e.timestamp).getTime() > Date.now() - 60000) // Last minute
        .length

      if (recentSvgCount > 10) {
        structuredLogger.warn('High SVG fallback usage detected', {
          recentSvgCount,
          entityType: event.entityType,
          entityName: event.entityName,
          sport: event.sport
        })
      }
    }
  }

  /**
   * Get current image statistics
   */
  getStats(): ImageStats {
    const now = Date.now()
    const last24Hours = this.events.filter(e => 
      new Date(e.timestamp).getTime() > now - 24 * 60 * 60 * 1000
    )

    const bySource = {
      database: { loads: 0, success: 0, failure: 0 },
      'espn-cdn': { loads: 0, success: 0, failure: 0 },
      svg: { loads: 0, success: 0, failure: 0 }
    }

    const bySport: Record<string, { loads: number; success: number; failure: number }> = {}
    const recentFailures: ImageLoadEvent[] = []
    let totalLoadTime = 0
    let loadTimeCount = 0

    for (const event of last24Hours) {
      // Count by source
      bySource[event.source].loads++
      if (event.success) {
        bySource[event.source].success++
      } else {
        bySource[event.source].failure++
        recentFailures.push(event)
      }

      // Count by sport
      if (event.sport) {
        if (!bySport[event.sport]) {
          bySport[event.sport] = { loads: 0, success: 0, failure: 0 }
        }
        bySport[event.sport].loads++
        if (event.success) {
          bySport[event.sport].success++
        } else {
          bySport[event.sport].failure++
        }
      }

      // Track load times
      if (event.loadTime) {
        totalLoadTime += event.loadTime
        loadTimeCount++
      }
    }

    const totalLoads = last24Hours.length
    const totalSuccess = last24Hours.filter(e => e.success).length
    const successRate = totalLoads > 0 ? (totalSuccess / totalLoads) * 100 : 0

    return {
      totalLoads,
      successRate: Math.round(successRate * 100) / 100,
      bySource,
      bySport,
      recentFailures: recentFailures.slice(-20), // Last 20 failures
      averageLoadTime: loadTimeCount > 0 ? Math.round(totalLoadTime / loadTimeCount) : 0
    }
  }

  /**
   * Get health metrics for dashboard
   */
  getHealthMetrics(): {
    overallHealth: 'excellent' | 'good' | 'warning' | 'critical'
    databaseHitRate: number
    svgFallbackRate: number
    averageLoadTime: number
    needsAttention: Array<{
      type: 'high_svg_usage' | 'low_success_rate' | 'slow_load_times'
      message: string
      severity: 'warning' | 'critical'
    }>
  } {
    const stats = this.getStats()
    const databaseHitRate = stats.totalLoads > 0 
      ? (stats.bySource.database.loads / stats.totalLoads) * 100 
      : 0
    const svgFallbackRate = stats.totalLoads > 0 
      ? (stats.bySource.svg.loads / stats.totalLoads) * 100 
      : 0

    const needsAttention: Array<{
      type: 'high_svg_usage' | 'low_success_rate' | 'slow_load_times'
      message: string
      severity: 'warning' | 'critical'
    }> = []

    // Check for issues
    if (svgFallbackRate > 20) {
      needsAttention.push({
        type: 'high_svg_usage',
        message: `High SVG fallback rate: ${svgFallbackRate.toFixed(1)}%`,
        severity: svgFallbackRate > 50 ? 'critical' : 'warning'
      })
    }

    if (stats.successRate < 90) {
      needsAttention.push({
        type: 'low_success_rate',
        message: `Low success rate: ${stats.successRate.toFixed(1)}%`,
        severity: stats.successRate < 70 ? 'critical' : 'warning'
      })
    }

    if (stats.averageLoadTime > 2000) {
      needsAttention.push({
        type: 'slow_load_times',
        message: `Slow load times: ${stats.averageLoadTime}ms average`,
        severity: stats.averageLoadTime > 5000 ? 'critical' : 'warning'
      })
    }

    // Determine overall health
    let overallHealth: 'excellent' | 'good' | 'warning' | 'critical' = 'excellent'
    if (needsAttention.some(n => n.severity === 'critical')) {
      overallHealth = 'critical'
    } else if (needsAttention.some(n => n.severity === 'warning')) {
      overallHealth = 'warning'
    } else if (stats.successRate < 95 || svgFallbackRate > 5) {
      overallHealth = 'good'
    }

    return {
      overallHealth,
      databaseHitRate: Math.round(databaseHitRate * 100) / 100,
      svgFallbackRate: Math.round(svgFallbackRate * 100) / 100,
      averageLoadTime: stats.averageLoadTime,
      needsAttention
    }
  }

  /**
   * Clear all events (for testing)
   */
  clearEvents(): void {
    this.events = []
  }

  /**
   * Get events for a specific entity
   */
  getEntityEvents(entityName: string, entityType?: 'team' | 'player'): ImageLoadEvent[] {
    return this.events.filter(e => 
      e.entityName === entityName && 
      (!entityType || e.entityType === entityType)
    )
  }
}

export const imageMonitoringService = ImageMonitoringService.getInstance()
