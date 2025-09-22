/**
 * Supabase MCP Integration Wrapper
 * This module provides a clean interface to Supabase MCP tools
 * and ensures all database operations go through MCP instead of direct client calls
 * Falls back to direct Supabase client when MCP is not available
 */

// MCP-only module: no fallbacks or parsing needed

// Type definitions for MCP functions
interface MCPFunction {
  (params: any): Promise<any>
}

// Declare global MCP functions
declare global {
  // eslint-disable-next-line no-var
  var mcp_supabase_execute_sql: MCPFunction | undefined
  // eslint-disable-next-line no-var
  var mcp_supabase_list_tables: MCPFunction | undefined
  // eslint-disable-next-line no-var
  var mcp_supabase_apply_migration: MCPFunction | undefined
  // eslint-disable-next-line no-var
  var mcp_supabase_get_logs: MCPFunction | undefined
  // eslint-disable-next-line no-var
  var mcp_supabase_list_migrations: MCPFunction | undefined
  // eslint-disable-next-line no-var
  var mcp_supabase_get_project_url: MCPFunction | undefined
}

export async function mcp_supabase_execute_sql(params: { query: string }): Promise<any> {
  if (typeof globalThis.mcp_supabase_execute_sql !== 'function') {
    throw new Error('MCP execute_sql is not available')
  }
  return await globalThis.mcp_supabase_execute_sql(params)
}

export async function mcp_supabase_list_tables(params: { schemas?: string[] }): Promise<any> {
  if (typeof globalThis.mcp_supabase_list_tables !== 'function') {
    throw new Error('MCP list_tables is not available')
  }
  return await globalThis.mcp_supabase_list_tables(params)
}

export async function mcp_supabase_apply_migration(params: { name: string; query: string }): Promise<any> {
  if (typeof globalThis.mcp_supabase_apply_migration !== 'function') {
    throw new Error('MCP apply_migration is not available')
  }
  return await globalThis.mcp_supabase_apply_migration(params)
}

export async function mcp_supabase_get_logs(params: { service: string }): Promise<any> {
  if (typeof globalThis.mcp_supabase_get_logs !== 'function') {
    throw new Error('MCP get_logs is not available')
  }
  return await globalThis.mcp_supabase_get_logs(params)
}

// Additional MCP functions that might be needed
export async function mcp_supabase_list_migrations(params: { random_string: string }): Promise<any> {
  if (typeof globalThis.mcp_supabase_list_migrations !== 'function') {
    throw new Error('MCP list_migrations is not available')
  }
  return await globalThis.mcp_supabase_list_migrations(params)
}

export async function mcp_supabase_get_project_url(params: { random_string: string }): Promise<any> {
  if (typeof globalThis.mcp_supabase_get_project_url === 'function') {
    return await globalThis.mcp_supabase_get_project_url(params)
  }
  
  // Fallback to environment variable
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!url) {
    throw new Error('MCP get_project_url not available and NEXT_PUBLIC_SUPABASE_URL not set')
  }
  
  return url
}
