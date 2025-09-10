# Sports Image System

A comprehensive, professional image system for displaying sports team logos, player photos, and sports-related images across all major sports leagues.

## Features

- **Multi-League Support**: NBA, NFL, MLB, NHL, Premier League, La Liga, Serie A, Bundesliga, Ligue 1, Champions League, Europa League, MLS
- **Automatic Fallbacks**: Graceful degradation when images fail to load
- **Optimized Performance**: Built-in image optimization and caching
- **TypeScript Support**: Full type safety and IntelliSense
- **Responsive Design**: Works across all screen sizes
- **Free Sources**: Uses only free, professional image sources

## Quick Start

```tsx
import { TeamLogo, PlayerPhoto, SportsImageGeneric } from '@/components/ui/sports-image'

// Team logo
<TeamLogo 
  teamName="Lakers" 
  league="NBA"
  alt="Lakers logo"
  width={100}
  height={100}
/>

// Player photo
<PlayerPhoto 
  playerId={237}
  league="NBA"
  alt="LeBron James"
  width={150}
  height={150}
/>

// Sports category image
<SportsImageGeneric 
  category="BASKETBALL"
  alt="Basketball court"
  width={300}
  height={200}
/>
```

## Components

### TeamLogo

Displays team logos for any supported sports league.

```tsx
<TeamLogo 
  teamName="Lakers"           // Team name (required)
  league="NBA"                // Sports league (optional, defaults to NBA)
  alt="Lakers logo"           // Alt text (required)
  width={100}                 // Width in pixels (optional, defaults to 200)
  height={100}                // Height in pixels (optional, defaults to 200)
  className="custom-class"     // Additional CSS classes (optional)
  fallbackType="team"         // Fallback type (optional, defaults to 'team')
  onError={() => {}}          // Error handler (optional)
  priority={false}            // Next.js priority loading (optional)
  quality={80}                // Image quality 1-100 (optional, defaults to 80)
/>
```

**Supported Leagues:**
- `NBA` - National Basketball Association
- `NFL` - National Football League  
- `MLB` - Major League Baseball
- `NHL` - National Hockey League
- `Premier League` - English Premier League
- `La Liga` - Spanish La Liga
- `Serie A` - Italian Serie A
- `Bundesliga` - German Bundesliga
- `Ligue 1` - French Ligue 1
- `Champions League` - UEFA Champions League
- `Europa League` - UEFA Europa League
- `MLS` - Major League Soccer

### PlayerPhoto

Displays player photos for any supported sports league.

```tsx
<PlayerPhoto 
  playerId={237}              // Player ID (required)
  league="NBA"                // Sports league (optional, defaults to NBA)
  alt="LeBron James"          // Alt text (required)
  width={150}                 // Width in pixels (optional, defaults to 200)
  height={150}                // Height in pixels (optional, defaults to 200)
  className="rounded-full"     // Additional CSS classes (optional)
  fallbackType="player"       // Fallback type (optional, defaults to 'player')
  onError={() => {}}          // Error handler (optional)
  priority={false}            // Next.js priority loading (optional)
  quality={80}                // Image quality 1-100 (optional, defaults to 80)
/>
```

### SportsImageGeneric

Displays sports-related category images from free stock photo sources.

```tsx
<SportsImageGeneric 
  category="BASKETBALL"        // Category (required)
  alt="Basketball court"       // Alt text (required)
  width={300}                  // Width in pixels (optional, defaults to 200)
  height={200}                 // Height in pixels (optional, defaults to 200)
  className="rounded-lg"        // Additional CSS classes (optional)
  fallbackType="sports"        // Fallback type (optional, defaults to 'sports')
  onError={() => {}}           // Error handler (optional)
  priority={false}             // Next.js priority loading (optional)
  quality={80}                 // Image quality 1-100 (optional, defaults to 80)
/>
```

