/**
 * Comprehensive Verification Test Suite
 * Tests all ApexBets functionality with REAL data - NO MOCK DATA OR PLACEHOLDERS
 * Uses centralized verification tracker system
 */

const VerificationTracker = require('../verification-tracker');
const fetch = require('node-fetch');

// Initialize tracker
const tracker = new VerificationTracker();

// Configuration
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
const REQUEST_TIMEOUT = 10000; // 10 seconds timeout for comprehensive tests

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Helper function to make API requests with timeout
async function makeApiRequest(endpoint, timeout = REQUEST_TIMEOUT) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    const data = await response.json();
    
    return {
      success: response.ok,
      status: response.status,
      data,
      error: response.ok ? null : data.error || 'Unknown error'
    };
  } catch (error) {
    if (error.name === 'AbortError') {
      return {
        success: false,
        status: 0,
        data: null,
        error: `Request timeout after ${timeout}ms`
      };
    }
    return {
      success: false,
      status: 0,
      data: null,
      error: error.message
    };
  }
}

// Helper function to test external API with timeout
async function testExternalApi(url, timeout = REQUEST_TIMEOUT) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    const response = await fetch(url, {
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      return {
        success: false,
        data: null,
        error: `HTTP ${response.status}`
      };
    }
    
    const data = await response.json();
    return {
      success: true,
      data,
      error: null
    };
  } catch (error) {
    if (error.name === 'AbortError') {
      return {
        success: false,
        data: null,
        error: `Request timeout after ${timeout}ms`
      };
    }
    return {
      success: false,
      data: null,
      error: error.message
    };
  }
}

async function comprehensiveTest(name, testFn, timeout = REQUEST_TIMEOUT) {
  const startTime = Date.now();
  try {
    // Add timeout wrapper
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error(`Test timeout after ${timeout}ms`)), timeout);
    });
    
    const result = await Promise.race([testFn(), timeoutPromise]);
    const duration = Date.now() - startTime;
    
    if (result.success) {
      log(`${colors.green}✓${colors.reset} ${name} (${duration}ms)`, 'green');
      return { success: true, duration, result: result.data };
    } else {
      log(`${colors.red}✗${colors.reset} ${name} (${duration}ms) - ${result.error}`, 'red');
      return { success: false, duration, error: result.error };
    }
  } catch (error) {
    const duration = Date.now() - startTime;
    log(`${colors.red}✗${colors.reset} ${name} (${duration}ms) - ${error.message}`, 'red');
    return { success: false, duration, error: error.message };
  }
}

