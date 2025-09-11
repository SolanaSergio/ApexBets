# Split Service Architecture

## Overview

The ApexBets application now uses a clean, split service architecture that separates concerns and eliminates the confusion from unified services. Each service has a specific responsibility and clear boundaries.

## Architecture Principles

### 1. **Single Responsibility Principle**
Each service handles one specific domain:
- **Data Services**: Fetch and manage sport-specific data
- **Analytics Services**: Provide insights and performance metrics
- **Prediction Services**: Handle ML models and predictions
- **Odds Services**: Manage betting odds and markets

### 2. **Sport-Specific Services**
Each sport has its own dedicated service that understands the sport's specific data structures and requirements.

### 3. **Clear Separation of Concerns**
- **Core Services**: Base functionality shared across all services
- **Sport Services**: Sport-specific implementations
- **Specialized Services**: Analytics, predictions, odds
- **API Layer**: Clean API routes that use the services

## Service Structure

```
lib/services/
├── core/                          # Core shared functionality
│   ├── base-service.ts           # Base service with common functionality
│   ├── sport-specific-service.ts # Base class for sport services
│   └── service-factory.ts        # Service instantiation and management
├── sports/                       # Sport-specific data services
│   ├── basketball/
│   │   └── basketball-service.ts
│   ├── football/
│   │   └── football-service.ts
│   ├── baseball/
│   │   └── baseball-service.ts
│   └── hockey/
│       └── hockey-service.ts
├── analytics/                    # Analytics services
│   └── sport-analytics-service.ts
├── predictions/                  # Prediction services
│   └── sport-prediction-service.ts
├── odds/                        # Odds services
│   └── sport-odds-service.ts
└── api/                         # Unified API client
    └── unified-api-client.ts
```

## API Routes

### Sport-Specific Routes
- `/api/sports/[sport]` - Sport-specific data (games, teams, players, etc.)
- `/api/analytics/[sport]` - Sport-specific analytics
- `/api/predictions/[sport]` - Sport-specific predictions
- `/api/odds/[sport]` - Sport-specific odds

### Unified Routes
- `/api/unified` - Unified interface to all services

## Service Usage Examples

### 1. Getting Basketball Games
```typescript
import { serviceFactory } from '@/lib/services/core/service-factory'

const basketballService = serviceFactory.getService('basketball', 'NBA')
const games = await basketballService.getGames({ 
  date: '2024-01-15',
  status: 'live' 
})
```

### 2. Getting Analytics
```typescript
import { SportAnalyticsService } from '@/lib/services/analytics/sport-analytics-service'

const analyticsService = new SportAnalyticsService('basketball', 'NBA')
const teamPerformance = await analyticsService.getTeamPerformance()
```

### 3. Getting Predictions
```typescript
import { SportPredictionService } from '@/lib/services/predictions/sport-prediction-service'

const predictionService = new SportPredictionService('basketball', 'NBA')
const predictions = await predictionService.getPredictions({ limit: 10 })
```

### 4. Getting Odds
```typescript
import { SportOddsService } from '@/lib/services/odds/sport-odds-service'

const oddsService = new SportOddsService('basketball', 'NBA')
const odds = await oddsService.getOdds({ markets: ['moneyline', 'spread'] })
```

### 5. Using Unified API Client
```typescript
import { unifiedApiClient } from '@/lib/services/api/unified-api-client'

// Get comprehensive sport overview
const overview = await unifiedApiClient.getSportOverview('basketball', 'NBA')

// Get value betting opportunities
const valueBets = await unifiedApiClient.getValueBets('basketball', { 
  minValue: 0.15,
  limit: 5 
})
```

## API Usage Examples

### 1. Get Basketball Games
```bash
GET /api/sports/basketball?action=games&league=NBA&limit=10
```

### 2. Get Live Games
```bash
GET /api/sports/basketball?action=live-games
```

### 3. Get Team Performance Analytics
```bash
GET /api/analytics/basketball?action=team-performance&league=NBA
```

### 4. Get Predictions
```bash
GET /api/predictions/basketball?action=predictions&limit=5
```

### 5. Get Value Betting Opportunities
```bash
GET /api/odds/basketball?action=value-analysis&minValue=0.1
```

### 6. Get Sport Overview (Unified)
```bash
GET /api/unified?action=sport-overview&sport=basketball&league=NBA
```

## Benefits of Split Architecture

### 1. **Clear Separation of Concerns**
- Each service has a single responsibility
- Easy to understand what each service does
- No more confusion about unified services

### 2. **Sport-Specific Optimization**
- Each sport service is optimized for its specific data structures
- Basketball service uses BallDontLie API for NBA data
- Football service uses SportsDB for NFL data
- Easy to add sport-specific features

### 3. **Maintainability**
- Easy to modify one service without affecting others
- Clear boundaries between services
- Easy to add new sports or features

### 4. **Testability**
- Each service can be tested independently
- Mock services for testing
- Clear interfaces for testing

### 5. **Scalability**
- Services can be scaled independently
- Easy to add caching or rate limiting per service
- Clear performance boundaries

## Migration from Old Services

### Old Unified Services (Deprecated)
- `sports-data-service.ts` - Replaced by sport-specific services
- `multi-sport-service.ts` - Replaced by service factory
- `unified-sports-service.ts` - Replaced by unified API client

### New Split Services
- Use `serviceFactory.getService(sport, league)` for data
- Use `SportAnalyticsService` for analytics
- Use `SportPredictionService` for predictions
- Use `SportOddsService` for odds
- Use `unifiedApiClient` for unified access

## Adding New Sports

1. Create sport service in `lib/services/sports/[sport]/`
2. Extend `SportSpecificService` base class
3. Implement required abstract methods
4. Add sport to `ServiceFactory`
5. Create API routes if needed

## Adding New Features

1. Create new service in appropriate directory
2. Extend `BaseService` for shared functionality
3. Add API routes if needed
4. Update unified API client if needed

## Error Handling

All services use the base service error handling:
- Rate limiting with automatic retry
- Caching with TTL
- Error logging and reporting
- Graceful degradation

## Caching Strategy

- **Data Services**: 5 minutes for games, 30 minutes for teams/players
- **Analytics Services**: 15 minutes
- **Prediction Services**: 10 minutes
- **Odds Services**: 2 minutes (live data)

## Rate Limiting

Each service has its own rate limiting:
- **Basketball**: BallDontLie API limits
- **Other Sports**: SportsDB API limits
- **Odds**: Odds API limits
- **Analytics/Predictions**: Internal limits

This architecture provides a clean, maintainable, and scalable foundation for the ApexBets application.
