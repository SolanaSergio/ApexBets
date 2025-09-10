# Enhanced ApexBets Data Manager

## Overview

The Enhanced ApexBets Data Manager is a comprehensive, centralized system for managing all sports data operations. It provides real-time data population, historical data maintenance, automatic validation, and advanced monitoring capabilities.

## Key Features

### 🚀 **Dynamic Data Management**
- **Real-time Updates**: Live data synchronization every 5 minutes
- **Historical Data**: Comprehensive historical data fetching (up to 1 year for basketball)
- **Multi-Sport Support**: Basketball, Football, Baseball, Hockey, Soccer
- **No Mock Data**: Everything is fully dynamic and real

### 🔧 **Advanced API Management**
- **Priority-Based Fallback**: APIs sorted by priority and reliability
- **Rate Limiting**: Intelligent rate limiting to prevent API blocking
- **Error Recovery**: Automatic API failure recovery and retry logic
- **Performance Monitoring**: Real-time API performance tracking

### 📊 **Data Integrity & Validation**
- **Automatic Validation**: Continuous data integrity checks
- **Error Detection**: Identifies and fixes common data issues
- **Smart Data Cleanup**: Removes only truly invalid data (orphaned records, null values)
- **Real Data Preservation**: All legitimate data from APIs is preserved

### ⚡ **Performance Optimization**
- **Caching System**: Intelligent caching to reduce API calls
- **Query Optimization**: Database query optimization
- **Memory Management**: Automatic cache cleanup and memory optimization
- **Performance Metrics**: Comprehensive performance tracking

### 🔍 **Monitoring & Health Checks**
- **Real-time Monitoring**: Live system health monitoring
- **Status Reports**: Detailed status and performance reports
- **Error Logging**: Comprehensive error logging and tracking
- **Dashboard Data**: Real-time dashboard data for monitoring

## API Configuration

### Supported APIs
1. **SportsDB** (Priority 1, Reliability 95%)
   - Primary API for most sports data
   - Free tier with good coverage
   - Rate limit: 1.5 seconds between requests

2. **BallDontLie** (Priority 2, Reliability 90%)
   - Specialized for NBA basketball data
   - High-quality NBA-specific data
   - Rate limit: 10 seconds between requests

3. **RapidAPI** (Priority 3, Reliability 85%)
   - Multi-sport coverage
   - Premium API with extensive data
   - Rate limit: 1.5 seconds between requests

4. **Odds API** (Priority 4, Reliability 88%)
   - Specialized for betting odds
   - Real-time odds data
   - Rate limit: 5 seconds between requests

### API Fallback Strategy
- APIs are tried in priority order
- If primary API fails, automatically tries next available API
- Critical APIs (priority ≤ 2) get recovery attempts
- Performance metrics track API reliability

## Data Types Supported

### Teams
- **Required**: name, sport, league
- **Optional**: city, abbreviation, logo_url, conference, division
- **Validation**: Name format, required fields, data types

### Games
- **Required**: home_team_id, away_team_id, sport, league
- **Optional**: home_score, away_score, venue, status, game_date
- **Validation**: Team matching, score validation, date formats

### Player Stats
- **Required**: player_name, team_id, sport
- **Optional**: points, rebounds, assists, position
- **Validation**: Name format, team association, stat ranges

## Scheduling

### Automated Tasks
- **Real-time Updates**: Every 5 minutes (live games)
- **Data Updates**: Every 15 minutes (all sports)
- **Data Cleanup**: Every hour (invalid/orphaned data only)
- **Data Validation**: Every 2 hours
- **Performance Optimization**: Every 6 hours
- **Health Checks**: Every 10 minutes

## Command Line Interface

### Available Commands
```bash
# Start the data manager
node apex-data-manager.js start

# Stop the data manager
node apex-data-manager.js stop

# Check status and performance
node apex-data-manager.js status

# Refresh data (all sports or specific sport)
node apex-data-manager.js refresh
node apex-data-manager.js refresh basketball

# Run data validation
node apex-data-manager.js validate

# Run performance optimization
node apex-data-manager.js optimize

# Emergency stop with cleanup
node apex-data-manager.js emergency-stop

# Show help
node apex-data-manager.js help
```

## Historical Data

### Data Retention
- **Basketball**: 365 days (1 year)
- **Football**: 180 days (6 months)
- **Baseball**: 180 days (6 months)
- **Hockey**: 180 days (6 months)
- **Soccer**: 90 days (3 months)

### Season Support
- **Basketball**: 2022-23, 2023-24, 2024-25
- **Football**: 2022-23, 2023-24, 2024-25
- **Baseball**: 2022, 2023, 2024
- **Hockey**: 2022-23, 2023-24, 2024-25
- **Soccer**: 2022-23, 2023-24, 2024-25

## Monitoring & Logging

