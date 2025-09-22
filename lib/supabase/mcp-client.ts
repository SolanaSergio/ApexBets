/**
 * Supabase MCP Client
 * Delegates to MCP wrapper functions. No direct DB RPCs or mock data.
 */

import { 
  mcp_supabase_execute_sql as mcpExecuteSql,
  mcp_supabase_list_tables as mcpListTables,
  mcp_supabase_apply_migration as mcpApplyMigration,
  mcp_supabase_get_logs as mcpGetLogs,
  mcp_supabase_list_migrations as mcpListMigrations,
  mcp_supabase_get_project_url as mcpGetProjectUrl
} from '../mcp/supabase-mcp'

export class SupabaseMCPClient {
  private static instance: SupabaseMCPClient

  private constructor() {}

  static getInstance(): SupabaseMCPClient {
    if (!SupabaseMCPClient.instance) {
      SupabaseMCPClient.instance = new SupabaseMCPClient()
    }
    return SupabaseMCPClient.instance
  }

  async executeSQL(query: string): Promise<any[]> {
    try {
      return await mcpExecuteSql({ query })
    } catch (error) {
      // Enforce MCP usage; do not fabricate data
      if (error instanceof Error && error.message.includes('MCP')) {
        throw new Error(`MCP execution failed: ${error.message}`)
      }
      throw error
    }
  }

  async listTables(schemas: string[] = ['public']): Promise<any[]> {
    try {
      return await mcpListTables({ schemas })
    } catch (error) {
      if (error instanceof Error && error.message.includes('MCP')) {
        throw new Error(`MCP listTables failed: ${error.message}`)
      }
      throw error
    }
  }

  async applyMigration(name: string, query: string): Promise<any> {
    try {
      return await mcpApplyMigration({ name, query })
    } catch (error) {
      if (error instanceof Error && error.message.includes('MCP')) {
        throw new Error(`MCP applyMigration failed: ${error.message}`)
      }
      throw error
    }
  }

  async getProjectUrl(): Promise<string> {
    try {
      const url = await mcpGetProjectUrl({ random_string: 'x' })
      if (typeof url === 'string' && url.length > 0) return url
    } catch (error) {
      if (error instanceof Error && error.message.includes('MCP')) {
        // Fall back to env only if present, per rules not to use placeholders
      }
    }
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      throw new Error('NEXT_PUBLIC_SUPABASE_URL is not set')
    }
    return process.env.NEXT_PUBLIC_SUPABASE_URL
  }

  async getAnonKey(): Promise<string> {
    if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY is not set')
    }
    return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  }

  async getLogs(service: string): Promise<any[]> {
    try {
      return await mcpGetLogs({ service })
    } catch (error) {
      if (error instanceof Error && error.message.includes('MCP')) {
        throw new Error(`MCP getLogs failed: ${error.message}`)
      }
      throw error
    }
  }

  async listMigrations(): Promise<any[]> {
    try {
      return await mcpListMigrations({ random_string: 'x' })
    } catch (error) {
      if (error instanceof Error && error.message.includes('MCP')) {
        throw new Error(`MCP listMigrations failed: ${error.message}`)
      }
      throw error
    }
  }

  isConnected(): boolean {
    // Best-effort: presence of required envs
    return !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY)
  }

  getConnectionStatus(): {
    connected: boolean
    url: string
    hasServiceKey: boolean
  } {
    return {
      connected: this.isConnected(),
      url: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY
    }
  }
}

export const supabaseMCPClient = SupabaseMCPClient.getInstance()
