/**
 * Dynamic Team Service Client
 * Handles team-related operations and data
 */

import { structuredLogger } from './structured-logger'

export interface TeamLogoData {
  logoUrl: string
  colors: {
    primary: string
    secondary: string
  }
  teamName: string
  league: string
  sport: string
}

export class DynamicTeamServiceClient {
  private static instance: DynamicTeamServiceClient

  public static getInstance(): DynamicTeamServiceClient {
    if (!DynamicTeamServiceClient.instance) {
      DynamicTeamServiceClient.instance = new DynamicTeamServiceClient()
    }
    return DynamicTeamServiceClient.instance
  }

  async getTeamLogoData(teamName: string, league?: string, sport?: string): Promise<TeamLogoData> {
    try {
      // Default team logo data
      const defaultData: TeamLogoData = {
        logoUrl: '',
        colors: {
          primary: '#000000',
          secondary: '#ffffff'
        },
        teamName,
        league: league || 'unknown',
        sport: sport || 'unknown'
      }

      // In a real implementation, this would fetch from an API or database
      // For now, return default data
      structuredLogger.debug('Getting team logo data', { teamName, league, sport })

      return defaultData

    } catch (error) {
      structuredLogger.error('Failed to get team logo data', {
        teamName,
        league,
        sport,
        error: error instanceof Error ? error.message : String(error)
      })

      return {
        logoUrl: '',
        colors: {
          primary: '#000000',
          secondary: '#ffffff'
        },
        teamName,
        league: league || 'unknown',
        sport: sport || 'unknown'
      }
    }
  }

  async getTeamColors(teamName: string, sport?: string): Promise<{ primary: string; secondary: string }> {
    const logoData = await this.getTeamLogoData(teamName, undefined, sport)
    return logoData.colors
  }

  async getTeamLogoUrl(teamName: string, league?: string, sport?: string): Promise<string> {
    const logoData = await this.getTeamLogoData(teamName, league, sport)
    return logoData.logoUrl
  }
}

export const dynamicTeamServiceClient = DynamicTeamServiceClient.getInstance()

// Export convenience functions
export const getTeamLogoData = (teamName: string, league?: string, sport?: string) => 
  dynamicTeamServiceClient.getTeamLogoData(teamName, league, sport)

export const getTeamColors = (teamName: string, sport?: string) => 
  dynamicTeamServiceClient.getTeamColors(teamName, sport)

export const getTeamLogoUrl = (teamName: string, league?: string, sport?: string) => 
  dynamicTeamServiceClient.getTeamLogoUrl(teamName, league, sport)
