#!/usr/bin/env node

/**
 * Real Data Population Script
 * Uses actual APIs to populate historical data for ALL sports
 * NO MOCK DATA - follows .cursorrules strictly
 */

const { createClient } = require('@supabase/supabase-js')
const axios = require('axios')
require('dotenv').config()

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function getSportConfigFromDatabase(sport) {
  try {
    const { data, error } = await supabase
      .from('sports')
      .select('league, season, country, rapidapi_code, rapidapi_league_id')
      .eq('name', sport)
      .eq('is_active', true)
      .single();
    
    if (error || !data) {
      throw new Error(`No configuration found for sport: ${sport}`);
    }
    
    return {
      league: data.league,
      season: data.season || new Date().getFullYear(),
      country: data.country || 'US',
      code: data.rapidapi_code,
      leagueId: data.rapidapi_league_id
    };
  } catch (error) {
    console.error(`Error getting sport config for ${sport}:`, error);
    throw error;
  }
}

// Real API configurations
const API_CONFIGS = {
  basketball: {
    apiKey: process.env.RAPIDAPI_KEY,
    baseUrl: 'https://api-nba-v1.p.rapidapi.com',
    headers: {
      'X-RapidAPI-Key': process.env.RAPIDAPI_KEY,
      'X-RapidAPI-Host': 'api-nba-v1.p.rapidapi.com'
    }
  },
  football: {
    apiKey: process.env.RAPIDAPI_KEY,
    baseUrl: 'https://api-nfl-v1.p.rapidapi.com',
    headers: {
      'X-RapidAPI-Key': process.env.RAPIDAPI_KEY,
      'X-RapidAPI-Host': 'api-nfl-v1.p.rapidapi.com'
    }
  },
  baseball: {
    apiKey: process.env.RAPIDAPI_KEY,
    baseUrl: 'https://api-baseball.p.rapidapi.com',
    headers: {
      'X-RapidAPI-Key': process.env.RAPIDAPI_KEY,
      'X-RapidAPI-Host': 'api-baseball.p.rapidapi.com'
    }
  },
  hockey: {
    apiKey: process.env.RAPIDAPI_KEY,
    baseUrl: 'https://api-nhl.p.rapidapi.com',
    headers: {
      'X-RapidAPI-Key': process.env.RAPIDAPI_KEY,
      'X-RapidAPI-Host': 'api-nhl.p.rapidapi.com'
    }
  },
  soccer: {
    apiKey: process.env.RAPIDAPI_KEY,
    baseUrl: 'https://api-football-v1.p.rapidapi.com',
    headers: {
      'X-RapidAPI-Key': process.env.RAPIDAPI_KEY,
      'X-RapidAPI-Host': 'api-football-v1.p.rapidapi.com'
    }
  }
}

async function populateAllSportsData() {
  console.log('🚀 Starting REAL data population for all sports...')
  
  // Validate API keys first
  if (!process.env.RAPIDAPI_KEY) {
    throw new Error('RAPIDAPI_KEY environment variable is required')
  }

  const results = {
    totalSports: Object.keys(API_CONFIGS).length,
    successfulSports: 0,
    failedSports: 0,
    totalRecords: 0,
    errors: []
  }

  for (const [sport, config] of Object.entries(API_CONFIGS)) {
    console.log(`\n📊 Processing ${sport.toUpperCase()}...`)
    
    try {
      const sportResults = await populateSportData(sport, config)
      results.totalRecords += sportResults.totalRecords
      results.successfulSports++
      
      console.log(`✅ ${sport}: ${sportResults.totalRecords} records created`)
    } catch (error) {
      console.error(`❌ ${sport}: ${error.message}`)
      results.failedSports++
      results.errors.push(`${sport}: ${error.message}`)
    }
  }

  console.log('\n📈 POPULATION SUMMARY:')
  console.log(`Total Sports: ${results.totalSports}`)
  console.log(`Successful: ${results.successfulSports}`)
  console.log(`Failed: ${results.failedSports}`)
  console.log(`Total Records: ${results.totalRecords}`)
  
  if (results.errors.length > 0) {
    console.log('\n❌ ERRORS:')
    results.errors.forEach(error => console.log(`  - ${error}`))
  }

  return results
}

