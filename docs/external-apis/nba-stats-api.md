# NBA Stats API Documentation

## Overview

The NBA Stats API is the official API provided by the NBA for accessing comprehensive basketball data. It's completely free and provides the most accurate and up-to-date NBA statistics, player information, and game data.

**Base URL:** `https://stats.nba.com/stats`  
**Documentation:** https://stats.nba.com/stats/  
**Rate Limit:** No official limit, but 100 requests/minute recommended  
**Cost:** Free (no API key required)

## Authentication

### No Authentication Required
The NBA Stats API doesn't require authentication or API keys, making it very accessible for developers.

### Usage in Code
```typescript
import { nbaStatsClient } from '@/lib/sports-apis'

// The client handles all requests automatically
const players = await nbaStatsClient.getPlayers()
```

## Endpoints

### Players

#### Get All Players
**Endpoint:** `GET /commonallplayers`

**Parameters:**
- `LeagueID` (string, optional) - League ID (default: "00" for NBA)
- `Season` (string, optional) - Season (e.g., "2024-25")
- `IsOnlyCurrentSeason` (string, optional) - "1" for current season only

**Example Request:**
```bash
curl -X GET "https://stats.nba.com/stats/commonallplayers?LeagueID=00&Season=2024-25&IsOnlyCurrentSeason=1"
```

**Example Response:**
```json
{
  "resource": "commonallplayers",
  "parameters": {
    "LeagueID": "00",
    "Season": "2024-25",
    "IsOnlyCurrentSeason": "1"
  },
  "resultSets": [
    {
      "name": "CommonAllPlayers",
      "headers": [
        "PERSON_ID",
        "DISPLAY_LAST_COMMA_FIRST",
        "DISPLAY_FIRST_LAST",
        "ROSTERSTATUS",
        "FROM_YEAR",
        "TO_YEAR",
        "PLAYERCODE",
        "TEAM_ID",
        "TEAM_CITY",
        "TEAM_NAME",
        "TEAM_ABBREVIATION",
        "JERSEY_NUMBER",
        "POSITION",
        "HEIGHT",
        "WEIGHT",
        "BIRTHDATE",
        "AGE",
        "EXP",
        "SCHOOL",
        "COUNTRY"
      ],
      "rowSet": [
        [
          2544,
          "James, LeBron",
          "LeBron James",
          "Active",
          "2003",
          "2025",
          "lebron_james",
          1610612747,
          "Los Angeles",
          "Lakers",
          "LAL",
          "23",
          "F",
          "6-9",
          "250",
          "1984-12-30T00:00:00",
          39,
          "21",
          "St. Vincent-St. Mary HS",
          "USA"
        ]
      ]
    }
  ]
}
```

### Teams

#### Get All Teams
**Endpoint:** `GET /commonteaminfo`

**Parameters:**
- `LeagueID` (string, optional) - League ID (default: "00" for NBA)
- `Season` (string, optional) - Season (e.g., "2024-25")
- `TeamID` (string, optional) - Specific team ID

**Example Request:**
```bash
curl -X GET "https://stats.nba.com/stats/commonteaminfo?LeagueID=00&Season=2024-25"
```

**Example Response:**
```json
{
  "resource": "commonteaminfo",
  "parameters": {
    "LeagueID": "00",
    "Season": "2024-25"
  },
  "resultSets": [
    {
      "name": "TeamInfoCommon",
      "headers": [
        "TEAM_ID",
        "SEASON_ID",
        "LEAGUE_ID",
        "TEAM_NAME",
        "TEAM_ABBREVIATION",
        "TEAM_CONFERENCE",
        "TEAM_DIVISION",
        "TEAM_CITY",
        "TEAM_STATE",
        "YEAR_FOUNDED"
      ],
      "rowSet": [
        [
          1610612747,
          "22024",
          "00",
          "Lakers",
          "LAL",
          "Western",
          "Pacific",
          "Los Angeles",
          "California",
          1947
        ]
      ]
    }
  ]
}
```

### Games

#### Get Scoreboard
**Endpoint:** `GET /scoreboard`

**Parameters:**
- `GameDate` (string, optional) - Date in MM/DD/YYYY format
- `LeagueID` (string, optional) - League ID (default: "00" for NBA)

**Example Request:**
```bash
curl -X GET "https://stats.nba.com/stats/scoreboard?GameDate=01/15/2024&LeagueID=00"
```

