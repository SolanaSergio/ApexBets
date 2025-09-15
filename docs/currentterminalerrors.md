PS C:\Users\sergi\OneDrive\Desktop\ProjectApex> pnpm run dev

> project-apex@1.0.0 dev C:\Users\sergi\OneDrive\Desktop\ProjectApex
> next dev

   ▲ Next.js 15.5.2
   - Local:        http://localhost:3000
   - Network:      http://192.168.1.197:3000
   - Environments: .env.local, .env
   - Experiments (use with caution):
     · optimizePackageImports

 ✓ Starting...
 ✓ Ready in 8.4s
 ○ Compiling /middleware ...
 ✓ Compiled /middleware in 1208ms (183 modules)
 ○ Compiling / ...
 ✓ Compiled / in 7.8s (1074 modules)
 ✓ Compiled in 3.4s (465 modules)
 GET / 200 in 11380ms
 ✓ Compiled in 785ms (465 modules)
 ○ Compiling /api/odds ...
 ✓ Compiled /api/sports in 15.2s (1220 modules)
[9/14/2025, 3:32:43 PM] INFO [project-apex] Business event: api_key_rotation:key_configs_loaded
Context: {
  "providers": [
    "api-sports",
    "odds-api",
    "sportsdb",
    "balldontlie"
  ],
  "totalKeys": 4
}
SportsDB: Rate limit error count reset
 GET /api/sports 200 in 13787ms
 GET /api/sports 200 in 762ms
 ○ Compiling /api/odds/[sport] ...
Skipping SportsDB fallback for baseball - already have data
SportsDB: Rate limiting, waiting 2105ms
 GET /api/analytics/stats?sport=all 200 in 15604ms
 ✓ Compiled /api/odds/[sport] in 1732ms (1209 modules)
[9/14/2025, 3:32:47 PM] INFO [project-apex] Business event: api_key_rotation:key_configs_loaded
Context: {
  "providers": [
    "api-sports",
    "odds-api",
    "sportsdb",
    "balldontlie"
  ],
  "totalKeys": 4
}
 GET /api/predictions?sport=all&limit=10 200 in 17727ms
Skipping SportsDB fallback for basketball - already have data
SportsDB: Rate limiting, waiting 2591ms
 GET / 200 in 2233ms
 GET /api/sports 200 in 334ms
[9/14/2025, 3:32:49 PM] INFO [project-apex] Business event: api_key_rotation:key_configs_loaded
Context: {
  "providers": [
    "api-sports",
    "odds-api",
    "sportsdb",
    "balldontlie"
  ],
  "totalKeys": 4
}
 GET /api/sports 200 in 342ms
 GET /api/sports 200 in 235ms
Service registry initialized with sports: [
  'basketball', 'soccer',
  'football',   'baseball',
  'hockey',     'golf',
  'tennis',     'mma',
  'boxing',     'cricket',
  'rugby',      'volleyball',
  'motorsport', 'cycling',
  'swimming',   'athletics'
]
 GET /api/analytics/stats?sport=all 200 in 1393ms
NBA Stats API error: TypeError: _services_api_specific_error_handlers__WEBPACK_IMPORTED_MODULE_0__.apiSpecificErrorHandler.getHandler is not a function
    at NBAStatsClient.request (lib\sports-apis\nba-stats-client.ts:101:53)
    at async NBAStatsClient.getScoreboard (lib\sports-apis\nba-stats-client.ts:284:18)
    at async BasketballService.fetchGamesFromNBAStats (lib\services\sports\basketball\basketball-service.ts:171:30)
    at async BasketballService.fetchGames (lib\services\sports\basketball\basketball-service.ts:48:26)
    at async EnhancedErrorHandlingService.withRetry (lib\services\error-handling-service.ts:426:16)
    at async BasketballService.getCachedOrFetch (lib\services\core\base-service.ts:51:20)
    at async eval (lib\services\odds\sport-odds-service.ts:84:17)
    at async EnhancedErrorHandlingService.withRetry (lib\services\error-handling-service.ts:426:16)
    at async SportOddsService.getCachedOrFetch (lib\services\core\base-service.ts:51:20)
    at async GET (app\api\odds\[sport]\route.ts:42:28)
   99 |
  100 |     // Use API-specific error handler
