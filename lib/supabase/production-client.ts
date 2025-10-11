/**
 * Production Supabase Client - DEPRECATED
 * This file is deprecated. Use Edge Functions for all database operations.
 * 
 * @deprecated Use Edge Functions via edge-function-client.ts for database operations
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js'

export class ProductionSupabaseClient {
  private static instance: ProductionSupabaseClient
  private supabase: SupabaseClient | null = null
  private initialized: boolean = false

  private constructor() {
    console.warn('DEPRECATED: ProductionSupabaseClient is deprecated. Use Edge Functions for database operations.')
  }

  public static getInstance(): ProductionSupabaseClient {
    if (!ProductionSupabaseClient.instance) {
      ProductionSupabaseClient.instance = new ProductionSupabaseClient()
    }
    return ProductionSupabaseClient.instance
  }

  public async initialize(): Promise<void> {
    if (this.initialized) return

    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

      if (!supabaseUrl || !supabaseKey) {
        throw new Error('Missing Supabase environment variables')
      }

      this.supabase = createClient(supabaseUrl, supabaseKey)
      this.initialized = true
    } catch (error) {
      console.error('Failed to initialize ProductionSupabaseClient:', error)
      throw error
    }
  }

  public isConnected(): boolean {
    return this.initialized && this.supabase !== null
  }
}

export const productionSupabaseClient = ProductionSupabaseClient.getInstance()