async function populateSportData(sport, config) {
  const results = {
    teams: 0,
    games: 0,
    playerStats: 0,
    odds: 0,
    totalRecords: 0
  }

  try {
    // 1. Populate Teams from real API
    console.log(`  📋 Fetching teams for ${sport}...`)
    const teams = await fetchTeamsFromAPI(sport, config)
    if (teams && teams.length > 0) {
      for (const team of teams) {
        const { error } = await supabase
          .from('teams')
          .upsert(team, { onConflict: 'name,league' })
        
        if (!error) results.teams++
      }
    }

    // 2. Populate Games from real API
    console.log(`  🏟️ Fetching games for ${sport}...`)
    const games = await fetchGamesFromAPI(sport, config)
    if (games && games.length > 0) {
      for (const game of games) {
        const { error } = await supabase
          .from('games')
          .insert(game)
        
        if (!error) results.games++
      }
    }

    // 3. Populate Player Stats from real API
    console.log(`  👥 Fetching player stats for ${sport}...`)
    const playerStats = await fetchPlayerStatsFromAPI(sport, config)
    if (playerStats && playerStats.length > 0) {
      const tableName = getStatsTableName(sport)
      for (const stat of playerStats) {
        const { error } = await supabase
          .from(tableName)
          .insert(stat)
        
        if (!error) results.playerStats++
      }
    }

    // 4. Populate Odds from real API
    console.log(`  💰 Fetching odds for ${sport}...`)
    const odds = await fetchOddsFromAPI(sport, config)
    if (odds && odds.length > 0) {
      for (const odd of odds) {
        const { error } = await supabase
          .from('odds')
          .insert(odd)
        
        if (!error) results.odds++
      }
    }

  } catch (error) {
    console.error(`Error populating ${sport}:`, error.message)
    throw error
  }

  results.totalRecords = results.teams + results.games + results.playerStats + results.odds
  return results
}

async function fetchTeamsFromAPI(sport, config) {
  try {
    // Get sport configuration from database
    const sportConfig = await getSportConfigFromDatabase(sport);
    if (!sportConfig) {
      throw new Error(`No configuration found for sport: ${sport}`);
    }

    let response;
    const params = sportConfig.season ? { season: sportConfig.season } : {};
    
    response = await axios.get(`${config.baseUrl}/teams`, {
      headers: config.headers,
      params: params
    })
    
    return response.data.response?.map(team => ({
      name: team.name,
      city: team.city,
      league: sportConfig.league,
      sport: sport,
      abbreviation: team.code || team.abbreviation,
      logo_url: team.logo,
      is_active: true,
      conference: team.leagues?.standard?.conference || team.conference || 'Unknown',
      division: team.leagues?.standard?.division || team.division || 'Unknown',
      founded_year: team.nbaFranchise ? 1946 : team.founded || null,
      country: sportConfig.country || 'US'
    })) || []
  } catch (error) {
    console.error(`Error fetching teams for ${sport}:`, error.message)
    return []
  }
}

async function fetchGamesFromAPI(sport, config) {
  try {
    // Get sport configuration from database
    const sportConfig = await getSportConfigFromDatabase(sport);
    if (!sportConfig) {
      throw new Error(`No configuration found for sport: ${sport}`);
    }

    let response;
    const currentDate = new Date()
    const season = sportConfig.season || currentDate.getFullYear()
    const params = { season: season.toString() };
    
    // Add league parameter if available
    if (sportConfig.leagueId) {
      params.league = sportConfig.leagueId;
    }
    
    response = await axios.get(`${config.baseUrl}/games`, {
      headers: config.headers,
      params: params
    })
    
    return response.data.response?.map(game => ({
      home_team_id: game.teams?.home?.id || game.homeTeam?.id,
      away_team_id: game.teams?.away?.id || game.awayTeam?.id,
      game_date: game.date?.start || game.schedule?.date || game.gameDate || game.fixture?.date,
      season: season.toString(),
      home_score: game.scores?.home?.points || game.score?.homeScoreTotal || game.scores?.home || game.teams?.home?.score || game.goals?.home,
      away_score: game.scores?.away?.points || game.score?.awayScoreTotal || game.scores?.away || game.teams?.away?.score || game.goals?.away,
      status: game.status?.long || game.status || game.status?.detailedState || game.fixture?.status?.long,
      venue: game.arena?.name || game.venue?.name || game.fixture?.venue?.name,
      sport: sport,
      league: sportConfig.league,
      game_type: 'regular'
    })) || []
  } catch (error) {
    console.error(`Error fetching games for ${sport}:`, error.message)
    return []
  }
}

async function fetchPlayerStatsFromAPI(sport, config) {
  try {
    // This would require more complex API calls to get player stats
    // For now, return empty array as per rules - no mock data
    console.log(`  ⚠️ Player stats API not implemented for ${sport} - returning empty array`)
    return []
  } catch (error) {
    console.error(`Error fetching player stats for ${sport}:`, error.message)
    return []
  }
}

async function fetchOddsFromAPI(sport, config) {
  try {
    // This would require odds-specific APIs
    // For now, return empty array as per rules - no mock data
    console.log(`  ⚠️ Odds API not implemented for ${sport} - returning empty array`)
    return []
  } catch (error) {
    console.error(`Error fetching odds for ${sport}:`, error.message)
    return []
  }
}

function getStatsTableName(sport) {
  const tableMap = {
    'basketball': 'player_stats',
    'football': 'football_player_stats',
    'baseball': 'baseball_player_stats',
    'hockey': 'hockey_player_stats',
    'soccer': 'soccer_player_stats',
    'tennis': 'tennis_match_stats',
    'golf': 'golf_tournament_stats'
  }
  return tableMap[sport] || 'player_stats'
}

// Run the script
if (require.main === module) {
  populateAllSportsData()
    .then(results => {
      console.log('\n🎉 Real data population completed!')
      process.exit(0)
    })
    .catch(error => {
      console.error('\n💥 Script failed:', error)
      process.exit(1)
    })
}

module.exports = { populateAllSportsData }