> 101 |     const apiErrorHandler = apiSpecificErrorHandler.getHandler(this.providerName)
      |                                                     ^
  102 |     let response: Response | undefined
  103 |
  104 |     try {
SportsDB: Rate limit error count reset
SportsDB: Rate limiting, waiting 2781ms
 GET /api/predictions?sport=all&limit=10 200 in 1770ms
Skipping SportsDB fallback for football - already have data
SportsDB: Rate limiting, waiting 2708ms
SportsDB: Rate limiting, waiting 2367ms
SportsDB: Rate limiting, waiting 2316ms
[9/14/2025, 3:32:51 PM] INFO [project-apex] Business event: api_key_rotation:key_configs_loaded
Context: {
  "providers": [
    "api-sports",
    "odds-api",
    "sportsdb",
    "balldontlie"
  ],
  "totalKeys": 4
}
Skipping SportsDB fallback for baseball - already have data
SportsDB: Rate limiting, waiting 2793ms
Skipping SportsDB fallback for golf - already have data
SportsDB: Rate limiting, waiting 2743ms
API-SPORTS API: 403 Forbidden - Access denied. Retrying with exponential backoff.
API-SPORTS: Retrying in 1038.5922030916322ms (attempt 1/3)
[9/14/2025, 3:32:54 PM] INFO [project-apex] Business event: api_key_rotation:single_key_reset
Context: {
  "provider": "api-sports",
  "reason": "rate_limit",
  "key": "4432************************388e"
}
API-SPORTS API: Rate limit exceeded. Waiting 60000ms before retry.
[9/14/2025, 3:32:55 PM] INFO [project-apex] Business event: api_key_rotation:single_key_reset
Context: {
  "provider": "api-sports",
  "reason": "rate_limit",
  "key": "4432************************388e"
}
API-SPORTS API: Rate limit exceeded. Waiting 60000ms before retry.
Skipping SportsDB fallback for basketball - already have data
SportsDB: Rate limiting, waiting 2795ms
Skipping SportsDB fallback for hockey - already have data
SportsDB: Rate limiting, waiting 2810ms
Skipping SportsDB fallback for football - already have data
SportsDB: Rate limiting, waiting 2788ms
Skipping SportsDB fallback for soccer - already have data
SportsDB: Rate limiting, waiting 2780ms
Skipping SportsDB fallback for golf - already have data
SportsDB: Rate limiting, waiting 2811ms
Skipping SportsDB fallback for tennis - already have data
 GET /api/live-updates?sport=all&real=true 200 in 33034ms
SportsDB: Rate limiting, waiting 2034ms
Skipping SportsDB fallback for baseball - already have data
SportsDB: Rate limiting, waiting 2813ms
Skipping SportsDB fallback for hockey - already have data
SportsDB: Rate limiting, waiting 2789ms
Skipping SportsDB fallback for basketball - already have data
SportsDB: Rate limiting, waiting 2806ms
Skipping SportsDB fallback for soccer - already have data
SportsDB: Rate limiting, waiting 2772ms
Skipping SportsDB fallback for tennis - already have data
 GET /api/live-updates?sport=all&real=true 200 in 21267ms
Skipping SportsDB fallback for football - already have data
SportsDB: Rate limiting, waiting 2764ms
Metrics snapshot: { 'business.events.api_key_rotation:key_configs_loaded:counter': 1 }
 GET /api/predictions?sport=all&limit=10 200 in 1692ms
SportsDB: Rate limiting, waiting 357ms
Skipping SportsDB fallback for golf - already have data
SportsDB: Rate limiting, waiting 2801ms
[9/14/2025, 3:33:15 PM] INFO [project-apex] Business event: api_key_rotation:key_configs_loaded
Context: {
  "providers": [
    "api-sports",
    "odds-api",
    "sportsdb",
    "balldontlie"
  ],
  "totalKeys": 4
}
API-SPORTS API: 403 Forbidden - Access denied. Retrying with exponential backoff.
API-SPORTS: Retrying in 1433.040200168331ms (attempt 1/3)
[9/14/2025, 3:33:16 PM] INFO [project-apex] Business event: api_key_rotation:single_key_reset
Context: {
  "provider": "api-sports",
  "reason": "rate_limit",
  "key": "4432************************388e"
}
API-SPORTS API: Rate limit exceeded. Waiting 60000ms before retry.
Metrics snapshot: {
  'business.events.api_key_rotation:key_configs_loaded:counter': 1,
  'business.events.api_key_rotation:single_key_reset:counter': 3
}
Skipping SportsDB fallback for hockey - already have data
SportsDB: Rate limiting, waiting 2793ms
Skipping SportsDB fallback for soccer - already have data
SportsDB: Rate limiting, waiting 2791ms
Skipping SportsDB fallback for tennis - already have data
 GET /api/live-updates?sport=all&real=true 200 in 20575ms
 GET /api/analytics/stats?sport=all 200 in 1024ms
Returning cached data for all
 GET /api/live-updates?sport=all&real=true 200 in 24ms
 GET /api/predictions?sport=all&limit=10 200 in 2155ms
API-SPORTS API: 403 Forbidden - Access denied. Retrying with exponential backoff.
API-SPORTS: Retrying in 1587.3351400154838ms (attempt 1/3)
[9/14/2025, 3:33:29 PM] INFO [project-apex] Business event: api_key_rotation:key_configs_loaded
Context: {
  "providers": [
    "api-sports",
    "odds-api",
    "sportsdb",
    "balldontlie"
  ],
  "totalKeys": 4
}
[9/14/2025, 3:33:30 PM] INFO [project-apex] Business event: api_key_rotation:single_key_reset
Context: {
  "provider": "api-sports",
  "reason": "rate_limit",
  "key": "4432************************388e"
}
API-SPORTS API: Rate limit exceeded. Waiting 60000ms before retry.
Metrics snapshot: { 'business.events.api_key_rotation:single_key_reset:counter': 1 }
API-SPORTS API: 403 Forbidden - Access denied. Retrying with exponential backoff.
API-SPORTS: Retrying in 2182.190732055257ms (attempt 2/3)
[9/14/2025, 3:33:55 PM] INFO [project-apex] Business event: api_key_rotation:single_key_reset
Context: {
  "provider": "api-sports",
  "reason": "rate_limit",
  "key": "4432************************388e"
}
API-SPORTS API: Rate limit exceeded. Waiting 60000ms before retry.
[9/14/2025, 3:33:57 PM] INFO [project-apex] Business event: api_key_rotation:single_key_reset
Context: {
  "provider": "api-sports",
  "reason": "rate_limit",
  "key": "4432************************388e"
}
API-SPORTS API: Rate limit exceeded. Waiting 60000ms before retry.
API-SPORTS API: 403 Forbidden - Access denied. Retrying with exponential backoff.
API-SPORTS: Retrying in 4443.030483439028ms (attempt 3/3)
Metrics snapshot: { 'business.events.api_key_rotation:single_key_reset:counter': 2 }
API-SPORTS API: 403 Forbidden - Access denied. Max retries exceeded. Returning empty data.
SportsDB API request failed: Unexpected end of JSON input
SportsDB failed for Unknown: SyntaxError: Unexpected end of JSON input
    at JSON.parse (<anonymous>)
    at async SportsDBClient.request (lib\sports-apis\sportsdb-client.ts:138:20)
    at async SportsDBClient.getEventsByDate (lib\sports-apis\sportsdb-client.ts:179:18)
    at async GenericSportService.fetchGames (lib\services\sports\generic\generic-sport-service.ts:83:24)
    at async EnhancedErrorHandlingService.withRetry (lib\services\error-handling-service.ts:426:16)
    at async GenericSportService.getCachedOrFetch (lib\services\core\base-service.ts:51:20)
    at async eval (lib\services\odds\sport-odds-service.ts:84:17)
    at async EnhancedErrorHandlingService.withRetry (lib\services\error-handling-service.ts:426:16)
    at async SportOddsService.getCachedOrFetch (lib\services\core\base-service.ts:51:20)
    at async GET (app\api\odds\[sport]\route.ts:42:28)
  136 |       this.consecutiveRateLimitErrors = 0
  137 |
> 138 |       const data = await response.json()
      |                    ^
  139 |
  140 |       // Validate response data
  141 |       if (!data || typeof data !== 'object') {
NHL API network error, retrying... (1/3)
NHL API network error, retrying... (2/3)
NHL API network error, retrying... (3/3)
API-SPORTS API: 403 Forbidden - Access denied. Retrying with exponential backoff.
API-SPORTS: Retrying in 4797.508216375809ms (attempt 3/3)
API-SPORTS API: 403 Forbidden - Access denied. Max retries exceeded. Returning empty data.
NHL API network error, retrying... (1/3)
NHL API: All retries failed, network unavailable
NHL API error: Error: NHL API: Network unavailable after retries
    at NHLClient.request (lib\sports-apis\nhl-client.ts:306:17)
    at async NHLClient.getSchedule (lib\sports-apis\nhl-client.ts:350:18)
    at async HockeyService.fetchGamesFromNHL (lib\services\sports\hockey\hockey-service.ts:137:21)
    at async HockeyService.fetchGames (lib\services\sports\hockey\hockey-service.ts:46:26)
    at async EnhancedErrorHandlingService.withRetry (lib\services\error-handling-service.ts:426:16)
    at async HockeyService.getCachedOrFetch (lib\services\core\base-service.ts:51:20)
    at async eval (lib\services\odds\sport-odds-service.ts:84:17)
    at async EnhancedErrorHandlingService.withRetry (lib\services\error-handling-service.ts:426:16)
    at async SportOddsService.getCachedOrFetch (lib\services\core\base-service.ts:51:20)
    at async GET (app\api\odds\[sport]\route.ts:42:28)
  304 |           // Try fallback API or return graceful error
  305 |           console.error('NHL API: All retries failed, network unavailable')
> 306 |           throw new Error('NHL API: Network unavailable after retries')
      |                 ^
  307 |         }
  308 |       }
  309 |
