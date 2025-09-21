/**
 * Auto Startup Service
 * Automatically starts all monitoring and data quality services when the application starts
 */

import { automatedMonitoringService } from './automated-monitoring-service';
import { dataIntegrityService } from './data-integrity-service';
import { enhancedApiClient } from './enhanced-api-client';
// Load startup config dynamically to avoid path issues
import * as path from 'path';
import * as fs from 'fs';

const getStartupConfig = () => {
  try {
    // Try multiple possible paths for the config file
    const possiblePaths = [
      path.join(process.cwd(), 'startup.config.json'),
      path.join(__dirname, '../../startup.config.json'),
      path.join(__dirname, '../../../startup.config.json'),
      path.join(process.cwd(), 'dist/server/startup.config.json')
    ];
    
    for (const configPath of possiblePaths) {
      if (fs.existsSync(configPath)) {
        return JSON.parse(fs.readFileSync(configPath, 'utf8'));
      }
    }
    
    // Fallback to default config if file not found
    console.warn('⚠️ startup.config.json not found, using default configuration');
    return {
      autoStartup: {
        enabled: true,
        monitoring: { enabled: true, intervalMinutes: 5 },
        dataQuality: { enabled: true, autoCleanup: false },
        healthChecks: { enabled: true, intervalMinutes: 10 },
        startupDelay: 5000
      }
    };
  } catch (error) {
    console.error('❌ Error loading startup config:', error);
    return {
      autoStartup: {
        enabled: true,
        monitoring: { enabled: true, intervalMinutes: 5 },
        dataQuality: { enabled: true, autoCleanup: false },
        healthChecks: { enabled: true, intervalMinutes: 10 },
        startupDelay: 5000
      }
    };
  }
};

const startupConfig = getStartupConfig();

export interface StartupConfig {
  enableMonitoring: boolean;
  monitoringIntervalMinutes: number;
  enableDataQualityChecks: boolean;
  enableHealthChecks: boolean;
  enableAutoCleanup: boolean;
  startupDelay: number; // milliseconds to wait before starting services
}

export class AutoStartupService {
  private static instance: AutoStartupService;
  private isInitialized = false;
  private startupConfig: StartupConfig;

  constructor() {
    // Load configuration from JSON file
    const isDevelopment = process.env.NODE_ENV === 'development';
    const envConfig = isDevelopment ? startupConfig.environments.development : startupConfig.environments.production;
    
    this.startupConfig = {
      enableMonitoring: startupConfig.autoStartup.monitoring.enabled,
      monitoringIntervalMinutes: envConfig.monitoring.intervalMinutes,
      enableDataQualityChecks: startupConfig.autoStartup.dataQuality.enabled,
      enableHealthChecks: startupConfig.autoStartup.healthChecks.enabled,
      enableAutoCleanup: envConfig.dataQuality.autoCleanup, // Now enabled by default
      startupDelay: isDevelopment ? startupConfig.autoStartup.startupDelay : envConfig.startupDelay || startupConfig.autoStartup.startupDelay
    };
  }

  static getInstance(): AutoStartupService {
    if (!AutoStartupService.instance) {
      AutoStartupService.instance = new AutoStartupService();
    }
    return AutoStartupService.instance;
  }

