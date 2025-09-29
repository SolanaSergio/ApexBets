# Live Data APIs

This section covers real-time data endpoints that provide live scores, updates, and streaming information.

## Live Scores

**Endpoint:** `GET /api/live-scores`

**Description:** Real-time game scores and live game information.

**Parameters:**
- `sport` (string, optional) - Sport name (default: "all")
- `league` (string, optional) - League name
- `status` (string, optional) - Game status: "live", "finished", "scheduled", "all" (default: "live")

**Response:**
```json
{
  "games": [
    {
      "id": 123,
      "homeTeam": {
        "name": "Los Angeles Lakers",
        "city": "Los Angeles",
        "logo": "https://example.com/lakers.png",
        "score": 65,
        "id": 1
      },
      "awayTeam": {
        "name": "Boston Celtics",
        "city": "Boston",
        "logo": "https://example.com/celtics.png",
        "score": 58,
        "id": 2
      },
      "status": "live",
      "game_type": "regular",
      "overtime_periods": 0,
      "date": "2024-01-15T20:00:00.000Z",
      "league": "NBA",
      "venue": "Crypto.com Arena",
      "attendance": 19068,
      "weather": null,
      "odds": [
        {
          "betType": "moneyline",
          "side": "home",
          "odds": -150,
          "bookmaker": "DraftKings",
          "updatedAt": "2024-01-15T20:30:00.000Z"
        }
      ]
    }
  ],
  "summary": {
    "total": 5,
    "live": 3,
    "finished": 1,
    "scheduled": 1,
    "lastUpdated": "2024-01-15T20:30:00.000Z"
  },
  "topPerformers": [
    {
      "game": "Boston Celtics @ Los Angeles Lakers",
      "winner": "Los Angeles Lakers",
      "score": "112-108",
      "margin": 4,
      "date": "2024-01-15T20:00:00.000Z"
    }
  ],
  "filters": {
    "sport": "basketball",
    "league": "NBA",
    "status": "live"
  }
}
```

**Example:**
```bash
curl -X GET "https://your-domain.com/api/live-scores?sport=basketball&status=live"
```

---

## Live Updates

**Endpoint:** `GET /api/live-updates`

**Description:** Real-time updates for live games including score changes, events, and statistics.

**Parameters:**
- `sport` (string, optional) - Sport name (default: "all")
- `league` (string, optional) - League name
- `gameId` (string, optional) - Specific game ID
- `limit` (number, optional) - Maximum results (default: 50)

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
      "update_type": "score_change",
      "description": "LeBron James makes 3-pointer",
      "timestamp": "2024-01-15T20:25:30.000Z",
      "quarter": 3,
      "time_remaining": "8:45",
      "home_score": 65,
      "away_score": 58,
      "details": {
        "player": "LeBron James",
        "action": "3-pointer",
        "points": 3,
        "assist": "Anthony Davis"
      },
      "game": {
        "home_team": "Los Angeles Lakers",
        "away_team": "Boston Celtics",
        "status": "live"
      }
    }
  ],
  "meta": {
    "sport": "basketball",
    "league": "NBA",
    "count": 25,
    "last_update": "2024-01-15T20:25:30.000Z",
    "timestamp": "2024-01-15T20:25:30.000Z"
  }
}
```

**Example:**
```bash
curl -X GET "https://your-domain.com/api/live-updates?sport=basketball&gameId=123&limit=20"
```

---

## All Live Updates

**Endpoint:** `GET /api/live-updates/all`

**Description:** Comprehensive live updates across all sports and games.

**Parameters:**
- `sport` (string, optional) - Sport name (default: "all")
- `limit` (number, optional) - Maximum results (default: 100)
- `since` (string, optional) - Timestamp to get updates since (ISO format)

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
      "update_type": "score_change",
      "description": "LeBron James makes 3-pointer",
      "timestamp": "2024-01-15T20:25:30.000Z",
      "quarter": 3,
      "time_remaining": "8:45",
      "home_score": 65,
      "away_score": 58,
      "details": {
        "player": "LeBron James",
        "action": "3-pointer",
        "points": 3
      },
      "game": {
        "home_team": "Los Angeles Lakers",
        "away_team": "Boston Celtics",
        "status": "live"
      }
    },
    {
      "id": 2,
      "game_id": 124,
      "sport": "football",
      "league": "NFL",
      "update_type": "touchdown",
      "description": "Touchdown by Josh Allen",
      "timestamp": "2024-01-15T20:20:15.000Z",
      "quarter": 2,
      "time_remaining": "3:22",
      "home_score": 14,
      "away_score": 21,
      "details": {
        "player": "Josh Allen",
        "action": "touchdown",
        "points": 6,
        "yards": 15
      },
      "game": {
        "home_team": "Buffalo Bills",
        "away_team": "Kansas City Chiefs",
        "status": "live"
      }
    }
  ],
  "meta": {
    "sport": "all",
    "count": 50,
    "last_update": "2024-01-15T20:25:30.000Z",
    "timestamp": "2024-01-15T20:25:30.000Z"
  }
}
```

