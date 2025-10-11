// @ts-nocheck
/**
 * Supabase Edge Function for Querying Games
 * Replaces all direct Supabase client calls for game data
 * Sport-agnostic implementation with dynamic filtering
 */

/// <reference path="./types.d.ts" />

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface GameQueryParams {
  sport?: string
  league?: string
  status?: string
  dateFrom?: string
  dateTo?: string
  limit?: number
  offset?: number
}

interface GameResponse {
  success: boolean
  data: any[]
  meta: {
    count: number
    sport?: string
    league?: string
    status?: string
    dateRange?: { from: string; to: string }
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
    const params: GameQueryParams = {
      sport: url.searchParams.get('sport') || undefined,
      league: url.searchParams.get('league') || undefined,
      status: url.searchParams.get('status') || undefined,
      dateFrom: url.searchParams.get('dateFrom') || undefined,
      dateTo: url.searchParams.get('dateTo') || undefined,
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
    let query = supabase.from('games').select('*')

    // Apply filters dynamically - NO hardcoded sport logic
    if (params.sport) {
      query = query.eq('sport', params.sport)
    }

    if (params.league) {
      query = query.eq('league_name', params.league)
    }

    if (params.status) {
      query = query.eq('status', params.status)
    }

    if (params.dateFrom) {
      query = query.gte('game_date', params.dateFrom)
    }

    if (params.dateTo) {
      query = query.lte('game_date', params.dateTo)
    }

    // Apply ordering and pagination
    query = query
      .order('game_date', { ascending: false })
      .order('game_time_local', { ascending: true })
      .range(params.offset, params.offset + params.limit - 1)

    // Execute query
    const { data: games, error, count } = await query

    if (error) {
      console.error('Games query error:', error)
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
      count: games?.length || 0,
      sport: params.sport,
      league: params.league,
      status: params.status,
      dateRange: params.dateFrom && params.dateTo ? { from: params.dateFrom, to: params.dateTo } : undefined,
      limit: params.limit,
      offset: params.offset,
    }

    const response: GameResponse = {
      success: true,
      data: games || [],
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
