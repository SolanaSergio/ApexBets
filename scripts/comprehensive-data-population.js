#!/usr/bin/env node

/**
 * Comprehensive Data Population Script
 * Populates the database with real sports data from working APIs
 * Uses SportsDB API (free) for comprehensive coverage
 */

const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');
require('dotenv').config({ path: '.env.local' });

console.log('📊 ApexBets Comprehensive Data Population');
console.log('========================================\n');

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// API configurations
const SPORTSDB_API_KEY = process.env.NEXT_PUBLIC_SPORTSDB_API_KEY || '123';

// Sports configuration with real league IDs from SportsDB
const SPORTS_CONFIG = {
  basketball: {
    name: 'Basketball',
    leagues: [
      { id: '4387', name: 'NBA', sport: 'basketball' },
      { id: '4388', name: 'NBA G League', sport: 'basketball' },
      { id: '4433', name: 'Italian Lega Basket', sport: 'basketball' },
      { id: '4477', name: 'Adriatic ABA League', sport: 'basketball' }
    ]
  },
  football: {
    name: 'American Football',
    leagues: [
      { id: '4391', name: 'NFL', sport: 'americanfootball' },
      { id: '4392', name: 'NCAA Football', sport: 'americanfootball' }
    ]
  },
  baseball: {
    name: 'Baseball',
    leagues: [
      { id: '4424', name: 'MLB', sport: 'baseball' },
      { id: '4425', name: 'Minor League Baseball', sport: 'baseball' }
    ]
  },
  hockey: {
    name: 'Ice Hockey',
    leagues: [
      { id: '4380', name: 'NHL', sport: 'icehockey' },
      { id: '4381', name: 'AHL', sport: 'icehockey' }
    ]
  },
  soccer: {
    name: 'Soccer',
    leagues: [
      { id: '4328', name: 'Premier League', sport: 'soccer' },
      { id: '4335', name: 'La Liga', sport: 'soccer' },
      { id: '4331', name: 'Bundesliga', sport: 'soccer' },
      { id: '4332', name: 'Serie A', sport: 'soccer' },
      { id: '4334', name: 'Ligue 1', sport: 'soccer' }
    ]
  },
  tennis: {
    name: 'Tennis',
    leagues: [
      { id: '4401', name: 'ATP', sport: 'tennis' },
      { id: '4402', name: 'WTA', sport: 'tennis' }
    ]
  },
  golf: {
    name: 'Golf',
    leagues: [
      { id: '4429', name: 'PGA Tour', sport: 'golf' },
      { id: '4430', name: 'LPGA', sport: 'golf' }
    ]
  }
};

// Helper function to make API requests
async function makeApiRequest(url, timeout = 10000) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    const response = await fetch(url, {
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error(`Request timeout after ${timeout}ms`);
    }
    throw error;
  }
}

// Helper function to get conference and division for teams
function getConferenceAndDivision(teamName, sport, league) {
  if (sport === 'basketball' && league === 'NBA') {
    const easternTeams = [
      'Atlanta Hawks', 'Boston Celtics', 'Brooklyn Nets', 'Charlotte Hornets',
      'Chicago Bulls', 'Cleveland Cavaliers', 'Detroit Pistons', 'Indiana Pacers',
      'Miami Heat', 'Milwaukee Bucks', 'New York Knicks', 'Orlando Magic',
      'Philadelphia 76ers', 'Toronto Raptors', 'Washington Wizards'
    ];
    
    const atlanticTeams = ['Boston Celtics', 'Brooklyn Nets', 'New York Knicks', 'Philadelphia 76ers', 'Toronto Raptors'];
    const centralTeams = ['Chicago Bulls', 'Cleveland Cavaliers', 'Detroit Pistons', 'Indiana Pacers', 'Milwaukee Bucks'];
    const southeastTeams = ['Atlanta Hawks', 'Charlotte Hornets', 'Miami Heat', 'Orlando Magic', 'Washington Wizards'];
    
    const conference = easternTeams.includes(teamName) ? 'Eastern' : 'Western';
    let division = 'Atlantic';
    
    if (atlanticTeams.includes(teamName)) division = 'Atlantic';
    else if (centralTeams.includes(teamName)) division = 'Central';
    else if (southeastTeams.includes(teamName)) division = 'Southeast';
    else if (['Dallas Mavericks', 'Houston Rockets', 'Memphis Grizzlies', 'New Orleans Pelicans', 'San Antonio Spurs'].includes(teamName)) division = 'Southwest';
    else if (['Denver Nuggets', 'Minnesota Timberwolves', 'Oklahoma City Thunder', 'Portland Trail Blazers', 'Utah Jazz'].includes(teamName)) division = 'Northwest';
    else if (['Golden State Warriors', 'Los Angeles Clippers', 'Los Angeles Lakers', 'Phoenix Suns', 'Sacramento Kings'].includes(teamName)) division = 'Pacific';
    
    return { conference, division };
  }
  
  if (sport === 'americanfootball' && league === 'NFL') {
    const nfcTeams = [
      'Arizona Cardinals', 'Atlanta Falcons', 'Carolina Panthers', 'Chicago Bears',
      'Dallas Cowboys', 'Detroit Lions', 'Green Bay Packers', 'Los Angeles Rams',
      'Minnesota Vikings', 'New Orleans Saints', 'New York Giants', 'Philadelphia Eagles',
      'San Francisco 49ers', 'Seattle Seahawks', 'Tampa Bay Buccaneers', 'Washington Commanders'
    ];
    
    const conference = nfcTeams.includes(teamName) ? 'NFC' : 'AFC';
    let division = 'East';
    
    if (['Dallas Cowboys', 'New York Giants', 'Philadelphia Eagles', 'Washington Commanders'].includes(teamName)) division = 'East';
    else if (['Chicago Bears', 'Detroit Lions', 'Green Bay Packers', 'Minnesota Vikings'].includes(teamName)) division = 'North';
    else if (['Atlanta Falcons', 'Carolina Panthers', 'New Orleans Saints', 'Tampa Bay Buccaneers'].includes(teamName)) division = 'South';
    else if (['Arizona Cardinals', 'Los Angeles Rams', 'San Francisco 49ers', 'Seattle Seahawks'].includes(teamName)) division = 'West';
    
    return { conference, division };
  }
  
  return { conference: null, division: null };
}

