# Core Data APIs

This section covers the fundamental data APIs that provide core sports information.

## Health Check

**Endpoint:** `GET /api/health`

**Description:** Comprehensive system health monitoring including database, Redis, and service status.

**Parameters:** None

**Response:**
```json
{
  "status": "healthy",
  "checks": {
    "database": true,
    "redis": true,
    "staleDataDetector": true,
    "dynamicSportsManager": true,
    "timestamp": "2024-01-01T00:00:00.000Z"
  },
  "duration": 150,
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

**Status Codes:**
- `200` - All systems healthy
- `503` - One or more systems unhealthy
- `500` - Health check failed

**Example:**
```bash
curl -X GET "https://your-domain.com/api/health"
```

---

## Sports

**Endpoint:** `GET /api/sports`

**Description:** Retrieve all available sports and their configuration.

**Parameters:** None

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "basketball",
      "display_name": "Basketball",
      "description": "Professional basketball leagues",
      "icon_url": "https://example.com/basketball.png",
      "color_primary": "#FF6B35",
      "color_secondary": "#004E89",
      "is_active": true,
      "data_types": ["games", "standings", "stats"],
      "api_providers": ["nba-stats", "espn"],
      "refresh_intervals": {
        "games": 300,
        "standings": 3600
      },
      "rate_limits": {
        "requests_per_minute": 100,
        "requests_per_hour": 1000
      },
      "season_config": {
        "start_month": 10,
        "end_month": 6
      },
      "current_season": "2024-25",
      "created_at": "2024-01-01T00:00:00.000Z",
      "updated_at": "2024-01-01T00:00:00.000Z"
    }
  ],
  "meta": {
    "fromCache": false,
    "responseTime": 45,
    "source": "supabase"
  }
}
```

**Example:**
```bash
curl -X GET "https://your-domain.com/api/sports"
```

---

## Teams

**Endpoint:** `GET /api/teams`

**Description:** Retrieve team information for specified sport and league.