ESPN API Error: 400 Bad Request
[9/14/2025, 3:34:37 PM] INFO [project-apex] Business event: api_key_rotation:single_key_reset
Context: {
  "provider": "api-sports",
  "reason": "rate_limit",
  "key": "4432************************388e"
}
API-SPORTS API: Rate limit exceeded. Waiting 60000ms before retry.
NHL API network error, retrying... (2/3)
NHL API network error, retrying... (3/3)
 ⚠ Fast Refresh had to perform a full reload. Read more: https://nextjs.org/docs/messages/fast-refresh-reload
Metrics snapshot: { 'business.events.api_key_rotation:single_key_reset:counter': 1 }
NHL API: All retries failed, network unavailable
NHL API error: Error: NHL API: Network unavailable after retries
    at NHLClient.request (lib\sports-apis\nhl-client.ts:306:17)
    at async NHLClient.getSchedule (lib\sports-apis\nhl-client.ts:350:18)
    at async HockeyService.fetchGamesFromNHL (lib\services\sports\hockey\hockey-service.ts:137:21)
    at async HockeyService.fetchGames (lib\services\sports\hockey\hockey-service.ts:46:26)
    at async EnhancedErrorHandlingService.withRetry (lib\services\error-handling-service.ts:426:16)
    at async HockeyService.getCachedOrFetch (lib\services\core\base-service.ts:51:20)
    at async eval (lib\services\odds\sport-odds-service.ts:84:17)
    at async EnhancedErrorHandlingService.withRetry (lib\services\error-handling-service.ts:426:16)
    at async SportOddsService.getCachedOrFetch (lib\services\core\base-service.ts:51:20)
    at async GET (app\api\odds\[sport]\route.ts:42:28)
  304 |           // Try fallback API or return graceful error
  305 |           console.error('NHL API: All retries failed, network unavailable')
