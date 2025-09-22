/**
 * UNIFIED API ROUTE
 * Provides a unified interface to all split services
 */

import { NextRequest, NextResponse } from 'next/server'
import { unifiedApiClient, SupportedSport } from '@/lib/services/api/unified-api-client'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action') || 'sports'
    const sport = searchParams.get('sport') as SupportedSport
    const league = searchParams.get('league') || undefined
    const limit = parseInt(searchParams.get('limit') || '10')
    const date = searchParams.get('date') || undefined
    const status = searchParams.get('status') as 'scheduled' | 'live' | 'finished' || undefined

    let data: any = null
    const meta: any = {
      timestamp: new Date().toISOString(),
      action
    }

    switch (action) {
      case 'sports':
        data = unifiedApiClient.getSupportedSports()
        meta.count = data.length
        break

      case 'leagues':
        if (!sport) {
          return NextResponse.json(
            { error: 'Sport parameter is required for leagues' },
            { status: 400 }
          )
        }
        data = unifiedApiClient.getLeaguesForSport(sport)
        meta.count = data.length
        meta.sport = sport
        break

      case 'games':
        if (!sport) {
          return NextResponse.json(
            { error: 'Sport parameter is required for games' },
            { status: 400 }
          )
        }
        data = await unifiedApiClient.getGames(sport, { 
          ...(league && { league }), 
          ...(date && { date }), 
          ...(status && { status }), 
          ...(limit && { limit })
        })
        meta.count = data.length
        meta.sport = sport
        meta.league = league || unifiedApiClient.getDefaultLeague(sport)
        break

      case 'live-games':
        if (!sport) {
          return NextResponse.json(
            { error: 'Sport parameter is required for live games' },
            { status: 400 }
          )
        }
        data = await unifiedApiClient.getLiveGames(sport, league)
        meta.count = data.length
        meta.sport = sport
        meta.league = league || unifiedApiClient.getDefaultLeague(sport)
        break

      case 'teams':
        if (!sport) {
          return NextResponse.json(
            { error: 'Sport parameter is required for teams' },
            { status: 400 }
          )
        }
        data = await unifiedApiClient.getTeams(sport, { 
          ...(league && { league }), 
          ...(limit && { limit })
        })
        meta.count = data.length
        meta.sport = sport
        meta.league = league || unifiedApiClient.getDefaultLeague(sport)
        break

      case 'players':
        if (!sport) {
          return NextResponse.json(
            { error: 'Sport parameter is required for players' },
            { status: 400 }
          )
        }
        data = await unifiedApiClient.getPlayers(sport, { 
          ...(league && { league }), 
          ...(limit && { limit })
        })
        meta.count = data.length
        meta.sport = sport
        meta.league = league || unifiedApiClient.getDefaultLeague(sport)
        break

      case 'standings':
        if (!sport) {
          return NextResponse.json(
            { error: 'Sport parameter is required for standings' },
            { status: 400 }
          )
        }
        data = await unifiedApiClient.getStandings(sport, league ? { league } : {})
        meta.count = data.length
        meta.sport = sport
        meta.league = league || unifiedApiClient.getDefaultLeague(sport)
        break

      case 'odds':
        if (!sport) {
          return NextResponse.json(
            { error: 'Sport parameter is required for odds' },
            { status: 400 }
          )
        }
        data = await unifiedApiClient.getOdds(sport, {})
        meta.count = data.length
        meta.sport = sport
        meta.league = league || unifiedApiClient.getDefaultLeague(sport)
        break

      case 'predictions':
        if (!sport) {
          return NextResponse.json(
            { error: 'Sport parameter is required for predictions' },
            { status: 400 }
          )
        }
        data = await unifiedApiClient.getPredictions(sport, {})
        meta.count = data.length
        meta.sport = sport
        meta.league = league || unifiedApiClient.getDefaultLeague(sport)
        break

      case 'analytics':
        if (!sport) {
          return NextResponse.json(
            { error: 'Sport parameter is required for analytics' },
            { status: 400 }
          )
        }
        data = await unifiedApiClient.getAnalytics(sport, league ? { league } : undefined)
        meta.sport = sport
        meta.league = league || unifiedApiClient.getDefaultLeague(sport)
        break

      case 'team-performance':
        if (!sport) {
          return NextResponse.json(
            { error: 'Sport parameter is required for team performance' },
            { status: 400 }
          )
        }
        data = await unifiedApiClient.getTeamPerformance(sport)
        meta.count = data.length
        meta.sport = sport
        meta.league = league || unifiedApiClient.getDefaultLeague(sport)
        break

      case 'value-bets':
        if (!sport) {
          return NextResponse.json(
            { error: 'Sport parameter is required for value bets' },
            { status: 400 }
          )
        }
        data = await unifiedApiClient.getValueBets(sport, { ...(league ? { league } : {}), ...(limit ? { limit } : {}) })
        meta.count = data.length
        meta.sport = sport
        meta.league = league || unifiedApiClient.getDefaultLeague(sport)
        break

      case 'sport-overview':
        if (!sport) {
          return NextResponse.json(
            { error: 'Sport parameter is required for sport overview' },
            { status: 400 }
          )
        }
        data = await unifiedApiClient.getSportOverview(sport, league)
        meta.sport = sport
        meta.league = league || unifiedApiClient.getDefaultLeague(sport)
        break

      case 'health':
        data = await unifiedApiClient.getHealthStatus()
        break

      case 'cache-stats':
        data = unifiedApiClient.getCacheStats()
        break

      default:
        return NextResponse.json(
          { error: `Invalid action: ${action}. Supported actions: sports, leagues, games, live-games, teams, players, standings, odds, predictions, analytics, team-performance, value-bets, sport-overview, health, cache-stats` },
          { status: 400 }
        )
    }

    return NextResponse.json({
      success: true,
      data,
      meta
    })

  } catch (error) {
    console.error('Unified API error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error'
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, data: requestData } = body

    let result: any = null
    const meta: any = {
      timestamp: new Date().toISOString(),
      action
    }

    switch (action) {
      case 'refresh':
        // Refresh data for specific sport or all sports
        const sport = requestData?.sport as SupportedSport
        if (sport) {
          // Refresh specific sport data
          const [games, teams, players, odds, predictions] = await Promise.all([
            unifiedApiClient.getGames(sport, { limit: 5 }),
            unifiedApiClient.getTeams(sport, { limit: 5 }),
            unifiedApiClient.getPlayers(sport, { limit: 5 }),
            unifiedApiClient.getOdds(sport),
            unifiedApiClient.getPredictions(sport)
          ])
          
          result = {
            sport,
            games: games.length,
            teams: teams.length,
            players: players.length,
            odds: odds.length,
            predictions: predictions.length
          }
        } else {
          // Refresh all sports
          const supportedSports = unifiedApiClient.getSupportedSports()
          const refreshResults = await Promise.all(
            (await supportedSports).map(async (sport) => {
              const [games, teams, players] = await Promise.all([
                unifiedApiClient.getGames(sport, { limit: 5 }),
                unifiedApiClient.getTeams(sport, { limit: 5 }),
                unifiedApiClient.getPlayers(sport, { limit: 5 })
              ])
              
              return {
                sport,
                games: games.length,
                teams: teams.length,
                players: players.length
              }
            })
          )
          
          result = refreshResults
        }
        break

      case 'warmup':
        // Warm up services for provided sports or for dynamically supported sports
        {
          const sports = (requestData?.sports && Array.isArray(requestData.sports) && requestData.sports.length > 0)
            ? requestData.sports
            : unifiedApiClient.getSupportedSports()
          await unifiedApiClient.warmupServices(sports)
          result = { message: 'Services warmed up successfully', sports }
        }
        break

      case 'clear-cache':
        // Clear all caches
        unifiedApiClient.clearAllCaches()
        result = { message: 'All caches cleared successfully' }
        break

      case 'health-check':
        result = await unifiedApiClient.getHealthStatus()
        break

      default:
        return NextResponse.json(
          { error: `Invalid action: ${action}. Supported actions: refresh, warmup, clear-cache, health-check` },
          { status: 400 }
        )
    }

    return NextResponse.json({
      success: true,
      data: result,
      meta
    })

  } catch (error) {
    console.error('Unified API POST error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error'
      },
      { status: 500 }
    )
  }
}
