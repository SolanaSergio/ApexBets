# Project Apex Database Setup Guide

## 🚀 Quick Setup Instructions

### Step 1: Access Supabase Dashboard
1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Select your project: `luehhafpitbluxvwxczl`
3. Navigate to **SQL Editor** in the left sidebar

### Step 2: Run SQL Scripts in Order

Execute each script below in the SQL Editor, one at a time:

#### 1. Core Tables Creation
```sql
-- Project Apex Database Schema
-- Core tables for sports analytics platform

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
  status TEXT DEFAULT 'scheduled', -- scheduled, in_progress, completed, postponed
  venue TEXT,
  weather_conditions JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Odds table for tracking betting lines
CREATE TABLE IF NOT EXISTS odds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES games(id),
  source TEXT NOT NULL, -- 'draftkings', 'fanduel', etc.
  odds_type TEXT NOT NULL, -- 'moneyline', 'spread', 'total'
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
  prediction_type TEXT NOT NULL, -- 'winner', 'spread', 'total'
  predicted_value DECIMAL,
  confidence DECIMAL CHECK (confidence >= 0 AND confidence <= 1),
  actual_value DECIMAL,
  is_correct BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Scraped data log table
CREATE TABLE IF NOT EXISTS scrape_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT NOT NULL,
  data_type TEXT NOT NULL,
  records_scraped INTEGER DEFAULT 0,
  success BOOLEAN DEFAULT TRUE,
  error_message TEXT,
  scraped_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User profiles table (for authentication)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  display_name TEXT,
  subscription_tier TEXT DEFAULT 'free', -- free, premium
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User alerts table
CREATE TABLE IF NOT EXISTS user_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL, -- 'odds_change', 'prediction_update', 'game_result'
  team_id UUID REFERENCES teams(id),
  conditions JSONB,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_games_date ON games(game_date);
CREATE INDEX IF NOT EXISTS idx_games_teams ON games(home_team_id, away_team_id);
CREATE INDEX IF NOT EXISTS idx_odds_game_id ON odds(game_id);
CREATE INDEX IF NOT EXISTS idx_odds_timestamp ON odds(timestamp);
CREATE INDEX IF NOT EXISTS idx_player_stats_game ON player_stats(game_id);
CREATE INDEX IF NOT EXISTS idx_predictions_game ON predictions(game_id);
CREATE INDEX IF NOT EXISTS idx_scrape_logs_source ON scrape_logs(source, scraped_at);
```

#### 2. Row Level Security Setup
```sql
-- Enable Row Level Security (RLS) for user-accessible tables

-- Enable RLS on profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies - users can only access their own profile
CREATE POLICY "profiles_select_own" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_delete_own" ON profiles FOR DELETE USING (auth.uid() = id);

-- Enable RLS on user_alerts table
ALTER TABLE user_alerts ENABLE ROW LEVEL SECURITY;

-- User alerts policies - users can only access their own alerts
CREATE POLICY "alerts_select_own" ON user_alerts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "alerts_insert_own" ON user_alerts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "alerts_update_own" ON user_alerts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "alerts_delete_own" ON user_alerts FOR DELETE USING (auth.uid() = user_id);

-- Public read access for core sports data (teams, games, odds, predictions)
-- These don't need RLS as they're public information

-- Teams - public read access
CREATE POLICY "teams_public_read" ON teams FOR SELECT TO PUBLIC USING (true);

-- Games - public read access
CREATE POLICY "games_public_read" ON games FOR SELECT TO PUBLIC USING (true);

-- Odds - public read access
CREATE POLICY "odds_public_read" ON odds FOR SELECT TO PUBLIC USING (true);

-- Player stats - public read access
CREATE POLICY "player_stats_public_read" ON player_stats FOR SELECT TO PUBLIC USING (true);

-- Predictions - public read access
CREATE POLICY "predictions_public_read" ON predictions FOR SELECT TO PUBLIC USING (true);

-- Scrape logs - public read access (for transparency)
CREATE POLICY "scrape_logs_public_read" ON scrape_logs FOR SELECT TO PUBLIC USING (true);
```

#### 3. Profile Trigger Creation
```sql
-- Auto-create profile when user signs up

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

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

#### 4. Sample Data Seeding
```sql
-- Seed sample NBA teams and data for testing

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

-- Insert sample games for current season
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
```

### Step 3: Verify Setup

After running all scripts, verify the setup by running this query:

```sql
-- Check if all tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('teams', 'games', 'odds', 'player_stats', 'predictions', 'scrape_logs', 'profiles', 'user_alerts')
ORDER BY table_name;

-- Check sample data
SELECT 'teams' as table_name, COUNT(*) as count FROM teams
UNION ALL
SELECT 'games', COUNT(*) FROM games
UNION ALL
SELECT 'scrape_logs', COUNT(*) FROM scrape_logs;
```

## 🎉 Setup Complete!

Your ProjectApex database is now ready with:
- ✅ All core tables created
- ✅ Row Level Security enabled
- ✅ User profile auto-creation trigger
- ✅ Sample NBA data seeded
- ✅ Proper indexes for performance

## 🔗 Next Steps

1. Your Next.js app should now be able to connect to the database
2. Test the connection by visiting: http://localhost:3000
3. Check the browser console for any connection errors
4. Start building your sports analytics features!

## 📊 Database Schema Overview

- **teams** - NBA team information
- **games** - Game schedules and results  
- **odds** - Betting odds from various sources
- **player_stats** - Individual player statistics
- **predictions** - ML model predictions
- **profiles** - User profiles (auth integration)
- **user_alerts** - User notification preferences
- **scrape_logs** - Data scraping audit trail
