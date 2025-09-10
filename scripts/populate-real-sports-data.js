#!/usr/bin/env node

/**
 * Real Sports Data Population Script
 * This script populates the database with real sports data from APIs
 */

const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');
require('dotenv').config({ path: '.env.local' });

console.log('📊 ApexBets Real Sports Data Population');
console.log('=====================================\n');

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// API configurations
const SPORTSDB_API_KEY = process.env.NEXT_PUBLIC_SPORTSDB_API_KEY || '123';
const RAPIDAPI_KEY = process.env.NEXT_PUBLIC_RAPIDAPI_KEY || '';

// Sports configuration
const SPORTS = {
  basketball: {
    leagues: ['NBA'],
    apiClient: 'sportsdb'
  },
  football: {
    leagues: ['NFL'],
    apiClient: 'sportsdb'
  },
  baseball: {
    leagues: ['MLB'],
    apiClient: 'sportsdb'
  },
  hockey: {
    leagues: ['NHL'],
    apiClient: 'sportsdb'
  }
};

async function clearExistingData() {
  console.log('🧹 Clearing existing data...');
  
  try {
    // Clear in order to respect foreign key constraints
    await supabase.from('predictions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('odds').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('games').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('teams').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    
    console.log('✅ Existing data cleared\n');
  } catch (error) {
    console.error('❌ Error clearing data:', error.message);
    throw error;
  }
}

async function fetchSportsDBData(endpoint) {
  try {
    const url = `https://www.thesportsdb.com/api/v1/json/${SPORTSDB_API_KEY}${endpoint}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`SportsDB API Error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('SportsDB API request failed:', error.message);
    return null;
  }
}

async function fetchBallDontLieData(endpoint) {
  try {
    const url = `https://www.balldontlie.io/api/v1${endpoint}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`BallDontLie API Error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('BallDontLie API request failed:', error.message);
    return null;
  }
}

async function fetchAndPopulateTeams(sport, leagues) {
  console.log(`👥 Fetching ${sport} teams...`);
  
  try {
    const teams = [];
    
    for (const league of leagues) {
      try {
        let leagueTeams = [];
        
        if (sport === 'basketball' && league === 'NBA') {
          // Use BallDontLie for NBA teams
          const nbaData = await fetchBallDontLieData('/teams');
          if (nbaData && nbaData.data) {
            leagueTeams = nbaData.data.map(team => ({
              name: team.full_name,
              city: team.city,
              league: 'NBA',
              sport: 'basketball',
              abbreviation: team.abbreviation,
              conference: team.conference,
              division: team.division,
              logo_url: team.logo
            }));
          }
        } else {
          // Use SportsDB for other sports
          const leaguesData = await fetchSportsDBData(`/search_all_leagues.php?s=${sport}`);
          const targetLeague = leaguesData?.leagues?.find(l => l.strLeague === league);
          
          if (targetLeague) {
            const teamsData = await fetchSportsDBData(`/lookup_all_teams.php?id=${targetLeague.idLeague}`);
            if (teamsData?.teams) {
              leagueTeams = teamsData.teams.map(team => ({
                name: team.strTeam,
                city: team.strTeam.split(' ').slice(0, -1).join(' '),
                league: league,
                sport: sport,
                abbreviation: team.strTeamShort,
                logo_url: team.strTeamBadge
              }));
            }
          }
        }
        
        teams.push(...leagueTeams);
        console.log(`   ✅ ${leagueTeams.length} ${league} teams fetched`);
        
        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error(`   ❌ Error fetching ${league} teams:`, error.message);
      }
    }
    
    if (teams.length > 0) {
      const { error } = await supabase
        .from('teams')
        .insert(teams);
      
      if (error) {
        console.error(`❌ Error inserting ${sport} teams:`, error.message);
      } else {
        console.log(`✅ ${teams.length} ${sport} teams inserted`);
      }
    }
    
    return teams;
  } catch (error) {
    console.error(`❌ Error fetching ${sport} teams:`, error.message);
    return [];
  }
}

async function fetchAndPopulateGames(sport, teams) {
  console.log(`🏟️  Fetching ${sport} games...`);
  
  try {
    const games = [];
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - 7); // Last 7 days
    const endDate = new Date(today);
    endDate.setDate(today.getDate() + 7); // Next 7 days
    
    // Fetch games for the date range
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      try {
        const dateStr = d.toISOString().split('T')[0];
        let sportGames = [];
        
        if (sport === 'basketball') {
          const nbaData = await fetchBallDontLieData(`/games?start_date=${dateStr}&end_date=${dateStr}`);
          
          if (nbaData && nbaData.data) {
            sportGames = nbaData.data.map(game => {
              const homeTeam = teams.find(t => t.abbreviation === game.home_team.abbreviation);
              const awayTeam = teams.find(t => t.abbreviation === game.visitor_team.abbreviation);
              
              if (homeTeam && awayTeam) {
                return {
                  home_team_id: homeTeam.id,
                  away_team_id: awayTeam.id,
                  game_date: game.date,
                  season: '2024-25',
                  status: game.status === 'Final' ? 'completed' : 
                          game.status === 'In Progress' ? 'live' : 'scheduled',
                  home_score: game.home_team_score || null,
                  away_score: game.visitor_team_score || null,
                  sport: sport,
                  league: 'NBA'
                };
              }
              return null;
            }).filter(Boolean);
          }
        } else {
          const sportsdbData = await fetchSportsDBData(`/eventsday.php?d=${dateStr}&s=${sport}`);
          
          if (sportsdbData?.events) {
            sportGames = sportsdbData.events.map(game => {
              const homeTeam = teams.find(t => t.name === game.strHomeTeam);
              const awayTeam = teams.find(t => t.name === game.strAwayTeam);
              
              if (homeTeam && awayTeam) {
                return {
                  home_team_id: homeTeam.id,
                  away_team_id: awayTeam.id,
                  game_date: `${game.dateEvent} ${game.strTime || '00:00:00'}`,
                  season: '2024-25',
                  status: game.strStatus === 'Match Finished' ? 'completed' : 
                          game.strStatus === 'Live' ? 'live' : 'scheduled',
                  home_score: game.intHomeScore ? parseInt(game.intHomeScore) : null,
                  away_score: game.intAwayScore ? parseInt(game.intAwayScore) : null,
                  sport: sport,
                  league: game.strLeague
                };
              }
              return null;
            }).filter(Boolean);
          }
        }
        
        games.push(...sportGames);
        
        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000));
        
      } catch (error) {
        console.error(`   ❌ Error fetching games for ${d.toISOString().split('T')[0]}:`, error.message);
      }
    }
    
    if (games.length > 0) {
      const { error } = await supabase
        .from('games')
        .insert(games);
      
      if (error) {
        console.error(`❌ Error inserting ${sport} games:`, error.message);
      } else {
        console.log(`✅ ${games.length} ${sport} games inserted`);
      }
    }
    
    return games;
  } catch (error) {
    console.error(`❌ Error fetching ${sport} games:`, error.message);
    return [];
  }
}

