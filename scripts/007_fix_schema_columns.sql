-- Fix schema columns to match expected structure
-- This script adds missing columns and updates existing ones

-- Update predictions table to match expected structure
ALTER TABLE predictions ADD COLUMN IF NOT EXISTS prediction_type TEXT;
ALTER TABLE predictions ADD COLUMN IF NOT EXISTS predicted_value TEXT;
ALTER TABLE predictions ADD COLUMN IF NOT EXISTS confidence_score DECIMAL CHECK (confidence_score >= 0 AND confidence_score <= 1);
ALTER TABLE predictions ADD COLUMN IF NOT EXISTS model TEXT;
ALTER TABLE predictions ADD COLUMN IF NOT EXISTS sport TEXT DEFAULT 'basketball';
ALTER TABLE predictions ADD COLUMN IF NOT EXISTS league TEXT;
ALTER TABLE predictions ADD COLUMN IF NOT EXISTS reasoning TEXT;
ALTER TABLE predictions ADD COLUMN IF NOT EXISTS model_version TEXT;

-- Update odds table to match expected structure
ALTER TABLE odds ADD COLUMN IF NOT EXISTS market_type TEXT;
ALTER TABLE odds ADD COLUMN IF NOT EXISTS sport TEXT DEFAULT 'basketball';
ALTER TABLE odds ADD COLUMN IF NOT EXISTS league TEXT;
ALTER TABLE odds ADD COLUMN IF NOT EXISTS live_odds BOOLEAN DEFAULT FALSE;

-- Rename existing columns to match expected names
ALTER TABLE predictions RENAME COLUMN model_name TO model;
ALTER TABLE predictions RENAME COLUMN confidence TO confidence_score;

-- Update odds table column names
ALTER TABLE odds RENAME COLUMN odds_type TO market_type;

-- Add missing indexes
CREATE INDEX IF NOT EXISTS idx_predictions_sport ON predictions(sport);
CREATE INDEX IF NOT EXISTS idx_predictions_league ON predictions(league);
CREATE INDEX IF NOT EXISTS idx_odds_sport ON odds(sport);
CREATE INDEX IF NOT EXISTS idx_odds_league ON odds(league);
CREATE INDEX IF NOT EXISTS idx_odds_market_type ON odds(market_type);

-- Update existing data to have proper values
UPDATE predictions SET 
  prediction_type = 'moneyline',
  predicted_value = CASE 
    WHEN predicted_value::text = '1' THEN 'home'
    WHEN predicted_value::text = '0' THEN 'away'
    ELSE predicted_value::text
  END,
  model = COALESCE(model, 'random_forest_v1'),
  sport = COALESCE(sport, 'basketball'),
  league = COALESCE(league, 'NBA'),
  reasoning = COALESCE(reasoning, 'Based on historical performance and current form'),
  model_version = COALESCE(model_version, '1.0.0')
WHERE prediction_type IS NULL;

UPDATE odds SET 
  market_type = COALESCE(market_type, 'moneyline'),
  sport = COALESCE(sport, 'basketball'),
  league = COALESCE(league, 'NBA')
WHERE market_type IS NULL;

-- Execute this script to fix schema columns
