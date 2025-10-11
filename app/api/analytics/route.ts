import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { databaseCacheService } from '@/lib/services/database-cache-service'

const CACHE_TTL = 60 * 5 // 5 minutes

export async function GET() {
  try {
    const cacheKey = 'analytics-overview'
    const cached = await databaseCacheService.get(cacheKey)
    if (cached) {
      return NextResponse.json(cached)
    }

    const supabase = await createClient()
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase client initialization failed' }, { status: 500 })
    }

    const [games, teams, predictions, odds] = await Promise.all([
      supabase.from('games').select('id, sport, status, updated_at').limit(1000),
      supabase.from('teams').select('id, sport, is_active').limit(1000),
      supabase.from('predictions').select('id, sport, confidence').limit(1000),
      supabase.from('odds').select('id, sport, last_updated').limit(1000),
    ])

    // Calculate analytics
    const gamesArr = Array.isArray(games.data) ? games.data : []
    const teamsArr = Array.isArray(teams.data) ? teams.data : []
    const predictionsArr = Array.isArray(predictions.data) ? predictions.data : []
    const oddsArr = Array.isArray(odds.data) ? odds.data : []

    const analytics = {
      overview: {
        totalGames: gamesArr.length,
        totalTeams: teamsArr.length,
        totalPredictions: predictionsArr.length,
        totalOdds: oddsArr.length,
      },
      bySport: {
        basketball: {
          games: gamesArr.filter(g => g.sport === 'basketball').length,
          teams: teamsArr.filter(t => t.sport === 'basketball').length,
          predictions: predictionsArr.filter(p => p.sport === 'basketball').length,
        },
        football: {
          games: gamesArr.filter(g => g.sport === 'football').length,
          teams: teamsArr.filter(t => t.sport === 'football').length,
          predictions: predictionsArr.filter(p => p.sport === 'football').length,
        },
        baseball: {
          games: gamesArr.filter(g => g.sport === 'baseball').length,
          teams: teamsArr.filter(t => t.sport === 'baseball').length,
          predictions: predictionsArr.filter(p => p.sport === 'baseball').length,
        },
        hockey: {
          games: gamesArr.filter(g => g.sport === 'hockey').length,
          teams: teamsArr.filter(t => t.sport === 'hockey').length,
          predictions: predictionsArr.filter(p => p.sport === 'hockey').length,
        },
        soccer: {
          games: gamesArr.filter(g => g.sport === 'soccer').length,
          teams: teamsArr.filter(t => t.sport === 'soccer').length,
          predictions: predictionsArr.filter(p => p.sport === 'soccer').length,
        },
      },
      gameStatus: {
        scheduled: gamesArr.filter(g => g.status === 'scheduled').length,
        live: gamesArr.filter(g => g.status === 'live').length,
        finished: gamesArr.filter(g => g.status === 'finished').length,
      },
      predictionAccuracy: {
        totalPredictions: predictionsArr.length,
        averageConfidence:
          predictionsArr.length > 0
            ? predictionsArr.reduce((sum, p) => sum + (p.confidence || 0), 0) /
              predictionsArr.length
            : 0,
      },
      dataFreshness: {
        lastGameUpdate:
          gamesArr.length > 0
            ? Math.max(...gamesArr.map(g => new Date(g.updated_at || 0).getTime()))
            : 0,
        lastOddsUpdate:
          oddsArr.length > 0
            ? Math.max(...oddsArr.map(o => new Date(o.last_updated || 0).getTime()))
            : 0,
      },
    }

    const result = {
      success: true,
      data: analytics,
      timestamp: new Date().toISOString(),
    }

    await databaseCacheService.set(cacheKey, result, CACHE_TTL)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Analytics API error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}
