import { createBrowserClient } from "@supabase/ssr"

/**
 * Client-side Supabase client for Project Apex
 * Use this in client components
 */
export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase environment variables not found. Returning null client.')
    return null
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}