  /**
   * Initialize auto-startup services
   */
  async initialize(config?: Partial<StartupConfig>): Promise<void> {
    if (this.isInitialized) {
      console.log('🚀 Auto-startup already initialized');
      return;
    }

    // Merge config
    this.startupConfig = { ...this.startupConfig, ...config };

    console.log('🚀 Initializing auto-startup services...');
    console.log('📋 Configuration:', this.startupConfig);

    // Wait for startup delay
    if (this.startupConfig.startupDelay > 0) {
      console.log(`⏳ Waiting ${this.startupConfig.startupDelay}ms before starting services...`);
      await this.sleep(this.startupConfig.startupDelay);
    }

    try {
      // Start monitoring if enabled
      if (this.startupConfig.enableMonitoring) {
        console.log('📊 Starting automated monitoring...');
        automatedMonitoringService.start(this.startupConfig.monitoringIntervalMinutes);
        console.log('✅ Monitoring started');
      }

      // Run initial health check if enabled
      if (this.startupConfig.enableHealthChecks) {
        console.log('🏥 Running initial health check...');
        const healthCheck = await enhancedApiClient.forceHealthCheck();
        if (healthCheck) {
          console.log('✅ Health check completed');
          console.log('📈 Database Health:', healthCheck.databaseHealth.connectionStatus ? 'Connected' : 'Disconnected');
          console.log('📊 Data Quality:', {
            duplicates: healthCheck.dataQuality.duplicateCount,
            orphaned: healthCheck.dataQuality.orphanedRecords,
            freshness: `${healthCheck.dataQuality.dataFreshness}h old`
          });
        }
      }

      // Run data quality checks if enabled
      if (this.startupConfig.enableDataQualityChecks) {
        console.log('🔍 Running data quality checks...');
        const integrityCheck = await dataIntegrityService.runIntegrityCheck();
        console.log('✅ Data quality check completed');
        console.log('📊 Integrity Status:', integrityCheck.overall ? 'All Good' : 'Issues Found');
        
        if (!integrityCheck.overall) {
          console.log('⚠️ Issues found:', integrityCheck.recommendations);
        }
      }

      // Auto cleanup if enabled (use with caution)
      if (this.startupConfig.enableAutoCleanup) {
        console.log('🧹 Running automatic cleanup...');
        const cleanupResults = await enhancedApiClient.cleanupDuplicates();
        if (cleanupResults.success) {
          console.log('✅ Auto cleanup completed');
          console.log('📊 Cleanup Results:', {
            teamsRemoved: cleanupResults.teamsRemoved,
            gamesRemoved: cleanupResults.gamesRemoved,
            oddsRemoved: cleanupResults.oddsRemoved
          });
        } else {
          console.log('❌ Auto cleanup failed:', cleanupResults.errors);
        }
      }

      this.isInitialized = true;
      console.log('🎉 Auto-startup services initialized successfully!');

    } catch (error) {
      console.error('❌ Auto-startup initialization failed:', error);
      throw error;
    }
  }

  /**
   * Start services with custom configuration
   */
  async startWithConfig(config: Partial<StartupConfig>): Promise<void> {
    this.isInitialized = false; // Reset to allow re-initialization
    await this.initialize(config);
  }

  /**
   * Stop all auto-started services
   */
  stop(): void {
    console.log('🛑 Stopping auto-startup services...');
    
    try {
      automatedMonitoringService.stop();
      console.log('✅ Monitoring stopped');
    } catch (error) {
      console.error('❌ Error stopping monitoring:', error);
    }

    this.isInitialized = false;
    console.log('🛑 Auto-startup services stopped');
  }

  /**
   * Get current status
   */
  getStatus(): {
    isInitialized: boolean;
    config: StartupConfig;
    monitoringStatus: any;
  } {
    return {
      isInitialized: this.isInitialized,
      config: this.startupConfig,
      monitoringStatus: automatedMonitoringService.getStatus()
    };
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<StartupConfig>): void {
    this.startupConfig = { ...this.startupConfig, ...newConfig };
    console.log('📋 Configuration updated:', this.startupConfig);
  }

  /**
   * Restart services with current configuration
   */
  async restart(): Promise<void> {
    console.log('🔄 Restarting auto-startup services...');
    this.stop();
    await this.sleep(1000); // Wait 1 second
    await this.initialize();
  }

  /**
   * Run a quick health check
   */
  async quickHealthCheck(): Promise<{
    success: boolean;
    database: boolean;
    monitoring: boolean;
    dataQuality: boolean;
  }> {
    try {
      const healthCheck = await enhancedApiClient.forceHealthCheck();
      const monitoringStatus = automatedMonitoringService.getStatus();
      const integrityCheck = await dataIntegrityService.runIntegrityCheck();

      return {
        success: healthCheck !== null && monitoringStatus.isRunning && integrityCheck.overall,
        database: healthCheck?.databaseHealth.connectionStatus || false,
        monitoring: monitoringStatus.isRunning,
        dataQuality: integrityCheck.overall
      };
    } catch (error) {
      console.error('❌ Quick health check failed:', error);
      return {
        success: false,
        database: false,
        monitoring: false,
        dataQuality: false
      };
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const autoStartupService = AutoStartupService.getInstance();
