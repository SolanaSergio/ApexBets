# ApexBets API Documentation

## Overview

The ApexBets API provides comprehensive access to sports data, analytics, predictions, and value betting opportunities. Built with Next.js 15 and TypeScript, it offers a robust, type-safe interface for sports analytics applications.

## Base URL

```
Production: https://apexbets.com/api
Development: http://localhost:3000/api
```

## Authentication

Most endpoints require authentication using Bearer tokens:

```http
Authorization: Bearer <your-jwt-token>
```

## Response Format

All API responses follow a consistent structure:

```json
{
  "success": true,
  "data": [...],
  "meta": {
    "timestamp": "2024-01-01T12:00:00Z",
    "count": 50,
    "source": "database",
    "refreshed": false
  }
}
```

## Error Handling

Errors are returned with a consistent format:

```json
{
  "success": false,
  "error": "Error message",
  "timestamp": "2024-01-01T12:00:00Z"
}
```

## Rate Limits

Rate limits vary by endpoint and data source:

- **Database-first endpoints**: 1000 requests/minute
- **External API endpoints**: Varies by provider (20-60 requests/minute)
- **Analytics endpoints**: 100 requests/minute
- **Admin endpoints**: 10 requests/minute

## Endpoints

### Health & Status

#### GET /health
Returns the current health status of the API.

**Response:**
```json
{
  "success": true,
  "status": "healthy",
  "timestamp": "2024-01-01T12:00:00Z",
  "uptime": 3600,
  "version": "1.0.0"
}
```

#### GET /health/status
Returns detailed health information including database and external API status.

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "database": {
      "connected": true,
      "responseTime": 45
    },
    "externalApis": {
      "thesportsdb": "healthy",
      "nba_stats": "healthy",
      "mlb_stats": "healthy"
    },
    "cache": {
      "memory": "healthy",
      "database": "healthy"
    }
  }
}
```

### Sports Configuration

#### GET /sports
Returns list of all supported sports with their configurations.

**Query Parameters:**
- `active` (boolean): Filter by active status

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "basketball",
      "name": "basketball",
      "displayName": "Basketball",
      "icon": "🏀",
      "color": "#FF6B35",
      "isActive": true,
      "dataSource": "rapidapi",
      "positions": ["PG", "SG", "SF", "PF", "C"],
      "scoringFields": ["points", "rebounds", "assists"],
      "bettingMarkets": ["h2h", "spread", "totals"],
      "seasonConfig": {
        "startMonth": 10,
        "endMonth": 6,
        "currentSeason": "2024"
      },
      "rateLimits": {
        "requests": 100,
        "interval": "1m"
      }
    }
  ],
  "meta": {
    "timestamp": "2024-01-01T12:00:00Z",
    "count": 5
  }
}
```

### Database-First Endpoints

These endpoints return data exclusively from the database without making external API calls, ensuring fast response times.

#### GET /database-first/teams
Returns teams data from database.

**Query Parameters:**
- `sport` (string, required): Sport to filter by
- `league` (string): League to filter by
- `limit` (integer): Maximum number of results (1-1000, default: 50)
- `offset` (integer): Number of results to skip (default: 0)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "team-1",
      "name": "Los Angeles Lakers",
      "abbreviation": "LAL",
      "sport": "basketball",
      "league_name": "NBA",
      "city": "Los Angeles",
      "logo_url": "https://example.com/lakers-logo.png",
      "primary_color": "#552583",
      "secondary_color": "#FDB927",
      "founded_year": 1947,
      "venue": "Crypto.com Arena",
      "capacity": 19068,
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T12:00:00Z"
    }
  ],
  "meta": {
    "timestamp": "2024-01-01T12:00:00Z",
    "count": 30,
    "source": "database",
    "refreshed": false
  }
}
```

#### GET /database-first/games
Returns games data from database.

**Query Parameters:**
- `sport` (string, required): Sport to filter by
- `status` (string): Game status filter (scheduled, live, completed, postponed, cancelled)
- `date` (string): Date filter (YYYY-MM-DD)
- `limit` (integer): Maximum number of results (1-1000, default: 50)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "game-1",
      "external_id": "ext-123",
      "sport": "basketball",
      "league_id": "nba",
      "league_name": "NBA",
      "season": "2024",
      "home_team_id": "team-1",
      "away_team_id": "team-2",
      "home_team_name": "Los Angeles Lakers",
      "away_team_name": "Golden State Warriors",
      "home_team_score": 110,
      "away_team_score": 108,
      "game_date": "2024-01-01T20:00:00Z",
      "game_time_local": "20:00:00",
      "status": "completed",
      "game_type": "regular",
      "venue": "Crypto.com Arena",
      "attendance": 19068,
      "weather_conditions": null,
      "referee_info": "Referee: John Smith",
      "broadcast_info": "ESPN",
      "betting_odds": {
        "home": 1.85,
        "away": 1.95
      },
      "last_updated": "2024-01-01T22:30:00Z",
      "created_at": "2024-01-01T00:00:00Z"
    }
  ],
  "meta": {
    "timestamp": "2024-01-01T12:00:00Z",
    "count": 25,
    "source": "database",
    "refreshed": false
  }
}
```

