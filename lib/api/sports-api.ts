/**
 * UNIFIED SPORTS API CLIENT
 * Centralized API calls for all sports data providers
 */

import { z } from 'zod';

// ============================================================================
// TYPES AND SCHEMAS
// ============================================================================

const TeamSchema = z.object({
  idTeam: z.string(),
  strTeam: z.string(),
  strTeamBadge: z.string().url(),
});

const TheSportsDbSchema = z.object({
  teams: z.array(TeamSchema).nullable(),
});

const EspnTeamSchema = z.object({
  team: z.object({
    id: z.string(),
    displayName: z.string(),
    logos: z.array(z.object({
      href: z.string().url(),
    })),
  }),
});

const ApiSportsTeamSchema = z.object({
  team: z.object({
    id: z.number(),
    name: z.string(),
    logo: z.string().url(),
  }),
});

const ApiSportsResponseSchema = z.object({
  response: z.array(ApiSportsTeamSchema),
});

export type SportsApiProvider = 'TheSportsDB' | 'ESPN' | 'API-Football';

// ============================================================================
// API CLIENT IMPLEMENTATION
// ============================================================================

export class SportsApiClient {
  private static readonly THE_SPORTS_DB_BASE_URL = 'https://www.thesportsdb.com/api/v1/json/3';
  private static readonly ESPN_API_BASE_URL = 'https://site.api.espn.com/apis/site/v2/sports';
  private static readonly API_FOOTBALL_BASE_URL = 'https://v3.football.api-sports.io';

  /**
   * Fetch team logo from TheSportsDB
   */
  static async getTheSportsDBLogo(teamName: string): Promise<string | null> {
    try {
      const url = `${this.THE_SPORTS_DB_BASE_URL}/searchteams.php?t=${encodeURIComponent(teamName)}`;
      const resp = await fetch(url);
      if (!resp.ok) return null;

      const data = await resp.json();
      const parsed = TheSportsDbSchema.safeParse(data);

      if (parsed.success && parsed.data.teams && parsed.data.teams.length > 0) {
        return parsed.data.teams[0].strTeamBadge;
      }
      return null;
    } catch (error) {
      console.error('TheSportsDB API Error:', error);
      return null;
    }
  }

  /**
   * Fetch team logo from ESPN API
   */
  static async getEspnLogo(sport: string, league: string, teamName: string): Promise<string | null> {
    try {
      // First, get all teams to find the team ID
      const teamsUrl = `${this.ESPN_API_BASE_URL}/${sport}/${league}/teams`;
      const teamsResp = await fetch(teamsUrl);
      if (!teamsResp.ok) return null;

      const teamsData = await teamsResp.json();
      const team = teamsData.sports.leagues.teams.find(
        (t: any) => t.team.displayName.toLowerCase() === teamName.toLowerCase()
      );

      if (team && team.team.logos && team.team.logos.length > 0) {
        return team.team.logos.href;
      }
      return null;
    } catch (error) {
      console.error('ESPN API Error:', error);
      return null;
    }
  }

  /**
   * Fetch team logo from API-Football
   */
  static async getApiFootballLogo(leagueId: string, season: string, teamName: string): Promise<string | null> {
    try {
      const url = `${this.API_FOOTBALL_BASE_URL}/teams?league=${leagueId}&season=${season}`;
      const resp = await fetch(url, {
        headers: {
          'x-rapidapi-key': process.env.API_FOOTBALL_KEY || '',
        },
      });
      if (!resp.ok) return null;

      const data = await resp.json();
      const parsed = ApiSportsResponseSchema.safeParse(data);

      if (parsed.success) {
        const team = parsed.data.response.find(
          (r) => r.team.name.toLowerCase() === teamName.toLowerCase()
        );
        return team ? team.team.logo : null;
      }
      return null;
    } catch (error) {
      console.error('API-Football Error:', error);
      return null;
    }
  }
}

// Export a default instance for backward compatibility
export const sportsAPI = new SportsApiClient();
