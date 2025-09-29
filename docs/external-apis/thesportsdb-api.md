# TheSportsDB API Documentation

## Overview

TheSportsDB is a free, comprehensive sports database API that provides data for multiple sports including football (soccer), basketball, baseball, hockey, and more. It's known for its generous rate limits and reliable data coverage.

**Base URL:** `https://www.thesportsdb.com/api/v1/json`  
**Documentation:** https://www.thesportsdb.com/api.php  
**Rate Limit:** 100 requests/minute (free tier)  
**Cost:** Free with API key (key: "1" for testing, "2" for production)

## Authentication

### API Key Setup
TheSportsDB uses a simple API key system. For production use, you need to register and get a proper API key.

**Free API Keys:**
- `1` - Testing key (limited functionality)
- `2` - Production key (full access)

**Environment Setup:**
```bash
SPORTSDB_API_KEY=2
NEXT_PUBLIC_SPORTSDB_API_KEY=2
```

### Usage in Code
```typescript
import { sportsDBClient } from '@/lib/sports-apis'

// The client automatically uses the API key from environment
const events = await sportsDBClient.getEventsByDate('2024-01-15')
```

## Endpoints

### Events (Games)

#### Get Events by Date
**Endpoint:** `GET /{API_KEY}/eventsday.php`

**Parameters:**
- `d` (string, required) - Date in YYYY-MM-DD format
- `s` (string, optional) - Sport name
- `l` (string, optional) - League name

**Example Request:**
```bash
curl -X GET "https://www.thesportsdb.com/api/v1/json/2/eventsday.php?d=2024-01-15&s=Basketball"
```

**Example Response:**
```json
{
  "events": [
    {
      "idEvent": "123456",
      "strEvent": "Los Angeles Lakers vs Boston Celtics",
      "strEventAlternate": "Lakers vs Celtics",
      "strFilename": "Los-Angeles-Lakers-vs-Boston-Celtics",
      "strSport": "Basketball",
      "idLeague": "4387",
      "strLeague": "NBA",
      "strSeason": "2024-25",
      "strDescriptionEN": "Regular Season Game",
      "strHomeTeam": "Los Angeles Lakers",
      "strAwayTeam": "Boston Celtics",
      "intHomeScore": "112",
      "intAwayScore": "108",
      "intRound": "1",
      "intSpectators": "19068",
      "strOfficial": "John Smith",
      "strTimestamp": "2024-01-15T20:00:00+00:00",
      "dateEvent": "2024-01-15",
      "strDate": "15/01/24",
      "strTime": "20:00:00",
      "strTimeLocal": "20:00:00",
      "strTVStation": "TNT",
      "idHomeTeam": "134920",
      "idAwayTeam": "134922",
      "strResult": "",
      "strVenue": "Crypto.com Arena",
      "strCountry": "USA",
      "strCity": "Los Angeles",
      "strPoster": "",
      "strSquare": "",
      "strFanart": "",
      "strThumb": "",
      "strBanner": "",
      "strMap": "",
      "strTweet1": "",
      "strTweet2": "",
      "strTweet3": "",
      "strVideo": "",
      "strStatus": "Match Finished",
      "strPostponed": "no",
      "strLocked": "unlocked"
    }
  ]
}
```

#### Get Next Events
**Endpoint:** `GET /{API_KEY}/eventsnext.php`

**Parameters:**
- `id` (string, required) - Team ID

**Example Request:**
```bash
curl -X GET "https://www.thesportsdb.com/api/v1/json/2/eventsnext.php?id=134920"
```

#### Get Last Events
**Endpoint:** `GET /{API_KEY}/eventslast.php`

**Parameters:**
- `id` (string, required) - Team ID

**Example Request:**
```bash
curl -X GET "https://www.thesportsdb.com/api/v1/json/2/eventslast.php?id=134920"
```

### Teams

