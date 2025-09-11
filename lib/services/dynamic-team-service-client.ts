/**
 * CLIENT-SIDE DYNAMIC TEAM LOGO SERVICE
 * Database-first approach with fuzzy matching and intelligent fallbacks
 * Works in client components without server dependencies
 */

import { createClient } from '@/lib/supabase/client'
import { getApiLogoUrl, getPotentialLogoUrls, getFallbackImageUrl, type SportsLeague, type TeamLogoConfig } from './image-service'

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

export interface TeamData {
  id: string
  name: string
  city?: string
  league: string
  sport: string
  abbreviation?: string
  logo_url?: string
  primary_color?: string
  secondary_color?: string
  is_active?: boolean
}

export interface LogoResult {
  url: string
  source: 'database' | 'api' | 'generated' | 'fallback'
  teamData?: TeamData
  cached?: boolean
}

// ============================================================================
// FUZZY MATCHING UTILITIES
// ============================================================================

/**
 * Generate name variations for fuzzy matching
 */
function generateNameVariations(teamName: string): string[] {
  const variations = new Set<string>()
  
  // Original name
  variations.add(teamName.toLowerCase().trim())
  
  // Remove common words
  const commonWords = ['the', 'of', 'and', 'in', 'at', 'to', 'for', 'with', 'on']
  const words = teamName.toLowerCase().split(/\s+/).filter(word => !commonWords.includes(word))
  
  if (words.length > 1) {
    // Last word only (e.g., "Lakers" from "Los Angeles Lakers")
    variations.add(words[words.length - 1])
    
    // First word only (e.g., "Los" from "Los Angeles Lakers")
    variations.add(words[0])
    
    // All words combined
    variations.add(words.join(' '))
    
    // All words without spaces
    variations.add(words.join(''))
  }
  
  // Handle abbreviations
  if (teamName.length <= 4) {
    variations.add(teamName.toUpperCase())
  }
  
  return Array.from(variations)
}

/**
 * Calculate similarity between two strings
 */
function calculateSimilarity(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2
  const shorter = str1.length > str2.length ? str2 : str1
  
  if (longer.length === 0) return 1.0
  
  const editDistance = levenshteinDistance(longer, shorter)
  return (longer.length - editDistance) / longer.length
}

/**
 * Levenshtein distance calculation
 */
function levenshteinDistance(str1: string, str2: string): number {
  const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null))
  
  for (let i = 0; i <= str1.length; i++) matrix[0][i] = i
  for (let j = 0; j <= str2.length; j++) matrix[j][0] = j
  
  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,     // deletion
        matrix[j - 1][i] + 1,     // insertion
        matrix[j - 1][i - 1] + indicator // substitution
      )
    }
  }
  
  return matrix[str2.length][str1.length]
}

// ============================================================================
// CACHING SYSTEM
// ============================================================================

class LogoCache {
  private cache = new Map<string, LogoResult>()
  private maxSize = 1000
  private ttl = 24 * 60 * 60 * 1000 // 24 hours

  get(key: string): LogoResult | null {
    const item = this.cache.get(key)
    if (!item) return null
    
    // Check TTL
    if (Date.now() - (item as any).timestamp > this.ttl) {
      this.cache.delete(key)
      return null
    }
    
    return item
  }

  set(key: string, value: LogoResult): void {
    // Remove oldest items if cache is full
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value
      if (firstKey) {
        this.cache.delete(firstKey)
      }
    }
    
    (value as any).timestamp = Date.now()
    this.cache.set(key, value)
  }

  clear(): void {
    this.cache.clear()
  }
}

const logoCache = new LogoCache()

// ============================================================================
// DATABASE OPERATIONS
// ============================================================================

/**
 * Get team from database with fuzzy matching
 */
async function getTeamFromDatabase(teamName: string, league: SportsLeague): Promise<TeamData | null> {
  try {
    const supabase = createClient()
    if (!supabase) return null

    const variations = generateNameVariations(teamName)
    
    // Try exact matches first
    for (const variation of variations) {
      const { data: exactMatch } = await supabase
        .from('teams')
        .select('*')
        .eq('league', league)
        .eq('is_active', true)
        .or(`name.ilike.%${variation}%,abbreviation.ilike.%${variation}%`)
        .single()
      
      if (exactMatch) return exactMatch
    }
    
    // Try fuzzy matching if no exact match
    const { data: allTeams } = await supabase
      .from('teams')
      .select('*')
      .eq('league', league)
      .eq('is_active', true)
    
    if (!allTeams || allTeams.length === 0) return null
    
    // Find best match using similarity
    let bestMatch: TeamData | null = null
    let bestScore = 0
    
    for (const team of allTeams) {
      const nameScore = Math.max(
        ...variations.map(v => calculateSimilarity(v, team.name.toLowerCase()))
      )
      const abbrScore = team.abbreviation ? 
        Math.max(...variations.map(v => calculateSimilarity(v, team.abbreviation!.toLowerCase()))) : 0
      
      const score = Math.max(nameScore, abbrScore)
      
      if (score > bestScore && score > 0.6) { // 60% similarity threshold
        bestMatch = team
        bestScore = score
      }
    }
    
    return bestMatch
  } catch (error) {
    console.warn(`Database lookup failed for ${teamName} in ${league}:`, error)
    return null
  }
}

// ============================================================================
// MAIN SERVICE CLASS
// ============================================================================

export class DynamicTeamLogoServiceClient {
  private static instance: DynamicTeamLogoServiceClient

