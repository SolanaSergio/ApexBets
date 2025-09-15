# API Optimization Implementation Plan

## 1. Immediate Rate Limit Fixes

### Basketball Service Optimization
```typescript
// Priority: NBA Stats API (unlimited) → BallDontLie (5/min) → TheSportsDB (unlimited)
const basketballApiPriority = [
  { name: 'nba-stats', limit: Infinity, delay: 1000 },
  { name: 'balldontlie', limit: 5, delay: 12000 },
  { name: 'thesportsdb', limit: 30, delay: 3000 },
  { name: 'espn', limit: 120, delay: 500 },
  { name: 'api-sports', limit: 100, delay: 600 }
]
```

### Baseball Service Optimization
```typescript
// Priority: MLB Stats API (unlimited) → TheSportsDB (unlimited) → ESPN (free)
const baseballApiPriority = [
  { name: 'mlb-stats', limit: Infinity, delay: 1000 },
  { name: 'thesportsdb', limit: 30, delay: 3000 },
  { name: 'espn', limit: 120, delay: 500 },
  { name: 'api-sports', limit: 100, delay: 600 }
]
```

### Hockey Service Optimization
```typescript
// Priority: NHL API (unlimited) → TheSportsDB (unlimited) → ESPN (free)
const hockeyApiPriority = [
  { name: 'nhl', limit: Infinity, delay: 1000 },
  { name: 'thesportsdb', limit: 30, delay: 3000 },
  { name: 'espn', limit: 120, delay: 500 },
  { name: 'api-sports', limit: 100, delay: 600 }
]
```

## 2. Key Rotation Enhancement

### Add Multiple Keys Support
```env
# Multiple API keys for rotation
NEXT_PUBLIC_RAPIDAPI_KEY=key1,key2,key3
NEXT_PUBLIC_ODDS_API_KEY=key1,key2,key3
NEXT_PUBLIC_BALLDONTLIE_API_KEY=key1,key2,key3
```

### Backup Key Configuration
```typescript
const keyRotationConfig = {
  'api-sports': {
    primary: 'key1',
    backup: ['key2', 'key3'],
    maxRequestsPerHour: 100,
    rotateOnRateLimit: true
  }
}
```

## 3. Database Persistence Strategy

### Cache API Responses
```sql
CREATE TABLE api_cache (
  id SERIAL PRIMARY KEY,
  cache_key VARCHAR(255) UNIQUE,
  data JSONB,
  sport VARCHAR(50),
  data_type VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP,
  source_api VARCHAR(50)
);

CREATE INDEX idx_api_cache_key ON api_cache(cache_key);
CREATE INDEX idx_api_cache_sport ON api_cache(sport);
CREATE INDEX idx_api_cache_expires ON api_cache(expires_at);
```

### Store API Usage Statistics
```sql
CREATE TABLE api_usage_stats (
  id SERIAL PRIMARY KEY,
  provider VARCHAR(50),
  endpoint VARCHAR(255),
  requests_count INTEGER DEFAULT 0,
  success_count INTEGER DEFAULT 0,
  error_count INTEGER DEFAULT 0,
  avg_response_time INTEGER,
  date DATE DEFAULT CURRENT_DATE,
  hour INTEGER DEFAULT EXTRACT(HOUR FROM NOW())
);
```

## 4. Intelligent Fallback Strategy

### Circuit Breaker Pattern
```typescript
class ApiCircuitBreaker {
  private failures = new Map<string, number>()
  private lastFailure = new Map<string, number>()
  
  async executeWithFallback<T>(
    providers: ApiProvider[],
    operation: (provider: ApiProvider) => Promise<T>
  ): Promise<T> {
    for (const provider of providers) {
      if (this.isProviderHealthy(provider.name)) {
        try {
          const result = await operation(provider)
          this.recordSuccess(provider.name)
          return result
        } catch (error) {
          this.recordFailure(provider.name)
          continue
        }
      }
    }
    throw new Error('All providers failed')
  }
}
```

## 5. Unified Cache Strategy

### Single Cache Manager
```typescript
class UnifiedSportsCache {
  private memoryCache = new Map()
  private databaseCache: SupabaseClient
  
  async get<T>(key: string): Promise<T | null> {
    // 1. Check memory cache (fastest)
    const memoryResult = this.memoryCache.get(key)
    if (memoryResult && !this.isExpired(memoryResult)) {
      return memoryResult.data
    }
    
    // 2. Check database cache (persistent)
    const dbResult = await this.databaseCache
      .from('api_cache')
      .select('data, expires_at')
      .eq('cache_key', key)
      .single()
    
    if (dbResult.data && !this.isExpired(dbResult.data)) {
      // Restore to memory cache
      this.memoryCache.set(key, dbResult.data)
      return dbResult.data.data
    }
    
    return null
  }
}
```

## 6. Rate Limit Compliance

### Smart Request Scheduling
```typescript
class SmartRequestScheduler {
  private queues = new Map<string, RequestQueue>()
  
  async scheduleRequest<T>(
    provider: string,
    operation: () => Promise<T>
  ): Promise<T> {
    const queue = this.getQueue(provider)
    
    return new Promise((resolve, reject) => {
      queue.add({
        operation,
        resolve,
        reject,
        timestamp: Date.now()
      })
      
      this.processQueue(provider)
    })
  }
  
  private async processQueue(provider: string) {
    const queue = this.getQueue(provider)
    const config = this.getProviderConfig(provider)
    
    if (queue.canProcess()) {
      const request = queue.next()
      
      try {
        // Wait for rate limit
        await this.waitForRateLimit(provider)
        
        const result = await request.operation()
        request.resolve(result)
        
        // Record successful request
        this.recordRequest(provider, true)
        
      } catch (error) {
        request.reject(error)
        this.recordRequest(provider, false)
      }
      
      // Process next request
      setTimeout(() => this.processQueue(provider), config.delay)
    }
  }
}
```

## 7. Data Quality Monitoring

### API Health Checks
```typescript
class ApiHealthMonitor {
  async checkAllProviders(): Promise<HealthReport> {
    const providers = ['nba-stats', 'mlb-stats', 'nhl', 'thesportsdb', 'api-sports']
    const results = await Promise.allSettled(
      providers.map(provider => this.checkProvider(provider))
    )
    
    return {
      timestamp: new Date(),
      providers: results.map((result, index) => ({
        name: providers[index],
        status: result.status === 'fulfilled' ? 'healthy' : 'unhealthy',
        responseTime: result.status === 'fulfilled' ? result.value.responseTime : null,
        error: result.status === 'rejected' ? result.reason.message : null
      }))
    }
  }
}
```

## Implementation Priority

1. **Week 1**: Fix rate limiting and implement circuit breakers
2. **Week 2**: Add database caching and persistence
3. **Week 3**: Implement key rotation and backup strategies
4. **Week 4**: Add monitoring and health checks
5. **Week 5**: Optimize sport-specific API usage
6. **Week 6**: Performance testing and fine-tuning
