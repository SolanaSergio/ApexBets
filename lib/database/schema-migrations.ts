/**
 * Database Schema Migrations
 * Centralized schema management for ApexBets database
 */

import { productionSupabaseClient } from '../supabase/production-client'

export class SchemaMigrations {
  private static instance: SchemaMigrations
  private migrations: Map<string, string> = new Map()

  private constructor() {
    this.initializeMigrations()
  }

  static getInstance(): SchemaMigrations {
    if (!SchemaMigrations.instance) {
      SchemaMigrations.instance = new SchemaMigrations()
    }
    return SchemaMigrations.instance
  }

  private initializeMigrations() {
    // Cache entries table
    this.migrations.set(
      'create_cache_entries_table',
      `
      CREATE TABLE IF NOT EXISTS cache_entries (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        key TEXT NOT NULL UNIQUE,
        data JSONB NOT NULL,
        ttl INTEGER NOT NULL DEFAULT 300000,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        sport TEXT,
        data_type TEXT
      );

      CREATE INDEX IF NOT EXISTS idx_cache_entries_key ON cache_entries(key);
      CREATE INDEX IF NOT EXISTS idx_cache_entries_expires_at ON cache_entries(expires_at);
      CREATE INDEX IF NOT EXISTS idx_cache_entries_sport ON cache_entries(sport);
      CREATE INDEX IF NOT EXISTS idx_cache_entries_data_type ON cache_entries(data_type);
    `
    )

    // API rate limits table
    this.migrations.set(
      'create_api_rate_limits_table',
      `
      CREATE TABLE IF NOT EXISTS api_rate_limits (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        provider TEXT NOT NULL,
        endpoint TEXT NOT NULL,
        requests_count INTEGER DEFAULT 0,
        window_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        daily_requests INTEGER DEFAULT 0,
        daily_reset_date DATE DEFAULT CURRENT_DATE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(provider, endpoint, window_start)
      );

      CREATE INDEX IF NOT EXISTS idx_api_rate_limits_provider ON api_rate_limits(provider);
      CREATE INDEX IF NOT EXISTS idx_api_rate_limits_window_start ON api_rate_limits(window_start);
      CREATE INDEX IF NOT EXISTS idx_api_rate_limits_daily_reset ON api_rate_limits(daily_reset_date);
    `
    )

    // Sports configuration table
    this.migrations.set(
      'create_sports_config_table',
      `
      CREATE TABLE IF NOT EXISTS sports_config (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        sport TEXT NOT NULL UNIQUE,
        display_name TEXT NOT NULL,
        icon TEXT,
        color TEXT,
        is_active BOOLEAN DEFAULT true,
        data_source TEXT,
        api_key TEXT,
        player_stats_table TEXT,
        positions JSONB,
        scoring_fields JSONB,
        betting_markets JSONB,
        season_config JSONB,
        rate_limits JSONB,
        update_frequency INTEGER DEFAULT 300000,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_sports_config_sport ON sports_config(sport);
      CREATE INDEX IF NOT EXISTS idx_sports_config_active ON sports_config(is_active);
    `
    )

    // Enhanced teams table
    this.migrations.set(
      'enhance_teams_table',
      `
      ALTER TABLE teams ADD COLUMN IF NOT EXISTS sport TEXT;
      ALTER TABLE teams ADD COLUMN IF NOT EXISTS league TEXT;
      ALTER TABLE teams ADD COLUMN IF NOT EXISTS conference TEXT;
      ALTER TABLE teams ADD COLUMN IF NOT EXISTS division TEXT;
      ALTER TABLE teams ADD COLUMN IF NOT EXISTS founded_year INTEGER;
      ALTER TABLE teams ADD COLUMN IF NOT EXISTS stadium_name TEXT;
      ALTER TABLE teams ADD COLUMN IF NOT EXISTS stadium_capacity INTEGER;
      ALTER TABLE teams ADD COLUMN IF NOT EXISTS primary_color TEXT;
      ALTER TABLE teams ADD COLUMN IF NOT EXISTS secondary_color TEXT;
      ALTER TABLE teams ADD COLUMN IF NOT EXISTS country TEXT;
      ALTER TABLE teams ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
      ALTER TABLE teams ADD COLUMN IF NOT EXISTS last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW();

      CREATE INDEX IF NOT EXISTS idx_teams_sport ON teams(sport);
      CREATE INDEX IF NOT EXISTS idx_teams_league ON teams(league);
      CREATE INDEX IF NOT EXISTS idx_teams_active ON teams(is_active);
    `
    )

    // Enhanced games table
    this.migrations.set(
      'enhance_games_table',
      `
      ALTER TABLE games ADD COLUMN IF NOT EXISTS sport TEXT;
      ALTER TABLE games ADD COLUMN IF NOT EXISTS league TEXT;
      ALTER TABLE games ADD COLUMN IF NOT EXISTS season TEXT;
      ALTER TABLE games ADD COLUMN IF NOT EXISTS venue TEXT;
      ALTER TABLE games ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'scheduled';
      ALTER TABLE games ADD COLUMN IF NOT EXISTS home_score INTEGER;
      ALTER TABLE games ADD COLUMN IF NOT EXISTS away_score INTEGER;
      ALTER TABLE games ADD COLUMN IF NOT EXISTS last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW();

      CREATE INDEX IF NOT EXISTS idx_games_sport ON games(sport);
      CREATE INDEX IF NOT EXISTS idx_games_league ON games(league);
      CREATE INDEX IF NOT EXISTS idx_games_status ON games(status);
      CREATE INDEX IF NOT EXISTS idx_games_date ON games(game_date);
      CREATE INDEX IF NOT EXISTS idx_games_teams ON games(home_team_id, away_team_id);
    `
    )

    // Players table
    this.migrations.set(
      'create_players_table',
      `
      CREATE TABLE IF NOT EXISTS players (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        name TEXT NOT NULL,
        sport TEXT NOT NULL,
        position TEXT,
        team_id UUID REFERENCES teams(id),
        team_name TEXT,
        height TEXT,
        weight INTEGER,
        age INTEGER,
        experience_years INTEGER,
        college TEXT,
        country TEXT,
        jersey_number INTEGER,
        is_active BOOLEAN DEFAULT true,
        headshot_url TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_players_sport ON players(sport);
      CREATE INDEX IF NOT EXISTS idx_players_team_id ON players(team_id);
      CREATE INDEX IF NOT EXISTS idx_players_active ON players(is_active);
      CREATE INDEX IF NOT EXISTS idx_players_name ON players(name);
    `
    )

    // Player stats table
    this.migrations.set(
      'create_player_stats_table',
      `
      CREATE TABLE IF NOT EXISTS player_stats (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        player_id UUID REFERENCES players(id),
        game_id UUID REFERENCES games(id),
        sport TEXT NOT NULL,
        season TEXT,
        stats JSONB NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_player_stats_player_id ON player_stats(player_id);
      CREATE INDEX IF NOT EXISTS idx_player_stats_game_id ON player_stats(game_id);
      CREATE INDEX IF NOT EXISTS idx_player_stats_sport ON player_stats(sport);
      CREATE INDEX IF NOT EXISTS idx_player_stats_season ON player_stats(season);
    `
    )

    // Odds table
    this.migrations.set(
      'create_odds_table',
      `
      CREATE TABLE IF NOT EXISTS odds (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        game_id UUID REFERENCES games(id),
        sport TEXT NOT NULL,
        league TEXT,
        provider TEXT NOT NULL,
        market_type TEXT NOT NULL,
        odds_data JSONB NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_odds_game_id ON odds(game_id);
      CREATE INDEX IF NOT EXISTS idx_odds_sport ON odds(sport);
      CREATE INDEX IF NOT EXISTS idx_odds_provider ON odds(provider);
      CREATE INDEX IF NOT EXISTS idx_odds_market_type ON odds(market_type);
    `
    )

    // Standings table
    this.migrations.set(
      'create_standings_table',
      `
      CREATE TABLE IF NOT EXISTS standings (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        sport TEXT NOT NULL,
        league TEXT NOT NULL,
        season TEXT NOT NULL,
        team_id UUID REFERENCES teams(id),
        team_name TEXT NOT NULL,
        position INTEGER,
        wins INTEGER DEFAULT 0,
        losses INTEGER DEFAULT 0,
        ties INTEGER DEFAULT 0,
        win_percentage DECIMAL(5,3),
        games_behind DECIMAL(5,1),
        points_for INTEGER DEFAULT 0,
        points_against INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_standings_sport ON standings(sport);
      CREATE INDEX IF NOT EXISTS idx_standings_league ON standings(league);
      CREATE INDEX IF NOT EXISTS idx_standings_season ON standings(season);
      CREATE INDEX IF NOT EXISTS idx_standings_team_id ON standings(team_id);
    `
    )

    // API error logs table
    this.migrations.set(
      'create_api_error_logs_table',
      `
      CREATE TABLE IF NOT EXISTS api_error_logs (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        provider TEXT NOT NULL,
        endpoint TEXT NOT NULL,
        error_message TEXT NOT NULL,
        error_code TEXT,
        request_data JSONB,
        response_data JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_api_error_logs_provider ON api_error_logs(provider);
      CREATE INDEX IF NOT EXISTS idx_api_error_logs_created_at ON api_error_logs(created_at);
    `
    )
  }

  async runAllMigrations(): Promise<{
    success: boolean
    results: Array<{ name: string; success: boolean; error?: string }>
  }> {
    const results: Array<{ name: string; success: boolean; error?: string }> = []

    for (const [name, query] of this.migrations) {
      try {
        await productionSupabaseClient.executeSQL(query)
        results.push({ name, success: true })
        console.log(`✅ Migration ${name} completed successfully`)
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        results.push({ name, success: false, error: errorMessage })
        console.error(`❌ Migration ${name} failed:`, errorMessage)
      }
    }

    const success = results.every(r => r.success)
    return { success, results }
  }

  async runMigration(name: string): Promise<{ success: boolean; error?: string }> {
    const query = this.migrations.get(name)
    if (!query) {
      return { success: false, error: `Migration ${name} not found` }
    }

    try {
      await productionSupabaseClient.executeSQL(query)
      console.log(`✅ Migration ${name} completed successfully`)
      return { success: true }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      console.error(`❌ Migration ${name} failed:`, errorMessage)
      return { success: false, error: errorMessage }
    }
  }

  getAvailableMigrations(): string[] {
    return Array.from(this.migrations.keys())
  }
}

export const schemaMigrations = SchemaMigrations.getInstance()
