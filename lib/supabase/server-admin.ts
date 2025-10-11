/**
 * DEPRECATED: Direct Supabase client usage is not allowed
 * All database operations use production client
 * This file is kept for backward compatibility but should not be used
 */

import { createClient } from '@supabase/supabase-js'
import { envValidator } from '../config/env-validator'

/**
 * @deprecated Use databaseService instead
 * Server-side Supabase client for admin operations
 * This client doesn't use cookies and can be used outside request context
 * Use this for server-side operations like startup services, monitoring, etc.
 */
export function createAdminClient() {
  console.warn('DEPRECATED: createAdminClient() is deprecated. Use databaseService instead.')

  const config = envValidator.getConfig()

  return createClient(config.NEXT_PUBLIC_SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

/**
 * @deprecated Use databaseService instead
 * Server-side Supabase client for regular operations
 * This client uses the anon key and can be used outside request context
 * Use this for read-only operations that don't require admin privileges
 */
export function createServerClient() {
  console.warn('DEPRECATED: createServerClient() is deprecated. Use databaseService instead.')

  const config = envValidator.getConfig()

  return createClient(config.NEXT_PUBLIC_SUPABASE_URL, config.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
