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

-- Execute this script to enable Row Level Security policies
