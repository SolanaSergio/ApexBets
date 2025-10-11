// @ts-nocheck
/**
 * Supabase Edge Function for Querying Players
 * Replaces all direct Supabase client calls for player data
 * Sport-agnostic implementation with dynamic filtering
 */

/// <reference path="./types.d.ts" />

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PlayerQueryParams {
  sport?: string
  teamId?: string
  teamName?: string
  search?: string
  position?: string
  limit?: number
  offset?: number
}

interface PlayerResponse {
  success: boolean
  data: any[]
  meta: {
    count: number
    sport?: string
    teamId?: string
    teamName?: string
    search?: string
    position?: string
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
    const params: PlayerQueryParams = {
      sport: url.searchParams.get('sport') || undefined,
      teamId: url.searchParams.get('teamId') || undefined,
      teamName: url.searchParams.get('teamName') || undefined,
      search: url.searchParams.get('search') || undefined,
      position: url.searchParams.get('position') || undefined,
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
    let query = supabase.from('players').select('*')

    // Apply filters dynamically - NO hardcoded sport logic
    if (params.sport) {
      query = query.eq('sport', params.sport)
    }

    if (params.teamId) {
      query = query.eq('team_id', params.teamId)
    }

    if (params.teamName) {
      query = query.eq('team_name', params.teamName)
    }

    if (params.position) {
      query = query.eq('position', params.position)
    }

    if (params.search) {
      // Search in player name
      query = query.ilike('name', `%${params.search}%`)
    }

    // Apply ordering and pagination
    query = query
      .order('name', { ascending: true })
      .range(params.offset, params.offset + params.limit - 1)

    // Execute query
    const { data: players, error } = await query

    if (error) {
      console.error('Players query error:', error)
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
      count: players?.length || 0,
      sport: params.sport,
      teamId: params.teamId,
      teamName: params.teamName,
      search: params.search,
      position: params.position,
      limit: params.limit,
      offset: params.offset,
    }

    const response: PlayerResponse = {
      success: true,
      data: players || [],
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
