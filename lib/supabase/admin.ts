
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const globalForSupabase = globalThis as unknown as {
  supabaseAdmin: SupabaseClient | undefined;
};

const supabaseAdmin = globalForSupabase.supabaseAdmin ?? createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

if (process.env.NODE_ENV !== 'production') {
  globalForSupabase.supabaseAdmin = supabaseAdmin;
}

export { supabaseAdmin };
