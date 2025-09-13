/**
 * COMPREHENSIVE SPORTS IMAGE SERVICE
 * Dynamic logo system for all teams and sports
 */

// import { promises as fs } from 'fs';
// import path from 'path';

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

export type SportsLeague = string; // Dynamic league support

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

// Dynamic team logo sources - loaded from database
let TEAM_LOGOS: Record<string, any> = {}

// Initialize team logos from database - removed unused function

// Dynamic sports images - loaded from database
let SPORTS_IMAGES: Record<string, string> = {}

// Initialize sports images from database - removed unused function

// ============================================================================
// MAIN SERVICE FUNCTIONS
// ============================================================================

/**
 * Get league configuration dynamically
 */
function getLeagueConfig(league: string): any {
  // Map league names to their configurations
  const leagueMap: Record<string, any> = {
    'NBA': TEAM_LOGOS.NBA,
    'NFL': TEAM_LOGOS.NFL,
    'Premier League': TEAM_LOGOS.SOCCER,
    'La Liga': TEAM_LOGOS.SOCCER,
    'Serie A': TEAM_LOGOS.SOCCER,
    'Bundesliga': TEAM_LOGOS.SOCCER,
    'Ligue 1': TEAM_LOGOS.SOCCER
  };
  
  return leagueMap[league] || null;
}

/**
 * Get team logo URL for any supported league and team
 * @deprecated Use getTeamLogoUrl from dynamic-team-service.ts for database-first approach
 */
export function getTeamLogoUrl(
  teamName: string,
  league: SportsLeague,
  config: TeamLogoConfig = {}
): string {
  const { variant = 'primary', format = 'png' } = config;
  const normalizedTeam = teamName.toLowerCase().replace(/\s+/g, '-');

  try {
    // Get league configuration dynamically
    const leagueConfig = getLeagueConfig(league);
    if (leagueConfig) {
      const teamId = leagueConfig.teams[normalizedTeam as keyof typeof leagueConfig.teams];
      if (teamId) {
        return `${leagueConfig.logos}${teamId}/${variant}/L/logo.${format}`;
      }
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
  league: SportsLeague,
  config: TeamLogoConfig = {}
): string {
  const { variant = 'primary', format = 'png' } = config;
  const normalizedTeam = teamName.toLowerCase().replace(/\s+/g, '-');

  try {
    // Get league configuration dynamically
    const leagueConfig = getLeagueConfig(league);
    if (leagueConfig) {
      const teamId = leagueConfig.teams[normalizedTeam as keyof typeof leagueConfig.teams];
      if (teamId) {
        return `${leagueConfig.logos}${teamId}/${variant}/L/logo.${format}`;
      }
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
  league: SportsLeague,
  config: TeamLogoConfig = {}
): string[] {
  const { variant = 'primary', format = 'png' } = config;
  const normalizedTeam = teamName.toLowerCase().replace(/\s+/g, '-');
  const urls: string[] = [];

  try {
    // Get league configuration dynamically
    const leagueConfig = getLeagueConfig(league);
    if (leagueConfig) {
      const teamId = leagueConfig.teams[normalizedTeam as keyof typeof leagueConfig.teams];
      if (teamId) {
        // Primary source
        urls.push(`${leagueConfig.logos}${teamId}/${variant}/L/logo.${format}`);
        // ESPN source for NBA
        if (league === 'NBA') {
          urls.push(`https://a.espncdn.com/i/teamlogos/nba/500/${normalizedTeam}.png`);
        }
      }
      // Try all sources even without team ID
      if (leagueConfig.sources) {
        leagueConfig.sources.forEach((source: string) => {
          urls.push(`${source}${normalizedTeam}.png`);
          urls.push(`${source}${normalizedTeam}.svg`);
        });
      }
    } else {
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
  const { format = 'jpg' } = config;

  try {
    // Dynamic league lookup - will be loaded from database configuration
    // For now, use fallback to local API endpoint for all leagues
    const leagueConfig = TEAM_LOGOS[league];
    if (leagueConfig && leagueConfig.headshots) {
      return `${leagueConfig.headshots}${playerId}.${format}`;
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
  const { width = 400, height = 250 } = options;
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
  // private sportLogos: SportLogos = {};

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
    // const normalizedTeam = teamId.toLowerCase().replace(/\s+/g, '-');

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
    // this.sportLogos = {};
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export { SPORTS_IMAGES as IMAGE_SOURCES };
export default DynamicImageService;
export type { TeamLogoInfo, SportLogos };