#### GET /database-first/games/today
Returns all games scheduled for today.

**Query Parameters:**
- `sport` (string): Sport to filter by

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "game-today-1",
      "home_team_name": "Los Angeles Lakers",
      "away_team_name": "Golden State Warriors",
      "game_date": "2024-01-01T20:00:00Z",
      "status": "scheduled",
      "venue": "Crypto.com Arena"
    }
  ],
  "meta": {
    "timestamp": "2024-01-01T12:00:00Z",
    "count": 8,
    "source": "database",
    "refreshed": false
  }
}
```

#### GET /database-first/odds
Returns betting odds from database.

**Query Parameters:**
- `sport` (string, required): Sport to filter by
- `betType` (string): Type of bet (h2h, spread, totals)
- `limit` (integer): Maximum number of results (1-1000, default: 50)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "odds-1",
      "game_id": "game-1",
      "sport": "basketball",
      "league": "NBA",
      "bet_type": "h2h",
      "home_odds": 1.85,
      "away_odds": 1.95,
      "draw_odds": null,
      "spread": null,
      "total": null,
      "over_odds": null,
      "under_odds": null,
      "bookmaker": "DraftKings",
      "last_updated": "2024-01-01T12:00:00Z",
      "expires_at": "2024-01-01T20:00:00Z"
    }
  ],
  "meta": {
    "timestamp": "2024-01-01T12:00:00Z",
    "count": 15,
    "source": "database",
    "refreshed": false
  }
}
```

#### GET /database-first/standings
Returns league standings from database.

**Query Parameters:**
- `sport` (string, required): Sport to filter by
- `league` (string): League to filter by
- `season` (string): Season to filter by

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "standing-1",
      "team_id": "team-1",
      "team_name": "Los Angeles Lakers",
      "sport": "basketball",
      "league": "NBA",
      "season": "2024",
      "conference": "Western",
      "division": "Pacific",
      "position": 1,
      "wins": 25,
      "losses": 15,
      "ties": 0,
      "win_percentage": 0.625,
      "games_behind": 0,
      "points_for": 4200,
      "points_against": 4000,
      "point_differential": 200,
      "streak": "W3",
      "last_updated": "2024-01-01T12:00:00Z"
    }
  ],
  "meta": {
    "timestamp": "2024-01-01T12:00:00Z",
    "count": 30,
    "source": "database",
    "refreshed": false
  }
}
```

#### GET /database-first/predictions
Returns ML predictions from database.

**Query Parameters:**
- `sport` (string, required): Sport to filter by
- `predictionType` (string): Type of prediction (winner, spread, total)
- `limit` (integer): Maximum number of results (1-1000, default: 50)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "prediction-1",
      "game_id": "game-1",
      "sport": "basketball",
      "league": "NBA",
      "prediction_type": "winner",
      "predicted_value": "home",
      "confidence": 0.75,
      "model_version": "v1.0",
      "feature_importance": {
        "home_advantage": 0.3,
        "recent_form": 0.25,
        "head_to_head": 0.2,
        "team_stats": 0.15,
        "player_injuries": 0.1
      },
      "created_at": "2024-01-01T12:00:00Z",
      "expires_at": "2024-01-01T20:00:00Z"
    }
  ],
  "meta": {
    "timestamp": "2024-01-01T12:00:00Z",
    "count": 20,
    "source": "database",
    "refreshed": false
  }
}
```