**Example:**
```bash
curl -X GET "https://your-domain.com/api/live-updates/all?limit=50&since=2024-01-15T20:00:00.000Z"
```

---

## Live Stream Information

**Endpoint:** `GET /api/live-stream`

**Description:** Streaming information and links for live games.

**Parameters:**
- `sport` (string, optional) - Sport name (default: "all")
- `league` (string, optional) - League name
- `gameId` (string, optional) - Specific game ID
- `platform` (string, optional) - Streaming platform: "espn", "nba", "nfl", "mlb"

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
      "streams": [
        {
          "platform": "NBA League Pass",
          "url": "https://watch.nba.com/game/123",
          "quality": "HD",
          "requires_subscription": true,
          "price": "$14.99/month",
          "available_regions": ["US", "CA"]
        },
        {
          "platform": "ESPN+",
          "url": "https://plus.espn.com/game/123",
          "quality": "HD",
          "requires_subscription": true,
          "price": "$9.99/month",
          "available_regions": ["US"]
        }
      ],
      "game": {
        "home_team": "Los Angeles Lakers",
        "away_team": "Boston Celtics",
        "game_date": "2024-01-15T20:00:00.000Z",
        "status": "live",
        "venue": "Crypto.com Arena"
      },
      "broadcast_info": {
        "tv_network": "TNT",
        "announcers": ["Kevin Harlan", "Reggie Miller"],
        "language": "English"
      },
      "last_updated": "2024-01-15T20:00:00.000Z"
    }
  ],
  "meta": {
    "sport": "basketball",
    "league": "NBA",
    "count": 1,
    "timestamp": "2024-01-15T20:00:00.000Z"
  }
}
```

**Example:**
```bash
curl -X GET "https://your-domain.com/api/live-stream?sport=basketball&gameId=123"
```

---

## Live Game Statistics

**Endpoint:** `GET /api/live-stats`

**Description:** Real-time game statistics for live games.

**Parameters:**
- `sport` (string, optional) - Sport name (default: "all")
- `league` (string, optional) - League name
- `gameId` (string, optional) - Specific game ID
- `statType` (string, optional) - Stat type: "team", "player", "quarter"

**Response:**
```json
{
  "success": true,
  "data": {
    "game_id": 123,
    "sport": "basketball",
    "league": "NBA",
    "status": "live",
    "current_quarter": 3,
    "time_remaining": "8:45",
    "team_stats": {
      "home": {
        "team_id": 1,
        "team_name": "Los Angeles Lakers",
        "score": 65,
        "field_goals": {
          "made": 25,
          "attempted": 50,
          "percentage": 0.500
        },
        "three_pointers": {
          "made": 8,
          "attempted": 20,
          "percentage": 0.400
        },
        "free_throws": {
          "made": 7,
          "attempted": 10,
          "percentage": 0.700
        },
        "rebounds": {
          "offensive": 8,
          "defensive": 22,
          "total": 30
        },
        "assists": 18,
        "steals": 6,
        "blocks": 4,
        "turnovers": 8,
        "fouls": 12
      },
      "away": {
        "team_id": 2,
        "team_name": "Boston Celtics",
        "score": 58,
        "field_goals": {
          "made": 22,
          "attempted": 48,
          "percentage": 0.458
        },
        "three_pointers": {
          "made": 6,
          "attempted": 18,
          "percentage": 0.333
        },
        "free_throws": {
          "made": 8,
          "attempted": 12,
          "percentage": 0.667
        },
        "rebounds": {
          "offensive": 6,
          "defensive": 20,
          "total": 26
        },
        "assists": 15,
        "steals": 4,
        "blocks": 2,
        "turnovers": 10,
        "fouls": 14
      }
    },
    "quarter_stats": [
      {
        "quarter": 1,
        "home_score": 28,
        "away_score": 22,
        "home_stats": {
          "field_goals": {"made": 11, "attempted": 20},
          "three_pointers": {"made": 3, "attempted": 8},
          "rebounds": 12
        },
        "away_stats": {
          "field_goals": {"made": 9, "attempted": 18},
          "three_pointers": {"made": 2, "attempted": 6},
          "rebounds": 8
        }
      }
    ],
    "last_updated": "2024-01-15T20:25:30.000Z"
  },
  "meta": {
    "timestamp": "2024-01-15T20:25:30.000Z",
    "source": "live_stats"
  }
}
```

**Example:**
```bash
curl -X GET "https://your-domain.com/api/live-stats?sport=basketball&gameId=123&statType=team"
```

---

## Live Odds Updates

**Endpoint:** `GET /api/live-odds`

**Description:** Real-time betting odds updates for live games.

**Parameters:**
- `sport` (string, optional) - Sport name (default: "all")
- `league` (string, optional) - League name
- `gameId` (string, optional) - Specific game ID
- `bookmaker` (string, optional) - Specific bookmaker
- `betType` (string, optional) - Bet type: "moneyline", "spread", "total"

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
      "bet_type": "moneyline",
      "side": "home",
      "odds": -145,
      "previous_odds": -150,
      "movement": 5,
      "bookmaker": "DraftKings",
      "is_live": true,
      "last_updated": "2024-01-15T20:25:30.000Z",
      "game": {
        "home_team": "Los Angeles Lakers",
        "away_team": "Boston Celtics",
        "current_score": "65-58",
        "status": "live",
        "quarter": 3,
        "time_remaining": "8:45"
      },
      "movement_history": [
        {
          "odds": -150,
          "timestamp": "2024-01-15T20:00:00.000Z"
        },
        {
          "odds": -145,
          "timestamp": "2024-01-15T20:25:30.000Z"
        }
      ]
    }
  ],
  "meta": {
    "sport": "basketball",
    "league": "NBA",
    "count": 15,
    "last_update": "2024-01-15T20:25:30.000Z",
    "timestamp": "2024-01-15T20:25:30.000Z"
  }
}
```

