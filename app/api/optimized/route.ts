/**
 * Optimized API Route
 * Uses enhanced rate limiting, optimized storage, and efficient caching
 */

import { NextRequest, NextResponse } from 'next/server'
import { enhancedRateLimiter } from '@/lib/services/enhanced-rate-limiter'
import { optimizedSportsStorage } from '@/lib/services/optimized-sports-storage'
import { apiFallbackStrategy } from '@/lib/services/api-fallback-strategy'
import { schemaMigrations } from '@/lib/database/schema-migrations'
import { supabaseMCPClient } from '@/lib/supabase/mcp-client'
import { SportConfigManager } from '@/lib/services/core/sport-config'

export async function GET(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action') || 'games'
    const sport = searchParams.get('sport')
    const league = searchParams.get('league')
    const date = searchParams.get('date')
    const status = searchParams.get('status')
    const useCache = searchParams.get('cache') !== 'false'
    const forceRefresh = searchParams.get('refresh') === 'true'

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
    let source = 'database'
    let cached = false

    try {
      switch (action) {
        case 'games':
          if (useCache && !forceRefresh) {
            const cachedResult = await optimizedSportsStorage.getGames(sport, league || undefined, date || undefined, status || undefined)
            if (cachedResult.data.length > 0) {
              data = cachedResult.data
              source = cachedResult.source
              cached = true
            }
          }

          if (!cached || forceRefresh) {
            // Fetch from external APIs
            const fallbackResult = await apiFallbackStrategy.executeWithFallback({
              sport,
              dataType: 'games',
              params: { date, status, league },
              priority: 'medium'
            })

            if (fallbackResult.success && fallbackResult.data) {
              data = fallbackResult.data
              source = 'api'
              
              // Store in database for future use
              await optimizedSportsStorage.storeGames(sport, league || 'default', Array.isArray(fallbackResult.data) ? fallbackResult.data : [])
            }
          }
          break

        case 'teams':
          if (useCache && !forceRefresh) {
            const cachedResult = await optimizedSportsStorage.getTeams(sport, league || undefined)
            if (cachedResult.data.length > 0) {
              data = cachedResult.data
              source = cachedResult.source
              cached = true
            }
          }

          if (!cached || forceRefresh) {
            const fallbackResult = await apiFallbackStrategy.executeWithFallback({
              sport,
              dataType: 'teams',
              params: { league },
              priority: 'low'
            })

            if (fallbackResult.success && fallbackResult.data) {
              data = fallbackResult.data
              source = 'api'
              
              await optimizedSportsStorage.storeTeams(sport, league || 'default', Array.isArray(fallbackResult.data) ? fallbackResult.data : [])
            }
          }
          break

        case 'players':
          const teamId = searchParams.get('teamId')
          const limit = parseInt(searchParams.get('limit') || '100')

          if (useCache && !forceRefresh) {
            const cachedResult = await optimizedSportsStorage.getPlayers(sport, teamId || undefined, limit)
            if (cachedResult.data.length > 0) {
              data = cachedResult.data
              source = cachedResult.source
              cached = true
            }
          }

          if (!cached || forceRefresh) {
            const fallbackResult = await apiFallbackStrategy.executeWithFallback({
              sport,
              dataType: 'players',
              params: { teamId, limit },
              priority: 'low'
            })

            if (fallbackResult.success && fallbackResult.data) {
              data = fallbackResult.data
              source = 'api'
              
              await optimizedSportsStorage.storePlayers(sport, league || 'default', Array.isArray(fallbackResult.data) ? fallbackResult.data : [])
            }
          }
          break

        case 'standings':
          const season = searchParams.get('season')

          if (useCache && !forceRefresh) {
            const cachedResult = await optimizedSportsStorage.getStandings(sport, league || 'default', season || undefined)
            if (cachedResult.data.length > 0) {
              data = cachedResult.data
              source = cachedResult.source
              cached = true
            }
          }

          if (!cached || forceRefresh) {
            const fallbackResult = await apiFallbackStrategy.executeWithFallback({
              sport,
              dataType: 'standings',
              params: { league, season },
              priority: 'low'
            })

            if (fallbackResult.success && fallbackResult.data) {
              data = fallbackResult.data
              source = 'api'
              
              // Store standings data
              await optimizedSportsStorage.storeStandings(sport, league || 'default', Array.isArray(fallbackResult.data) ? fallbackResult.data : [])
            }
          }
          break

        case 'health':
          const healthStatus = await enhancedRateLimiter.getRateLimitStatus('optimized-api')
          const storageStats = await optimizedSportsStorage.getStorageStats()
          
          data = {
            rateLimits: healthStatus,
            storage: storageStats,
            timestamp: new Date().toISOString()
          }
          break

        case 'migrate':
          const migrationResult = await schemaMigrations.runAllMigrations()
          data = migrationResult
          break

        default:
          return NextResponse.json({
            success: false,
            error: `Invalid action: ${action}. Supported actions: games, teams, players, standings, health, migrate`
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
          cached,
          responseTime,
          timestamp: new Date().toISOString(),
          rateLimit: {
            remaining: rateLimitResult.remaining,
            resetTime: rateLimitResult.resetTime
          }
        }
      })

    } catch (error) {
      console.error(`Error in optimized API ${action}:`, error)
      
      return NextResponse.json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        meta: {
          action,
          sport,
          league,
          responseTime: Date.now() - startTime,
          timestamp: new Date().toISOString()
        }
      }, { status: 500 })
    }

  } catch (error) {
    console.error('Optimized API error:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      meta: {
        responseTime: Date.now() - startTime,
        timestamp: new Date().toISOString()
      }
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    const body = await request.json()
    const { action, data: requestData, ...directData } = body

    // Use directData if requestData is not provided (for backward compatibility)
    const data = requestData || directData

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

    let result: any = null

    switch (action) {
      case 'store-games':
        const { sport, league, games } = data
        await optimizedSportsStorage.storeGames(sport, league, games)
        result = { message: `Stored ${games.length} games for ${sport}/${league}` }
        break

      case 'store-teams':
        const { sport: teamSport, league: teamLeague, teams } = data
        await optimizedSportsStorage.storeTeams(teamSport, teamLeague, teams)
        result = { message: `Stored ${teams.length} teams for ${teamSport}/${teamLeague}` }
        break

      case 'store-players':
        const { sport: playerSport, league: playerLeague, players } = data
        await optimizedSportsStorage.storePlayers(playerSport, playerLeague, players)
        result = { message: `Stored ${players.length} players for ${playerSport}/${playerLeague}` }
        break

      case 'clear-cache':
        const { sport: clearSport } = data
        if (clearSport) {
          await optimizedSportsStorage.clearOldData(clearSport, 7) // Clear data older than 7 days
          result = { message: `Cleared old data for ${clearSport}` }
        } else {
          // Clear all old data using dynamic sports list
          let sports: string[] = []
          try {
            const rows = await supabaseMCPClient.executeSQL("SELECT name FROM sports WHERE is_active = true")
            if (Array.isArray(rows) && rows.length > 0) {
              sports = rows.map((r: any) => r.name).filter((n: unknown): n is string => typeof n === 'string' && n.length > 0)
            }
          } catch (_) {
            // Ignore and fallback
          }

          if (sports.length === 0) {
            // Fallback to config manager list (env/config driven)
            try {
              sports = SportConfigManager.getSupportedSports()
            } catch (_) {
              sports = []
            }
          }

          for (const s of sports) {
            await optimizedSportsStorage.clearOldData(s, 7)
          }
          result = { message: `Cleared old data for ${sports.length > 0 ? sports.join(', ') : 'no sports (none configured)'}` }
        }
        break

      case 'get-stats':
        const stats = await optimizedSportsStorage.getStorageStats()
        result = stats
        break

      default:
        return NextResponse.json({
          success: false,
          error: `Invalid action: ${action}. Supported actions: store-games, store-teams, store-players, clear-cache, get-stats`
        }, { status: 400 })
    }

    const responseTime = Date.now() - startTime

    return NextResponse.json({
      success: true,
      data: result,
      meta: {
        action,
        responseTime,
        timestamp: new Date().toISOString(),
        rateLimit: {
          remaining: rateLimitResult.remaining,
          resetTime: rateLimitResult.resetTime
        }
      }
    })

  } catch (error) {
    console.error('Optimized API POST error:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      meta: {
        responseTime: Date.now() - startTime,
        timestamp: new Date().toISOString()
      }
    }, { status: 500 })
  }
}
