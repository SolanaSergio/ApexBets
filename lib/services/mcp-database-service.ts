/**
 * MCP Database Service
 * Service for database operations using MCP (Model Context Protocol)
 */

import { supabaseMCPClient } from '../supabase/mcp-client'
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

export class MCPDatabaseService {
  private static instance: MCPDatabaseService
  private isConnected: boolean = false
  private lastHealthCheck: Date = new Date()

  public static getInstance(): MCPDatabaseService {
    if (!MCPDatabaseService.instance) {
      MCPDatabaseService.instance = new MCPDatabaseService()
    }
    return MCPDatabaseService.instance
  }

  constructor() {
    this.initializeConnection()
  }

  private async initializeConnection(): Promise<void> {
    try {
      // Test connection
      await this.executeSQL('SELECT 1 as test')
      this.isConnected = true
      structuredLogger.info('MCP Database Service initialized successfully')
    } catch (error) {
      this.isConnected = false
      structuredLogger.error('Failed to initialize MCP Database Service', { 
        error: error instanceof Error ? error.message : String(error) 
      })
    }
  }

  async executeSQL(query: string, _params?: any[]): Promise<QueryResult> {
    const startTime = Date.now()
    
    try {
      const result = await supabaseMCPClient.executeSQL(query)
      const executionTime = Date.now() - startTime
      
      const data = Array.isArray(result) ? result : []
      
      structuredLogger.databaseQuery(query, executionTime, data.length)
      
      return {
        success: true,
        data,
        rowCount: data.length,
        executionTime
      }
    } catch (error) {
      const executionTime = Date.now() - startTime
      const errorMessage = error instanceof Error ? error.message : String(error)
      
      structuredLogger.error('Database query failed', {
        query: query.substring(0, 100),
        error: errorMessage,
        executionTime
      })
      
      return {
        success: false,
        data: [],
        rowCount: 0,
        executionTime,
        error: errorMessage
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
        connectionStatus: this.isConnected ? 'connected' : 'disconnected'
      }
    } catch (error) {
      structuredLogger.error('Failed to get table stats', {
        error: error instanceof Error ? error.message : String(error)
      })
      
      return {
        totalTables: 0,
        totalRows: 0,
        databaseSize: 'Unknown',
        connectionStatus: 'error'
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
          error: result.error
        }
      }
    } catch (error) {
      this.isConnected = false
      return {
        healthy: false,
        details: {
          connected: false,
          error: error instanceof Error ? error.message : String(error),
          lastCheck: this.lastHealthCheck.toISOString()
        }
      }
    }
  }

  async createIndex(tableName: string, columnName: string, indexName?: string): Promise<QueryResult> {
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
        error: error instanceof Error ? error.message : String(error)
      })
      return false
    }
  }

  async closeConnection(): Promise<void> {
    this.isConnected = false
    structuredLogger.info('Database connection closed')
  }
}

export const mcpDatabaseService = MCPDatabaseService.getInstance()