**Example Response:**
```json
{
  "resource": "scoreboard",
  "parameters": {
    "GameDate": "01/15/2024",
    "LeagueID": "00"
  },
  "resultSets": [
    {
      "name": "GameHeader",
      "headers": [
        "GAME_DATE_EST",
        "GAME_SEQUENCE",
        "GAME_ID",
        "GAME_STATUS_ID",
        "GAME_STATUS_TEXT",
        "GAME_CODE",
        "HOME_TEAM_ID",
        "VISITOR_TEAM_ID",
        "SEASON",
        "LIVE_PERIOD",
        "LIVE_PC_TIME",
        "NATL_TV_BROADCASTER_ABBREVIATION",
        "LIVE_PERIOD_TIME_BCAST",
        "WH_STATUS",
        "WH_STATUS_TEXT"
      ],
      "rowSet": [
        [
          "2024-01-15T00:00:00",
          1,
          "0022400123",
          3,
          "Final",
          "20240115/LALBOS",
          1610612747,
          1610612738,
          "2024-25",
          4,
          "",
          "TNT",
          "",
          1,
          "Final"
        ]
      ]
    },
    {
      "name": "LineScore",
      "headers": [
        "GAME_DATE_EST",
        "GAME_SEQUENCE",
        "GAME_ID",
        "TEAM_ID",
        "TEAM_ABBREVIATION",
        "TEAM_CITY_NAME",
        "TEAM_NAME",
        "TEAM_WINS_LOSSES",
        "PTS_QTR1",
        "PTS_QTR2",
        "PTS_QTR3",
        "PTS_QTR4",
        "PTS_OT1",
        "PTS_OT2",
        "PTS_OT3",
        "PTS_OT4",
        "PTS_OT5",
        "PTS_OT6",
        "PTS_OT7",
        "PTS_OT8",
        "PTS_OT9",
        "PTS_OT10",
        "PTS",
        "FG_PCT",
        "FT_PCT",
        "FG3_PCT",
        "AST",
        "REB",
        "TOV"
      ],
      "rowSet": [
        [
          "2024-01-15T00:00:00",
          1,
          "0022400123",
          1610612747,
          "LAL",
          "Los Angeles",
          "Lakers",
          "25-15",
          28,
          30,
          25,
          29,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          112,
          0.524,
          0.756,
          0.389,
          25,
          45,
          12
        ],
        [
          "2024-01-15T00:00:00",
          1,
          "0022400123",
          1610612738,
          "BOS",
          "Boston",
          "Celtics",
          "20-20",
          22,
          25,
          28,
          33,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          108,
          0.458,
          0.667,
          0.333,
          22,
          38,
          15
        ]
      ]
    }
  ]
}
```

### Player Statistics

#### Get Player Game Log
**Endpoint:** `GET /playergamelog`

**Parameters:**
- `PlayerID` (string, required) - Player ID
- `Season` (string, optional) - Season (e.g., "2024-25")
- `SeasonType` (string, optional) - "Regular Season", "Playoffs", "Pre Season"

**Example Request:**
```bash
curl -X GET "https://stats.nba.com/stats/playergamelog?PlayerID=2544&Season=2024-25&SeasonType=Regular%20Season"
```

**Example Response:**
```json
{
  "resource": "playergamelog",
  "parameters": {
    "PlayerID": "2544",
    "Season": "2024-25",
    "SeasonType": "Regular Season"
  },
  "resultSets": [
    {
      "name": "PlayerGameLog",
      "headers": [
        "SEASON_ID",
        "Player_ID",
        "Game_ID",
        "GAME_DATE",
        "MATCHUP",
        "WL",
        "MIN",
        "FGM",
        "FGA",
        "FG_PCT",
        "FG3M",
        "FG3A",
        "FG3_PCT",
        "FTM",
        "FTA",
        "FT_PCT",
        "OREB",
        "DREB",
        "REB",
        "AST",
        "STL",
        "BLK",
        "TOV",
        "PF",
        "PTS",
        "PLUS_MINUS"
      ],
      "rowSet": [
        [
          "22024",
          2544,
          "0022400123",
          "2024-01-15T00:00:00",
          "LAL vs. BOS",
          "W",
          35,
          10,
          18,
          0.556,
          3,
          7,
          0.429,
          2,
          3,
          0.667,
          2,
          5,
          7,
          8,
          2,
          1,
          3,
          2,
          25,
          5
        ]
      ]
    }
  ]
}
```

### Team Statistics

#### Get Team Dashboard
**Endpoint:** `GET /teamdashboardbygeneralsplits`

