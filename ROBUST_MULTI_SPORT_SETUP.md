# ApexBets Robust Multi-Sport Setup Guide

## 🎯 Overview
This guide will help you set up a robust, multi-sport ApexBets website with automatic data updates and live data access for all 7 supported sports.

## 🏆 Supported Sports
- **Basketball** (NBA, WNBA, NCAA)
- **Football** (NFL, NCAA)
- **Baseball** (MLB)
- **Hockey** (NHL)
- **Soccer** (MLS, Premier League, La Liga, Bundesliga)
- **Tennis** (ATP, WTA)
- **Golf** (PGA, LPGA)

## 🚀 Quick Start

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Set Up Environment
```bash
# Copy environment template
cp env.example .env.local

# Edit .env.local with your actual API keys
# Required: Supabase URL and keys
# Optional: Sports API keys for enhanced data
```

### Step 3: Run Complete Setup
```bash
# This will set up everything automatically
npm run setup:multi-sport
```

### Step 4: Start Services
```bash
# Start the main website
npm run dev

# In a new terminal, start live data service
npm run start:live-data

# In another terminal, start automatic updates
npm run start:updates
```

## 📋 Detailed Setup Steps

### 1. Environment Configuration

Edit your `.env.local` file with these required variables:

```env
# Database (Required)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Sports APIs (Optional but recommended)
NEXT_PUBLIC_RAPIDAPI_KEY=your_rapidapi_key
NEXT_PUBLIC_ODDS_API_KEY=your_odds_api_key
NEXT_PUBLIC_SPORTSDB_API_KEY=123

# App Configuration
NEXT_PUBLIC_API_URL=/api
NEXT_PUBLIC_APP_NAME=ApexBets
NEXT_PUBLIC_APP_VERSION=1.0.0

# Feature Flags
NEXT_PUBLIC_ENABLE_LIVE_UPDATES=true
NEXT_PUBLIC_ENABLE_VALUE_BETTING=true
NEXT_PUBLIC_ENABLE_ML_PREDICTIONS=true
```

### 2. Database Setup

1. **Create Supabase Project:**
   - Go to [supabase.com](https://supabase.com)
   - Create a new project
   - Get your project URL and keys

2. **Run Database Schema:**
   ```bash
   npm run setup:database
   ```
   - Copy the SQL from the output
   - Paste it in your Supabase SQL Editor
   - Click "Run"

3. **Populate with Data:**
   ```bash
   npm run populate:data
   ```

### 3. Start All Services

#### Main Website (Port 3000)
```bash
npm run dev
```

#### Live Data Service (Port 3001)
```bash
npm run start:live-data
```

#### Automatic Updates (Background)
```bash
npm run start:updates
```

## 🔄 Automatic Data Updates

The system automatically updates data every 15 minutes:

- **Sports Data**: Games, scores, status updates
- **Predictions**: New predictions for upcoming games
- **Odds**: Updated betting odds
- **Analytics**: Real-time statistics

### Update Schedule:
- **Sports Data**: Every 15 minutes
- **Predictions**: Every hour
- **Odds**: Every 30 minutes

## 🌐 Live Data Access

Access live data through these endpoints:

### Main Website APIs
- `http://localhost:3000/api/games` - All games
- `http://localhost:3000/api/teams` - All teams
- `http://localhost:3000/api/predictions` - All predictions
- `http://localhost:3000/api/analytics/stats` - Analytics

### Live Data Service APIs
- `http://localhost:3001/api/live/games` - Live games data
- `http://localhost:3001/api/live/teams` - Live teams data
- `http://localhost:3001/api/live/predictions` - Live predictions
- `http://localhost:3001/api/live/odds` - Live odds data
- `http://localhost:3001/api/live/analytics` - Live analytics

### Query Parameters:
- `sport=basketball` - Filter by sport
- `status=live` - Filter by status
- `limit=50` - Limit results
- `timeRange=7d` - Time range for analytics

## 🧪 Testing & Verification

### Test Everything is Working
```bash
# Test multi-sport robustness
npm run test:robustness

# Test for mock data
npm run test:mock-data

# Test API health
npm run health
```

### Manual Testing
1. **Visit the website**: `http://localhost:3000`
2. **Test all sports**: Switch between different sports
3. **Check live data**: Verify real-time updates
4. **Test analytics**: Check that calculations are correct

## 📊 Data Structure

### Teams Table
- Multi-sport support
- League and conference information
- Logo URLs and team details

### Games Table
- Sport-specific game data
- Real-time status updates
- Score tracking

### Predictions Table
- AI-generated predictions
- Confidence scores
- Accuracy tracking

### Odds Table
- Real-time betting odds
- Multiple bookmakers
- Value betting opportunities

## 🔧 Troubleshooting

### Common Issues

#### Database Connection Failed
- Check your Supabase credentials
- Ensure your project is active
- Verify the URL format

#### No Data Showing
- Run `npm run populate:data`
- Check if services are running
- Verify database has data

#### Live Updates Not Working
- Start the live data service: `npm run start:live-data`
- Start automatic updates: `npm run start:updates`
- Check console for errors

#### API Errors
- Check your API keys
- Verify rate limits
- Check network connectivity

### Debug Commands
```bash
# Check service status
pm2 status

# View logs
pm2 logs apexbets-updates

# Restart services
pm2 restart apexbets-updates
```

## 🎯 Production Deployment

### 1. Build the Project
```bash
npm run build
```

### 2. Deploy to Vercel
1. Push your code to GitHub
2. Connect to Vercel
3. Deploy automatically

### 3. Set Up Production Services
- Use PM2 for process management
- Set up monitoring
- Configure backups

## 📈 Performance Optimization

### Database Optimization
- Indexes on frequently queried columns
- Connection pooling
- Query optimization

### API Optimization
- Response caching
- Rate limiting
- Error handling

### Frontend Optimization
- Image optimization
- Code splitting
- Lazy loading

## 🔒 Security Considerations

### API Security
- Rate limiting
- Input validation
- Error handling

### Data Security
- Environment variables
- Database security
- API key protection

## 📞 Support

If you encounter any issues:

1. **Check the logs**: Look for error messages
2. **Run tests**: Use the test scripts to identify issues
3. **Verify setup**: Ensure all services are running
4. **Check data**: Verify database has data

## 🎉 Success!

When everything is working, you'll have:

- ✅ **Multi-sport support** for 7 sports
- ✅ **Real-time data updates** every 15 minutes
- ✅ **Live data access** through APIs
- ✅ **Automatic predictions** and analytics
- ✅ **Value betting opportunities**
- ✅ **Mobile-responsive design**
- ✅ **Production-ready deployment**

Your ApexBets website is now a robust, professional sports betting platform that can handle any sport and scale to thousands of users!