**Parameters:**
- `sport` (string, optional) - Sport name (default: "all")
- `league` (string, optional) - League name
- `limit` (number, optional) - Maximum results (default: 100)
- `isActive` (boolean, optional) - Filter active teams (default: true)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Los Angeles Lakers",
      "abbreviation": "LAL",
      "city": "Los Angeles",
      "league": "NBA",
      "sport": "basketball",
      "logo_url": "https://example.com/lakers.png",
      "is_active": true,
      "founded_year": 1947,
      "venue": "Crypto.com Arena",
      "created_at": "2024-01-01T00:00:00.000Z",
      "updated_at": "2024-01-01T00:00:00.000Z"
    }
  ],
  "meta": {
    "sport": "basketball",
    "league": "NBA",
    "count": 30,
    "source": "database",
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

**Example:**
```bash
curl -X GET "https://your-domain.com/api/teams?sport=basketball&league=NBA&limit=30"
```

---

## Games

**Endpoint:** `GET /api/games`

**Description:** Retrieve game schedules, results, and information.

**Parameters:**
- `sport` (string, optional) - Sport name (default: "all")
- `status` (string, optional) - Game status: "scheduled", "live", "completed", "postponed", "cancelled"
- `dateFrom` (string, optional) - Start date (ISO format)
- `dateTo` (string, optional) - End date (ISO format)
- `limit` (number, optional) - Maximum results (default: 100)
- `league` (string, optional) - League name

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "sport": "basketball",
      "league": "NBA",
      "home_team_id": 1,
      "away_team_id": 2,
      "home_team_name": "Los Angeles Lakers",
      "away_team_name": "Boston Celtics",
      "home_team_abbreviation": "LAL",
      "away_team_abbreviation": "BOS",
      "home_team_logo": "https://example.com/lakers.png",
      "away_team_logo": "https://example.com/celtics.png",
      "home_team_city": "Los Angeles",
      "away_team_city": "Boston",
      "game_date": "2024-01-15T20:00:00.000Z",
      "status": "scheduled",
      "home_score": null,
      "away_score": null,
      "venue": "Crypto.com Arena",
      "attendance": null,
      "weather_conditions": null,
      "game_type": "regular",
      "season": "2024-25",
      "created_at": "2024-01-01T00:00:00.000Z",
      "updated_at": "2024-01-01T00:00:00.000Z"
    }
  ],
  "meta": {
    "timestamp": "2024-01-01T00:00:00.000Z",
    "sport": "basketball",
    "status": "scheduled",
    "league": "NBA",
    "count": 10,
    "summary": {
      "total": 10,
      "live": 0,
      "completed": 0,
      "scheduled": 10,
      "recent": 5
    },
    "source": "database"
  }
}
```

**Example:**
```bash
curl -X GET "https://your-domain.com/api/games?sport=basketball&status=scheduled&limit=10"
```

---

## Standings

**Endpoint:** `GET /api/standings`

**Description:** Retrieve league standings and team rankings.

**Parameters:**
- `sport` (string, optional) - Sport name (default: "all")
- `league` (string, optional) - League name
- `season` (string, optional) - Season (default: "2024-25")
- `limit` (number, optional) - Maximum results (default: 50)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "team_id": 1,
      "team_name": "Los Angeles Lakers",
      "league": "NBA",
      "sport": "basketball",
      "season": "2024-25",
      "wins": 25,
      "losses": 15,
      "ties": 0,
      "win_percentage": 0.625,
      "points_for": 4200,
      "points_against": 3950,
      "point_differential": 250,
      "home_wins": 15,
      "home_losses": 5,
      "away_wins": 10,
      "away_losses": 10,
      "streak": "W3",
      "conference": "Western",
      "division": "Pacific",
      "rank": 3,
      "conference_rank": 3,
      "division_rank": 1,
      "games_back": 2.5,
      "last_updated": "2024-01-01T00:00:00.000Z"
    }
  ],
  "meta": {
    "sport": "basketball",
    "league": "NBA",
    "season": "2024-25",
    "count": 30,
    "source": "database",
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

**Example:**
```bash
curl -X GET "https://your-domain.com/api/standings?sport=basketball&league=NBA&season=2024-25"
```

---

## Player Stats

**Endpoint:** `GET /api/player-stats`

**Description:** Retrieve comprehensive player statistics.

**Parameters:**
- `sport` (string, required) - Sport name
- `league` (string, optional) - League name
- `teamId` (string, optional) - Team ID filter
- `position` (string, optional) - Player position filter
- `season` (string, optional) - Season (default: current)
- `minGames` (number, optional) - Minimum games played filter
- `sortBy` (string, optional) - Sort field
- `sortOrder` (string, optional) - Sort order: "asc" or "desc" (default: "desc")
- `limit` (number, optional) - Maximum results (default: 50)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "player_id": 123,
      "player_name": "LeBron James",
      "team_id": 1,
      "team_name": "Los Angeles Lakers",
      "position": "SF",
      "sport": "basketball",
      "league": "NBA",
      "season": "2024-25",
      "games_played": 40,
      "games_started": 40,
      "minutes_per_game": 35.2,
      "points_per_game": 25.8,
      "rebounds_per_game": 7.2,
      "assists_per_game": 8.1,
      "steals_per_game": 1.2,
      "blocks_per_game": 0.6,
      "field_goal_percentage": 0.524,
      "three_point_percentage": 0.389,
      "free_throw_percentage": 0.756,
      "turnovers_per_game": 3.2,
      "fouls_per_game": 1.8,
      "plus_minus": 5.2,
      "efficiency_rating": 28.4,
      "last_updated": "2024-01-01T00:00:00.000Z"
    }
  ],
  "meta": {
    "sport": "basketball",
    "league": "NBA",
    "season": "2024-25",
    "filters": {
      "teamId": null,
      "position": null,
      "minGames": null,
      "sortBy": null,
      "sortOrder": "desc"
    },
    "count": 50,
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

**Example:**
```bash
curl -X GET "https://your-domain.com/api/player-stats?sport=basketball&league=NBA&sortBy=points_per_game&limit=20"
```

---

## Odds

**Endpoint:** `GET /api/odds`

**Description:** Retrieve betting odds data for games.

**Parameters:**
- `sport` (string, optional) - Sport name (default: "all")
- `gameId` (string, optional) - Specific game ID
- `source` (string, optional) - Odds provider filter
- `limit` (number, optional) - Maximum results (default: 100)
- `liveOnly` (boolean, optional) - Live games only (default: false)

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
      "odds": -150,
      "bookmaker": "DraftKings",
      "last_updated": "2024-01-01T00:00:00.000Z",
      "is_live": false,
      "game": {
        "home_team": "Los Angeles Lakers",
        "away_team": "Boston Celtics",
        "game_date": "2024-01-15T20:00:00.000Z",
        "status": "scheduled"
      }
    }
  ],
  "meta": {
    "sport": "basketball",
    "gameId": null,
    "source": null,
    "count": 10,
    "dataSource": "database",
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

**Example:**
```bash
curl -X GET "https://your-domain.com/api/odds?sport=basketball&liveOnly=true&limit=20"
```