#### Get Team Details
**Endpoint:** `GET /{API_KEY}/lookupteam.php`

**Parameters:**
- `id` (string, required) - Team ID

**Example Request:**
```bash
curl -X GET "https://www.thesportsdb.com/api/v1/json/2/lookupteam.php?id=134920"
```

**Example Response:**
```json
{
  "teams": [
    {
      "idTeam": "134920",
      "idSoccerXML": "134920",
      "idAPIfootball": "134920",
      "intLoved": "1",
      "strTeam": "Los Angeles Lakers",
      "strTeamShort": "LAL",
      "strAlternate": "Lakers",
      "intFormedYear": "1947",
      "strSport": "Basketball",
      "strLeague": "NBA",
      "idLeague": "4387",
      "strLeague2": "",
      "idLeague2": "",
      "strLeague3": "",
      "idLeague3": "",
      "strLeague4": "",
      "idLeague4": "",
      "strLeague5": "",
      "idLeague5": "",
      "strLeague6": "",
      "idLeague6": "",
      "strLeague7": "",
      "idLeague7": "",
      "strDivision": "Pacific",
      "strManager": "",
      "strStadium": "Crypto.com Arena",
      "strKeywords": "Lakers, Los Angeles Lakers, LAL",
      "strRSS": "",
      "strStadiumThumb": "https://www.thesportsdb.com/images/media/team/stadium/w1anwa1588434625.jpg",
      "strStadiumDescription": "Crypto.com Arena is a multi-purpose arena in Los Angeles.",
      "strStadiumLocation": "Los Angeles, California",
      "intStadiumCapacity": "19068",
      "strWebsite": "https://www.nba.com/lakers",
      "strFacebook": "https://www.facebook.com/losangeleslakers",
      "strTwitter": "https://twitter.com/lakers",
      "strInstagram": "https://www.instagram.com/lakers",
      "strDescriptionEN": "The Los Angeles Lakers are an American professional basketball team.",
      "strDescriptionDE": "",
      "strDescriptionFR": "",
      "strDescriptionCN": "",
      "strDescriptionIT": "",
      "strDescriptionJP": "",
      "strDescriptionRU": "",
      "strDescriptionES": "",
      "strDescriptionPT": "",
      "strDescriptionSE": "",
      "strDescriptionNL": "",
      "strDescriptionHU": "",
      "strDescriptionNO": "",
      "strDescriptionIL": "",
      "strDescriptionPL": "",
      "strGender": "Male",
      "strCountry": "USA",
      "strTeamBadge": "https://www.thesportsdb.com/images/media/team/badge/134920.png",
      "strTeamJersey": "https://www.thesportsdb.com/images/media/team/jersey/134920.png",
      "strTeamLogo": "https://www.thesportsdb.com/images/media/team/logo/134920.png",
      "strTeamFanart1": "https://www.thesportsdb.com/images/media/team/fanart/134920.jpg",
      "strTeamFanart2": "https://www.thesportsdb.com/images/media/team/fanart/134920.jpg",
      "strTeamFanart3": "https://www.thesportsdb.com/images/media/team/fanart/134920.jpg",
      "strTeamFanart4": "https://www.thesportsdb.com/images/media/team/fanart/134920.jpg",
      "strTeamBanner": "https://www.thesportsdb.com/images/media/team/banner/134920.jpg",
      "strYoutube": "https://www.youtube.com/user/lakers",
      "strLocked": "unlocked"
    }
  ]
}
```

#### Search Teams
**Endpoint:** `GET /{API_KEY}/searchteams.php`

**Parameters:**
- `t` (string, required) - Team name to search

**Example Request:**
```bash
curl -X GET "https://www.thesportsdb.com/api/v1/json/2/searchteams.php?t=Lakers"
```

#### Get Teams by League
**Endpoint:** `GET /{API_KEY}/lookup_all_teams.php`

**Parameters:**
- `id` (string, required) - League ID

