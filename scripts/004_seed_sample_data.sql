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

-- Execute this script to seed sample data