> 306 |           throw new Error('NHL API: Network unavailable after retries')
      |                 ^
  307 |         }
  308 |       }
  309 |
ESPN API Error: 400 Bad Request
API-SPORTS API: 403 Forbidden - Access denied. Retrying with exponential backoff.
API-SPORTS: Retrying in 1635.2339167066948ms (attempt 1/3)
[9/14/2025, 3:34:52 PM] INFO [project-apex] Business event: api_key_rotation:single_key_reset
Context: {
  "provider": "api-sports",
  "reason": "rate_limit",
  "key": "4432************************388e"
}
API-SPORTS API: Rate limit exceeded. Waiting 60000ms before retry.
API-SPORTS API: 403 Forbidden - Access denied. Max retries exceeded. Returning empty data.
NHL API network error, retrying... (1/3)
[9/14/2025, 3:34:57 PM] INFO [project-apex] Business event: api_key_rotation:single_key_reset
Context: {
  "provider": "api-sports",
  "reason": "rate_limit",
  "key": "4432************************388e"
}
API-SPORTS request failed: Error: API-SPORTS API Error: 429 Too Many Requests - Max retries exceeded
    at ApiSportsClient.request (lib\sports-apis\api-sports-client.ts:231:19)
    at async ApiSportsClient.getFixtures (lib\sports-apis\api-sports-client.ts:288:18)
    at async FootballService.fetchGamesFromRapidAPI (lib\services\sports\football\football-service.ts:77:24)
    at async FootballService.fetchGames (lib\services\sports\football\football-service.ts:55:33)
    at async EnhancedErrorHandlingService.withRetry (lib\services\error-handling-service.ts:426:16)
    at async FootballService.getCachedOrFetch (lib\services\core\base-service.ts:51:20)
    at async eval (lib\services\odds\sport-odds-service.ts:84:17)
    at async EnhancedErrorHandlingService.withRetry (lib\services\error-handling-service.ts:426:16)
    at async SportOddsService.getCachedOrFetch (lib\services\core\base-service.ts:51:20)
    at async GET (app\api\odds\[sport]\route.ts:42:28)
  229 |             return this.request<T>(endpoint, retryAttempt + 1)
  230 |           } else {
> 231 |             throw new Error(`API-SPORTS API Error: 429 Too Many Requests - Max retries exceeded`)
      |                   ^
  232 |           }
  233 |         } else if (response.status === 500 || response.status === 502 || response.status === 503) {
  234 |           if (retryAttempt < this.maxRetries) {
RapidAPI football error (falling back to other APIs): API-SPORTS API Error: 429 Too Many Requests - Max retries exceeded
Rate limit hit for odds, waiting 24508ms
NHL API network error, retrying... (2/3)
NHL API network error, retrying... (3/3)
NHL API: All retries failed, network unavailable
NHL API error: Error: NHL API: Network unavailable after retries
    at NHLClient.request (lib\sports-apis\nhl-client.ts:306:17)
    at async NHLClient.getSchedule (lib\sports-apis\nhl-client.ts:350:18)
    at async HockeyService.fetchGamesFromNHL (lib\services\sports\hockey\hockey-service.ts:137:21)
    at async HockeyService.fetchGames (lib\services\sports\hockey\hockey-service.ts:46:26)
    at async EnhancedErrorHandlingService.withRetry (lib\services\error-handling-service.ts:426:16)
    at async HockeyService.getCachedOrFetch (lib\services\core\base-service.ts:51:20)
    at async eval (lib\services\odds\sport-odds-service.ts:84:17)
    at async EnhancedErrorHandlingService.withRetry (lib\services\error-handling-service.ts:426:16)
    at async SportOddsService.getCachedOrFetch (lib\services\core\base-service.ts:51:20)
    at async GET (app\api\odds\[sport]\route.ts:42:28)
  304 |           // Try fallback API or return graceful error
  305 |           console.error('NHL API: All retries failed, network unavailable')
> 306 |           throw new Error('NHL API: Network unavailable after retries')
      |                 ^
  307 |         }
  308 |       }
  309 |