async function populateRealData() {
  try {
    console.log('🔄 Starting real data population...\n');
    
    // Clear existing data
    await clearExistingData();
    
    // Process each sport
    for (const [sport, config] of Object.entries(SPORTS)) {
      console.log(`\n🏆 Processing ${sport.toUpperCase()}...`);
      console.log('='.repeat(30));
      
      // Fetch and populate teams
      const teams = await fetchAndPopulateTeams(sport, config.leagues);
      
      if (teams.length > 0) {
        // Fetch and populate games
        await fetchAndPopulateGames(sport, teams);
      }
      
      console.log(`✅ ${sport} data population complete\n`);
    }
    
    // Generate summary
    console.log('🎉 Real data population complete!');
    console.log('\n📊 Summary:');
    console.log('===========');
    
    const { count: teamCount } = await supabase.from('teams').select('*', { count: 'exact', head: true });
    const { count: gameCount } = await supabase.from('games').select('*', { count: 'exact', head: true });
    
    console.log(`Teams: ${teamCount || 0}`);
    console.log(`Games: ${gameCount || 0}`);
    
    console.log('\n🚀 Your ApexBets website now has real sports data!');
    console.log('   Visit http://localhost:3000 to see it in action.');

  } catch (error) {
    console.error('❌ Error during real data population:', error.message);
    process.exit(1);
  }
}

// Run the population script
populateRealData();