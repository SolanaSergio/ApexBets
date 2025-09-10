# API Rate Limiting Implementation

This document outlines the comprehensive rate limiting implementation for all public APIs used in the ApexBets project.

## Overview

The rate limiting system ensures that API requests stay within the limits set by each service provider, preventing rate limit violations and ensuring reliable data access.

## Supported APIs and Their Limits

### 1. The Odds API
- **Free Tier**: 10 requests/minute, 100 requests/day
- **Rate Limit Delay**: 6 seconds between requests
- **Burst Limit**: 2 requests
- **Usage**: Betting odds and live sports data

### 2. BALLDONTLIE API
- **Free Tier**: 5 requests/minute, 10,000 requests/day
- **Rate Limit Delay**: 12 seconds between requests
- **Burst Limit**: 2 requests
- **Usage**: NBA-focused historical data

### 3. TheSportsDB API
- **Free Tier**: 30 requests/minute, 10,000 requests/day
- **Rate Limit Delay**: 2 seconds between requests
- **Burst Limit**: 5 requests
- **Usage**: Multi-sport data and team logos

### 4. RapidAPI (API-SPORTS)
- **Free Tier**: 100 requests/minute, 10,000 requests/day
- **Rate Limit Delay**: 0.6 seconds between requests
- **Burst Limit**: 10 requests
- **Usage**: Real-time sports data with 15-second updates

### 5. ESPN API
- **Rate Limit**: Conservative approach (60 requests/minute)
- **Rate Limit Delay**: 1 second between requests
- **Burst Limit**: 10 requests
- **Usage**: Team logos and additional sports data

## Implementation Details

### Core Rate Limiter (`lib/rules/api-rate-limiter.ts`)

The main rate limiting logic is implemented in the `ApiRateLimiter` class:

```typescript
interface RateLimit {
  requestsPerMinute: number
  requestsPerDay: number
  burstLimit: number
}

interface ApiConfig {
  rapidapi: RateLimit
  odds: RateLimit
  sportsdb: RateLimit
  balldontlie: RateLimit
  espn: RateLimit
}
```

### Key Features

1. **Multi-level Rate Limiting**:
   - Per-minute limits
   - Per-day limits
   - Burst limits (concurrent requests)

2. **Automatic Request Spacing**:
   - Each API client enforces appropriate delays between requests
   - Delays are calculated based on the API's rate limits

3. **Error Handling**:
   - Throws descriptive errors when limits are exceeded
   - Provides retry information

4. **Usage Tracking**:
   - Tracks current usage for each API
   - Provides usage statistics

### API Client Integration

Each API client (`lib/sports-apis/*`) includes built-in rate limiting:

```typescript
export class OddsApiClient {
  private rateLimitDelay = 6000 // 6 seconds between requests
  
  private async rateLimit(): Promise<void> {
    const now = Date.now()
    const timeSinceLastRequest = now - this.lastRequestTime
    if (timeSinceLastRequest < this.rateLimitDelay) {
      await new Promise(resolve => 
        setTimeout(resolve, this.rateLimitDelay - timeSinceLastRequest)
      )
    }
    this.lastRequestTime = Date.now()
  }
}
```

### Middleware Integration

Rate limiting middleware (`lib/middleware/api-rate-limit.ts`) provides:

1. **Route-level Protection**:
   ```typescript
   export const GET = withRateLimit({ service: 'odds' })(async (request) => {
     // API route implementation
   })
   ```

2. **Automatic Headers**:
   - `X-RateLimit-Limit-Minute`: Maximum requests per minute
   - `X-RateLimit-Remaining-Minute`: Remaining requests
   - `X-RateLimit-Reset`: Reset time
   - `Retry-After`: Seconds to wait before retrying

3. **Error Responses**:
   - Returns 429 status code when limits exceeded
   - Includes retry information

## Usage Examples

### Basic Rate Limit Check