ESPN API Error: 400 Bad Request
API-SPORTS API: 403 Forbidden - Access denied. Retrying with exponential backoff.
API-SPORTS: Retrying in 1116.8982742758726ms (attempt 1/3)
[9/14/2025, 3:35:11 PM] INFO [project-apex] Business event: api_key_rotation:single_key_reset
Context: {
  "provider": "api-sports",
  "reason": "rate_limit",
  "key": "4432************************388e"
}
API-SPORTS API: Rate limit exceeded. Waiting 60000ms before retry.
Metrics snapshot: { 'business.events.api_key_rotation:single_key_reset:counter': 3 }
NHL API network error, retrying... (1/3)
NHL API network error, retrying... (2/3)
NHL API network error, retrying... (3/3)
NHL API: All retries failed, network unavailable
NHL API error: Error: NHL API: Network unavailable after retries
    at NHLClient.request (lib\sports-apis\nhl-client.ts:306:17)
    at async NHLClient.getSchedule (lib\sports-apis\nhl-client.ts:350:18)
    at async HockeyService.fetchGamesFromNHL (lib\services\sports\hockey\hockey-service.ts:137:21)
    at async HockeyService.fetchGames (lib\services\sports\hockey\hockey-service.ts:46:26)
    at async EnhancedErrorHandlingService.withRetry (lib\services\error-handling-service.ts:426:16)
    at async HockeyService.getCachedOrFetch (lib\services\core\base-service.ts:51:20)
    at async eval (lib\services\odds\sport-odds-service.ts:84:17)
    at async EnhancedErrorHandlingService.withRetry (lib\services\error-handling-service.ts:426:16)
    at async SportOddsService.getCachedOrFetch (lib\services\core\base-service.ts:51:20)
    at async GET (app\api\odds\[sport]\route.ts:42:28)
  304 |           // Try fallback API or return graceful error
  305 |           console.error('NHL API: All retries failed, network unavailable')
