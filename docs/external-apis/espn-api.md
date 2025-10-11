# ESPN API Documentation

## Overview

ESPN provides free sports data through their public API endpoints. While not
officially documented, ESPN's API endpoints are widely used and provide
comprehensive data for multiple sports including NBA, NFL, MLB, NHL, and college
sports.

**Base URL:** `http://site.api.espn.com/apis/site/v2/sports`  
**Documentation:** Unofficial - endpoints discovered through network analysis  
**Rate Limit:** No official limit, but conservative usage recommended  
**Cost:** Free (no API key required)

## Authentication

### No Authentication Required

ESPN's API doesn't require authentication or API keys, making it accessible for
developers.

### Usage in Code

```typescript
import { espnClient } from '@/lib/sports-apis'

// The client handles all requests automatically
const games = await espnClient.getGames('basketball', 'nba')
```

## Endpoints

### Scoreboard

#### Get Scoreboard

**Endpoint:** `GET /{sport}/{league}/scoreboard`

**Parameters:**

- `sport` (string, required) - Sport name (e.g., "basketball", "football")
- `league` (string, required) - League name (e.g., "nba", "nfl")
- `dates` (string, optional) - Date in YYYYMMDD format
- `limit` (number, optional) - Number of games to return

**Example Request:**

```bash
curl -X GET "http://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard?dates=20240115"
```

**Example Response:**

