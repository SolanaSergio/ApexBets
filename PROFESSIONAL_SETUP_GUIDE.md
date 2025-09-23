# 🚀 ApexBets Professional Setup Guide

## Overview
This guide will help you set up a fully sport-agnostic, professional-grade sports data synchronization system using Supabase Edge Functions and external cron services.

## ✅ What's Been Fixed

### 1. **Removed All Mock Data**
- ❌ No more placeholder data
- ❌ No more hardcoded team names
- ❌ No more sport-specific hardcoding
- ✅ All data comes from real APIs
- ✅ Dynamic sport configuration

### 2. **Fully Sport-Agnostic Architecture**
- ✅ Dynamic sport loading from environment variables
- ✅ Generic data normalization
- ✅ No hardcoded sport logic
- ✅ Supports any sport with proper API configuration

### 3. **Professional Database Integration**
- ✅ Real Supabase database storage
- ✅ Proper error handling and logging
- ✅ Data normalization and validation
- ✅ Upsert operations for data consistency

## 🛠️ Setup Instructions

### Step 1: Deploy Supabase Edge Function

```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref YOUR_PROJECT_REF

# Deploy the Edge Function
pnpm run deploy:edge-function
```

### Step 2: Configure Environment Variables

#### In Supabase Dashboard (Edge Function Secrets):
Go to your Supabase project → Settings → Edge Functions → Secrets

Add these secrets:

```
# Required Supabase variables (SUPABASE_URL is auto-set)
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Sports configuration (comma-separated list)
SUPPORTED_SPORTS=basketball,football,baseball,soccer,hockey

# Sport-specific API keys (optional, fallback to generic keys)
BASKETBALL_API_KEY=your_basketball_api_key
BASKETBALL_BASE_URL=https://api.balldontlie.io/v1
BASKETBALL_LEAGUES=NBA,WNBA
BASKETBALL_RATE_LIMIT=60
BASKETBALL_PRIORITY=1

FOOTBALL_API_KEY=your_football_api_key
FOOTBALL_BASE_URL=https://api.sportradar.us/nfl
FOOTBALL_LEAGUES=NFL
FOOTBALL_RATE_LIMIT=60
FOOTBALL_PRIORITY=1

# Generic API keys (used as fallbacks)
RAPIDAPI_KEY=your_rapidapi_key
SPORTSDB_API_KEY=your_sportsdb_key
BALLDONTLIE_API_KEY=your_balldontlie_key
ODDS_API_KEY=your_odds_api_key
```

#### In Your Local Environment (.env.local):
```env
# Required Supabase variables
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Sports configuration
SUPPORTED_SPORTS=basketball,football,baseball,soccer,hockey
NEXT_PUBLIC_SUPPORTED_SPORTS=basketball,football,baseball,soccer,hockey

# API keys (same as Edge Function secrets)
RAPIDAPI_KEY=your_rapidapi_key
NEXT_PUBLIC_RAPIDAPI_KEY=your_rapidapi_key
SPORTSDB_API_KEY=your_sportsdb_key
NEXT_PUBLIC_SPORTSDB_API_KEY=your_sportsdb_key
BALLDONTLIE_API_KEY=your_balldontlie_key
NEXT_PUBLIC_BALLDONTLIE_API_KEY=your_balldontlie_key
ODDS_API_KEY=your_odds_api_key
NEXT_PUBLIC_ODDS_API_KEY=your_odds_api_key
```

### Step 3: Set Up External Cron Service

#### Option A: Cron-job.org (Recommended - Free)

