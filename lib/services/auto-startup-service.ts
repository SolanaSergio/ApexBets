/**
 * Auto Startup Service
 * Handles automatic service initialization on startup
 */

import { structuredLogger } from './structured-logger'
import { dataSyncService } from './data-sync-service'
import { databaseService } from './database-service'
import { databaseAuditService } from './database-audit-service'

export interface StartupConfig {
  enableDataSync: boolean
  enableDatabaseAudit: boolean
  enableHealthChecks: boolean
  syncInterval: number // in minutes
}

export class AutoStartupService {
  private static instance: AutoStartupService
  private isInitialized: boolean = false
  private config: StartupConfig

  public static getInstance(): AutoStartupService {
    if (!AutoStartupService.instance) {
      AutoStartupService.instance = new AutoStartupService()
    }
    return AutoStartupService.instance
  }

  constructor() {
    this.config = {
      enableDataSync: true,
      enableDatabaseAudit: true,
      enableHealthChecks: true,
      syncInterval: 30 // 30 minutes
    }
  }

  async initialize(config?: Partial<StartupConfig>): Promise<{ success: boolean; message: string }> {
    if (this.isInitialized) {
      return { success: true, message: 'Service already initialized' }
    }

    try {
      structuredLogger.info('Initializing auto startup service')

      // Update config if provided
      if (config) {
        this.config = { ...this.config, ...config }
      }

      // Initialize database connection
      if (this.config.enableHealthChecks) {
        const dbHealth = await databaseService.healthCheck()
        if (!dbHealth.healthy) {
          structuredLogger.warn('Database health check failed during startup', dbHealth.details)
        }
      }

      // Run database audit if enabled
      if (this.config.enableDatabaseAudit) {
        try {
          const auditResult = await databaseAuditService.runFullAudit()
          structuredLogger.info('Startup database audit completed', {
            success: auditResult.success,
            totalTests: auditResult.totalTests,
            passedTests: auditResult.passedTests
          })
        } catch (error) {
          structuredLogger.error('Startup database audit failed', {
            error: error instanceof Error ? error.message : String(error)
          })
        }
      }

      // Start data sync if enabled
      if (this.config.enableDataSync) {
        dataSyncService.start()
        structuredLogger.info('Data sync service started')
      }

      this.isInitialized = true

      structuredLogger.info('Auto startup service initialized successfully', {
        config: this.config
      })

      return {
        success: true,
        message: 'Auto startup service initialized successfully'
      }

    } catch (error) {
      structuredLogger.error('Failed to initialize auto startup service', {
        error: error instanceof Error ? error.message : String(error)
      })

      return {
        success: false,
        message: `Failed to initialize: ${error instanceof Error ? error.message : String(error)}`
      }
    }
  }

  async start(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize()
    }

    structuredLogger.info('Auto startup service started')
  }

  async stop(): Promise<void> {
    dataSyncService.stop()
    this.isInitialized = false
    structuredLogger.info('Auto startup service stopped')
  }

  getInitializationStatus(): boolean {
    return this.isInitialized
  }

  getConfig(): StartupConfig {
    return { ...this.config }
  }

  updateConfig(updates: Partial<StartupConfig>): void {
    this.config = { ...this.config, ...updates }
    structuredLogger.info('Startup config updated', { config: this.config })
  }
}

export const autoStartupService = AutoStartupService.getInstance()
