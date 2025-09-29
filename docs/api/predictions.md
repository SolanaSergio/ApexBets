# Prediction APIs

This section covers machine learning prediction endpoints that generate forecasts for upcoming games.

## Generate Predictions

**Endpoint:** `POST /api/predictions/generate`

**Description:** Generate new ML predictions for upcoming games using advanced algorithms.

**Parameters:**
- `sport` (string, optional) - Sport name (default: "basketball")
- `league` (string, optional) - League name
- `gameId` (string, optional) - Specific game ID to predict

**Request Body:** None required

**Response:**
```json
{
  "success": true,
  "sport": "basketball",
  "league": "NBA",
  "predictionsGenerated": 5,
  "predictions": [
    {
      "gameId": 123,
      "homeTeam": "Los Angeles Lakers",
      "awayTeam": "Boston Celtics",
      "prediction": {
        "model": "ensemble_ml_v2.1",
        "homeWinProbability": 0.65,
        "confidence": 0.82,
        "predictedSpread": -3.5,
        "predictedTotal": 225.5,
        "factors": [
          "Home court advantage",
          "Recent form",
          "Head-to-head record",
          "Rest days",
          "Injury reports"
        ],
        "featureImportance": {
          "home_record": 0.25,
          "recent_form": 0.20,
          "head_to_head": 0.15,
          "rest_days": 0.10,
          "injuries": 0.10,
          "weather": 0.05,
          "venue": 0.15
        }
      },
      "game": {
        "date": "2024-01-15T20:00:00.000Z",
        "venue": "Crypto.com Arena",
        "status": "scheduled"
      },
      "storedPredictionId": 456
    }
  ],
  "meta": {
    "timestamp": "2024-01-01T00:00:00.000Z",
    "model": "ensemble_ml_v2.1",
    "gamesAnalyzed": 5
  }
}
```

**Example:**
```bash
curl -X POST "https://your-domain.com/api/predictions/generate?sport=basketball&league=NBA"
```

---

## Upcoming Predictions

**Endpoint:** `GET /api/predictions/upcoming`

**Description:** Retrieve predictions for upcoming games in the next few days.

**Parameters:**
- `sport` (string, optional) - Sport name (default: "all")
- `limit` (number, optional) - Maximum results (default: 10)
- `days` (number, optional) - Days ahead to look (default: 7)

**Response:**
```json
[
  {
    "id": "pred-123",
    "game_id": 123,
    "game": "Boston Celtics @ Los Angeles Lakers",
    "type": "winner",
    "prediction": 0.65,
    "confidence": 0.82,
    "gameDate": "1/15/2024",
    "gameTime": "8:00 PM",
    "model": "AI Model v1.0",
    "home_team": {
      "id": 1,
      "name": "Los Angeles Lakers",
      "abbreviation": "LAL"
    },
    "away_team": {
      "id": 2,
      "name": "Boston Celtics",
      "abbreviation": "BOS"
    },
    "venue": "Crypto.com Arena"
  }
]
```

**Example:**
```bash
curl -X GET "https://your-domain.com/api/predictions/upcoming?sport=basketball&limit=5&days=7"
```

---

## Sport-Specific Predictions

**Endpoint:** `GET /api/predictions/{sport}`

**Description:** Retrieve predictions for a specific sport.

