# Supabase Edge Function - Sports Data Sync

This is a fully sport-agnostic data synchronization Edge Function that runs on Supabase's Deno runtime.

## TypeScript Configuration

This Edge Function uses Deno's TypeScript runtime, which has different module resolution than Node.js. The TypeScript errors you see in your IDE are expected because:

1. **Deno uses URL-based imports** - `https://deno.land/std@0.168.0/http/server.ts`
2. **Your IDE uses Node.js TypeScript** - which doesn't understand Deno URLs
3. **This is normal and expected** - the function will work correctly when deployed

## Files Structure

```
sync-sports-data/
├── index.ts              # Main Edge Function code
├── deno.json            # Deno configuration
├── tsconfig.json        # TypeScript configuration for IDE
├── types.d.ts           # Type definitions for Deno
├── .vscode/
│   └── settings.json    # VS Code settings for Deno
└── README.md            # This file
```

## How It Works

1. **Dynamic Sport Loading**: Reads supported sports from environment variables
2. **API Fallback Strategy**: Tries multiple API endpoints for each sport
3. **Data Normalization**: Converts different API formats to our database schema
4. **Rate Limiting**: Respects API rate limits per sport
5. **Error Handling**: Graceful degradation with comprehensive logging

## Environment Variables

Set these in your Supabase Edge Function secrets:

```env
# Required
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Sports configuration
SUPPORTED_SPORTS=basketball,football,baseball,soccer,hockey

# Sport-specific API keys (optional)
BASKETBALL_API_KEY=your_basketball_api_key
BASKETBALL_BASE_URL=https://api.balldontlie.io/v1
BASKETBALL_LEAGUES=NBA,WNBA

# Generic API keys (used as fallbacks)
RAPIDAPI_KEY=your_rapidapi_key
SPORTSDB_API_KEY=your_sportsdb_key
```

## Deployment

```bash
# Deploy the Edge Function
pnpm run deploy:edge-function

# Or manually
supabase functions deploy sync-sports-data
```

## Testing

```bash
# Test the function locally
curl -X POST "https://your-project.supabase.co/functions/v1/sync-sports-data" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"dataTypes": ["games", "teams", "players", "standings"]}'
```

## TypeScript Errors in IDE

The TypeScript errors you see are **expected and normal** because:

- Your IDE uses Node.js TypeScript configuration
- Deno uses different module resolution
- The function works correctly when deployed to Supabase
- This is a common issue with Deno Edge Functions

## Solutions for IDE Errors

1. **Install Deno VS Code Extension**: `denoland.vscode-deno`
2. **Use the provided .vscode/settings.json**
3. **Ignore the TypeScript errors** - they don't affect functionality
4. **Focus on the actual code logic** - not the import errors

## Data Flow

```
External Cron → Edge Function → Sports APIs → Database
     ↓              ↓              ↓           ↓
  Every 15min   Deno Runtime   Rate Limited   Supabase
```

## Supported Sports

Any sport can be added by setting the appropriate environment variables:

```env
{SPORT}_API_KEY=your_api_key
{SPORT}_BASE_URL=your_api_url
{SPORT}_LEAGUES=league1,league2
{SPORT}_RATE_LIMIT=60
{SPORT}_PRIORITY=1
```

## Error Handling

- **API Failures**: Graceful fallback to alternative endpoints
- **Rate Limiting**: Automatic retry with exponential backoff
- **Data Validation**: All data is validated before database insertion
- **Logging**: Comprehensive logging for debugging

## Performance

- **Concurrent Processing**: Multiple sports processed in parallel
- **Rate Limiting**: Respects API limits per sport
- **Caching**: Built-in response caching
- **Optimization**: Minimal memory footprint

---

**Note**: The TypeScript errors in your IDE are expected and don't affect the function's operation. The function will work correctly when deployed to Supabase.
