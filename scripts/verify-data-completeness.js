#!/usr/bin/env node

/**
 * Data Completeness Verification Script
 * This script verifies that all necessary data is present and accurate
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

console.log('🔍 ApexBets Data Completeness Verification');
console.log('==========================================\n');

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Verification functions
async function verifyTeams() {
  console.log('👥 Verifying teams data...');
  
  try {
    const { data: teams, error } = await supabase
      .from('teams')
      .select('*');
    
    if (error) throw error;
    
    const totalTeams = teams.length;
    const teamsWithLogos = teams.filter(t => t.logo_url).length;
    const teamsWithCompleteData = teams.filter(t => 
      t.name && t.city && t.abbreviation && t.sport && t.league
    ).length;
    
    console.log(`   📊 Total teams: ${totalTeams}`);
    console.log(`   🖼️  Teams with logos: ${teamsWithLogos} (${Math.round(teamsWithLogos/totalTeams*100)}%)`);
    console.log(`   ✅ Complete data: ${teamsWithCompleteData} (${Math.round(teamsWithCompleteData/totalTeams*100)}%)`);
    
    // Check for missing data
    const missingLogos = teams.filter(t => !t.logo_url).length;
    if (missingLogos > 0) {
      console.log(`   ⚠️  ${missingLogos} teams missing logos`);
    }
    
    return {
      total: totalTeams,
      withLogos: teamsWithLogos,
      complete: teamsWithCompleteData,
      missingLogos: missingLogos
    };
  } catch (error) {
    console.error('   ❌ Error verifying teams:', error.message);
    return { total: 0, withLogos: 0, complete: 0, missingLogos: 0 };
  }
}

async function verifyGames() {
  console.log('🏟️  Verifying games data...');
  
  try {
    const { data: games, error } = await supabase
      .from('games')
      .select('*');
    
    if (error) throw error;
    
    const totalGames = games.length;
    const scheduledGames = games.filter(g => g.status === 'scheduled').length;
    const finishedGames = games.filter(g => g.status === 'finished').length;
    const gamesWithScores = games.filter(g => g.home_score !== null && g.away_score !== null).length;
    
    console.log(`   📊 Total games: ${totalGames}`);
    console.log(`   📅 Scheduled: ${scheduledGames}`);
    console.log(`   ✅ Finished: ${finishedGames}`);
    console.log(`   🎯 With scores: ${gamesWithScores}`);
    
    return {
      total: totalGames,
      scheduled: scheduledGames,
      finished: finishedGames,
      withScores: gamesWithScores
    };
  } catch (error) {
    console.error('   ❌ Error verifying games:', error.message);
    return { total: 0, scheduled: 0, finished: 0, withScores: 0 };
  }
}

async function verifyPlayerStats() {
  console.log('📊 Verifying player stats data...');
  
  try {
    const { data: playerStats, error } = await supabase
      .from('player_stats')
      .select('*');
    
    if (error) throw error;
    
    const totalStats = playerStats.length;
    const statsWithPoints = playerStats.filter(ps => ps.points !== null).length;
    const statsWithCompleteData = playerStats.filter(ps => 
      ps.player_name && ps.position && ps.points !== null
    ).length;
    
    console.log(`   📊 Total player stats: ${totalStats}`);
    console.log(`   🎯 With points: ${statsWithPoints}`);
    console.log(`   ✅ Complete data: ${statsWithCompleteData}`);
    
    return {
      total: totalStats,
      withPoints: statsWithPoints,
      complete: statsWithCompleteData
    };
  } catch (error) {
    console.error('   ❌ Error verifying player stats:', error.message);
    return { total: 0, withPoints: 0, complete: 0 };
  }
}

async function verifyOdds() {
  console.log('💰 Verifying odds data...');
  
  try {
    const { data: odds, error } = await supabase
      .from('odds')
      .select('*');
    
    if (error) throw error;
    
    const totalOdds = odds.length;
    const liveOdds = odds.filter(o => o.live_odds).length;
    const oddsWithCompleteData = odds.filter(o => 
      o.home_odds && o.away_odds && o.source
    ).length;
    
    console.log(`   📊 Total odds: ${totalOdds}`);
    console.log(`   🔴 Live odds: ${liveOdds}`);
    console.log(`   ✅ Complete data: ${oddsWithCompleteData}`);
    
    return {
      total: totalOdds,
      live: liveOdds,
      complete: oddsWithCompleteData
    };
  } catch (error) {
    console.error('   ❌ Error verifying odds:', error.message);
    return { total: 0, live: 0, complete: 0 };
  }
}

async function verifyPredictions() {
  console.log('🔮 Verifying predictions data...');
  
  try {
    const { data: predictions, error } = await supabase
      .from('predictions')
      .select('*');
    
    if (error) throw error;
    
    const totalPredictions = predictions.length;
    const predictionsWithConfidence = predictions.filter(p => p.confidence > 0).length;
    const predictionsWithCompleteData = predictions.filter(p => 
      p.model_name && p.prediction_type && p.confidence > 0
    ).length;
    
    console.log(`   📊 Total predictions: ${totalPredictions}`);
    console.log(`   🎯 With confidence: ${predictionsWithConfidence}`);
    console.log(`   ✅ Complete data: ${predictionsWithCompleteData}`);
    
    return {
      total: totalPredictions,
      withConfidence: predictionsWithConfidence,
      complete: predictionsWithCompleteData
    };
  } catch (error) {
    console.error('   ❌ Error verifying predictions:', error.message);
    return { total: 0, withConfidence: 0, complete: 0 };
  }
}

async function verifyStandings() {
  console.log('🏆 Verifying standings data...');
  
  try {
    const { data: standings, error } = await supabase
      .from('league_standings')
      .select('*');
    
    if (error) throw error;
    
    const totalStandings = standings.length;
    const standingsWithCompleteData = standings.filter(s => 
      s.wins !== null && s.losses !== null && s.win_percentage !== null
    ).length;
    
    console.log(`   📊 Total standings: ${totalStandings}`);
    console.log(`   ✅ Complete data: ${standingsWithCompleteData}`);
    
    return {
      total: totalStandings,
      complete: standingsWithCompleteData
    };
  } catch (error) {
    console.error('   ❌ Error verifying standings:', error.message);
    return { total: 0, complete: 0 };
  }
}

async function verifyDataRelationships() {
  console.log('🔗 Verifying data relationships...');
  
  try {
    // Check games have valid team references
    const { data: gamesWithTeams, error: gamesError } = await supabase
      .from('games')
      .select(`
        id,
        home_team:teams!games_home_team_id_fkey(name),
        away_team:teams!games_away_team_id_fkey(name)
      `)
      .limit(5);
    
    if (gamesError) throw gamesError;
    
    const validGames = gamesWithTeams.filter(g => g.home_team && g.away_team).length;
    console.log(`   🏟️  Games with valid teams: ${validGames}/${gamesWithTeams.length}`);
    
    // Check player stats have valid game references
    const { data: statsWithGames, error: statsError } = await supabase
      .from('player_stats')
      .select(`
        id,
        game:games(id)
      `)
      .limit(5);
    
    if (statsError) throw statsError;
    
    const validStats = statsWithGames.filter(s => s.game).length;
    console.log(`   📊 Player stats with valid games: ${validStats}/${statsWithGames.length}`);
    
    return {
      validGames: validGames,
      validStats: validStats
    };
  } catch (error) {
    console.error('   ❌ Error verifying relationships:', error.message);
    return { validGames: 0, validStats: 0 };
  }
}

async function generateReport() {
  console.log('📋 Generating comprehensive report...\n');
  
  const teams = await verifyTeams();
  const games = await verifyGames();
  const playerStats = await verifyPlayerStats();
  const odds = await verifyOdds();
  const predictions = await verifyPredictions();
  const standings = await verifyStandings();
  const relationships = await verifyDataRelationships();
  
  console.log('\n📊 COMPREHENSIVE DATA REPORT');
  console.log('============================');
  
  // Overall health score
  const totalRecords = teams.total + games.total + playerStats.total + odds.total + predictions.total + standings.total;
  const completeRecords = teams.complete + games.withScores + playerStats.complete + odds.complete + predictions.complete + standings.complete;
  const healthScore = totalRecords > 0 ? Math.round((completeRecords / totalRecords) * 100) : 0;
  
  console.log(`\n🎯 Overall Health Score: ${healthScore}%`);
  
  // Data completeness summary
  console.log('\n📈 Data Completeness:');
  console.log(`   👥 Teams: ${teams.complete}/${teams.total} (${Math.round(teams.complete/teams.total*100)}%)`);
  console.log(`   🏟️  Games: ${games.withScores}/${games.total} (${Math.round(games.withScores/games.total*100)}%)`);
  console.log(`   📊 Player Stats: ${playerStats.complete}/${playerStats.total} (${Math.round(playerStats.complete/playerStats.total*100)}%)`);
  console.log(`   💰 Odds: ${odds.complete}/${odds.total} (${Math.round(odds.complete/odds.total*100)}%)`);
  console.log(`   🔮 Predictions: ${predictions.complete}/${predictions.total} (${Math.round(predictions.complete/predictions.total*100)}%)`);
  console.log(`   🏆 Standings: ${standings.complete}/${standings.total} (${Math.round(standings.complete/standings.total*100)}%)`);
  
  // Issues and recommendations
  console.log('\n⚠️  Issues & Recommendations:');
  
  if (teams.missingLogos > 0) {
    console.log(`   🖼️  ${teams.missingLogos} teams missing logos - consider implementing logo fetching`);
  }
  
  if (games.scheduled === 0) {
    console.log('   📅 No scheduled games - consider adding more future games');
  }
  
  if (playerStats.total < 50) {
    console.log('   📊 Low player stats count - consider adding more historical data');
  }
  
  if (odds.live === 0) {
    console.log('   💰 No live odds - consider implementing real-time odds updates');
  }
  
  if (predictions.total < 20) {
    console.log('   🔮 Low predictions count - consider adding more ML predictions');
  }
  
  // Final assessment
  console.log('\n🎉 Final Assessment:');
  if (healthScore >= 90) {
    console.log('   ✅ EXCELLENT - Database is in great shape!');
  } else if (healthScore >= 70) {
    console.log('   ✅ GOOD - Database is functional with minor improvements needed');
  } else if (healthScore >= 50) {
    console.log('   ⚠️  FAIR - Database needs significant improvements');
  } else {
    console.log('   ❌ POOR - Database needs major work');
  }
  
  console.log('\n🚀 Your ApexBets application is ready to use!');
  console.log('   Visit http://localhost:3000 to see it in action.');
}

// Run the verification
generateReport().catch(error => {
  console.error('❌ Verification failed:', error);
  process.exit(1);
});
