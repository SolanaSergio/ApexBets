import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getCache, setCache } from '@/lib/redis';

const CACHE_TTL = 60 * 5; // 5 minutes

export async function GET() {
  try {
    const cacheKey = 'analytics-overview';
    const cached = await getCache(cacheKey);
    if (cached) {
        return NextResponse.json(cached);
    }

    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ error: "Supabase client initialization failed" }, { status: 500 })
    }

    const [games, teams, predictions, odds] = await Promise.all([
        supabase.from('games').select('id, sport, status, updated_at').limit(1000),
        supabase.from('teams').select('id, sport, is_active').limit(1000),
        supabase.from('predictions').select('id, sport, confidence').limit(1000),
        supabase.from('odds').select('id, sport, last_updated').limit(1000)
    ]);
    
    // Calculate analytics
    const analytics = {
      overview: {
        totalGames: games.data?.length || 0,
        totalTeams: teams.data?.length || 0,
        totalPredictions: predictions.data?.length || 0,
        totalOdds: odds.data?.length || 0
      },
      bySport: {
        basketball: {
          games: games.data?.filter(g => g.sport === 'basketball').length || 0,
          teams: teams.data?.filter(t => t.sport === 'basketball').length || 0,
          predictions: predictions.data?.filter(p => p.sport === 'basketball').length || 0
        },
        football: {
          games: games.data?.filter(g => g.sport === 'football').length || 0,
          teams: teams.data?.filter(t => t.sport === 'football').length || 0,
          predictions: predictions.data?.filter(p => p.sport === 'football').length || 0
        },
        baseball: {
          games: games.data?.filter(g => g.sport === 'baseball').length || 0,
          teams: teams.data?.filter(t => t.sport === 'baseball').length || 0,
          predictions: predictions.data?.filter(p => p.sport === 'baseball').length || 0
        },
        hockey: {
          games: games.data?.filter(g => g.sport === 'hockey').length || 0,
          teams: teams.data?.filter(t => t.sport === 'hockey').length || 0,
          predictions: predictions.data?.filter(p => p.sport === 'hockey').length || 0
        },
        soccer: {
          games: games.data?.filter(g => g.sport === 'soccer').length || 0,
          teams: teams.data?.filter(t => t.sport === 'soccer').length || 0,
          predictions: predictions.data?.filter(p => p.sport === 'soccer').length || 0
        }
      },
      gameStatus: {
        scheduled: games.data?.filter(g => g.status === 'scheduled').length || 0,
        live: games.data?.filter(g => g.status === 'live').length || 0,
        finished: games.data?.filter(g => g.status === 'finished').length || 0
      },
      predictionAccuracy: {
        totalPredictions: predictions.data?.length || 0,
        averageConfidence: predictions.data?.length > 0 ? 
          predictions.data.reduce((sum, p) => sum + (p.confidence || 0), 0) / predictions.data.length : 0
      },
      dataFreshness: {
        lastGameUpdate: games.data?.length > 0 ? 
          Math.max(...games.data.map(g => new Date(g.updated_at || 0).getTime())) : 0,
        lastOddsUpdate: odds.data?.length > 0 ? 
          Math.max(...odds.data.map(o => new Date(o.last_updated || 0).getTime())) : 0
      }
    };

    const result = {
      success: true,
      data: analytics,
      timestamp: new Date().toISOString()
    };

    await setCache(cacheKey, result, CACHE_TTL);
    
    return NextResponse.json(result);
    
  } catch (error) {
    console.error('Analytics API error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
