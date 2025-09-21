/**
 * Automated Monitoring Service
 * Monitors database health, data quality, and system performance
 */

import { MCPDatabaseService } from './mcp-database-service';
import { dataIntegrityService } from './data-integrity-service';
import { dataValidationService } from './data-validation-service';

export interface MonitoringAlert {
  id: string;
  type: 'error' | 'warning' | 'info';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  details: any;
  timestamp: Date;
  resolved: boolean;
  resolvedAt?: Date;
}

export interface MonitoringMetrics {
  databaseHealth: {
    connectionStatus: boolean;
    responseTime: number;
    activeConnections: number;
  };
  dataQuality: {
    duplicateCount: number;
    orphanedRecords: number;
    validationErrors: number;
    dataFreshness: number; // hours since last update
  };
  systemPerformance: {
    memoryUsage: number;
    cpuUsage: number;
    diskUsage: number;
    apiResponseTime: number;
  };
  alerts: MonitoringAlert[];
}

export class AutomatedMonitoringService {
  private static instance: AutomatedMonitoringService;
  private dbService: MCPDatabaseService;
  private monitoringInterval: NodeJS.Timeout | null = null;
  private alerts: MonitoringAlert[] = [];
  private metrics: MonitoringMetrics | null = null;
  private isRunning = false;

  constructor() {
    this.dbService = MCPDatabaseService.getInstance();
  }

  static getInstance(): AutomatedMonitoringService {
    if (!AutomatedMonitoringService.instance) {
      AutomatedMonitoringService.instance = new AutomatedMonitoringService();
    }
    return AutomatedMonitoringService.instance;
  }

  /**
   * Start automated monitoring
   */
  start(intervalMinutes: number = 5): void {
    if (this.isRunning) {
      console.log('Monitoring service is already running');
      return;
    }

    this.isRunning = true;
    this.monitoringInterval = setInterval(async () => {
      try {
        await this.performHealthCheck();
        await this.checkDataQuality();
        await this.checkSystemPerformance();
        await this.processAlerts();
      } catch (error) {
        console.error('Monitoring check failed:', error);
        this.createAlert('error', 'critical', 'Monitoring check failed', { error: error instanceof Error ? error.message : String(error) });
      }
    }, intervalMinutes * 60 * 1000);

    console.log(`Automated monitoring started with ${intervalMinutes} minute intervals`);
  }

  /**
   * Stop automated monitoring
   */
  stop(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    this.isRunning = false;
    console.log('Automated monitoring stopped');
  }

  /**
   * Perform database health check
   */
  private async performHealthCheck(): Promise<void> {
    const startTime = Date.now();
    
    try {
      // Test database connection
      await this.dbService.executeSQL('SELECT 1 as test');
      const responseTime = Date.now() - startTime;

      // Check active connections
      const connections = await this.dbService.executeSQL(`
        SELECT COUNT(*) as count 
        FROM pg_stat_activity 
        WHERE state = 'active'
      `);

      const activeConnections = connections[0]?.count || 0;

      // Update metrics
      if (!this.metrics) {
        this.metrics = {
          databaseHealth: { connectionStatus: false, responseTime: 0, activeConnections: 0 },
          dataQuality: { duplicateCount: 0, orphanedRecords: 0, validationErrors: 0, dataFreshness: 0 },
          systemPerformance: { memoryUsage: 0, cpuUsage: 0, diskUsage: 0, apiResponseTime: 0 },
          alerts: []
        };
      }

      this.metrics.databaseHealth = {
        connectionStatus: true,
        responseTime,
        activeConnections
      };

      // Alert if response time is too high
      if (responseTime > 5000) {
        this.createAlert('warning', 'high', 'Database response time is high', { responseTime });
      }

      // Alert if too many active connections
      if (activeConnections > 100) {
        this.createAlert('warning', 'medium', 'High number of active database connections', { activeConnections });
      }

    } catch (error) {
      this.createAlert('error', 'critical', 'Database connection failed', { error: error instanceof Error ? error.message : String(error) });
      
      if (this.metrics) {
        this.metrics.databaseHealth.connectionStatus = false;
      }
    }
  }

  /**
   * Check data quality
   */
  private async checkDataQuality(): Promise<void> {
    try {
      const integrityCheck = await dataIntegrityService.runIntegrityCheck();
      
      if (!this.metrics) {
        this.metrics = {
          databaseHealth: { connectionStatus: false, responseTime: 0, activeConnections: 0 },
          dataQuality: { duplicateCount: 0, orphanedRecords: 0, validationErrors: 0, dataFreshness: 0 },
          systemPerformance: { memoryUsage: 0, cpuUsage: 0, diskUsage: 0, apiResponseTime: 0 },
          alerts: []
        };
      }

      this.metrics.dataQuality = {
        duplicateCount: integrityCheck.teams.duplicateCount + integrityCheck.games.duplicateCount,
        orphanedRecords: integrityCheck.orphaned.orphanedRecords,
        validationErrors: 0, // This would be tracked from validation service
        dataFreshness: await this.getDataFreshness()
      };

      // Alert on data quality issues
      if (integrityCheck.teams.duplicateCount > 0) {
        this.createAlert('warning', 'medium', 'Duplicate teams detected', { count: integrityCheck.teams.duplicateCount });
      }

      if (integrityCheck.games.duplicateCount > 0) {
        this.createAlert('warning', 'medium', 'Duplicate games detected', { count: integrityCheck.games.duplicateCount });
      }

      if (integrityCheck.orphaned.orphanedRecords > 0) {
        this.createAlert('warning', 'high', 'Orphaned records detected', { count: integrityCheck.orphaned.orphanedRecords });
      }

      // Alert if data is stale
      if (this.metrics.dataQuality.dataFreshness > 24) {
        this.createAlert('warning', 'medium', 'Data is stale', { hoursSinceLastUpdate: this.metrics.dataQuality.dataFreshness });
      }

    } catch (error) {
      this.createAlert('error', 'high', 'Data quality check failed', { error: error instanceof Error ? error.message : String(error) });
    }
  }