**Parameters:**
- `TeamID` (string, required) - Team ID
- `Season` (string, optional) - Season (e.g., "2024-25")
- `SeasonType` (string, optional) - "Regular Season", "Playoffs", "Pre Season"

**Example Request:**
```bash
curl -X GET "https://stats.nba.com/stats/teamdashboardbygeneralsplits?TeamID=1610612747&Season=2024-25&SeasonType=Regular%20Season"
```

**Example Response:**
```json
{
  "resource": "teamdashboardbygeneralsplits",
  "parameters": {
    "TeamID": "1610612747",
    "Season": "2024-25",
    "SeasonType": "Regular Season"
  },
  "resultSets": [
    {
      "name": "Overall",
      "headers": [
        "GROUP_SET",
        "GROUP_VALUE",
        "GP",
        "W",
        "L",
        "W_PCT",
        "MIN",
        "FGM",
        "FGA",
        "FG_PCT",
        "FG3M",
        "FG3A",
        "FG3_PCT",
        "FTM",
        "FTA",
        "FT_PCT",
        "OREB",
        "DREB",
        "REB",
        "AST",
        "TOV",
        "STL",
        "BLK",
        "BLKA",
        "PF",
        "PFD",
        "PTS",
        "PLUS_MINUS"
      ],
      "rowSet": [
        [
          "Overall",
          "",
          40,
          25,
          15,
          0.625,
          2400,
          45,
          90,
          0.500,
          12,
          35,
          0.343,
          18,
          25,
          0.720,
          10,
          35,
          45,
          25,
          12,
          8,
          5,
          3,
          20,
          18,
          120,
          5
        ]
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

### Rate Limit Handling
```typescript
// Conservative rate limiting for NBA Stats API
const rateLimits = {
  requestsPerMinute: 100,
  requestsPerHour: 1000,
  requestsPerDay: 10000
}
```

## Error Handling

### Common Error Codes

| Status Code | Description | Solution |
|-------------|-------------|----------|
| 200 | Success | Request successful |
| 400 | Bad Request | Check request parameters |
| 404 | Not Found | Verify endpoint URL |
| 429 | Too Many Requests | Reduce request frequency |
| 500 | Internal Server Error | Retry request |

### Error Response Format
```json
{
  "resource": "endpoint",
  "parameters": {},
  "resultSets": []
}
```

## Code Examples

### TypeScript Integration
```typescript
import { nbaStatsClient } from '@/lib/sports-apis'

// Get all NBA players
async function getNBAPlayers() {
  try {
    const players = await nbaStatsClient.getPlayers()
    
    return players.resultSets[0].rowSet.map(player => ({
      id: player[0], // PERSON_ID
      name: player[2], // DISPLAY_FIRST_LAST
      team: player[9], // TEAM_NAME
      teamAbbreviation: player[11], // TEAM_ABBREVIATION
      position: player[12], // POSITION
      height: player[13], // HEIGHT
      weight: player[14], // WEIGHT
      age: player[17], // AGE
      experience: player[18], // EXP
      school: player[19], // SCHOOL
      country: player[20] // COUNTRY
    }))
  } catch (error) {
    console.error('Failed to fetch NBA players:', error)
    throw error
  }
}

// Get team information
async function getNBATeams() {
  try {
    const teams = await nbaStatsClient.getTeams()
    
    return teams.resultSets[0].rowSet.map(team => ({
      id: team[0], // TEAM_ID
      name: team[3], // TEAM_NAME
      abbreviation: team[4], // TEAM_ABBREVIATION
      conference: team[5], // TEAM_CONFERENCE
      division: team[6], // TEAM_DIVISION
      city: team[7], // TEAM_CITY
      state: team[8], // TEAM_STATE
      founded: team[9] // YEAR_FOUNDED
    }))
  } catch (error) {
    console.error('Failed to fetch NBA teams:', error)
    throw error
  }
}

// Get games for a specific date
async function getGamesForDate(date: string) {
  try {
    const games = await nbaStatsClient.getScoreboard(date)
    
    const gameHeaders = games.resultSets[0].rowSet
    const lineScores = games.resultSets[1].rowSet
    
    return gameHeaders.map(game => {
      const homeTeam = lineScores.find(score => score[3] === game[6]) // HOME_TEAM_ID
      const awayTeam = lineScores.find(score => score[3] === game[7]) // VISITOR_TEAM_ID
      
      return {
        id: game[2], // GAME_ID
        date: game[0], // GAME_DATE_EST
        status: game[4], // GAME_STATUS_TEXT
        homeTeam: {
          id: homeTeam[3], // TEAM_ID
          name: homeTeam[6], // TEAM_NAME
          abbreviation: homeTeam[4], // TEAM_ABBREVIATION
          score: homeTeam[23] // PTS
        },
        awayTeam: {
          id: awayTeam[3], // TEAM_ID
          name: awayTeam[6], // TEAM_NAME
          abbreviation: awayTeam[4], // TEAM_ABBREVIATION
          score: awayTeam[23] // PTS
        }
      }
    })
  } catch (error) {
    console.error('Failed to fetch NBA games:', error)
    throw error
  }
}

