# External APIs Documentation

This directory contains comprehensive documentation for all external APIs used
in the ApexBets project. Each API is documented with the latest information,
authentication methods, endpoints, and usage examples.

## 📋 Available APIs

### 🏀 Basketball APIs

- **[Ball Don't Lie API](ball-dont-lie-api.md)** - NBA, NFL, MLB, NHL data
- **[NBA Stats API](nba-stats-api.md)** - Official NBA data (free)
- **[ESPN API](espn-api.md)** - Free sports data

### ⚽ Multi-Sport APIs

- **[RapidAPI (API-Sports)](rapidapi-api-sports.md)** - Multi-sport data via
  RapidAPI marketplace
- **[TheSportsDB](thesportsdb-api.md)** - Free multi-sport API
- **[MLB Stats API](mlb-stats-api.md)** - Official MLB data
- **[NHL API](nhl-api.md)** - Official NHL data

### 🎯 Betting APIs

- **[The Odds API](the-odds-api.md)** - Betting odds data

## 🚀 Quick Start

### 1. Environment Setup

Add the required API keys to your environment variables:

```bash
# Ball Don't Lie API
BALLDONTLIE_API_KEY=your_balldontlie_api_key
NEXT_PUBLIC_BALLDONTLIE_API_KEY=your_balldontlie_api_key

# RapidAPI (API-Sports)
RAPIDAPI_KEY=your_rapidapi_key
NEXT_PUBLIC_RAPIDAPI_KEY=your_rapidapi_key

# The Odds API
ODDS_API_KEY=your_odds_api_key
NEXT_PUBLIC_ODDS_API_KEY=your_odds_api_key

# TheSportsDB (free tier)
SPORTSDB_API_KEY=123
NEXT_PUBLIC_SPORTSDB_API_KEY=123
```

### 2. API Priority Order

The system uses a fallback strategy with the following priority:

1. **Official APIs** (NBA Stats, MLB Stats, NHL) - Free, official data
2. **TheSportsDB** - Free, reliable multi-sport data
3. **ESPN** - Free, good coverage
4. **Ball Don't Lie** - Basketball-specific but rate-limited
5. **RapidAPI (API-Sports)** - Cost-based, comprehensive
6. **The Odds API** - Betting odds data

### 3. Rate Limiting

Each API has specific rate limits that are managed by the enhanced rate limiter:

- **Ball Don't Lie**: 100 requests/minute, 1000 requests/hour
- **RapidAPI**: 100 requests/minute (free tier)
- **TheSportsDB**: 100 requests/minute (free tier)
- **NBA Stats**: 100 requests/minute
- **The Odds API**: 500 requests/month (free tier)

## 📊 API Usage Statistics

| API            | Sports Covered     | Rate Limit | Cost | Reliability |
| -------------- | ------------------ | ---------- | ---- | ----------- |
| Ball Don't Lie | NBA, NFL, MLB, NHL | 100/min    | Free | High        |
| RapidAPI       | Multi-sport        | 100/min    | Paid | High        |
| TheSportsDB    | Multi-sport        | 100/min    | Free | Medium      |
| NBA Stats      | NBA                | 100/min    | Free | High        |
| ESPN           | Multi-sport        | No limit   | Free | Medium      |
| MLB Stats      | MLB                | 100/min    | Free | High        |
| NHL            | NHL                | 100/min    | Free | High        |
| The Odds API   | Multi-sport        | 500/month  | Free | High        |

## 🔧 Integration Examples

### Basic API Call

```typescript
import { ballDontLieClient } from '@/lib/sports-apis'

// Get NBA games
const games = await ballDontLieClient.getGames({
  season: 2024,
  per_page: 25,
})
```

### Error Handling

```typescript
try {
  const data = await apiClient.getData()
  return data
} catch (error) {
  if (error.status === 429) {
    // Rate limit exceeded
    console.warn('Rate limit exceeded, using fallback API')
    return await fallbackApiClient.getData()
  }
  throw error
}
```

## 📚 Documentation Structure

Each API documentation includes:

- **Overview** - Purpose and capabilities
- **Authentication** - API key setup and usage
- **Endpoints** - Available endpoints with parameters
- **Response Format** - Data structure examples
- **Rate Limits** - Usage limitations
- **Error Handling** - Common errors and solutions
- **Code Examples** - Integration examples
- **Best Practices** - Optimization tips

## 🚨 Important Notes

### API Key Management

- API keys are managed by the `ApiKeyRotationService`
- Multiple keys can be configured for high-volume APIs
- Keys are automatically rotated when limits are reached

### Circuit Breaker Pattern

- Each API has circuit breaker protection
- Automatic fallback to alternative APIs
- Health monitoring and recovery

### Data Caching

- All API responses are cached in Redis
- Cache TTL varies by data type (5-60 minutes)
- Cache invalidation on data updates

## 🔄 Updates and Maintenance

This documentation is updated regularly to reflect:

- API changes and new endpoints
- Rate limit adjustments
- Authentication method updates
- Best practice improvements

For the latest information, always refer to the official API documentation
linked in each section.
