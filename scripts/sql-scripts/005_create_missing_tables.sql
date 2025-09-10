-- Create missing tables for full functionality
-- This script ensures all required tables exist for the application

-- User Alerts Table
CREATE TABLE IF NOT EXISTS user_alerts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('game_start', 'score_change', 'prediction_update', 'odds_change')),
  team_id UUID REFERENCES teams(id),
  threshold DECIMAL(5,2),
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Predictions Table
CREATE TABLE IF NOT EXISTS predictions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  game_id UUID NOT NULL REFERENCES games(id),
  model_name VARCHAR(100) NOT NULL,
  home_win_probability DECIMAL(5,4) NOT NULL,
  away_win_probability DECIMAL(5,4) NOT NULL,
  predicted_spread DECIMAL(5,2),
  predicted_total DECIMAL(5,2),
  confidence DECIMAL(5,4) NOT NULL,
  correct BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Value Bets Table
CREATE TABLE IF NOT EXISTS value_bets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  game_id UUID NOT NULL REFERENCES games(id),
  bet_type VARCHAR(20) NOT NULL CHECK (bet_type IN ('moneyline', 'spread', 'total')),
  side VARCHAR(10) NOT NULL CHECK (side IN ('home', 'away', 'over', 'under')),
  odds DECIMAL(8,2) NOT NULL,
  probability DECIMAL(5,4) NOT NULL,
  value DECIMAL(5,4) NOT NULL,
  recommendation VARCHAR(10) NOT NULL CHECK (recommendation IN ('strong', 'moderate', 'weak')),
  expected_value DECIMAL(8,2),
  kelly_percentage DECIMAL(5,4),
  profit DECIMAL(8,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Analytics Cache Table (for performance)
CREATE TABLE IF NOT EXISTS analytics_cache (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cache_key VARCHAR(255) UNIQUE NOT NULL,
  data JSONB NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_alerts_user_id ON user_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_user_alerts_type ON user_alerts(type);
CREATE INDEX IF NOT EXISTS idx_user_alerts_enabled ON user_alerts(enabled);

CREATE INDEX IF NOT EXISTS idx_predictions_game_id ON predictions(game_id);
CREATE INDEX IF NOT EXISTS idx_predictions_created_at ON predictions(created_at);
CREATE INDEX IF NOT EXISTS idx_predictions_correct ON predictions(correct);

CREATE INDEX IF NOT EXISTS idx_value_bets_game_id ON value_bets(game_id);
CREATE INDEX IF NOT EXISTS idx_value_bets_recommendation ON value_bets(recommendation);
CREATE INDEX IF NOT EXISTS idx_value_bets_created_at ON value_bets(created_at);

CREATE INDEX IF NOT EXISTS idx_analytics_cache_key ON analytics_cache(cache_key);
CREATE INDEX IF NOT EXISTS idx_analytics_cache_expires ON analytics_cache(expires_at);

-- Enable RLS on new tables
ALTER TABLE user_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE value_bets ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_cache ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own alerts" ON user_alerts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own alerts" ON user_alerts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own alerts" ON user_alerts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own alerts" ON user_alerts
  FOR DELETE USING (auth.uid() = user_id);

-- Public read access for predictions and value bets (for analytics)
CREATE POLICY "Public read access for predictions" ON predictions
  FOR SELECT USING (true);

CREATE POLICY "Public read access for value bets" ON value_bets
  FOR SELECT USING (true);

-- Service role access for analytics cache
CREATE POLICY "Service role access for analytics cache" ON analytics_cache
  FOR ALL USING (auth.role() = 'service_role');

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_alerts_updated_at
  BEFORE UPDATE ON user_alerts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_predictions_updated_at
  BEFORE UPDATE ON predictions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_value_bets_updated_at
  BEFORE UPDATE ON value_bets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Clean up expired analytics cache
CREATE OR REPLACE FUNCTION cleanup_expired_analytics_cache()
RETURNS void AS $$
BEGIN
  DELETE FROM analytics_cache WHERE expires_at < NOW();
END;
$$ language 'plpgsql';

-- Create a function to clean up cache (can be called periodically)
COMMENT ON FUNCTION cleanup_expired_analytics_cache() IS 'Removes expired entries from analytics_cache table';