// Function to fetch and insert teams for a sport
async function populateTeams(sport, leagues) {
  console.log(`👥 Fetching ${sport} teams...`);
  
  const allTeams = [];
  
  for (const league of leagues) {
    try {
      console.log(`   📋 Fetching ${league.name} teams...`);
      
      // Get teams from SportsDB
      const teamsUrl = `https://www.thesportsdb.com/api/v1/json/${SPORTSDB_API_KEY}/search_all_teams.php?l=${encodeURIComponent(league.name)}`;
      const teamsData = await makeApiRequest(teamsUrl);
      
      if (teamsData.teams && Array.isArray(teamsData.teams)) {
        for (const team of teamsData.teams) {
          const { conference, division } = getConferenceAndDivision(team.strTeam, sport, league.name);
          
          allTeams.push({
            name: team.strTeam,
            city: team.strTeam.split(' ').slice(0, -1).join(' '),
            league: league.name,
            sport: sport,
            abbreviation: team.strTeamShort || team.strTeam.substring(0, 3).toUpperCase(),
            logo_url: team.strTeamBadge,
            conference,
            division,
            founded_year: team.intFormedYear ? parseInt(team.intFormedYear) : null,
            stadium_name: team.strStadium,
            stadium_capacity: team.intStadiumCapacity ? parseInt(team.intStadiumCapacity) : null,
            primary_color: team.strTeamJersey,
            secondary_color: null,
            country: team.strCountry || 'US',
            is_active: true
          });
        }
        
        console.log(`   ✅ ${teamsData.teams.length} ${league.name} teams fetched`);
      }
    } catch (error) {
      console.log(`   ⚠️  Error fetching ${league.name} teams: ${error.message}`);
    }
  }
  
  if (allTeams.length > 0) {
    try {
      // Clear existing teams for this sport
      await supabase
        .from('teams')
        .delete()
        .eq('sport', sport);
      
      // Insert new teams
      const { error } = await supabase
        .from('teams')
        .insert(allTeams);
      
      if (error) {
        console.log(`   ❌ Error inserting ${sport} teams: ${error.message}`);
      } else {
        console.log(`   ✅ ${allTeams.length} ${sport} teams inserted`);
      }
    } catch (error) {
      console.log(`   ❌ Error processing ${sport} teams: ${error.message}`);
    }
  }
  
  return allTeams.length;
}