```json
{
  "leagues": [
    {
      "id": "28",
      "uid": "s:28",
      "name": "National Basketball Association",
      "abbreviation": "NBA",
      "slug": "nba",
      "season": {
        "year": 2024,
        "startDate": "2024-10-22T00:00:00.000Z",
        "endDate": "2025-04-13T23:59:59.999Z",
        "displayName": "2024-25",
        "type": {
          "id": "1",
          "type": 1,
          "name": "Regular Season"
        }
      },
      "logos": [
        {
          "href": "https://a.espncdn.com/i/leaguelogos/basketball/nba/500/nba.png",
          "width": 500,
          "height": 500,
          "alt": "",
          "rel": ["full", "default"]
        }
      ]
    }
  ],
  "season": {
    "year": 2024,
    "startDate": "2024-10-22T00:00:00.000Z",
    "endDate": "2025-04-13T23:59:59.999Z",
    "displayName": "2024-25",
    "type": {
      "id": "1",
      "type": 1,
      "name": "Regular Season"
    }
  },
  "day": {
    "date": "2024-01-15T00:00:00.000Z"
  },
  "events": [
    {
      "id": "401585401",
      "uid": "s:28~g:401585401",
      "date": "2024-01-15T20:00:00.000Z",
      "name": "Boston Celtics at Los Angeles Lakers",
      "shortName": "BOS @ LAL",
      "season": {
        "year": 2024,
        "displayName": "2024-25",
        "startDate": "2024-10-22T00:00:00.000Z",
        "endDate": "2025-04-13T23:59:59.999Z",
        "type": {
          "id": "1",
          "type": 1,
          "name": "Regular Season"
        }
      },
      "competitions": [
        {
          "id": "401585401",
          "uid": "s:28~g:401585401",
          "date": "2024-01-15T20:00:00.000Z",
          "attendance": 19068,
          "type": {
            "id": "1",
            "abbreviation": "STD"
          },
          "timeValid": true,
          "neutralSite": false,
          "conferenceCompetition": false,
          "playByPlayAvailable": true,
          "recent": false,
          "venue": {
            "id": "3932",
            "fullName": "Crypto.com Arena",
            "address": {
              "city": "Los Angeles",
              "state": "CA"
            },
            "grass": false,
            "indoor": true
          },
          "competitors": [
            {
              "id": "2",
              "uid": "s:28~t:2",
              "type": "team",
              "order": 0,
              "homeAway": "away",
              "winner": false,
              "team": {
                "id": "2",
                "uid": "s:28~t:2",
                "location": "Boston",
                "name": "Celtics",
                "abbreviation": "BOS",
                "displayName": "Boston Celtics",
                "shortDisplayName": "Celtics",
                "color": "007A33",
                "alternateColor": "BA9653",
                "isActive": true,
                "venue": {
                  "id": "3930"
                },
                "links": [
                  {
                    "language": "en-US",
                    "rel": ["clubhouse", "desktop", "team"],
                    "href": "https://www.espn.com/nba/team/_/name/bos/boston-celtics",
                    "text": "Clubhouse"
                  }
                ],
                "logo": "https://a.espncdn.com/i/teamlogos/nba/500/bos.png"
              },
              "score": "108",
              "linescores": [
                {
                  "value": 22
                },
                {
                  "value": 25
                },
                {
                  "value": 28
                },
                {
                  "value": 33
                }
              ],
              "statistics": [],
              "records": [
                {
                  "name": "overall",
                  "abbreviation": "Overall",
                  "type": "total",
                  "summary": "20-20"
                },
                {
                  "name": "home",
                  "abbreviation": "Home",
                  "type": "home",
                  "summary": "10-10"
                },
                {
                  "name": "road",
                  "abbreviation": "Road",
                  "type": "road",
                  "summary": "10-10"
                }
              ]
            },
            {
              "id": "13",
              "uid": "s:28~t:13",
              "type": "team",
              "order": 1,
              "homeAway": "home",
              "winner": true,
              "team": {
                "id": "13",
                "uid": "s:28~t:13",
                "location": "Los Angeles",
                "name": "Lakers",
                "abbreviation": "LAL",
                "displayName": "Los Angeles Lakers",
                "shortDisplayName": "Lakers",
                "color": "552583",
                "alternateColor": "FDB927",
                "isActive": true,
                "venue": {
                  "id": "3932"
                },
                "links": [
                  {
                    "language": "en-US",
                    "rel": ["clubhouse", "desktop", "team"],
                    "href": "https://www.espn.com/nba/team/_/name/lal/los-angeles-lakers",
                    "text": "Clubhouse"
                  }
                ],
                "logo": "https://a.espncdn.com/i/teamlogos/nba/500/lal.png"
              },
              "score": "112",
              "linescores": [
                {
                  "value": 28
                },
                {
                  "value": 30
                },
                {
                  "value": 25
                },
                {
                  "value": 29
                }
              ],
              "statistics": [],
              "records": [
                {
                  "name": "overall",
                  "abbreviation": "Overall",
                  "type": "total",
                  "summary": "25-15"
                },
                {
                  "name": "home",
                  "abbreviation": "Home",
                  "type": "home",
                  "summary": "15-5"
                },
                {
                  "name": "road",
                  "abbreviation": "Road",
                  "type": "road",
                  "summary": "10-10"
                }
              ]
            }
          ],
          "notes": [],
          "status": {
            "clock": 0,
            "displayClock": "0:00",
            "period": 4,
            "type": {
              "id": "3",
              "name": "STATUS_FINAL",
              "state": "post",
              "completed": true,
              "description": "Final",
              "detail": "Final",
              "shortDetail": "Final"
            }
          },
          "broadcasts": [
            {
              "market": "national",
              "names": ["TNT"]
            }
          ],
          "leaders": [
            {
              "displayName": "Leaders",
              "leaders": [
                {
                  "displayValue": "25 PTS, 7 REB, 8 AST",
                  "value": 25,
                  "athlete": {
                    "id": "3202",
                    "fullName": "LeBron James",
                    "displayName": "LeBron James",
                    "shortName": "L. James",
                    "links": [
                      {
                        "language": "en-US",
                        "rel": ["stats", "desktop", "athlete"],
                        "href": "https://www.espn.com/nba/player/_/id/3202/lebron-james",
                        "text": "View Profile"
                      }
                    ],
                    "headshot": "https://a.espncdn.com/i/headshots/nba/players/full/3202.png",
                    "jersey": "23",
                    "position": {
                      "abbreviation": "SF"
                    },
                    "team": {
                      "id": "13"
                    }
                  },
                  "team": {
                    "id": "13"
                  }
                }
              ]
            }
          ]
        }
      ],
      "links": [
        {
          "language": "en-US",
          "rel": ["event", "desktop", "gamecenter"],
          "href": "https://www.espn.com/nba/game/_/gameId/401585401",
          "text": "Gamecast"
        }
      ],
      "weather": {
        "displayValue": "Indoor",
        "temperature": 72,
        "highTemperature": 72,
        "conditionId": "indoor",
        "link": {
          "language": "en-US",
          "rel": ["weather", "desktop"],
          "href": "https://www.espn.com/nba/game/_/gameId/401585401",
          "text": "Weather"
        }
      }
    }
  ]
}
```

### Standings

#### Get Standings

**Endpoint:** `GET /{sport}/{league}/standings`

**Parameters:**

- `sport` (string, required) - Sport name
- `league` (string, required) - League name
- `season` (string, optional) - Season year
- `group` (string, optional) - Group type (e.g., "conference", "division")

**Example Request:**

```bash
curl -X GET "http://site.api.espn.com/apis/site/v2/sports/basketball/nba/standings"
```

**Example Response:**