### Analytics Endpoints

#### GET /analytics
Returns general analytics and metrics.

**Query Parameters:**
- `sport` (string): Sport to filter by
- `timeRange` (string): Time range for analytics (7d, 30d, 90d, 1y, default: 30d)

**Response:**
```json
{
  "success": true,
  "data": {
    "totalGames": 1000,
    "totalTeams": 150,
    "totalPlayers": 2000,
    "predictionAccuracy": 0.68,
    "averageOdds": 1.92,
    "valueBetCount": 45,
    "lastUpdated": "2024-01-01T12:00:00Z"
  },
  "meta": {
    "timestamp": "2024-01-01T12:00:00Z",
    "source": "database",
    "refreshed": false
  }
}
```

#### GET /analytics/team-performance
Returns team performance metrics and statistics.

**Query Parameters:**
- `team` (string, required): Team name or ID
- `sport` (string, required): Sport to filter by
- `league` (string): League to filter by
- `timeRange` (integer): Time range for analysis (1-365, default: 30)

**Response:**
```json
{
  "success": true,
  "team": {
    "id": "team-1",
    "name": "Los Angeles Lakers",
    "abbreviation": "LAL",
    "sport": "basketball",
    "league_name": "NBA"
  },
  "performance": [
    {
      "date": "2024-01-01T20:00:00Z",
      "opponent": "Golden State Warriors",
      "score": "110-108",
      "won": true,
      "points": 110,
      "opponentPoints": 108,
      "margin": 2
    }
  ],
  "stats": {
    "wins": 20,
    "losses": 10,
    "winPercentage": 66.67,
    "avgPoints": 108.5,
    "avgOpponentPoints": 105.2,
    "pointDifferential": 3.3
  },
  "timeRange": 30
}
```

#### GET /analytics/trends
Returns trend analysis with timeout handling and caching.

**Query Parameters:**
- `sport` (string): Sport to analyze (default: all)
- `league` (string): League to filter by
- `season` (string): Season to analyze

**Response:**
```json
{
  "success": true,
  "sport": "basketball",
  "league": "NBA",
  "season": "2024",
  "trends": {
    "volume": 150,
    "percentage_change": 12.5,
    "trend_direction": "up",
    "confidence": 85,
    "data_points": {
      "total_games": 100,
      "completed_games": 95,
      "live_games": 2,
      "upcoming_games": 3,
      "total_predictions": 50,
      "total_teams": 30,
      "total_players": 450,
      "average_confidence": 0.72,
      "data_completeness": 95,
      "data_consistency": 88,
      "historical_comparison": {
        "current_volume": 150,
        "historical_volume": 120,
        "volume_change": 25.0
      },
      "sport_specific_metrics": {
        "sport": "basketball",
        "average_score": 108.5,
        "total_goals": 0,
        "average_attendance": 18500,
        "competitive_balance": 8.2
      }
    },
    "last_updated": "2024-01-01T12:00:00Z"
  },
  "meta": {
    "games_analyzed": 100,
    "teams_analyzed": 30,
    "players_analyzed": 450,
    "predictions_analyzed": 50,
    "historical_games": 120,
    "historical_teams": 30,
    "season_active": true,
    "previous_season": "2023",
    "data_quality": 91,
    "timeout_used": false,
    "fromCache": false,
    "timestamp": "2024-01-01T12:00:00Z"
  }
}
```

### Predictions & ML

#### POST /predictions/generate
Generates new ML predictions for upcoming games.

**Request Body:**
```json
{
  "sport": "basketball",
  "league": "NBA",
  "days": 7
}
```

