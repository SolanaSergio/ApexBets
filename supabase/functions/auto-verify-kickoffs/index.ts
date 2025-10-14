import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Schedules should be configured in Supabase dashboard to call this function periodically
// This function will trigger verify refreshes for sports that have games starting now (within grace window)

Deno.serve(async req => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    const supabase = createClient(supabaseUrl, anonKey)

    // Find sports to verify now (active sports)
    const { data: sports } = await supabase
      .from('sports')
      .select('name, grace_window_minutes')
      .eq('is_active', true)

    const nowIso = new Date().toISOString()

    // For each sport, find games starting within +/- grace window and trigger verify endpoint
    const verifyCalls: Promise<Response>[] = []
    for (const s of sports ?? []) {
      const windowMin = typeof s.grace_window_minutes === 'number' ? s.grace_window_minutes : 15
      const past = new Date(Date.now() - windowMin * 60 * 1000).toISOString()
      const future = new Date(Date.now() + 1 * 60 * 1000).toISOString()

      const { data: games } = await supabase
        .from('games')
        .select('id')
        .eq('sport', s.name)
        .gte('game_date', past)
        .lte('game_date', future)
        .limit(1)

      if (games && games.length > 0) {
        const appUrl = Deno.env.get('APP_BASE_URL') ?? '' // set to your app base URL
        if (appUrl) {
          verifyCalls.push(fetch(`${appUrl}/api/live-updates?sport=${encodeURIComponent(s.name)}&verify=true`))
        }
      }
    }

    const results = await Promise.allSettled(verifyCalls)

    return new Response(
      JSON.stringify({ success: true, triggered: results.length, timestamp: nowIso }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (e) {
    return new Response(JSON.stringify({ success: false, error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})