```json
{
  "name": "NBA Standings",
  "season": {
    "year": 2024,
    "displayName": "2024-25",
    "startDate": "2024-10-22T00:00:00.000Z",
    "endDate": "2025-04-13T23:59:59.999Z",
    "type": {
      "id": "1",
      "type": 1,
      "name": "Regular Season"
    }
  },
  "children": [
    {
      "id": "1",
      "name": "Eastern Conference",
      "abbreviation": "EAST",
      "standings": {
        "entries": [
          {
            "team": {
              "id": "2",
              "uid": "s:28~t:2",
              "location": "Boston",
              "name": "Celtics",
              "abbreviation": "BOS",
              "displayName": "Boston Celtics",
              "shortDisplayName": "Celtics",
              "color": "007A33",
              "alternateColor": "BA9653",
              "isActive": true,
              "logo": "https://a.espncdn.com/i/teamlogos/nba/500/bos.png"
            },
            "stats": [
              {
                "name": "gamesPlayed",
                "displayName": "Games Played",
                "shortDisplayName": "GP",
                "description": "Games Played",
                "abbreviation": "GP",
                "type": "integer",
                "value": 40,
                "displayValue": "40"
              },
              {
                "name": "wins",
                "displayName": "Wins",
                "shortDisplayName": "W",
                "description": "Wins",
                "abbreviation": "W",
                "type": "integer",
                "value": 25,
                "displayValue": "25"
              },
              {
                "name": "losses",
                "displayName": "Losses",
                "shortDisplayName": "L",
                "description": "Losses",
                "abbreviation": "L",
                "type": "integer",
                "value": 15,
                "displayValue": "15"
              },
              {
                "name": "winPercent",
                "displayName": "Win Percentage",
                "shortDisplayName": "PCT",
                "description": "Win Percentage",
                "abbreviation": "PCT",
                "type": "percentage",
                "value": 0.625,
                "displayValue": ".625"
              }
            ]
          }
        ]
      }
    }
  ]
}
```

### Teams

#### Get Teams

**Endpoint:** `GET /{sport}/{league}/teams`

**Parameters:**

- `sport` (string, required) - Sport name
- `league` (string, required) - League name
- `limit` (number, optional) - Number of teams to return

**Example Request:**

```bash
curl -X GET "http://site.api.espn.com/apis/site/v2/sports/basketball/nba/teams"
```

**Example Response:**

```json
{
  "sports": [
    {
      "id": "28",
      "uid": "s:28",
      "name": "Basketball",
      "slug": "basketball",
      "leagues": [
        {
          "id": "28",
          "uid": "s:28",
          "name": "National Basketball Association",
          "abbreviation": "NBA",
          "slug": "nba",
          "teams": [
            {
              "id": "2",
              "uid": "s:28~t:2",
              "slug": "boston-celtics",
              "abbreviation": "BOS",
              "displayName": "Boston Celtics",
              "shortDisplayName": "Celtics",
              "name": "Celtics",
              "location": "Boston",
              "color": "007A33",
              "alternateColor": "BA9653",
              "isActive": true,
              "isAllStar": false,
              "logos": [
                {
                  "href": "https://a.espncdn.com/i/teamlogos/nba/500/bos.png",
                  "width": 500,
                  "height": 500,
                  "alt": "",
                  "rel": ["full", "default"]
                }
              ],
              "links": [
                {
                  "language": "en-US",
                  "rel": ["clubhouse", "desktop", "team"],
                  "href": "https://www.espn.com/nba/team/_/name/bos/boston-celtics",
                  "text": "Clubhouse"
                }
              ]
            }
          ]
        }
      ]
    }
  ]
}
```

## Rate Limits

### Recommended Limits

- **Per Minute:** 60 requests (conservative)
- **Per Hour:** 1000 requests
- **Per Day:** 10000 requests

### Rate Limit Handling

```typescript
// Conservative rate limiting for ESPN API
const rateLimits = {
  requestsPerMinute: 60,
  requestsPerHour: 1000,
  requestsPerDay: 10000,
}
```

## Error Handling

### Common Error Codes

| Status Code | Description           | Solution                 |
| ----------- | --------------------- | ------------------------ |
| 200         | Success               | Request successful       |
| 400         | Bad Request           | Check request parameters |
| 404         | Not Found             | Verify endpoint URL      |
| 429         | Too Many Requests     | Reduce request frequency |
| 500         | Internal Server Error | Retry request            |

### Error Response Format

```json
{
  "error": "Invalid request",
  "message": "The requested resource was not found"
}
```

## Code Examples

### TypeScript Integration