> 306 |           throw new Error('NHL API: Network unavailable after retries')
      |                 ^
  307 |         }
  308 |       }
  309 |
ESPN API Error: 400 Bad Request
API-SPORTS API: 403 Forbidden - Access denied. Retrying with exponential backoff.
API-SPORTS: Retrying in 1779.2871888932025ms (attempt 1/3)
[9/14/2025, 3:35:37 PM] INFO [project-apex] Business event: api_key_rotation:single_key_reset
Context: {
  "provider": "api-sports",
  "reason": "rate_limit",
  "key": "4432************************388e"
}
API-SPORTS API: Rate limit exceeded. Waiting 60000ms before retry.
[9/14/2025, 3:35:38 PM] INFO [project-apex] Business event: api_key_rotation:single_key_reset
Context: {
  "provider": "api-sports",
  "reason": "rate_limit",
  "key": "4432************************388e"
}
API-SPORTS API: Rate limit exceeded. Waiting 60000ms before retry.
Metrics snapshot: { 'business.events.api_key_rotation:single_key_reset:counter': 2 }
API-SPORTS API: 403 Forbidden - Access denied. Retrying with exponential backoff.
API-SPORTS: Retrying in 4925.278460981237ms (attempt 3/3)
API-SPORTS API: 403 Forbidden - Access denied. Max retries exceeded. Returning empty data.
 GET /api/odds/all?sport=all&external=true 200 in 150801ms
 GET /api/odds?sport=all&external=true 200 in 151094ms
 GET /api/live-stream?sport=all 200 in 209168ms
 GET /api/live-stream?sport=all 200 in 194519ms
 GET /api/odds?sport=all&external=true 200 in 209532ms
 GET /api/odds?sport=all&external=true 200 in 188448ms
 GET /api/odds?sport=all&external=true 200 in 165549ms
 GET / 200 in 525ms
 GET /api/odds/all?sport=all&external=true 200 in 32ms
 GET /api/odds?sport=all&external=true 200 in 345ms
