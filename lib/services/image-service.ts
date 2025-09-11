/**
 * COMPREHENSIVE SPORTS IMAGE SERVICE
 * Dynamic logo system for all teams and sports
 */

import { promises as fs } from 'fs';
import path from 'path';

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

export type SportsLeague =
  | 'NBA' | 'NFL' | 'MLB' | 'NHL'
  | 'Premier League' | 'La Liga' | 'Serie A' | 'Bundesliga' | 'Ligue 1'
  | 'Champions League' | 'Europa League' | 'MLS';

export interface LogoInfo {
  url: string;
  fallback: string;
  dimensions?: {
    width: number;
    height: number;
  };
}

export interface TeamLogoConfig {
  variant?: 'primary' | 'secondary' | 'alt';
  format?: 'svg' | 'png' | 'webp';
  quality?: number;
}

export interface PlayerPhotoConfig {
  variant?: 'headshot' | 'action';
  format?: 'jpg' | 'png' | 'webp';
  quality?: number;
}

// ============================================================================
// IMAGE SOURCES AND MAPPINGS
// ============================================================================

// Enhanced team logo sources with multiple fallbacks
const TEAM_LOGOS = {
  NBA: {
    logos: 'https://cdn.nba.com/logos/nba/',
    headshots: 'https://cdn.nba.com/headshots/nba/latest/',
    // Multiple image sources for better coverage
    sources: [
      'https://cdn.nba.com/logos/nba/',
      'https://a.espncdn.com/i/teamlogos/nba/500/',
      'https://logos-world.net/wp-content/uploads/2020/06/',
      'https://cdn.freebiesupply.com/logos/large/2x/'
    ],
    teams: {} // Will be populated dynamically from database
  },
  NFL: {
    logos: 'https://a.espncdn.com/i/teamlogos/nfl/500/',
    headshots: 'https://a.espncdn.com/i/headshots/nfl/players/full/',
    sources: [
      'https://a.espncdn.com/i/teamlogos/nfl/500/',
      'https://static.www.nfl.com/image/private/t_headshot_desktop/league/',
      'https://logos-world.net/wp-content/uploads/2020/06/',
      'https://cdn.freebiesupply.com/logos/large/2x/'
    ],
    teams: {} // Will be populated dynamically from database
  },
  SOCCER: {
    logos: 'https://media.api-sports.io/football/teams/',
    headshots: 'https://media.api-sports.io/football/players/',
    sources: [
      'https://media.api-sports.io/football/teams/',
      'https://logos-world.net/wp-content/uploads/2020/06/',
      'https://cdn.freebiesupply.com/logos/large/2x/',
      'https://upload.wikimedia.org/wikipedia/en/'
    ],
    teams: {} // Will be populated dynamically from database
  }
} as const;

const SPORTS_IMAGES = {
  BASKETBALL: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?q=80&w=400&h=250&auto=format&fit=crop',
  FOOTBALL: 'https://images.unsplash.com/photo-1560279964-5e28c3c1c53c?q=80&w=400&h=250&auto=format&fit=crop',
  BASEBALL: 'https://images.unsplash.com/photo-1589958802941-26b22d2a4479?q=80&w=400&h=250&auto=format&fit=crop',
  HOCKEY: 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?q=80&w=400&h=250&auto=format&fit=crop',
  SOCCER: 'https://images.unsplash.com/photo-1574623452334-1e0ac2b3ccb4?q=80&w=400&h=250&auto=format&fit=crop',
  TENNIS: 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?q=80&w=400&h=250&auto=format&fit=crop',
  GOLF: 'https://images.unsplash.com/photo-1587174486073-ae58eb6c85dc?q=80&w=400&h=250&auto=format&fit=crop',
  STADIUM: 'https://images.unsplash.com/photo-1574622810360-1a29dbb43bdf?q=80&w=400&h=250&auto=format&fit=crop',
  TROPHY: 'https://images.unsplash.com/photo-1567427018141-0584cfcbf1b8?q=80&w=400&h=250&auto=format&fit=crop',
  ANALYTICS: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=400&h=250&auto=format&fit=crop',
  PREDICTION: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?q=80&w=400&h=250&auto=format&fit=crop',
  SPORTS_GENERIC: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?q=80&w=400&h=250&auto=format&fit=crop'
} as const;

