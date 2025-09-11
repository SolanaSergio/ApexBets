/**
 * API Testing Route
 * Tests all sports APIs with proper environment variables
 */

import { NextRequest, NextResponse } from 'next/server';
import { sportsDBClient } from '@/lib/sports-apis/sportsdb-client';
import { ballDontLieClient } from '@/lib/sports-apis/balldontlie-client';
import { apiSportsClient } from '@/lib/sports-apis/api-sports-client';
import { getOddsApiClient } from '@/lib/sports-apis/odds-api-client';

interface TestResult {
  name: string;
  success: boolean;
  duration: number;
  data?: any;
  error?: string;
  dataCount?: number;
}

async function testSportsDB(): Promise<TestResult> {
  const startTime = Date.now();
  
  try {
    // Test health check
    const isHealthy = await sportsDBClient.healthCheck();
    
    if (!isHealthy) {
      return {
        name: 'SportsDB Health Check',
        success: false,
        duration: Date.now() - startTime,
        error: 'Health check failed'
      };
    }
    
    // Test events
    const events = await sportsDBClient.getEventsByDate('2024-01-01', 'basketball');
    
    return {
      name: 'SportsDB Events',
      success: true,
      duration: Date.now() - startTime,
      data: events,
      dataCount: events.length
    };
  } catch (error) {
    return {
      name: 'SportsDB Events',
      success: false,
      duration: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

async function testBallDontLie(): Promise<TestResult> {
  const startTime = Date.now();
  
  try {
    // Test teams
    const teams = await ballDontLieClient.getTeams({ per_page: 5 });
    
    return {
      name: 'BallDontLie Teams',
      success: true,
      duration: Date.now() - startTime,
      data: teams,
      dataCount: teams.data.length
    };
  } catch (error) {
    return {
      name: 'BallDontLie Teams',
      success: false,
      duration: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

async function testApiSports(): Promise<TestResult> {
  const startTime = Date.now();
  
  try {
    // Test leagues
    const leagues = await apiSportsClient.getLeagues();
    
    return {
      name: 'API-SPORTS Leagues',
      success: true,
      duration: Date.now() - startTime,
      data: leagues,
      dataCount: leagues.length
    };
  } catch (error) {
    return {
      name: 'API-SPORTS Leagues',
      success: false,
      duration: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

async function testOddsApi(): Promise<TestResult> {
  const startTime = Date.now();
  
  try {
    const oddsApiClient = getOddsApiClient();
    
    if (!oddsApiClient) {
      return {
        name: 'Odds API',
        success: false,
        duration: Date.now() - startTime,
        error: 'Odds API client not configured'
      };
    }
    
    // Test sports
    const sports = await oddsApiClient.getSports();
    
    return {
      name: 'Odds API Sports',
      success: true,
      duration: Date.now() - startTime,
      data: sports,
      dataCount: sports.length
    };
  } catch (error) {
    return {
      name: 'Odds API Sports',
      success: false,
      duration: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 Starting API Tests...');
    
    const results: TestResult[] = [];
    
    // Test all APIs
    results.push(await testSportsDB());
    results.push(await testBallDontLie());
    results.push(await testApiSports());
    results.push(await testOddsApi());
    
    // Calculate summary
    const totalTests = results.length;
    const passedTests = results.filter(r => r.success).length;
    const failedTests = results.filter(r => !r.success).length;
    const successRate = (passedTests / totalTests * 100).toFixed(2);
    
    const summary = {
      totalTests,
      passedTests,
      failedTests,
      successRate: parseFloat(successRate),
      duration: results.reduce((sum, r) => sum + r.duration, 0),
      timestamp: new Date().toISOString()
    };
    
    console.log(`✅ API Tests Complete: ${passedTests}/${totalTests} passed (${successRate}%)`);
    
    return NextResponse.json({
      success: true,
      summary,
      results,
      environment: {
        hasSportsDBKey: !!process.env.NEXT_PUBLIC_SPORTSDB_API_KEY,
        hasBallDontLieKey: !!process.env.NEXT_PUBLIC_BALLDONTLIE_API_KEY,
        hasRapidApiKey: !!process.env.NEXT_PUBLIC_RAPIDAPI_KEY,
        hasOddsApiKey: !!process.env.NEXT_PUBLIC_ODDS_API_KEY
      }
    });
    
  } catch (error) {
    console.error('❌ API Test Error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
