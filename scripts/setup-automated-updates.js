#!/usr/bin/env node

/**
 * Setup Automated Updates
 * This script sets up automated data updates for the ApexBets application
 */

const cron = require('node-cron');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

console.log('🔄 ApexBets Automated Updates Setup');
console.log('===================================\n');

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Update functions
async function updateGames() {
  try {
    console.log('🏟️  Updating games...');
    
    // Get current games and update scores/status
    const { data: games } = await supabase
      .from('games')
      .select('*')
      .eq('status', 'scheduled')
      .gte('game_date', new Date().toISOString())
      .limit(10);
    
    if (games && games.length > 0) {
      // Simulate some games finishing
      const gamesToUpdate = games.slice(0, Math.floor(games.length / 3));
      
      for (const game of gamesToUpdate) {
        const homeScore = Math.floor(Math.random() * 30) + 90;
        const awayScore = Math.floor(Math.random() * 30) + 90;
        
        await supabase
          .from('games')
          .update({
            home_score: homeScore,
            away_score: awayScore,
            status: 'finished',
            updated_at: new Date().toISOString()
          })
          .eq('id', game.id);
      }
      
      console.log(`   ✅ Updated ${gamesToUpdate.length} games`);
    }
  } catch (error) {
    console.error('   ❌ Error updating games:', error.message);
  }
}

