#!/usr/bin/env node
/**
 * Final Project Apex Database Setup
 * Using Supabase JavaScript client directly
 */

const { createClient } = require('@supabase/supabase-js');

// Direct Supabase configuration
const supabaseUrl = 'https://luehhafpitbluxvwxczl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx1ZWhoYWZwaXRibHV4dnd4Y3psIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzQyMDg2OSwiZXhwIjoyMDcyOTk2ODY5fQ.p5fojKsD5OZQqgv4CLsfJQJfPy1olD9jTN2jvhc6ySo';

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🚀 Project Apex - Final Database Setup');
console.log('='.repeat(50));
console.log('🔗 Connected to Supabase');
console.log(`📍 URL: ${supabaseUrl}`);

async function testConnection() {
  try {
    console.log('\n🧪 Testing database connection...');
    
    // Test basic connection by trying to access a table
    const { data, error } = await supabase
      .from('teams')
      .select('count')
      .limit(1);
    
    if (error) {
      if (error.message.includes('relation "teams" does not exist')) {
        console.log('📋 Database tables not found - this is expected for first setup');
        console.log('✅ Connection successful, but tables need to be created');
        return { connected: true, tablesExist: false };
      } else {
        console.log('❌ Connection failed:', error.message);
        return { connected: false, tablesExist: false };
      }
    } else {
      console.log('✅ Database connection successful!');
      console.log('✅ Tables already exist!');
      return { connected: true, tablesExist: true };
    }
  } catch (error) {
    console.log('❌ Connection test failed:', error.message);
    return { connected: false, tablesExist: false };
  }
}