// Get player statistics
async function getPlayerStats(playerId: string, season: string = '2024-25') {
  try {
    const stats = await nbaStatsClient.getPlayerGameLog(playerId, season)
    
    return stats.resultSets[0].rowSet.map(game => ({
      gameId: game[2], // Game_ID
      date: game[3], // GAME_DATE
      matchup: game[4], // MATCHUP
      result: game[5], // WL
      minutes: game[6], // MIN
      points: game[24], // PTS
      rebounds: game[18], // REB
      assists: game[19], // AST
      steals: game[20], // STL
      blocks: game[21], // BLK
      turnovers: game[22], // TOV
      fieldGoalsMade: game[7], // FGM
      fieldGoalsAttempted: game[8], // FGA
      fieldGoalPercentage: game[9], // FG_PCT
      threePointersMade: game[10], // FG3M
      threePointersAttempted: game[11], // FG3A
      threePointPercentage: game[12], // FG3_PCT
      freeThrowsMade: game[13], // FTM
      freeThrowsAttempted: game[14], // FTA
      freeThrowPercentage: game[15], // FT_PCT
      plusMinus: game[25] // PLUS_MINUS
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
async function fetchNBAStatsData(endpoint, params = {}) {
  const baseUrl = 'https://stats.nba.com/stats'
  
  const queryString = new URLSearchParams(params).toString()
  const url = `${baseUrl}${endpoint}?${queryString}`
  
  try {
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'ApexBets/1.0.0',
        'Referer': 'https://stats.nba.com/',
        'Origin': 'https://stats.nba.com'
      }
    })
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    
    const data = await response.json()
    
    // Check for empty result sets
    if (!data.resultSets || data.resultSets.length === 0) {
      throw new Error('No data returned from NBA Stats API')
    }
    
    return data
  } catch (error) {
    console.error('NBA Stats API request failed:', error)
    throw error
  }
}

// Usage
const players = await fetchNBAStatsData('/commonallplayers', {
  LeagueID: '00',
  Season: '2024-25',
  IsOnlyCurrentSeason: '1'
})
```

## Best Practices

### 1. Headers and User-Agent
Always include proper headers to avoid being blocked:
```typescript
const headers = {
  'Accept': 'application/json',
  'User-Agent': 'ApexBets/1.0.0',
  'Referer': 'https://stats.nba.com/',
  'Origin': 'https://stats.nba.com'
}
```

### 2. Data Parsing
NBA Stats API returns data in a specific format with headers and row sets:
```typescript
function parseNBAStatsResponse(response: any, resultSetName: string) {
  const resultSet = response.resultSets.find(rs => rs.name === resultSetName)
  if (!resultSet) {
    throw new Error(`Result set ${resultSetName} not found`)
  }
  
  const headers = resultSet.headers
  const rows = resultSet.rowSet
  
  return rows.map(row => {
    const obj: any = {}
    headers.forEach((header: string, index: number) => {
      obj[header] = row[index]
    })
    return obj
  })
}
```

### 3. Error Handling with Retry
```typescript
async function safeNBAStatsCall<T>(
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

async function getCachedNBAData(endpoint: string, params: any) {
  const cacheKey = `nba-stats-${endpoint}-${JSON.stringify(params)}`
  const cached = await getCache(cacheKey)
  
  if (cached) {
    return cached
  }
  
  const data = await nbaStatsClient.request(endpoint, params)
  await setCache(cacheKey, data, 300) // Cache for 5 minutes
  
  return data
}
```

## Integration with ApexBets

The NBA Stats API is integrated into the ApexBets system as the primary data source for NBA data. It's used in the following services:

- **BasketballService** - Primary data source for NBA games and statistics
- **PlayerStatsService** - Player statistics and performance data
- **TeamService** - Team information and standings
- **GameService** - Game schedules and results

The API is configured with conservative rate limiting, proper headers, and robust error handling to ensure reliable data access while respecting the NBA's servers.