// ============================================================================
// MAIN SERVICE FUNCTIONS
// ============================================================================

/**
 * Get team logo URL for any supported league and team
 * @deprecated Use getTeamLogoUrl from dynamic-team-service.ts for database-first approach
 */
export function getTeamLogoUrl(
  teamName: string,
  league: SportsLeague = 'NBA',
  config: TeamLogoConfig = {}
): string {
  const { variant = 'primary', format = 'png', quality = 80 } = config;
  const normalizedTeam = teamName.toLowerCase().replace(/\s+/g, '-');

  try {
    // Handle different league formats
    switch (league) {
      case 'NBA':
        const nbaTeamId = TEAM_LOGOS.NBA.teams[normalizedTeam as keyof typeof TEAM_LOGOS.NBA.teams];
        if (nbaTeamId) {
          return `${TEAM_LOGOS.NBA.logos}${nbaTeamId}/${variant}/L/logo.${format}`;
        }
        break;

      case 'NFL':
        const nflTeamCode = TEAM_LOGOS.NFL.teams[normalizedTeam as keyof typeof TEAM_LOGOS.NFL.teams];
        if (nflTeamCode) {
          return `${TEAM_LOGOS.NFL.logos}${nflTeamCode}.png`;
        }
        break;

      case 'Premier League':
      case 'La Liga':
      case 'Serie A':
      case 'Bundesliga':
      case 'Ligue 1':
        const soccerTeamId = TEAM_LOGOS.SOCCER.teams[normalizedTeam as keyof typeof TEAM_LOGOS.SOCCER.teams];
        if (soccerTeamId) {
          return `${TEAM_LOGOS.SOCCER.logos}${soccerTeamId}.png`;
        }
        break;
    }
  } catch (error) {
    console.warn(`Logo lookup failed for ${teamName} in ${league}:`, error);
  }

  // Fallback to local API endpoint
  return `/api/images/team/${encodeURIComponent(league)}/${encodeURIComponent(teamName)}.png`;
}

/**
 * Get team logo URL using API sources only (for fallback in dynamic service)
 */
export function getApiLogoUrl(
  teamName: string,
  league: SportsLeague = 'NBA',
  config: TeamLogoConfig = {}
): string {
  const { variant = 'primary', format = 'png', quality = 80 } = config;
  const normalizedTeam = teamName.toLowerCase().replace(/\s+/g, '-');

  try {
    // Handle different league formats
    switch (league) {
      case 'NBA':
        const nbaTeamId = TEAM_LOGOS.NBA.teams[normalizedTeam as keyof typeof TEAM_LOGOS.NBA.teams];
        if (nbaTeamId) {
          return `${TEAM_LOGOS.NBA.logos}${nbaTeamId}/${variant}/L/logo.${format}`;
        }
        break;

      case 'NFL':
        const nflTeamCode = TEAM_LOGOS.NFL.teams[normalizedTeam as keyof typeof TEAM_LOGOS.NFL.teams];
        if (nflTeamCode) {
          return `${TEAM_LOGOS.NFL.logos}${nflTeamCode}.png`;
        }
        break;

      case 'Premier League':
      case 'La Liga':
      case 'Serie A':
      case 'Bundesliga':
      case 'Ligue 1':
        const soccerTeamId = TEAM_LOGOS.SOCCER.teams[normalizedTeam as keyof typeof TEAM_LOGOS.SOCCER.teams];
        if (soccerTeamId) {
          return `${TEAM_LOGOS.SOCCER.logos}${soccerTeamId}.png`;
        }
        break;
    }
  } catch (error) {
    console.warn(`API logo lookup failed for ${teamName} in ${league}:`, error);
  }

  // Return empty string if no API match found
  return '';
}

