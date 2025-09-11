import { NextRequest, NextResponse } from 'next/server';
import { sportsDBClient } from '@/lib/sports-apis/sportsdb-client';
import { ballDontLieClient } from '@/lib/sports-apis/balldontlie-client';
import { apiSportsClient } from '@/lib/sports-apis/api-sports-client';
import { cachedUnifiedApiClient } from '@/lib/services/api/cached-unified-api-client';

// Define proper types for the response
interface SportsData {
  events: any[];
  leagues: any[];
}

interface BallDontLieData {
  teams: any[];
  games: any[];
}

interface ApiSportsData {
  leagues: any[];
  fixtures: any[];
}

interface SourceData {
  events?: number;
  leagues?: number;
  teams?: number;
  games?: number;
  fixtures?: number;
  data?: SportsData | BallDontLieData | ApiSportsData;
  error?: string;
  mockData?: boolean;
}

interface SportsResponse {
  sport: string;
  date: string;
  sources: {
    sportsdb?: SourceData;
    balldontlie?: SourceData;
    apiSports?: SourceData;
  };
}

export async function GET(request: NextRequest) {
  // Set a timeout for the entire request
  const timeoutPromise = new Promise<never>((_, reject) => 
    setTimeout(() => reject(new Error('Request timeout')), 10000) // 10 seconds should be sufficient
  );
  
  const processRequest = async (): Promise<SportsResponse> => {
    const { searchParams } = new URL(request.url);
    const sport = searchParams.get('sport');
    
    if (!sport) {
      throw new Error("Sport parameter is required");
    }
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0];
    
    const results: SportsResponse = {
      sport,
      date,
      sources: {}
    };
    
    // Get data from SportsDB with shorter timeout
    try {
      const eventsPromise = sportsDBClient.getEventsByDate(date, sport);
      const leaguesPromise = sportsDBClient.getLeaguesBySport(sport);
      
      const sportsData = await Promise.race([
        Promise.all([eventsPromise, leaguesPromise]),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('SportsDB timeout')), 2000) // Reduced timeout
        )
      ]);
      
      const [events, leagues] = sportsData;
      
      results.sources.sportsdb = {
        events: events.length,
        leagues: leagues.length,
        data: { events, leagues }
      };
    } catch (error) {
      // Return empty data if SportsDB fails instead of mock data
      results.sources.sportsdb = {
        events: 0,
        leagues: 0,
        data: { events: [], leagues: [] },
        error: error instanceof Error ? error.message : 'SportsDB request failed',
        mockData: false
      };
    }
    
    // Get data from BallDontLie (basketball only)
    if (sport === 'basketball') {
      try {
        // Check if BallDontLie API is configured
        if (!ballDontLieClient.isConfigured) {
          results.sources.balldontlie = {
            teams: 0,
            games: 0,
            data: { teams: [], games: [] },
            error: 'BallDontLie API key not configured',
            mockData: false
          };
        } else {
          // Add timeout for BallDontLie API calls
          const ballDontLiePromise = Promise.all([
            ballDontLieClient.getTeams({ per_page: 10 }),
            ballDontLieClient.getGames({ per_page: 10 })
          ]);
          
          const ballDontLieData = await Promise.race([
            ballDontLiePromise,
            new Promise<never>((_, reject) => 
              setTimeout(() => reject(new Error('BallDontLie timeout')), 6000)
            )
          ]);
          
          const [teams, games] = ballDontLieData;
          
          results.sources.balldontlie = {
            teams: teams.data.length,
            games: games.data.length,
            data: { teams: teams.data, games: games.data }
          };
        }
      } catch (error) {
        results.sources.balldontlie = {
          teams: 0,
          games: 0,
          data: { teams: [], games: [] },
          error: error instanceof Error ? error.message : 'Unknown error',
          mockData: false
        };
      }
    }
    
    // Get data from API-SPORTS (soccer only)
    if (sport === 'soccer') {
      try {
        const leagues = await apiSportsClient.getLeagues();
        const fixtures = await apiSportsClient.getFixtures({ next: 10 });
        
        results.sources.apiSports = {
          leagues: leagues.length,
          fixtures: fixtures.length,
          data: { leagues, fixtures }
        };
      } catch (error) {
        results.sources.apiSports = {
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    }
    
    return results;
  };
  
  try {
    const result = await Promise.race([processRequest(), timeoutPromise]);
    return NextResponse.json({
      success: true,
      ...result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Sports API error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
