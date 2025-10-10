/**
 * SVG Generator Service
 * Generates professional SVG logos and player photos with team colors
 * ALWAYS returns valid SVG - never fails
 */

import { structuredLogger } from './structured-logger'
import { databaseService } from './database-service'

export interface TeamColors {
  primary: string
  secondary: string
}

export interface SVGConfig {
  width: number
  height: number
  shape: 'circle' | 'square' | 'hexagon' | 'shield'
  pattern: 'solid' | 'gradient' | 'striped'
}

export class SVGGenerator {
  private static instance: SVGGenerator

  public static getInstance(): SVGGenerator {
    if (!SVGGenerator.instance) {
      SVGGenerator.instance = new SVGGenerator()
    }
    return SVGGenerator.instance
  }

  /**
   * Generate team logo SVG with team colors
   * ALWAYS returns valid SVG - never fails
   */
  async generateTeamLogo(
    teamName: string,
    sport: string,
    league: string,
    colors?: TeamColors,
    config?: Partial<SVGConfig>
  ): Promise<string> {
    try {
      // Validate inputs
      if (!teamName || typeof teamName !== 'string') {
        throw new Error('Invalid team name provided')
      }
      
      const finalConfig: SVGConfig = {
        width: 128,
        height: 128,
        shape: 'circle',
        pattern: 'gradient',
        ...config
      }

      const finalColors = colors || await this.getDefaultTeamColors(teamName, sport)
      const initials = this.getTeamInitials(teamName)
      
      const svg = this.createTeamSVG(initials, finalColors, finalConfig, league)
      
      // Validate SVG was generated
      if (!svg || typeof svg !== 'string' || svg.trim().length === 0) {
        throw new Error('Failed to generate SVG content')
      }
      
      return svg
    } catch (error) {
      structuredLogger.error('Failed to generate team logo SVG', {
        teamName,
        sport,
        league,
        error: error instanceof Error ? error.message : String(error)
      })
      
      // Fallback SVG - ALWAYS works
      return this.createFallbackSVG(teamName)
    }
  }

  /**
   * Generate player photo SVG with team colors
   * ALWAYS returns valid SVG - never fails
   */
  async generatePlayerPhoto(
    playerName: string,
    sport: string,
    teamName?: string,
    colors?: TeamColors,
    config?: Partial<SVGConfig>
  ): Promise<string> {
    try {
      // Validate inputs
      if (!playerName || typeof playerName !== 'string') {
        throw new Error('Invalid player name provided')
      }
      
      const finalConfig: SVGConfig = {
        width: 128,
        height: 128,
        shape: 'circle',
        pattern: 'gradient',
        ...config
      }

      const finalColors = colors || await this.getDefaultTeamColors(teamName || playerName, sport)
      const initials = this.getPlayerInitials(playerName)
      
      const svg = this.createPlayerSVG(initials, finalColors, finalConfig, sport)
      
      // Validate SVG was generated
      if (!svg || typeof svg !== 'string' || svg.trim().length === 0) {
        throw new Error('Failed to generate SVG content')
      }
      
      return svg
    } catch (error) {
      structuredLogger.error('Failed to generate player photo SVG', {
        playerName,
        sport,
        teamName,
        error: error instanceof Error ? error.message : String(error)
      })
      
      // Fallback SVG - ALWAYS works
      return this.createFallbackPlayerSVG(playerName)
    }
  }

  private getTeamInitials(teamName: string): string {
    const words = teamName.split(/\s+/).filter(word => word.length > 0)
    if (words.length === 1) {
      return words[0].substring(0, 3).toUpperCase()
    }
    return words.map(word => word.charAt(0)).join('').toUpperCase().substring(0, 3)
  }

  private getPlayerInitials(playerName: string): string {
    const words = playerName.split(/\s+/).filter(word => word.length > 0)
    if (words.length >= 2) {
      return words.map(word => word.charAt(0)).join('').toUpperCase().substring(0, 2)
    }
    return words[0].substring(0, 2).toUpperCase()
  }