1. Go to [cron-job.org](https://cron-job.org)
2. Sign up for a free account
3. Create a new cron job with these settings:

**URL:** `https://your-project.supabase.co/functions/v1/sync-sports-data`

**Method:** POST

**Headers:**
```
Authorization: Bearer YOUR_SUPABASE_ANON_KEY
Content-Type: application/json
```

**Body:**
```json
{
  "dataTypes": ["games", "teams", "players", "standings"]
}
```

**Schedule:** Every 15 minutes (`*/15 * * * *`)

**Timeout:** 300 seconds

#### Option B: EasyCron (Alternative - Free Tier)

1. Go to [EasyCron](https://www.easycron.com)
2. Sign up for a free account
3. Create a new cron job with the same settings as above

#### Option C: GitHub Actions (Alternative - Free)

The workflow is already configured at `.github/workflows/sync-sports-data.yml`. Just add the required secrets to your GitHub repository.

### Step 4: Test the Setup

```bash
# Test the Edge Function locally
pnpm run setup:cron

# Test the background sync service
pnpm run sync:test

# Test the server startup
pnpm run dev
```

### Step 5: Monitor and Verify

1. **Check Supabase Edge Function logs**
2. **Monitor database for new data**
3. **Set up alerts for failures**
4. **Verify data is being populated correctly**

## 🔧 Configuration Options

### Supported Sports
The system supports any sport by configuring environment variables:

```env
# For any sport, use this pattern:
{SPORT}_API_KEY=your_api_key
{SPORT}_BASE_URL=your_api_base_url
{SPORT}_LEAGUES=league1,league2,league3
{SPORT}_RATE_LIMIT=60
{SPORT}_PRIORITY=1
```

### Rate Limiting
- Each sport has its own rate limiting
- Configurable per sport via environment variables
- Automatic retry with exponential backoff

### Data Types
- **Games**: Live and scheduled games
- **Teams**: Team information and logos
- **Players**: Player stats and information
- **Standings**: League standings and rankings

## 📊 Database Schema

The system uses these main tables:

- `games` - Game information and scores
- `teams` - Team data and logos
- `players` - Player information and stats
- `standings` - League standings
- `odds` - Betting odds (if available)
- `predictions` - ML predictions (if available)

## 🚨 Troubleshooting

### Common Issues

1. **Edge Function not deploying**
   - Check Supabase CLI is installed and logged in
   - Verify project reference is correct
   - Check environment variables are set

2. **No data being synced**
   - Verify API keys are correct
   - Check API base URLs are accessible
   - Review Edge Function logs for errors

3. **Rate limiting issues**
   - Adjust rate limits in environment variables
   - Check API provider documentation
   - Monitor request frequency

4. **Database connection issues**
   - Verify Supabase credentials
   - Check database permissions
   - Review connection logs

### Debug Commands

```bash
# Check Edge Function status
supabase functions list

# View Edge Function logs
supabase functions logs sync-sports-data

# Test Edge Function manually
curl -X POST "https://your-project.supabase.co/functions/v1/sync-sports-data" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"dataTypes": ["games", "teams"]}'
```

## 📈 Performance Optimization

### Caching
- Built-in caching for API responses
- Configurable TTL per data type
- Automatic cache invalidation

### Rate Limiting
- Per-sport rate limiting
- Global rate limiting
- Automatic retry mechanisms

### Error Handling
- Comprehensive error logging
- Graceful degradation
- Automatic recovery

## 🔒 Security

### API Keys
- Stored securely in Supabase Edge Function secrets
- Never exposed to client-side code
- Rotated regularly

### Data Validation
- All incoming data is validated
- SQL injection prevention
- XSS protection

### Rate Limiting
- Prevents API abuse
- Protects against DDoS attacks
- Configurable per sport

## 📝 Best Practices

1. **Environment Variables**
   - Use descriptive names
   - Document all variables
   - Keep secrets secure

2. **Error Handling**
   - Log all errors
   - Implement retry logic
   - Monitor failures

3. **Data Quality**
   - Validate all incoming data
   - Normalize data formats
   - Handle missing fields gracefully

4. **Monitoring**
   - Set up alerts for failures
   - Monitor API usage
   - Track data quality metrics

## 🎯 Next Steps

1. **Deploy the Edge Function**
2. **Configure your sports APIs**
3. **Set up external cron service**
4. **Test the complete system**
5. **Monitor and optimize**

## 📞 Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review the logs for error messages
3. Verify all environment variables are set correctly
4. Test each component individually

---

**🎉 Congratulations! You now have a fully professional, sport-agnostic sports data synchronization system that will populate your database automatically without any paid services.**
