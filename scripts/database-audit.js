const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL, 
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkTables() {
  try {
    console.log('=== DATABASE AUDIT ===\n');
    
    // Check all tables
    const tables = [
      'teams', 'games', 'odds', 'player_stats', 'predictions', 
      'user_alerts', 'profiles', 'scrape_logs', 'value_bets', 
      'analytics_cache', 'football_player_stats', 'baseball_player_stats', 
      'hockey_player_stats', 'soccer_player_stats', 'tennis_match_stats', 
      'golf_tournament_stats', 'league_standings', 'player_profiles', 
      'value_betting_opportunities', 'sports_news'
    ];
    
    for (const table of tables) {
      try {
        const { count, error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });
        
        if (error) {
          console.log(`❌ ${table}: ERROR - ${error.message}`);
        } else {
          console.log(`✅ ${table}: ${count || 0} records`);
        }
      } catch (e) {
        console.log(`❌ ${table}: TABLE NOT FOUND`);
      }
    }
    
    console.log('\n=== DATA QUALITY CHECK ===\n');
    
    // Teams by sport
    const { data: teamsBySport, error: teamsError } = await supabase
      .from('teams')
      .select('sport')
      .not('sport', 'is', null);
    
    if (!teamsError && teamsBySport) {
      const sportCounts = teamsBySport.reduce((acc, team) => {
        acc[team.sport] = (acc[team.sport] || 0) + 1;
        return acc;
      }, {});
      console.log('Teams by sport:', sportCounts);
    }
    
    // Games by sport
    const { data: gamesBySport, error: gamesError } = await supabase
      .from('games')
      .select('sport')
      .not('sport', 'is', null);
    
    if (!gamesError && gamesBySport) {
      const sportCounts = gamesBySport.reduce((acc, game) => {
        acc[game.sport] = (acc[game.sport] || 0) + 1;
        return acc;
      }, {});
      console.log('Games by sport:', sportCounts);
    }
    
    // Recent games
    const { data: recentGames, error: recentError } = await supabase
      .from('games')
      .select('*')
      .order('game_date', { ascending: false })
      .limit(5);
    
    console.log(`\nRecent games: ${recentGames?.length || 0}`);
    if (recentGames && recentGames.length > 0) {
      console.log('Sample recent game:', {
        id: recentGames[0].id,
        home_team: recentGames[0].home_team_id,
        away_team: recentGames[0].away_team_id,
        date: recentGames[0].game_date,
        sport: recentGames[0].sport
      });
    }
    
    // Check for missing critical data
    console.log('\n=== MISSING DATA ANALYSIS ===\n');
    
    // Check if we have any historical data
    const { data: historicalGames } = await supabase
      .from('games')
      .select('game_date')
      .lt('game_date', new Date().toISOString())
      .limit(1);
    
    console.log(`Historical games: ${historicalGames?.length || 0}`);
    
    // Check if we have any live data
    const { data: liveGames } = await supabase
      .from('games')
      .select('status')
      .eq('status', 'in_progress')
      .limit(1);
    
    console.log(`Live games: ${liveGames?.length || 0}`);
    
    // Check predictions accuracy
    const { data: predictions } = await supabase
      .from('predictions')
      .select('is_correct')
      .not('is_correct', 'is', null);
    
    if (predictions && predictions.length > 0) {
      const correct = predictions.filter(p => p.is_correct).length;
      const accuracy = (correct / predictions.length * 100).toFixed(2);
      console.log(`Prediction accuracy: ${accuracy}% (${correct}/${predictions.length})`);
    } else {
      console.log('No prediction accuracy data available');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkTables();
