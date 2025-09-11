/**
 * COMPREHENSIVE SPORTS IMAGE SERVICE
 * Dynamic logo system for all teams and sports
 */

import { promises as fs } from 'fs';
import path from 'path';

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

// Initialize team logos from database
async function initializeTeamLogos() {
  try {
    const { createClient } = await import('@/lib/supabase/client')
    const supabase = createClient()
    
    const response = await supabase
      ?.from('sports')
      .select('name, logo_base_url, headshot_base_url, image_sources')
      .eq('is_active', true)
    
    if (response && !response.error && response.data) {
      TEAM_LOGOS = response.data.reduce((acc, sport) => {
        acc[sport.name] = {
          logos: sport.logo_base_url || '',
          headshots: sport.headshot_base_url || '',
          sources: sport.image_sources || [],
          teams: {} // Will be populated dynamically from database
        }
        return acc
      }, {} as Record<string, any>)
    }
  } catch (error) {
    console.warn('Failed to load team logos from database, using defaults:', error)
    // Fallback to minimal default
    TEAM_LOGOS = {
      default: {
        logos: '',
        headshots: '',
        sources: [],
        teams: {}
      }
    }
  }
}

// Dynamic sports images - loaded from database
let SPORTS_IMAGES: Record<string, string> = {}

// Initialize sports images from database
async function initializeSportsImages() {
  try {
    const { createClient } = await import('@/lib/supabase/client')
    const supabase = createClient()
    
    const response = await supabase
      ?.from('sports')
      .select('name, image_url')
      .eq('is_active', true)
    
    if (response && !response.error && response.data) {
      SPORTS_IMAGES = response.data.reduce((acc, sport) => {
        acc[sport.name.toUpperCase()] = sport.image_url || ''
        return acc
      }, {} as Record<string, string>)
    }
  } catch (error) {
    console.warn('Failed to load sports images from database, using defaults:', error)
    // Fallback to minimal default
    SPORTS_IMAGES = {
      DEFAULT: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?q=80&w=400&h=250&auto=format&fit=crop'
    }
  }
}

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
        TEAM_LOGOS.NBA.sources.forEach((source: string) => {
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
        TEAM_LOGOS.NFL.sources.forEach((source: string) => {
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
        TEAM_LOGOS.SOCCER.sources.forEach((source: string) => {
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
