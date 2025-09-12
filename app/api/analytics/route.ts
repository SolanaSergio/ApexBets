import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cachedSupabaseQuery } from '@/lib/utils/supabase-query-cache';

export async function GET() {
  try {
    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ error: "Supabase client initialization failed" }, { status: 500 })
    }

    // Use cached queries to prevent duplicate database calls
    const games = await cachedSupabaseQuery(
      'games',
      'select',
      { fields: 'id, sport, status, updated_at', limit: 1000 },
      async () => {
        const { data, error } = await supabase.from('games').select('id, sport, status, updated_at').limit(1000);
        if (error) throw error;
        return data || [];
      }
    );

    const teams = await cachedSupabaseQuery(
      'teams',
      'select',
      { fields: 'id, sport, is_active', limit: 1000 },
      async () => {
        const { data, error } = await supabase.from('teams').select('id, sport, is_active').limit(1000);
        if (error) throw error;
        return data || [];
      }
    );

    const predictions = await cachedSupabaseQuery(
      'predictions',
      'select',
      { fields: 'id, sport, confidence', limit: 1000 },
      async () => {
        const { data, error } = await supabase.from('predictions').select('id, sport, confidence').limit(1000);
        if (error) throw error;
        return data || [];
      }
    );

    const odds = await cachedSupabaseQuery(
      'odds',
      'select',
      { fields: 'id, sport, last_updated', limit: 1000 },
      async () => {
        const { data, error } = await supabase.from('odds').select('id, sport, last_updated').limit(1000);
        if (error) throw error;
        return data || [];
      }
    );
    
    // Calculate analytics
    const analytics = {
      overview: {
        totalGames: games.length,
        totalTeams: teams.length,
        totalPredictions: predictions.length,
        totalOdds: odds.length
      },
      bySport: {
        basketball: {
          games: games.filter(g => g.sport === 'basketball').length,
          teams: teams.filter(t => t.sport === 'basketball').length,
          predictions: predictions.filter(p => p.sport === 'basketball').length
        },
        football: {
          games: games.filter(g => g.sport === 'football').length,
          teams: teams.filter(t => t.sport === 'football').length,
          predictions: predictions.filter(p => p.sport === 'football').length
        },
        baseball: {
          games: games.filter(g => g.sport === 'baseball').length,
          teams: teams.filter(t => t.sport === 'baseball').length,
          predictions: predictions.filter(p => p.sport === 'baseball').length
        },
        hockey: {
          games: games.filter(g => g.sport === 'hockey').length,
          teams: teams.filter(t => t.sport === 'hockey').length,
          predictions: predictions.filter(p => p.sport === 'hockey').length
        },
        soccer: {
          games: games.filter(g => g.sport === 'soccer').length,
          teams: teams.filter(t => t.sport === 'soccer').length,
          predictions: predictions.filter(p => p.sport === 'soccer').length
        }
      },
      gameStatus: {
        scheduled: games.filter(g => g.status === 'scheduled').length,
        live: games.filter(g => g.status === 'live').length,
        finished: games.filter(g => g.status === 'finished').length
      },
      predictionAccuracy: {
        totalPredictions: predictions.length,
        averageConfidence: predictions.length > 0 ? 
          predictions.reduce((sum, p) => sum + (p.confidence || 0), 0) / predictions.length : 0
      },
      dataFreshness: {
        lastGameUpdate: games.length > 0 ? 
          Math.max(...games.map(g => new Date(g.updated_at || 0).getTime())) : 0,
        lastOddsUpdate: odds.length > 0 ? 
          Math.max(...odds.map(o => new Date(o.last_updated || 0).getTime())) : 0
      }
    };
    
    return NextResponse.json({
      success: true,
      data: analytics,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Analytics API error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}