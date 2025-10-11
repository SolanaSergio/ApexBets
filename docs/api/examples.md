# API Examples

This document provides comprehensive examples for using the ApexBets API
endpoints.

## Table of Contents

- [Authentication Examples](#authentication-examples)
- [Core Data Examples](#core-data-examples)
- [Analytics Examples](#analytics-examples)
- [Prediction Examples](#prediction-examples)
- [Live Data Examples](#live-data-examples)
- [Admin Examples](#admin-examples)
- [Error Handling Examples](#error-handling-examples)
- [JavaScript/TypeScript Examples](#javascripttypescript-examples)
- [Python Examples](#python-examples)
- [cURL Examples](#curl-examples)

## Authentication Examples

### Basic API Request

```bash
curl -X GET "https://your-domain.com/api/health" \
  -H "Accept: application/json"
```

### With Custom Headers

```bash
curl -X GET "https://your-domain.com/api/games" \
  -H "Accept: application/json" \
  -H "User-Agent: MyApp/1.0" \
  -H "X-API-Version: v1"
```

## Core Data Examples

### Get All Sports

```bash
curl -X GET "https://your-domain.com/api/sports"
```

### Get Basketball Teams

```bash
curl -X GET "https://your-domain.com/api/teams?sport=basketball&league=NBA&limit=30"
```

### Get Upcoming Games

```bash
curl -X GET "https://your-domain.com/api/games?sport=basketball&status=scheduled&dateFrom=2024-01-15&dateTo=2024-01-22&limit=10"
```

### Get Live Games

```bash
curl -X GET "https://your-domain.com/api/games?sport=basketball&status=live"
```

### Get Team Standings

```bash
curl -X GET "https://your-domain.com/api/standings?sport=basketball&league=NBA&season=2024-25"
```

### Get Player Statistics

```bash
curl -X GET "https://your-domain.com/api/player-stats?sport=basketball&league=NBA&sortBy=points_per_game&sortOrder=desc&limit=20"
```

### Get Betting Odds

```bash
curl -X GET "https://your-domain.com/api/odds?sport=basketball&liveOnly=true&limit=20"
```

## Analytics Examples

### Get System Analytics

```bash
curl -X GET "https://your-domain.com/api/analytics"
```

### Get Sport-Specific Analytics

```bash
curl -X GET "https://your-domain.com/api/analytics/basketball"
```

### Get Team Performance Analytics

```bash
curl -X GET "https://your-domain.com/api/analytics/team-performance?sport=basketball&league=NBA&season=2024-25"
```

### Get Player Analytics

```bash
curl -X GET "https://your-domain.com/api/analytics/player-analytics?sport=basketball&position=SF&minGames=20&limit=10"
```

### Get Trend Analysis

```bash
curl -X GET "https://your-domain.com/api/analytics/trend-analysis?sport=basketball&trendType=performance&period=30d"
```

### Get Top Performers

```bash
curl -X GET "https://your-domain.com/api/analytics/top-performers?sport=basketball&category=players&metric=points&limit=20"
```

## Prediction Examples

### Generate Predictions

```bash
curl -X POST "https://your-domain.com/api/predictions/generate?sport=basketball&league=NBA"
```

### Get Upcoming Predictions

```bash
curl -X GET "https://your-domain.com/api/predictions/upcoming?sport=basketball&limit=5&days=7"
```

### Get Sport-Specific Predictions

```bash
curl -X GET "https://your-domain.com/api/predictions/basketball?league=NBA&limit=10"
```

### Get Prediction Models

```bash
curl -X GET "https://your-domain.com/api/predictions/models"
```

### Get Prediction History

```bash
curl -X GET "https://your-domain.com/api/predictions/history?sport=basketball&startDate=2024-01-01&endDate=2024-01-31"
```

## Live Data Examples

### Get Live Scores

```bash
curl -X GET "https://your-domain.com/api/live-scores?sport=basketball&status=live"
```

### Get Live Updates

```bash
curl -X GET "https://your-domain.com/api/live-updates?sport=basketball&gameId=123&limit=20"
```

### Get All Live Updates

```bash
curl -X GET "https://your-domain.com/api/live-updates/all?limit=50&since=2024-01-15T20:00:00.000Z"
```

### Get Live Stream Information

```bash
curl -X GET "https://your-domain.com/api/live-stream?sport=basketball&gameId=123"
```

## Admin Examples

### Get API Status

```bash
curl -X GET "https://your-domain.com/api/admin/api-status"
```

### Reset Rate Limits

```bash
curl -X POST "https://your-domain.com/api/admin/reset-rate-limits" \
  -H "Content-Type: application/json" \
  -d '{"provider": "thesportsdb"}'
```

### Get Database Status

```bash
curl -X GET "https://your-domain.com/api/database/status"
```

### Get Database Schema

```bash
curl -X GET "https://your-domain.com/api/database/schema?table=games"
```

### Check Database Integrity

```bash
curl -X GET "https://your-domain.com/api/database/integrity?checkType=all"
```

### Get API Keys Status

```bash
curl -X GET "https://your-domain.com/api/admin/api-keys?status=active"
```

### Get Circuit Breaker Status

```bash
curl -X GET "https://your-domain.com/api/admin/circuit-breakers"
```

### Reset Circuit Breakers

```bash
curl -X POST "https://your-domain.com/api/admin/reset-circuit-breakers" \
  -H "Content-Type: application/json" \
  -d '{"provider": "balldontlie"}'
```

### Get System Performance

```bash
curl -X GET "https://your-domain.com/api/admin/performance?metric=all&period=24h"
```

### Clear Cache

```bash
curl -X GET "https://your-domain.com/api/health/clear-cache?type=all"
```

## Error Handling Examples

### Handle API Errors

```javascript
async function fetchGames() {
  try {
    const response = await fetch('/api/games?sport=basketball')
    const data = await response.json()

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${data.error}`)
    }

    if (!data.success) {
      throw new Error(data.error)
    }

    return data.data
  } catch (error) {
    console.error('Failed to fetch games:', error.message)
    throw error
  }
}
```

### Handle Rate Limiting

```javascript
async function fetchWithRetry(url, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url)

      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After')
        const delay = retryAfter
          ? parseInt(retryAfter) * 1000
          : Math.pow(2, i) * 1000

        console.log(`Rate limited. Retrying after ${delay}ms...`)
        await new Promise(resolve => setTimeout(resolve, delay))
        continue
      }

      return response
    } catch (error) {
      if (i === maxRetries - 1) throw error
      await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i)))
    }
  }
}
```

## JavaScript/TypeScript Examples

### Basic API Client

```typescript
class ApexBetsAPI {
  private baseURL: string