/**
 * Get multiple potential logo URLs for a team (for testing availability)
 */
export function getPotentialLogoUrls(
  teamName: string,
  league: SportsLeague = 'NBA',
  config: TeamLogoConfig = {}
): string[] {
  const { variant = 'primary', format = 'png' } = config;
  const normalizedTeam = teamName.toLowerCase().replace(/\s+/g, '-');
  const urls: string[] = [];

  try {
    switch (league) {
      case 'NBA':
        const nbaTeamId = TEAM_LOGOS.NBA.teams[normalizedTeam as keyof typeof TEAM_LOGOS.NBA.teams];
        if (nbaTeamId) {
          // Primary NBA source
          urls.push(`${TEAM_LOGOS.NBA.logos}${nbaTeamId}/${variant}/L/logo.${format}`);
          // ESPN source
          urls.push(`https://a.espncdn.com/i/teamlogos/nba/500/${normalizedTeam}.png`);
        }
        // Try all sources even without team ID
        TEAM_LOGOS.NBA.sources.forEach(source => {
          urls.push(`${source}${normalizedTeam}.png`);
          urls.push(`${source}${normalizedTeam}.svg`);
        });
        break;

      case 'NFL':
        const nflTeamCode = TEAM_LOGOS.NFL.teams[normalizedTeam as keyof typeof TEAM_LOGOS.NFL.teams];
        if (nflTeamCode) {
          // Primary NFL source
          urls.push(`${TEAM_LOGOS.NFL.logos}${nflTeamCode}.png`);
        }
        // Try all sources
        TEAM_LOGOS.NFL.sources.forEach(source => {
          urls.push(`${source}${normalizedTeam}.png`);
          urls.push(`${source}${normalizedTeam}.svg`);
        });
        break;

      case 'Premier League':
      case 'La Liga':
      case 'Serie A':
      case 'Bundesliga':
      case 'Ligue 1':
        const soccerTeamId = TEAM_LOGOS.SOCCER.teams[normalizedTeam as keyof typeof TEAM_LOGOS.SOCCER.teams];
        if (soccerTeamId) {
          // Primary soccer source
          urls.push(`${TEAM_LOGOS.SOCCER.logos}${soccerTeamId}.png`);
        }
        // Try all sources
        TEAM_LOGOS.SOCCER.sources.forEach(source => {
          urls.push(`${source}${normalizedTeam}.png`);
          urls.push(`${source}${normalizedTeam}.svg`);
        });
        break;

      default:
        // Generic sources for unknown leagues
        urls.push(
          `https://logos-world.net/wp-content/uploads/2020/06/${normalizedTeam}-Logo.png`,
          `https://cdn.freebiesupply.com/logos/large/2x/${normalizedTeam}-logo-png-transparent.png`,
          `https://upload.wikimedia.org/wikipedia/en/thumb/0/0c/${normalizedTeam}_logo.svg/1200px-${normalizedTeam}_logo.svg.png`
        );
    }
  } catch (error) {
    console.warn(`Failed to generate potential URLs for ${teamName} in ${league}:`, error);
  }

  return urls;
}

/**
 * Get player photo URL for any supported league
 */