async function createTables() {
  console.log('\n📋 Creating database tables...');
  console.log('⚠️  Note: This requires manual execution in Supabase Dashboard');
  
  const sqlScripts = [
    {
      name: '1. Core Tables',
      description: 'Create teams, games, odds, player_stats, predictions, profiles, user_alerts, scrape_logs tables',
      sql: `
-- Teams table
CREATE TABLE IF NOT EXISTS teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  city TEXT,
  league TEXT NOT NULL,
  sport TEXT NOT NULL DEFAULT 'basketball',
  abbreviation TEXT,
  logo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Games table
CREATE TABLE IF NOT EXISTS games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  home_team_id UUID NOT NULL REFERENCES teams(id),
  away_team_id UUID NOT NULL REFERENCES teams(id),
  game_date TIMESTAMP WITH TIME ZONE NOT NULL,
  season TEXT NOT NULL,
  week INTEGER,
  home_score INTEGER,
  away_score INTEGER,
  status TEXT DEFAULT 'scheduled',
  venue TEXT,
  weather_conditions JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Odds table
CREATE TABLE IF NOT EXISTS odds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES games(id),
  source TEXT NOT NULL,
  odds_type TEXT NOT NULL,
  home_odds DECIMAL,
  away_odds DECIMAL,
  spread DECIMAL,
  total DECIMAL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Player stats table
CREATE TABLE IF NOT EXISTS player_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES games(id),
  team_id UUID NOT NULL REFERENCES teams(id),
  player_name TEXT NOT NULL,
  position TEXT,
  minutes_played INTEGER,
  points INTEGER,
  rebounds INTEGER,
  assists INTEGER,
  steals INTEGER,
  blocks INTEGER,
  turnovers INTEGER,
  field_goals_made INTEGER,
  field_goals_attempted INTEGER,
  three_pointers_made INTEGER,
  three_pointers_attempted INTEGER,
  free_throws_made INTEGER,
  free_throws_attempted INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Predictions table
CREATE TABLE IF NOT EXISTS predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES games(id),
  model_name TEXT NOT NULL,
  prediction_type TEXT NOT NULL,
  predicted_value DECIMAL,
  confidence DECIMAL CHECK (confidence >= 0 AND confidence <= 1),
  actual_value DECIMAL,
  is_correct BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Scrape logs table
CREATE TABLE IF NOT EXISTS scrape_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT NOT NULL,
  data_type TEXT NOT NULL,
  records_scraped INTEGER DEFAULT 0,
  success BOOLEAN DEFAULT TRUE,
  error_message TEXT,
  scraped_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  display_name TEXT,
  subscription_tier TEXT DEFAULT 'free',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User alerts table
CREATE TABLE IF NOT EXISTS user_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL,
  team_id UUID REFERENCES teams(id),
  conditions JSONB,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_games_date ON games(game_date);
CREATE INDEX IF NOT EXISTS idx_games_teams ON games(home_team_id, away_team_id);
CREATE INDEX IF NOT EXISTS idx_odds_game_id ON odds(game_id);
CREATE INDEX IF NOT EXISTS idx_odds_timestamp ON odds(timestamp);
CREATE INDEX IF NOT EXISTS idx_player_stats_game ON player_stats(game_id);
CREATE INDEX IF NOT EXISTS idx_predictions_game ON predictions(game_id);
CREATE INDEX IF NOT EXISTS idx_scrape_logs_source ON scrape_logs(source, scraped_at);
`
    },
    {
      name: '2. Row Level Security',
      description: 'Enable RLS and create security policies',
      sql: `
-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_alerts ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "profiles_select_own" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_delete_own" ON profiles FOR DELETE USING (auth.uid() = id);

-- User alerts policies
CREATE POLICY "alerts_select_own" ON user_alerts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "alerts_insert_own" ON user_alerts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "alerts_update_own" ON user_alerts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "alerts_delete_own" ON user_alerts FOR DELETE USING (auth.uid() = user_id);

-- Public read access
CREATE POLICY "teams_public_read" ON teams FOR SELECT TO PUBLIC USING (true);
CREATE POLICY "games_public_read" ON games FOR SELECT TO PUBLIC USING (true);
CREATE POLICY "odds_public_read" ON odds FOR SELECT TO PUBLIC USING (true);
CREATE POLICY "player_stats_public_read" ON player_stats FOR SELECT TO PUBLIC USING (true);
CREATE POLICY "predictions_public_read" ON predictions FOR SELECT TO PUBLIC USING (true);
CREATE POLICY "scrape_logs_public_read" ON scrape_logs FOR SELECT TO PUBLIC USING (true);
`
    },
    {
      name: '3. Profile Trigger',
      description: 'Create trigger for auto-creating user profiles',
      sql: `
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1))
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
`
    },
    {
      name: '4. Sample Data',
      description: 'Insert sample NBA teams and games',
      sql: `
-- Insert sample NBA teams
INSERT INTO teams (name, city, league, sport, abbreviation) VALUES
('Lakers', 'Los Angeles', 'NBA', 'basketball', 'LAL'),
('Warriors', 'Golden State', 'NBA', 'basketball', 'GSW'),
('Celtics', 'Boston', 'NBA', 'basketball', 'BOS'),
('Heat', 'Miami', 'NBA', 'basketball', 'MIA'),
('Knicks', 'New York', 'NBA', 'basketball', 'NYK'),
('Bulls', 'Chicago', 'NBA', 'basketball', 'CHI'),
('Nets', 'Brooklyn', 'NBA', 'basketball', 'BKN'),
('76ers', 'Philadelphia', 'NBA', 'basketball', 'PHI')
ON CONFLICT DO NOTHING;

-- Insert sample games
WITH team_ids AS (
  SELECT id, abbreviation FROM teams WHERE league = 'NBA'
)
INSERT INTO games (home_team_id, away_team_id, game_date, season, status)
SELECT 
  h.id as home_team_id,
  a.id as away_team_id,
  NOW() + (random() * interval '30 days') as game_date,
  '2024-25' as season,
  'scheduled' as status
FROM team_ids h
CROSS JOIN team_ids a
WHERE h.id != a.id
LIMIT 20
ON CONFLICT DO NOTHING;

-- Insert sample scrape log
INSERT INTO scrape_logs (source, data_type, records_scraped, success)
VALUES ('nba.com', 'teams', 8, true)
ON CONFLICT DO NOTHING;
`
    }
  ];
  
  console.log('\n📋 SQL Scripts to Execute:');
  console.log('='.repeat(50));
  
  sqlScripts.forEach((script, index) => {
    console.log(`\n${script.name}: ${script.description}`);
    console.log('─'.repeat(40));
    console.log(script.sql);
    console.log('─'.repeat(40));
  });
  
  console.log('\n🎯 Instructions:');
  console.log('1. Go to: https://supabase.com/dashboard');
  console.log('2. Select your project: luehhafpitbluxvwxczl');
  console.log('3. Click "SQL Editor" in the sidebar');
  console.log('4. Copy and paste each script above (1-4)');
  console.log('5. Click "Run" for each script');
  console.log('6. Run this script again to verify setup');
}

async function main() {
  const { connected, tablesExist } = await testConnection();
  
  if (!connected) {
    console.log('\n❌ Cannot connect to database');
    console.log('🔧 Please check your Supabase credentials');
    return;
  }
  
  if (tablesExist) {
    console.log('\n🎉 Database is already set up!');
    console.log('🚀 Your ProjectApex app is ready to use');
    console.log('📱 Start your app: pnpm dev');
    console.log('🌐 Visit: http://localhost:3000');
  } else {
    await createTables();
  }
}

main().catch(console.error);
