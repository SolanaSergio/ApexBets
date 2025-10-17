
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Interfaces
export interface Game { id: string; sport: string; league: string; season: number; date: string; home_team_id: string; away_team_id: string; status: string; home_score: number | null; away_score: number | null; provider: string; provider_game_id: string; }
export interface Team { id: string; name: string; logo_url: string; provider: string; provider_team_id: string; }
export interface League { id: string; name: string; sport: string; logo_url: string; provider: string; provider_league_id: string; }

// Simplified SportsDB client
class SportsDBClient {
  private baseUrl = 'https://www.thesportsdb.com/api/v1/json';
  private apiKey: string;

  constructor(apiKey: string) { this.apiKey = apiKey; }

  async getLeaguesBySport(sport: string): Promise<any[]> { /* ... */ }
  async getTeamsByLeague(leagueId: string): Promise<any[]> { /* ... */ }
  async getEventsByDate(date: string): Promise<any[]> { /* ... */ }
  async getLiveEvents(): Promise<any[]> { /* ... */ }
}

class DataIngestionService {
  private static instance: DataIngestionService;

  public static getInstance(): DataIngestionService {
    if (!DataIngestionService.instance) {
      DataIngestionService.instance = new DataIngestionService();
    }
    return DataIngestionService.instance;
  }

  async ingestData() {
    const sportsdb = new SportsDBClient(Deno.env.get('SPORTSDB_API_KEY') ?? '123');
    const supabaseAdmin = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');

    // Ingest leagues
    const { data: sports, error: sportsError } = await supabaseAdmin.from('sports').select('name');
    if (sportsError) { console.error(sportsError); return; }
    for (const sport of sports) {
      const leagues = await sportsdb.getLeaguesBySport(sport.name);
      // ... transform and store leagues
    }

    // Ingest teams
    const { data: leagues, error: leaguesError } = await supabaseAdmin.from('leagues').select('provider_league_id');
    if (leaguesError) { console.error(leaguesError); return; }
    for (const league of leagues) {
      const teams = await sportsdb.getTeamsByLeague(league.provider_league_id);
      // ... transform and store teams
    }

    // Ingest games
    const today = new Date().toISOString().slice(0, 10);
    const games = await sportsdb.getEventsByDate(today);
    // ... transform and store games

    // Update live games
    const liveGames = await sportsdb.getLiveEvents();
    // ... update live games

    // Update completed games
    const completedGames = await sportsdb.getEventsByDate(today);
    // ... update completed games
  }
}

export const dataIngestionService = DataIngestionService.getInstance();