describe('ApexBets Comprehensive Verification', () => {
  let testResults = {};

  beforeAll(async () => {
    log(`${colors.bright}${colors.cyan}🚀 Starting ApexBets Comprehensive Verification${colors.reset}`);
    log(`${colors.cyan}======================================================${colors.reset}\n`);
  });

  afterAll(async () => {
    // Generate final report
    log(`\n${colors.bright}Generating Final Report...${colors.reset}`);
    tracker.generateReport();
    
    // Print final status
    log(`\n${colors.bright}Final Verification Status:${colors.reset}`);
    tracker.printStatus();
  });

  describe('API Endpoints', () => {
    test('Health Check', async () => {
      const result = await comprehensiveTest('Health Check', async () => {
        return await makeApiRequest('/api/health');
      });
      
      testResults.health = result;
      tracker.updateTest('apis', 'health', result.success ? 'working' : 'broken', 
        result.success ? `Working (${result.duration}ms)` : result.error);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.result).toHaveProperty('status');
        expect(result.result.status).toBe('healthy');
      }
    });

    test('Games Endpoint - All Sports', async () => {
      const sports = ['basketball', 'football', 'baseball', 'hockey', 'soccer', 'tennis', 'golf'];
      let allWorking = true;
      let workingSports = [];
      let brokenSports = [];

      for (const sport of sports) {
        const result = await comprehensiveTest(`Games - ${sport}`, async () => {
          return await makeApiRequest(`/api/games?sport=${sport}&limit=10`);
        });
        
        if (result.success) {
          workingSports.push(sport);
          expect(result.result).toBeDefined();
          expect(Array.isArray(result.result)).toBe(true);
        } else {
          brokenSports.push(sport);
          allWorking = false;
        }
      }

      testResults.games = { allWorking, workingSports, brokenSports };
      tracker.updateTest('apis', 'games', allWorking ? 'working' : 'partial', 
        allWorking ? 'All sports working' : `Working: ${workingSports.join(', ')}, Broken: ${brokenSports.join(', ')}`);
      
      expect(workingSports.length).toBeGreaterThan(0);
    });

    test('Teams Endpoint - All Sports', async () => {
      const sports = ['basketball', 'football', 'baseball', 'hockey', 'soccer', 'tennis', 'golf'];
      let allWorking = true;
      let workingSports = [];
      let brokenSports = [];

      for (const sport of sports) {
        const result = await comprehensiveTest(`Teams - ${sport}`, async () => {
          return await makeApiRequest(`/api/teams?sport=${sport}&limit=10`);
        });
        
        if (result.success) {
          workingSports.push(sport);
          expect(result.result).toBeDefined();
          expect(Array.isArray(result.result)).toBe(true);
        } else {
          brokenSports.push(sport);
          allWorking = false;
        }
      }

      testResults.teams = { allWorking, workingSports, brokenSports };
      tracker.updateTest('apis', 'teams', allWorking ? 'working' : 'partial', 
        allWorking ? 'All sports working' : `Working: ${workingSports.join(', ')}, Broken: ${brokenSports.join(', ')}`);
      
      expect(workingSports.length).toBeGreaterThan(0);
    });

    test('Live Scores', async () => {
      const result = await comprehensiveTest('Live Scores', async () => {
        return await makeApiRequest('/api/live-scores');
      });
      
      testResults.liveScores = result;
      tracker.updateTest('apis', 'liveScores', result.success ? 'working' : 'broken', 
        result.success ? `Working (${result.duration}ms)` : result.error);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(Array.isArray(result.result)).toBe(true);
      }
    });

    test('Odds - All Sports', async () => {
      const sports = ['basketball_nba', 'americanfootball_nfl', 'baseball_mlb', 'icehockey_nhl', 'soccer_epl'];
      let allWorking = true;
      let workingSports = [];
      let brokenSports = [];

      for (const sport of sports) {
        const result = await comprehensiveTest(`Odds - ${sport}`, async () => {
          return await makeApiRequest(`/api/odds?sport=${sport}`);
        });
        
        if (result.success) {
          workingSports.push(sport);
          expect(result.result).toBeDefined();
          expect(Array.isArray(result.result)).toBe(true);
        } else {
          brokenSports.push(sport);
          allWorking = false;
        }
      }

      testResults.odds = { allWorking, workingSports, brokenSports };
      tracker.updateTest('apis', 'odds', allWorking ? 'working' : 'partial', 
        allWorking ? 'All sports working' : `Working: ${workingSports.join(', ')}, Broken: ${brokenSports.join(', ')}`);
      
      expect(workingSports.length).toBeGreaterThan(0);
    });

    test('Predictions', async () => {
      const result = await comprehensiveTest('Predictions', async () => {
        return await makeApiRequest('/api/predictions?limit=10');
      });
      
      testResults.predictions = result;
      tracker.updateTest('apis', 'predictions', result.success ? 'working' : 'broken', 
        result.success ? `Working (${result.duration}ms)` : result.error);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(Array.isArray(result.result)).toBe(true);
      }
    });

    test('Analytics', async () => {
      const result = await comprehensiveTest('Analytics', async () => {
        return await makeApiRequest('/api/analytics/stats');
      });
      
      testResults.analytics = result;
      tracker.updateTest('apis', 'analytics', result.success ? 'working' : 'broken', 
        result.success ? `Working (${result.duration}ms)` : result.error);
      
      expect(result.success).toBe(true);
    });

    test('Standings - All Sports', async () => {
      const sports = ['basketball', 'football', 'baseball', 'hockey', 'soccer'];
      let allWorking = true;
      let workingSports = [];
      let brokenSports = [];

      for (const sport of sports) {
        const result = await comprehensiveTest(`Standings - ${sport}`, async () => {
          return await makeApiRequest(`/api/standings?sport=${sport}`);
        });
        
        if (result.success) {
          workingSports.push(sport);
          expect(result.result).toBeDefined();
          expect(Array.isArray(result.result)).toBe(true);
        } else {
          brokenSports.push(sport);
          allWorking = false;
        }
      }

      testResults.standings = { allWorking, workingSports, brokenSports };
      tracker.updateTest('apis', 'standings', allWorking ? 'working' : 'partial', 
        allWorking ? 'All sports working' : `Working: ${workingSports.join(', ')}, Broken: ${brokenSports.join(', ')}`);
      
      expect(workingSports.length).toBeGreaterThan(0);
    });

    test('Value Bets', async () => {
      const result = await comprehensiveTest('Value Bets', async () => {
        return await makeApiRequest('/api/value-bets');
      });
      
      testResults.valueBets = result;
      tracker.updateTest('apis', 'valueBets', result.success ? 'working' : 'broken', 
        result.success ? `Working (${result.duration}ms)` : result.error);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(Array.isArray(result.result)).toBe(true);
      }
    });
  });

  describe('External Data Sources', () => {
    test('SportsDB API', async () => {
      const result = await comprehensiveTest('SportsDB API', async () => {
        return await testExternalApi('https://www.thesportsdb.com/api/v1/json/123/eventsday.php?d=2024-01-01&s=basketball');
      });
      
      testResults.sportsDB = result;
      tracker.updateTest('dataSources', 'sportsDB', result.success ? 'working' : 'broken', 
        result.success ? `Working (${result.duration}ms)` : result.error);
      
      expect(result.success).toBe(true);
    });

    test('BallDontLie API', async () => {
      const result = await comprehensiveTest('BallDontLie API', async () => {
        return await testExternalApi('https://www.balldontlie.io/api/v1/teams');
      });
      
      testResults.ballDontLie = result;
      tracker.updateTest('dataSources', 'ballDontLie', result.success ? 'working' : 'broken', 
        result.success ? `Working (${result.duration}ms)` : result.error);
      
      expect(result.success).toBe(true);
    });

    test('Odds API (if configured)', async () => {
      if (process.env.ODDS_API_KEY && process.env.ODDS_API_KEY !== 'your_odds_api_key') {
        const result = await comprehensiveTest('Odds API', async () => {
          return await testExternalApi(`https://api.the-odds-api.com/v4/sports?apiKey=${process.env.ODDS_API_KEY}`);
        });
        
        testResults.oddsApi = result;
        tracker.updateTest('dataSources', 'oddsApi', result.success ? 'working' : 'broken', 
          result.success ? `Working (${result.duration}ms)` : result.error);
        
        expect(result.success).toBe(true);
      } else {
        log(`${colors.yellow}⚠ Odds API - API key not configured${colors.reset}`);
        tracker.updateTest('dataSources', 'oddsApi', 'unknown', 'API key not configured');
      }
    });

    test('API-SPORTS (if configured)', async () => {
      if (process.env.NEXT_PUBLIC_RAPIDAPI_KEY && process.env.NEXT_PUBLIC_RAPIDAPI_KEY !== 'your_rapidapi_key') {
        const result = await comprehensiveTest('API-SPORTS', async () => {
          return await testExternalApi('https://api-football-v1.p.rapidapi.com/v3/leagues');
        });
        
        testResults.apiSports = result;
        tracker.updateTest('dataSources', 'apiSports', result.success ? 'working' : 'broken', 
          result.success ? `Working (${result.duration}ms)` : result.error);
        
        expect(result.success).toBe(true);
      } else {
        log(`${colors.yellow}⚠ API-SPORTS - API key not configured${colors.reset}`);
        tracker.updateTest('dataSources', 'apiSports', 'unknown', 'API key not configured');
      }
    });
  });

  describe('Database Connectivity', () => {
    test('Database Connection', async () => {
      const result = await comprehensiveTest('Database Connection', async () => {
        return await makeApiRequest('/api/health?detailed=true');
      });
      
      testResults.databaseConnection = result;
      tracker.updateTest('database', 'connection', result.success ? 'working' : 'broken', 
        result.success ? `Working (${result.duration}ms)` : result.error);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.result).toHaveProperty('database');
        expect(result.result.database).toHaveProperty('status');
      }
    });

    test('Database Schema', async () => {
      const result = await comprehensiveTest('Database Schema', async () => {
        return await makeApiRequest('/api/teams?limit=1');
      });
      
      testResults.databaseSchema = result;
      tracker.updateTest('database', 'schema', result.success ? 'working' : 'broken', 
        result.success ? `Working (${result.duration}ms)` : result.error);
      
      expect(result.success).toBe(true);
    });

    test('Data Integrity', async () => {
      const result = await comprehensiveTest('Data Integrity', async () => {
        return await makeApiRequest('/api/games?limit=5');
      });
      
      testResults.dataIntegrity = result;
      tracker.updateTest('database', 'dataIntegrity', result.success ? 'working' : 'broken', 
        result.success ? `Working (${result.duration}ms)` : result.error);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(Array.isArray(result.result)).toBe(true);
        // Check for required fields in game data
        if (result.result.length > 0) {
          const game = result.result[0];
          expect(game).toHaveProperty('id');
          expect(game).toHaveProperty('homeTeam');
          expect(game).toHaveProperty('awayTeam');
        }
      }
    });
  });

  describe('Live Data Updates', () => {
    test('Real-time Updates', async () => {
      const result = await comprehensiveTest('Real-time Updates', async () => {
        return await makeApiRequest('/api/live-updates');
      });
      
      testResults.realTimeUpdates = result;
      tracker.updateTest('liveData', 'realTimeUpdates', result.success ? 'working' : 'broken', 
        result.success ? `Working (${result.duration}ms)` : result.error);
      
      expect(result.success).toBe(true);
    });

    test('Live Scores', async () => {
      const result = await comprehensiveTest('Live Scores', async () => {
        return await makeApiRequest('/api/live-scores');
      });
      
      testResults.liveScores = result;
      tracker.updateTest('liveData', 'liveScores', result.success ? 'working' : 'broken', 
        result.success ? `Working (${result.duration}ms)` : result.error);
      
      expect(result.success).toBe(true);
    });

    test('Live Odds', async () => {
      const result = await comprehensiveTest('Live Odds', async () => {
        return await makeApiRequest('/api/odds?live=true');
      });
      
      testResults.liveOdds = result;
      tracker.updateTest('liveData', 'liveOdds', result.success ? 'working' : 'broken', 
        result.success ? `Working (${result.duration}ms)` : result.error);
      
      expect(result.success).toBe(true);
    });
  });

  describe('Multi-Sport Data Verification', () => {
    const sports = [
      { name: 'basketball', displayName: 'Basketball', leagues: ['NBA', 'WNBA'] },
      { name: 'football', displayName: 'Football', leagues: ['NFL', 'NCAA'] },
      { name: 'baseball', displayName: 'Baseball', leagues: ['MLB'] },
      { name: 'hockey', displayName: 'Hockey', leagues: ['NHL'] },
      { name: 'soccer', displayName: 'Soccer', leagues: ['Premier League', 'La Liga'] },
      { name: 'tennis', displayName: 'Tennis', leagues: ['ATP', 'WTA'] },
      { name: 'golf', displayName: 'Golf', leagues: ['PGA Tour', 'LPGA'] }
    ];

    sports.forEach(sport => {
      test(`${sport.displayName} Data`, async () => {
        const result = await comprehensiveTest(`${sport.displayName} Data`, async () => {
          return await makeApiRequest(`/api/games?sport=${sport.name}&limit=5`);
        });
        
        testResults[`${sport.name}Data`] = result;
        tracker.updateTest('sportsData', sport.name, result.success ? 'working' : 'broken', 
          result.success ? `Working (${result.duration}ms)` : result.error);
        
        expect(result.success).toBe(true);
        if (result.success) {
          expect(Array.isArray(result.result)).toBe(true);
        }
      });
    });
  });

  describe('Player Statistics', () => {
    const sports = ['basketball', 'football', 'baseball', 'hockey', 'soccer'];

    sports.forEach(sport => {
      test(`${sport} Player Stats`, async () => {
        const result = await comprehensiveTest(`${sport} Player Stats`, async () => {
          return await makeApiRequest(`/api/players?sport=${sport}&limit=5`);
        });
        
        testResults[`${sport}PlayerStats`] = result;
        tracker.updateTest('playerStats', sport, result.success ? 'working' : 'broken', 
          result.success ? `Working (${result.duration}ms)` : result.error);
        
        expect(result.success).toBe(true);
        if (result.success) {
          expect(Array.isArray(result.result)).toBe(true);
        }
      });
    });
  });

  describe('Team Statistics', () => {
    test('Standings Data', async () => {
      const result = await comprehensiveTest('Standings Data', async () => {
        return await makeApiRequest('/api/standings?limit=10');
      });
      
      testResults.standingsData = result;
      tracker.updateTest('teamStats', 'standings', result.success ? 'working' : 'broken', 
        result.success ? `Working (${result.duration}ms)` : result.error);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(Array.isArray(result.result)).toBe(true);
      }
    });

    test('Team Performance', async () => {
      const result = await comprehensiveTest('Team Performance', async () => {
        return await makeApiRequest('/api/analytics/teams');
      });
      
      testResults.teamPerformance = result;
      tracker.updateTest('teamStats', 'performance', result.success ? 'working' : 'broken', 
        result.success ? `Working (${result.duration}ms)` : result.error);
      
      expect(result.success).toBe(true);
    });

    test('Historical Data', async () => {
      const result = await comprehensiveTest('Historical Data', async () => {
        return await makeApiRequest('/api/games?date=2024-01-01&limit=10');
      });
      
      testResults.historicalData = result;
      tracker.updateTest('teamStats', 'historical', result.success ? 'working' : 'broken', 
        result.success ? `Working (${result.duration}ms)` : result.error);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(Array.isArray(result.result)).toBe(true);
      }
    });
  });
});