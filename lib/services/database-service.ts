/**
 * Database Service
 * Service for database operations using production Supabase client
 * Vercel-compatible implementation
 */

import { productionSupabaseClient } from '../supabase/production-client'
import { structuredLogger } from './structured-logger'

export interface DatabaseStats {
  totalTables: number
  totalRows: number
  databaseSize: string
  lastBackup?: string
  connectionStatus: 'connected' | 'disconnected' | 'error'
}

export interface QueryResult {
  success: boolean
  data: any[]
  rowCount: number
  executionTime: number
  error?: string
}

export class DatabaseService {
  private static instance: DatabaseService
  private static initialized = false
  private isConnected: boolean = false
  private lastHealthCheck: Date = new Date()

  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService()
    }
    return DatabaseService.instance
  }

  constructor() {
    // Server-side only - prevent browser instantiation
    if (typeof window !== 'undefined') {
      throw new Error('DatabaseService can only be instantiated on the server side')
    }

    // Only initialize once, and not during build phase
    if (!DatabaseService.initialized && process.env.NEXT_PHASE !== 'phase-production-build') {
      this.initializeConnection()
      DatabaseService.initialized = true
    }
  }

  private async initializeConnection(): Promise<void> {
    try {
      // Test connection with production Supabase client
      this.isConnected = productionSupabaseClient.isConnected()

      // Only log if there's an issue
      if (!this.isConnected) {
        structuredLogger.warn('Database Service initialized but not connected', {
          client: 'production-supabase',
          connected: false,
          reason: 'Supabase client not initialized or environment variables missing',
        })
      }
    } catch (error) {
      this.isConnected = false
      structuredLogger.error('Database Service initialization failed', {
        error: error instanceof Error ? error.message : String(error),
        connected: false,
      })
    }
  }

  /**
   * Perform health check on database connection
   */
  async performHealthCheck(): Promise<boolean> {
    try {
      const startTime = Date.now()
      const result = await productionSupabaseClient.executeSQL('SELECT 1 as health_check', [])
      const executionTime = Date.now() - startTime

      this.isConnected = result.success
      this.lastHealthCheck = new Date()

      structuredLogger.debug('Database health check completed', {
        success: result.success,
        executionTime,
        connected: this.isConnected,
      })

      return result.success
    } catch (error) {
      this.isConnected = false

      structuredLogger.warn('Database health check failed', {
        error: error instanceof Error ? error.message : String(error),
        connected: false,
      })

      return false
    }
  }

  async executeSQL(query: string, _params?: any[]): Promise<QueryResult> {
    const startTime = Date.now()

    try {
      // Block only during Next.js build/static generation, allow server runtime
      if (process.env.NEXT_PHASE === 'phase-production-build') {
        return {
          success: false,
          data: [],
          rowCount: 0,
          executionTime: Date.now() - startTime,
          error: 'Database operations not available during build/static generation',
        }
      }

      // Check if Supabase client is initialized
      if (!productionSupabaseClient.isConnected()) {
        return {
          success: false,
          data: [],
          rowCount: 0,
          executionTime: Date.now() - startTime,
          error:
            'Supabase client not initialized. This may occur during build phase or when environment variables are not available.',
        }
      }

      // Use Supabase client methods instead of raw SQL
      // This should be replaced with proper Supabase Edge Function calls
      console.warn('executeSQL should be replaced with Supabase Edge Functions or client methods')

      const executionTime = Date.now() - startTime

      return {
        success: false,
        data: [],
        rowCount: 0,
        executionTime,
        error:
          'Raw SQL queries are not supported. Use Supabase Edge Functions or client methods instead.',
      }
    } catch (error) {
      const executionTime = Date.now() - startTime
      const errorMessage = error instanceof Error ? error.message : String(error)

      structuredLogger.error('Database query failed', {
        query: query.substring(0, 100),
        error: errorMessage,
        executionTime,
      })

      return {
        success: false,
        data: [],
        rowCount: 0,
        executionTime,
        error: errorMessage,
      }
    }
  }

  async getTableInfo(tableName: string): Promise<QueryResult> {
    const query = `
      SELECT 
        column_name,
        data_type,
        is_nullable,
        column_default,
        character_maximum_length
      FROM information_schema.columns 
      WHERE table_name = $1 
      AND table_schema = 'public'
      ORDER BY ordinal_position
    `

    return this.executeSQL(query, [tableName])
  }

  async getTableStats(): Promise<DatabaseStats> {
    try {
      const tablesQuery = `
        SELECT 
          schemaname,
          tablename,
          n_tup_ins as inserts,
          n_tup_upd as updates,
          n_tup_del as deletes,
          n_live_tup as live_tuples,
          n_dead_tup as dead_tuples
        FROM pg_stat_user_tables
        WHERE schemaname = 'public'
      `

      const tablesResult = await this.executeSQL(tablesQuery)
      const tables = tablesResult.data || []

      const totalRows = tables.reduce((sum, table) => sum + (table.live_tuples || 0), 0)

      const sizeQuery = `
        SELECT pg_size_pretty(pg_database_size(current_database())) as database_size
      `

      const sizeResult = await this.executeSQL(sizeQuery)
      const databaseSize = sizeResult.data?.[0]?.database_size || 'Unknown'

      return {
        totalTables: tables.length,
        totalRows,
        databaseSize,
        connectionStatus: this.isConnected ? 'connected' : 'disconnected',
      }
    } catch (error) {
      structuredLogger.error('Failed to get table stats', {
        error: error instanceof Error ? error.message : String(error),
      })

      return {
        totalTables: 0,
        totalRows: 0,
        databaseSize: 'Unknown',
        connectionStatus: 'error',
      }
    }
  }

  async healthCheck(): Promise<{ healthy: boolean; details: any }> {
    try {
      const startTime = Date.now()
      const result = await this.executeSQL('SELECT 1 as health_check')
      const responseTime = Date.now() - startTime

      this.isConnected = result.success
      this.lastHealthCheck = new Date()

      return {
        healthy: result.success && responseTime < 5000, // 5 second timeout
        details: {
          connected: this.isConnected,
          responseTime,
          lastCheck: this.lastHealthCheck.toISOString(),
          error: result.error,
        },
      }
    } catch (error) {
      this.isConnected = false
      return {
        healthy: false,
        details: {
          connected: false,
          error: error instanceof Error ? error.message : String(error),
          lastCheck: this.lastHealthCheck.toISOString(),
        },
      }
    }
  }

  async createIndex(
    tableName: string,
    columnName: string,
    indexName?: string
  ): Promise<QueryResult> {
    const name = indexName || `idx_${tableName}_${columnName}`
    const query = `CREATE INDEX IF NOT EXISTS ${name} ON ${tableName}(${columnName})`

    return this.executeSQL(query)
  }

  async dropIndex(indexName: string): Promise<QueryResult> {
    const query = `DROP INDEX IF EXISTS ${indexName}`
    return this.executeSQL(query)
  }

  async getIndexes(tableName?: string): Promise<QueryResult> {
    let query = `
      SELECT 
        schemaname,
        tablename,
        indexname,
        indexdef
      FROM pg_indexes 
      WHERE schemaname = 'public'
    `

    if (tableName) {
      query += ` AND tablename = $1`
      return this.executeSQL(query, [tableName])
    }

    return this.executeSQL(query)
  }

  async getAllTables(): Promise<string[]> {
    const query = `
      SELECT tablename FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY tablename
    `
    const result = await this.executeSQL(query)
    if (!result.success) return []
    return (result.data as any[]).map((r: any) => r.tablename)
  }

  async analyzeTable(tableName: string): Promise<QueryResult> {
    const query = `ANALYZE ${tableName}`
    return this.executeSQL(query)
  }

  async vacuumTable(tableName: string): Promise<QueryResult> {
    const query = `VACUUM ${tableName}`
    return this.executeSQL(query)
  }

  async getSlowQueries(limit: number = 10): Promise<QueryResult> {
    const query = `
      SELECT 
        query,
        calls,
        total_time,
        mean_time,
        rows
      FROM pg_stat_statements 
      ORDER BY mean_time DESC 
      LIMIT $1
    `

    return this.executeSQL(query, [limit])
  }

  async getTableSizes(): Promise<QueryResult> {
    const query = `
      SELECT 
        schemaname,
        tablename,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
        pg_total_relation_size(schemaname||'.'||tablename) as size_bytes
      FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
    `

    return this.executeSQL(query)
  }

  async backupTable(tableName: string): Promise<QueryResult> {
    const backupTableName = `${tableName}_backup_${Date.now()}`
    const query = `CREATE TABLE ${backupTableName} AS SELECT * FROM ${tableName}`

    return this.executeSQL(query)
  }

  async restoreTable(backupTableName: string, targetTableName: string): Promise<QueryResult> {
    const query = `INSERT INTO ${targetTableName} SELECT * FROM ${backupTableName}`
    return this.executeSQL(query)
  }

  async getConnectionStatus(): Promise<boolean> {
    return this.isConnected
  }

  async reconnect(): Promise<boolean> {
    try {
      await this.initializeConnection()
      return this.isConnected
    } catch (error) {
      structuredLogger.error('Failed to reconnect to database', {
        error: error instanceof Error ? error.message : String(error),
      })
      return false
    }
  }

  /**
   * Get performance statistics
   */
  getPerformanceStats(): {
    connectionStatus: {
      isConnected: boolean
      lastHealthCheck: Date
    }
  } {
    return {
      connectionStatus: {
        isConnected: this.isConnected,
        lastHealthCheck: this.lastHealthCheck,
      },
    }
  }

  /**
   * Get health status
   */
  async getHealthStatus(): Promise<{
    isHealthy: boolean
    lastCheck: Date
    performanceStats: { slowQueries: number; avgQueryTime: number }
  }> {
    const isHealthy = await this.performHealthCheck()

    return {
      isHealthy,
      lastCheck: this.lastHealthCheck,
      performanceStats: {
        slowQueries: 0,
        avgQueryTime: 0,
      },
    }
  }

  async closeConnection(): Promise<void> {
    this.isConnected = false
    structuredLogger.info('Database connection closed')
  }
}

export const databaseService = DatabaseService.getInstance()
