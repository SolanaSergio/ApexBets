#!/usr/bin/env node

/**
 * Automated Data Manager
 * Continuously populates, validates, and cleans up sports data
 * Runs in background with automatic error recovery and data quality monitoring
 */

const { createClient } = require('@supabase/supabase-js');
const cron = require('node-cron');
const fetch = require('node-fetch');
require('dotenv').config({ path: '.env.local' });

console.log('🚀 ApexBets Automated Data Manager Starting...');
console.log('==============================================\n');

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

class AutomatedDataManager {
  constructor() {
    this.isRunning = false;
    this.lastUpdate = new Date();
    this.errorCount = 0;
    this.maxErrors = 5;
    this.updateInterval = 15; // minutes
    this.cleanupInterval = 60; // minutes
    this.validationInterval = 30; // minutes
    
    // API configurations
    this.apis = {
      sportsDB: {
        baseUrl: 'https://www.thesportsdb.com/api/v1/json',
        key: process.env.SPORTSDB_API_KEY || '123',
        rateLimit: 100, // requests per hour
        lastCall: 0
      },
      ballDontLie: {
        baseUrl: 'https://www.balldontlie.io/api/v1',
        rateLimit: 1000, // requests per hour (actually 5 per minute for free tier)
        lastCall: 0
      },
      rapidAPI: {
        baseUrl: 'https://api-sports.p.rapidapi.com',
        key: process.env.RAPIDAPI_KEY,
        rateLimit: 100, // requests per hour
        lastCall: 0
      }
    };
    
    // Sports configuration - loaded dynamically from database
    this.sports = {};
    this.loadSportsConfiguration();
  }

  async loadSportsConfiguration() {
    try {
      console.log('📊 Loading sports configuration from database...');

      const { data: sports, error } = await supabase
        .from('sports')
        .select(`
          name,
          display_name,
          season_config,
          update_frequency,
          rate_limits
        `)
        .eq('is_active', true);

      if (error) {
        console.warn('⚠️ Failed to load sports from database:', error.message);
        this.loadDefaultSportsConfiguration();
        return;
      }

      if (sports && sports.length > 0) {
        for (const sport of sports) {
          const seasonConfig = sport.season_config || {};
          this.sports[sport.name] = {
            leagues: seasonConfig.leagues || [],
            seasons: seasonConfig.seasons || [new Date().getFullYear().toString()],
            updateFrequency: sport.update_frequency || 30
          };
        }
        console.log(`✅ Loaded ${sports.length} sports configurations from database`);
      } else {
        console.log('⚠️ No sports found in database, using defaults');
        this.loadDefaultSportsConfiguration();
      }
    } catch (error) {
      console.error('❌ Error loading sports configuration:', error.message);
      this.loadDefaultSportsConfiguration();
    }
  }

  loadDefaultSportsConfiguration() {
    console.log('📊 Loading default sports configuration...');

    // Load sports configuration dynamically from environment
    const supportedSports = (process.env.NEXT_PUBLIC_SUPPORTED_SPORTS || '').split(',').filter(Boolean);
    
    if (supportedSports.length === 0) {
      console.warn('No supported sports configured in environment');
      this.sports = {};
      return;
    }

    const currentYear = new Date().getFullYear();
    const currentSeason = `${currentYear}-${(currentYear + 1).toString().slice(-2)}`;

    this.sports = {};

    // Load configuration for each supported sport
    supportedSports.forEach(sport => {
      const sportUpper = sport.toUpperCase();
      this.sports[sport] = {
        leagues: process.env[`${sportUpper}_LEAGUES`]?.split(',') || [],
        seasons: [currentSeason],
        updateFrequency: parseInt(process.env[`${sportUpper}_UPDATE_FREQUENCY`]) || 30
      };
    });
  }

  async start() {
    if (this.isRunning) {
      console.log('⚠️  Data manager is already running');
      return;
    }

    this.isRunning = true;
    console.log('✅ Automated Data Manager started successfully');
    
    // Initial data population
    await this.initialDataPopulation();
    
    // Set up scheduled tasks
    this.setupScheduledTasks();
    
    // Start monitoring
    this.startMonitoring();
    
    console.log('🔄 Background tasks scheduled:');
    console.log(`   - Data updates: Every ${this.updateInterval} minutes`);
    console.log(`   - Data cleanup: Every ${this.cleanupInterval} minutes`);
    console.log(`   - Data validation: Every ${this.validationInterval} minutes`);
    console.log(`   - Health monitoring: Every 5 minutes\n`);
  }

