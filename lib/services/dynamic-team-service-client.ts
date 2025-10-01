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
      // Try to fetch from database first using client-side client
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      
      if (supabase) {
        const { data: teamData } = await supabase
          .from('teams')
          .select('logo_url, colors')
          .eq('name', teamName)
          .eq('sport', sport || '')
          .eq('league_name', league || '')
          .single()

        if (teamData) {
          return {
            logoUrl: teamData.logo_url || '',
            colors: teamData.colors ? JSON.parse(teamData.colors) : {
              primary: '#000000',
              secondary: '#ffffff'
            },
            teamName,
            league: league || 'unknown',
            sport: sport || 'unknown'
          }
        }
      }

      // Fallback to default data
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

      structuredLogger.debug('Using default team logo data', { teamName, league, sport })
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
