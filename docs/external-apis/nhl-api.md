# NHL API Documentation

## Overview

The NHL API provides comprehensive hockey data including games, teams, players, and statistics. It's the official API for National Hockey League data.

**Base URL:** `https://statsapi.web.nhl.com/api/v1`  
**Documentation:** https://gitlab.com/dword4/nhlapi  
**Rate Limit:** No official limit, but 100 requests/minute recommended  
**Cost:** Free (no API key required)

## Authentication

### No Authentication Required
The NHL API doesn't require authentication or API keys.

### Usage in Code
```typescript
import { nhlClient } from '@/lib/sports-apis'

// The client handles all requests automatically
const games = await nhlClient.getGames()
```

## Endpoints

### Games

#### Get Games
**Endpoint:** `GET /schedule`

**Parameters:**
- `date` (string, optional) - Date in YYYY-MM-DD format
- `teamId` (number, optional) - Team ID
- `season` (string, optional) - Season year

**Example Request:**
```bash
curl -X GET "https://statsapi.web.nhl.com/api/v1/schedule?date=2024-01-15"
```

**Example Response:**
```json
{
  "copyright": "NHL and the NHL Shield are registered trademarks of the National Hockey League.",
  "totalItems": 1,
  "totalEvents": 0,
  "totalGames": 1,
  "totalGamesInProgress": 0,
  "dates": [
    {
      "date": "2024-01-15",
      "totalItems": 1,
      "totalEvents": 0,
      "totalGames": 1,
      "totalGamesInProgress": 0,
      "games": [
        {
          "gamePk": 2024011501,
          "link": "/api/v1/game/2024011501/feed/live",
          "gameType": "R",
          "season": "20232024",
          "gameDate": "2024-01-15T20:00:00Z",
          "status": {
            "abstractGameState": "Final",
            "codedGameState": "7",
            "detailedState": "Final",
            "statusCode": "7",
            "startTimeTBD": false
          },
          "teams": {
            "away": {
              "leagueRecord": {
                "wins": 25,
                "losses": 15,
                "ot": 5,
                "type": "league"
              },
              "score": 3,
              "team": {
                "id": 1,
                "name": "New Jersey Devils",
                "link": "/api/v1/teams/1"
              }
            },
            "home": {
              "leagueRecord": {
                "wins": 20,
                "losses": 20,
                "ot": 5,
                "type": "league"
              },
              "score": 2,
              "team": {
                "id": 2,
                "name": "New York Islanders",
                "link": "/api/v1/teams/2"
              }
            }
          },
          "venue": {
            "id": 5026,
            "name": "UBS Arena",
            "link": "/api/v1/venues/5026"
          }
        }
      ],
      "events": []
    }
  ]
}
```

### Teams

#### Get Teams
**Endpoint:** `GET /teams`

**Parameters:**
- `season` (string, optional) - Season year
- `expand` (string, optional) - Expand options

**Example Request:**
```bash
curl -X GET "https://statsapi.web.nhl.com/api/v1/teams"
```

**Example Response:**
```json
{
  "copyright": "NHL and the NHL Shield are registered trademarks of the National Hockey League.",
  "teams": [
    {
      "id": 1,
      "name": "New Jersey Devils",
      "link": "/api/v1/teams/1",
      "venue": {
        "name": "Prudential Center",
        "link": "/api/v1/venues/5055",
        "city": "Newark",
        "timeZone": {
          "id": "America/New_York",
          "offset": -5,
          "tz": "EST"
        }
      },
      "abbreviation": "NJD",
      "teamName": "Devils",
      "locationName": "New Jersey",
      "firstYearOfPlay": "1982",
      "division": {
        "id": 18,
        "name": "Metropolitan",
        "link": "/api/v1/divisions/18"
      },
      "conference": {
        "id": 6,
        "name": "Eastern",
        "link": "/api/v1/conferences/6"
      },
      "franchise": {
        "franchiseId": 23,
        "teamName": "Devils",
        "link": "/api/v1/franchises/23"
      },
      "shortName": "New Jersey",
      "officialSiteUrl": "http://www.njdevils.com",
      "franchiseId": 23,
      "active": true
    }
  ]
}
```

### Standings

#### Get Standings
**Endpoint:** `GET /standings`

**Parameters:**
- `season` (string, optional) - Season year
- `date` (string, optional) - Date in YYYY-MM-DD format

**Example Request:**
```bash
curl -X GET "https://statsapi.web.nhl.com/api/v1/standings?season=20232024"
```