**Response:**
```json
{
  "success": true,
  "predictions": [
    {
      "id": "prediction-new-1",
      "game_id": "game-upcoming-1",
      "sport": "basketball",
      "league": "NBA",
      "prediction_type": "winner",
      "predicted_value": "home",
      "confidence": 0.78,
      "model_version": "v1.0",
      "feature_importance": {
        "home_advantage": 0.3,
        "recent_form": 0.25,
        "head_to_head": 0.2,
        "team_stats": 0.15,
        "player_injuries": 0.1
      },
      "created_at": "2024-01-01T12:00:00Z",
      "expires_at": "2024-01-02T20:00:00Z"
    }
  ],
  "meta": {
    "sport": "basketball",
    "league": "NBA",
    "days": 7,
    "generatedAt": "2024-01-01T12:00:00Z"
  }
}
```

#### GET /predictions/upcoming
Returns predictions for upcoming games.

**Query Parameters:**
- `sport` (string): Sport to filter by
- `league` (string): League to filter by
- `limit` (integer): Maximum number of results (1-100, default: 20)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "prediction-upcoming-1",
      "game_id": "game-upcoming-1",
      "sport": "basketball",
      "league": "NBA",
      "prediction_type": "winner",
      "predicted_value": "home",
      "confidence": 0.75,
      "model_version": "v1.0",
      "feature_importance": {
        "home_advantage": 0.3,
        "recent_form": 0.25,
        "head_to_head": 0.2,
        "team_stats": 0.15,
        "player_injuries": 0.1
      },
      "created_at": "2024-01-01T12:00:00Z",
      "expires_at": "2024-01-02T20:00:00Z"
    }
  ],
  "meta": {
    "timestamp": "2024-01-01T12:00:00Z",
    "count": 15,
    "source": "database",
    "refreshed": false
  }
}
```

### Value Betting

#### GET /value-bets
Returns value betting opportunities from database with ML analysis.

**Query Parameters:**
- `sport` (string): Sport to filter by (default: all)
- `league` (string): League to filter by
- `betType` (string): Type of bet (h2h, spread, totals)
- `recommendation` (string): Recommendation level (high, medium, low)
- `minValue` (number): Minimum value threshold (0-1)
- `limit` (integer): Maximum number of results (1-100, default: 50)
- `activeOnly` (boolean): Only return active opportunities (default: true)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "value-bet-1",
      "game_id": "game-1",
      "sport": "basketball",
      "league": "NBA",
      "bet_type": "h2h",
      "side": "home",
      "odds": 2.1,
      "predicted_probability": 0.55,
      "value": 0.155,
      "expected_value": 0.155,
      "kelly_percentage": 0.075,
      "confidence_score": 0.78,
      "recommendation": "high",
      "expires_at": "2024-01-01T20:00:00Z",
      "created_at": "2024-01-01T12:00:00Z"
    }
  ],
  "meta": {
    "source": "database",
    "count": 12,
    "sport": "basketball",
    "league": "NBA",
    "betType": "h2h",
    "recommendation": "high",
    "minValue": 0.1,
    "activeOnly": true,
    "refreshed": false,
    "timestamp": "2024-01-01T12:00:00Z"
  }
}
```

### Live Data

#### GET /live-updates
Returns live updates with polling-based approach.

**Query Parameters:**
- `sport` (string): Sport to filter by
- `league` (string): League to filter by

**Response:**
```json
{
  "success": true,
  "live": [
    {
      "id": "game-live-1",
      "home_team_name": "Los Angeles Lakers",
      "away_team_name": "Golden State Warriors",
      "home_score": 45,
      "away_score": 42,
      "status": "live",
      "quarter": "2nd",
      "time_remaining": "8:45",
      "last_updated": "2024-01-01T20:15:00Z"
    }
  ],
  "recent": [
    {
      "id": "game-recent-1",
      "home_team_name": "Boston Celtics",
      "away_team_name": "Miami Heat",
      "home_score": 108,
      "away_score": 105,
      "status": "completed",
      "final_score": "108-105",
      "completed_at": "2024-01-01T19:45:00Z"
    }
  ],
  "upcoming": [
    {
      "id": "game-upcoming-1",
      "home_team_name": "Phoenix Suns",
      "away_team_name": "Denver Nuggets",
      "status": "scheduled",
      "game_date": "2024-01-01T22:00:00Z",
      "venue": "Footprint Center"
    }
  ],
  "summary": {
    "totalLive": 1,
    "totalRecent": 1,
    "totalUpcoming": 1,
    "lastUpdated": "2024-01-01T20:15:00Z"
  },
  "meta": {
    "timestamp": "2024-01-01T20:15:00Z",
    "source": "database",
    "refreshed": false
  }
}
```

