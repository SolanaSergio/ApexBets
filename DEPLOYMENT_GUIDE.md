# Production Deployment Guide - Vercel + Supabase

## Overview
This setup uses the industry-standard pattern for serverless data ingestion:
- **Vercel**: Frontend + API routes (UI only)
- **Supabase Edge Functions**: Data fetching and database updates
- **Supabase Scheduler**: Automatic triggering of data sync

## Architecture

```
Vercel Cron (every 5 min) 
    ↓
Vercel API Route (/api/cron/sync)
    ↓
Supabase Edge Function (sync-sports-data)
    ↓
Sports APIs (Basketball, Football, etc.)
    ↓
Supabase Database (Direct writes)
```

## Setup Steps

### 1. Deploy Supabase Edge Function

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref YOUR_PROJECT_REF

# Deploy the Edge Function
supabase functions deploy sync-sports-data
```

### 2. Set Environment Variables

#### In Supabase Dashboard (Edge Function secrets):
- `BASKETBALL_API_KEY` - Your basketball API key
- `FOOTBALL_API_KEY` - Your football API key  
- `BASEBALL_API_KEY` - Your baseball API key
- `SOCCER_API_KEY` - Your soccer API key
- `HOCKEY_API_KEY` - Your hockey API key

#### In Vercel Dashboard:
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anon key
- `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key (for Edge Function)
- `CRON_SECRET` - Optional secret for manual cron triggers

### 3. Set Up Database Scheduler (Optional)

Run this SQL in your Supabase SQL editor:

```sql
-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Create sync logs table
CREATE TABLE IF NOT EXISTS sync_logs (
  id SERIAL PRIMARY KEY,
  triggered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  response TEXT,
  success BOOLEAN,
  error TEXT
);

-- Schedule automatic sync every 5 minutes
SELECT cron.schedule(
  'sports-data-sync',
  '*/5 * * * *',
  'SELECT trigger_sports_sync();'
);
```

### 4. Deploy to Vercel

```bash
# Deploy to Vercel
vercel --prod
```

## How It Works

### Automatic Data Sync
1. **Vercel Cron** triggers every 5 minutes
2. **Vercel API Route** (`/api/cron/sync`) receives the trigger
3. **API Route** calls **Supabase Edge Function** (`sync-sports-data`)
4. **Edge Function** fetches data from sports APIs
5. **Edge Function** writes directly to Supabase database
6. **Database** is automatically updated with fresh data

### Manual Triggers
You can also trigger syncs manually:

```bash
# Via Vercel API
curl -X GET "https://your-app.vercel.app/api/cron/sync" \
  -H "Authorization: Bearer YOUR_CRON_SECRET"

# Via Supabase Edge Function directly
curl -X POST "https://YOUR_PROJECT_REF.supabase.co/functions/v1/sync-sports-data" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"sport": "basketball", "dataTypes": ["games", "teams"]}'
```

## Benefits of This Architecture

✅ **Production Standard**: Industry best practice for serverless data ingestion  
✅ **Reliable**: Supabase Edge Functions are more reliable than Vercel for background tasks  
✅ **Scalable**: Automatic scaling without server management  
✅ **Cost Effective**: Pay only for what you use  
✅ **Secure**: Direct database access without exposing credentials  
✅ **Maintainable**: Clear separation of concerns  

## Monitoring

### Check Sync Status
```sql
-- View recent sync attempts
SELECT * FROM sync_logs 
ORDER BY triggered_at DESC 
LIMIT 10;

-- Check sync success rate
SELECT 
  DATE(triggered_at) as date,
  COUNT(*) as total_attempts,
  SUM(CASE WHEN success THEN 1 ELSE 0 END) as successful_syncs,
  ROUND(SUM(CASE WHEN success THEN 1 ELSE 0 END)::float / COUNT(*) * 100, 2) as success_rate
FROM sync_logs 
WHERE triggered_at > NOW() - INTERVAL '7 days'
GROUP BY DATE(triggered_at)
ORDER BY date DESC;
```

### Edge Function Logs
Check Supabase Dashboard → Edge Functions → sync-sports-data → Logs

### Vercel Logs
Check Vercel Dashboard → Functions → /api/cron/sync

## Troubleshooting

### Common Issues

1. **Edge Function not found**
   - Ensure the function is deployed: `supabase functions deploy sync-sports-data`
   - Check the function name matches exactly

2. **API keys not working**
   - Verify environment variables are set in Supabase Dashboard
   - Check API key permissions and rate limits

3. **Database writes failing**
   - Ensure service role key has proper permissions
   - Check database schema matches the Edge Function expectations

4. **Cron not triggering**
   - Verify Vercel cron configuration in `vercel.json`
   - Check Vercel function logs for errors

### Testing Locally

```bash
# Test Edge Function locally
supabase functions serve sync-sports-data

# Test with curl
curl -X POST "http://localhost:54321/functions/v1/sync-sports-data" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"sport": "basketball"}'
```

## Environment Variables Reference

| Variable | Required | Location | Description |
|----------|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Vercel | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Vercel | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase | For Edge Function DB access |
| `BASKETBALL_API_KEY` | Yes | Supabase | Basketball API key |
| `FOOTBALL_API_KEY` | Yes | Supabase | Football API key |
| `BASEBALL_API_KEY` | Yes | Supabase | Baseball API key |
| `SOCCER_API_KEY` | Yes | Supabase | Soccer API key |
| `HOCKEY_API_KEY` | Yes | Supabase | Hockey API key |
| `CRON_SECRET` | No | Vercel | Optional manual trigger secret |

## Next Steps

1. Deploy the Edge Function to Supabase
2. Set all environment variables
3. Deploy to Vercel
4. Monitor the first few sync cycles
5. Adjust API rate limits and sync frequency as needed

This setup provides automatic, reliable data updates without the complexity of managing background workers in production.