**Example Request:**
```bash
curl -X GET "https://www.thesportsdb.com/api/v1/json/2/lookup_all_teams.php?id=4387"
```

### Players

#### Get Player Details
**Endpoint:** `GET /{API_KEY}/lookupplayer.php`

**Parameters:**
- `id` (string, required) - Player ID

**Example Request:**
```bash
curl -X GET "https://www.thesportsdb.com/api/v1/json/2/lookupplayer.php?id=34145939"
```

**Example Response:**
```json
{
  "players": [
    {
      "idPlayer": "34145939",
      "idTeam": "134920",
      "idTeam2": "",
      "idTeam3": "",
      "idTeam4": "",
      "idTeam5": "",
      "idSoccerXML": "34145939",
      "idAPIfootball": "34145939",
      "strPlayer": "LeBron James",
      "strTeam": "Los Angeles Lakers",
      "strTeam2": "",
      "strTeam3": "",
      "strTeam4": "",
      "strTeam5": "",
      "strSport": "Basketball",
      "intLoved": "1",
      "strThumb": "https://www.thesportsdb.com/images/media/player/thumb/34145939.jpg",
      "strCutout": "https://www.thesportsdb.com/images/media/player/cutout/34145939.png",
      "strRender": "https://www.thesportsdb.com/images/media/player/render/34145939.png",
      "strBanner": "https://www.thesportsdb.com/images/media/player/banner/34145939.jpg",
      "strFanart1": "https://www.thesportsdb.com/images/media/player/fanart/34145939.jpg",
      "strFanart2": "https://www.thesportsdb.com/images/media/player/fanart/34145939.jpg",
      "strFanart3": "https://www.thesportsdb.com/images/media/player/fanart/34145939.jpg",
      "strFanart4": "https://www.thesportsdb.com/images/media/player/fanart/34145939.jpg",
      "strLocked": "unlocked"
    }
  ]
}
```

#### Search Players
**Endpoint:** `GET /{API_KEY}/searchplayers.php`

**Parameters:**
- `p` (string, required) - Player name to search

**Example Request:**
```bash
curl -X GET "https://www.thesportsdb.com/api/v1/json/2/searchplayers.php?p=LeBron"
```

### Leagues

#### Get League Details
**Endpoint:** `GET /{API_KEY}/lookupleague.php`

**Parameters:**
- `id` (string, required) - League ID

**Example Request:**
```bash
curl -X GET "https://www.thesportsdb.com/api/v1/json/2/lookupleague.php?id=4387"
```

**Example Response:**
```json
{
  "leagues": [
    {
      "idLeague": "4387",
      "strLeague": "NBA",
      "strLeagueAlternate": "National Basketball Association",
      "strSport": "Basketball",
      "strDivision": "",
      "idCup": "",
      "strCurrentSeason": "2024-25",
      "intFormedYear": "1946",
      "dateFirstEvent": "1946-11-01",
      "strGender": "Male",
      "strCountry": "USA",
      "strWebsite": "https://www.nba.com",
      "strFacebook": "https://www.facebook.com/NBA",
      "strTwitter": "https://twitter.com/NBA",
      "strYoutube": "https://www.youtube.com/user/NBA",
      "strRSS": "",
      "strDescriptionEN": "The National Basketball Association (NBA) is a professional basketball league.",
      "strDescriptionDE": "",
      "strDescriptionFR": "",
      "strDescriptionCN": "",
      "strDescriptionIT": "",
      "strDescriptionJP": "",
      "strDescriptionRU": "",
      "strDescriptionES": "",
      "strDescriptionPT": "",
      "strDescriptionSE": "",
      "strDescriptionNL": "",
      "strDescriptionHU": "",
      "strDescriptionNO": "",
      "strDescriptionIL": "",
      "strDescriptionPL": "",
      "strTrophy": "https://www.thesportsdb.com/images/media/league/trophy/4387.png",
      "strNaming": "",
      "strComplete": "Yes",
      "strLocked": "unlocked"
    }
  ]
}
```

