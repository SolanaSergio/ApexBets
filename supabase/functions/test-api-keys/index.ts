import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async req => {
  try {
    // Test API key access
    const ballDontLieKey = Deno.env.get('NEXT_PUBLIC_BALLDONTLIE_API_KEY')
    const rapidApiKey = Deno.env.get('NEXT_PUBLIC_RAPIDAPI_KEY')
    const sportsDbKey = Deno.env.get('NEXT_PUBLIC_SPORTSDB_API_KEY')
    const oddsApiKey = Deno.env.get('NEXT_PUBLIC_ODDS_API_KEY')

    const result = {
      success: true,
      apiKeys: {
        ballDontLie: ballDontLieKey ? 'SET' : 'NOT SET',
        rapidApi: rapidApiKey ? 'SET' : 'NOT SET',
        sportsDb: sportsDbKey ? 'SET' : 'NOT SET',
        oddsApi: oddsApiKey ? 'SET' : 'NOT SET',
      },
      timestamp: new Date().toISOString(),
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
