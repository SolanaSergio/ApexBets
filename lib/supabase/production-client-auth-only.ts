/**
 * Production Supabase Client - Auth Only
 * Minimal Supabase client for authentication only
 * All data operations should use Edge Functions
 */

import { createClient } from '@supabase/supabase-js'
import { structuredLogger } from '@/lib/services/structured-logger'

class ProductionSupabaseClientAuthOnly {
  private static instance: ProductionSupabaseClientAuthOnly
  public supabase: any
  private initialized: boolean = false

  private constructor() {
    // Server-side only - prevent browser instantiation
    if (typeof window !== 'undefined') {
      throw new Error('ProductionSupabaseClientAuthOnly can only be instantiated on the server side')
    }

    // Don't initialize during build phase or when environment variables are not available
    if (process.env.NEXT_PHASE === 'phase-production-build') {
      this.supabase = null
      this.initialized = false
      return
    }

    try {
      structuredLogger.info('Initializing ProductionSupabaseClientAuthOnly', {
        service: 'supabase-client-auth',
        step: 'constructor-start',
      })

      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

      if (!supabaseUrl || !supabaseServiceKey) {
        throw new Error('Missing required Supabase environment variables')
      }

      this.supabase = createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      })

      this.initialized = true
      structuredLogger.info('ProductionSupabaseClientAuthOnly initialized successfully', {
        service: 'supabase-client-auth',
        step: 'constructor-complete',
      })
    } catch (error) {
      structuredLogger.error('Failed to initialize ProductionSupabaseClientAuthOnly', {
        service: 'supabase-client-auth',
        error: error instanceof Error ? error.message : 'Unknown error',
        step: 'constructor-error',
      })
      this.supabase = null
      this.initialized = false
    }
  }

  public static getInstance(): ProductionSupabaseClientAuthOnly {
    if (!ProductionSupabaseClientAuthOnly.instance) {
      ProductionSupabaseClientAuthOnly.instance = new ProductionSupabaseClientAuthOnly()
    }
    return ProductionSupabaseClientAuthOnly.instance
  }

  public isConnected(): boolean {
    return this.initialized && this.supabase !== null
  }

  // Auth-only methods
  async getUser(userId: string) {
    if (!this.isConnected()) {
      throw new Error('Supabase client not connected')
    }

    try {
      const { data, error } = await this.supabase.auth.admin.getUserById(userId)
      if (error) throw error
      return data
    } catch (error) {
      structuredLogger.error('getUser failed', {
        service: 'supabase-client-auth',
        userId,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
      throw error
    }
  }

  async createUser(userData: any) {
    if (!this.isConnected()) {
      throw new Error('Supabase client not connected')
    }

    try {
      const { data, error } = await this.supabase.auth.admin.createUser(userData)
      if (error) throw error
      return data
    } catch (error) {
      structuredLogger.error('createUser failed', {
        service: 'supabase-client-auth',
        error: error instanceof Error ? error.message : 'Unknown error',
      })
      throw error
    }
  }

  async updateUser(userId: string, userData: any) {
    if (!this.isConnected()) {
      throw new Error('Supabase client not connected')
    }

    try {
      const { data, error } = await this.supabase.auth.admin.updateUserById(userId, userData)
      if (error) throw error
      return data
    } catch (error) {
      structuredLogger.error('updateUser failed', {
        service: 'supabase-client-auth',
        userId,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
      throw error
    }
  }

  async deleteUser(userId: string) {
    if (!this.isConnected()) {
      throw new Error('Supabase client not connected')
    }

    try {
      const { data, error } = await this.supabase.auth.admin.deleteUser(userId)
      if (error) throw error
      return data
    } catch (error) {
      structuredLogger.error('deleteUser failed', {
        service: 'supabase-client-auth',
        userId,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
      throw error
    }
  }

  // Utility method for Edge Function calls
  async callEdgeFunction(functionName: string, payload: any) {
    if (!this.isConnected()) {
      throw new Error('Supabase client not connected')
    }

    try {
      const { data, error } = await this.supabase.functions.invoke(functionName, {
        body: payload,
      })
      if (error) throw error
      return data
    } catch (error) {
      structuredLogger.error('Edge Function call failed', {
        service: 'supabase-client-auth',
        functionName,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
      throw error
    }
  }
}

export const productionSupabaseClientAuthOnly = ProductionSupabaseClientAuthOnly.getInstance()

// Backward compatibility - deprecated
export const productionSupabaseClient = productionSupabaseClientAuthOnly
