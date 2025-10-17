
-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Create a function to invoke the cron-jobs Edge Function
CREATE OR REPLACE FUNCTION invoke_cron_jobs() RETURNS void AS $$
BEGIN
  PERFORM net.http_post(
    url := 'https://<YOUR-PROJECT-REF>.supabase.co/functions/v1/cron-jobs',
    headers := '{"Content-Type": "application/json"}'::jsonb
  );
END;
$$ LANGUAGE plpgsql;

-- Schedule the function to run every hour
SELECT cron.schedule('hourly-cron', '0 * * * *', 'SELECT invoke_cron_jobs();');
