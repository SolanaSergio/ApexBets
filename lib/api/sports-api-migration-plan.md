# Sports API Migration Plan

## Current State
- `lib/api/sports-api.ts` - Old unified API (being phased out)
- `lib/services/api/unified-api-client.ts` - New split service API

## Migration Steps

### Phase 1: Update Components
1. Update all components to use `unifiedApiClient` instead of `sportsAPI`
2. Remove imports of `lib/api/sports-api.ts`
3. Update component interfaces to match new API structure

### Phase 2: Remove Old API
1. Delete `lib/api/sports-api.ts`
2. Update any remaining references
3. Clean up unused imports

### Phase 3: Enhance New API
1. Add missing methods to `unifiedApiClient`
2. Ensure all component needs are met
3. Add proper TypeScript types

## Benefits
- Single source of truth for API access
- Consistent error handling
- Better performance with service caching
- Cleaner architecture