### Log Files
- **Error Log**: `logs/error.log` - All errors with context
- **Health Status**: `logs/health.json` - System health metrics
- **Status Report**: `logs/status-report.json` - Comprehensive status

### Performance Metrics
- **Total Requests**: Count of all API requests
- **Success Rate**: Percentage of successful requests
- **Average Response Time**: Mean API response time
- **Data Issues Fixed**: Count of data integrity issues resolved

### Health Indicators
- **System Status**: Running/Stopped
- **Uptime**: Total system uptime
- **Error Count**: Current error count
- **API Status**: Health of each API
- **Data Integrity**: Current data quality status

## Error Handling

### Error Types
1. **API Errors**: Network, rate limiting, authentication
2. **Data Errors**: Validation failures, missing fields
3. **System Errors**: Database, file system, memory
4. **Recovery Errors**: Failed recovery attempts

### Error Recovery
- **Automatic Retry**: Failed requests are retried with backoff
- **API Switching**: Automatic fallback to alternative APIs
- **Data Repair**: Automatic fixing of common data issues
- **System Recovery**: Graceful handling of system failures

## Performance Optimization

### Caching Strategy
- **API Response Caching**: Reduces redundant API calls
- **Database Query Caching**: Optimizes database performance
- **Memory Management**: Automatic cleanup of old cache entries
- **Cache Invalidation**: Smart cache invalidation based on data age

### Database Optimization
- **Query Optimization**: Efficient database queries
- **Index Management**: Proper indexing for performance
- **Connection Pooling**: Efficient database connections
- **Batch Operations**: Bulk operations for better performance

## Security Features

### Data Validation
- **Input Sanitization**: All inputs are validated and sanitized
- **SQL Injection Prevention**: Parameterized queries
- **XSS Protection**: Output encoding and validation
- **Rate Limiting**: Prevents abuse and ensures fair usage

### Error Security
- **Sensitive Data Protection**: No sensitive data in logs
- **Error Message Sanitization**: Safe error messages
- **Stack Trace Filtering**: Limited stack trace information
- **Access Control**: Proper access controls for all operations

## Configuration

### Environment Variables
```bash
# Required
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Sports APIs (at least one required)
NEXT_PUBLIC_SPORTSDB_API_KEY=your_sportsdb_key
NEXT_PUBLIC_BALLDONTLIE_API_KEY=your_balldontlie_key
NEXT_PUBLIC_RAPIDAPI_KEY=your_rapidapi_key
NEXT_PUBLIC_ODDS_API_KEY=your_odds_api_key
```

### Customization
- **Rate Limits**: Adjustable per API
- **Update Frequencies**: Configurable update intervals
- **Data Retention**: Customizable historical data periods
- **Validation Rules**: Customizable data validation rules

## Troubleshooting

### Common Issues
1. **API Rate Limiting**: Check rate limit configurations
2. **Data Validation Errors**: Run validation and check logs
3. **Performance Issues**: Run optimization and check metrics
4. **Memory Issues**: Check cache size and cleanup frequency

### Debug Commands
```bash
# Check system status
node apex-data-manager.js status

# Validate data integrity
node apex-data-manager.js validate

# Optimize performance
node apex-data-manager.js optimize

# Check error logs
tail -f logs/error.log
```

## Best Practices

### Running in Production
1. **Monitor Performance**: Regular status checks
2. **Log Management**: Regular log rotation and cleanup
3. **Backup Strategy**: Regular database backups
4. **Error Monitoring**: Set up error alerting

### Development
1. **Test APIs**: Verify API configurations
2. **Validate Data**: Run validation before deployment
3. **Monitor Logs**: Check logs for issues
4. **Performance Testing**: Test under load

## Future Enhancements

### Planned Features
- **WebSocket Support**: Real-time data streaming
- **Machine Learning**: Predictive data analysis
- **Advanced Analytics**: Detailed performance analytics
- **API Health Dashboard**: Visual monitoring interface
- **Automated Scaling**: Dynamic resource allocation

### Integration Opportunities
- **Notification System**: Real-time alerts and notifications
- **External Monitoring**: Integration with monitoring services
- **Data Export**: Export capabilities for data analysis
- **API Gateway**: Centralized API management

## Support

### Getting Help
1. **Check Logs**: Review error and health logs
2. **Run Diagnostics**: Use status and validation commands
3. **Review Configuration**: Verify environment variables
4. **Monitor Performance**: Check performance metrics

### Reporting Issues
1. **Include Logs**: Provide relevant log entries
2. **Describe Context**: Explain when the issue occurs
3. **Provide Status**: Include system status information
4. **Test Commands**: Run diagnostic commands first

---

*This enhanced data manager ensures your ApexBets application has reliable, real-time, and comprehensive sports data with advanced monitoring and error handling capabilities.*