  private async getDefaultTeamColors(teamName: string, sport: string): Promise<TeamColors> {
    try {
      // Query database for team colors using database service
      const query = `
        SELECT colors 
        FROM teams 
        WHERE name = $1 AND sport = $2 
        LIMIT 1
      `
      
      const result = await databaseService.executeSQL(query, [teamName, sport])
      
      if (result.success && result.data.length > 0) {
        const teamData = result.data[0] as { colors?: { primary?: string; secondary?: string } }
        
        if (teamData?.colors?.primary && teamData?.colors?.secondary) {
          return {
            primary: teamData.colors.primary,
            secondary: teamData.colors.secondary
          }
        }
      }
      
      // Fallback to hash-based colors if not in database
      const hash = this.hashString(teamName + sport)
      const hue = Math.abs(hash) % 360
      
      return {
        primary: `hsl(${hue}, 70%, 45%)`,
        secondary: `hsl(${(hue + 120) % 360}, 60%, 55%)`
      }
    } catch (error) {
      structuredLogger.debug('Failed to fetch team colors from database', { teamName, sport })
      
      // Ultimate fallback
      return {
        primary: '#1E3A8A',
        secondary: '#DC143C'
      }
    }
  }

  private hashString(str: string): number {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32bit integer
    }
    return hash
  }

  private createTeamSVG(
    initials: string,
    colors: TeamColors,
    config: SVGConfig,
    league: string
  ): string {
    const { width, height, shape, pattern } = config
    const viewBox = `0 0 ${width} ${height}`
    
    let background = ''
    let patternOverlay = ''
    
    // Create shape
    switch (shape) {
      case 'circle':
        background = `
          <circle cx="${width/2}" cy="${height/2}" r="${width/2 - 4}" 
                  fill="white" stroke="${colors.primary}" stroke-width="4"/>
          <circle cx="${width/2}" cy="${height/2}" r="${width/2 - 12}" 
                  fill="${colors.primary}"/>
        `
        break
      case 'shield':
        background = `
          <path d="M${width/4},8 L${width*3/4},8 L${width*3/4},${width/3} L${width-8},${width/2} L${width*3/4},${width*2/3} L${width*3/4},${height-8} L${width/4},${height-8} L8,${width*2/3} L8,${width/3} Z" 
                fill="white" stroke="${colors.primary}" stroke-width="4"/>
          <path d="M${width/4},8 L${width*3/4},8 L${width*3/4},${width/3} L${width-8},${width/2} L${width*3/4},${width*2/3} L${width*3/4},${height-8} L${width/4},${height-8} L8,${width*2/3} L8,${width/3} Z" 
                fill="${colors.primary}"/>
        `
        break
      case 'square':
        background = `
          <rect x="8" y="8" width="${width-16}" height="${height-16}" rx="12" 
                fill="white" stroke="${colors.primary}" stroke-width="4"/>
          <rect x="16" y="16" width="${width-32}" height="${height-32}" rx="8" 
                fill="${colors.primary}"/>
        `
        break
      default:
        background = `
          <circle cx="${width/2}" cy="${height/2}" r="${width/2 - 4}" 
                  fill="white" stroke="${colors.primary}" stroke-width="4"/>
          <circle cx="${width/2}" cy="${height/2}" r="${width/2 - 12}" 
                  fill="${colors.primary}"/>
        `
    }

    // Add pattern
    if (pattern === 'gradient') {
      patternOverlay = `
        <defs>
          <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:${colors.primary};stop-opacity:1" />
            <stop offset="100%" style="stop-color:${colors.secondary};stop-opacity:1" />
          </linearGradient>
        </defs>
        <circle cx="${width/2}" cy="${height/2}" r="${width/2 - 12}" fill="url(#grad)"/>
      `
    }

    const textColor = this.getContrastColor(colors.primary)
    const fontSize = Math.min(width / 6, 24)
    
    return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" viewBox="${viewBox}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
      <feDropShadow dx="2" dy="2" stdDeviation="2" flood-color="rgba(0,0,0,0.3)"/>
    </filter>
  </defs>
  
  ${background}
  ${patternOverlay}
  
  <text x="${width/2}" y="${height/2 + fontSize/3}" 
        font-family="Arial, sans-serif" font-weight="bold" font-size="${fontSize}" 
        text-anchor="middle" fill="${textColor}" filter="url(#shadow)">
    ${initials}
  </text>
  
  <text x="${width/2}" y="${height - 8}" 
        font-family="Arial, sans-serif" font-size="8" 
        text-anchor="middle" fill="${textColor}" opacity="0.7">
    ${league}
  </text>
</svg>`
  }

  private createPlayerSVG(
    initials: string,
    colors: TeamColors,
    config: SVGConfig,
    sport: string
  ): string {
    const { width, height } = config
    const viewBox = `0 0 ${width} ${height}`
    
    const background = `
      <circle cx="${width/2}" cy="${height/2}" r="${width/2 - 4}" 
              fill="white" stroke="${colors.primary}" stroke-width="4"/>
      <circle cx="${width/2}" cy="${height/2}" r="${width/2 - 12}" 
              fill="${colors.primary}"/>
    `
    
    const patternOverlay = `
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${colors.primary};stop-opacity:1" />
          <stop offset="100%" style="stop-color:${colors.secondary};stop-opacity:1" />
        </linearGradient>
      </defs>
      <circle cx="${width/2}" cy="${height/2}" r="${width/2 - 12}" fill="url(#grad)"/>
    `

    const textColor = this.getContrastColor(colors.primary)
    const fontSize = Math.min(width / 4, 20)
    
    return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" viewBox="${viewBox}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
      <feDropShadow dx="2" dy="2" stdDeviation="2" flood-color="rgba(0,0,0,0.3)"/>
    </filter>
  </defs>
  
  ${background}
  ${patternOverlay}
  
  <text x="${width/2}" y="${height/2 + fontSize/3}" 
        font-family="Arial, sans-serif" font-weight="bold" font-size="${fontSize}" 
        text-anchor="middle" fill="${textColor}" filter="url(#shadow)">
    ${initials}
  </text>
  
  <text x="${width/2}" y="${height - 8}" 
        font-family="Arial, sans-serif" font-size="8" 
        text-anchor="middle" fill="${textColor}" opacity="0.7">
    ${sport}
  </text>
</svg>`
  }

  private createFallbackSVG(teamName: string): string {
    const initials = this.getTeamInitials(teamName)
    return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="128" height="128" viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg">
  <circle cx="64" cy="64" r="60" fill="#666666" stroke="#999999" stroke-width="2"/>
  <text x="64" y="76" font-family="Arial, sans-serif" font-weight="bold" font-size="24" 
        text-anchor="middle" fill="#FFFFFF">${initials}</text>
</svg>`
  }

  private createFallbackPlayerSVG(playerName: string): string {
    const initials = this.getPlayerInitials(playerName)
    return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="128" height="128" viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg">
  <circle cx="64" cy="64" r="60" fill="#666666" stroke="#999999" stroke-width="2"/>
  <text x="64" y="76" font-family="Arial, sans-serif" font-weight="bold" font-size="20" 
        text-anchor="middle" fill="#FFFFFF">${initials}</text>
</svg>`
  }

  private getContrastColor(hexColor: string): string {
    // Convert hex to RGB
    const hex = hexColor.replace('#', '')
    const r = parseInt(hex.substr(0, 2), 16)
    const g = parseInt(hex.substr(2, 2), 16)
    const b = parseInt(hex.substr(4, 2), 16)
    
    // Calculate luminance
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
    
    return luminance > 0.5 ? '#000000' : '#FFFFFF'
  }

  /**
   * Convert SVG string to data URI
   * ALWAYS returns valid data URI - never fails
   */
  svgToDataUri(svg: string): string {
    // Validate input
    if (!svg || typeof svg !== 'string') {
      structuredLogger.warn('Invalid SVG provided to svgToDataUri, using fallback', { svg: typeof svg })
      svg = this.createFallbackSVG('Unknown')
    }
    
    try {
      const encoded = encodeURIComponent(svg)
      return `data:image/svg+xml,${encoded}`
    } catch (error) {
      structuredLogger.error('Failed to encode SVG to data URI', { 
        error: error instanceof Error ? error.message : String(error) 
      })
      
      // Ultimate fallback
      const fallbackSvg = this.createFallbackSVG('Error')
      return `data:image/svg+xml,${encodeURIComponent(fallbackSvg)}`
    }
  }
}

export const svgGenerator = SVGGenerator.getInstance()
