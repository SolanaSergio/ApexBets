/**
 * Automated Monitoring Service
 * Handles automated monitoring and alerting
 */

import { structuredLogger } from './structured-logger'
import { databaseService } from './database-service'
import { enhancedApiClient } from './enhanced-api-client'

export interface MonitoringMetrics {
  timestamp: Date
  databaseHealth: boolean
  apiHealth: boolean
  responseTime: number
  errorRate: number
  activeAlerts: number
}

export interface Alert {
  id: string
  type: 'error' | 'warning' | 'info'
  message: string
  timestamp: Date
  resolved: boolean
  service: string
}

export class AutomatedMonitoringService {
  private static instance: AutomatedMonitoringService
  private isRunning: boolean = false
  private metrics: MonitoringMetrics[] = []
  private alerts: Alert[] = []
  private monitoringInterval: NodeJS.Timeout | undefined

  public static getInstance(): AutomatedMonitoringService {
    if (!AutomatedMonitoringService.instance) {
      AutomatedMonitoringService.instance = new AutomatedMonitoringService()
    }
    return AutomatedMonitoringService.instance
  }

  async start(): Promise<void> {
    if (this.isRunning) {
      structuredLogger.warn('Monitoring service is already running')
      return
    }

    this.isRunning = true
    structuredLogger.info('Starting automated monitoring service')

    // Start monitoring loop
    this.monitoringInterval = setInterval(async () => {
      await this.performHealthCheck()
    }, 60000) // Check every minute

    structuredLogger.info('Automated monitoring service started')
  }

  async stop(): Promise<void> {
    if (!this.isRunning) {
      return
    }

    this.isRunning = false

    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval)
      this.monitoringInterval = undefined
    }

    structuredLogger.info('Automated monitoring service stopped')
  }

  private async performHealthCheck(): Promise<void> {
    try {
      const startTime = Date.now()
      
      // Check database health
      const dbHealth = await databaseService.healthCheck()
      
      // Check API health
      const apiHealth = await enhancedApiClient.forceHealthCheck()
      
      const responseTime = Date.now() - startTime
      
      const metrics: MonitoringMetrics = {
        timestamp: new Date(),
        databaseHealth: dbHealth.healthy,
        apiHealth: apiHealth.healthy,
        responseTime,
        errorRate: this.calculateErrorRate(),
        activeAlerts: this.alerts.filter(alert => !alert.resolved).length
      }

      this.metrics.push(metrics)
      
      // Keep only last 100 metrics
      if (this.metrics.length > 100) {
        this.metrics = this.metrics.slice(-100)
      }

      // Check for issues and create alerts
      if (!dbHealth.healthy) {
        await this.createAlert('error', 'Database health check failed', 'database')
      }

      if (!apiHealth.healthy) {
        await this.createAlert('error', 'API health check failed', 'api')
      }

      if (responseTime > 5000) {
        await this.createAlert('warning', `High response time: ${responseTime}ms`, 'performance')
      }

      structuredLogger.debug('Health check completed', metrics)

    } catch (error) {
      structuredLogger.error('Health check failed', {
        error: error instanceof Error ? error.message : String(error)
      })
      
      await this.createAlert('error', 'Health check failed', 'monitoring')
    }
  }

  private calculateErrorRate(): number {
    if (this.metrics.length < 2) return 0
    
    const recentMetrics = this.metrics.slice(-10)
    const failedChecks = recentMetrics.filter(m => !m.databaseHealth || !m.apiHealth).length
    
    return (failedChecks / recentMetrics.length) * 100
  }

  private async createAlert(type: 'error' | 'warning' | 'info', message: string, service: string): Promise<void> {
    const alert: Alert = {
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      message,
      timestamp: new Date(),
      resolved: false,
      service
    }

    this.alerts.push(alert)
    
    // Keep only last 1000 alerts
    if (this.alerts.length > 1000) {
      this.alerts = this.alerts.slice(-1000)
    }

    structuredLogger.warn('Alert created', alert)
  }

  getMetrics(): MonitoringMetrics[] {
    return [...this.metrics]
  }

  getActiveAlerts(): Alert[] {
    return this.alerts.filter(alert => !alert.resolved)
  }

  getStatus(): { running: boolean; totalAlerts: number; activeAlerts: number } {
    return {
      running: this.isRunning,
      totalAlerts: this.alerts.length,
      activeAlerts: this.alerts.filter(alert => !alert.resolved).length
    }
  }

  async resolveAlert(alertId: string): Promise<boolean> {
    const alert = this.alerts.find(a => a.id === alertId)
    if (alert) {
      alert.resolved = true
      structuredLogger.info('Alert resolved', { alertId })
      return true
    }
    return false
  }

  async clearResolvedAlerts(): Promise<number> {
    const resolvedCount = this.alerts.filter(alert => alert.resolved).length
    this.alerts = this.alerts.filter(alert => !alert.resolved)
    
    structuredLogger.info('Cleared resolved alerts', { count: resolvedCount })
    return resolvedCount
  }
}

export const automatedMonitoringService = AutomatedMonitoringService.getInstance()
