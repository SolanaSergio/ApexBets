/**
 * Optimized API Route - Production Version
 * Uses direct Supabase client for production
 */

import { NextRequest, NextResponse } from 'next/server'
import { enhancedRateLimiter } from '@/lib/services/enhanced-rate-limiter'
import { productionSupabaseClient } from '@/lib/supabase/production-client'

export async function GET(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action') || 'games'
    const sport = searchParams.get('sport')
    const league = searchParams.get('league')
    const date = searchParams.get('date')
    const status = searchParams.get('status')

    if (!sport) {
      return NextResponse.json({
        success: false,
        error: 'Sport parameter is required'
      }, { status: 400 })
    }

    // Check rate limits
    const rateLimitResult = await enhancedRateLimiter.checkRateLimit('optimized-api', action)
    if (!rateLimitResult.allowed) {
      return NextResponse.json({
        success: false,
        error: 'Rate limit exceeded',
        retryAfter: rateLimitResult.retryAfter
      }, { 
        status: 429,
        headers: {
          'Retry-After': rateLimitResult.retryAfter?.toString() || '60',
          'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
          'X-RateLimit-Reset': rateLimitResult.resetTime.toString()
        }
      })
    }

    let data: any = null
    const source = 'database'

    try {
      switch (action) {
        case 'games':
          data = await productionSupabaseClient.getGames(sport, league || undefined, date || undefined, status || undefined)
          break

        case 'teams':
          data = await productionSupabaseClient.getTeams(sport, league || undefined)
          break

        case 'players':
          const teamId = searchParams.get('teamId')
          const limit = parseInt(searchParams.get('limit') || '100')
          data = await productionSupabaseClient.getPlayers(sport, teamId || undefined, limit)
          break

        case 'standings':
          const season = searchParams.get('season')
          data = await productionSupabaseClient.getStandings(sport, league || undefined, season || undefined)
          break

        case 'odds':
          const gameId = searchParams.get('gameId')
          const oddsLimit = parseInt(searchParams.get('limit') || '10')
          data = await productionSupabaseClient.getOdds(sport, gameId || undefined, oddsLimit)
          break

        case 'health':
          const healthStatus = await enhancedRateLimiter.getRateLimitStatus('optimized-api')
          
          data = {
            rateLimits: healthStatus,
            database: {
              connected: productionSupabaseClient.isConnected()
            },
            timestamp: new Date().toISOString()
          }
          break

        default:
          return NextResponse.json({
            success: false,
            error: `Invalid action: ${action}. Supported actions: games, teams, players, standings, odds, health`
          }, { status: 400 })
      }

      const responseTime = Date.now() - startTime

      return NextResponse.json({
        success: true,
        data: data || [],
        meta: {
          action,
          sport,
          league,
          source,
          responseTime,
          timestamp: new Date().toISOString(),
          rateLimit: {
            remaining: rateLimitResult.remaining,
            resetTime: rateLimitResult.resetTime
          }
        }
      })

    } catch (actionError) {
      console.error(`Error in ${action} action:`, actionError)
      
      return NextResponse.json({
        success: false,
        error: `Failed to fetch ${action}`,
        details: actionError instanceof Error ? actionError.message : String(actionError),
        meta: {
          action,
          sport,
          league,
          responseTime: Date.now() - startTime
        }
      }, { status: 500 })
    }

  } catch (error) {
    console.error('Optimized API error:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error),
      meta: {
        responseTime: Date.now() - startTime
      }
    }, { status: 500 })
  }
}