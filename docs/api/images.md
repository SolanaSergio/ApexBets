# Image Service Architecture

## Overview

The ApexBets image service implements a robust 4-tier fallback system for team
logos and player photos, prioritizing database-cached URLs while ensuring 100%
availability through intelligent fallbacks.

## Architecture

### 4-Tier Image System

1. **Memory Cache** (client-side) - Fastest access for recently loaded images
2. **Database Cache** (primary) - ESPN CDN URLs stored in Supabase
3. **ESPN CDN Direct** (fallback) - Real-time ESPN CDN URL generation
4. **SVG Generation** (final fallback) - Dynamic SVG with team colors

### Database Schema

```sql
-- Teams table
CREATE TABLE teams (
  id UUID PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  sport VARCHAR(50) NOT NULL,
  league VARCHAR(50),
  logo_url TEXT,
  primary_color VARCHAR(7),
  secondary_color VARCHAR(7),
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Players table
CREATE TABLE players (
  id UUID PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  sport VARCHAR(50) NOT NULL,
  headshot_url TEXT,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Image audit log
CREATE TABLE image_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type VARCHAR(20) NOT NULL,
  entity_id UUID NOT NULL,
  entity_name VARCHAR(200),
  sport VARCHAR(50),
  action VARCHAR(50) NOT NULL,
  old_url TEXT,
  new_url TEXT,
  status VARCHAR(20),
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Core Services

### Bulletproof Image Service

**File**: `lib/services/bulletproof-image-service.ts`

The main service implementing the 4-tier fallback system:

```typescript
// Get team logo with full fallback chain
const result = await bulletproofImageService.getTeamLogo(
  teamName,
  sport,
  league
)

// Result includes:
// - url: The final image URL
// - source: 'database' | 'espn-cdn' | 'svg'
// - cached: Whether from cache
// - fallback: Whether fallback was used
```

### ESPN CDN Mapper

**File**: `lib/services/espn-cdn-mapper.ts`

Maps team names to ESPN CDN URLs:

```typescript
// Generate ESPN CDN URL for team
const espnUrl = await espnCDNMapper.getTeamLogoURL(teamName, sport, league)
// Returns: https://a.espncdn.com/i/teamlogos/nba/500/3.png
```

### SVG Generator

**File**: `lib/services/svg-generator.ts`

Generates dynamic SVG logos with team colors:

```typescript
// Generate SVG logo with team colors
const svgDataUri = await svgGenerator.generateTeamLogo(
  teamName,
  sport,
  league,
  teamColors
)
// Returns: data:image/svg+xml;base64,...
```

### Image Monitoring Service

**File**: `lib/services/image-monitoring-service.ts`

Tracks image load performance and health:

```typescript
// Track image load event
imageMonitoringService.trackImageLoad({
  entityType: 'team',
  entityName: 'Lakers',
  sport: 'basketball',
  source: 'database',
  success: true,
  loadTime: 150,
})

// Get health metrics
const health = imageMonitoringService.getHealthMetrics()
```

## Edge Functions

### Populate Images

**File**: `supabase/functions/populate-images/index.ts`

Initial population of all logos from ESPN CDN:

```bash
# Trigger population for all sports
POST /functions/v1/populate-images

# Trigger for specific sport
POST /functions/v1/populate-images?sport=basketball
```

### Auto Update Images

**File**: `supabase/functions/auto-update-images/index.ts`

Daily automated updates for missing/stale logos:

```bash
# Manual trigger
POST /functions/v1/auto-update-images

# With sport filter
POST /functions/v1/auto-update-images?sport=football
```

### Verify Images

**File**: `supabase/functions/verify-images/index.ts`

Weekly verification of all stored URLs:

```bash
# Manual verification
POST /functions/v1/verify-images

# With sport filter
POST /functions/v1/verify-images?sport=basketball
```

## API Endpoints

### Image Health Dashboard

**File**: `app/api/admin/image-health/route.ts`

```bash
GET /api/admin/image-health
```

Returns comprehensive health metrics:

```json
{
  "success": true,
  "data": {
    "stats": {
      "totalLoads": 1250,
      "successRate": 98.4,
      "bySource": {
        "database": { "loads": 1000, "success": 995, "failure": 5 },
        "espn-cdn": { "loads": 200, "success": 195, "failure": 5 },
        "svg": { "loads": 50, "success": 50, "failure": 0 }
      }
    },
    "health": {
      "overallHealth": "excellent",
      "databaseHitRate": 80.0,
      "svgFallbackRate": 4.0,
      "averageLoadTime": 150
    }
  }
}
```

### Image Statistics

**File**: `app/api/admin/image-stats/route.ts`

```bash
# Get overall stats
GET /api/admin/image-stats