**Available Categories:**
- `BASKETBALL` - Basketball courts and equipment
- `FOOTBALL` - Football fields and equipment
- `BASEBALL` - Baseball fields and equipment
- `HOCKEY` - Hockey rinks and equipment
- `SOCCER` - Soccer fields and equipment
- `TENNIS` - Tennis courts and equipment
- `GOLF` - Golf courses and equipment
- `STADIUM` - Sports stadiums and arenas
- `TROPHY` - Trophies and awards
- `ANALYTICS` - Sports analytics dashboards
- `PREDICTION` - Data visualization and predictions
- `SPORTS_GENERIC` - Generic sports imagery

### SportsImageSkeleton

Loading skeleton for sports images.

```tsx
<SportsImageSkeleton 
  width={100}                  // Width in pixels (optional, defaults to 200)
  height={100}                 // Height in pixels (optional, defaults to 200)
  className="custom-class"     // Additional CSS classes (optional)
/>
```

## Image Sources

### Official APIs
- **NBA**: `https://cdn.nba.com/logos/nba/` and `https://cdn.nba.com/headshots/nba/latest/`
- **NFL**: `https://a.espncdn.com/i/teamlogos/nfl/500/` and `https://a.espncdn.com/i/headshots/nfl/players/full/`
- **MLB**: `https://a.espncdn.com/i/teamlogos/mlb/500/` and `https://img.mlbstatic.com/mlb-photos/image/upload/`
- **NHL**: `https://a.espncdn.com/i/teamlogos/nhl/500/` and `https://cms.nhl.bamgrid.com/images/headshots/current/`
- **Soccer**: `https://media.api-sports.io/football/teams/` and `https://media.api-sports.io/football/players/`

### Free Stock Images
- **Unsplash**: High-quality, royalty-free images
- **Pexels**: Professional stock photos and videos
- **Pixabay**: Free images, vectors, and videos

## Fallback System

The image system includes a robust fallback system:

1. **Primary Image**: Official team/player image from sports APIs
2. **Fallback Images**: Custom SVG fallbacks for teams, players, and sports
3. **Error Handling**: Automatic fallback when images fail to load
4. **Loading States**: Skeleton loaders during image loading

## Performance Optimization

- **Next.js Image**: Built on Next.js Image component for automatic optimization
- **Lazy Loading**: Images load only when needed
- **WebP Support**: Automatic format optimization
- **Responsive Images**: Automatic sizing for different screen sizes
- **Caching**: Built-in caching for better performance

## Error Handling

All components include comprehensive error handling:

```tsx
<TeamLogo 
  teamName="Lakers"
  alt="Lakers logo"
  onError={() => {
    console.log('Image failed to load')
    // Custom error handling
  }}
/>
```

## Styling

Components accept standard CSS classes and can be styled with Tailwind CSS:

```tsx
<TeamLogo 
  teamName="Lakers"
  alt="Lakers logo"
  className="h-12 w-12 rounded-full border-2 border-primary"
/>
```

## TypeScript Support

Full TypeScript support with comprehensive type definitions:

```tsx
import { type SportsLeague, type TeamLogoConfig } from '@/lib/services/image-service'

const league: SportsLeague = 'NBA'
const config: TeamLogoConfig = {
  width: 100,
  height: 100,
  variant: 'primary'
}
```

## Migration Guide

### From Old System

Replace old image usage:

```tsx
// Old way
<img 
  src={getTeamLogoUrl(teamName)} 
  alt={teamName}
  className="h-6 w-6"
  onError={(e) => { e.currentTarget.style.display = 'none' }}
/>

// New way
<TeamLogo 
  teamName={teamName}
  alt={teamName}
  width={24}
  height={24}
  className="h-6 w-6"
/>
```

### Benefits of New System

1. **Better Performance**: Optimized loading and caching
2. **Consistent Fallbacks**: Professional fallback images
3. **Multi-League Support**: Support for all major sports
4. **Type Safety**: Full TypeScript support
5. **Easier Maintenance**: Centralized image management
6. **Better UX**: Loading states and error handling

## Examples

See `components/examples/sports-image-examples.tsx` for comprehensive usage examples.

## Support

For questions or issues with the image system, please check:

1. Team/player names match the supported mappings
2. Player IDs are valid for the specified league
3. Network connectivity for external image sources
4. Console for any error messages

The system is designed to gracefully handle all error cases with appropriate fallbacks.