#### Search Leagues
**Endpoint:** `GET /{API_KEY}/searchallleagues.php`

**Parameters:**
- `s` (string, optional) - Sport name

**Example Request:**
```bash
curl -X GET "https://www.thesportsdb.com/api/v1/json/2/searchallleagues.php?s=Basketball"
```

### Standings

#### Get League Table
**Endpoint:** `GET /{API_KEY}/lookuptable.php`

**Parameters:**
- `l` (string, required) - League ID
- `s` (string, required) - Season

**Example Request:**
```bash
curl -X GET "https://www.thesportsdb.com/api/v1/json/2/lookuptable.php?l=4387&s=2024-25"
```

**Example Response:**
```json
{
  "table": [
    {
      "idStanding": "1",
      "idLeague": "4387",
      "strLeague": "NBA",
      "strSeason": "2024-25",
      "strForm": "WWLWW",
      "strDescription": "1st Place",
      "idTeam": "134920",
      "strTeam": "Los Angeles Lakers",
      "strTeamBadge": "https://www.thesportsdb.com/images/media/team/badge/134920.png",
      "intPlayed": "20",
      "intWin": "15",
      "intLoss": "5",
      "intDraw": "0",
      "intGoalsFor": "112",
      "intGoalsAgainst": "98",
      "intGoalDifference": "14",
      "intPoints": "30",
      "dateUpdated": "2024-01-15 20:00:00"
    }
  ]
}
```

## Rate Limits

- **Per Minute:** 100 requests
- **Per Hour:** No specific limit mentioned
- **Per Day:** No specific limit mentioned

### Rate Limit Handling
TheSportsDB doesn't provide rate limit headers, so the system implements conservative rate limiting:

```typescript
// Conservative rate limiting for TheSportsDB
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
| 404 | Not Found | Verify endpoint URL or API key |
| 500 | Internal Server Error | Retry request |

### Error Response Format
```json
{
  "events": null,
  "teams": null,
  "players": null,
  "leagues": null
}
```

## Code Examples

### TypeScript Integration
```typescript
import { sportsDBClient } from '@/lib/sports-apis'

// Get events for a specific date
async function getEventsForDate(date: string, sport?: string) {
  try {
    const events = await sportsDBClient.getEventsByDate(date, sport)
    
    return events.events?.map(event => ({
      id: event.idEvent,
      homeTeam: event.strHomeTeam,
      awayTeam: event.strAwayTeam,
      homeScore: event.intHomeScore,
      awayScore: event.intAwayScore,
      date: event.dateEvent,
      time: event.strTime,
      venue: event.strVenue,
      status: event.strStatus,
      league: event.strLeague,
      sport: event.strSport
    })) || []
  } catch (error) {
    console.error('Failed to fetch events:', error)
    throw error
  }
}

// Get team details
async function getTeamDetails(teamId: string) {
  try {
    const team = await sportsDBClient.getTeamDetails(teamId)
    
    if (team.teams && team.teams.length > 0) {
      const teamData = team.teams[0]
      return {
        id: teamData.idTeam,
        name: teamData.strTeam,
        shortName: teamData.strTeamShort,
        league: teamData.strLeague,
        sport: teamData.strSport,
        formedYear: teamData.intFormedYear,
        stadium: teamData.strStadium,
        stadiumCapacity: teamData.intStadiumCapacity,
        website: teamData.strWebsite,
        logo: teamData.strTeamBadge,
        jersey: teamData.strTeamJersey,
        description: teamData.strDescriptionEN
      }
    }
    
    return null
  } catch (error) {
    console.error('Failed to fetch team details:', error)
    throw error
  }
}