  constructor(baseURL: string = 'https://your-domain.com/api') {
    this.baseURL = baseURL
  }

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseURL}${endpoint}`
    const response = await fetch(url, {
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()

    if (!data.success) {
      throw new Error(data.error || 'API request failed')
    }

    return data
  }

  async getGames(
    params: {
      sport?: string
      status?: string
      limit?: number
    } = {}
  ) {
    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, value.toString())
      }
    })

    const queryString = searchParams.toString()
    const endpoint = queryString ? `/games?${queryString}` : '/games'

    return this.request<{ data: Game[]; meta: any }>(endpoint)
  }

  async getLiveScores(sport?: string) {
    const endpoint = sport ? `/live-scores?sport=${sport}` : '/live-scores'
    return this.request<LiveScoresResponse>(endpoint)
  }

  async generatePredictions(sport: string, league?: string) {
    const searchParams = new URLSearchParams({ sport })
    if (league) searchParams.append('league', league)

    return this.request<PredictionResponse>(
      `/predictions/generate?${searchParams}`,
      {
        method: 'POST',
      }
    )
  }
}

// Usage
const api = new ApexBetsAPI()

// Get upcoming basketball games
const games = await api.getGames({
  sport: 'basketball',
  status: 'scheduled',
  limit: 10,
})

// Get live scores
const liveScores = await api.getLiveScores('basketball')

// Generate predictions
const predictions = await api.generatePredictions('basketball', 'NBA')
```

### React Hook Example

```typescript
import { useState, useEffect } from 'react';

interface UseGamesOptions {
  sport?: string;
  status?: string;
  limit?: number;
}

export function useGames(options: UseGamesOptions = {}) {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchGames() {
      try {
        setLoading(true);
        setError(null);

        const searchParams = new URLSearchParams();
        Object.entries(options).forEach(([key, value]) => {
          if (value !== undefined) {
            searchParams.append(key, value.toString());
          }
        });

        const response = await fetch(`/api/games?${searchParams}`);
        const data = await response.json();

        if (!data.success) {
          throw new Error(data.error);
        }

        setGames(data.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch games');
      } finally {
        setLoading(false);
      }
    }

    fetchGames();
  }, [options.sport, options.status, options.limit]);

  return { games, loading, error };
}

// Usage in component
function GamesList() {
  const { games, loading, error } = useGames({
    sport: 'basketball',
    status: 'scheduled',
    limit: 10
  });

  if (loading) return <div>Loading games...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      {games.map(game => (
        <div key={game.id}>
          {game.away_team_name} @ {game.home_team_name}
          <br />
          {new Date(game.game_date).toLocaleString()}
        </div>
      ))}
    </div>
  );
}
```

## Python Examples

### Basic API Client