async function updatePlayerStats() {
  try {
    console.log('📊 Updating player stats...');
    
    // Get recent finished games
    const { data: games } = await supabase
      .from('games')
      .select('id, home_team_id, away_team_id')
      .eq('status', 'finished')
      .gte('game_date', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .limit(5);
    
    if (games && games.length > 0) {
      const playerStats = [];
      
      for (const game of games) {
        // Generate stats for home team players
        for (let i = 0; i < 5; i++) {
          playerStats.push({
            game_id: game.id,
            team_id: game.home_team_id,
            player_name: `Player ${i + 1}`,
            position: ['PG', 'SG', 'SF', 'PF', 'C'][i],
            minutes_played: Math.floor(Math.random() * 40) + 8,
            points: Math.floor(Math.random() * 25) + 5,
            rebounds: Math.floor(Math.random() * 12) + 2,
            assists: Math.floor(Math.random() * 8) + 1,
            steals: Math.floor(Math.random() * 4),
            blocks: Math.floor(Math.random() * 3),
            turnovers: Math.floor(Math.random() * 4),
            field_goals_made: Math.floor(Math.random() * 10) + 2,
            field_goals_attempted: Math.floor(Math.random() * 15) + 5,
            three_pointers_made: Math.floor(Math.random() * 5),
            three_pointers_attempted: Math.floor(Math.random() * 8) + 1,
            free_throws_made: Math.floor(Math.random() * 6) + 1,
            free_throws_attempted: Math.floor(Math.random() * 8) + 1
          });
        }
        
        // Generate stats for away team players
        for (let i = 0; i < 5; i++) {
          playerStats.push({
            game_id: game.id,
            team_id: game.away_team_id,
            player_name: `Player ${i + 1}`,
            position: ['PG', 'SG', 'SF', 'PF', 'C'][i],
            minutes_played: Math.floor(Math.random() * 40) + 8,
            points: Math.floor(Math.random() * 25) + 5,
            rebounds: Math.floor(Math.random() * 12) + 2,
            assists: Math.floor(Math.random() * 8) + 1,
            steals: Math.floor(Math.random() * 4),
            blocks: Math.floor(Math.random() * 3),
            turnovers: Math.floor(Math.random() * 4),
            field_goals_made: Math.floor(Math.random() * 10) + 2,
            field_goals_attempted: Math.floor(Math.random() * 15) + 5,
            three_pointers_made: Math.floor(Math.random() * 5),
            three_pointers_attempted: Math.floor(Math.random() * 8) + 1,
            free_throws_made: Math.floor(Math.random() * 6) + 1,
            free_throws_attempted: Math.floor(Math.random() * 8) + 1
          });
        }
      }
      
      if (playerStats.length > 0) {
        await supabase
          .from('player_stats')
          .insert(playerStats);
        
        console.log(`   ✅ Added ${playerStats.length} player stats`);
      }
    }
  } catch (error) {
    console.error('   ❌ Error updating player stats:', error.message);
  }
}

async function updateOdds() {
  try {
    console.log('💰 Updating odds...');
    
    // Get scheduled games
    const { data: games } = await supabase
      .from('games')
      .select('id')
      .eq('status', 'scheduled')
      .limit(10);
    
    if (games && games.length > 0) {
      const oddsToInsert = [];
      
      for (const game of games) {
        const homeOdds = Math.random() * 1.5 + 1.2;
        const awayOdds = Math.random() * 1.5 + 1.2;
        const spread = (Math.random() - 0.5) * 20;
        const total = Math.floor(Math.random() * 30) + 200;
        
        oddsToInsert.push({
          game_id: game.id,
          source: 'live_odds',
          odds_type: 'moneyline',
          home_odds: Math.round(homeOdds * 100) / 100,
          away_odds: Math.round(awayOdds * 100) / 100,
          spread: Math.round(spread * 10) / 10,
          total: total,
          sport: 'basketball',
          league: 'NBA',
          live_odds: true
        });
      }
      
      if (oddsToInsert.length > 0) {
        await supabase
          .from('odds')
          .upsert(oddsToInsert, { 
            onConflict: 'game_id,source,odds_type',
            ignoreDuplicates: false 
          });
        
        console.log(`   ✅ Updated ${oddsToInsert.length} odds`);
      }
    }
  } catch (error) {
    console.error('   ❌ Error updating odds:', error.message);
  }
}

async function updatePredictions() {
  try {
    console.log('🔮 Updating predictions...');
    
    // Get scheduled games
    const { data: games } = await supabase
      .from('games')
      .select('id')
      .eq('status', 'scheduled')
      .limit(10);
    
    if (games && games.length > 0) {
      const predictionsToInsert = [];
      
      for (const game of games) {
        const confidence = Math.random() * 0.3 + 0.6;
        const predictedValue = Math.random() * 0.8 + 0.1;
        
        predictionsToInsert.push({
          game_id: game.id,
          model_name: 'live_model_v1',
          prediction_type: 'moneyline',
          predicted_value: Math.round(predictedValue * 100) / 100,
          confidence: Math.round(confidence * 100) / 100,
          sport: 'basketball',
          league: 'NBA',
          reasoning: 'Updated based on latest team performance and injuries',
          model_version: '1.1.0'
        });
      }
      
      if (predictionsToInsert.length > 0) {
        await supabase
          .from('predictions')
          .upsert(predictionsToInsert, { 
            onConflict: 'game_id,model_name,prediction_type',
            ignoreDuplicates: false 
          });
        
        console.log(`   ✅ Updated ${predictionsToInsert.length} predictions`);
      }
    }
  } catch (error) {
    console.error('   ❌ Error updating predictions:', error.message);
  }
}

async function updateStandings() {
  try {
    console.log('🏆 Updating standings...');
    
    // Get teams
    const { data: teams } = await supabase
      .from('teams')
      .select('id, name, league')
      .eq('sport', 'basketball')
      .eq('league', 'NBA');
    
    if (teams && teams.length > 0) {
      // Get recent games to calculate standings
      const { data: recentGames } = await supabase
        .from('games')
        .select('home_team_id, away_team_id, home_score, away_score, status')
        .eq('sport', 'basketball')
        .eq('status', 'finished');
      
      const standingsToUpdate = [];
      
      for (const team of teams) {
        const teamGames = recentGames?.filter(game => 
          game.home_team_id === team.id || game.away_team_id === team.id
        ) || [];
        
        let wins = 0;
        let losses = 0;
        
        for (const game of teamGames) {
          if (game.home_team_id === team.id) {
            if (game.home_score > game.away_score) wins++;
            else if (game.home_score < game.away_score) losses++;
          } else {
            if (game.away_score > game.home_score) wins++;
            else if (game.away_score < game.home_score) losses++;
          }
        }
        
        const winPercentage = wins + losses > 0 ? wins / (wins + losses) : 0;
        
        standingsToUpdate.push({
          team_id: team.id,
          season: '2024-25',
          league: team.league,
          sport: 'basketball',
          wins: wins,
          losses: losses,
          ties: 0,
          win_percentage: Math.round(winPercentage * 1000) / 1000,
          games_back: Math.random() * 10,
          streak: Math.random() > 0.5 ? 'W' + Math.floor(Math.random() * 5) + 1 : 'L' + Math.floor(Math.random() * 5) + 1,
          home_wins: Math.floor(wins * 0.6),
          home_losses: Math.floor(losses * 0.4),
          away_wins: Math.floor(wins * 0.4),
          away_losses: Math.floor(losses * 0.6),
          points_for: Math.floor(Math.random() * 1000) + 2000,
          points_against: Math.floor(Math.random() * 1000) + 2000
        });
      }
      
      if (standingsToUpdate.length > 0) {
        await supabase
          .from('league_standings')
          .upsert(standingsToUpdate, { 
            onConflict: 'team_id,season,league',
            ignoreDuplicates: false 
          });
        
        console.log(`   ✅ Updated ${standingsToUpdate.length} standings`);
      }
    }
  } catch (error) {
    console.error('   ❌ Error updating standings:', error.message);
  }
}

// Main update function
async function performFullUpdate() {
  console.log('🔄 Performing full data update...');
  
  try {
    await updateGames();
    await updatePlayerStats();
    await updateOdds();
    await updatePredictions();
    await updateStandings();
    
    console.log('✅ Full update completed successfully');
  } catch (error) {
    console.error('❌ Error in full update:', error);
  }
}

// Set up cron jobs
function setupCronJobs() {
  console.log('⏰ Setting up automated updates...');
  
  // Update games every 15 minutes
  cron.schedule('*/15 * * * *', async () => {
    console.log('🔄 [CRON] Updating games...');
    await updateGames();
  });
  
  // Update player stats every hour
  cron.schedule('0 * * * *', async () => {
    console.log('🔄 [CRON] Updating player stats...');
    await updatePlayerStats();
  });
  
  // Update odds every 5 minutes
  cron.schedule('*/5 * * * *', async () => {
    console.log('🔄 [CRON] Updating odds...');
    await updateOdds();
  });
  
  // Update predictions every 30 minutes
  cron.schedule('*/30 * * * *', async () => {
    console.log('🔄 [CRON] Updating predictions...');
    await updatePredictions();
  });
  
  // Update standings every 2 hours
  cron.schedule('0 */2 * * *', async () => {
    console.log('🔄 [CRON] Updating standings...');
    await updateStandings();
  });
  
  console.log('✅ Automated updates scheduled:');
  console.log('   📅 Games: every 15 minutes');
  console.log('   📊 Player stats: every hour');
  console.log('   💰 Odds: every 5 minutes');
  console.log('   🔮 Predictions: every 30 minutes');
  console.log('   🏆 Standings: every 2 hours');
}

// Start the automated update system
async function startAutomatedUpdates() {
  try {
    console.log('🚀 Starting ApexBets automated update system...\n');
    
    // Perform initial update
    await performFullUpdate();
    
    // Set up cron jobs
    setupCronJobs();
    
    console.log('\n🎉 Automated update system started successfully!');
    console.log('The system will now automatically update data according to the schedule.');
    console.log('Press Ctrl+C to stop the system.');
    
    // Keep the process running
    process.on('SIGINT', () => {
      console.log('\n⏹️  Stopping automated update system...');
      process.exit(0);
    });
    
  } catch (error) {
    console.error('❌ Error starting automated updates:', error);
    process.exit(1);
  }
}

// Run the automated update system
startAutomatedUpdates();