  async initialDataPopulation() {
    console.log('🌱 Starting initial data population...');
    
    try {
      // Clear existing mock data
      await this.clearMockData();
      
      // Populate teams for all sports
      for (const [sport, config] of Object.entries(this.sports)) {
        console.log(`   📊 Populating ${sport} teams...`);
        await this.populateTeamsForSport(sport, config);
        
        // Small delay to respect rate limits
        await this.delay(1000);
      }
      
      // Populate games for all sports
      for (const [sport, config] of Object.entries(this.sports)) {
        console.log(`   🏟️  Populating ${sport} games...`);
        await this.populateGamesForSport(sport, config);
        
        // Small delay to respect rate limits
        await this.delay(1000);
      }
      
      // Populate player stats
      for (const [sport, config] of Object.entries(this.sports)) {
        console.log(`   👥 Populating ${sport} player stats...`);
        await this.populatePlayerStatsForSport(sport, config);
        
        // Small delay to respect rate limits
        await this.delay(1000);
      }
      
      console.log('✅ Initial data population completed\n');
      
    } catch (error) {
      console.error('❌ Initial data population failed:', error.message);
      this.errorCount++;
    }
  }

  async clearMockData() {
    console.log('🧹 Clearing mock data...');
    
    try {
      // Clear mock predictions
      const { error: predError } = await supabase
        .from('predictions')
        .delete()
        .like('model_name', '%mock%');
      
      if (predError) console.log('   ⚠️  Error clearing mock predictions:', predError.message);
      
      // Clear mock odds
      const { error: oddsError } = await supabase
        .from('odds')
        .delete()
        .like('bookmaker', '%mock%');
      
      if (oddsError) console.log('   ⚠️  Error clearing mock odds:', oddsError.message);
      
      // Clear mock player stats
      const { error: statsError } = await supabase
        .from('player_stats')
        .delete()
        .like('player_name', '%mock%');
      
      if (statsError) console.log('   ⚠️  Error clearing mock player stats:', statsError.message);
      
      console.log('   ✅ Mock data cleared');
      
    } catch (error) {
      console.error('   ❌ Error clearing mock data:', error.message);
    }
  }

  async populateTeamsForSport(sport, config) {
    try {
      const teams = await this.fetchTeamsFromAPI(sport, config);
      
      if (teams && teams.length > 0) {
        // Upsert teams
        const { error } = await supabase
          .from('teams')
          .upsert(teams, { onConflict: 'name' });
        
        if (error) {
          console.log(`   ⚠️  Error upserting ${sport} teams:`, error.message);
        } else {
          console.log(`   ✅ ${teams.length} ${sport} teams updated`);
        }
      }
      
    } catch (error) {
      console.log(`   ❌ Error populating ${sport} teams:`, error.message);
    }
  }

  async populateGamesForSport(sport, config) {
    try {
      const games = await this.fetchGamesFromAPI(sport, config);
      
      if (games && games.length > 0) {
        // Upsert games
        const { error } = await supabase
          .from('games')
          .upsert(games, { onConflict: 'id' });
        
        if (error) {
          console.log(`   ⚠️  Error upserting ${sport} games:`, error.message);
        } else {
          console.log(`   ✅ ${games.length} ${sport} games updated`);
        }
      }
      
    } catch (error) {
      console.log(`   ❌ Error populating ${sport} games:`, error.message);
    }
  }

  async populatePlayerStatsForSport(sport, config) {
    try {
      const stats = await this.fetchPlayerStatsFromAPI(sport, config);
      
      if (stats && stats.length > 0) {
        // Upsert player stats
        const { error } = await supabase
          .from('player_stats')
          .upsert(stats, { onConflict: 'id' });
        
        if (error) {
          console.log(`   ⚠️  Error upserting ${sport} player stats:`, error.message);
        } else {
          console.log(`   ✅ ${stats.length} ${sport} player stats updated`);
        }
      }
      
    } catch (error) {
      console.log(`   ❌ Error populating ${sport} player stats:`, error.message);
    }
  }

