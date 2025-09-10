#!/usr/bin/env node

/**
 * Multi-Sport Data Population Script
 * This script will populate your database with real sports data
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

console.log('📊 ApexBets Multi-Sport Data Population');
console.log('========================================\n');

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Sample data for different sports
const sampleData = {
  basketball: {
    teams: [
      { name: 'Lakers', city: 'Los Angeles', league: 'NBA', sport: 'basketball', abbreviation: 'LAL', conference: 'Western', division: 'Pacific' },
      { name: 'Warriors', city: 'Golden State', league: 'NBA', sport: 'basketball', abbreviation: 'GSW', conference: 'Western', division: 'Pacific' },
      { name: 'Celtics', city: 'Boston', league: 'NBA', sport: 'basketball', abbreviation: 'BOS', conference: 'Eastern', division: 'Atlantic' },
      { name: 'Heat', city: 'Miami', league: 'NBA', sport: 'basketball', abbreviation: 'MIA', conference: 'Eastern', division: 'Southeast' },
      { name: 'Knicks', city: 'New York', league: 'NBA', sport: 'basketball', abbreviation: 'NYK', conference: 'Eastern', division: 'Atlantic' },
      { name: 'Bulls', city: 'Chicago', league: 'NBA', sport: 'basketball', abbreviation: 'CHI', conference: 'Eastern', division: 'Central' },
      { name: 'Nets', city: 'Brooklyn', league: 'NBA', sport: 'basketball', abbreviation: 'BKN', conference: 'Eastern', division: 'Atlantic' },
      { name: '76ers', city: 'Philadelphia', league: 'NBA', sport: 'basketball', abbreviation: 'PHI', conference: 'Eastern', division: 'Atlantic' }
    ]
  },
  football: {
    teams: [
      { name: 'Chiefs', city: 'Kansas City', league: 'NFL', sport: 'football', abbreviation: 'KC', conference: 'AFC', division: 'West' },
      { name: 'Bills', city: 'Buffalo', league: 'NFL', sport: 'football', abbreviation: 'BUF', conference: 'AFC', division: 'East' },
      { name: 'Cowboys', city: 'Dallas', league: 'NFL', sport: 'football', abbreviation: 'DAL', conference: 'NFC', division: 'East' },
      { name: 'Packers', city: 'Green Bay', league: 'NFL', sport: 'football', abbreviation: 'GB', conference: 'NFC', division: 'North' },
      { name: '49ers', city: 'San Francisco', league: 'NFL', sport: 'football', abbreviation: 'SF', conference: 'NFC', division: 'West' },
      { name: 'Patriots', city: 'New England', league: 'NFL', sport: 'football', abbreviation: 'NE', conference: 'AFC', division: 'East' }
    ]
  },
  baseball: {
    teams: [
      { name: 'Yankees', city: 'New York', league: 'MLB', sport: 'baseball', abbreviation: 'NYY', conference: 'American', division: 'East' },
      { name: 'Dodgers', city: 'Los Angeles', league: 'MLB', sport: 'baseball', abbreviation: 'LAD', conference: 'National', division: 'West' },
      { name: 'Red Sox', city: 'Boston', league: 'MLB', sport: 'baseball', abbreviation: 'BOS', conference: 'American', division: 'East' },
      { name: 'Giants', city: 'San Francisco', league: 'MLB', sport: 'baseball', abbreviation: 'SF', conference: 'National', division: 'West' },
      { name: 'Cubs', city: 'Chicago', league: 'MLB', sport: 'baseball', abbreviation: 'CHC', conference: 'National', division: 'Central' },
      { name: 'Cardinals', city: 'St. Louis', league: 'MLB', sport: 'baseball', abbreviation: 'STL', conference: 'National', division: 'Central' }
    ]
  }
};

async function populateData() {
  try {
    console.log('🔄 Starting data population...\n');

    // Clear existing data
    console.log('🧹 Clearing existing data...');
    await supabase.from('games').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('teams').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    console.log('✅ Existing data cleared\n');

    // Populate teams
    console.log('👥 Populating teams...');
    for (const [sport, data] of Object.entries(sampleData)) {
      const { error } = await supabase
        .from('teams')
        .insert(data.teams);
      
      if (error) {
        console.error(`❌ Error inserting ${sport} teams:`, error.message);
      } else {
        console.log(`✅ ${data.teams.length} ${sport} teams inserted`);
      }
    }

    // Get team IDs for games
    const { data: teams } = await supabase.from('teams').select('id, name, sport');
    const teamMap = {};
    teams.forEach(team => {
      if (!teamMap[team.sport]) teamMap[team.sport] = {};
      teamMap[team.sport][team.name] = team.id;
    });

    // Populate sample games
    console.log('\n🏟️  Populating sample games...');
    const games = [];
    const today = new Date();
    
    // Create games for each sport
    for (const [sport, data] of Object.entries(sampleData)) {
      const sportTeams = teams.filter(t => t.sport === sport);
      
      for (let i = 0; i < Math.min(10, sportTeams.length); i += 2) {
        if (i + 1 < sportTeams.length) {
          const gameDate = new Date(today);
          gameDate.setDate(today.getDate() + Math.floor(Math.random() * 30));
          
          games.push({
            home_team_id: sportTeams[i].id,
            away_team_id: sportTeams[i + 1].id,
            game_date: gameDate.toISOString(),
            season: '2024-25',
            status: Math.random() > 0.5 ? 'scheduled' : 'completed',
            home_score: Math.random() > 0.5 ? Math.floor(Math.random() * 50) + 80 : null,
            away_score: Math.random() > 0.5 ? Math.floor(Math.random() * 50) + 80 : null,
            sport: sport,
            league: data.teams[0].league
          });
        }
      }
    }

    const { error: gamesError } = await supabase
      .from('games')
      .insert(games);
    
    if (gamesError) {
      console.error('❌ Error inserting games:', gamesError.message);
    } else {
      console.log(`✅ ${games.length} games inserted`);
    }

    // Populate sample predictions
    console.log('\n🔮 Populating sample predictions...');
    const { data: gameData } = await supabase.from('games').select('id, sport').limit(20);
    
    if (gameData && gameData.length > 0) {
      const predictions = gameData.map(game => ({
        game_id: game.id,
        model_name: 'Neural Network v3.2',
        prediction_type: 'winner',
        predicted_value: Math.random(),
        confidence: Math.random() * 0.4 + 0.6, // 60-100% confidence
        is_correct: Math.random() > 0.3, // 70% accuracy
        sport: game.sport,
        league: game.sport === 'basketball' ? 'NBA' : game.sport === 'football' ? 'NFL' : 'MLB'
      }));

      const { error: predictionsError } = await supabase
        .from('predictions')
        .insert(predictions);
      
      if (predictionsError) {
        console.error('❌ Error inserting predictions:', predictionsError.message);
      } else {
        console.log(`✅ ${predictions.length} predictions inserted`);
      }
    }

    // Populate sample odds
    console.log('\n💰 Populating sample odds...');
    if (gameData && gameData.length > 0) {
      const odds = gameData.map(game => ({
        game_id: game.id,
        source: 'draftkings',
        odds_type: 'moneyline',
        home_odds: Math.floor(Math.random() * 200) - 100,
        away_odds: Math.floor(Math.random() * 200) - 100,
        spread: (Math.random() - 0.5) * 20,
        total: Math.floor(Math.random() * 50) + 200,
        sport: game.sport,
        league: game.sport === 'basketball' ? 'NBA' : game.sport === 'football' ? 'NFL' : 'MLB'
      }));

      const { error: oddsError } = await supabase
        .from('odds')
        .insert(odds);
      
      if (oddsError) {
        console.error('❌ Error inserting odds:', oddsError.message);
      } else {
        console.log(`✅ ${odds.length} odds records inserted`);
      }
    }

    console.log('\n🎉 Data population complete!');
    console.log('\n📊 Summary:');
    console.log('===========');
    
    const { count: teamCount } = await supabase.from('teams').select('*', { count: 'exact', head: true });
    const { count: gameCount } = await supabase.from('games').select('*', { count: 'exact', head: true });
    const { count: predictionCount } = await supabase.from('predictions').select('*', { count: 'exact', head: true });
    const { count: oddsCount } = await supabase.from('odds').select('*', { count: 'exact', head: true });
    
    console.log(`Teams: ${teamCount || 0}`);
    console.log(`Games: ${gameCount || 0}`);
    console.log(`Predictions: ${predictionCount || 0}`);
    console.log(`Odds: ${oddsCount || 0}`);
    
    console.log('\n🚀 Your ApexBets website is now ready with sample data!');
    console.log('   Visit http://localhost:3000 to see it in action.');

  } catch (error) {
    console.error('❌ Error during data population:', error.message);
    process.exit(1);
  }
}

// Run the population script
populateData();
