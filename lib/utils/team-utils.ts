/**
 * Team Utilities
 * Centralized functions for team-related operations
 */

import { getTeamLogoUrl as getTeamLogoFromService, getPlayerPhotoUrl as getPlayerPhotoFromService } from '../services/image-service'

// Re-export the enhanced functions from image service
export const getTeamLogoUrl = async (teamName: string, sport: string): Promise<string> => {
  try {
    // Get league information from database
    const { createClient } = await import('@/lib/supabase/client')
    const supabase = createClient()
    
    const response = await supabase
      ?.from('sports')
      .select('name, leagues')
      .eq('name', sport)
      .eq('is_active', true)
      .single()
    
    if (response && !response.error && response.data?.leagues) {
      const leagues = response.data.leagues
      const primaryLeague = Array.isArray(leagues) ? leagues[0] : leagues
      return getTeamLogoFromService(teamName, primaryLeague)
    }
    
    // Fallback to sport name if no league found
    return getTeamLogoFromService(teamName, sport)
  } catch (error) {
    console.warn(`Error getting team logo for ${teamName} in ${sport}:`, error)
    return getTeamLogoFromService(teamName, sport)
  }
}

export const getPlayerPhotoUrl = async (playerId: number, sport: string): Promise<string> => {
  try {
    // Get league information from database
    const { createClient } = await import('@/lib/supabase/client')
    const supabase = createClient()
    
    const response = await supabase
      ?.from('sports')
      .select('name, leagues')
      .eq('name', sport)
      .eq('is_active', true)
      .single()
    
    if (response && !response.error && response.data?.leagues) {
      const leagues = response.data.leagues
      const primaryLeague = Array.isArray(leagues) ? leagues[0] : leagues
      return getPlayerPhotoFromService(String(playerId), primaryLeague)
    }
    
    // Fallback to sport name if no league found
    return getPlayerPhotoFromService(String(playerId), sport)
  } catch (error) {
    console.warn(`Error getting player photo for ${playerId} in ${sport}:`, error)
    return getPlayerPhotoFromService(String(playerId), sport)
  }
}

export const getTeamColors = async (teamName: string, sport: string): Promise<{ primary: string; secondary: string }> => {
  try {
    // Try to get team colors from database first using database service
    // This will be replaced with database service integration
    const { createClient } = await import('@/lib/supabase/client')
    const supabase = createClient()
    
    const response = await supabase
      ?.from('teams')
      .select('primary_color, secondary_color')
      .eq('name', teamName)
      .eq('sport', sport)
      .single()
    
    if (response && !response.error && response.data?.primary_color && response.data?.secondary_color) {
      return {
        primary: response.data.primary_color,
        secondary: response.data.secondary_color
      }
    }
    
    // Fallback to API if not in database
    const apiColors = await getTeamColorsFromAPI(teamName, sport)
    if (apiColors) {
      return apiColors
    }
    
    // Final fallback to default colors
    return { primary: '#1D428A', secondary: '#C4CED4' }
  } catch (error) {
    console.warn(`Could not get team colors for ${teamName}:`, error)
    return { primary: '#1D428A', secondary: '#C4CED4' }
  }
}

const getTeamColorsFromAPI = async (teamName: string, _sport: string): Promise<{ primary: string; secondary: string } | null> => {
  try {
    // This would call the appropriate API to get team colors
    // For now, return null as this is a fallback
    return null
  } catch (error) {
    console.warn(`Error fetching team colors from API: ${teamName}`, error)
    return null
  }
}

export const formatTeamName = (teamName: string): string => {
  // Extract the last word as the team identifier (e.g., "Lakers" from "Los Angeles Lakers")
  const words = teamName.trim().split(' ')
  if (words.length > 1) {
    return words[words.length - 1]
  }
  return teamName
}
