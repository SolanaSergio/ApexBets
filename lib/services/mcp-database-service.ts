/**
 * MCP Database Service
 * Centralized service for all database operations using Supabase MCP tools
 * This replaces all direct Supabase client calls throughout the application
 */

export interface DatabaseQuery {
  table: string
  select?: string[]
  filters?: Record<string, any>
  orderBy?: { column: string; ascending?: boolean }
  limit?: number
  offset?: number
}

export interface DatabaseInsert {
  table: string
  data: Record<string, any> | Record<string, any>[]
  onConflict?: string
}

export interface DatabaseUpdate {
  table: string
  data: Record<string, any>
  filters: Record<string, any>
}

export interface DatabaseDelete {
  table: string
  filters: Record<string, any>
}

export class MCPDatabaseService {
  private static instance: MCPDatabaseService
  private cache = new Map<string, { data: any; timestamp: number }>()
  private readonly CACHE_TTL = 30000 // 30 seconds

  private constructor() {}

  static getInstance(): MCPDatabaseService {
    if (!MCPDatabaseService.instance) {
      MCPDatabaseService.instance = new MCPDatabaseService()
    }
    return MCPDatabaseService.instance
  }

  /**
   * Execute a SELECT query using MCP tools
   */
  async select(query: DatabaseQuery): Promise<any[]> {
    try {
      const cacheKey = this.generateCacheKey(query)
      const cached = this.getCached(cacheKey)
      if (cached) return cached

      const sql = this.buildSelectQuery(query)
      const result = await this.executeSQL(sql)
      
      this.setCache(cacheKey, result)
      return result
    } catch (error) {
      console.error('MCP Database Service - Select Error:', error)
      throw error
    }
  }

  /**
   * Execute an INSERT query using MCP tools
   */
  async insert(insert: DatabaseInsert): Promise<any> {
    try {
      const sql = this.buildInsertQuery(insert)
      return await this.executeSQL(sql)
    } catch (error) {
      console.error('MCP Database Service - Insert Error:', error)
      throw error
    }
  }

  /**
   * Execute an UPDATE query using MCP tools
   */
  async update(update: DatabaseUpdate): Promise<any> {
    try {
      const sql = this.buildUpdateQuery(update)
      return await this.executeSQL(sql)
    } catch (error) {
      console.error('MCP Database Service - Update Error:', error)
      throw error
    }
  }

  /**
   * Execute a DELETE query using MCP tools
   */
  async delete(deleteQuery: DatabaseDelete): Promise<any> {
    try {
      const sql = this.buildDeleteQuery(deleteQuery)
      return await this.executeSQL(sql)
    } catch (error) {
      console.error('MCP Database Service - Delete Error:', error)
      throw error
    }
  }

  /**
   * Execute raw SQL using MCP tools
   */
  async executeSQL(sql: string, params?: any[]): Promise<any> {
    try {
      const { mcp_supabase_execute_sql } = await import('@/lib/mcp/supabase-mcp')
      
      if (params && params.length > 0) {
        // For parameterized queries, we need to construct the query with parameters
        let parameterizedQuery = sql
        params.forEach((param, index) => {
          const placeholder = `$${index + 1}`
          parameterizedQuery = parameterizedQuery.replace(placeholder, `'${param}'`)
        })
        return await mcp_supabase_execute_sql({ query: parameterizedQuery })
      } else {
        return await mcp_supabase_execute_sql({ query: sql })
      }
    } catch (error) {
      console.error('MCP Database Service - SQL Execution Error:', error)
      throw error
    }
  }

  /**
   * Get table information using MCP tools
   */
  async getTableInfo(tableName: string): Promise<any> {
    try {
      const sql = `
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = '${tableName}' 
        AND table_schema = 'public'
        ORDER BY ordinal_position
      `
      return await this.executeSQL(sql)
    } catch (error) {
      console.error('MCP Database Service - Table Info Error:', error)
      throw error
    }
  }

  /**
   * Get all tables using MCP tools
   */
  async getAllTables(): Promise<any[]> {
    try {
      const sql = `
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
        ORDER BY table_name
      `
      return await this.executeSQL(sql)
    } catch (error) {
      console.error('MCP Database Service - Get Tables Error:', error)
      throw error
    }
  }

  private buildSelectQuery(query: DatabaseQuery): string {
    let sql = `SELECT ${query.select?.join(', ') || '*'} FROM ${query.table}`
    
    if (query.filters) {
      const conditions = Object.entries(query.filters)
        .map(([key, value]) => `${key} = '${value}'`)
        .join(' AND ')
      sql += ` WHERE ${conditions}`
    }
    
    if (query.orderBy) {
      sql += ` ORDER BY ${query.orderBy.column} ${query.orderBy.ascending ? 'ASC' : 'DESC'}`
    }
    
    if (query.limit) {
      sql += ` LIMIT ${query.limit}`
    }
    
    if (query.offset) {
      sql += ` OFFSET ${query.offset}`
    }
    
    return sql
  }

  private buildInsertQuery(insert: DatabaseInsert): string {
    const isArray = Array.isArray(insert.data)
    const data = isArray ? insert.data as Record<string, any>[] : [insert.data as Record<string, any>]
    
    if (data.length === 0) {
      throw new Error('No data provided for insert')
    }
    
    const columns = Object.keys(data[0])
    const values = data.map((row: Record<string, any>) => 
      `(${columns.map(col => `'${row[col]}'`).join(', ')})`
    ).join(', ')
    
    let sql = `INSERT INTO ${insert.table} (${columns.join(', ')}) VALUES ${values}`
    
    if (insert.onConflict) {
      sql += ` ON CONFLICT (${insert.onConflict}) DO UPDATE SET `
      sql += columns.map(col => `${col} = EXCLUDED.${col}`).join(', ')
    }
    
    return sql
  }

  private buildUpdateQuery(update: DatabaseUpdate): string {
    const setClause = Object.entries(update.data)
      .map(([key, value]) => `${key} = '${value}'`)
      .join(', ')
    
    const whereClause = Object.entries(update.filters)
      .map(([key, value]) => `${key} = '${value}'`)
      .join(' AND ')
    
    return `UPDATE ${update.table} SET ${setClause} WHERE ${whereClause}`
  }

  private buildDeleteQuery(deleteQuery: DatabaseDelete): string {
    const whereClause = Object.entries(deleteQuery.filters)
      .map(([key, value]) => `${key} = '${value}'`)
      .join(' AND ')
    
    return `DELETE FROM ${deleteQuery.table} WHERE ${whereClause}`
  }

  private generateCacheKey(query: DatabaseQuery): string {
    return `query:${JSON.stringify(query)}`
  }

  private getCached(key: string): any | null {
    const cached = this.cache.get(key)
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data
    }
    return null
  }

  private setCache(key: string, data: any): void {
    this.cache.set(key, { data, timestamp: Date.now() })
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear()
  }

  /**
   * Health check using MCP tools
   */
  async healthCheck(): Promise<{ status: string; tables: number; timestamp: string }> {
    try {
      const tables = await this.getAllTables()
      return {
        status: 'healthy',
        tables: tables.length,
        timestamp: new Date().toISOString()
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        tables: 0,
        timestamp: new Date().toISOString()
      }
    }
  }
}

// Export singleton instance
export const mcpDatabaseService = MCPDatabaseService.getInstance()