```python
import requests
import json
from typing import Dict, Any, Optional, List

class ApexBetsAPI:
    def __init__(self, base_url: str = "https://your-domain.com/api"):
        self.base_url = base_url
        self.session = requests.Session()
        self.session.headers.update({
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        })

    def request(self, endpoint: str, method: str = 'GET', **kwargs) -> Dict[str, Any]:
        url = f"{self.base_url}{endpoint}"

        try:
            response = self.session.request(method, url, **kwargs)
            response.raise_for_status()

            data = response.json()

            if not data.get('success', False):
                raise Exception(data.get('error', 'API request failed'))

            return data
        except requests.exceptions.RequestException as e:
            raise Exception(f"Request failed: {e}")

    def get_games(self, sport: Optional[str] = None, status: Optional[str] = None,
                  limit: Optional[int] = None) -> List[Dict[str, Any]]:
        params = {}
        if sport:
            params['sport'] = sport
        if status:
            params['status'] = status
        if limit:
            params['limit'] = limit

        response = self.request('/games', params=params)
        return response['data']

    def get_live_scores(self, sport: Optional[str] = None) -> Dict[str, Any]:
        endpoint = f"/live-scores?sport={sport}" if sport else "/live-scores"
        return self.request(endpoint)

    def generate_predictions(self, sport: str, league: Optional[str] = None) -> Dict[str, Any]:
        params = {'sport': sport}
        if league:
            params['league'] = league

        return self.request('/predictions/generate', method='POST', params=params)

    def get_analytics(self, sport: Optional[str] = None) -> Dict[str, Any]:
        endpoint = f"/analytics/{sport}" if sport else "/analytics"
        return self.request(endpoint)

# Usage
api = ApexBetsAPI()

# Get upcoming basketball games
games = api.get_games(sport='basketball', status='scheduled', limit=10)
print(f"Found {len(games)} games")

# Get live scores
live_scores = api.get_live_scores('basketball')
print(f"Live games: {live_scores['summary']['live']}")

# Generate predictions
predictions = api.generate_predictions('basketball', 'NBA')
print(f"Generated {predictions['predictionsGenerated']} predictions")
```

### Async Python Example

```python
import asyncio
import aiohttp
from typing import Dict, Any, Optional, List

class AsyncApexBetsAPI:
    def __init__(self, base_url: str = "https://your-domain.com/api"):
        self.base_url = base_url

    async def request(self, endpoint: str, method: str = 'GET', **kwargs) -> Dict[str, Any]:
        url = f"{self.base_url}{endpoint}"

        async with aiohttp.ClientSession() as session:
            async with session.request(method, url, **kwargs) as response:
                response.raise_for_status()
                data = await response.json()

                if not data.get('success', False):
                    raise Exception(data.get('error', 'API request failed'))

                return data

    async def get_games(self, sport: Optional[str] = None, status: Optional[str] = None,
                       limit: Optional[int] = None) -> List[Dict[str, Any]]:
        params = {}
        if sport:
            params['sport'] = sport
        if status:
            params['status'] = status
        if limit:
            params['limit'] = limit

        response = await self.request('/games', params=params)
        return response['data']

    async def get_multiple_data(self, sport: str) -> Dict[str, Any]:
        """Fetch multiple data types concurrently"""
        tasks = [
            self.request(f'/games?sport={sport}&status=scheduled'),
            self.request(f'/live-scores?sport={sport}'),
            self.request(f'/standings?sport={sport}'),
            self.request(f'/analytics/{sport}')
        ]

        results = await asyncio.gather(*tasks)

        return {
            'games': results[0]['data'],
            'live_scores': results[1],
            'standings': results[2]['data'],
            'analytics': results[3]['data']
        }

# Usage
async def main():
    api = AsyncApexBetsAPI()

    # Get multiple data types concurrently
    data = await api.get_multiple_data('basketball')

    print(f"Games: {len(data['games'])}")
    print(f"Live games: {data['live_scores']['summary']['live']}")
    print(f"Teams in standings: {len(data['standings'])}")

# Run the async function
asyncio.run(main())
```

## cURL Examples

### Health Check

```bash
curl -X GET "https://your-domain.com/api/health" \
  -H "Accept: application/json"
```

### Get Games with Filters

```bash
curl -X GET "https://your-domain.com/api/games?sport=basketball&status=scheduled&limit=10" \
  -H "Accept: application/json"
```

### Generate Predictions

```bash
curl -X POST "https://your-domain.com/api/predictions/generate?sport=basketball&league=NBA" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json"
```

### Get Live Scores

```bash
curl -X GET "https://your-domain.com/api/live-scores?sport=basketball&status=live" \
  -H "Accept: application/json"
```

### Get Analytics

```bash
curl -X GET "https://your-domain.com/api/analytics/basketball" \
  -H "Accept: application/json"
```

### Admin Operations

```bash
# Get API status
curl -X GET "https://your-domain.com/api/admin/api-status" \
  -H "Accept: application/json"

# Reset rate limits
curl -X POST "https://your-domain.com/api/admin/reset-rate-limits" \
  -H "Content-Type: application/json" \
  -d '{"provider": "thesportsdb"}'

# Clear cache
curl -X GET "https://your-domain.com/api/health/clear-cache?type=all" \
  -H "Accept: application/json"
```

### Error Handling with cURL

```bash
# Check response status
curl -X GET "https://your-domain.com/api/games" \
  -H "Accept: application/json" \
  -w "HTTP Status: %{http_code}\nResponse Time: %{time_total}s\n"

# Handle rate limiting
curl -X GET "https://your-domain.com/api/games" \
  -H "Accept: application/json" \
  --retry 3 \
  --retry-delay 1 \
  --retry-max-time 30
```

These examples demonstrate various ways to interact with the ApexBets API, from
simple cURL commands to complex JavaScript/TypeScript and Python
implementations. Choose the approach that best fits your development environment
and requirements.