Skipping SportsDB fallback for baseball - already have data
SportsDB: Rate limiting, waiting 2725ms
 GET /api/sports 200 in 281ms
[9/14/2025, 3:36:04 PM] INFO [project-apex] Business event: api_key_rotation:key_configs_loaded
Context: {
  "providers": [
    "api-sports",
    "odds-api",
    "sportsdb",
    "balldontlie"
  ],
  "totalKeys": 4
}
 GET /api/odds/all?sport=all&external=true 200 in 26ms
 GET /api/odds?sport=all&external=true 200 in 243ms
 GET /api/analytics/stats?sport=all 200 in 1222ms
 GET /api/predictions?sport=all&limit=10 200 in 1333ms
 GET /api/odds/all?sport=all&external=true 200 in 28ms
 GET /api/sports 200 in 218ms
 GET /api/odds?sport=all&external=true 200 in 183ms
[9/14/2025, 3:36:05 PM] INFO [project-apex] Business event: api_key_rotation:key_configs_loaded
Context: {
  "providers": [
    "api-sports",
    "odds-api",
    "sportsdb",
    "balldontlie"
  ],
  "totalKeys": 4
}
 GET /api/odds/all?sport=all&external=true 200 in 49ms
 GET /api/odds?sport=all&external=true 200 in 309ms
 GET /api/odds/all?sport=all&external=true 200 in 28ms
 GET /api/analytics/stats?sport=all 200 in 912ms
 GET /api/odds?sport=all&external=true 200 in 238ms
[9/14/2025, 3:36:06 PM] INFO [project-apex] Business event: api_key_rotation:key_configs_loaded
Context: {
  "providers": [
    "api-sports",
    "odds-api",
    "sportsdb",
    "balldontlie"
  ],
  "totalKeys": 4
}
Skipping SportsDB fallback for basketball - already have data
SportsDB: Rate limiting, waiting 2816ms
 GET /api/predictions?sport=all&limit=10 200 in 1631ms
 GET /api/analytics/stats?sport=all 200 in 924ms
 GET /api/analytics/stats?sport=all 200 in 919ms
 GET /api/predictions?sport=all&limit=10 200 in 1687ms
 GET /api/analytics/stats?sport=all 200 in 996ms
Skipping SportsDB fallback for football - already have data
SportsDB: Rate limiting, waiting 2813ms
 GET /api/predictions?sport=all&limit=10 200 in 1288ms
 GET /api/predictions?sport=all&limit=10 200 in 1364ms
API-SPORTS API: 403 Forbidden - Access denied. Retrying with exponential backoff.
API-SPORTS: Retrying in 4306.167839729946ms (attempt 3/3)
Skipping SportsDB fallback for golf - already have data
SportsDB: Rate limiting, waiting 2816ms
Skipping SportsDB fallback for hockey - already have data
SportsDB: Rate limiting, waiting 2793ms
API-SPORTS API: 403 Forbidden - Access denied. Max retries exceeded. Returning empty data.
 GET /api/odds/all?sport=all&external=true 200 in 212311ms
