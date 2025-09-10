-- Multi-Sport Database Schema Enhancement
-- Extends the core schema to support all major sports

-- Enhanced Teams table for multi-sport support
ALTER TABLE teams ADD COLUMN IF NOT EXISTS conference TEXT;
ALTER TABLE teams ADD COLUMN IF NOT EXISTS division TEXT;
ALTER TABLE teams ADD COLUMN IF NOT EXISTS founded_year INTEGER;
ALTER TABLE teams ADD COLUMN IF NOT EXISTS stadium_name TEXT;
ALTER TABLE teams ADD COLUMN IF NOT EXISTS stadium_capacity INTEGER;
ALTER TABLE teams ADD COLUMN IF NOT EXISTS primary_color TEXT;
ALTER TABLE teams ADD COLUMN IF NOT EXISTS secondary_color TEXT;
ALTER TABLE teams ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'US';
ALTER TABLE teams ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- Enhanced Games table for multi-sport support
ALTER TABLE games ADD COLUMN IF NOT EXISTS game_type TEXT DEFAULT 'regular'; -- regular, playoff, championship
ALTER TABLE games ADD COLUMN IF NOT EXISTS round TEXT; -- for playoffs
ALTER TABLE games ADD COLUMN IF NOT EXISTS series_game INTEGER; -- for playoff series
ALTER TABLE games ADD COLUMN IF NOT EXISTS overtime_periods INTEGER DEFAULT 0;
ALTER TABLE games ADD COLUMN IF NOT EXISTS attendance INTEGER;
ALTER TABLE games ADD COLUMN IF NOT EXISTS referee_crew JSONB;
ALTER TABLE games ADD COLUMN IF NOT EXISTS game_notes TEXT;

-- Sport-specific stats tables
-- Basketball stats (extends existing player_stats)
ALTER TABLE player_stats ADD COLUMN IF NOT EXISTS plus_minus INTEGER;
ALTER TABLE player_stats ADD COLUMN IF NOT EXISTS personal_fouls INTEGER;
ALTER TABLE player_stats ADD COLUMN IF NOT EXISTS technical_fouls INTEGER;
ALTER TABLE player_stats ADD COLUMN IF NOT EXISTS flagrant_fouls INTEGER;
ALTER TABLE player_stats ADD COLUMN IF NOT EXISTS double_doubles INTEGER;
ALTER TABLE player_stats ADD COLUMN IF NOT EXISTS triple_doubles INTEGER;

-- Football stats table
CREATE TABLE IF NOT EXISTS football_player_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES games(id),
  team_id UUID NOT NULL REFERENCES teams(id),
  player_name TEXT NOT NULL,
  position TEXT,
  passing_yards INTEGER DEFAULT 0,
  passing_touchdowns INTEGER DEFAULT 0,
  passing_interceptions INTEGER DEFAULT 0,
  rushing_yards INTEGER DEFAULT 0,
  rushing_touchdowns INTEGER DEFAULT 0,
  receiving_yards INTEGER DEFAULT 0,
  receiving_touchdowns INTEGER DEFAULT 0,
  receptions INTEGER DEFAULT 0,
  tackles INTEGER DEFAULT 0,
  sacks INTEGER DEFAULT 0,
  interceptions INTEGER DEFAULT 0,
  fumbles INTEGER DEFAULT 0,
  fumbles_recovered INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Baseball stats table
