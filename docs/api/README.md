# ApexBets API Documentation

Welcome to the ApexBets API documentation. This comprehensive guide covers all available endpoints, their parameters, response formats, and usage examples.

## Table of Contents

- [Getting Started](#getting-started)
- [Authentication](#authentication)
- [Rate Limiting](#rate-limiting)
- [API Endpoints](#api-endpoints)
  - [Core Data APIs](#core-data-apis)
  - [Analytics APIs](#analytics-apis)
  - [Prediction APIs](#prediction-apis)
  - [Live Data APIs](#live-data-apis)
  - [Admin APIs](#admin-apis)
  - [Utility APIs](#utility-apis)
- [Error Handling](#error-handling)
- [Response Formats](#response-formats)
- [Examples](#examples)

## Getting Started

### Base URL
```
https://your-domain.com/api
```

### Supported Sports
- `basketball` - NBA, NCAA Basketball
- `football` - NFL, NCAA Football
- `baseball` - MLB
- `hockey` - NHL
- `soccer` - Premier League, La Liga, Serie A, etc.

### API Version
Current API version: `v1`

## Authentication

Most endpoints are publicly accessible. Some admin endpoints may require authentication headers.

## Rate Limiting

- **Standard endpoints**: 100 requests per minute
- **Analytics endpoints**: 50 requests per minute
- **Prediction endpoints**: 20 requests per minute
- **Admin endpoints**: 10 requests per minute

Rate limit headers are included in responses:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

## API Documentation

### 📚 Complete Documentation
- **[Core Data APIs](core-data.md)** - Fundamental sports data endpoints
- **[Analytics APIs](analytics.md)** - Data analysis and insights
- **[Prediction APIs](predictions.md)** - Machine learning predictions
- **[Live Data APIs](live-data.md)** - Real-time data and updates
- **[Admin APIs](admin.md)** - System monitoring and management
- **[Utility APIs](utility.md)** - Supporting services and tools
- **[Examples](examples.md)** - Comprehensive usage examples

### 🚀 Quick Start Endpoints

#### Core Data APIs
- [Health Check](core-data.md#health-check) - System health monitoring
- [Sports](core-data.md#sports) - Available sports configuration
- [Teams](core-data.md#teams) - Team information and data
- [Games](core-data.md#games) - Game schedules and results
- [Standings](core-data.md#standings) - League standings
- [Player Stats](core-data.md#player-stats) - Player statistics
- [Odds](core-data.md#odds) - Betting odds data

#### Analytics APIs
- [Analytics Overview](analytics.md#analytics-overview) - System analytics
- [Team Analytics](analytics.md#team-analytics) - Team performance metrics
- [Player Analytics](analytics.md#player-analytics) - Player performance metrics
- [Trend Analysis](analytics.md#trend-analysis) - Data trend analysis

#### Prediction APIs
- [Predictions Generate](predictions.md#generate-predictions) - Generate ML predictions
- [Predictions Upcoming](predictions.md#upcoming-predictions) - Upcoming game predictions
- [Predictions by Sport](predictions.md#sport-specific-predictions) - Sport-specific predictions

#### Live Data APIs
- [Live Scores](live-data.md#live-scores) - Real-time game scores
- [Live Updates](live-data.md#live-updates) - Real-time data updates
- [Live Stream](live-data.md#live-stream-information) - Streaming information

#### Admin APIs
- [API Status](admin.md#api-status) - API provider monitoring
- [Database Status](admin.md#database-status) - Database health
- [Rate Limit Management](admin.md#reset-rate-limits) - Rate limit controls

#### Utility APIs
- [Images](utility.md#images) - Team and player images
- [Cache Management](utility.md#cache-management) - Cache controls
- [Database Schema](utility.md#schema-debug) - Schema information

## Error Handling

All endpoints return consistent error responses:

```json
{
  "success": false,
  "error": "Error message",
  "details": "Additional error details",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### HTTP Status Codes
- `200` - Success
- `400` - Bad Request
- `401` - Unauthorized
- `404` - Not Found
- `429` - Rate Limited
- `500` - Internal Server Error
- `503` - Service Unavailable

## Response Formats

### Success Response
```json
{
  "success": true,
  "data": [...],
  "meta": {
    "timestamp": "2024-01-01T00:00:00.000Z",
    "count": 10,
    "source": "database"
  }
}
```

### Pagination
```json
{
  "success": true,
  "data": [...],
  "meta": {
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 1000,
      "pages": 20
    }
  }
}
```

## Examples

### Basic Request
```bash
curl -X GET "https://your-domain.com/api/games?sport=basketball&limit=10"
```

### With Parameters
```bash
curl -X GET "https://your-domain.com/api/odds?sport=basketball&gameId=123&liveOnly=true"
```

### Error Handling
```javascript
try {
  const response = await fetch('/api/games?sport=basketball');
  const data = await response.json();
  
  if (!data.success) {
    console.error('API Error:', data.error);
    return;
  }
  
  console.log('Games:', data.data);
} catch (error) {
  console.error('Request failed:', error);
}
```

---

For detailed information about each endpoint, please refer to the individual documentation files in this directory.