**Parameters:**
- `sport` (string, required) - Sport name in URL path
- `league` (string, optional) - League name
- `limit` (number, optional) - Maximum results (default: 10)
- `status` (string, optional) - Game status: "scheduled", "live"

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "game_id": 123,
      "sport": "basketball",
      "league": "NBA",
      "prediction_type": "winner",
      "predicted_value": 1,
      "confidence": 0.82,
      "model_name": "ensemble_ml_v2.1",
      "model_version": "2.1.0",
      "reasoning": "Home court advantage; Recent form; Head-to-head record",
      "feature_importance": {
        "home_record": 0.25,
        "recent_form": 0.20,
        "head_to_head": 0.15
      },
      "confidence_interval": {
        "low": 0.55,
        "high": 0.75
      },
      "game": {
        "home_team": "Los Angeles Lakers",
        "away_team": "Boston Celtics",
        "game_date": "2024-01-15T20:00:00.000Z",
        "venue": "Crypto.com Arena",
        "status": "scheduled"
      },
      "created_at": "2024-01-01T00:00:00.000Z",
      "updated_at": "2024-01-01T00:00:00.000Z"
    }
  ],
  "meta": {
    "sport": "basketball",
    "league": "NBA",
    "count": 10,
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

**Example:**
```bash
curl -X GET "https://your-domain.com/api/predictions/basketball?league=NBA&limit=10"
```

---

## Prediction Models

**Endpoint:** `GET /api/predictions/models`

**Description:** Information about available prediction models and their performance.

**Parameters:** None

**Response:**
```json
{
  "success": true,
  "data": {
    "models": [
      {
        "name": "ensemble_ml_v2.1",
        "version": "2.1.0",
        "description": "Ensemble machine learning model combining multiple algorithms",
        "sports_supported": ["basketball", "football", "baseball", "hockey", "soccer"],
        "prediction_types": ["winner", "spread", "total_points"],
        "performance": {
          "overall_accuracy": 0.72,
          "confidence_correlation": 0.78,
          "brier_score": 0.18,
          "last_trained": "2024-01-01T00:00:00.000Z"
        },
        "features": [
          "team_records",
          "recent_form",
          "head_to_head",
          "rest_days",
          "injuries",
          "weather",
          "venue"
        ],
        "is_active": true
      }
    ],
    "active_model": "ensemble_ml_v2.1",
    "last_updated": "2024-01-01T00:00:00.000Z"
  },
  "meta": {
    "timestamp": "2024-01-01T00:00:00.000Z",
    "source": "model_registry"
  }
}
```

**Example:**
```bash
curl -X GET "https://your-domain.com/api/predictions/models"
```

---

## Prediction History

**Endpoint:** `GET /api/predictions/history`

**Description:** Historical prediction performance and accuracy data.

**Parameters:**
- `sport` (string, optional) - Sport name (default: "all")
- `league` (string, optional) - League name
- `model` (string, optional) - Model name
- `startDate` (string, optional) - Start date (ISO format)
- `endDate` (string, optional) - End date (ISO format)
- `limit` (number, optional) - Maximum results (default: 100)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "game_id": 123,
      "sport": "basketball",
      "league": "NBA",
      "prediction_type": "winner",
      "predicted_value": 1,
      "actual_value": 1,
      "confidence": 0.82,
      "model_name": "ensemble_ml_v2.1",
      "was_correct": true,
      "game": {
        "home_team": "Los Angeles Lakers",
        "away_team": "Boston Celtics",
        "final_score": "112-108",
        "winner": "home",
        "game_date": "2024-01-15T20:00:00.000Z"
      },
      "created_at": "2024-01-01T00:00:00.000Z",
      "resolved_at": "2024-01-16T02:30:00.000Z"
    }
  ],
  "meta": {
    "sport": "basketball",
    "league": "NBA",
    "model": "ensemble_ml_v2.1",
    "accuracy": 0.72,
    "total_predictions": 100,
    "correct_predictions": 72,
    "count": 100,
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

**Example:**
```bash
curl -X GET "https://your-domain.com/api/predictions/history?sport=basketball&startDate=2024-01-01&endDate=2024-01-31"
```

---

## Prediction Confidence Intervals

**Endpoint:** `GET /api/predictions/confidence`

**Description:** Analysis of prediction confidence levels and their correlation with accuracy.

**Parameters:**
- `sport` (string, optional) - Sport name (default: "all")
- `league` (string, optional) - League name
- `model` (string, optional) - Model name
- `period` (string, optional) - Time period: "7d", "30d", "90d", "season"

**Response:**
```json
{
  "success": true,
  "data": {
    "sport": "basketball",
    "league": "NBA",
    "model": "ensemble_ml_v2.1",
    "period": "30d",
    "confidence_analysis": {
      "overall_correlation": 0.78,
      "confidence_buckets": [
        {
          "range": "0.9-1.0",
          "predictions": 25,
          "accuracy": 0.88,
          "average_confidence": 0.94
        },
        {
          "range": "0.8-0.9",
          "predictions": 75,
          "accuracy": 0.73,
          "average_confidence": 0.85
        },
        {
          "range": "0.7-0.8",
          "predictions": 100,
          "accuracy": 0.68,
          "average_confidence": 0.75
        },
        {
          "range": "0.6-0.7",
          "predictions": 50,
          "accuracy": 0.62,
          "average_confidence": 0.65
        }
      ],
      "calibration": {
        "reliability_diagram": [
          {"confidence": 0.65, "accuracy": 0.62},
          {"confidence": 0.75, "accuracy": 0.68},
          {"confidence": 0.85, "accuracy": 0.73},
          {"confidence": 0.94, "accuracy": 0.88}
        ],
        "brier_score": 0.18,
        "log_loss": 0.45
      }
    },
    "recommendations": [
      "Model shows good calibration for high-confidence predictions",
      "Consider adjusting confidence thresholds for medium-range predictions",
      "Overall model performance is within acceptable range"
    ],
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
curl -X GET "https://your-domain.com/api/predictions/confidence?sport=basketball&period=30d"
```

---

## Prediction Factors

**Endpoint:** `GET /api/predictions/factors`

**Description:** Detailed breakdown of factors used in predictions and their importance.

**Parameters:**
- `sport` (string, optional) - Sport name (default: "all")
- `league` (string, optional) - League name
- `model` (string, optional) - Model name

**Response:**
```json
{
  "success": true,
  "data": {
    "sport": "basketball",
    "league": "NBA",
    "model": "ensemble_ml_v2.1",
    "factors": [
      {
        "name": "home_record",
        "description": "Team's home win-loss record",
        "importance": 0.25,
        "weight": "high",
        "data_source": "team_stats",
        "update_frequency": "daily"
      },
      {
        "name": "recent_form",
        "description": "Team's performance in last 10 games",
        "importance": 0.20,
        "weight": "high",
        "data_source": "game_results",
        "update_frequency": "daily"
      },
      {
        "name": "head_to_head",
        "description": "Historical matchup record between teams",
        "importance": 0.15,
        "weight": "medium",
        "data_source": "historical_games",
        "update_frequency": "weekly"
      },
      {
        "name": "rest_days",
        "description": "Days of rest since last game",
        "importance": 0.10,
        "weight": "medium",
        "data_source": "schedule",
        "update_frequency": "daily"
      },
      {
        "name": "injuries",
        "description": "Key player injury status",
        "importance": 0.10,
        "weight": "medium",
        "data_source": "injury_reports",
        "update_frequency": "daily"
      },
      {
        "name": "weather",
        "description": "Weather conditions for outdoor games",
        "importance": 0.05,
        "weight": "low",
        "data_source": "weather_api",
        "update_frequency": "hourly"
      },
      {
        "name": "venue",
        "description": "Venue-specific factors and history",
        "importance": 0.15,
        "weight": "medium",
        "data_source": "venue_stats",
        "update_frequency": "weekly"
      }
    ],
    "factor_correlation": {
      "home_record_vs_recent_form": 0.65,
      "recent_form_vs_head_to_head": 0.45,
      "rest_days_vs_performance": 0.30
    },
    "last_updated": "2024-01-01T00:00:00.000Z"
  },
  "meta": {
    "timestamp": "2024-01-01T00:00:00.000Z",
    "source": "model_analysis"
  }
}
```

**Example:**
```bash
curl -X GET "https://your-domain.com/api/predictions/factors?sport=basketball&model=ensemble_ml_v2.1"
```