**Example:**
```bash
curl -X GET "https://your-domain.com/api/live-odds?sport=basketball&gameId=123&betType=moneyline"
```

---

## Live Game Events

**Endpoint:** `GET /api/live-events`

**Description:** Real-time game events and play-by-play information.

**Parameters:**
- `sport` (string, optional) - Sport name (default: "all")
- `league` (string, optional) - League name
- `gameId` (string, optional) - Specific game ID
- `eventType` (string, optional) - Event type: "score", "foul", "timeout", "substitution"
- `limit` (number, optional) - Maximum results (default: 50)

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
      "event_type": "score",
      "description": "LeBron James makes 3-pointer",
      "timestamp": "2024-01-15T20:25:30.000Z",
      "quarter": 3,
      "time_remaining": "8:45",
      "score": {
        "home": 65,
        "away": 58
      },
      "details": {
        "player": {
          "id": 123,
          "name": "LeBron James",
          "position": "SF",
          "jersey_number": 23
        },
        "action": "3-pointer",
        "points": 3,
        "assist": {
          "id": 456,
          "name": "Anthony Davis"
        },
        "location": {
          "x": 25,
          "y": 15
        }
      },
      "game": {
        "home_team": "Los Angeles Lakers",
        "away_team": "Boston Celtics",
        "status": "live"
      }
    }
  ],
  "meta": {
    "sport": "basketball",
    "league": "NBA",
    "count": 25,
    "last_update": "2024-01-15T20:25:30.000Z",
    "timestamp": "2024-01-15T20:25:30.000Z"
  }
}
```

**Example:**
```bash
curl -X GET "https://your-domain.com/api/live-events?sport=basketball&gameId=123&eventType=score&limit=20"
```