**Example Response:**
```json
{
  "copyright": "NHL and the NHL Shield are registered trademarks of the National Hockey League.",
  "records": [
    {
      "standingsType": "regularSeason",
      "league": {
        "id": 133,
        "name": "National Hockey League",
        "link": "/api/v1/league/133"
      },
      "division": {
        "id": 18,
        "name": "Metropolitan",
        "link": "/api/v1/divisions/18"
      },
      "conference": {
        "id": 6,
        "name": "Eastern",
        "link": "/api/v1/conferences/6"
      },
      "teamRecords": [
        {
          "team": {
            "id": 1,
            "name": "New Jersey Devils",
            "link": "/api/v1/teams/1"
          },
          "leagueRecord": {
            "wins": 25,
            "losses": 15,
            "ot": 5,
            "type": "league"
          },
          "regulationWins": 20,
          "goalsAgainst": 120,
          "goalsScored": 150,
          "points": 55,
          "divisionRank": "1",
          "divisionL10Rank": "1",
          "divisionRoadRank": "1",
          "divisionHomeRank": "1",
          "conferenceRank": "1",
          "conferenceL10Rank": "1",
          "conferenceRoadRank": "1",
          "conferenceHomeRank": "1",
          "leagueRank": "1",
          "leagueL10Rank": "1",
          "leagueRoadRank": "1",
          "leagueHomeRank": "1",
          "wildCardRank": "0",
          "row": 22,
          "gamesPlayed": 45,
          "streak": {
            "streakType": "wins",
            "streakNumber": 3,
            "streakCode": "W3"
          },
          "pointsPercentage": 0.611,
          "ppDivisionRank": "1",
          "ppConferenceRank": "1",
          "ppLeagueRank": "1",
          "lastUpdated": "2024-01-15T20:00:00Z"
        }
      ]
    }
  ]
}
```

## Rate Limits

### Recommended Limits
- **Per Minute:** 100 requests (conservative)
- **Per Hour:** 1000 requests
- **Per Day:** 10000 requests

## Error Handling

### Common Error Codes

| Status Code | Description | Solution |
|-------------|-------------|----------|
| 200 | Success | Request successful |
| 400 | Bad Request | Check request parameters |
| 404 | Not Found | Verify endpoint URL |
| 429 | Too Many Requests | Reduce request frequency |
| 500 | Internal Server Error | Retry request |

## Code Examples

### TypeScript Integration
```typescript
import { nhlClient } from '@/lib/sports-apis'

// Get NHL games
async function getNHLGames(date?: string) {
  try {
    const games = await nhlClient.getGames(date)
    
    return games.dates[0]?.games.map(game => ({
      id: game.gamePk,
      homeTeam: game.teams.home.team,
      awayTeam: game.teams.away.team,
      homeScore: game.teams.home.score,
      awayScore: game.teams.away.score,
      date: game.gameDate,
      status: game.status.detailedState,
      venue: game.venue?.name
    })) || []
  } catch (error) {
    console.error('Failed to fetch NHL games:', error)
    throw error
  }
}

// Get NHL teams
async function getNHLTeams() {
  try {
    const teams = await nhlClient.getTeams()
    
    return teams.teams.map(team => ({
      id: team.id,
      name: team.name,
      abbreviation: team.abbreviation,
      location: team.locationName,
      division: team.division?.name,
      conference: team.conference?.name,
      venue: team.venue?.name,
      firstYear: team.firstYearOfPlay,
      active: team.active
    }))
  } catch (error) {
    console.error('Failed to fetch NHL teams:', error)
    throw error
  }
}
```

### JavaScript Example
```javascript
// Using fetch directly
async function fetchNHLData(endpoint, params = {}) {
  const baseUrl = 'https://statsapi.web.nhl.com/api/v1'
  
  const queryString = new URLSearchParams(params).toString()
  const url = `${baseUrl}${endpoint}?${queryString}`
  
  try {
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'ApexBets/1.0.0'
      }
    })
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    
    return await response.json()
  } catch (error) {
    console.error('NHL API request failed:', error)
    throw error
  }
}

// Usage
const games = await fetchNHLData('/schedule', {
  date: '2024-01-15'
})
```

## Best Practices

### 1. Headers and User-Agent
Always include proper headers:
```typescript
const headers = {
  'Accept': 'application/json',
  'User-Agent': 'ApexBets/1.0.0'
}
```

### 2. Data Validation
Validate responses:
```typescript
function validateNHLGame(game: any): boolean {
  return (
    game.gamePk &&
    game.teams?.home?.team &&
    game.teams?.away?.team &&
    game.gameDate &&
    game.status?.detailedState
  )
}
```

### 3. Error Handling with Retry
```typescript
async function safeNHLCall<T>(
  apiCall: () => Promise<T>,
  maxRetries: number = 3
): Promise<T | null> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await apiCall()
    } catch (error) {
      if (error.status === 429) {
        const delay = Math.pow(2, i) * 1000
        await new Promise(resolve => setTimeout(resolve, delay))
        continue
      }
      
      if (i === maxRetries - 1) {
        console.error('Max retries exceeded:', error)
        return null
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
  }
  
  return null
}
```

### 4. Caching Strategy
```typescript
import { getCache, setCache } from '@/lib/redis'

async function getCachedNHLData(endpoint: string, params: any) {
  const cacheKey = `nhl-${endpoint}-${JSON.stringify(params)}`
  const cached = await getCache(cacheKey)
  
  if (cached) {
    return cached
  }
  
  const data = await nhlClient.request(endpoint, params)
  await setCache(cacheKey, data, 300) // Cache for 5 minutes
  
  return data
}
```

## Integration with ApexBets

The NHL API is integrated into the ApexBets system as the primary data source for NHL data. It's used in the following services:

- **HockeyService** - Primary data source for NHL games and statistics
- **PlayerStatsService** - Player statistics and performance data
- **TeamService** - Team information and standings
- **GameService** - Game schedules and results

The API is configured with conservative rate limiting, proper headers, and robust error handling to ensure reliable data access while respecting the NHL's servers.
