/**
 * Simple SQL Parser for MCP Fallback
 * Parses basic SQL queries and converts them to Supabase client calls
 */

export interface ParsedQuery {
  type: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE' | 'UNKNOWN'
  table?: string
  columns?: string[]
  where?: string
  limit?: number
  orderBy?: string
}

export class SQLParser {
  static parse(query: string): ParsedQuery {
    const trimmed = query.trim().toUpperCase()
    
    if (trimmed.startsWith('SELECT')) {
      return this.parseSelect(query)
    }
    
    return { type: 'UNKNOWN' }
  }
  
  private static parseSelect(query: string): ParsedQuery {
    const result: ParsedQuery = { type: 'SELECT' }
    
    // Handle special cases like SELECT 1, SELECT NOW(), etc.
    if (query.match(/SELECT\s+\d+\s*$/i) || query.match(/SELECT\s+\d+\s+as\s+\w+/i)) {
      result.table = 'sports' // Use a default table for simple SELECT statements
      result.columns = ['*']
      return result
    }
    
    // Extract table name (simplified regex)
    const fromMatch = query.match(/FROM\s+(\w+)/i)
    if (fromMatch) {
      result.table = fromMatch[1]
    }
    
    // Extract columns
    const selectMatch = query.match(/SELECT\s+(.*?)\s+FROM/i)
    if (selectMatch) {
      const columnsStr = selectMatch[1]
      if (columnsStr === '*') {
        result.columns = ['*']
      } else {
        result.columns = columnsStr.split(',').map(col => col.trim())
      }
    }
    
    // Extract WHERE clause
    const whereMatch = query.match(/WHERE\s+(.*?)(?:\s+ORDER\s+BY|\s+LIMIT|$)/i)
    if (whereMatch) {
      result.where = whereMatch[1]
    }
    
    // Extract LIMIT
    const limitMatch = query.match(/LIMIT\s+(\d+)/i)
    if (limitMatch) {
      result.limit = parseInt(limitMatch[1])
    }
    
    // Extract ORDER BY
    const orderMatch = query.match(/ORDER\s+BY\s+(.*?)(?:\s+LIMIT|$)/i)
    if (orderMatch) {
      result.orderBy = orderMatch[1]
    }
    
    return result
  }
}
