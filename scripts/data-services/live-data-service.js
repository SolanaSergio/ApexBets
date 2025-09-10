#!/usr/bin/env node

/**
 * Live Data Access Service
 * This service provides real-time access to live sports data
 */

const { createClient } = require('@supabase/supabase-js');
const express = require('express');
const cors = require('cors');
require('dotenv').config({ path: '.env.local' });

console.log('🌐 ApexBets Live Data Access Service');
console.log('====================================\n');

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Initialize Express app
const app = express();
const PORT = process.env.LIVE_DATA_PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Sports configuration
const SPORTS = ['basketball', 'football', 'baseball', 'hockey', 'soccer', 'tennis', 'golf'];

// Live data endpoints
app.get('/api/live/games', async (req, res) => {
  try {
    const { sport, status, limit = 50 } = req.query;
    
    let query = supabase
      .from('games')
      .select(`
        *,
        home_team:teams!games_home_team_id_fkey(name, abbreviation, logo_url),
        away_team:teams!games_away_team_id_fkey(name, abbreviation, logo_url)
      `)
      .order('game_date', { ascending: true })
      .limit(parseInt(limit));
    
    if (sport) {
      query = query.eq('sport', sport);
    }
    
    if (status) {
      query = query.eq('status', status);
    }
    
    const { data: games, error } = await query;
    
    if (error) {
      throw new Error(error.message);
    }
    
    res.json({
      success: true,
      data: games,
      meta: {
        total: games?.length || 0,
        sport: sport || 'all',
        status: status || 'all',
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.get('/api/live/teams', async (req, res) => {
  try {
    const { sport, league, limit = 100 } = req.query;
    
    let query = supabase
      .from('teams')
      .select('*')
      .order('name', { ascending: true })
      .limit(parseInt(limit));
    
    if (sport) {
      query = query.eq('sport', sport);
    }
    
    if (league) {
      query = query.eq('league', league);
    }
    
    const { data: teams, error } = await query;
    
    if (error) {
      throw new Error(error.message);
    }
    
    res.json({
      success: true,
      data: teams,
      meta: {
        total: teams?.length || 0,
        sport: sport || 'all',
        league: league || 'all',
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.get('/api/live/predictions', async (req, res) => {
  try {
    const { sport, game_id, limit = 50 } = req.query;
    
    let query = supabase
      .from('predictions')
      .select(`
        *,
        game:games(
          id,
          home_team:teams!games_home_team_id_fkey(name, abbreviation),
          away_team:teams!games_away_team_id_fkey(name, abbreviation),
          game_date,
          status
        )
      `)
      .order('created_at', { ascending: false })
      .limit(parseInt(limit));
    
    if (sport) {
      query = query.eq('sport', sport);
    }
    
    if (game_id) {
      query = query.eq('game_id', game_id);
    }
    
    const { data: predictions, error } = await query;
    
    if (error) {
      throw new Error(error.message);
    }
    
    res.json({
      success: true,
      data: predictions,
      meta: {
        total: predictions?.length || 0,
        sport: sport || 'all',
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.get('/api/live/odds', async (req, res) => {
  try {
    const { sport, game_id, limit = 50 } = req.query;
    
    let query = supabase
      .from('odds')
      .select(`
        *,
        game:games(
          id,
          home_team:teams!games_home_team_id_fkey(name, abbreviation),
          away_team:teams!games_away_team_id_fkey(name, abbreviation),
          game_date,
          status
        )
      `)
      .order('timestamp', { ascending: false })
      .limit(parseInt(limit));
    
    if (sport) {
      query = query.eq('sport', sport);
    }
    
    if (game_id) {
      query = query.eq('game_id', game_id);
    }
    
    const { data: odds, error } = await query;
    
    if (error) {
      throw new Error(error.message);
    }
    
    res.json({
      success: true,
      data: odds,
      meta: {
        total: odds?.length || 0,
        sport: sport || 'all',
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.get('/api/live/analytics', async (req, res) => {
  try {
    const { sport, timeRange = '30d' } = req.query;
    
    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    
    switch (timeRange) {
      case '7d':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(endDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(endDate.getDate() - 90);
        break;
      default:
        startDate.setDate(endDate.getDate() - 30);
    }
    
    // Get analytics data
    const { data: games } = await supabase
      .from('games')
      .select('*')
      .gte('game_date', startDate.toISOString())
      .lte('game_date', endDate.toISOString())
      .not('home_score', 'is', null)
      .not('away_score', 'is', null);
    
    const { data: predictions } = await supabase
      .from('predictions')
      .select('*')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());
    
    // Calculate analytics
    const analytics = {
      totalGames: games?.length || 0,
      totalPredictions: predictions?.length || 0,
      accuracyRate: 0,
      sportsBreakdown: {},
      recentPerformance: []
    };
    
    // Calculate accuracy rate
    if (predictions && predictions.length > 0) {
      const correctPredictions = predictions.filter(p => p.is_correct === true).length;
      analytics.accuracyRate = correctPredictions / predictions.length;
    }
    
    // Calculate sports breakdown
    if (games) {
      const sportsCount = {};
      games.forEach(game => {
        sportsCount[game.sport] = (sportsCount[game.sport] || 0) + 1;
      });
      analytics.sportsBreakdown = sportsCount;
    }
    
    res.json({
      success: true,
      data: analytics,
      meta: {
        timeRange,
        sport: sport || 'all',
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.get('/api/live/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: '1.0.0'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Live data service running on port ${PORT}`);
  console.log(`🌐 Available endpoints:`);
  console.log(`   - GET /api/live/games - Live games data`);
  console.log(`   - GET /api/live/teams - Live teams data`);
  console.log(`   - GET /api/live/predictions - Live predictions data`);
  console.log(`   - GET /api/live/odds - Live odds data`);
  console.log(`   - GET /api/live/analytics - Live analytics data`);
  console.log(`   - GET /api/live/health - Service health check`);
  console.log(`\n🔗 Access your live data at: http://localhost:${PORT}`);
  console.log(`\n📊 Example queries:`);
  console.log(`   - http://localhost:${PORT}/api/live/games?sport=basketball&status=live`);
  console.log(`   - http://localhost:${PORT}/api/live/teams?sport=football`);
  console.log(`   - http://localhost:${PORT}/api/live/predictions?sport=basketball`);
  console.log(`   - http://localhost:${PORT}/api/live/odds?sport=basketball`);
  console.log(`   - http://localhost:${PORT}/api/live/analytics?sport=basketball&timeRange=7d`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Stopping live data service...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Stopping live data service...');
  process.exit(0);
});
