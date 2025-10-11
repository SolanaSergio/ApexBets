/**
 * Database Service - DEPRECATED
 * This file is deprecated. Use Edge Functions for all database operations.
 * 
 * @deprecated Use Edge Functions via edge-function-client.ts for database operations
 */

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

  private constructor() {
    console.warn('DEPRECATED: DatabaseService is deprecated. Use Edge Functions for database operations.')
  }

  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService()
    }
    return DatabaseService.instance
  }

  public isHealthy(): boolean {
    console.warn('DEPRECATED: DatabaseService.isHealthy() is deprecated. Use Edge Functions instead.')
    return false
  }

  /**
   * Health check using Edge Functions
   */
  async healthCheck(): Promise<boolean> {
    try {
      const { edgeFunctionClient } = await import('./edge-function-client')
      const result = await edgeFunctionClient.queryGames({ limit: 1 })
      return result.success
    } catch {
      return false
    }
  }

  /**
   * Get connection status using health check
   */
  async getConnectionStatus(): Promise<'connected' | 'disconnected' | 'error'> {
    const healthy = await this.healthCheck()
    return healthy ? 'connected' : 'disconnected'
  }
}

export const databaseService = DatabaseService.getInstance()