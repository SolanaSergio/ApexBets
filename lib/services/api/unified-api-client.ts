/**
 * UNIFIED API CLIENT - CLIENT-SIDE IMPLEMENTATION
 * Provides a unified interface for client components, using the apiClient to fetch data from API routes.
 */

import { apiClient, type Game, type Team, type Player, type Prediction, type Odds, type AnalyticsStats } from '@/lib/api-client';
import { SportConfigManager, SupportedSport } from '../core/sport-config';

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta: {
    timestamp: string;
    sport?: string;
    league?: string;
    action?: string;
    count?: number;
  };
  error?: string;
}

// Re-export types for convenience
export type { SupportedSport };

// Type aliases for backward compatibility
export type UnifiedGameData = Game;
export type UnifiedTeamData = Team;
export type UnifiedPlayerData = Player;

export class UnifiedApiClient {
  /**
   * Get all supported sports synchronously (for React components)
   */
  getSupportedSportsSync(): SupportedSport[] {
    return SportConfigManager.getSupportedSports();
  }

  async getSupportedSports(): Promise<SupportedSport[]> {
    return this.getSupportedSportsSync();
  }

  async getLeaguesForSport(sport: SupportedSport): Promise<string[]> {
    const config = SportConfigManager.getSportConfig(sport);
    return config?.leagues || [];
  }

  async getDefaultLeague(sport: SupportedSport): Promise<string> {
    const config = SportConfigManager.getSportConfig(sport);
    return config?.leagues[0] || '';
  }

  async getGames(sport: SupportedSport, params: {
    league?: string;
    date?: string;
    status?: 'scheduled' | 'live' | 'finished';
    teamId?: string;
    limit?: number;
  } = {}): Promise<UnifiedGameData[]> {
    return apiClient.getGames({
      sport,
      dateFrom: params.date,
      status: params.status,
      team_id: params.teamId,
      limit: params.limit,
    });
  }

  async getLiveGames(sport: SupportedSport, league?: string): Promise<UnifiedGameData[]> {
    return this.getGames(sport, { league, status: 'live' });
  }

  async getTeams(sport: SupportedSport, params: {
    league?: string;
    search?: string;
    limit?: number;
  } = {}): Promise<UnifiedTeamData[]> {
    return apiClient.getTeams({ sport, league: params.league });
  }

  async getPlayers(sport: SupportedSport, params: {
    league?: string;
    teamId?: string;
    search?: string;
    limit?: number;
  } = {}): Promise<UnifiedPlayerData[]> {
    return apiClient.getPlayers({ sport, team_id: params.teamId, search: params.search, limit: params.limit });
  }

  async getStandings(sport: SupportedSport, league?: string, season?: string): Promise<any[]> {
    return apiClient.getStandings({ sport, league, season });
  }

  async getOdds(sport: SupportedSport, params: {
    league?: string;
    gameId?: string;
    date?: string;
  } = {}): Promise<any[]> {
    return apiClient.getOdds({ game_id: params.gameId });
  }

  async getPredictions(sport: SupportedSport, params: {
    league?: string;
    gameId?: string;
  } = {}): Promise<any[]> {
    return apiClient.getPredictions({ game_id: params.gameId });
  }

  async getAnalytics(sport: SupportedSport, params: any = {}): Promise<any> {
    return apiClient.getAnalyticsStats();
  }

  async getTeamPerformance(sport: SupportedSport, params: { teamId?: string } = {}): Promise<any[]> {
    if (!params.teamId) return [];
    return apiClient.getTeamAnalytics(params.teamId);
  }

  async getValueBets(sport: SupportedSport, params: any = {}): Promise<any[]> {
    // This functionality does not exist on the client-side apiClient
    return Promise.resolve([]);
  }

  async getSportOverview(sport: SupportedSport, league?: string): Promise<any> {
    // This is a complex server-side aggregation. Not feasible on client.
    return Promise.resolve({ sport, league, games: [], teams: [], players: [], standings: [], odds: [], predictions: [], analytics: {}, lastUpdated: new Date().toISOString() });
  }

  // Server-only methods - return empty/default values
  async getHealthStatus(): Promise<Record<string, boolean>> {
    return Promise.resolve({});
  }

  async warmupServices(sports: SupportedSport[] = []): Promise<void> {
    return Promise.resolve();
  }

  clearAllCaches(): void {}

  clearAllHealthCheckCaches(): void {}

  getCacheStats(): Record<string, any> {
    return {};
  }
  
  async getPlayerStats(sport: SupportedSport, playerId: string): Promise<any[]> {
    return apiClient.getPlayerStats({ sport, player_id: playerId });
  }
}

// Export singleton instance
export const unifiedApiClient = new UnifiedApiClient();