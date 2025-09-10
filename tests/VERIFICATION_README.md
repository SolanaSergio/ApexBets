# ApexBets Verification System

This directory contains a comprehensive verification system for ApexBets that tracks what works and what doesn't, avoiding repeat testing and maintaining centralized status.

## Overview

The verification system consists of several components:

1. **VerificationTracker** - Centralized tracking of test status
2. **Comprehensive Verification Tests** - Full system testing
3. **Quick Verification** - Fast critical functionality check
4. **Report Generation** - Detailed status reports

## Files

### Core Components

- `verification-tracker.js` - Central tracking system
- `quick-verification.js` - Fast verification script
- `generate-verification-report.js` - Report generator
- `verification/comprehensive-verification.test.js` - Full test suite

### Status Files

- `verification-status.json` - Current status tracking
- `verification-report.json` - Latest verification report
- `reports/` - Historical reports directory

## Usage

### Quick Verification

Run a fast check of critical functionality:

```bash
# Using npm script
npm run verify

# Or directly
node tests/quick-verification.js
```

### Full Verification

Run comprehensive verification tests:

```bash
# Using npm script
npm run verify:full

# Or using test runner
npm run test:verification
```

### Check Status

View current verification status:

```bash
# Using npm script
npm run verify:status

# Or directly
node tests/verification-tracker.js status
```

### Generate Report

Create detailed verification report:

```bash
# Using npm script
npm run verify:report

# Or directly
node tests/generate-verification-report.js
```

## Verification Categories

### 1. API Endpoints
- Health Check
- Games
- Teams
- Live Scores
- Odds
- Predictions
- Analytics
- Standings
- Value Bets

### 2. Data Sources
- SportsDB API
- BallDontLie API
- Odds API (if configured)
- API-SPORTS (if configured)

### 3. Database
- Connection
- Schema
- Data Integrity
- Live Updates

### 4. Sports Data
- Basketball
- Football
- Baseball
- Hockey
- Soccer
- Tennis
- Golf

### 5. Live Data
- Real-time Updates
- Live Scores
- Live Odds
- Live Predictions

### 6. Player Statistics
- Basketball
- Football
- Baseball
- Hockey
- Soccer

### 7. Team Statistics
- Standings
- Performance
- Historical

## Status Tracking

The system tracks three statuses for each test:

- **Working** ✅ - Test passes consistently
- **Broken** ❌ - Test fails or has issues
- **Unknown** ❓ - Test hasn't been run recently

## Smart Testing

The verification system includes smart testing features:

- **Avoids Repeat Testing** - Won't retest working components within 24 hours
- **Prioritizes Broken Tests** - Always retests broken components
- **Tracks Dependencies** - Understands which tests depend on others
- **Maintains History** - Keeps track of when tests were last run

## Reports

### Status Report
Shows current status of all components with last test times.

### Verification Report
Detailed report with:
- Executive summary
- Category breakdown
- Working/broken/unknown components
- Issues found
- Recommendations
- Next steps

### JSON Report
Machine-readable report for integration with other tools.

## Configuration

The verification system respects environment variables:

- `NEXT_PUBLIC_API_URL` - API base URL (default: http://localhost:3000)
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anon key
- `ODDS_API_KEY` - Odds API key (optional)
- `NEXT_PUBLIC_RAPIDAPI_KEY` - RapidAPI key (optional)

## Integration

The verification system integrates with:

- Jest test framework
- Playwright for E2E tests
- Supabase for database testing
- External APIs for data source testing

## Best Practices

1. **Run Quick Verification First** - Use `npm run verify` for fast checks
2. **Check Status Regularly** - Use `npm run verify:status` to see current state
3. **Generate Reports** - Use `npm run verify:report` for detailed analysis
4. **Fix Broken Components** - Address broken tests immediately
5. **Monitor Unknown Components** - Test unknown components to determine status

## Troubleshooting

### Common Issues

1. **API Endpoints Not Working**
   - Check if dev server is running
   - Verify environment variables
   - Check network connectivity

2. **Database Connection Issues**
   - Verify Supabase credentials
   - Check database schema
   - Ensure tables exist

3. **External API Issues**
   - Check API keys
   - Verify rate limits
   - Check API availability

4. **Test Failures**
   - Check error messages in reports
   - Verify data availability
   - Check API responses

### Getting Help

1. Check the verification status: `npm run verify:status`
2. Run quick verification: `npm run verify`
3. Generate detailed report: `npm run verify:report`
4. Check the generated reports in `tests/reports/`

## Maintenance

The verification system is self-maintaining:

- Automatically tracks test results
- Updates status based on test outcomes
- Generates reports with timestamps
- Maintains historical data

Regular maintenance tasks:

1. Review verification reports weekly
2. Fix broken components promptly
3. Update test configurations as needed
4. Monitor API rate limits and quotas
5. Check database performance

## Contributing

When adding new tests:

1. Add test to appropriate category in `verification-tracker.js`
2. Implement test in `comprehensive-verification.test.js`
3. Update documentation
4. Test the new verification

When fixing issues:

1. Update the verification tracker with fixes
2. Re-run verification tests
3. Update documentation if needed
4. Generate new reports
