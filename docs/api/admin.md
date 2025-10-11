# Admin APIs

This section covers administrative endpoints for system monitoring, management,
and maintenance.

## API Status

**Endpoint:** `GET /api/admin/api-status`

**Description:** Monitor rate limits and API health for all external providers.

**Parameters:** None

**Response:**

```json
{
  "success": true,
  "timestamp": "2024-01-01T00:00:00.000Z",
  "providers": [
    {
      "provider": "thesportsdb",
      "status": {
        "minute": {
          "used": 45,
          "limit": 100,
          "percentage": "45.0",
          "resetIn": 30
        },
        "hour": {
          "used": 850,
          "limit": 1000,
          "percentage": "85.0",
          "resetIn": 15
        },
        "day": {
          "used": 15000,
          "limit": 20000,
          "percentage": "75.0",
          "resetIn": 8
        }
      },
      "recommendedDelay": 1000,
      "healthCheck": {
        "status": "healthy",
        "responseTime": 250,
        "lastCheck": "2024-01-01T00:00:00.000Z"
      }
    }
  ],
  "recommendations": [
    "thesportsdb: Within safe limits",
    "balldontlie: Approaching minute limit (80%), consider slowing requests",
    "api-sports: Free tier limit approaching, prioritize TheSportsDB for remaining requests"
  ]
}
```

**Example:**

```bash
curl -X GET "https://your-domain.com/api/admin/api-status"
```

---

## Reset Rate Limits

**Endpoint:** `POST /api/admin/reset-rate-limits`

**Description:** Reset rate limits for a specific provider.

**Parameters:**

- `provider` (string, required) - Provider name in request body

**Request Body:**

```json
{
  "provider": "thesportsdb"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Rate limits reset for thesportsdb"
}
```

**Example:**

```bash
curl -X POST "https://your-domain.com/api/admin/reset-rate-limits" \
  -H "Content-Type: application/json" \
  -d '{"provider": "thesportsdb"}'
```

---

## Database Status

**Endpoint:** `GET /api/database/status`

**Description:** Database health and performance metrics.

**Parameters:** None

**Response:**

