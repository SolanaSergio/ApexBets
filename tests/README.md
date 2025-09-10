# ApexBets Comprehensive Testing Suite

This directory contains a complete testing and verification system for ApexBets, ensuring full accuracy and functionality across all sports data with automatic database monitoring.

## 🚀 Quick Start

### Run Full Verification
```bash
node test-runner-comprehensive.js full
```

### Run Quick Test
```bash
node test-runner-comprehensive.js quick
```

### Start Continuous Monitoring
```bash
node test-runner-comprehensive.js monitor
```

### Run Data Accuracy Test
```bash
node test-runner-comprehensive.js accuracy
```

## 📁 Test Structure

### Core Testing Files
- `quick-verification-fixed.js` - **Main verification system** with real data validation
- `database-monitor.js` - **Automatic database monitoring** for live updates
- `test-runner-comprehensive.js` - **Comprehensive test runner** with multiple modes
- `verification-tracker.js` - **Centralized status tracking** system
- `cleanup-outdated.js` - **Cleanup script** for outdated files

### Test Categories
- `integration/` - API and service integration tests
- `e2e/` - End-to-end browser tests  
- `unit/` - Unit tests for individual components

## 🔍 Verification Features

### Real Data Validation
- **NO MOCK DATA OR PLACEHOLDERS** - All tests use real data only
- **Data freshness checks** - Ensures data is up-to-date
- **Multi-sport coverage** - Tests all sports (Basketball, Football, Baseball, Hockey, Soccer, Tennis, Golf)
- **Data integrity validation** - Checks for required properties and structure

### Database Monitoring
- **Automatic updates tracking** - Monitors database refresh cycles
- **Live data verification** - Ensures real-time updates are working
- **Data freshness alerts** - Warns when data becomes stale
- **Continuous monitoring** - Runs indefinitely to track system health

### Comprehensive Coverage
1. **API Endpoints** - All REST API endpoints with validation
2. **Data Sources** - External API connectivity (SportsDB, BallDontLie, Odds API, API-SPORTS)
3. **Database** - Connection, schema, and data integrity
4. **Sports Data** - Multi-sport data coverage and accuracy
5. **Live Data** - Real-time updates and live scores
6. **Player Stats** - Player statistics across all sports
7. **Team Stats** - Team performance, standings, and historical data

## 🎯 Test Modes

### Full Verification (`full`)
- Runs complete verification of all systems
- Tests all API endpoints with real data validation
- Verifies multi-sport data coverage
- Checks database health and updates
- Generates comprehensive report

### Quick Test (`quick`)
- Fast verification of critical systems
- Essential API endpoints only
- Basic data validation
- Quick feedback for development

### Continuous Monitoring (`monitor`)
- Runs indefinitely until stopped (Ctrl+C)
- Monitors database updates every 30 seconds
- Tracks data freshness across all sources
- Real-time alerts for issues

### Data Accuracy Test (`accuracy`)
- Focuses on data accuracy and real data validation
- Extra validation for placeholder/mock data detection
- Comprehensive data freshness checks
- Detailed accuracy reporting

## 📊 Verification Tracker

The verification tracker maintains comprehensive status of all tests:

### Status Types
- **Working** ✅ - Test passed, system functioning
- **Broken** ❌ - Test failed, system has issues  
- **Partial** ⚠️ - Some functionality working, some issues
- **Unknown** ❓ - Never tested or status unclear

### Tracking Features
- **Prevents redundant testing** - Skips tests that recently passed
- **Maintains history** - Tracks when tests were last run
- **Error tracking** - Records detailed error messages
- **Performance metrics** - Tracks response times and data counts

## 📈 Reports and Monitoring

### Automatic Reports
- `verification-status.json` - Current status of all systems
- `verification-report.json` - Detailed test reports with timestamps
- **Real-time monitoring** - Live status updates during testing

### Monitoring Features
- **Data freshness tracking** - Monitors when data was last updated
- **Update frequency analysis** - Tracks how often data refreshes
- **Performance monitoring** - Response times and throughput
- **Error rate tracking** - Monitors failure rates and patterns

## 🔧 Environment Setup

### Required Environment Variables
```bash
# Database
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Sports APIs
NEXT_PUBLIC_BALLDONTLIE_API_KEY=your_balldontlie_api_key
NEXT_PUBLIC_RAPIDAPI_KEY=your_rapidapi_key
NEXT_PUBLIC_ODDS_API_KEY=your_odds_api_key
NEXT_PUBLIC_SPORTSDB_API_KEY=123  # Free tier

# App Configuration
NEXT_PUBLIC_API_URL=/api
NEXT_PUBLIC_APP_NAME=ApexBets
```

### Development Server
Make sure your development server is running:
```bash
npm run dev
```

## 🚨 Troubleshooting

### Common Issues
1. **API Key Errors** - Check environment variables are set correctly
2. **Database Connection** - Ensure Supabase is configured and accessible
3. **Data Freshness** - Check if external APIs are responding
4. **Rate Limiting** - Some APIs have rate limits, tests include delays

### Debug Mode
Run with detailed logging:
```bash
DEBUG=true node test-runner-comprehensive.js full
```

### Cleanup
Remove outdated test files:
```bash
node cleanup-outdated.js
```

## 📋 Test Checklist

- [ ] All API endpoints responding
- [ ] Real data validation passing
- [ ] Multi-sport coverage working
- [ ] Database updates functioning
- [ ] Live data refreshing
- [ ] No placeholder/mock data
- [ ] All external APIs connected
- [ ] Performance within acceptable limits

## 🎉 Success Criteria

A successful verification run should show:
- ✅ All critical API endpoints working
- ✅ Multi-sport data coverage (7+ sports)
- ✅ Database updates functioning
- ✅ Live data refreshing properly
- ✅ No mock data or placeholders detected
- ✅ All external data sources connected
- ✅ Performance metrics within acceptable ranges

## 🔄 Legacy Test Support

The system also supports the original Jest-based tests:

```bash
# Run Jest tests
pnpm test

# Run specific test types
pnpm test:unit
pnpm test:integration
pnpm test:e2e
```

## 📚 Additional Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Playwright Documentation](https://playwright.dev/docs/intro)
- [Testing Library Documentation](https://testing-library.com/docs/)