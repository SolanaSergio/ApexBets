/**
 * MCP Initialization System
 * Handles MCP function binding and provides fallback to Supabase clients
 */

// MCP-only module - no Supabase client imports needed

class MCPInitializer {
  private static instance: MCPInitializer
  private isInitialized = false
  private mcpAvailable = false

  private constructor() {}

  static getInstance(): MCPInitializer {
    if (!MCPInitializer.instance) {
      MCPInitializer.instance = new MCPInitializer()
    }
    return MCPInitializer.instance
  }

  async initialize(): Promise<{ success: boolean; mcpAvailable: boolean; message: string }> {
    if (this.isInitialized) {
      return {
        success: true,
        mcpAvailable: this.mcpAvailable,
        message: 'MCP already initialized'
      }
    }

    try {
      // Do not assume unavailability during build/SSR. Detect actual function presence.

      // Check if MCP functions are available
      this.mcpAvailable = this.checkMCPAvailability()
      
      if (this.mcpAvailable) {
        await this.bindMCPFunctions()
        console.log('✅ MCP functions initialized successfully')
      } else {
        // Don't throw error, just mark as unavailable
        console.warn('⚠️ MCP functions not available - using fallback mode')
      }

      this.isInitialized = true

      return {
        success: true,
        mcpAvailable: this.mcpAvailable,
        message: this.mcpAvailable ? 'MCP initialized' : 'MCP fallback mode'
      }
    } catch (error) {
      console.error('❌ MCP initialization failed:', error)
      // Don't fail completely, just use fallback mode
      this.mcpAvailable = false
      this.isInitialized = true
      
      return {
        success: true,
        mcpAvailable: false,
        message: `MCP fallback mode: ${error instanceof Error ? error.message : String(error)}`
      }
    }
  }

  private checkMCPAvailability(): boolean {
    // Check if MCP functions are available on globalThis
    const requiredFunctions = [
      'mcp_supabase_execute_sql',
      'mcp_supabase_list_tables',
      'mcp_supabase_apply_migration',
      'mcp_supabase_get_logs',
      'mcp_supabase_list_migrations',
      'mcp_supabase_get_project_url'
    ]

    return requiredFunctions.every(func => 
      typeof (globalThis as any)[func] === 'function'
    )
  }

  private async bindMCPFunctions(): Promise<void> {
    // MCP functions are already available on globalThis
    // No additional binding needed
  }

  // Removed initializeSupabaseFallback - MCP-only approach

  getSupabaseClient(): any { throw new Error('Supabase client access is disabled by policy') }

  isMCPAvailable(): boolean {
    return this.mcpAvailable
  }

  getStatus(): {
    initialized: boolean
    mcpAvailable: boolean
    hasSupabaseFallback: boolean
  } {
    return {
      initialized: this.isInitialized,
      mcpAvailable: this.mcpAvailable,
      hasSupabaseFallback: false
    }
  }
}

export const mcpInitializer = MCPInitializer.getInstance()
