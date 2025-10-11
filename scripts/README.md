# ApexBets Scripts

This directory contains all the scripts for ApexBets, organized by function.

## Directory Structure

```
scripts/
├── data-services/          # Data management and API integration
│   ├── apex-data-manager.js    # Main data management system
│   ├── auto-update-service.js  # Legacy auto-update service
│   ├── live-data-service.js    # Live data API endpoints
│   └── populate-real-sports-data.js  # Legacy data population
├── database/               # Database utilities and setup
│   ├── data_cleaner.py         # Python data cleaning utilities
│   ├── database_utils.py       # Database helper functions
│   └── setup_database.py       # Database setup script
├── ml-services/            # Machine learning and predictions
│   ├── feature_engineering.py  # Feature engineering
│   ├── model_trainer.py        # Model training
│   ├── prediction_generator.py # Prediction generation
│   ├── prediction_models.py    # ML models
│   └── requirements.txt        # Python dependencies
├── scrapers/               # Web scraping utilities
│   ├── nba_scraper.py          # NBA data scraper
│   ├── odds_scraper.py         # Odds data scraper
│   ├── run_scraper.sh          # Scraper runner script
│   └── scrape_scheduler.py     # Scraper scheduler
├── setup/                  # Setup and configuration scripts
│   ├── setup-complete.js       # Complete setup script
│   ├── setup-database-multi-sport.js  # Multi-sport database setup
│   └── setup-environment.js    # Environment configuration
├── sql-scripts/            # Database schema and migrations
│   ├── 001_create_core_tables.sql
│   ├── 002_enable_rls.sql
│   ├── 003_create_profile_trigger.sql
│   ├── 005_create_missing_tables.sql
│   ├── 006_multi_sport_schema.sql
│   └── 007_fix_schema_columns.sql
├── start-data-manager.js   # Main startup script
└── requirements.txt        # Node.js dependencies
```

## Quick Start

1. **Start the data manager:**

   ```bash
   node start-data-manager.js
   ```

2. **Set up environment:**

   ```bash
   node setup/setup-environment.js
   ```

3. **Set up database:**
   ```bash
   node setup/setup-database-multi-sport.js
   ```

## Main Components

### ApexDataManager

The main data management system that:

- Automatically populates real data from multiple APIs
- Removes all mock data and placeholders
- Validates and cleans up data
- Updates data every 15 minutes
- Supports all major sports (basketball, football, baseball, hockey, soccer)

### Data Services

- **apex-data-manager.js**: Main comprehensive data management
- **live-data-service.js**: Express.js API for frontend components
- **auto-update-service.js**: Legacy auto-update system

### Database

- **sql-scripts/**: All database schema and migration files
- **database/**: Python utilities for data cleaning and setup

### ML Services

- **ml-services/**: Machine learning models and prediction generation
- **scrapers/**: Web scraping utilities for additional data sources

## Features

- ✅ **100% Real Data**: No mock data or placeholders
- ✅ **Multi-Sport Support**: Basketball, Football, Baseball, Hockey, Soccer
- ✅ **Automatic Updates**: Data updates every 15 minutes
- ✅ **Data Validation**: Automatic cleanup of invalid data
- ✅ **Rate Limiting**: Respects API rate limits
- ✅ **Error Recovery**: Automatic error handling and recovery
- ✅ **Mock Data Detection**: Automatically removes mock data

## API Keys Required

- `SPORTSDB_API_KEY`: TheSportsDB API key
- `RAPIDAPI_KEY`: RapidAPI key for additional sports data
- `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase service role key

## Monitoring

The data manager provides real-time monitoring:

- Data update status
- Error tracking
- Mock data detection
- Data quality validation
- API rate limit monitoring
