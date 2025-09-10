#!/usr/bin/env node

/**
 * ApexBets Data Manager
 * Single comprehensive system for all data operations
 * - Real-time data population from multiple APIs
 * - Automatic data validation and cleanup
 * - Mock data detection and removal
 * - Multi-sport support with dynamic updates
 */

const { createClient } = require('@supabase/supabase-js');
const cron = require('node-cron');
const fetch = require('node-fetch');
require('dotenv').config({ path: '../.env.local' });

console.log('🚀 ApexBets Data Manager Starting...');
console.log('====================================\n');

// Debug environment variables
console.log('Environment check:');
console.log('SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Missing');
console.log('SERVICE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Set' : '❌ Missing');
console.log('');

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

class ApexDataManager {
  constructor() {
    this.isRunning = false;
    this.lastUpdate = new Date();
    this.errorCount = 0;
    this.maxErrors = 5;
    
    // API configurations with rate limiting
    this.apis = {
      sportsDB: {
        baseUrl: 'https://www.thesportsdb.com/api/v1/json',
        key: process.env.SPORTSDB_API_KEY || '123',
        rateLimit: 100,
        lastCall: 0
      },
      ballDontLie: {
        baseUrl: 'https://api.balldontlie.io/v1',
        key: process.env.NEXT_PUBLIC_BALLDONTLIE_API_KEY,
        rateLimit: 1000,
        lastCall: 0
      },
      rapidAPI: {
        baseUrl: 'https://api-sports.p.rapidapi.com',
        key: process.env.NEXT_PUBLIC_RAPIDAPI_KEY,
        rateLimit: 100,
        lastCall: 0
      },
      oddsAPI: {
        baseUrl: 'https://api.the-odds-api.com/v4',
        key: process.env.NEXT_PUBLIC_ODDS_API_KEY,
        rateLimit: 100,
        lastCall: 0
      }
    };
    
    // Sports configuration
    this.sports = {
      basketball: { leagues: ['NBA', 'WNBA'], updateFreq: 15 },
      football: { leagues: ['NFL'], updateFreq: 30 },
      baseball: { leagues: ['MLB'], updateFreq: 60 },
      hockey: { leagues: ['NHL'], updateFreq: 30 },
      soccer: { leagues: ['Premier League', 'La Liga'], updateFreq: 60 }
    };
  }

  async start() {
    if (this.isRunning) {
      console.log('⚠️  Data manager is already running');
      return;
    }

    this.isRunning = true;
    console.log('✅ ApexBets Data Manager started');
    
    // Initial setup
    await this.initialSetup();
    
    // Set up scheduled tasks
    this.setupScheduledTasks();
    
    console.log('🔄 Background tasks scheduled:');
    console.log('   - Data updates: Every 15 minutes');
    console.log('   - Data cleanup: Every hour');
    console.log('   - Mock data removal: Every 30 minutes\n');
  }

  async initialSetup() {
    console.log('🌱 Initial setup...');
    
    try {
      // Clear all mock data
      await this.clearAllMockData();
      
      // Populate real data for all sports
      for (const [sport, config] of Object.entries(this.sports)) {
        console.log(`   📊 Setting up ${sport}...`);
        await this.populateSportData(sport, config);
        await this.delay(1000); // Rate limiting
      }
      
      console.log('✅ Initial setup completed\n');
      
    } catch (error) {
      console.error('❌ Initial setup failed:', error.message);
      this.errorCount++;
    }
  }

