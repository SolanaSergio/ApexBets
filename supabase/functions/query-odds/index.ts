// @ts-nocheck
/**
 * Supabase Edge Function for Querying Odds
 * Replaces all direct Supabase client calls for odds data
 * Sport-agnostic implementation with dynamic filtering
 */

/// <reference path="./types.d.ts" />

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface OddsQueryParams {
  sport?: string
  gameId?: string
  bookmaker?: string
  market?: string
  limit?: number
  offset?: number
}

interface OddsResponse {
  success: boolean
  data: any[]
  meta: {
    count: number
    sport?: string
    gameId?: string
    bookmaker?: string
    market?: string
    limit: number
    offset: number
  }
  error?: string
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Parse query parameters
    const url = new URL(req.url)
    const params: OddsQueryParams = {
      sport: url.searchParams.get('sport') || undefined,
      gameId: url.searchParams.get('gameId') || undefined,
      bookmaker: url.searchParams.get('bookmaker') || undefined,
      market: url.searchParams.get('market') || undefined,
      limit: parseInt(url.searchParams.get('limit') || '100'),
      offset: parseInt(url.searchParams.get('offset') || '0'),
    }

    // Validate parameters
    if (params.limit && (params.limit < 1 || params.limit > 1000)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Limit must be between 1 and 1000',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    if (params.offset && params.offset < 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Offset must be non-negative',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Build query dynamically based on parameters
    let query = supabase.from('odds').select('*')

    // Apply filters dynamically - NO hardcoded sport logic
    if (params.sport) {
      query = query.eq('sport', params.sport)
    }

    if (params.gameId) {
      query = query.eq('game_id', params.gameId)
    }

    if (params.bookmaker) {
      query = query.eq('bookmaker', params.bookmaker)
    }

    if (params.market) {
      query = query.eq('market', params.market)
    }

    // Apply ordering and pagination
    query = query
      .order('updated_at', { ascending: false })
      .range(params.offset, params.offset + params.limit - 1)

    // Execute query
    const { data: odds, error } = await query

    if (error) {
      console.error('Odds query error:', error)
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Database query failed',
          details: error.message,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    // Build response metadata
    const meta = {
      count: odds?.length || 0,
      sport: params.sport,
      gameId: params.gameId,
      bookmaker: params.bookmaker,
      market: params.market,
      limit: params.limit,
      offset: params.offset,
    }

    const response: OddsResponse = {
      success: true,
      data: odds || [],
      meta,
    }

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Edge function error:', error)

    return new Response(
      JSON.stringify({
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
