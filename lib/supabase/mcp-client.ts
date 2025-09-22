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
    return await mcpExecuteSql({ query })
  }

  async listTables(schemas: string[] = ['public']): Promise<any[]> {
    return await mcpListTables({ schemas })
  }

  async applyMigration(name: string, query: string): Promise<any> {
    return await mcpApplyMigration({ name, query })
  }

  async getProjectUrl(): Promise<string> {
    try {
      const url = await mcpGetProjectUrl({ random_string: 'x' })
      if (typeof url === 'string' && url.length > 0) return url
    } catch {}
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
    return await mcpGetLogs({ service })
  }

  async listMigrations(): Promise<any[]> {
    return await mcpListMigrations({ random_string: 'x' })
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