export function getPlayerPhotoUrl(
  playerId: string | number,
  league: SportsLeague = 'NBA',
  config: PlayerPhotoConfig = {}
): string {
  const { variant = 'headshot', format = 'jpg', quality = 80 } = config;

  try {
    switch (league) {
      case 'NBA':
        return `${TEAM_LOGOS.NBA.headshots}${playerId}.${format}`;

      case 'NFL':
        return `${TEAM_LOGOS.NFL.headshots}${playerId}.${format}`;

      case 'Premier League':
      case 'La Liga':
      case 'Serie A':
      case 'Bundesliga':
      case 'Ligue 1':
        return `${TEAM_LOGOS.SOCCER.headshots}${playerId}.png`;
    }
  } catch (error) {
    console.warn(`Player photo lookup failed for ID ${playerId} in ${league}:`, error);
  }

  // Fallback to local API endpoint
  return `/api/images/player/${encodeURIComponent(league)}/${playerId}.jpg`;
}

/**
 * Get sports category image URL
 */
export function getSportsImageUrl(
  category: keyof typeof SPORTS_IMAGES,
  options: { width?: number; height?: number; quality?: number } = {}
): string {
  const { width = 400, height = 250, quality = 80 } = options;
  const baseUrl = SPORTS_IMAGES[category];

  if (!baseUrl) return getFallbackImageUrl('sports');

  // Add optimization parameters to Unsplash URLs
  if (baseUrl.includes('unsplash.com')) {
    return `${baseUrl}&w=${width}&h=${height}&q=${quality}&auto=format&fit=crop`;
  }

  return baseUrl;
}

/**
 * Get fallback image URL based on type
 */
export function getFallbackImageUrl(type: 'team' | 'player' | 'sports' = 'sports'): string {
  switch (type) {
    case 'team':
      return '/images/fallback-team-logo.svg';
    case 'player':
      return '/images/fallback-player-photo.svg';
    case 'sports':
    default:
      return '/images/fallback-sports-image.svg';
  }
}

/**
 * Utility function to get image with fallback chain
 */
export function getImageWithFallback(
  primaryUrl: string,
  fallbackUrl: string = getFallbackImageUrl('sports')
): string {
  return primaryUrl || fallbackUrl;
}

// ============================================================================
// DYNAMIC LOGO SERVICE CLASS
// ============================================================================

interface TeamLogoInfo {
  [teamId: string]: LogoInfo;
}

interface SportLogos {
  [sportId: string]: TeamLogoInfo;
}

class DynamicImageService {
  private static instance: DynamicImageService;
  private logoCache: Map<string, LogoInfo> = new Map();
  private sportLogos: SportLogos = {};

  private constructor() {}

  static getInstance(): DynamicImageService {
    if (!DynamicImageService.instance) {
      DynamicImageService.instance = new DynamicImageService();
    }
    return DynamicImageService.instance;
  }

  async getTeamLogo(sportId: string, teamId: string): Promise<LogoInfo> {
    const cacheKey = `${sportId}-${teamId}`;

    if (this.logoCache.has(cacheKey)) {
      return this.logoCache.get(cacheKey)!;
    }

    const logoInfo = await this.fetchTeamLogo(sportId, teamId);
    this.logoCache.set(cacheKey, logoInfo);

    return logoInfo;
  }

  private async fetchTeamLogo(sportId: string, teamId: string): Promise<LogoInfo> {
    const normalizedTeam = teamId.toLowerCase().replace(/\s+/g, '-');

    // Try direct mapping first
    const directUrl = getTeamLogoUrl(teamId, sportId as SportsLeague);

    // If it's a local API endpoint, it means no mapping was found
    if (directUrl.startsWith('/api/images/team/')) {
      return {
        url: directUrl,
        fallback: getFallbackImageUrl('team')
      };
    }

    // Return the mapped URL
    return {
      url: directUrl,
      fallback: getFallbackImageUrl('team')
    };
  }

  async loadSportLogos(sportId: string): Promise<void> {
    // Load logos from database if needed
    // Database integration for image metadata
    console.log(`Loading logos for sport: ${sportId}`);
  }

  clearCache(): void {
    this.logoCache.clear();
    this.sportLogos = {};
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export { SPORTS_IMAGES as IMAGE_SOURCES };
export default DynamicImageService;
export type { TeamLogoInfo, SportLogos };