  /**
   * Check system performance
   */
  private async checkSystemPerformance(): Promise<void> {
    try {
      const memoryUsage = process.memoryUsage();
      const cpuUsage = process.cpuUsage();

      if (!this.metrics) {
        this.metrics = {
          databaseHealth: { connectionStatus: false, responseTime: 0, activeConnections: 0 },
          dataQuality: { duplicateCount: 0, orphanedRecords: 0, validationErrors: 0, dataFreshness: 0 },
          systemPerformance: { memoryUsage: 0, cpuUsage: 0, diskUsage: 0, apiResponseTime: 0 },
          alerts: []
        };
      }

      this.metrics.systemPerformance = {
        memoryUsage: memoryUsage.heapUsed / 1024 / 1024, // MB
        cpuUsage: cpuUsage.user / 1000000, // seconds
        diskUsage: 0, // Would need to implement disk usage check
        apiResponseTime: 0 // Would need to track API response times
      };

      // Alert on high memory usage
      if (memoryUsage.heapUsed > 500 * 1024 * 1024) { // 500MB
        this.createAlert('warning', 'medium', 'High memory usage detected', { 
          heapUsed: memoryUsage.heapUsed / 1024 / 1024 
        });
      }

    } catch (error) {
      this.createAlert('error', 'medium', 'System performance check failed', { error: error instanceof Error ? error.message : String(error) });
    }
  }

  /**
   * Get data freshness in hours
   */
  private async getDataFreshness(): Promise<number> {
    try {
      const result = await this.dbService.executeSQL(`
        SELECT MAX(updated_at) as last_update
        FROM (
          SELECT updated_at FROM games
          UNION ALL
          SELECT updated_at FROM teams
          UNION ALL
          SELECT updated_at FROM odds
        ) as all_updates
      `);

      if (result[0]?.last_update) {
        const lastUpdate = new Date(result[0].last_update);
        const now = new Date();
        return (now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60); // hours
      }

      return 999; // Very stale if no updates found
    } catch (error) {
      return 999;
    }
  }

  /**
   * Process and manage alerts
   */
  private async processAlerts(): Promise<void> {
    // Auto-resolve old info alerts
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    this.alerts = this.alerts.map(alert => {
      if (alert.type === 'info' && alert.timestamp < oneHourAgo && !alert.resolved) {
        return { ...alert, resolved: true, resolvedAt: new Date() };
      }
      return alert;
    });

    // Keep only recent alerts (last 24 hours)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    this.alerts = this.alerts.filter(alert => alert.timestamp > oneDayAgo);

    if (this.metrics) {
      this.metrics.alerts = this.alerts;
    }
  }

  /**
   * Create a new alert
   */
  private createAlert(type: 'error' | 'warning' | 'info', severity: 'low' | 'medium' | 'high' | 'critical', message: string, details: any): void {
    const alert: MonitoringAlert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      severity,
      message,
      details,
      timestamp: new Date(),
      resolved: false
    };

    this.alerts.push(alert);
    console.log(`[${severity.toUpperCase()}] ${message}`, details);
  }

  /**
   * Get current metrics
   */
  getMetrics(): MonitoringMetrics | null {
    return this.metrics;
  }

  /**
   * Get active alerts
   */
  getActiveAlerts(): MonitoringAlert[] {
    return this.alerts.filter(alert => !alert.resolved);
  }

  /**
   * Get all alerts
   */
  getAllAlerts(): MonitoringAlert[] {
    return this.alerts;
  }

  /**
   * Resolve an alert
   */
  resolveAlert(alertId: string): boolean {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.resolved = true;
      alert.resolvedAt = new Date();
      return true;
    }
    return false;
  }

  /**
   * Clear resolved alerts
   */
  clearResolvedAlerts(): void {
    this.alerts = this.alerts.filter(alert => !alert.resolved);
  }

  /**
   * Get monitoring status
   */
  getStatus(): {
    isRunning: boolean;
    intervalMinutes: number;
    alertCount: number;
    activeAlertCount: number;
  } {
    return {
      isRunning: this.isRunning,
      intervalMinutes: this.monitoringInterval ? 5 : 0, // Default interval
      alertCount: this.alerts.length,
      activeAlertCount: this.alerts.filter(alert => !alert.resolved).length
    };
  }

  /**
   * Force a health check
   */
  async forceHealthCheck(): Promise<MonitoringMetrics | null> {
    try {
      await this.performHealthCheck();
      await this.checkDataQuality();
      await this.checkSystemPerformance();
      await this.processAlerts();
      return this.metrics;
    } catch (error) {
      console.error('Forced health check failed:', error);
      return null;
    }
  }
}

export const automatedMonitoringService = AutomatedMonitoringService.getInstance();