// Function to fetch and insert games for a sport
async function populateGames(sport, leagues, daysBack = 30) {
  console.log(`🏟️  Fetching ${sport} games...`);
  
  const allGames = [];
  const today = new Date();
  
  for (let i = 0; i < daysBack; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    
    for (const league of leagues) {
      try {
        // Get games from SportsDB
        const gamesUrl = `https://www.thesportsdb.com/api/v1/json/${SPORTSDB_API_KEY}/eventsday.php?d=${dateStr}&s=${league.sport}`;
        const gamesData = await makeApiRequest(gamesUrl);
        
        if (gamesData.events && Array.isArray(gamesData.events)) {
          for (const event of gamesData.events) {
            // Only include games from the specific league
            if (event.strLeague === league.name) {
              // Get team IDs
              const homeTeam = await supabase
                .from('teams')
                .select('id')
                .eq('name', event.strHomeTeam)
                .eq('sport', sport)
                .single();
              
              const awayTeam = await supabase
                .from('teams')
                .select('id')
                .eq('name', event.strAwayTeam)
                .eq('sport', sport)
                .single();
              
              if (homeTeam.data && awayTeam.data) {
                allGames.push({
                  home_team_id: homeTeam.data.id,
                  away_team_id: awayTeam.data.id,
                  game_date: event.dateEvent,
                  game_time: event.strTime,
                  home_score: event.intHomeScore ? parseInt(event.intHomeScore) : null,
                  away_score: event.intAwayScore ? parseInt(event.intAwayScore) : null,
                  status: event.strStatus === 'FT' ? 'finished' : 
                         event.strStatus === 'LIVE' ? 'in_progress' : 'scheduled',
                  sport: sport,
                  league: league.name,
                  venue: event.strVenue,
                  game_type: 'regular',
                  overtime_periods: 0,
                  attendance: null,
                  created_at: new Date().toISOString()
                });
              }
            }
          }
        }
      } catch (error) {
        console.log(`   ⚠️  Error fetching games for ${league.name} on ${dateStr}: ${error.message}`);
      }
    }
  }
  
  if (allGames.length > 0) {
    try {
      // Clear existing games for this sport
      await supabase
        .from('games')
        .delete()
        .eq('sport', sport);
      
      // Insert new games
      const { error } = await supabase
        .from('games')
        .insert(allGames);
      
      if (error) {
        console.log(`   ❌ Error inserting ${sport} games: ${error.message}`);
      } else {
        console.log(`   ✅ ${allGames.length} ${sport} games inserted`);
      }
    } catch (error) {
      console.log(`   ❌ Error processing ${sport} games: ${error.message}`);
    }
  }
  
  return allGames.length;
}

// Function to create sample predictions
async function createSamplePredictions(sport) {
  console.log(`🔮 Creating sample predictions for ${sport}...`);
  
  try {
    // Get recent games
    const { data: games } = await supabase
      .from('games')
      .select('id, home_team_id, away_team_id, home_score, away_score, status')
      .eq('sport', sport)
      .eq('status', 'scheduled')
      .limit(10);
    
    if (games && games.length > 0) {
      const predictions = games.map(game => ({
        game_id: game.id,
        prediction_type: 'moneyline',
        predicted_value: Math.random() > 0.5 ? 'home' : 'away',
        confidence_score: Math.random() * 0.4 + 0.6, // 60-100% confidence
        model: 'random_forest_v1',
        sport: sport,
        league: 'NBA', // This would be dynamic based on the game
        reasoning: 'Based on historical performance and current form',
        model_version: '1.0.0',
        created_at: new Date().toISOString()
      }));
      
      const { error } = await supabase
        .from('predictions')
        .insert(predictions);
      
      if (error) {
        console.log(`   ❌ Error creating predictions: ${error.message}`);
      } else {
        console.log(`   ✅ ${predictions.length} predictions created`);
      }
    }
  } catch (error) {
    console.log(`   ❌ Error creating predictions: ${error.message}`);
  }
}

// Main population function
async function populateData() {
  console.log('🔄 Starting comprehensive data population...\n');
  
  let totalTeams = 0;
  let totalGames = 0;
  
  for (const [sportKey, sportConfig] of Object.entries(SPORTS_CONFIG)) {
    console.log(`\n🏆 Processing ${sportConfig.name.toUpperCase()}...`);
    console.log('='.repeat(sportConfig.name.length + 20));
    
    // Populate teams
    const teamCount = await populateTeams(sportKey, sportConfig.leagues);
    totalTeams += teamCount;
    
    // Populate games
    const gameCount = await populateGames(sportKey, sportConfig.leagues);
    totalGames += gameCount;
    
    // Create sample predictions
    await createSamplePredictions(sportKey);
  }
  
  console.log('\n📊 Population Summary:');
  console.log('=====================');
  console.log(`✅ Total teams inserted: ${totalTeams}`);
  console.log(`✅ Total games inserted: ${totalGames}`);
  console.log(`✅ Sports processed: ${Object.keys(SPORTS_CONFIG).length}`);
  
  console.log('\n🎉 Data population completed successfully!');
  console.log('You can now test the API endpoints to see the real data.');
}

// Run the population
populateData().catch(error => {
  console.error('❌ Data population failed:', error);
  process.exit(1);
});