  async clearAllMockData() {
    console.log('🧹 Clearing all mock data...');
    
    try {
      // Clear mock predictions
      const { error: predError } = await supabase
        .from('predictions')
        .delete()
        .or('model_name.ilike.%mock%,model_name.ilike.%fake%,model_name.ilike.%sample%');
      
      if (predError) console.log('   ⚠️  Error clearing mock predictions:', predError.message);
      
      // Clear mock odds
      const { error: oddsError } = await supabase
        .from('odds')
        .delete()
        .or('source.ilike.%mock%,source.ilike.%fake%,source.ilike.%sample%');
      
      if (oddsError) console.log('   ⚠️  Error clearing mock odds:', oddsError.message);
      
      // Clear mock player stats
      const { error: statsError } = await supabase
        .from('player_stats')
        .delete()
        .or('player_name.ilike.%mock%,player_name.ilike.%fake%,player_name.ilike.%sample%');
      
      if (statsError) console.log('   ⚠️  Error clearing mock player stats:', statsError.message);
      
      console.log('   ✅ Mock data cleared');
      
    } catch (error) {
      console.error('   ❌ Error clearing mock data:', error.message);
    }
  }

  async populateSportData(sport, config) {
    try {
      // Populate teams
      const teams = await this.fetchTeamsFromAPI(sport);
      if (teams && teams.length > 0) {
        await this.upsertTeams(teams);
        console.log(`   ✅ ${teams.length} ${sport} teams updated`);
      }
      
      // Populate games
      const games = await this.fetchGamesFromAPI(sport);
      if (games && games.length > 0) {
        await this.upsertGames(games);
        console.log(`   ✅ ${games.length} ${sport} games updated`);
      }
      
      // Populate player stats
      const playerStats = await this.fetchPlayerStatsFromAPI(sport);
      if (playerStats && playerStats.length > 0) {
        await this.upsertPlayerStats(playerStats);
        console.log(`   ✅ ${playerStats.length} ${sport} player stats updated`);
      }
      
    } catch (error) {
      console.log(`   ❌ Error populating ${sport}:`, error.message);
    }
  }

  async fetchTeamsFromAPI(sport) {
    try {
      if (sport === 'basketball') {
        return await this.fetchBasketballTeams();
      } else {
        // For other sports, try TheSportsDB (if key is valid)
        const api = this.apis.sportsDB;
        const url = `${api.baseUrl}/${api.key}/search_all_teams.php?s=${sport}`;
        
        const response = await fetch(url);
        const data = await response.json();
        
        // Debug output
        console.log(`   🔍 API Response for ${sport} teams:`, data ? 'Data received' : 'No data');
        if (data && data.teams) {
          console.log(`   📊 Teams array length:`, Array.isArray(data.teams) ? data.teams.length : 'Not an array');
        }
        
        if (data && data.teams && Array.isArray(data.teams)) {
          return data.teams.map(team => ({
            name: team.strTeam,
            city: team.strStadiumLocation,
            abbreviation: team.strTeamShort,
            logo_url: team.strTeamBadge,
            sport: sport,
            league: team.strLeague,
            conference: team.strConference || null,
            division: team.strDivision || null,
            stadium_name: team.strStadium,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }));
        }
      }
      
      return [];
      
    } catch (error) {
      console.log(`   ⚠️  Error fetching ${sport} teams:`, error.message);
      return [];
    }
  }