  async fetchTeamsFromAPI(sport, config) {
    try {
      const api = this.apis.sportsDB;
      const url = `${api.baseUrl}/${api.key}/search_all_teams.php?s=${sport}`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data && data.teams) {
        return data.teams.map(team => ({
          name: team.strTeam,
          city: team.strStadiumLocation,
          abbreviation: team.strTeamShort,
          logo_url: team.strTeamBadge,
          sport: sport,
          league: team.strLeague,
          conference: team.strConference || null,
          division: team.strDivision || null,
          venue: team.strStadium,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }));
      }
      
      return [];
      
    } catch (error) {
      console.log(`   ⚠️  Error fetching ${sport} teams:`, error.message);
      return [];
    }
  }

  async fetchGamesFromAPI(sport, config) {
    try {
      const api = this.apis.sportsDB;
      const today = new Date().toISOString().split('T')[0];
      const url = `${api.baseUrl}/${api.key}/eventsday.php?d=${today}&s=${sport}`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data && data.events) {
        return data.events.map(event => ({
          id: event.idEvent,
          home_team: event.strHomeTeam,
          away_team: event.strAwayTeam,
          home_score: event.intHomeScore ? parseInt(event.intHomeScore) : null,
          away_score: event.intAwayScore ? parseInt(event.intAwayScore) : null,
          venue: event.strVenue,
          status: event.strStatus,
          sport: sport,
          league: event.strLeague,
          game_type: event.strEvent || 'Regular Season',
          scheduled_at: event.dateEvent ? new Date(event.dateEvent + ' ' + event.strTime) : null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }));
      }
      
      return [];
      
    } catch (error) {
      console.log(`   ⚠️  Error fetching ${sport} games:`, error.message);
      return [];
    }
  }

  async fetchPlayerStatsFromAPI(sport, config) {
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
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data && data.data) {
        return data.data.map(player => ({
          id: `bb_${player.id}`,
          player_name: `${player.first_name} ${player.last_name}`,
          team: player.team ? player.team.full_name : null,
          position: player.position,
          sport: 'basketball',
          stats: {
            height: player.height_feet ? `${player.height_feet}'${player.height_inches}"` : null,
            weight: player.weight_pounds ? `${player.weight_pounds} lbs` : null,
            jersey_number: player.jersey_number
          },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
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

  setupScheduledTasks() {
    // Data updates every 15 minutes
    cron.schedule(`*/${this.updateInterval} * * * *`, async () => {
      console.log(`\n🔄 Scheduled data update at ${new Date().toLocaleTimeString()}`);
      await this.updateAllSportsData();
    });
    
    // Data cleanup every hour
    cron.schedule(`0 */${this.cleanupInterval/60} * * * *`, async () => {
      console.log(`\n🧹 Scheduled data cleanup at ${new Date().toLocaleTimeString()}`);
      await this.cleanupInvalidData();
    });
    
    // Data validation every 30 minutes
    cron.schedule(`*/${this.validationInterval} * * * *`, async () => {
      console.log(`\n✅ Scheduled data validation at ${new Date().toLocaleTimeString()}`);
      await this.validateDataQuality();
    });
    
    // Health monitoring every 5 minutes
    cron.schedule('*/5 * * * *', async () => {
      await this.monitorHealth();
    });
  }

  async updateAllSportsData() {
    try {
      console.log('📊 Updating all sports data...');
      
      for (const [sport, config] of Object.entries(this.sports)) {
        console.log(`   🔄 Updating ${sport}...`);
        
        // Update teams
        await this.populateTeamsForSport(sport, config);
        await this.delay(500);
        
        // Update games
        await this.populateGamesForSport(sport, config);
        await this.delay(500);
        
        // Update player stats
        await this.populatePlayerStatsForSport(sport, config);
        await this.delay(500);
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

  async validateDataQuality() {
    try {
      console.log('✅ Validating data quality...');
      
      // Check team data quality
      const { data: teams } = await supabase
        .from('teams')
        .select('name, logo_url, sport')
        .limit(100);
      
      if (teams) {
        const teamsWithoutLogos = teams.filter(team => !team.logo_url);
        const teamsWithoutNames = teams.filter(team => !team.name);
        
        if (teamsWithoutLogos.length > 0) {
          console.log(`   ⚠️  ${teamsWithoutLogos.length} teams missing logos`);
        }
        
        if (teamsWithoutNames.length > 0) {
          console.log(`   ⚠️  ${teamsWithoutNames.length} teams missing names`);
        }
      }
      
      // Check game data quality
      const { data: games } = await supabase
        .from('games')
        .select('home_team, away_team, status, sport')
        .limit(100);
      
      if (games) {
        const gamesWithoutTeams = games.filter(game => !game.home_team || !game.away_team);
        const gamesWithoutStatus = games.filter(game => !game.status);
        
        if (gamesWithoutTeams.length > 0) {
          console.log(`   ⚠️  ${gamesWithoutTeams.length} games missing team data`);
        }
        
        if (gamesWithoutStatus.length > 0) {
          console.log(`   ⚠️  ${gamesWithoutStatus.length} games missing status`);
        }
      }
      
      console.log('   ✅ Data quality validation completed');
      
    } catch (error) {
      console.error('   ❌ Error during data validation:', error.message);
    }
  }

  async monitorHealth() {
    try {
      const now = new Date();
      const timeSinceLastUpdate = (now - this.lastUpdate) / (1000 * 60); // minutes
      
      if (timeSinceLastUpdate > this.updateInterval * 2) {
        console.log(`⚠️  Health warning: No update for ${Math.round(timeSinceLastUpdate)} minutes`);
      }
      
      if (this.errorCount > 0) {
        console.log(`⚠️  Health warning: ${this.errorCount} consecutive errors`);
      }
      
    } catch (error) {
      console.error('❌ Health monitoring error:', error.message);
    }
  }

  startMonitoring() {
    console.log('📊 Health monitoring started');
    console.log('   - Monitoring data freshness');
    console.log('   - Tracking error rates');
    console.log('   - Validating data quality');
    console.log('   - Cleaning up invalid data\n');
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
    console.log('🛑 Automated Data Manager stopped');
  }
}

// Create and start the data manager
const dataManager = new AutomatedDataManager();

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

module.exports = AutomatedDataManager;