// Get league standings
async function getLeagueStandings(leagueId: string, season: string) {
  try {
    const standings = await sportsDBClient.getLeagueTable(leagueId, season)
    
    return standings.table?.map(team => ({
      position: team.idStanding,
      teamName: team.strTeam,
      teamLogo: team.strTeamBadge,
      played: team.intPlayed,
      wins: team.intWin,
      losses: team.intLoss,
      draws: team.intDraw,
      goalsFor: team.intGoalsFor,
      goalsAgainst: team.intGoalsAgainst,
      goalDifference: team.intGoalDifference,
      points: team.intPoints,
      form: team.strForm,
      description: team.strDescription
    })) || []
  } catch (error) {
    console.error('Failed to fetch standings:', error)
    throw error
  }
}
```

### JavaScript Example
```javascript
// Using fetch directly
async function fetchSportsDBData(endpoint, params = {}) {
  const apiKey = process.env.SPORTSDB_API_KEY || '2'
  const baseUrl = 'https://www.thesportsdb.com/api/v1/json'
  
  const queryString = new URLSearchParams(params).toString()
  const url = `${baseUrl}/${apiKey}${endpoint}?${queryString}`
  
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
    
    const data = await response.json()
    
    // Check for empty responses
    if (!data || Object.values(data).every(value => value === null)) {
      throw new Error('No data returned from TheSportsDB')
    }
    
    return data
  } catch (error) {
    console.error('TheSportsDB request failed:', error)
    throw error
  }
}

// Usage
const events = await fetchSportsDBData('/eventsday.php', {
  d: '2024-01-15',
  s: 'Basketball'
})
```

## Best Practices

### 1. API Key Management
Use different API keys for different environments:
```typescript
const getApiKey = (): string => {
  const env = process.env.NODE_ENV
  switch (env) {
    case 'production':
      return process.env.SPORTSDB_API_KEY || '2'
    case 'development':
      return process.env.SPORTSDB_API_KEY || '1'
    default:
      return '1' // Testing key
  }
}
```

### 2. Data Validation
Always validate responses as TheSportsDB can return null values:
```typescript
function validateEventData(event: any): boolean {
  return (
    event.idEvent &&
    event.strHomeTeam &&
    event.strAwayTeam &&
    event.dateEvent &&
    event.strLeague
  )
}

const events = await sportsDBClient.getEventsByDate('2024-01-15')
const validEvents = events.events?.filter(validateEventData) || []
```

### 3. Error Handling with Fallback
```typescript
async function safeSportsDBCall<T>(
  apiCall: () => Promise<T>,
  fallbackValue: T
): Promise<T> {
  try {
    const result = await apiCall()
    
    // Check if result is empty or null
    if (!result || (typeof result === 'object' && Object.values(result).every(v => v === null))) {
      console.warn('TheSportsDB returned empty data, using fallback')
      return fallbackValue
    }
    
    return result
  } catch (error) {
    console.error('TheSportsDB call failed:', error)
    return fallbackValue
  }
}
```

### 4. Caching Strategy
```typescript
import { getCache, setCache } from '@/lib/redis'

async function getCachedEvents(date: string, sport?: string) {
  const cacheKey = `sportsdb-events-${date}-${sport || 'all'}`
  const cached = await getCache(cacheKey)
  
  if (cached) {
    return cached
  }
  
  const events = await sportsDBClient.getEventsByDate(date, sport)
  await setCache(cacheKey, events, 1800) // Cache for 30 minutes
  
  return events
}
```

## Integration with ApexBets

TheSportsDB is integrated into the ApexBets system as a reliable fallback data source. It's used in the following services:

- **MultiSportService** - Primary fallback for multi-sport data
- **BasketballService** - Fallback for NBA data when Ball Don't Lie fails
- **FootballService** - Fallback for soccer data
- **TeamService** - Team information and logos
- **LeagueService** - League standings and information

The API is configured with conservative rate limiting and robust error handling to ensure reliable data access even when other APIs fail.
