# Analytics APIs

This section covers analytics and data analysis endpoints that provide insights
into sports data.

## Analytics Overview

**Endpoint:** `GET /api/analytics`

**Description:** Comprehensive system analytics including data counts,
freshness, and performance metrics.

**Parameters:** None

**Response:**

```json
{
  "success": true,
  "data": {
    "overview": {
      "totalGames": 15000,
      "totalTeams": 500,
      "totalPredictions": 5000,
      "totalOdds": 25000
    },
    "bySport": {
      "basketball": {
        "games": 3000,
        "teams": 30,
        "predictions": 1000
      },
      "football": {
        "games": 2000,
        "teams": 32,
        "predictions": 800
      },
      "baseball": {
        "games": 4000,
        "teams": 30,
        "predictions": 1200
      },
      "hockey": {
        "games": 2500,
        "teams": 32,
        "predictions": 900
      },
      "soccer": {
        "games": 3500,
        "teams": 100,
        "predictions": 1100
      }
    },
    "gameStatus": {
      "scheduled": 500,
      "live": 25,
      "finished": 14475
    },
    "predictionAccuracy": {
      "totalPredictions": 5000,
      "averageConfidence": 0.78
    },
    "dataFreshness": {
      "lastGameUpdate": 1640995200000,
      "lastOddsUpdate": 1640995100000
    }
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

**Example:**

```bash
curl -X GET "https://your-domain.com/api/analytics"
```

---

## Sport-Specific Analytics

**Endpoint:** `GET /api/analytics/{sport}`

**Description:** Detailed analytics for a specific sport.

**Parameters:**

- `sport` (string, required) - Sport name in URL path

**Response:**

```json
{
  "success": true,
  "data": {
    "sport": "basketball",
    "league": "NBA",
    "season": "2024-25",
    "games": {
      "total": 3000,
      "scheduled": 500,
      "live": 15,
      "completed": 2485,
      "averageScore": 112.5,
      "averageMargin": 8.2
    },
    "teams": {
      "total": 30,
      "active": 30,
      "averageWins": 20.5,
      "averageLosses": 19.5
    },
    "players": {
      "total": 450,
      "active": 420,
      "averagePoints": 12.8,
      "averageRebounds": 5.2,
      "averageAssists": 3.1
    },
    "predictions": {
      "total": 1000,
      "averageConfidence": 0.82,
      "accuracy": 0.68,
      "lastUpdated": "2024-01-01T00:00:00.000Z"
    },
    "odds": {
      "total": 5000,
      "averageMovement": 2.5,
      "lastUpdated": "2024-01-01T00:00:00.000Z"
    }
  },
  "meta": {
    "timestamp": "2024-01-01T00:00:00.000Z",
    "source": "database"
  }
}
```

**Example:**

```bash
curl -X GET "https://your-domain.com/api/analytics/basketball"
```

---

## Team Analytics

**Endpoint:** `GET /api/analytics/team-performance`

**Description:** Team performance analytics and metrics.

**Parameters:**

- `sport` (string, optional) - Sport name (default: "all")
- `league` (string, optional) - League name
- `season` (string, optional) - Season (default: current)
- `limit` (number, optional) - Maximum results (default: 50)

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "team_id": 1,
      "team_name": "Los Angeles Lakers",
      "league": "NBA",
      "sport": "basketball",
      "season": "2024-25",
      "performance": {
        "wins": 25,
        "losses": 15,
        "win_percentage": 0.625,
        "points_per_game": 112.5,
        "points_allowed_per_game": 108.3,
        "point_differential": 4.2,
        "home_record": "15-5",
        "away_record": "10-10",
        "streak": "W3",
        "last_10_games": "7-3"
      },
      "advanced_metrics": {
        "offensive_rating": 115.2,
        "defensive_rating": 110.8,
        "net_rating": 4.4,
        "pace": 98.5,
        "true_shooting_percentage": 0.567,
        "effective_field_goal_percentage": 0.534
      },
      "trends": {
        "recent_form": ["W", "W", "L", "W", "W"],
        "home_performance": 0.75,
        "away_performance": 0.5,
        "vs_top_teams": 0.6,
        "vs_bottom_teams": 0.8
      },
      "last_updated": "2024-01-01T00:00:00.000Z"
    }
  ],
  "meta": {
    "sport": "basketball",
    "league": "NBA",
    "season": "2024-25",
    "count": 30,
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

**Example:**

```bash
curl -X GET "https://your-domain.com/api/analytics/team-performance?sport=basketball&league=NBA"
```

---

## Player Analytics

**Endpoint:** `GET /api/analytics/player-analytics`

**Description:** Player performance analytics and advanced metrics.

**Parameters:**

- `sport` (string, optional) - Sport name (default: "all")
- `league` (string, optional) - League name
- `position` (string, optional) - Player position
- `season` (string, optional) - Season (default: current)
- `minGames` (number, optional) - Minimum games played
- `limit` (number, optional) - Maximum results (default: 50)

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "player_id": 123,
      "player_name": "LeBron James",
      "team_name": "Los Angeles Lakers",
      "position": "SF",
      "sport": "basketball",
      "league": "NBA",
      "season": "2024-25",
      "basic_stats": {
        "games_played": 40,
        "minutes_per_game": 35.2,
        "points_per_game": 25.8,
        "rebounds_per_game": 7.2,
        "assists_per_game": 8.1,
        "steals_per_game": 1.2,
        "blocks_per_game": 0.6
      },
      "advanced_stats": {
        "player_efficiency_rating": 28.4,
        "true_shooting_percentage": 0.567,
        "usage_rate": 0.285,
        "win_shares": 8.2,
        "box_plus_minus": 5.8,
        "value_over_replacement": 4.2
      },
      "trends": {
        "last_10_games": {
          "points_per_game": 27.2,
          "rebounds_per_game": 7.8,
          "assists_per_game": 8.5
        },
        "home_vs_away": {
          "home_points": 26.5,
          "away_points": 25.1
        },
        "monthly_trends": {
          "october": 24.2,
          "november": 26.1,
          "december": 26.8
        }
      },
      "rankings": {
        "points_rank": 8,
        "rebounds_rank": 15,
        "assists_rank": 3,
        "efficiency_rank": 5
      },
      "last_updated": "2024-01-01T00:00:00.000Z"
    }
  ],
  "meta": {
    "sport": "basketball",
    "league": "NBA",
    "season": "2024-25",
    "count": 50,
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

**Example:**

```bash
curl -X GET "https://your-domain.com/api/analytics/player-analytics?sport=basketball&position=SF&minGames=20"
```

---

## Trend Analysis

**Endpoint:** `GET /api/analytics/trend-analysis`

**Description:** Data trend analysis and pattern recognition.

**Parameters:**

- `sport` (string, optional) - Sport name (default: "all")
- `league` (string, optional) - League name
- `trendType` (string, optional) - Type of trend: "performance", "odds",
  "predictions"
- `period` (string, optional) - Time period: "7d", "30d", "90d" (default: "30d")
- `limit` (number, optional) - Maximum results (default: 50)

**Response:**

```json
{
  "success": true,
  "data": {
    "sport": "basketball",
    "league": "NBA",
    "trendType": "performance",
    "period": "30d",
    "trends": [
      {
        "trend_id": 1,
        "trend_name": "Home Court Advantage",
        "description": "Teams performing significantly better at home",
        "trend_type": "performance",
        "strength": 0.75,
        "direction": "positive",
        "affected_teams": [
          {
            "team_id": 1,
            "team_name": "Los Angeles Lakers",
            "impact": 0.85,
            "home_record": "15-5",
            "away_record": "10-10"
          }
        ],
        "statistics": {
          "sample_size": 30,
          "confidence": 0.92,
          "p_value": 0.001
        },
        "last_updated": "2024-01-01T00:00:00.000Z"
      }
    ],
    "summary": {
      "total_trends": 15,
      "strong_trends": 8,
      "weak_trends": 7,
      "average_confidence": 0.78
    }
  },
  "meta": {
    "timestamp": "2024-01-01T00:00:00.000Z",
    "source": "analytics_engine"
  }
}
```

**Example:**

```bash
curl -X GET "https://your-domain.com/api/analytics/trend-analysis?sport=basketball&trendType=performance&period=30d"
```

---

## Top Performers

**Endpoint:** `GET /api/analytics/top-performers`

**Description:** Top performing teams and players across various metrics.

**Parameters:**

- `sport` (string, optional) - Sport name (default: "all")
- `league` (string, optional) - League name
- `category` (string, optional) - Category: "teams", "players", "games"
- `metric` (string, optional) - Metric: "wins", "points", "efficiency"
- `period` (string, optional) - Time period: "season", "month", "week"
- `limit` (number, optional) - Maximum results (default: 10)

**Response:**

```json
{
  "success": true,
  "data": {
    "category": "players",
    "metric": "points",
    "period": "season",
    "performers": [
      {
        "rank": 1,
        "player_id": 123,
        "player_name": "LeBron James",
        "team_name": "Los Angeles Lakers",
        "position": "SF",
        "metric_value": 25.8,
        "metric_name": "points_per_game",
        "games_played": 40,
        "total_points": 1032,
        "trend": "stable",
        "last_updated": "2024-01-01T00:00:00.000Z"
      }
    ],
    "summary": {
      "total_players": 450,
      "top_percentile": 0.95,
      "average_value": 12.8,
      "standard_deviation": 5.2
    }
  },
  "meta": {
    "sport": "basketball",
    "league": "NBA",
    "season": "2024-25",
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

**Example:**

```bash
curl -X GET "https://your-domain.com/api/analytics/top-performers?sport=basketball&category=players&metric=points&limit=20"
```

---

## Prediction Accuracy

**Endpoint:** `GET /api/analytics/prediction-accuracy`

**Description:** Analysis of prediction model accuracy and performance.

**Parameters:**

- `sport` (string, optional) - Sport name (default: "all")
- `league` (string, optional) - League name
- `model` (string, optional) - Prediction model name
- `period` (string, optional) - Time period: "7d", "30d", "90d", "season"
- `limit` (number, optional) - Maximum results (default: 50)

**Response:**

```json
{
  "success": true,
  "data": {
    "sport": "basketball",
    "league": "NBA",
    "period": "30d",
    "accuracy_metrics": {
      "overall_accuracy": 0.68,
      "total_predictions": 500,
      "correct_predictions": 340,
      "average_confidence": 0.78,
      "confidence_correlation": 0.72
    },
    "by_model": [
      {
        "model_name": "ensemble_ml_v2.1",
        "accuracy": 0.72,
        "predictions": 300,
        "average_confidence": 0.81,
        "brier_score": 0.18
      }
    ],
    "by_confidence": [
      {
        "confidence_range": "0.9-1.0",
        "accuracy": 0.85,
        "predictions": 50,
        "sample_size": 50
      },
      {
        "confidence_range": "0.8-0.9",
        "accuracy": 0.72,
        "predictions": 150,
        "sample_size": 150
      }
    ],
    "trends": {
      "accuracy_trend": "improving",
      "confidence_trend": "stable",
      "volume_trend": "increasing"
    },
    "last_updated": "2024-01-01T00:00:00.000Z"
  },
  "meta": {
    "timestamp": "2024-01-01T00:00:00.000Z",
    "source": "prediction_analytics"
  }
}
```

**Example:**

```bash
curl -X GET "https://your-domain.com/api/analytics/prediction-accuracy?sport=basketball&period=30d"
```