CREATE TABLE IF NOT EXISTS baseball_player_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES games(id),
  team_id UUID NOT NULL REFERENCES teams(id),
  player_name TEXT NOT NULL,
  position TEXT,
  at_bats INTEGER DEFAULT 0,
  hits INTEGER DEFAULT 0,
  runs INTEGER DEFAULT 0,
  rbi INTEGER DEFAULT 0,
  home_runs INTEGER DEFAULT 0,
  doubles INTEGER DEFAULT 0,
  triples INTEGER DEFAULT 0,
  walks INTEGER DEFAULT 0,
  strikeouts INTEGER DEFAULT 0,
  stolen_bases INTEGER DEFAULT 0,
  batting_average DECIMAL(4,3),
  on_base_percentage DECIMAL(4,3),
  slugging_percentage DECIMAL(4,3),
  innings_pitched DECIMAL(4,1),
  earned_runs INTEGER DEFAULT 0,
  hits_allowed INTEGER DEFAULT 0,
  walks_allowed INTEGER DEFAULT 0,
  strikeouts_pitched INTEGER DEFAULT 0,
  era DECIMAL(4,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Hockey stats table
CREATE TABLE IF NOT EXISTS hockey_player_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES games(id),
  team_id UUID NOT NULL REFERENCES teams(id),
  player_name TEXT NOT NULL,
  position TEXT,
  goals INTEGER DEFAULT 0,
  assists INTEGER DEFAULT 0,
  points INTEGER DEFAULT 0,
  plus_minus INTEGER DEFAULT 0,
  penalty_minutes INTEGER DEFAULT 0,
  shots INTEGER DEFAULT 0,
  hits INTEGER DEFAULT 0,
  blocked_shots INTEGER DEFAULT 0,
  faceoff_wins INTEGER DEFAULT 0,
  faceoff_attempts INTEGER DEFAULT 0,
  time_on_ice INTEGER, -- in seconds
  power_play_goals INTEGER DEFAULT 0,
  power_play_assists INTEGER DEFAULT 0,
  shorthanded_goals INTEGER DEFAULT 0,
  shorthanded_assists INTEGER DEFAULT 0,
  game_winning_goals INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Soccer stats table
CREATE TABLE IF NOT EXISTS soccer_player_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES games(id),
  team_id UUID NOT NULL REFERENCES teams(id),
  player_name TEXT NOT NULL,
  position TEXT,
  minutes_played INTEGER DEFAULT 0,
  goals INTEGER DEFAULT 0,
  assists INTEGER DEFAULT 0,
  shots INTEGER DEFAULT 0,
  shots_on_target INTEGER DEFAULT 0,
  passes INTEGER DEFAULT 0,
  passes_completed INTEGER DEFAULT 0,
  crosses INTEGER DEFAULT 0,
  crosses_completed INTEGER DEFAULT 0,
  tackles INTEGER DEFAULT 0,
  interceptions INTEGER DEFAULT 0,
  clearances INTEGER DEFAULT 0,
  fouls_committed INTEGER DEFAULT 0,
  fouls_won INTEGER DEFAULT 0,
  yellow_cards INTEGER DEFAULT 0,
  red_cards INTEGER DEFAULT 0,
  offsides INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tennis stats table
CREATE TABLE IF NOT EXISTS tennis_match_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES games(id),
  player1_id UUID REFERENCES teams(id), -- Using teams table for players
  player2_id UUID REFERENCES teams(id),
  player1_name TEXT NOT NULL,
  player2_name TEXT NOT NULL,
  sets_won_player1 INTEGER DEFAULT 0,
  sets_won_player2 INTEGER DEFAULT 0,
  games_won_player1 INTEGER DEFAULT 0,
  games_won_player2 INTEGER DEFAULT 0,
  aces_player1 INTEGER DEFAULT 0,
  aces_player2 INTEGER DEFAULT 0,
  double_faults_player1 INTEGER DEFAULT 0,
  double_faults_player2 INTEGER DEFAULT 0,
  first_serve_percentage_player1 DECIMAL(5,2),
  first_serve_percentage_player2 DECIMAL(5,2),
  break_points_saved_player1 INTEGER DEFAULT 0,
  break_points_saved_player2 INTEGER DEFAULT 0,
  break_points_converted_player1 INTEGER DEFAULT 0,
  break_points_converted_player2 INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Golf stats table
CREATE TABLE IF NOT EXISTS golf_tournament_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES games(id),
  player_id UUID REFERENCES teams(id),
  player_name TEXT NOT NULL,
  position INTEGER,
  total_score INTEGER,
  rounds JSONB, -- Array of round scores
  strokes_gained_putting DECIMAL(4,2),
  strokes_gained_approach DECIMAL(4,2),
  strokes_gained_off_tee DECIMAL(4,2),
  strokes_gained_around_green DECIMAL(4,2),
  driving_distance DECIMAL(6,2),
  driving_accuracy DECIMAL(5,2),
  greens_in_regulation DECIMAL(5,2),
  putting_average DECIMAL(4,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enhanced Odds table for multi-sport support
ALTER TABLE odds ADD COLUMN IF NOT EXISTS sport TEXT DEFAULT 'basketball';
ALTER TABLE odds ADD COLUMN IF NOT EXISTS league TEXT;
ALTER TABLE odds ADD COLUMN IF NOT EXISTS prop_bets JSONB; -- For prop betting
ALTER TABLE odds ADD COLUMN IF NOT EXISTS live_odds BOOLEAN DEFAULT FALSE;
ALTER TABLE odds ADD COLUMN IF NOT EXISTS odds_movement JSONB; -- Track odds changes

-- League standings table
CREATE TABLE IF NOT EXISTS league_standings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id),
  season TEXT NOT NULL,
  league TEXT NOT NULL,
  sport TEXT NOT NULL,
  wins INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  ties INTEGER DEFAULT 0,
  win_percentage DECIMAL(5,3),
  games_back DECIMAL(4,1),
  streak TEXT, -- "W3", "L2", etc.
  home_wins INTEGER DEFAULT 0,
  home_losses INTEGER DEFAULT 0,
  away_wins INTEGER DEFAULT 0,
  away_losses INTEGER DEFAULT 0,
  division_wins INTEGER DEFAULT 0,
  division_losses INTEGER DEFAULT 0,
  conference_wins INTEGER DEFAULT 0,
  conference_losses INTEGER DEFAULT 0,
  points_for INTEGER DEFAULT 0,
  points_against INTEGER DEFAULT 0,
  point_differential INTEGER DEFAULT 0,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Player profiles table
CREATE TABLE IF NOT EXISTS player_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  team_id UUID REFERENCES teams(id),
  sport TEXT NOT NULL,
  position TEXT,
  height TEXT,
  weight INTEGER,
  age INTEGER,
  experience_years INTEGER,
  college TEXT,
  country TEXT,
  jersey_number INTEGER,
  is_active BOOLEAN DEFAULT TRUE,
  headshot_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enhanced Predictions table for multi-sport
ALTER TABLE predictions ADD COLUMN IF NOT EXISTS sport TEXT DEFAULT 'basketball';
ALTER TABLE predictions ADD COLUMN IF NOT EXISTS league TEXT;
ALTER TABLE predictions ADD COLUMN IF NOT EXISTS reasoning TEXT;
ALTER TABLE predictions ADD COLUMN IF NOT EXISTS model_version TEXT;
ALTER TABLE predictions ADD COLUMN IF NOT EXISTS feature_importance JSONB;
ALTER TABLE predictions ADD COLUMN IF NOT EXISTS confidence_interval JSONB;

-- Value betting opportunities table
CREATE TABLE IF NOT EXISTS value_betting_opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES games(id),
  sport TEXT NOT NULL,
  league TEXT,
  bet_type TEXT NOT NULL, -- 'moneyline', 'spread', 'total', 'prop'
  side TEXT NOT NULL, -- 'home', 'away', 'over', 'under'
  odds DECIMAL NOT NULL,
  implied_probability DECIMAL NOT NULL,
  predicted_probability DECIMAL NOT NULL,
  value DECIMAL NOT NULL,
  kelly_percentage DECIMAL,
  expected_value DECIMAL,
  recommendation TEXT, -- 'strong', 'moderate', 'weak'
  confidence_score DECIMAL,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sports news and updates table
CREATE TABLE IF NOT EXISTS sports_news (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT,
  sport TEXT NOT NULL,
  league TEXT,
  team_id UUID REFERENCES teams(id),
  player_id UUID REFERENCES player_profiles(id),
  news_type TEXT, -- 'injury', 'trade', 'suspension', 'general'
  source TEXT,
  url TEXT,
  published_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_teams_sport_league ON teams(sport, league);
CREATE INDEX IF NOT EXISTS idx_games_sport_season ON games(sport, season);
CREATE INDEX IF NOT EXISTS idx_odds_sport_league ON odds(sport, league);
CREATE INDEX IF NOT EXISTS idx_football_stats_game ON football_player_stats(game_id);
CREATE INDEX IF NOT EXISTS idx_baseball_stats_game ON baseball_player_stats(game_id);
CREATE INDEX IF NOT EXISTS idx_hockey_stats_game ON hockey_player_stats(game_id);
CREATE INDEX IF NOT EXISTS idx_soccer_stats_game ON soccer_player_stats(game_id);
CREATE INDEX IF NOT EXISTS idx_tennis_stats_game ON tennis_match_stats(game_id);
CREATE INDEX IF NOT EXISTS idx_golf_stats_game ON golf_tournament_stats(game_id);
CREATE INDEX IF NOT EXISTS idx_standings_season_league ON league_standings(season, league);
CREATE INDEX IF NOT EXISTS idx_player_profiles_sport ON player_profiles(sport);
CREATE INDEX IF NOT EXISTS idx_value_bets_sport ON value_betting_opportunities(sport);
CREATE INDEX IF NOT EXISTS idx_sports_news_sport ON sports_news(sport);

-- Create views for common queries
CREATE OR REPLACE VIEW active_teams AS
SELECT * FROM teams WHERE is_active = TRUE;

CREATE OR REPLACE VIEW recent_games AS
SELECT g.*, 
       ht.name as home_team_name, 
       at.name as away_team_name,
       ht.abbreviation as home_team_abbr,
       at.abbreviation as away_team_abbr
FROM games g
JOIN teams ht ON g.home_team_id = ht.id
JOIN teams at ON g.away_team_id = at.id
WHERE g.game_date >= NOW() - INTERVAL '7 days'
ORDER BY g.game_date DESC;

CREATE OR REPLACE VIEW current_standings AS
SELECT ls.*, t.name as team_name, t.abbreviation
FROM league_standings ls
JOIN teams t ON ls.team_id = t.id
WHERE ls.season = '2024-25' -- Update season as needed
ORDER BY ls.win_percentage DESC;

-- Add constraints
ALTER TABLE football_player_stats ADD CONSTRAINT fk_football_game FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE;
ALTER TABLE baseball_player_stats ADD CONSTRAINT fk_baseball_game FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE;
ALTER TABLE hockey_player_stats ADD CONSTRAINT fk_hockey_game FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE;
ALTER TABLE soccer_player_stats ADD CONSTRAINT fk_soccer_game FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE;
ALTER TABLE tennis_match_stats ADD CONSTRAINT fk_tennis_game FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE;
ALTER TABLE golf_tournament_stats ADD CONSTRAINT fk_golf_game FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE;

-- Execute this script to enhance the database for multi-sport support
