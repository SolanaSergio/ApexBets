// @ts-nocheck
/**
 * Supabase Edge Function for Querying Standings
 * Replaces all direct Supabase client calls for standings data
 * Sport-agnostic implementation with dynamic filtering
 */

/// <reference path="./types.d.ts" />

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface StandingsQueryParams {
  sport?: string
  league?: string
  season?: string
  limit?: number
  offset?: number
}

interface StandingsResponse {
  success: boolean
  data: any[]
  meta: {
    count: number
    sport?: string
    league?: string
    season?: string
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
    const params: StandingsQueryParams = {
      sport: url.searchParams.get('sport') || undefined,
      league: url.searchParams.get('league') || undefined,
      season: url.searchParams.get('season') || undefined,
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
    let query = supabase.from('league_standings').select('*')

    // Apply filters dynamically - NO hardcoded sport logic
    if (params.sport) {
      query = query.eq('sport', params.sport)
    }

    if (params.league) {
      query = query.eq('league_name', params.league)
    }

    if (params.season) {
      query = query.eq('season', params.season)
    }

    // Apply ordering and pagination
    query = query
      .order('position', { ascending: true })
      .range(params.offset, params.offset + params.limit - 1)

    // Execute query
    const { data: standings, error } = await query

    if (error) {
      console.error('Standings query error:', error)
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
      count: standings?.length || 0,
      sport: params.sport,
      league: params.league,
      season: params.season,
      limit: params.limit,
      offset: params.offset,
    }

    const response: StandingsResponse = {
      success: true,
      data: standings || [],
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
