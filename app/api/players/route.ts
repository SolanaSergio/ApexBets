/**
 * PLAYERS API - DATABASE-FIRST APPROACH
 * Get players data from database with proper filtering
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { productionSupabaseClient } from '@/lib/supabase/production-client'
import { structuredLogger } from '@/lib/services/structured-logger'
import { getCache, setCache } from '@/lib/redis'

const CACHE_TTL = 60 // 1 minute

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sport = searchParams.get('sport')
    const teamId = searchParams.get('team_id')
    const league = searchParams.get('league')
    const position = searchParams.get('position')
    const isActive = searchParams.get('is_active')
    const limit = Number.parseInt(searchParams.get('limit') || '100')

    const cacheKey = `players-${sport}-${teamId}-${league}-${position}-${isActive}-${limit}`
    const cached = await getCache(cacheKey)
    if (cached) {
      return NextResponse.json(cached)
    }

    const supabase = await createClient()
    
    if (!supabase) {
      return NextResponse.json({ 
        success: false,
        error: "Database connection failed" 
      }, { status: 500 })
    }

    // Build query with proper filtering
    let query = supabase
      .from('players')
      .select(`
        *,
        team:teams!players_team_id_fkey(
          id, name, abbreviation, logo_url, city, league, sport
        )
      `)
      .order('name', { ascending: true })

    // Apply filters
    if (sport) {
      query = query.eq('sport', sport)
    }

    if (teamId) {
      query = query.eq('team_id', teamId)
    }

    if (league) {
      query = query.eq('team.league', league)
    }

    if (position) {
      query = query.eq('position', position)
    }

    if (isActive !== null) {
      query = query.eq('is_active', isActive === 'true')
    }

    if (limit > 0) {
      query = query.limit(limit)
    }

    const { data: players, error } = await query

    if (error) {
      structuredLogger.error('Players API database error', {
        error: error.message,
        sport,
        teamId,
        league,
        position
      })
      return NextResponse.json({ 
        success: false,
        error: "Failed to fetch players from database" 
      }, { status: 500 })
    }

    let processedPlayers = (players || []).map(player => ({
      ...player,
      team_name: player.team?.name || 'Free Agent',
      team_abbreviation: player.team?.abbreviation || '',
      team_logo: player.team?.logo_url || null,
      team_city: player.team?.city || '',
      team_league: player.team?.league || '',
      team_sport: player.team?.sport || sport
    }))

    // Fallback: if no rows in players table, derive from sport-specific stats tables
    if (processedPlayers.length === 0) {
      try {
        // If sport provided, try sport-specific tables; else iterate active sports
        const results: any[] = []
        if (sport) {
          const bySport = await productionSupabaseClient.getPlayers(sport, teamId || undefined, limit)
          results.push(...bySport)
        } else {
          const sportsRes = await productionSupabaseClient.executeSQL(`
            SELECT name FROM sports WHERE is_active = true ORDER BY display_name
          `)
          const sportNames: string[] = (sportsRes.success && Array.isArray(sportsRes.data))
            ? sportsRes.data.map((r: any) => r.name).filter(Boolean)
            : []
          for (const sName of sportNames) {
            if (results.length >= limit) break
            const chunk = await productionSupabaseClient.getPlayers(sName, teamId || undefined, Math.max(0, limit - results.length))
            results.push(...chunk)
          }
        }

        processedPlayers = results.slice(0, limit).map((p: any) => ({
          id: p.id,
          name: p.name,
          sport: p.sport,
          position: p.position || null,
          team_id: p.team_id || null,
          is_active: p.is_active ?? true,
          team_name: p.team_name ?? null,
          team_abbreviation: p.team_abbreviation || '',
          team_logo: p.team_logo || null,
          team_city: p.team_city || '',
          team_league: p.team_league || '',
          team_sport: p.sport || 'all'
        }))
      } catch (fallbackError) {
        structuredLogger.warn?.('Players API fallback failed', {
          error: fallbackError instanceof Error ? fallbackError.message : String(fallbackError),
          sport,
          teamId
        })
      }
    }

    // Calculate summary statistics
    const summary = {
      total: processedPlayers.length,
      byTeam: processedPlayers.reduce((acc, player) => {
        const teamName = player.team_name
        acc[teamName] = (acc[teamName] || 0) + 1
        return acc
      }, {} as Record<string, number>),
      byPosition: processedPlayers.reduce((acc, player) => {
        const pos = player.position ?? null
        acc[pos] = (acc[pos] || 0) + 1
        return acc
      }, {} as Record<string, number>),
      active: processedPlayers.filter(p => p.is_active).length,
      inactive: processedPlayers.filter(p => !p.is_active).length
    }

    structuredLogger.info('Players API request processed', {
      sport,
      teamId,
      league,
      position,
      count: processedPlayers.length,
      source: 'database'
    })

    const result = {
      success: true,
      data: processedPlayers,
      meta: {
        timestamp: new Date().toISOString(),
        sport: sport || 'all',
        league: league || 'all',
        count: processedPlayers.length,
        summary,
        source: 'database'
      }
    }

    await setCache(cacheKey, result, CACHE_TTL)

    return NextResponse.json(result)

  } catch (error) {
    structuredLogger.error('Players API error', {
      error: error instanceof Error ? error.message : String(error)
    })
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
