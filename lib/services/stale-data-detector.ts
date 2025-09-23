/**
 * Stale Data Detector Service
 * Centralized stale data detection and refresh management
 */

import { structuredLogger } from './structured-logger'
import { productionSupabaseClient } from '../supabase/production-client'

export interface DataFreshnessConfig {
  dataType: 'games' | 'teams' | 'players' | 'standings' | 'odds' | 'predictions'
  maxAgeMinutes: number
  forceRefreshThreshold: number // hours
  invalidTimestampThreshold: number // days
}

export interface StaleDataResult {
  isStale: boolean
  needsRefresh: boolean
  dataAge: number
  maxAge: number
  oldestRecord?: any
  reason: string
}

export class StaleDataDetector {
  private static instance: StaleDataDetector
  private configs: Map<string, DataFreshnessConfig> = new Map()

  private constructor() {
    this.initializeConfigs()
  }

  static getInstance(): StaleDataDetector {
    if (!StaleDataDetector.instance) {
      StaleDataDetector.instance = new StaleDataDetector()
    }
    return StaleDataDetector.instance
  }

  private initializeConfigs(): void {
    const configs: DataFreshnessConfig[] = [
      {
        dataType: 'games',
        maxAgeMinutes: 15, // Games need frequent updates
        forceRefreshThreshold: 2, // 2 hours
        invalidTimestampThreshold: 1 // 1 day
      },
      {
        dataType: 'teams',
        maxAgeMinutes: 30, // Teams change less frequently
        forceRefreshThreshold: 6, // 6 hours
        invalidTimestampThreshold: 7 // 7 days
      },
      {
        dataType: 'players',
        maxAgeMinutes: 60, // Players change even less frequently
        forceRefreshThreshold: 12, // 12 hours
        invalidTimestampThreshold: 7 // 7 days
      },
      {
        dataType: 'standings',
        maxAgeMinutes: 60, // Standings change after games
        forceRefreshThreshold: 4, // 4 hours
        invalidTimestampThreshold: 3 // 3 days
      },
      {
        dataType: 'odds',
        maxAgeMinutes: 2, // Odds change very frequently
        forceRefreshThreshold: 1, // 1 hour
        invalidTimestampThreshold: 1 // 1 day
      },
      {
        dataType: 'predictions',
        maxAgeMinutes: 10, // Predictions need regular updates
        forceRefreshThreshold: 2, // 2 hours
        invalidTimestampThreshold: 1 // 1 day
      }
    ]

    configs.forEach(config => {
      this.configs.set(config.dataType, config)
    })
  }

  async checkDataFreshness(
    dataType: string,
    data: any[],
    sport?: string,
    additionalParams?: Record<string, any>
  ): Promise<StaleDataResult> {
    const config = this.configs.get(dataType)
    if (!config) {
      return {
        isStale: false,
        needsRefresh: false,
        dataAge: 0,
        maxAge: 0,
        reason: 'No freshness config for data type'
      }
    }

    // If no data, needs refresh
    if (!data || data.length === 0) {
      structuredLogger.info('Database data is empty, fetching from external API', {
        dataType,
        sport,
        ...additionalParams
      })
      return {
        isStale: true,
        needsRefresh: true,
        dataAge: Infinity,
        maxAge: config.maxAgeMinutes * 60 * 1000,
        reason: 'No data available'
      }
    }

    // Find the oldest record
    const oldestRecord = this.findOldestRecord(data, dataType)
    if (!oldestRecord) {
      return {
        isStale: true,
        needsRefresh: true,
        dataAge: Infinity,
        maxAge: config.maxAgeMinutes * 60 * 1000,
        reason: 'No valid records found'
      }
    }

    const dataAge = this.calculateDataAge(oldestRecord, dataType)
    const maxAge = config.maxAgeMinutes * 60 * 1000

    // Check for invalid timestamps (dataAge > 1 year suggests invalid timestamp)
    if (dataAge > config.invalidTimestampThreshold * 24 * 60 * 60 * 1000) {
      structuredLogger.warn('Database data has invalid timestamp, forcing refresh', {
        dataType,
        sport,
        dataAgeDays: Math.round(dataAge / (24 * 60 * 60 * 1000)),
        oldestRecord: oldestRecord.last_updated || oldestRecord.updated_at,
        ...additionalParams
      })
      return {
        isStale: true,
        needsRefresh: true,
        dataAge,
        maxAge,
        oldestRecord,
        reason: 'Invalid timestamp detected'
      }
    }

    // Check if data is stale
    if (dataAge > maxAge) {
      structuredLogger.info('Database data is stale, refreshing from external API', {
        dataType,
        sport,
        dataAgeMinutes: Math.round(dataAge / 60000),
        maxAgeMinutes: Math.round(maxAge / 60000),
        ...additionalParams
      })
      return {
        isStale: true,
        needsRefresh: true,
        dataAge,
        maxAge,
        oldestRecord,
        reason: 'Data exceeds maximum age'
      }
    }

    // Check if data needs force refresh (very old data)
    const forceRefreshThreshold = config.forceRefreshThreshold * 60 * 60 * 1000
    if (dataAge > forceRefreshThreshold) {
      structuredLogger.info('Database data is very old, forcing refresh', {
        dataType,
        sport,
        dataAgeHours: Math.round(dataAge / (60 * 60 * 1000)),
        forceRefreshThresholdHours: config.forceRefreshThreshold,
        ...additionalParams
      })
      return {
        isStale: true,
        needsRefresh: true,
        dataAge,
        maxAge,
        oldestRecord,
        reason: 'Data exceeds force refresh threshold'
      }
    }

    return {
      isStale: false,
      needsRefresh: false,
      dataAge,
      maxAge,
      oldestRecord,
      reason: 'Data is fresh'
    }
  }

