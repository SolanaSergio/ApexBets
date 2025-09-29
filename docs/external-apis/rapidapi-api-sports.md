# RapidAPI (API-Sports) Documentation

## Overview

RapidAPI is a marketplace that provides access to thousands of APIs, including API-Sports which offers comprehensive multi-sport data. API-Sports provides data for football (soccer), basketball, baseball, hockey, and other sports.

**Base URL:** `https://api-football-v1.p.rapidapi.com/v3`  
**Documentation:** https://rapidapi.com/api-sports/api/api-football/  
**Rate Limit:** 100 requests/minute (free tier), higher limits on paid plans  
**Cost:** Free tier available, paid plans for higher limits

## Authentication

### RapidAPI Key Setup
1. Visit [RapidAPI](https://rapidapi.com/)
2. Sign up for a free account
3. Subscribe to API-Sports (free tier available)
4. Get your RapidAPI key from the dashboard
5. Add to environment variables:

```bash
RAPIDAPI_KEY=your_rapidapi_key_here
NEXT_PUBLIC_RAPIDAPI_KEY=your_rapidapi_key_here
```

### Usage in Code
```typescript
import { apiSportsClient } from '@/lib/sports-apis'

// The client automatically uses the RapidAPI key from environment
const leagues = await apiSportsClient.getLeagues()
```

## Endpoints

### Leagues

#### Get Leagues
**Endpoint:** `GET /leagues`

**Parameters:**
- `id` (number, optional) - League ID
- `name` (string, optional) - League name
- `country` (string, optional) - Country name
- `code` (string, optional) - Country code
- `season` (number, optional) - Season year
- `team` (number, optional) - Team ID
- `type` (string, optional) - League type
- `current` (boolean, optional) - Current season only

**Example Request:**
```bash
curl -X GET "https://api-football-v1.p.rapidapi.com/v3/leagues?country=England" \
  -H "X-RapidAPI-Key: YOUR_RAPIDAPI_KEY" \
  -H "X-RapidAPI-Host: api-football-v1.p.rapidapi.com"
```

**Example Response:**
```json
{
  "get": "leagues",
  "parameters": {
    "country": "England"
  },
  "errors": [],
  "results": 5,
  "response": [
    {
      "league": {
        "id": 39,
        "name": "Premier League",
        "type": "League",
        "logo": "https://media.api-sports.io/football/leagues/39.png"
      },
      "country": {
        "name": "England",
        "code": "GB",
        "flag": "https://media.api-sports.io/flags/gb.svg"
      },
      "seasons": [
        {
          "year": 2024,
          "start": "2024-08-17",
          "end": "2025-05-25",
          "current": true
        }
      ]
    }
  ]
}
```

### Teams

#### Get Teams
**Endpoint:** `GET /teams`

**Parameters:**
- `league` (number, optional) - League ID
- `season` (number, optional) - Season year
- `id` (number, optional) - Team ID
- `name` (string, optional) - Team name
- `country` (string, optional) - Country name
- `code` (string, optional) - Country code
- `search` (string, optional) - Search term

**Example Request:**
```bash
curl -X GET "https://api-football-v1.p.rapidapi.com/v3/teams?league=39&season=2024" \
  -H "X-RapidAPI-Key: YOUR_RAPIDAPI_KEY" \
  -H "X-RapidAPI-Host: api-football-v1.p.rapidapi.com"
```

**Example Response:**
```json
{
  "get": "teams",
  "parameters": {
    "league": "39",
    "season": "2024"
  },
  "errors": [],
  "results": 20,
  "response": [
    {
      "team": {
        "id": 33,
        "name": "Manchester United",
        "code": "MUN",
        "country": "England",
        "founded": 1878,
        "national": false,
        "logo": "https://media.api-sports.io/football/teams/33.png"
      },
      "venue": {
        "id": 1,
        "name": "Old Trafford",
        "address": "Sir Matt Busby Way",
        "city": "Manchester",
        "capacity": 74879,
        "surface": "grass",
        "image": "https://media.api-sports.io/football/venues/1.png"
      }
    }
  ]
}
```

### Fixtures (Games)

#### Get Fixtures
**Endpoint:** `GET /fixtures`

**Parameters:**
- `league` (number, optional) - League ID
- `season` (number, optional) - Season year
- `team` (number, optional) - Team ID
- `date` (string, optional) - Date (YYYY-MM-DD)
- `timezone` (string, optional) - Timezone
- `status` (string, optional) - Game status
- `live` (string, optional) - Live games only
- `next` (number, optional) - Next N games
- `last` (number, optional) - Last N games

**Example Request:**
```bash
curl -X GET "https://api-football-v1.p.rapidapi.com/v3/fixtures?league=39&season=2024&date=2024-01-15" \
  -H "X-RapidAPI-Key: YOUR_RAPIDAPI_KEY" \
  -H "X-RapidAPI-Host: api-football-v1.p.rapidapi.com"
```

**Example Response:**
```json
{
  "get": "fixtures",
  "parameters": {
    "league": "39",
    "season": "2024",
    "date": "2024-01-15"
  },
  "errors": [],
  "results": 10,
  "response": [
    {
      "fixture": {
        "id": 1035920,
        "referee": "Michael Oliver",
        "timezone": "UTC",
        "date": "2024-01-15T15:00:00+00:00",
        "timestamp": 1705330800,
        "periods": {
          "first": 1705330800,
          "second": 1705334400
        },
        "venue": {
          "id": 1,
          "name": "Old Trafford",
          "city": "Manchester"
        },
        "status": {
          "long": "Match Finished",
          "short": "FT",
          "elapsed": 90
        }
      },
      "league": {
        "id": 39,
        "name": "Premier League",
        "country": "England",
        "logo": "https://media.api-sports.io/football/leagues/39.png",
        "flag": "https://media.api-sports.io/flags/gb.svg",
        "season": 2024,
        "round": "Regular Season - 21"
      },
      "teams": {
        "home": {
          "id": 33,
          "name": "Manchester United",
          "logo": "https://media.api-sports.io/football/teams/33.png",
          "winner": true
        },
        "away": {
          "id": 50,
          "name": "Manchester City",
          "logo": "https://media.api-sports.io/football/teams/50.png",
          "winner": false
        }
      },
      "goals": {
        "home": 2,
        "away": 1
      },
      "score": {
        "halftime": {
          "home": 1,
          "away": 0
        },
        "fulltime": {
          "home": 2,
          "away": 1
        },
        "extratime": {
          "home": null,
          "away": null
        },
        "penalty": {
          "home": null,
          "away": null
        }
      }
    }
  ]
}
```

### Standings

#### Get Standings
**Endpoint:** `GET /standings`

**Parameters:**
- `league` (number, required) - League ID
- `season` (number, required) - Season year

**Example Request:**
```bash
curl -X GET "https://api-football-v1.p.rapidapi.com/v3/standings?league=39&season=2024" \
  -H "X-RapidAPI-Key: YOUR_RAPIDAPI_KEY" \
  -H "X-RapidAPI-Host: api-football-v1.p.rapidapi.com"
```

**Example Response:**
```json
{
  "get": "standings",
  "parameters": {
    "league": "39",
    "season": "2024"
  },
  "errors": [],
  "results": 1,
  "response": [
    {
      "league": {
        "id": 39,
        "name": "Premier League",
        "country": "England",
        "logo": "https://media.api-sports.io/football/leagues/39.png",
        "flag": "https://media.api-sports.io/flags/gb.svg",
        "season": 2024,
        "standings": [
          [
            {
              "rank": 1,
              "team": {
                "id": 50,
                "name": "Manchester City",
                "logo": "https://media.api-sports.io/football/teams/50.png"
              },
              "points": 45,
              "goalsDiff": 25,
              "group": "Premier League",
              "form": "WWLWW",
              "status": "same",
              "description": "Promotion - Champions League (Group Stage)",
              "all": {
                "played": 20,
                "win": 14,
                "draw": 3,
                "lose": 3,
                "goals": {
                  "for": 45,
                  "against": 20
                }
              },
              "home": {
                "played": 10,
                "win": 8,
                "draw": 1,
                "lose": 1,
                "goals": {
                  "for": 25,
                  "against": 8
                }
              },
              "away": {
                "played": 10,
                "win": 6,
                "draw": 2,
                "lose": 2,
                "goals": {
                  "for": 20,
                  "against": 12
                }
              },
              "update": "2024-01-15T00:00:00+00:00"
            }
          ]
        ]
      }
    }
  ]
}
```

### Team Statistics

#### Get Team Statistics
**Endpoint:** `GET /teams/statistics`

**Parameters:**
- `league` (number, required) - League ID
- `season` (number, required) - Season year
- `team` (number, required) - Team ID

**Example Request:**
```bash
curl -X GET "https://api-football-v1.p.rapidapi.com/v3/teams/statistics?league=39&season=2024&team=33" \
  -H "X-RapidAPI-Key: YOUR_RAPIDAPI_KEY" \
  -H "X-RapidAPI-Host: api-football-v1.p.rapidapi.com"
```

**Example Response:**
```json
{
  "get": "teams/statistics",
  "parameters": {
    "league": "39",
    "season": "2024",
    "team": "33"
  },
  "errors": [],
  "results": 1,
  "response": {
    "league": {
      "id": 39,
      "name": "Premier League",
      "country": "England",
      "logo": "https://media.api-sports.io/football/leagues/39.png",
      "flag": "https://media.api-sports.io/flags/gb.svg",
      "season": 2024
    },
    "team": {
      "id": 33,
      "name": "Manchester United",
      "logo": "https://media.api-sports.io/football/teams/33.png"
    },
    "form": "WWLWW",
    "fixtures": {
      "played": {
        "home": 10,
        "away": 10,
        "total": 20
      },
      "wins": {
        "home": 8,
        "away": 6,
        "total": 14
      },
      "draws": {
        "home": 1,
        "away": 2,
        "total": 3
      },
      "loses": {
        "home": 1,
        "away": 2,
        "total": 3
      }
    },
    "goals": {
      "for": {
        "total": {
          "home": 25,
          "away": 20,
          "total": 45
        },
        "average": {
          "home": "2.5",
          "away": "2.0",
          "total": "2.3"
        },
        "minute": {
          "0-15": {
            "total": 5,
            "percentage": "11.11%"
          },
          "16-30": {
            "total": 8,
            "percentage": "17.78%"
          },
          "31-45": {
            "total": 6,
            "percentage": "13.33%"
          },
          "46-60": {
            "total": 10,
            "percentage": "22.22%"
          },
          "61-75": {
            "total": 8,
            "percentage": "17.78%"
          },
          "76-90": {
            "total": 8,
            "percentage": "17.78%"
          }
        }
      },
      "against": {
        "total": {
          "home": 8,
          "away": 12,
          "total": 20
        },
        "average": {
          "home": "0.8",
          "away": "1.2",
          "total": "1.0"
        },
        "minute": {
          "0-15": {
            "total": 2,
            "percentage": "10.00%"
          },
          "16-30": {
            "total": 3,
            "percentage": "15.00%"
          },
          "31-45": {
            "total": 4,
            "percentage": "20.00%"
          },
          "46-60": {
            "total": 3,
            "percentage": "15.00%"
          },
          "61-75": {
            "total": 4,
            "percentage": "20.00%"
          },
          "76-90": {
            "total": 4,
            "percentage": "20.00%"
          }
        }
      }
    }
  }
}
```

## Rate Limits

### Free Tier
- **Per Minute:** 100 requests
- **Per Month:** 100 requests
- **Concurrent Requests:** 1

### Paid Plans
- **Basic:** 500 requests/month
- **Pro:** 10,000 requests/month
- **Ultra:** 100,000 requests/month

### Rate Limit Headers
```json
{
  "X-RateLimit-Limit": "100",
  "X-RateLimit-Remaining": "95",
  "X-RateLimit-Reset": "1640995200"
}
```

## Error Handling

### Common Error Codes

| Status Code | Description | Solution |
|-------------|-------------|----------|
| 400 | Bad Request | Check request parameters |
| 401 | Unauthorized | Verify RapidAPI key |
| 403 | Forbidden | Check subscription status |
| 404 | Not Found | Verify endpoint URL |
| 429 | Too Many Requests | Upgrade plan or wait |
| 500 | Internal Server Error | Retry request |

### Error Response Format
```json
{
  "get": "fixtures",
  "parameters": {},
  "errors": {
    "timezone": "The timezone field is required."
  },
  "results": 0,
  "response": []
}
```

## Code Examples

### TypeScript Integration
```typescript
import { apiSportsClient } from '@/lib/sports-apis'

// Get Premier League teams
async function getPremierLeagueTeams() {
  try {
    const teams = await apiSportsClient.getTeams(39, 2024) // Premier League ID: 39
    
    return teams.response.map(team => ({
      id: team.team.id,
      name: team.team.name,
      code: team.team.code,
      country: team.team.country,
      founded: team.team.founded,
      logo: team.team.logo,
      venue: {
        name: team.venue.name,
        city: team.venue.city,
        capacity: team.venue.capacity
      }
    }))
  } catch (error) {
    console.error('Failed to fetch teams:', error)
    throw error
  }
}

// Get fixtures for a specific date
async function getFixturesForDate(date: string) {
  try {
    const fixtures = await apiSportsClient.getFixtures({
      league: 39, // Premier League
      season: 2024,
      date: date
    })
    
    return fixtures.response.map(fixture => ({
      id: fixture.fixture.id,
      homeTeam: fixture.teams.home.name,
      awayTeam: fixture.teams.away.name,
      homeScore: fixture.goals.home,
      awayScore: fixture.goals.away,
      date: fixture.fixture.date,
      status: fixture.fixture.status.short,
      venue: fixture.fixture.venue.name
    }))
  } catch (error) {
    console.error('Failed to fetch fixtures:', error)
    throw error
  }
}

// Get league standings
async function getLeagueStandings(leagueId: number, season: number) {
  try {
    const standings = await apiSportsClient.getStandings(leagueId, season)
    
    return standings.response[0].league.standings[0].map(team => ({
      rank: team.rank,
      teamName: team.team.name,
      teamLogo: team.team.logo,
      points: team.points,
      goalsDiff: team.goalsDiff,
      form: team.form,
      played: team.all.played,
      wins: team.all.win,
      draws: team.all.draw,
      losses: team.all.lose,
      goalsFor: team.all.goals.for,
      goalsAgainst: team.all.goals.against
    }))
  } catch (error) {
    console.error('Failed to fetch standings:', error)
    throw error
  }
}
```

### JavaScript Example
```javascript
// Using fetch directly
async function fetchApiSportsData(endpoint, params = {}) {
  const apiKey = process.env.RAPIDAPI_KEY
  const baseUrl = 'https://api-football-v1.p.rapidapi.com/v3'
  
  const queryString = new URLSearchParams(params).toString()
  const url = `${baseUrl}${endpoint}?${queryString}`
  
  try {
    const response = await fetch(url, {
      headers: {
        'X-RapidAPI-Key': apiKey,
        'X-RapidAPI-Host': 'api-football-v1.p.rapidapi.com',
        'Accept': 'application/json'
      }
    })
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    
    const data = await response.json()
    
    // Check for API errors
    if (data.errors && Object.keys(data.errors).length > 0) {
      throw new Error(`API Error: ${JSON.stringify(data.errors)}`)
    }
    
    return data
  } catch (error) {
    console.error('API request failed:', error)
    throw error
  }
}

// Usage
const leagues = await fetchApiSportsData('/leagues', {
  country: 'England'
})
```

## Best Practices

### 1. Subscription Management
Monitor your API usage to avoid hitting limits:
```typescript
class ApiSportsUsageTracker {
  private usage: Map<string, number> = new Map()
  
  async trackRequest(endpoint: string) {
    const current = this.usage.get(endpoint) || 0
    this.usage.set(endpoint, current + 1)
    
    // Log usage for monitoring
    console.log(`API-Sports usage for ${endpoint}: ${current + 1}`)
  }
  
  getUsageStats() {
    return Object.fromEntries(this.usage)
  }
}
```

### 2. Error Handling with Retry
```typescript
async function safeApiSportsCall<T>(
  apiCall: () => Promise<T>,
  maxRetries: number = 3
): Promise<T | null> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await apiCall()
    } catch (error) {
      if (error.status === 429) {
        const retryAfter = error.headers?.['Retry-After'] || 60
        console.warn(`Rate limit exceeded, waiting ${retryAfter}s`)
        await new Promise(resolve => setTimeout(resolve, retryAfter * 1000))
        continue
      }
      
      if (i === maxRetries - 1) {
        console.error('Max retries exceeded:', error)
        return null
      }
      
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i)))
    }
  }
  
  return null
}
```

### 3. Data Caching
```typescript
import { getCache, setCache } from '@/lib/redis'

async function getCachedLeagues(country: string) {
  const cacheKey = `apisports-leagues-${country}`
  const cached = await getCache(cacheKey)
  
  if (cached) {
    return cached
  }
  
  const leagues = await apiSportsClient.getLeagues({ country })
  await setCache(cacheKey, leagues, 3600) // Cache for 1 hour
  
  return leagues
}
```

### 4. Data Validation
```typescript
function validateFixtureData(fixture: any): boolean {
  return (
    fixture.fixture?.id &&
    fixture.teams?.home?.name &&
    fixture.teams?.away?.name &&
    fixture.fixture?.date &&
    typeof fixture.goals?.home === 'number' &&
    typeof fixture.goals?.away === 'number'
  )
}

const fixtures = await apiSportsClient.getFixtures({ league: 39 })
const validFixtures = fixtures.response.filter(validateFixtureData)
```

## Integration with ApexBets

The RapidAPI (API-Sports) is integrated into the ApexBets system as a fallback data source for multi-sport data. It's used in the following services:

- **FootballService** - Primary data source for soccer/football data
- **MultiSportService** - Fallback for other sports when primary APIs fail
- **StandingsService** - League standings and rankings
- **TeamService** - Team information and statistics

The API is configured with automatic retry logic, rate limiting, and circuit breaker patterns to ensure reliable data access even under high load.
