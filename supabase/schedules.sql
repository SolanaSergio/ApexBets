-- Supabase Scheduler Configuration
-- This sets up automatic data sync every 5 minutes

-- Enable the pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Create a function to call the Edge Function
CREATE OR REPLACE FUNCTION trigger_sports_sync()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  response text;
  url text;
  headers jsonb;
BEGIN
  -- Get the project URL and anon key
  url := current_setting('app.settings.supabase_url', true) || '/functions/v1/sync-sports-data';
  
  headers := jsonb_build_object(
    'Content-Type', 'application/json',
    'Authorization', 'Bearer ' || current_setting('app.settings.supabase_anon_key', true)
  );
  
  -- Make the HTTP request to the Edge Function
  SELECT content INTO response
  FROM http((
    'POST',
    url,
    headers,
    'application/json',
    '{"dataTypes": ["games", "teams", "players", "standings"]}'
  ));
  
  -- Log the response
  INSERT INTO sync_logs (triggered_at, response, success)
  VALUES (NOW(), response, response LIKE '%"success":true%');
  
EXCEPTION WHEN OTHERS THEN
  -- Log errors
  INSERT INTO sync_logs (triggered_at, response, success, error)
  VALUES (NOW(), 'Error: ' || SQLERRM, false, SQLERRM);
END;
$$;

-- Create a table to log sync attempts
CREATE TABLE IF NOT EXISTS sync_logs (
  id SERIAL PRIMARY KEY,
  triggered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  response TEXT,
  success BOOLEAN,
  error TEXT
);

-- Schedule the sync to run every 5 minutes
-- Note: This will only work if pg_cron is enabled and you have the proper permissions
SELECT cron.schedule(
  'sports-data-sync',
  '*/5 * * * *', -- Every 5 minutes
  'SELECT trigger_sports_sync();'
);

-- Alternative: Create a simpler version that just logs when it should run
-- (Use this if pg_cron is not available)
CREATE OR REPLACE FUNCTION log_sync_schedule()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO sync_logs (triggered_at, response, success)
  VALUES (NOW(), 'Scheduled sync trigger', true);
END;
$$;