  private findOldestRecord(data: any[], dataType: string): any | null {
    if (!data || data.length === 0) return null

    return data.reduce((oldest, record) => {
      const recordTime = this.getRecordTimestamp(record, dataType)
      const oldestTime = this.getRecordTimestamp(oldest, dataType)
      return recordTime < oldestTime ? record : oldest
    })
  }

  private getRecordTimestamp(record: any, _dataType: string): number {
    // Try different timestamp fields based on data type
    const timestampFields = [
      'last_updated',
      'updated_at',
      'timestamp',
      'created_at',
      'game_date',
      'date'
    ]

    for (const field of timestampFields) {
      if (record[field]) {
        const timestamp = new Date(record[field]).getTime()
        if (!isNaN(timestamp) && timestamp > 0) {
          return timestamp
        }
      }
    }

    // If no valid timestamp found, return current time (treat as fresh)
    return Date.now()
  }

  private calculateDataAge(record: any, dataType: string): number {
    const recordTime = this.getRecordTimestamp(record, dataType)
    return Date.now() - recordTime
  }

  async checkDatabaseFreshness(
    tableName: string,
    _dataType: string,
    filters: Record<string, any> = {}
  ): Promise<StaleDataResult> {
    try {
      // Build query to get the oldest record
      let query = `SELECT * FROM ${tableName}`
      const conditions: string[] = []
      const values: any[] = []

      // Add filters
      Object.entries(filters).forEach(([key, value], index) => {
        if (value !== undefined && value !== null) {
          conditions.push(`${key} = $${index + 1}`)
          values.push(value)
        }
      })

      if (conditions.length > 0) {
        query += ` WHERE ${conditions.join(' AND ')}`
      }

      // Order by timestamp to get oldest record
      const timestampFields = ['last_updated', 'updated_at', 'timestamp', 'created_at']
      const orderBy = timestampFields.find(() => 
        // Check if field exists in table schema
        true // For now, assume it exists
      ) || 'created_at'

      query += ` ORDER BY ${orderBy} ASC LIMIT 1`

      const result = await productionSupabaseClient.executeSQL(query, values)
      
      if (!result.success || !result.data || result.data.length === 0) {
        return {
          isStale: true,
          needsRefresh: true,
          dataAge: Infinity,
          maxAge: 0,
          reason: 'No data found in database'
        }
      }

      const oldestRecord = result.data[0]
      return this.checkDataFreshness(_dataType, [oldestRecord], filters.sport, filters)
    } catch (error) {
      structuredLogger.error('Failed to check database freshness', {
        tableName,
        dataType: _dataType,
        error: error instanceof Error ? error.message : String(error)
      })
      
      return {
        isStale: true,
        needsRefresh: true,
        dataAge: Infinity,
        maxAge: 0,
        reason: 'Error checking database freshness'
      }
    }
  }

  updateConfig(dataType: string, config: Partial<DataFreshnessConfig>): void {
    const existing = this.configs.get(dataType)
    if (existing) {
      this.configs.set(dataType, { ...existing, ...config })
      structuredLogger.info('Stale data config updated', {
        dataType,
        config: this.configs.get(dataType)
      })
    }
  }

  getConfig(dataType: string): DataFreshnessConfig | undefined {
    return this.configs.get(dataType)
  }

  getAllConfigs(): Map<string, DataFreshnessConfig> {
    return new Map(this.configs)
  }
}

export const staleDataDetector = StaleDataDetector.getInstance()
