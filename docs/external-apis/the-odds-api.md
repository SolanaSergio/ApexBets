# The Odds API Documentation

## Overview

The Odds API provides comprehensive betting odds data for multiple sports including NBA, NFL, MLB, NHL, soccer, and more. It aggregates odds from various sportsbooks and provides real-time updates on betting lines, spreads, and totals.

**Base URL:** `https://api.the-odds-api.com/v4`  
**Documentation:** https://the-odds-api.com/liveapi/guides/v4/  
**Rate Limit:** 500 requests/month (free tier), higher limits on paid plans  
**Cost:** Free tier available, paid plans for higher limits

## Authentication

### API Key Setup
1. Visit [the-odds-api.com](https://the-odds-api.com/)
2. Sign up for a free account
3. Generate your API key
4. Add to environment variables:

```bash
ODDS_API_KEY=your_api_key_here
NEXT_PUBLIC_ODDS_API_KEY=your_api_key_here
```

### Usage in Code
```typescript
import { oddsApiClient } from '@/lib/sports-apis'

// The client automatically uses the API key from environment
const odds = await oddsApiClient.getOdds('basketball_nba')
```

## Endpoints

### Sports

#### Get Available Sports
**Endpoint:** `GET /sports`

**Parameters:** None

**Example Request:**
```bash
curl -X GET "https://api.the-odds-api.com/v4/sports" \
  -H "Accept: application/json"
```

**Example Response:**
```json
[
  {
    "key": "basketball_nba",
    "group": "Basketball",
    "title": "NBA",
    "description": "US Basketball",
    "active": true,
    "has_outrights": false
  },
  {
    "key": "americanfootball_nfl",
    "group": "American Football",
    "title": "NFL",
    "description": "US Football",
    "active": true,
    "has_outrights": false
  },
  {
    "key": "baseball_mlb",
    "group": "Baseball",
    "title": "MLB",
    "description": "US Baseball",
    "active": true,
    "has_outrights": false
  },
  {
    "key": "icehockey_nhl",
    "group": "Ice Hockey",
    "title": "NHL",
    "description": "US Ice Hockey",
    "active": true,
    "has_outrights": false
  },
  {
    "key": "soccer_epl",
    "group": "Soccer",
    "title": "Premier League",
    "description": "English Premier League",
    "active": true,
    "has_outrights": false
  }
]
```

### Odds

#### Get Odds
**Endpoint:** `GET /sports/{sport}/odds`

**Parameters:**
- `sport` (string, required) - Sport key (e.g., "basketball_nba")
- `regions` (string, optional) - Comma-separated regions (e.g., "us,uk")
- `markets` (string, optional) - Comma-separated markets (e.g., "h2h,spreads,totals")
- `dateFormat` (string, optional) - Date format ("iso" or "unix")
- `oddsFormat` (string, optional) - Odds format ("decimal" or "american")
- `bookmakers` (string, optional) - Comma-separated bookmaker names

**Example Request:**
```bash
curl -X GET "https://api.the-odds-api.com/v4/sports/basketball_nba/odds?regions=us&markets=h2h,spreads,totals&oddsFormat=american&dateFormat=iso" \
  -H "Accept: application/json"
```

**Example Response:**
```json
[
  {
    "id": "1234567890",
    "sport_key": "basketball_nba",
    "sport_title": "NBA",
    "commence_time": "2024-01-15T20:00:00Z",
    "home_team": "Los Angeles Lakers",
    "away_team": "Boston Celtics",
    "bookmakers": [
      {
        "key": "draftkings",
        "title": "DraftKings",
        "last_update": "2024-01-15T19:30:00Z",
        "markets": [
          {
            "key": "h2h",
            "last_update": "2024-01-15T19:30:00Z",
            "outcomes": [
              {
                "name": "Los Angeles Lakers",
                "price": -150
              },
              {
                "name": "Boston Celtics",
                "price": 130
              }
            ]
          },
          {
            "key": "spreads",
            "last_update": "2024-01-15T19:30:00Z",
            "outcomes": [
              {
                "name": "Los Angeles Lakers",
                "price": -110,
                "point": -3.5
              },
              {
                "name": "Boston Celtics",
                "price": -110,
                "point": 3.5
              }
            ]
          },
          {
            "key": "totals",
            "last_update": "2024-01-15T19:30:00Z",
            "outcomes": [
              {
                "name": "Over",
                "price": -110,
                "point": 225.5
              },
              {
                "name": "Under",
                "price": -110,
                "point": 225.5
              }
            ]
          }
        ]
      },
      {
        "key": "fanduel",
        "title": "FanDuel",
        "last_update": "2024-01-15T19:25:00Z",
        "markets": [
          {
            "key": "h2h",
            "last_update": "2024-01-15T19:25:00Z",
            "outcomes": [
              {
                "name": "Los Angeles Lakers",
                "price": -145
              },
              {
                "name": "Boston Celtics",
                "price": 125
              }
            ]
          }
        ]
      }
    ]
  }
]
```

### Scores

#### Get Scores
**Endpoint:** `GET /sports/{sport}/scores`

**Parameters:**
- `sport` (string, required) - Sport key
- `daysFrom` (number, optional) - Days from today (default: 1)
- `dateFormat` (string, optional) - Date format ("iso" or "unix")

**Example Request:**
```bash
curl -X GET "https://api.the-odds-api.com/v4/sports/basketball_nba/scores?daysFrom=1&dateFormat=iso" \
  -H "Accept: application/json"
```

**Example Response:**
```json
[
  {
    "id": "1234567890",
    "sport_key": "basketball_nba",
    "sport_title": "NBA",
    "commence_time": "2024-01-15T20:00:00Z",
    "completed": true,
    "home_team": "Los Angeles Lakers",
    "away_team": "Boston Celtics",
    "scores": [
      {
        "name": "Los Angeles Lakers",
        "score": 112
      },
      {
        "name": "Boston Celtics",
        "score": 108
      }
    ],
    "last_update": "2024-01-15T22:30:00Z"
  }
]
```

### Historical Odds

#### Get Historical Odds
**Endpoint:** `GET /sports/{sport}/odds-history`

**Parameters:**
- `sport` (string, required) - Sport key
- `eventIds` (string, optional) - Comma-separated event IDs
- `commenceTimeFrom` (string, optional) - Start time (ISO format)
- `commenceTimeTo` (string, optional) - End time (ISO format)
- `date` (string, optional) - Specific date (YYYY-MM-DD)

**Example Request:**
```bash
curl -X GET "https://api.the-odds-api.com/v4/sports/basketball_nba/odds-history?commenceTimeFrom=2024-01-15T00:00:00Z&commenceTimeTo=2024-01-15T23:59:59Z" \
  -H "Accept: application/json"
```

## Rate Limits

### Free Tier
- **Per Month:** 500 requests
- **Per Day:** No specific limit
- **Per Minute:** No specific limit

### Paid Plans
- **Basic:** 1,000 requests/month
- **Pro:** 10,000 requests/month
- **Ultra:** 100,000 requests/month

### Rate Limit Headers
```json
{
  "X-Requests-Used": "45",
  "X-Requests-Remaining": "455"
}
```

## Error Handling

### Common Error Codes

| Status Code | Description | Solution |
|-------------|-------------|----------|
| 200 | Success | Request successful |
| 400 | Bad Request | Check request parameters |
| 401 | Unauthorized | Verify API key |
| 403 | Forbidden | Check API key permissions |
| 404 | Not Found | Verify endpoint URL |
| 422 | Unprocessable Entity | Invalid parameters |
| 429 | Too Many Requests | Upgrade plan or wait |
| 500 | Internal Server Error | Retry request |

### Error Response Format
```json
{
  "message": "Invalid sport key",
  "details": "The sport key 'invalid_sport' is not valid"
}
```

## Code Examples

### TypeScript Integration
```typescript
import { oddsApiClient } from '@/lib/sports-apis'

// Get NBA odds
async function getNBAOdds() {
  try {
    const odds = await oddsApiClient.getOdds('basketball_nba', {
      regions: 'us',
      markets: 'h2h,spreads,totals',
      oddsFormat: 'american'
    })
    
    return odds.map(game => ({
      id: game.id,
      homeTeam: game.home_team,
      awayTeam: game.away_team,
      commenceTime: game.commence_time,
      bookmakers: game.bookmakers.map(bookmaker => ({
        name: bookmaker.title,
        key: bookmaker.key,
        markets: bookmaker.markets.map(market => ({
          type: market.key,
          outcomes: market.outcomes.map(outcome => ({
            name: outcome.name,
            price: outcome.price,
            point: outcome.point
          }))
        }))
      }))
    }))
  } catch (error) {
    console.error('Failed to fetch NBA odds:', error)
    throw error
  }
}

// Get live scores
async function getLiveScores(sport: string) {
  try {
    const scores = await oddsApiClient.getScores(sport, 1)
    
    return scores.map(game => ({
      id: game.id,
      homeTeam: game.home_team,
      awayTeam: game.away_team,
      homeScore: game.scores.find(s => s.name === game.home_team)?.score,
      awayScore: game.scores.find(s => s.name === game.away_team)?.score,
      completed: game.completed,
      commenceTime: game.commence_time,
      lastUpdate: game.last_update
    }))
  } catch (error) {
    console.error('Failed to fetch live scores:', error)
    throw error
  }
}

// Get available sports
async function getAvailableSports() {
  try {
    const sports = await oddsApiClient.getSports()
    
    return sports.map(sport => ({
      key: sport.key,
      group: sport.group,
      title: sport.title,
      description: sport.description,
      active: sport.active,
      hasOutrights: sport.has_outrights
    }))
  } catch (error) {
    console.error('Failed to fetch sports:', error)
    throw error
  }
}
```

### JavaScript Example
```javascript
// Using fetch directly
async function fetchOddsApiData(endpoint, params = {}) {
  const apiKey = process.env.ODDS_API_KEY
  const baseUrl = 'https://api.the-odds-api.com/v4'
  
  const queryString = new URLSearchParams(params).toString()
  const url = `${baseUrl}${endpoint}?${queryString}`
  
  try {
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json'
      }
    })
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(`HTTP ${response.status}: ${errorData.message || response.statusText}`)
    }
    
    const data = await response.json()
    
    // Log usage for monitoring
    const requestsUsed = response.headers.get('X-Requests-Used')
    const requestsRemaining = response.headers.get('X-Requests-Remaining')
    
    if (requestsUsed && requestsRemaining) {
      console.log(`Odds API usage: ${requestsUsed} used, ${requestsRemaining} remaining`)
    }
    
    return data
  } catch (error) {
    console.error('Odds API request failed:', error)
    throw error
  }
}

// Usage
const odds = await fetchOddsApiData('/sports/basketball_nba/odds', {
  regions: 'us',
  markets: 'h2h,spreads,totals',
  oddsFormat: 'american'
})
```

## Best Practices

### 1. Usage Monitoring
Monitor your API usage to avoid hitting limits:
```typescript
class OddsApiUsageTracker {
  private usage: number = 0
  private monthlyLimit: number = 500
  
  trackRequest() {
    this.usage++
    
    if (this.usage >= this.monthlyLimit * 0.9) {
      console.warn(`Odds API usage at ${this.usage}/${this.monthlyLimit} (90%)`)
    }
    
    if (this.usage >= this.monthlyLimit) {
      throw new Error('Odds API monthly limit exceeded')
    }
  }
  
  getUsageStats() {
    return {
      used: this.usage,
      remaining: this.monthlyLimit - this.usage,
      percentage: (this.usage / this.monthlyLimit) * 100
    }
  }
}
```

### 2. Error Handling with Retry
```typescript
async function safeOddsApiCall<T>(
  apiCall: () => Promise<T>,
  maxRetries: number = 3
): Promise<T | null> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await apiCall()
    } catch (error) {
      if (error.status === 429) {
        console.warn('Odds API rate limit exceeded, waiting...')
        await new Promise(resolve => setTimeout(resolve, 60000)) // Wait 1 minute
        continue
      }
      
      if (error.message.includes('monthly limit exceeded')) {
        console.error('Odds API monthly limit exceeded, cannot retry')
        return null
      }
      
      if (i === maxRetries - 1) {
        console.error('Max retries exceeded:', error)
        return null
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i)))
    }
  }
  
  return null
}
```

### 3. Data Caching
```typescript
import { getCache, setCache } from '@/lib/redis'

async function getCachedOdds(sport: string, params: any) {
  const cacheKey = `odds-api-${sport}-${JSON.stringify(params)}`
  const cached = await getCache(cacheKey)
  
  if (cached) {
    return cached
  }
  
  const odds = await oddsApiClient.getOdds(sport, params)
  await setCache(cacheKey, odds, 300) // Cache for 5 minutes
  
  return odds
}
```

### 4. Odds Comparison
```typescript
function compareOdds(odds: any[]) {
  return odds.map(game => {
    const bestOdds = {
      home: { price: -Infinity, bookmaker: '' },
      away: { price: -Infinity, bookmaker: '' },
      spread: { price: -Infinity, point: 0, bookmaker: '' },
      total: { price: -Infinity, point: 0, bookmaker: '' }
    }
    
    game.bookmakers.forEach(bookmaker => {
      bookmaker.markets.forEach(market => {
        if (market.key === 'h2h') {
          market.outcomes.forEach(outcome => {
            if (outcome.name === game.home_team && outcome.price > bestOdds.home.price) {
              bestOdds.home = { price: outcome.price, bookmaker: bookmaker.title }
            }
            if (outcome.name === game.away_team && outcome.price > bestOdds.away.price) {
              bestOdds.away = { price: outcome.price, bookmaker: bookmaker.title }
            }
          })
        }
        
        if (market.key === 'spreads') {
          market.outcomes.forEach(outcome => {
            if (outcome.price > bestOdds.spread.price) {
              bestOdds.spread = { 
                price: outcome.price, 
                point: outcome.point, 
                bookmaker: bookmaker.title 
              }
            }
          })
        }
        
        if (market.key === 'totals') {
          market.outcomes.forEach(outcome => {
            if (outcome.price > bestOdds.total.price) {
              bestOdds.total = { 
                price: outcome.price, 
                point: outcome.point, 
                bookmaker: bookmaker.title 
              }
            }
          })
        }
      })
    })
    
    return {
      game: `${game.away_team} @ ${game.home_team}`,
      bestOdds
    }
  })
}
```

## Integration with ApexBets

The Odds API is integrated into the ApexBets system as the primary source for betting odds data. It's used in the following services:

- **OddsService** - Primary data source for betting odds
- **LiveOddsService** - Real-time odds updates
- **OddsComparisonService** - Odds comparison across bookmakers
- **BettingService** - Betting market analysis

The API is configured with usage monitoring, conservative rate limiting, and robust error handling to ensure reliable odds data while respecting the monthly limits.
