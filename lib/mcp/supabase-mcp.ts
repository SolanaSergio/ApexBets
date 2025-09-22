/**
 * Supabase MCP Integration Wrapper
 * This module provides a clean interface to Supabase MCP tools
 * and ensures all database operations go through MCP instead of direct client calls
 */

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
  if (typeof globalThis.mcp_supabase_execute_sql === 'function') {
    return await globalThis.mcp_supabase_execute_sql(params)
  }
  console.warn('MCP execute_sql not available; returning empty result')
  return []
}

export async function mcp_supabase_list_tables(params: { schemas?: string[] }): Promise<any> {
  if (typeof globalThis.mcp_supabase_list_tables === 'function') {
    return await globalThis.mcp_supabase_list_tables(params)
  }
  console.warn('MCP list_tables not available; returning empty list')
  return []
}

export async function mcp_supabase_apply_migration(params: { name: string; query: string }): Promise<any> {
  if (typeof globalThis.mcp_supabase_apply_migration === 'function') {
    return await globalThis.mcp_supabase_apply_migration(params)
  }
  console.warn('MCP apply_migration not available; returning noop result')
  return { applied: false }
}

export async function mcp_supabase_get_logs(params: { service: string }): Promise<any> {
  if (typeof globalThis.mcp_supabase_get_logs === 'function') {
    return await globalThis.mcp_supabase_get_logs(params)
  }
  console.warn('MCP get_logs not available; returning empty logs')
  return []
}

// Additional MCP functions that might be needed
export async function mcp_supabase_list_migrations(params: { random_string: string }): Promise<any> {
  if (typeof globalThis.mcp_supabase_list_migrations === 'function') {
    return await globalThis.mcp_supabase_list_migrations(params)
  }
  console.warn('MCP list_migrations not available; returning empty list')
  return []
}

export async function mcp_supabase_get_project_url(params: { random_string: string }): Promise<any> {
  if (typeof globalThis.mcp_supabase_get_project_url === 'function') {
    return await globalThis.mcp_supabase_get_project_url(params)
  }
  console.warn('MCP get_project_url not available; using env variable')
  return process.env.NEXT_PUBLIC_SUPABASE_URL || ''
}