# Get stats for specific entity
GET /api/admin/image-stats?entity=Lakers&type=team
```

### Image Event Monitoring

**File**: `app/api/monitor/image-event/route.ts`

```bash
POST /api/monitor/image-event
Content-Type: application/json

{
  "entityType": "team",
  "entityName": "Lakers",
  "sport": "basketball",
  "source": "database",
  "success": true,
  "url": "https://a.espncdn.com/i/teamlogos/nba/500/3.png",
  "loadTime": 150
}
```

### Manual Triggers

**File**: `app/api/admin/populate-logos/route.ts`

```bash
# Populate all logos
POST /api/admin/populate-logos

# Populate specific sport
POST /api/admin/populate-logos?sport=basketball
```

**File**: `app/api/admin/verify-logos/route.ts`

```bash
# Verify all logos
POST /api/admin/verify-logos

# Verify specific sport
POST /api/admin/verify-logos?sport=football
```

## Components

### Team Logo Component

**File**: `components/ui/team-logo.tsx`

```tsx
<TeamLogo
  teamName="Lakers"
  sport="basketball"
  league="NBA"
  size="lg"
  className="rounded-full"
/>
```

### Sports Image Component

**File**: `components/ui/sports-image.tsx`

```tsx
// Team logo
<TeamLogo
  teamName="Warriors"
  league="NBA"
  width={64}
  height={64}
/>

// Player photo
<PlayerPhoto
  playerId="lebron-james"
  playerName="LeBron James"
  width={48}
  height={48}
/>
```

## Automation & Scheduling

### Cron Jobs

Set up automated tasks in Supabase:

```sql
-- Daily auto-update at 2 AM
SELECT cron.schedule('auto-update-images-daily', '0 2 * * *',
  $$SELECT net.http_post('https://[project-ref].supabase.co/functions/v1/auto-update-images')$$);

-- Weekly verification on Sunday at 3 AM
SELECT cron.schedule('verify-images-weekly', '0 3 * * 0',
  $$SELECT net.http_post('https://[project-ref].supabase.co/functions/v1/verify-images')$$);
```

## Testing

### Integration Tests

**File**: `tests/integration/images/logo-verification.test.ts`

Tests database cache, ESPN fallback, SVG fallback, and monitoring.

### Visual E2E Tests

**File**: `tests/e2e/logo-visual-verification.spec.ts`

Playwright tests for visual verification of logos on all pages.

## Performance Metrics

### Success Criteria

- **95%+ teams** with ESPN CDN logos
- **95%+ images** from database (no external calls)
- **<5% SVG fallback** rate
- **<100ms average** load time
- **100% automated** updates within 24hr
- **Visual tests pass** - real logos everywhere

### Monitoring

The system tracks:

- Image load success/failure rates
- Source distribution (database vs ESPN vs SVG)
- Load times and performance
- Fallback usage patterns
- Health metrics and alerts

## Troubleshooting

### Common Issues

1. **High SVG Fallback Rate**
   - Check database population status
   - Verify ESPN CDN mappings
   - Run populate-images Edge Function

2. **Slow Load Times**
   - Check database performance
   - Verify ESPN CDN accessibility
   - Review monitoring metrics

3. **Missing Team Colors**
   - Ensure teams table has primary_color/secondary_color
   - Run populate-images to update colors
   - Check SVG generation logs

### Debug Commands

```bash
# Check image health
curl /api/admin/image-health

# Trigger logo population
curl -X POST /api/admin/populate-logos

# Verify all logos
curl -X POST /api/admin/verify-logos

# Check specific team stats
curl /api/admin/image-stats?entity=Lakers&type=team
```

### Logs

- **Image Service**: Check browser console for image load errors
- **Edge Functions**: Check Supabase Edge Function logs
- **Database**: Check image_audit_log table for operation history
- **Monitoring**: Use image monitoring service for real-time metrics