  private constructor() {}

  static getInstance(): DynamicTeamLogoServiceClient {
    if (!DynamicTeamLogoServiceClient.instance) {
      DynamicTeamLogoServiceClient.instance = new DynamicTeamLogoServiceClient()
    }
    return DynamicTeamLogoServiceClient.instance
  }

  /**
   * Get team logo with database-first approach
   */
  async getTeamLogo(
    teamName: string,
    league: SportsLeague = 'NBA',
    config: TeamLogoConfig = {}
  ): Promise<LogoResult> {
    const cacheKey = `${league}-${teamName.toLowerCase()}-${JSON.stringify(config)}`
    
    // Check cache first
    const cached = logoCache.get(cacheKey)
    if (cached) {
      return { ...cached, cached: true }
    }

    try {
      // 1. Try database lookup first
      const dbTeam = await getTeamFromDatabase(teamName, league)
      if (dbTeam?.logo_url) {
        const result: LogoResult = {
          url: dbTeam.logo_url,
          source: 'database',
          teamData: dbTeam
        }
        logoCache.set(cacheKey, result)
        return result
      }

      // 2. Try API sources (your existing logic)
      const apiUrl = getApiLogoUrl(teamName, league, config)
      if (apiUrl && !apiUrl.startsWith('/api/images/team/')) {
        const result: LogoResult = {
          url: apiUrl,
          source: 'api',
          teamData: dbTeam || undefined
        }
        logoCache.set(cacheKey, result)
        return result
      }

      // 3. Try to find a real image from external sources
      const realImageUrl = await this.findRealImageUrl(teamName, league)
      if (realImageUrl) {
        const result: LogoResult = {
          url: realImageUrl,
          source: 'api',
          teamData: dbTeam || undefined
        }
        logoCache.set(cacheKey, result)
        return result
      }

      // 4. Generate dynamic logo (only as absolute fallback)
      const generatedUrl = `/api/images/team/${encodeURIComponent(league)}/${encodeURIComponent(teamName)}.png`
      const result: LogoResult = {
        url: generatedUrl,
        source: 'generated',
        teamData: dbTeam || undefined
      }
      logoCache.set(cacheKey, result)
      return result

    } catch (error) {
      console.warn(`Logo lookup failed for ${teamName} in ${league}:`, error)
      
      // 5. Final fallback
      const result: LogoResult = {
        url: getFallbackImageUrl('team'),
        source: 'fallback'
      }
      return result
    }
  }

  /**
   * Try to find a real image URL from external sources
   */
  private async findRealImageUrl(teamName: string, league: SportsLeague): Promise<string | null> {
    try {
      // Get all potential URLs from the enhanced image service
      const potentialUrls = getPotentialLogoUrls(teamName, league)
      
      // Test each URL to see if it's accessible
      for (const url of potentialUrls) {
        try {
          // Test if the URL is accessible
          const response = await fetch(url, { 
            method: 'HEAD',
            mode: 'cors',
            cache: 'no-cache'
          })
          if (response.ok) {
            return url
          }
        } catch (error) {
          // Continue to next URL
          continue
        }
      }
      
      return null
    } catch (error) {
      console.warn(`Failed to find real image for ${teamName}:`, error)
      return null
    }
  }


  /**
   * Get all teams for a league
   */
  async getTeamsForLeague(league: SportsLeague): Promise<TeamData[]> {
    try {
      const supabase = createClient()
      if (!supabase) return []

      const { data, error } = await supabase
        .from('teams')
        .select('*')
        .eq('league', league)
        .eq('is_active', true)
        .order('name')

      if (error) {
        console.error('Failed to fetch teams:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Error fetching teams:', error)
      return []
    }
  }

  /**
   * Add or update team logo in database
   */
  async updateTeamLogo(
    teamName: string,
    league: SportsLeague,
    logoUrl: string,
    teamData?: Partial<TeamData>
  ): Promise<boolean> {
    try {
      const supabase = createClient()
      if (!supabase) return false

      const { error } = await supabase
        .from('teams')
        .upsert({
          name: teamName,
          league,
          logo_url: logoUrl,
          ...teamData,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'name,league'
        })

      if (error) {
        console.error('Failed to update team logo:', error)
        return false
      }

      // Clear cache for this team
      const cacheKey = `${league}-${teamName.toLowerCase()}`
      for (const key of logoCache['cache'].keys()) {
        if (key.startsWith(cacheKey)) {
          logoCache['cache'].delete(key)
        }
      }

      return true
    } catch (error) {
      console.error('Error updating team logo:', error)
      return false
    }
  }

  /**
   * Clear logo cache
   */
  clearCache(): void {
    logoCache.clear()
  }
}

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

/**
 * Get team logo URL (drop-in replacement for existing function)
 */
export async function getTeamLogoUrl(
  teamName: string,
  league: SportsLeague = 'NBA',
  config: TeamLogoConfig = {}
): Promise<string> {
  const service = DynamicTeamLogoServiceClient.getInstance()
  const result = await service.getTeamLogo(teamName, league, config)
  return result.url
}

/**
 * Get team logo with full result data
 */
export async function getTeamLogoData(
  teamName: string,
  league: SportsLeague = 'NBA',
  config: TeamLogoConfig = {}
): Promise<LogoResult> {
  const service = DynamicTeamLogoServiceClient.getInstance()
  return await service.getTeamLogo(teamName, league, config)
}

// Export the service instance
export const dynamicTeamServiceClient = DynamicTeamLogoServiceClient.getInstance()
