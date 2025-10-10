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
      const result = await getTeamLogoFromService(teamName, primaryLeague, sport)
      return result.url
    }
    
    // Fallback to sport name if no league found
    const result = await getTeamLogoFromService(teamName, sport)
    return result.url
  } catch (error) {
    console.warn(`Error getting team logo for ${teamName} in ${sport}:`, error)
    const result = await getTeamLogoFromService(teamName, sport)
    return result.url
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
      // Use primary league for player photo lookup
      const primaryLeague = Array.isArray(leagues) ? leagues[0] : leagues
      const result = await getPlayerPhotoFromService(String(playerId), primaryLeague, sport)
      return result.url
    }
    
    // Fallback to sport name if no league found
    const result = await getPlayerPhotoFromService(String(playerId), sport)
    return result.url
  } catch (error) {
    console.warn(`Error getting player photo for ${playerId} in ${sport}:`, error)
    const result = await getPlayerPhotoFromService(String(playerId), sport)
    return result.url
  }
}

export const getTeamColors = async (teamName: string, sport: string): Promise<{ primary: string; secondary: string } | null> => {
  try {
    // Try to get team colors from database first
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
    
    // Try API if not in database
    const apiColors = await getTeamColorsFromAPI(teamName, sport)
    if (apiColors) {
      return apiColors
    }
    
    // No fallback - return null to indicate no colors available
    console.warn(`No team colors found for ${teamName} (${sport})`)
    return null
  } catch (error) {
    console.error(`Error getting team colors for ${teamName}:`, error)
    return null
  }
}

const getTeamColorsFromAPI = async (teamName: string, sport: string): Promise<{ primary: string; secondary: string } | null> => {
  try {
    // Try TheSportsDB API for team colors
    const apiKey = process.env.THESPORTSDB_API_KEY
    if (!apiKey) {
      console.warn('TheSportsDB API key not configured')
      return null
    }

    // Search for team by name and sport
    const searchUrl = `https://www.thesportsdb.com/api/v1/json/${apiKey}/searchteams.php?t=${encodeURIComponent(teamName)}`
    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'ApexBets/1.0'
      }
    })

    if (!response.ok) {
      console.warn(`TheSportsDB API error: ${response.status}`)
      return null
    }

    const data = await response.json()
    if (!data.teams || data.teams.length === 0) {
      return null
    }

    // Find matching team by sport
    const team = data.teams.find((t: any) => 
      t.strSport?.toLowerCase() === sport.toLowerCase() ||
      t.strLeague?.toLowerCase().includes(sport.toLowerCase())
    )

    if (!team) {
      return null
    }

    // Extract colors from team data
    const primaryColor = team.strTeamBadge?.includes('primary') ? 
      extractColorFromUrl(team.strTeamBadge) : null
    const secondaryColor = team.strTeamLogo?.includes('secondary') ? 
      extractColorFromUrl(team.strTeamLogo) : null

    if (primaryColor && secondaryColor) {
      return {
        primary: primaryColor,
        secondary: secondaryColor
      }
    }

    // Try to extract colors from team badge/logo URLs
    if (team.strTeamBadge) {
      const badgeColors = await extractColorsFromImage(team.strTeamBadge)
      if (badgeColors) {
        return badgeColors
      }
    }

    return null
  } catch (error) {
    console.warn(`Error fetching team colors from API: ${teamName}`, error)
    return null
  }
}

// Helper function to extract color from URL (if URL contains color info)
const extractColorFromUrl = (_url: string): string | null => {
  // This is a placeholder - would need actual color extraction logic
  // For now, return null to indicate no color found
  return null
}

// Helper function to extract dominant colors from image
const extractColorsFromImage = async (_imageUrl: string): Promise<{ primary: string; secondary: string } | null> => {
  try {
    // This would use a color extraction library or service
    // For now, return null to indicate no colors extracted
    return null
  } catch (error) {
    console.warn('Error extracting colors from image:', error)
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
