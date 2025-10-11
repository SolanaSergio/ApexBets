/**
 * Server-side Supabase client - Production ready
 * All database operations use production client
 * This file is kept for Next.js SSR compatibility but should not be used for data operations
 */

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { envValidator } from '../config/env-validator'

export async function createClient() {
  // Validate environment variables first
  const config = envValidator.getConfig()

  const cookieStore = await cookies()

  return createServerClient(config.NEXT_PUBLIC_SUPABASE_URL, config.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        } catch {
          // The `setAll` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions.
        }
      },
    },
  })
}

// WARNING: This client should only be used for authentication
// All data operations must use database service