#### GET /live-stream
Server-Sent Events stream for real-time updates.

**Query Parameters:**
- `sport` (string): Sport to filter by

**Response:** Server-Sent Events stream

```
data: {"type": "live_update", "data": {...}}

data: {"type": "heartbeat", "timestamp": "2024-01-01T20:15:00Z"}

data: {"type": "game_completed", "data": {...}}
```

### Admin & Monitoring

#### GET /admin/api-status
Returns comprehensive API health and status information.

**Authentication:** Required

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "uptime": 86400,
    "version": "1.0.0",
    "environment": "production",
    "database": {
      "connected": true,
      "responseTime": 45,
      "totalConnections": 10,
      "activeConnections": 3
    },
    "externalApis": {
      "thesportsdb": {
        "status": "healthy",
        "responseTime": 120,
        "rateLimitRemaining": 450
      },
      "nba_stats": {
        "status": "healthy",
        "responseTime": 200,
        "rateLimitRemaining": 18
      }
    },
    "cache": {
      "memory": {
        "hitRate": 0.85,
        "size": "50MB",
        "entries": 1250
      },
      "database": {
        "hitRate": 0.92,
        "entries": 5000
      }
    },
    "rateLimits": {
      "totalRequests": 15000,
      "requestsPerMinute": 45,
      "blockedRequests": 12
    },
    "lastChecked": "2024-01-01T12:00:00Z"
  }
}
```

#### GET /admin/database-audit
Performs comprehensive database audit and health check.

**Authentication:** Required

**Response:**
```json
{
  "success": true,
  "data": {
    "connectionStatus": "connected",
    "totalTables": 17,
    "totalRows": 150000,
    "databaseSize": "2.5GB",
    "lastBackup": "2024-01-01T06:00:00Z",
    "schemaIntegrity": true,
    "dataIntegrity": true,
    "performanceMetrics": {
      "averageQueryTime": 45,
      "slowQueries": 2,
      "indexUsage": 0.95,
      "cacheHitRate": 0.88
    },
    "lastAudit": "2024-01-01T12:00:00Z"
  }
}
```

## Error Codes

| Code | Description |
|------|-------------|
| 400 | Bad Request - Invalid parameters |
| 401 | Unauthorized - Authentication required |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource not found |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error - Server error |
| 503 | Service Unavailable - External API unavailable |

## SDKs and Libraries

### JavaScript/TypeScript
```bash
npm install @apexbets/api-client
```

```typescript
import { ApexBetsClient } from '@apexbets/api-client'

const client = new ApexBetsClient({
  baseUrl: 'https://apexbets.com/api',
  apiKey: 'your-api-key'
})

const teams = await client.teams.get({ sport: 'basketball' })
```

### Python
```bash
pip install apexbets-api
```

```python
from apexbets import ApexBetsClient

client = ApexBetsClient(
    base_url='https://apexbets.com/api',
    api_key='your-api-key'
)

teams = client.teams.get(sport='basketball')
```

## Support

- **Documentation**: [https://docs.apexbets.com](https://docs.apexbets.com)
- **Status Page**: [https://status.apexbets.com](https://status.apexbets.com)
- **Support Email**: support@apexbets.com
- **Discord**: [https://discord.gg/apexbets](https://discord.gg/apexbets)

## Changelog

### v1.0.0 (2024-01-01)
- Initial release
- 40+ API endpoints
- Real-time data streaming
- ML predictions
- Value betting detection
- Comprehensive analytics