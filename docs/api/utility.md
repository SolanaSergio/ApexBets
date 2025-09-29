# Utility APIs

This section covers utility endpoints for images, cache management, and other supporting services.

## Images

### Team Images

**Endpoint:** `GET /api/images/team/{league}/{teamName}`

**Description:** Retrieve team logos and images.

**Parameters:**
- `league` (string, required) - League name in URL path
- `teamName` (string, required) - Team name in URL path
- `size` (string, optional) - Image size: "small", "medium", "large" (default: "medium")
- `format` (string, optional) - Image format: "png", "jpg", "webp" (default: "png")

**Response:** Returns image file directly

**Example:**
```bash
curl -X GET "https://your-domain.com/api/images/team/NBA/Lakers?size=large&format=png"
```

### Player Images

**Endpoint:** `GET /api/images/player/{league}/{playerId}`

**Description:** Retrieve player photos and images.

**Parameters:**
- `league` (string, required) - League name in URL path
- `playerId` (string, required) - Player ID in URL path
- `size` (string, optional) - Image size: "small", "medium", "large" (default: "medium")
- `format` (string, optional) - Image format: "png", "jpg", "webp" (default: "jpg")

**Response:** Returns image file directly

**Example:**
```bash
curl -X GET "https://your-domain.com/api/images/player/NBA/123?size=medium&format=jpg"
```

---

## Cache Management

### Cache Status

**Endpoint:** `GET /api/cache`

**Description:** Get cache statistics and status information.

**Parameters:**
- `type` (string, optional) - Cache type: "all", "redis", "memory"

**Response:**
```json
{
  "success": true,
  "data": {
    "redis": {
      "status": "connected",
      "memory_usage": "256MB",
      "keys_count": 15000,
      "hit_ratio": 0.92,
      "miss_ratio": 0.08,
      "evictions": 150,
      "uptime": "7d 12h 30m"
    },
    "memory": {
      "status": "active",
      "cache_size": "128MB",
      "entries_count": 5000,
      "hit_ratio": 0.88,
      "max_size": "512MB"
    },
    "api_cache": {
      "status": "active",
      "cached_endpoints": 25,
      "total_requests": 10000,
      "cache_hits": 8500,
      "hit_ratio": 0.85
    },
    "summary": {
      "total_memory_used": "384MB",
      "total_keys": 20000,
      "overall_hit_ratio": 0.90,
      "last_updated": "2024-01-01T00:00:00.000Z"
    }
  },
  "meta": {
    "timestamp": "2024-01-01T00:00:00.000Z",
    "source": "cache_monitor"
  }
}
```

**Example:**
```bash
curl -X GET "https://your-domain.com/api/cache?type=all"
```

### Clear Cache

**Endpoint:** `POST /api/cache/clear`

**Description:** Clear specific cache entries or all cache.

**Parameters:**
- `type` (string, optional) - Cache type: "all", "redis", "memory", "api"
- `pattern` (string, optional) - Cache key pattern to clear
- `endpoint` (string, optional) - Specific API endpoint cache to clear

**Request Body:**
```json
{
  "type": "redis",
  "pattern": "games-*"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Cache cleared successfully",
  "data": {
    "cache_type": "redis",
    "pattern": "games-*",
    "keys_cleared": 500,
    "memory_freed": "50MB",
    "clear_time": "2024-01-01T00:00:00.000Z"
  }
}
```

**Example:**
```bash
curl -X POST "https://your-domain.com/api/cache/clear" \
  -H "Content-Type: application/json" \
  -d '{"type": "redis", "pattern": "games-*"}'
```

---

## Database-First APIs

### Database-First Games

**Endpoint:** `GET /api/database-first/games`

**Description:** Games data served directly from database with optimized queries.