  async fetchBasketballTeams() {
    try {
      const api = this.apis.ballDontLie;
      const url = `${api.baseUrl}/teams`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': api.key
        }
      });
      const data = await response.json();
      
      if (data && data.data) {
        return data.data.map(team => ({
          name: team.full_name,
          city: team.city,
          abbreviation: team.abbreviation,
          logo_url: null, // BallDontLie doesn't provide logos
          sport: 'basketball',
          league: 'NBA',
          conference: team.conference,
          division: team.division,
          stadium_name: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }));
      }
      
      return [];
      
    } catch (error) {
      console.log('   ⚠️  Error fetching basketball teams:', error.message);
      return [];
    }
  }

  async fetchGamesFromAPI(sport) {
    try {
      if (sport === 'basketball') {
        return await this.fetchBasketballGames();
      } else {
        // For other sports, try TheSportsDB (if key is valid)
        const api = this.apis.sportsDB;
        const today = new Date().toISOString().split('T')[0];
        const url = `${api.baseUrl}/${api.key}/eventsday.php?d=${today}&s=${sport}`;
        
        const response = await fetch(url);
        const data = await response.json();
        
        if (data && data.events) {
          return data.events.map(event => ({
            id: event.idEvent,
            home_team_id: event.strHomeTeam, // This will need to be resolved to actual team ID
            away_team_id: event.strAwayTeam, // This will need to be resolved to actual team ID
            home_score: event.intHomeScore ? parseInt(event.intHomeScore) : null,
            away_score: event.intAwayScore ? parseInt(event.intAwayScore) : null,
            venue: event.strVenue,
            status: event.strStatus,
            sport: sport,
            league: event.strLeague,
            game_type: event.strEvent || 'Regular Season',
            game_date: event.dateEvent ? new Date(event.dateEvent + ' ' + event.strTime) : null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }));
        }
      }
      
      return [];
      
    } catch (error) {
      console.log(`   ⚠️  Error fetching ${sport} games:`, error.message);
      return [];
    }
  }

  async fetchBasketballGames() {
    try {
      const api = this.apis.ballDontLie;
      const url = `${api.baseUrl}/games`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': api.key
        }
      });
      const data = await response.json();
      
      if (data && data.data) {
        return data.data.map(game => ({
          id: game.id,
          home_team_id: game.home_team.id,
          away_team_id: game.visitor_team.id,
          home_score: game.home_team_score,
          away_score: game.visitor_team_score,
          venue: null, // BallDontLie doesn't provide venue info
          status: game.status,
          sport: 'basketball',
          league: 'NBA',
          game_type: game.postseason ? 'Playoffs' : 'Regular Season',
          game_date: game.date ? new Date(game.date) : null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }));
      }
      
      return [];
      
    } catch (error) {
      console.log('   ⚠️  Error fetching basketball games:', error.message);
      return [];
    }
  }

  async fetchPlayerStatsFromAPI(sport) {
    try {
      if (sport === 'basketball') {
        return await this.fetchBasketballPlayerStats();
      } else if (sport === 'football') {
        return await this.fetchFootballPlayerStats();
      } else if (sport === 'baseball') {
        return await this.fetchBaseballPlayerStats();
      } else if (sport === 'hockey') {
        return await this.fetchHockeyPlayerStats();
      } else if (sport === 'soccer') {
        return await this.fetchSoccerPlayerStats();
      }
      
      return [];
      
    } catch (error) {
      console.log(`   ⚠️  Error fetching ${sport} player stats:`, error.message);
      return [];
    }
  }

  async fetchBasketballPlayerStats() {
    try {
      const api = this.apis.ballDontLie;
      const url = `${api.baseUrl}/players`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': api.key
        }
      });
      const data = await response.json();
      
      if (data && data.data) {
        return data.data.map(player => ({
          id: `bb_${player.id}`,
          player_name: `${player.first_name} ${player.last_name}`,
          team_id: player.team ? player.team.id : null,
          position: player.position,
          points: 0, // Default values for required fields
          rebounds: 0,
          assists: 0,
          steals: 0,
          blocks: 0,
          turnovers: 0,
          field_goals_made: 0,
          field_goals_attempted: 0,
          three_pointers_made: 0,
          three_pointers_attempted: 0,
          free_throws_made: 0,
          free_throws_attempted: 0,
          minutes_played: 0,
          plus_minus: 0,
          personal_fouls: 0,
          technical_fouls: 0,
          flagrant_fouls: 0,
          double_doubles: 0,
          triple_doubles: 0,
          created_at: new Date().toISOString()
        }));
      }
      
      return [];
      
    } catch (error) {
      console.log('   ⚠️  Error fetching basketball player stats:', error.message);
      return [];
    }
  }

  async fetchFootballPlayerStats() {
    try {
      const api = this.apis.rapidAPI;
      if (!api.key) {
        console.log('   ⚠️  RapidAPI key not configured for football stats');
        return [];
      }
      
      const url = `${api.baseUrl}/nfl/players`;
      const response = await fetch(url, {
        headers: {
          'X-RapidAPI-Key': api.key,
          'X-RapidAPI-Host': 'api-sports.p.rapidapi.com'
        }
      });
      
      const data = await response.json();
      
      if (data && data.response) {
        return data.response.map(player => ({
          id: `fb_${player.id}`,
          player_name: player.name,
          team: player.team ? player.team.name : null,
          position: player.position,
          sport: 'football',
          stats: {
            height: player.height,
            weight: player.weight,
            jersey_number: player.number
          },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }));
      }
      
      return [];
      
    } catch (error) {
      console.log('   ⚠️  Error fetching football player stats:', error.message);
      return [];
    }
  }

  async fetchBaseballPlayerStats() {
    try {
      const api = this.apis.rapidAPI;
      if (!api.key) {
        console.log('   ⚠️  RapidAPI key not configured for baseball stats');
        return [];
      }
      
      const url = `${api.baseUrl}/mlb/players`;
      const response = await fetch(url, {
        headers: {
          'X-RapidAPI-Key': api.key,
          'X-RapidAPI-Host': 'api-sports.p.rapidapi.com'
        }
      });
      
      const data = await response.json();
      
      if (data && data.response) {
        return data.response.map(player => ({
          id: `bb_${player.id}`,
          player_name: player.name,
          team: player.team ? player.team.name : null,
          position: player.position,
          sport: 'baseball',
          stats: {
            height: player.height,
            weight: player.weight,
            jersey_number: player.number
          },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }));
      }
      
      return [];
      
    } catch (error) {
      console.log('   ⚠️  Error fetching baseball player stats:', error.message);
      return [];
    }
  }

  async fetchHockeyPlayerStats() {
    try {
      const api = this.apis.rapidAPI;
      if (!api.key) {
        console.log('   ⚠️  RapidAPI key not configured for hockey stats');
        return [];
      }
      
      const url = `${api.baseUrl}/nhl/players`;
      const response = await fetch(url, {
        headers: {
          'X-RapidAPI-Key': api.key,
          'X-RapidAPI-Host': 'api-sports.p.rapidapi.com'
        }
      });
      
      const data = await response.json();
      
      if (data && data.response) {
        return data.response.map(player => ({
          id: `hk_${player.id}`,
          player_name: player.name,
          team: player.team ? player.team.name : null,
          position: player.position,
          sport: 'hockey',
          stats: {
            height: player.height,
            weight: player.weight,
            jersey_number: player.number
          },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }));
      }
      
      return [];
      
    } catch (error) {
      console.log('   ⚠️  Error fetching hockey player stats:', error.message);
      return [];
    }
  }

  async fetchSoccerPlayerStats() {
    try {
      const api = this.apis.rapidAPI;
      if (!api.key) {
        console.log('   ⚠️  RapidAPI key not configured for soccer stats');
        return [];
      }
      
      const url = `${api.baseUrl}/football/players`;
      const response = await fetch(url, {
        headers: {
          'X-RapidAPI-Key': api.key,
          'X-RapidAPI-Host': 'api-sports.p.rapidapi.com'
        }
      });
      
      const data = await response.json();
      
      if (data && data.response) {
        return data.response.map(player => ({
          id: `sc_${player.id}`,
          player_name: player.name,
          team: player.team ? player.team.name : null,
          position: player.position,
          sport: 'soccer',
          stats: {
            height: player.height,
            weight: player.weight,
            jersey_number: player.number
          },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }));
      }
      
      return [];
      
    } catch (error) {
      console.log('   ⚠️  Error fetching soccer player stats:', error.message);
      return [];
    }
  }

  async upsertTeams(teams) {
    try {
      const { error } = await supabase
        .from('teams')
        .upsert(teams, { onConflict: 'id' });
      
      if (error) {
        console.log('   ⚠️  Error upserting teams:', error.message);
      }
    } catch (error) {
      console.log('   ❌ Error upserting teams:', error.message);
    }
  }

  async upsertGames(games) {
    try {
      const { error } = await supabase
        .from('games')
        .upsert(games, { onConflict: 'id' });
      
      if (error) {
        console.log('   ⚠️  Error upserting games:', error.message);
      }
    } catch (error) {
      console.log('   ❌ Error upserting games:', error.message);
    }
  }

  async upsertPlayerStats(stats) {
    try {
      const { error } = await supabase
        .from('player_stats')
        .upsert(stats, { onConflict: 'id' });
      
      if (error) {
        console.log('   ⚠️  Error upserting player stats:', error.message);
      }
    } catch (error) {
      console.log('   ❌ Error upserting player stats:', error.message);
    }
  }

  setupScheduledTasks() {
    // Data updates every 15 minutes
    cron.schedule('*/15 * * * *', async () => {
      console.log(`\n🔄 Scheduled data update at ${new Date().toLocaleTimeString()}`);
      await this.updateAllSportsData();
    });
    
    // Data cleanup every hour
    cron.schedule('0 * * * *', async () => {
      console.log(`\n🧹 Scheduled data cleanup at ${new Date().toLocaleTimeString()}`);
      await this.cleanupInvalidData();
    });
    
    // Mock data removal every 30 minutes
    cron.schedule('*/30 * * * *', async () => {
      console.log(`\n🚫 Scheduled mock data removal at ${new Date().toLocaleTimeString()}`);
      await this.clearAllMockData();
    });
  }

  async updateAllSportsData() {
    try {
      console.log('📊 Updating all sports data...');
      
      for (const [sport, config] of Object.entries(this.sports)) {
        console.log(`   🔄 Updating ${sport}...`);
        await this.populateSportData(sport, config);
        await this.delay(500); // Rate limiting
      }
      
      this.lastUpdate = new Date();
      this.errorCount = 0;
      
      console.log('✅ All sports data updated successfully');
      
    } catch (error) {
      console.error('❌ Error updating sports data:', error.message);
      this.errorCount++;
      
      if (this.errorCount >= this.maxErrors) {
        console.error('🚨 Maximum error count reached. Stopping automated updates.');
        this.isRunning = false;
      }
    }
  }

  async cleanupInvalidData() {
    try {
      console.log('🧹 Cleaning up invalid data...');
      
      // Remove teams without names
      const { error: teamsError } = await supabase
        .from('teams')
        .delete()
        .is('name', null);
      
      if (teamsError) console.log('   ⚠️  Error cleaning teams:', teamsError.message);
      
      // Remove games without teams
      const { error: gamesError } = await supabase
        .from('games')
        .delete()
        .or('home_team.is.null,away_team.is.null');
      
      if (gamesError) console.log('   ⚠️  Error cleaning games:', gamesError.message);
      
      // Remove player stats without names
      const { error: statsError } = await supabase
        .from('player_stats')
        .delete()
        .is('player_name', null);
      
      if (statsError) console.log('   ⚠️  Error cleaning player stats:', statsError.message);
      
      // Remove old predictions (older than 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const { error: predError } = await supabase
        .from('predictions')
        .delete()
        .lt('created_at', sevenDaysAgo.toISOString());
      
      if (predError) console.log('   ⚠️  Error cleaning old predictions:', predError.message);
      
      console.log('   ✅ Invalid data cleaned up');
      
    } catch (error) {
      console.error('   ❌ Error during cleanup:', error.message);
    }
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async stop() {
    if (!this.isRunning) {
      console.log('⚠️  Data manager is not running');
      return;
    }

    this.isRunning = false;
    console.log('🛑 ApexBets Data Manager stopped');
  }
}

// Create and start the data manager
const dataManager = new ApexDataManager();

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  await dataManager.stop();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  await dataManager.stop();
  process.exit(0);
});

// Start the data manager
dataManager.start().catch(console.error);

module.exports = ApexDataManager;