```typescript
import { apiRateLimiter } from '@/lib/rules/api-rate-limiter'

try {
  apiRateLimiter.checkRateLimit('odds')
  // Make API request
  apiRateLimiter.recordRequest('odds')
} catch (error) {
  console.error('Rate limit exceeded:', error.message)
}
```

### Using Rate Limit Middleware

```typescript
import { withRateLimit } from '@/lib/middleware/api-rate-limit'

export const GET = withRateLimit({ 
  service: 'sportsdb',
  errorMessage: 'SportsDB rate limit exceeded'
})(async (request) => {
  // Your API route logic
  return NextResponse.json({ data: 'success' })
})
```

### Checking Rate Limit Status

```typescript
import { getRateLimitStatus, isRateLimited } from '@/lib/middleware/api-rate-limit'

const status = getRateLimitStatus('odds')
console.log(`Used ${status.minute} requests this minute`)

if (isRateLimited('odds')) {
  console.log('Odds API is currently rate limited')
}
```

## Configuration

### Environment Variables

Rate limiting respects the following environment variables:

```env
# API Keys (required for rate limiting)
NEXT_PUBLIC_RAPIDAPI_KEY=your_rapidapi_key
NEXT_PUBLIC_ODDS_API_KEY=your_odds_api_key
NEXT_PUBLIC_SPORTSDB_API_KEY=123  # Free tier uses '123'
NEXT_PUBLIC_BALLDONTLIE_API_KEY=your_balldontlie_key
```

### Customizing Limits

To modify rate limits, update the `getApiConfig()` method in `lib/rules/api-rate-limiter.ts`:

```typescript
private getApiConfig(): ApiConfig {
  return {
    odds: {
      requestsPerMinute: 10,    // Adjust as needed
      requestsPerDay: 100,      // Adjust as needed
      burstLimit: 2             // Adjust as needed
    }
    // ... other APIs
  }
}
```

## Monitoring and Debugging

### Rate Limit Headers

All API responses include rate limit headers:

```
X-RateLimit-Limit-Minute: 10
X-RateLimit-Remaining-Minute: 7
X-RateLimit-Reset: 2024-01-01T12:01:00.000Z
```

### Logging

Rate limit violations are logged with detailed information:

```
Rate limit exceeded for odds: 10 requests per minute
```

### Usage Statistics

Get current usage for any API:

```typescript
const usage = apiRateLimiter.getUsage('odds')
console.log({
  minute: usage.minute,    // Requests this minute
  day: usage.day,          // Requests today
  burst: usage.burst       // Current burst count
})
```

## Best Practices

1. **Always Check Rate Limits**: Use `apiRateLimiter.checkRateLimit()` before making requests

2. **Record Successful Requests**: Call `apiRateLimiter.recordRequest()` after successful API calls

3. **Handle Rate Limit Errors**: Implement proper error handling for rate limit violations

4. **Use Caching**: Cache API responses to reduce the number of requests

5. **Monitor Usage**: Regularly check usage statistics to avoid hitting limits

6. **Implement Retry Logic**: Use exponential backoff when rate limits are exceeded

## Testing

Rate limiting functionality is tested in `tests/unit/rate-limiting.test.ts`:

```bash
npm test tests/unit/rate-limiting.test.ts
```

Tests cover:
- Basic rate limit enforcement
- Usage tracking
- Error handling
- Middleware functionality
- Configuration validation

## Troubleshooting

### Common Issues

1. **Rate Limit Errors**: Check if you're making too many requests too quickly
2. **API Key Issues**: Ensure all required API keys are properly configured
3. **Configuration Problems**: Verify rate limit configurations match API provider limits

### Debug Mode

Enable debug logging by setting:

```env
NODE_ENV=development
```

This will provide detailed rate limiting information in the console.

## Future Enhancements

1. **Dynamic Rate Limiting**: Adjust limits based on API response headers
2. **Priority Queuing**: Implement request prioritization
3. **Distributed Rate Limiting**: Support for multiple server instances
4. **Analytics**: Track rate limit usage patterns
5. **Auto-scaling**: Automatically adjust limits based on usage patterns