**Parameters:**
- `sport` (string, optional) - Sport name (default: "all")
- `league` (string, optional) - League name
- `status` (string, optional) - Game status
- `dateFrom` (string, optional) - Start date (ISO format)
- `dateTo` (string, optional) - End date (ISO format)
- `limit` (number, optional) - Maximum results (default: 100)

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
      "game_date": "2024-01-15T20:00:00.000Z",
      "status": "scheduled",
      "venue": "Crypto.com Arena",
      "home_score": null,
      "away_score": null
    }
  ],
  "meta": {
    "source": "database",
    "query_time": 25,
    "count": 10,
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

**Example:**
```bash
curl -X GET "https://your-domain.com/api/database-first/games?sport=basketball&status=scheduled"
```

### Database-First Teams

**Endpoint:** `GET /api/database-first/teams`

**Description:** Teams data served directly from database.

**Parameters:**
- `sport` (string, optional) - Sport name (default: "all")
- `league` (string, optional) - League name
- `isActive` (boolean, optional) - Filter active teams (default: true)
- `limit` (number, optional) - Maximum results (default: 100)

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
      "venue": "Crypto.com Arena"
    }
  ],
  "meta": {
    "source": "database",
    "query_time": 15,
    "count": 30,
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

**Example:**
```bash
curl -X GET "https://your-domain.com/api/database-first/teams?sport=basketball&league=NBA"
```

### Database-First Standings

**Endpoint:** `GET /api/database-first/standings`

**Description:** Standings data served directly from database.

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
      "id": 1,
      "team_id": 1,
      "team_name": "Los Angeles Lakers",
      "league": "NBA",
      "sport": "basketball",
      "season": "2024-25",
      "wins": 25,
      "losses": 15,
      "win_percentage": 0.625,
      "points_for": 4200,
      "points_against": 3950,
      "point_differential": 250,
      "rank": 3
    }
  ],
  "meta": {
    "source": "database",
    "query_time": 20,
    "count": 30,
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

**Example:**
```bash
curl -X GET "https://your-domain.com/api/database-first/standings?sport=basketball&league=NBA"
```

---

## Debug APIs

### Schema Debug

**Endpoint:** `GET /api/debug/schema`

**Description:** Debug database schema and table information.

**Parameters:**
- `table` (string, optional) - Specific table name
- `detail` (string, optional) - Detail level: "basic", "full"

**Response:**
```json
{
  "success": true,
  "data": {
    "tables": [
      {
        "name": "games",
        "columns": 15,
        "rows": 15000,
        "size": "500MB",
        "indexes": 5,
        "foreign_keys": 2,
        "last_updated": "2024-01-01T00:00:00.000Z"
      }
    ],
    "total_tables": 15,
    "database_size": "2.5GB",
    "last_analyzed": "2024-01-01T00:00:00.000Z"
  },
  "meta": {
    "timestamp": "2024-01-01T00:00:00.000Z",
    "source": "schema_debugger"
  }
}
```

**Example:**
```bash
curl -X GET "https://your-domain.com/api/debug/schema?table=games&detail=full"
```

### Service Registry Debug

**Endpoint:** `GET /api/debug/service-registry`

**Description:** Debug service registry and available services.

**Parameters:** None

**Response:**
```json
{
  "success": true,
  "data": {
    "services": [
      {
        "name": "basketball-service",
        "status": "active",
        "version": "2.1.0",
        "endpoints": 15,
        "last_health_check": "2024-01-01T00:00:00.000Z",
        "dependencies": ["database", "redis", "external-apis"]
      },
      {
        "name": "prediction-service",
        "status": "active",
        "version": "1.8.0",
        "endpoints": 8,
        "last_health_check": "2024-01-01T00:00:00.000Z",
        "dependencies": ["ml-models", "database"]
      }
    ],
    "total_services": 12,
    "active_services": 11,
    "inactive_services": 1,
    "last_updated": "2024-01-01T00:00:00.000Z"
  },
  "meta": {
    "timestamp": "2024-01-01T00:00:00.000Z",
    "source": "service_registry"
  }
}
```

**Example:**
```bash
curl -X GET "https://your-domain.com/api/debug/service-registry"
```

---

## Image Optimizer

**Endpoint:** `GET /api/image-optimizer`

**Description:** Optimize and resize images on demand.

**Parameters:**
- `url` (string, required) - Image URL to optimize
- `width` (number, optional) - Target width
- `height` (number, optional) - Target height
- `quality` (number, optional) - Image quality 1-100 (default: 80)
- `format` (string, optional) - Output format: "webp", "jpg", "png"

**Response:** Returns optimized image file directly

**Example:**
```bash
curl -X GET "https://your-domain.com/api/image-optimizer?url=https://example.com/image.jpg&width=300&height=300&quality=90&format=webp"
```

---

## Startup Status

**Endpoint:** `GET /api/startup`

**Description:** Application startup status and initialization information.

**Parameters:** None

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "ready",
    "startup_time": "2024-01-01T00:00:00.000Z",
    "initialization_steps": [
      {
        "step": "database_connection",
        "status": "completed",
        "duration": 150
      },
      {
        "step": "redis_connection",
        "status": "completed",
        "duration": 50
      },
      {
        "step": "external_apis",
        "status": "completed",
        "duration": 300
      },
      {
        "step": "cache_warmup",
        "status": "completed",
        "duration": 200
      }
    ],
    "total_startup_time": 700,
    "services_ready": 12,
    "services_total": 12,
    "last_check": "2024-01-01T00:00:00.000Z"
  },
  "meta": {
    "timestamp": "2024-01-01T00:00:00.000Z",
    "source": "startup_monitor"
  }
}
```

**Example:**
```bash
curl -X GET "https://your-domain.com/api/startup"
```

---

## Populate Data

**Endpoint:** `POST /api/populate-data`

**Description:** Populate database with initial or test data.

**Parameters:**
- `sport` (string, optional) - Sport to populate
- `league` (string, optional) - League to populate
- `dataType` (string, optional) - Data type: "teams", "games", "players", "all"
- `season` (string, optional) - Season to populate

**Request Body:**
```json
{
  "sport": "basketball",
  "league": "NBA",
  "dataType": "teams",
  "season": "2024-25"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Data populated successfully",
  "data": {
    "sport": "basketball",
    "league": "NBA",
    "dataType": "teams",
    "season": "2024-25",
    "records_created": 30,
    "execution_time": 2500,
    "populated_at": "2024-01-01T00:00:00.000Z"
  }
}
```

**Example:**
```bash
curl -X POST "https://your-domain.com/api/populate-data" \
  -H "Content-Type: application/json" \
  -d '{"sport": "basketball", "league": "NBA", "dataType": "teams"}'
```
