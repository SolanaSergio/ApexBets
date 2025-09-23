/**
 * Stale Data Detector Service
 * Detects and manages stale data across the application
 */

export interface StaleDataConfig {
  maxAgeMinutes: number
  warningThresholdMinutes: number
  checkIntervalMinutes: number
}

export interface DataFreshnessResult {
  isStale: boolean
  isWarning: boolean
  ageMinutes: number
  lastUpdated: Date
  nextCheck: Date
}

export class StaleDataDetector {
  private static instance: StaleDataDetector
  private configs: Map<string, StaleDataConfig> = new Map()
  private lastRefreshAttempts: Map<string, number> = new Map()

  private constructor() {
    this.initializeConfigs()
  }

  static getInstance(): StaleDataDetector {
    if (!StaleDataDetector.instance) {
      StaleDataDetector.instance = new StaleDataDetector()
    }
    return StaleDataDetector.instance
  }

  private initializeConfigs() {
    // Default configurations for different data types
    this.configs.set('games', {
      maxAgeMinutes: 15, // Games data should be fresh within 15 minutes
      warningThresholdMinutes: 10,
      checkIntervalMinutes: 5
    })

    this.configs.set('standings', {
      maxAgeMinutes: 30, // Standings can be older
      warningThresholdMinutes: 20,
      checkIntervalMinutes: 10
    })

    this.configs.set('teams', {
      maxAgeMinutes: 60, // Team data changes less frequently
      warningThresholdMinutes: 45,
      checkIntervalMinutes: 15
    })

    this.configs.set('players', {
      maxAgeMinutes: 45, // Player data is moderately dynamic
      warningThresholdMinutes: 30,
      checkIntervalMinutes: 10
    })

    this.configs.set('odds', {
      maxAgeMinutes: 5, // Odds data must be very fresh
      warningThresholdMinutes: 3,
      checkIntervalMinutes: 2
    })
  }

  /**
   * Check if we should allow a refresh based on cooldown period
   */
  shouldAllowRefresh(dataType: string, sport?: string): boolean {
    const key = `${dataType}-${sport || 'all'}`
    const now = Date.now()
    const lastAttempt = this.lastRefreshAttempts.get(key) || 0
    const cooldownMs = 5 * 60 * 1000 // 5 minutes cooldown
    
    if (now - lastAttempt < cooldownMs) {
      return false
    }
    
    this.lastRefreshAttempts.set(key, now)
    return true
  }

  /**
   * Check if data is stale based on its last update time
   */
  async checkDataFreshness(
    dataType: string,
    data: any[],
    sport?: string
  ): Promise<DataFreshnessResult> {
    const configKey = sport ? `${dataType}:${sport}` : dataType
    const config = this.configs.get(configKey) || this.configs.get(dataType) || this.configs.get('games')!
    const now = new Date()
    
    // If no data, consider it stale but don't trigger immediate refresh
    if (!data || data.length === 0) {
      return {
        isStale: true,
        isWarning: true,
        ageMinutes: config.maxAgeMinutes + 1,
        lastUpdated: new Date(now.getTime() - (config.maxAgeMinutes + 1) * 60000),
        nextCheck: new Date(now.getTime() + config.checkIntervalMinutes * 60000)
      }
    }

    // Find the most recent update time from the data
    let lastUpdated = new Date(0)
    
    for (const item of data) {
      if (item.updatedAt) {
        const itemDate = new Date(item.updatedAt)
        if (itemDate > lastUpdated) {
          lastUpdated = itemDate
        }
      } else if (item.lastUpdated) {
        const itemDate = new Date(item.lastUpdated)
        if (itemDate > lastUpdated) {
          lastUpdated = itemDate
        }
      } else if (item.createdAt) {
        const itemDate = new Date(item.createdAt)
        if (itemDate > lastUpdated) {
          lastUpdated = itemDate
        }
      }
    }

    const ageMinutes = (now.getTime() - lastUpdated.getTime()) / (1000 * 60)
    
    // Handle case where lastUpdated is from 1970 (no real data)
    const isEpochDate = lastUpdated.getFullYear() === 1970
    const isStale = isEpochDate ? false : ageMinutes > config.maxAgeMinutes
    const isWarning = isEpochDate ? false : ageMinutes > config.warningThresholdMinutes

    return {
      isStale,
      isWarning,
      ageMinutes: Math.round(ageMinutes * 100) / 100,
      lastUpdated,
      nextCheck: new Date(now.getTime() + config.checkIntervalMinutes * 60000)
    }
  }

  /**
   * Get configuration for a specific data type
   */
  getConfig(dataType: string): StaleDataConfig | undefined {
    return this.configs.get(dataType)
  }

  /**
   * Update configuration for a data type
   */
  updateConfig(dataType: string, config: Partial<StaleDataConfig>): void {
    const existing = this.configs.get(dataType) || {
      maxAgeMinutes: 15,
      warningThresholdMinutes: 10,
      checkIntervalMinutes: 5
    }
    
    this.configs.set(dataType, { ...existing, ...config })
  }

  /**
   * Get all data types being monitored
   */
  getMonitoredDataTypes(): string[] {
    return Array.from(this.configs.keys())
  }

  /**
   * Check freshness for multiple data types
   */
  async checkMultipleDataTypes(
    dataMap: Map<string, { data: any[]; sport?: string }>
  ): Promise<Map<string, DataFreshnessResult>> {
    const results = new Map<string, DataFreshnessResult>()
    
    for (const [dataType, { data, sport }] of dataMap) {
      const result = await this.checkDataFreshness(dataType, data, sport)
      results.set(dataType, result)
    }
    
    return results
  }
}

// Export singleton instance
export const staleDataDetector = StaleDataDetector.getInstance()