```json
{
  "success": true,
  "data": {
    "connection": {
      "status": "healthy",
      "response_time": 45,
      "last_check": "2024-01-01T00:00:00.000Z"
    },
    "performance": {
      "active_connections": 12,
      "max_connections": 100,
      "query_performance": "good",
      "average_query_time": 25
    },
    "storage": {
      "total_size": "2.5GB",
      "used_size": "1.8GB",
      "free_space": "0.7GB",
      "usage_percentage": 72
    },
    "tables": {
      "games": {
        "rows": 15000,
        "size": "500MB",
        "last_updated": "2024-01-01T00:00:00.000Z"
      },
      "teams": {
        "rows": 500,
        "size": "50MB",
        "last_updated": "2024-01-01T00:00:00.000Z"
      },
      "odds": {
        "rows": 25000,
        "size": "800MB",
        "last_updated": "2024-01-01T00:00:00.000Z"
      }
    },
    "replication": {
      "status": "healthy",
      "lag": 0,
      "last_sync": "2024-01-01T00:00:00.000Z"
    }
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

**Example:**

```bash
curl -X GET "https://your-domain.com/api/database/status"
```

---

## Database Schema

**Endpoint:** `GET /api/database/schema`

**Description:** Database schema information and table structures.

**Parameters:**

- `table` (string, optional) - Specific table name
- `format` (string, optional) - Response format: "json", "sql" (default: "json")

**Response:**

```json
{
  "success": true,
  "data": {
    "tables": [
      {
        "name": "games",
        "columns": [
          {
            "name": "id",
            "type": "bigint",
            "nullable": false,
            "default": "nextval('games_id_seq'::regclass)",
            "constraints": ["PRIMARY KEY"]
          },
          {
            "name": "sport",
            "type": "varchar",
            "nullable": false,
            "default": null,
            "constraints": ["NOT NULL"]
          },
          {
            "name": "home_team_id",
            "type": "bigint",
            "nullable": false,
            "default": null,
            "constraints": ["NOT NULL", "FOREIGN KEY"]
          }
        ],
        "indexes": [
          {
            "name": "games_sport_idx",
            "columns": ["sport"],
            "type": "btree"
          },
          {
            "name": "games_date_idx",
            "columns": ["game_date"],
            "type": "btree"
          }
        ],
        "foreign_keys": [
          {
            "column": "home_team_id",
            "references_table": "teams",
            "references_column": "id"
          }
        ]
      }
    ],
    "total_tables": 15,
    "last_updated": "2024-01-01T00:00:00.000Z"
  },
  "meta": {
    "timestamp": "2024-01-01T00:00:00.000Z",
    "source": "database_schema"
  }
}
```

**Example:**

```bash
curl -X GET "https://your-domain.com/api/database/schema?table=games"
```

---

## Database Integrity Check

**Endpoint:** `GET /api/database/integrity`

**Description:** Database integrity and consistency checks.

**Parameters:**

- `checkType` (string, optional) - Check type: "all", "foreign_keys",
  "constraints", "data"
- `table` (string, optional) - Specific table to check

**Response:**

```json
{
  "success": true,
  "data": {
    "overall_status": "healthy",
    "checks": [
      {
        "name": "Foreign Key Constraints",
        "status": "passed",
        "details": "All foreign key relationships are valid",
        "issues_found": 0,
        "execution_time": 150
      },
      {
        "name": "Data Consistency",
        "status": "passed",
        "details": "No orphaned records found",
        "issues_found": 0,
        "execution_time": 300
      },
      {
        "name": "Index Integrity",
        "status": "passed",
        "details": "All indexes are valid and up to date",
        "issues_found": 0,
        "execution_time": 200
      }
    ],
    "summary": {
      "total_checks": 5,
      "passed": 5,
      "failed": 0,
      "warnings": 0,
      "total_execution_time": 650
    },
    "recommendations": [
      "Database integrity is excellent",
      "Consider running weekly integrity checks",
      "Monitor index usage for optimization opportunities"
    ],
    "last_run": "2024-01-01T00:00:00.000Z"
  },
  "meta": {
    "timestamp": "2024-01-01T00:00:00.000Z",
    "source": "integrity_checker"
  }
}
```

**Example:**

```bash
curl -X GET "https://your-domain.com/api/database/integrity?checkType=all"
```

---

## API Keys Management

**Endpoint:** `GET /api/admin/api-keys`

**Description:** Manage API keys for external providers.

**Parameters:**

- `provider` (string, optional) - Specific provider name
- `status` (string, optional) - Key status: "active", "inactive", "expired"

**Response:**

```json
{
  "success": true,
  "data": {
    "providers": [
      {
        "name": "thesportsdb",
        "status": "active",
        "keys": [
          {
            "id": 1,
            "key": "1",
            "status": "active",
            "requests_today": 1500,
            "requests_limit": 2000,
            "last_used": "2024-01-01T00:00:00.000Z",
            "expires_at": null
          }
        ],
        "total_requests_today": 1500,
        "total_limit": 2000,
        "usage_percentage": 75
      },
      {
        "name": "balldontlie",
        "status": "active",
        "keys": [
          {
            "id": 2,
            "key": "abc123***",
            "status": "active",
            "requests_today": 800,
            "requests_limit": 1000,
            "last_used": "2024-01-01T00:00:00.000Z",
            "expires_at": "2024-12-31T23:59:59.000Z"
          }
        ],
        "total_requests_today": 800,
        "total_limit": 1000,
        "usage_percentage": 80
      }
    ],
    "summary": {
      "total_providers": 8,
      "active_providers": 7,
      "total_requests_today": 12000,
      "total_daily_limit": 15000,
      "overall_usage_percentage": 80
    },
    "alerts": [
      "balldontlie: Approaching daily limit (80%)",
      "api-sports: Free tier limit reached"
    ]
  },
  "meta": {
    "timestamp": "2024-01-01T00:00:00.000Z",
    "source": "api_key_manager"
  }
}
```

**Example:**

```bash
curl -X GET "https://your-domain.com/api/admin/api-keys?status=active"
```

---

## Circuit Breaker Status

**Endpoint:** `GET /api/admin/circuit-breakers`

**Description:** Monitor circuit breaker status for external API calls.

**Parameters:** None

**Response:**

```json
{
  "success": true,
  "data": {
    "circuit_breakers": [
      {
        "provider": "thesportsdb",
        "status": "closed",
        "failure_count": 2,
        "failure_threshold": 10,
        "timeout": 5000,
        "last_failure": null,
        "last_success": "2024-01-01T00:00:00.000Z",
        "next_attempt": null
      },
      {
        "provider": "balldontlie",
        "status": "open",
        "failure_count": 12,
        "failure_threshold": 10,
        "timeout": 30000,
        "last_failure": "2024-01-01T00:00:00.000Z",
        "last_success": "2023-12-31T23:30:00.000Z",
        "next_attempt": "2024-01-01T00:05:00.000Z"
      }
    ],
    "summary": {
      "total_breakers": 8,
      "closed": 6,
      "open": 2,
      "half_open": 0
    },
    "recommendations": [
      "balldontlie circuit breaker is open - using fallback provider",
      "Monitor thesportsdb for potential issues",
      "Consider increasing timeout for slow providers"
    ]
  },
  "meta": {
    "timestamp": "2024-01-01T00:00:00.000Z",
    "source": "circuit_breaker_monitor"
  }
}
```

**Example:**

```bash
curl -X GET "https://your-domain.com/api/admin/circuit-breakers"
```

---

## Reset Circuit Breakers

**Endpoint:** `POST /api/admin/reset-circuit-breakers`

**Description:** Reset circuit breakers for specific providers.

**Parameters:**

- `provider` (string, optional) - Specific provider name (if not provided,
  resets all)

**Request Body:**

```json
{
  "provider": "balldontlie"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Circuit breaker reset for balldontlie",
  "data": {
    "provider": "balldontlie",
    "previous_status": "open",
    "new_status": "closed",
    "reset_time": "2024-01-01T00:00:00.000Z"
  }
}
```

**Example:**

```bash
curl -X POST "https://your-domain.com/api/admin/reset-circuit-breakers" \
  -H "Content-Type: application/json" \
  -d '{"provider": "balldontlie"}'
