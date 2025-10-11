
import { createBrowserClient } from '@supabase/ssr'
import { envValidator } from '../config/env-validator'

export function createSupabaseClient() {
  const config = envValidator.getConfig()
  return createBrowserClient(config.NEXT_PUBLIC_SUPABASE_URL, config.NEXT_PUBLIC_SUPABASE_ANON_KEY)
}