```typescript
import { espnClient } from '@/lib/sports-apis'

// Get NBA scoreboard
async function getNBAScoreboard(date?: string) {
  try {
    const scoreboard = await espnClient.getScoreboard('basketball', 'nba', date)

    return scoreboard.events.map(event => ({
      id: event.id,
      homeTeam: event.competitions[0].competitors.find(
        c => c.homeAway === 'home'
      )?.team,
      awayTeam: event.competitions[0].competitors.find(
        c => c.homeAway === 'away'
      )?.team,
      homeScore: event.competitions[0].competitors.find(
        c => c.homeAway === 'home'
      )?.score,
      awayScore: event.competitions[0].competitors.find(
        c => c.homeAway === 'away'
      )?.score,
      date: event.date,
      status: event.competitions[0].status.type.description,
      venue: event.competitions[0].venue?.fullName,
    }))
  } catch (error) {
    console.error('Failed to fetch NBA scoreboard:', error)
    throw error
  }
}

// Get NBA standings
async function getNBAStandings() {
  try {
    const standings = await espnClient.getStandings('basketball', 'nba')

    return standings.children.map(conference => ({
      conference: conference.name,
      teams: conference.standings.entries.map(entry => ({
        team: entry.team,
        gamesPlayed: entry.stats.find(s => s.name === 'gamesPlayed')?.value,
        wins: entry.stats.find(s => s.name === 'wins')?.value,
        losses: entry.stats.find(s => s.name === 'losses')?.value,
        winPercentage: entry.stats.find(s => s.name === 'winPercent')?.value,
      })),
    }))
  } catch (error) {
    console.error('Failed to fetch NBA standings:', error)
    throw error
  }
}

// Get NBA teams
async function getNBATeams() {
  try {
    const teams = await espnClient.getTeams('basketball', 'nba')

    return teams.sports[0].leagues[0].teams.map(team => ({
      id: team.id,
      name: team.displayName,
      abbreviation: team.abbreviation,
      location: team.location,
      color: team.color,
      alternateColor: team.alternateColor,
      logo: team.logos[0]?.href,
      isActive: team.isActive,
    }))
  } catch (error) {
    console.error('Failed to fetch NBA teams:', error)
    throw error
  }
}
```

### JavaScript Example

```javascript
// Using fetch directly
async function fetchESPNData(endpoint, params = {}) {
  const baseUrl = 'http://site.api.espn.com/apis/site/v2/sports'

  const queryString = new URLSearchParams(params).toString()
  const url = `${baseUrl}${endpoint}?${queryString}`

  try {
    const response = await fetch(url, {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'ApexBets/1.0.0',
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()

    // Check for empty responses
    if (!data || (data.events && data.events.length === 0)) {
      throw new Error('No data returned from ESPN API')
    }

    return data
  } catch (error) {
    console.error('ESPN API request failed:', error)
    throw error
  }
}

// Usage
const scoreboard = await fetchESPNData('/basketball/nba/scoreboard', {
  dates: '20240115',
})
```

## Best Practices

### 1. Headers and User-Agent

Always include proper headers to avoid being blocked:

```typescript
const headers = {
  Accept: 'application/json',
  'User-Agent': 'ApexBets/1.0.0',
  Referer: 'https://www.espn.com/',
}
```

### 2. Data Validation

Always validate responses as ESPN API can return empty data:

```typescript
function validateESPNEvent(event: any): boolean {
  return (
    event.id &&
    event.competitions &&
    event.competitions.length > 0 &&
    event.competitions[0].competitors &&
    event.competitions[0].competitors.length === 2
  )
}

const events = await espnClient.getScoreboard('basketball', 'nba')
const validEvents = events.events?.filter(validateESPNEvent) || []
```

### 3. Error Handling with Retry

```typescript
async function safeESPNCall<T>(
  apiCall: () => Promise<T>,
  maxRetries: number = 3
): Promise<T | null> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await apiCall()
    } catch (error) {
      if (error.status === 429) {
        const delay = Math.pow(2, i) * 1000 // Exponential backoff
        console.warn(`Rate limit exceeded, waiting ${delay}ms`)
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

async function getCachedESPNData(endpoint: string, params: any) {
  const cacheKey = `espn-${endpoint}-${JSON.stringify(params)}`
  const cached = await getCache(cacheKey)

  if (cached) {
    return cached
  }

  const data = await espnClient.request(endpoint, params)
  await setCache(cacheKey, data, 300) // Cache for 5 minutes

  return data
}
```

## Integration with ApexBets

The ESPN API is integrated into the ApexBets system as a reliable fallback data
source. It's used in the following services:

- **BasketballService** - Fallback for NBA data when primary APIs fail
- **FootballService** - Fallback for NFL data
- **BaseballService** - Fallback for MLB data
- **HockeyService** - Fallback for NHL data
- **StandingsService** - League standings and rankings

The API is configured with conservative rate limiting, proper headers, and
robust error handling to ensure reliable data access while being respectful to
ESPN's servers.