```

---

## System Performance

**Endpoint:** `GET /api/admin/performance`

**Description:** System performance metrics and monitoring.

**Parameters:**

- `metric` (string, optional) - Specific metric: "cpu", "memory", "database",
  "api"
- `period` (string, optional) - Time period: "1h", "24h", "7d"

**Response:**

```json
{
  "success": true,
  "data": {
    "system": {
      "cpu_usage": 45.2,
      "memory_usage": 68.5,
      "disk_usage": 72.0,
      "load_average": 1.2
    },
    "database": {
      "connection_pool": {
        "active": 12,
        "idle": 8,
        "max": 100
      },
      "query_performance": {
        "average_response_time": 25,
        "slow_queries": 2,
        "cache_hit_ratio": 0.85
      }
    },
    "api": {
      "requests_per_minute": 150,
      "average_response_time": 120,
      "error_rate": 0.02,
      "rate_limit_hits": 5
    },
    "cache": {
      "redis": {
        "status": "healthy",
        "memory_usage": "256MB",
        "hit_ratio": 0.92,
        "keys": 15000
      }
    },
    "external_apis": {
      "total_requests": 5000,
      "success_rate": 0.98,
      "average_response_time": 450,
      "circuit_breakers_open": 1
    },
    "timestamp": "2024-01-01T00:00:00.000Z"
  },
  "meta": {
    "period": "1h",
    "timestamp": "2024-01-01T00:00:00.000Z",
    "source": "performance_monitor"
  }
}
```

**Example:**

```bash
curl -X GET "https://your-domain.com/api/admin/performance?metric=all&period=24h"
```

---

## Cache Management

**Endpoint:** `GET /api/health/clear-cache`

**Description:** Clear application cache and reset cache statistics.

**Parameters:**

- `type` (string, optional) - Cache type: "all", "redis", "memory", "api"
- `pattern` (string, optional) - Cache key pattern to clear

**Response:**

```json
{
  "success": true,
  "message": "Cache cleared successfully",
  "data": {
    "cache_type": "all",
    "keys_cleared": 15000,
    "memory_freed": "256MB",
    "clear_time": "2024-01-01T00:00:00.000Z"
  }
}
```

**Example:**

```bash
curl -X GET "https://your-domain.com/api/health/clear-cache?type=all"
```
