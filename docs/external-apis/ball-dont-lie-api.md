# Ball Don't Lie API Documentation

## Overview

Ball Don't Lie API provides comprehensive sports data for NBA, NFL, MLB, and
NHL. It's a reliable source for player statistics, team information, game data,
and standings.

**Base URL:** `https://api.balldontlie.io/v1`  
**Documentation:** https://www.balldontlie.io/  
**Rate Limit:** 100 requests/minute, 1000 requests/hour  
**Cost:** Free with API key

## Authentication

### API Key Setup

1. Visit [balldontlie.io](https://www.balldontlie.io/)
2. Sign up for a free account
3. Generate your API key
4. Add to environment variables:

```bash
BALLDONTLIE_API_KEY=your_api_key_here
NEXT_PUBLIC_BALLDONTLIE_API_KEY=your_api_key_here
```

### Usage in Code

```typescript
import { ballDontLieClient } from '@/lib/sports-apis'

// The client automatically uses the API key from environment
const games = await ballDontLieClient.getGames()
```

## Endpoints

### Games

#### Get Games

**Endpoint:** `GET /games`

**Parameters:**

- `season` (number, optional) - Season year (e.g., 2024)
- `team_ids[]` (array, optional) - Array of team IDs
- `per_page` (number, optional) - Results per page (max 100, default 25)
- `page` (number, optional) - Page number (default 1)
- `start_date` (string, optional) - Start date (YYYY-MM-DD)
- `end_date` (string, optional) - End date (YYYY-MM-DD)

**Example Request:**

```bash
curl -X GET "https://api.balldontlie.io/v1/games?season=2024&per_page=25" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

**Example Response:**

```json
{
  "data": [
    {
      "id": 12345,
      "date": "2024-01-15T00:00:00.000Z",
      "home_team": {
        "id": 1,
        "abbreviation": "LAL",
        "city": "Los Angeles",
        "conference": "Western",
        "division": "Pacific",
        "full_name": "Los Angeles Lakers",
        "name": "Lakers"
      },
      "home_team_score": 112,
      "period": 4,
      "postseason": false,
      "season": 2024,
      "status": "Final",
      "time": "",
      "visitor_team": {
        "id": 2,
        "abbreviation": "BOS",
        "city": "Boston",
        "conference": "Eastern",
        "division": "Atlantic",
        "full_name": "Boston Celtics",
        "name": "Celtics"
      },
      "visitor_team_score": 108
    }
  ],
  "meta": {
    "total_pages": 50,
    "current_page": 1,
    "next_page": 2,
    "per_page": 25,
    "total_count": 1230
  }
}
```

### Teams

#### Get Teams

**Endpoint:** `GET /teams`

**Parameters:**

- `per_page` (number, optional) - Results per page (max 100, default 25)
- `page` (number, optional) - Page number (default 1)

**Example Request:**

```bash
curl -X GET "https://api.balldontlie.io/v1/teams" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

**Example Response:**

```json
{
  "data": [
    {
      "id": 1,
      "abbreviation": "LAL",
      "city": "Los Angeles",
      "conference": "Western",
      "division": "Pacific",
      "full_name": "Los Angeles Lakers",
      "name": "Lakers"
    }
  ],
  "meta": {
    "total_pages": 2,
    "current_page": 1,
    "next_page": 2,
    "per_page": 25,
    "total_count": 30
  }
}
```

### Players

#### Get Players

**Endpoint:** `GET /players`

**Parameters:**

- `per_page` (number, optional) - Results per page (max 100, default 25)
- `page` (number, optional) - Page number (default 1)
- `search` (string, optional) - Search by player name
- `team_ids[]` (array, optional) - Array of team IDs

**Example Request:**

```bash
curl -X GET "https://api.balldontlie.io/v1/players?search=LeBron" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

**Example Response:**

```json
{
  "data": [
    {
      "id": 123,
      "first_name": "LeBron",
      "last_name": "James",
      "position": "F",
      "height": "6-9",
      "weight": "250",
      "jersey_number": "23",
      "college": "St. Vincent-St. Mary HS",
      "country": "USA",
      "draft_year": 2003,
      "draft_round": 1,
      "draft_number": 1,
      "team": {
        "id": 1,
        "abbreviation": "LAL",
        "city": "Los Angeles",
        "conference": "Western",
        "division": "Pacific",
        "full_name": "Los Angeles Lakers",
        "name": "Lakers"
      }
    }
  ],
  "meta": {
    "total_pages": 1,
    "current_page": 1,
    "next_page": null,
    "per_page": 25,
    "total_count": 1
  }
}
```

### Statistics

#### Get Player Stats

**Endpoint:** `GET /stats`

**Parameters:**

- `per_page` (number, optional) - Results per page (max 100, default 25)
- `page` (number, optional) - Page number (default 1)
- `player_ids[]` (array, optional) - Array of player IDs
- `game_ids[]` (array, optional) - Array of game IDs
- `team_ids[]` (array, optional) - Array of team IDs
- `season` (number, optional) - Season year
- `start_date` (string, optional) - Start date (YYYY-MM-DD)
- `end_date` (string, optional) - End date (YYYY-MM-DD)

**Example Request:**

```bash
curl -X GET "https://api.balldontlie.io/v1/stats?player_ids[]=123&season=2024" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

**Example Response:**

```json
{
  "data": [
    {
      "id": 456,
      "ast": 8,
      "blk": 1,
      "dreb": 5,
      "fg3_pct": 0.389,
      "fg3a": 18,
      "fg3m": 7,
      "fg_pct": 0.524,
      "fga": 50,
      "fgm": 26,
      "ft_pct": 0.756,
      "fta": 10,
      "ftm": 7,
      "game": {
        "id": 12345,
        "date": "2024-01-15T00:00:00.000Z",
        "home_team_id": 1,
        "home_team_score": 112,
        "period": 4,
        "postseason": false,
        "season": 2024,
        "status": "Final",
        "time": "",
        "visitor_team_id": 2,
        "visitor_team_score": 108
      },
      "min": "35:12",
      "oreb": 2,
      "pf": 3,
      "player": {
        "id": 123,
        "first_name": "LeBron",
        "last_name": "James",
        "position": "F",
        "height": "6-9",
        "weight": "250",
        "jersey_number": "23",
        "college": "St. Vincent-St. Mary HS",
        "country": "USA",
        "draft_year": 2003,
        "draft_round": 1,
        "draft_number": 1,
        "team": {
          "id": 1,
          "abbreviation": "LAL",
          "city": "Los Angeles",
          "conference": "Western",
          "division": "Pacific",
          "full_name": "Los Angeles Lakers",
          "name": "Lakers"
        }
      },
      "pts": 25,
      "reb": 7,
      "stl": 2,
      "team": {
        "id": 1,
        "abbreviation": "LAL",
        "city": "Los Angeles",
        "conference": "Western",
        "division": "Pacific",
        "full_name": "Los Angeles Lakers",
        "name": "Lakers"
      },
      "turnover": 3
    }
  ],
  "meta": {
    "total_pages": 10,
    "current_page": 1,
    "next_page": 2,
    "per_page": 25,
    "total_count": 250
  }
}
```

## Rate Limits

- **Per Minute:** 100 requests
- **Per Hour:** 1000 requests
- **Per Day:** No specific limit mentioned

### Rate Limit Headers

The API returns rate limit information in response headers:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

## Error Handling

### Common Error Codes

| Status Code | Description           | Solution                  |
| ----------- | --------------------- | ------------------------- |
| 400         | Bad Request           | Check request parameters  |
| 401         | Unauthorized          | Verify API key            |
| 403         | Forbidden             | Check API key permissions |
| 404         | Not Found             | Verify endpoint URL       |
| 429         | Too Many Requests     | Wait for rate limit reset |
| 500         | Internal Server Error | Retry request             |

### Error Response Format

```json
{
  "error": "Rate limit exceeded",
  "message": "You have exceeded the rate limit of 100 requests per minute",
  "retry_after": 60
}
```

## Code Examples

### TypeScript Integration

```typescript
import { ballDontLieClient } from '@/lib/sports-apis'

// Get NBA games for current season
async function getNBAGames() {
  try {
    const games = await ballDontLieClient.getGames({
      season: 2024,
      per_page: 25,
    })

    return games.data.map(game => ({
      id: game.id,
      homeTeam: game.home_team.full_name,
      awayTeam: game.visitor_team.full_name,
      homeScore: game.home_team_score,
      awayScore: game.visitor_team_score,
      date: game.date,
      status: game.status,
    }))
  } catch (error) {
    console.error('Failed to fetch games:', error)
    throw error
  }
}

// Get player statistics
async function getPlayerStats(playerId: number) {
  try {
    const stats = await ballDontLieClient.getStats({
      player_ids: [playerId],
      season: 2024,
      per_page: 100,
    })

    return stats.data.map(stat => ({
      gameId: stat.game.id,
      points: stat.pts,
      rebounds: stat.reb,
      assists: stat.ast,
      steals: stat.stl,
      blocks: stat.blk,
      minutes: stat.min,
      fieldGoalPercentage: stat.fg_pct,
      threePointPercentage: stat.fg3_pct,
      freeThrowPercentage: stat.ft_pct,
    }))
  } catch (error) {
    console.error('Failed to fetch player stats:', error)
    throw error
  }
}
```

### JavaScript Example

```javascript
// Using fetch directly
async function fetchBallDontLieData(endpoint, params = {}) {
  const apiKey = process.env.BALLDONTLIE_API_KEY
  const baseUrl = 'https://api.balldontlie.io/v1'

  const queryString = new URLSearchParams(params).toString()
  const url = `${baseUrl}${endpoint}?${queryString}`

  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error('API request failed:', error)
    throw error
  }
}

// Usage
const games = await fetchBallDontLieData('/games', {
  season: 2024,
  per_page: 25,
})
```

## Best Practices

### 1. Pagination

Always use pagination for large datasets:

```typescript
async function getAllGames() {
  const allGames = []
  let page = 1
  let hasMore = true

  while (hasMore) {
    const response = await ballDontLieClient.getGames({
      per_page: 100,
      page: page,
    })

    allGames.push(...response.data)
    hasMore = response.meta.next_page !== null
    page++

    // Add delay to respect rate limits
    await new Promise(resolve => setTimeout(resolve, 100))
  }

  return allGames
}
```

### 2. Error Handling

Implement robust error handling:

```typescript
async function safeApiCall<T>(apiCall: () => Promise<T>): Promise<T | null> {
  try {
    return await apiCall()
  } catch (error) {
    if (error.status === 429) {
      console.warn('Rate limit exceeded, retrying after delay')
      await new Promise(resolve => setTimeout(resolve, 60000)) // Wait 1 minute
      return await apiCall()
    }

    console.error('API call failed:', error)
    return null
  }
}
```

### 3. Caching

Cache responses to reduce API calls:

```typescript
import { getCache, setCache } from '@/lib/redis'

async function getCachedGames(season: number) {
  const cacheKey = `balldontlie-games-${season}`
  const cached = await getCache(cacheKey)

  if (cached) {
    return cached
  }

  const games = await ballDontLieClient.getGames({ season })
  await setCache(cacheKey, games, 300) // Cache for 5 minutes

  return games
}
```

### 4. Data Validation

Always validate API responses:

```typescript
function validateGameData(game: any): boolean {
  return (
    game.id &&
    game.home_team &&
    game.visitor_team &&
    game.date &&
    typeof game.home_team_score === 'number' &&
    typeof game.visitor_team_score === 'number'
  )
}

const games = await ballDontLieClient.getGames()
const validGames = games.data.filter(validateGameData)
```

## Integration with ApexBets

The Ball Don't Lie API is integrated into the ApexBets system as a primary data
source for basketball data. It's used in the following services:

- **BasketballService** - Primary data source for NBA games and statistics
- **PlayerStatsService** - Player statistics and performance data
- **GameService** - Game schedules and results
- **TeamService** - Team information and standings

The API is configured with automatic retry logic, rate limiting, and fallback
mechanisms to ensure reliable data access.
