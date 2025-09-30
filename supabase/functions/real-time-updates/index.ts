import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
)

serve(async (_req) => {
  const channel = supabase.channel('db-changes')

  channel
    .on('postgres_changes', { event: '*', schema: 'public', table: 'games' }, (payload) => {
      console.log('Change received!', payload)
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'odds' }, (payload) => {
      console.log('Change received!', payload)
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'player_stats' }, (payload) => {
      console.log('Change received!', payload)
    })
    .subscribe()

  return new Response(JSON.stringify({ message: "Real-time updates enabled" }), {
    headers: { "Content-Type": "application/json" },
  })
})
