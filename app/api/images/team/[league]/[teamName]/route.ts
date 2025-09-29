import { NextRequest, NextResponse } from 'next/server'

// Dynamic team logo generation for unknown teams
// Creates professional SVG-based logos that look good across all sports

interface LeagueStyles {
  primaryColor: string
  secondaryColor: string
  backgroundColor: string
  shape: 'circle' | 'square' | 'hexagon' | 'shield'
  pattern: 'solid' | 'striped' | '_gradient' | 'stars'
}

// Dynamic league styles loaded from database
async function getLeagueStyles(league: string): Promise<LeagueStyles> {
  try {
    // Try to get league styles from database first
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()

    if (supabase) {
      const { data } = await supabase
        .from('teams')
        .select('primary_color, secondary_color, sport')
        .eq('league', league)
        .limit(1)
        .single()

      if (data?.primary_color && data?.secondary_color) {
        return {
          primaryColor: data.primary_color,
          secondaryColor: data.secondary_color,
          backgroundColor: '#FFFFFF',
          shape: data.sport === 'football' ? 'shield' : 'circle',
          pattern: 'solid'
        }
      }
    }
  } catch (error) {
    console.warn('Error fetching league styles from database:', error)
  }

  // Fallback to default styles
  return {
    primaryColor: '#1E3A8A',
    secondaryColor: '#DC143C',
    backgroundColor: '#FFFFFF',
    shape: 'circle',
    pattern: 'solid'
  }
}

function getTeamInitials(teamName: string): string {
  const words = teamName.split(/\s+/).filter(word => word.length > 0)
  if (words.length === 1) {
    return words[0].substring(0, 3).toUpperCase()
  }
  return words.map(word => word.charAt(0)).join('').toUpperCase().substring(0, 3)
}

function getTeamColor(teamName: string): string {
  // Simple hash function to generate consistent colors per team
  let hash = 0
  for (let i = 0; i < teamName.length; i++) {
    hash = teamName.charCodeAt(i) + ((hash << 5) - hash)
  }

  const hue = Math.abs(hash) % 360
  return `hsl(${hue}, 70%, 45%)`
}

async function generateSVG(league: string, teamName: string): Promise<string> {
  const style = await getLeagueStyles(league)
  const initials = getTeamInitials(teamName)
  const uniqueColor = getTeamColor(teamName)

  // Use team's unique color as primary if league is generic
  const primaryColor = style.primaryColor || uniqueColor

  // Generate a complementary secondary color
  let secondaryColor = style.secondaryColor
  if (!secondaryColor) {
    const hueValue = Math.abs(teamName.split('').reduce((a, b) => a + b.charCodeAt(0), 0)) % 360
    const complementaryHue = (hueValue + 120) % 360
    secondaryColor = `hsl(${complementaryHue}, 70%, 55%)`
  }

  let background

  switch (style.shape) {
    case 'circle':
      background = `
        <circle cx="64" cy="64" r="60" fill="${style.backgroundColor}" stroke="${primaryColor}" stroke-width="4"/>
        <circle cx="64" cy="64" r="48" fill="${primaryColor}"/>
      `
      break

    case 'shield':
      background = `
        <path d="M32,8 L96,8 L96,32 L112,48 L112,80 L96,96 L32,112 L16,80 L16,32 Z" fill="${style.backgroundColor}" stroke="${primaryColor}" stroke-width="4"/>
        <path d="M32,8 L96,8 L96,32 L112,48 L112,80 L96,96 L32,112 L16,80 L16,32 Z" fill="${primaryColor}"/>
      `
      break

    case 'hexagon':
      background = `
        <polygon points="64,4 112,34 112,94 64,124 16,94 16,34" fill="${style.backgroundColor}" stroke="${primaryColor}" stroke-width="4"/>
        <polygon points="64,4 112,34 112,94 64,124 16,94 16,34" fill="${primaryColor}"/>
      `
      break

    default:
      background = `
        <rect x="16" y="16" width="96" height="96" rx="12" fill="${style.backgroundColor}" stroke="${primaryColor}" stroke-width="4"/>
        <rect x="16" y="16" width="96" height="96" rx="12" fill="${primaryColor}"/>
      `
  }

  // Add pattern variations
  let patternOverlay = ''
  switch (style.pattern) {
    case 'striped':
      patternOverlay = `
        <rect x="16" y="16" width="96" height="96" rx="12" fill="${secondaryColor}" opacity="0.3"/>
      `
      break
    case 'stars':
      patternOverlay = `
        ${Array.from({length: 6}, (_, i) =>
          `<circle cx="${32 + (i % 3) * 24}" cy="${24 + Math.floor(i / 3) * 24}" r="2" fill="${secondaryColor}"/>`
        ).join('\n        ')}
      `
      break
    case '_gradient':
      patternOverlay = `
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${primaryColor};stop-opacity:1" />
          <stop offset="100%" style="stop-color:${secondaryColor};stop-opacity:1" />
        </linearGradient>
      `
      break
  }

  const initialsStyle = style.backgroundColor === '#FFFFFF' || style.backgroundColor === '#000000'
    ? primaryColor
    : secondaryColor

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="128" height="128" viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
      <dropShadow dx="2" dy="2" stdDeviation="2" flood-color="rgba(0,0,0,0.3)"/>
    </filter>
  </defs>

  ${background}
  ${patternOverlay}

  <text
    x="64"
    y="76"
    font-family="Arial, sans-serif"
    font-weight="bold"
    font-size="22"
    text-anchor="middle"
    fill="${initialsStyle}"
    filter="url(#shadow)"
  >
    ${initials}
  </text>

  <!-- Subtle sport indicator -->
  <text
    x="64"
    y="100"
    font-family="Arial, sans-serif"
    font-size="6"
    text-anchor="middle"
    fill="${initialsStyle}"
    opacity="0.7"
  >
    ${league}
  </text>
</svg>`
}

export async function GET(
  _request: NextRequest,
  { params }: { params: { league: string; teamName: string } }
) {
  try {
    const { league, teamName } = params

    if (!league || !teamName) {
      return new NextResponse('Missing parameters', { status: 400 })
    }

    const decodedTeamName = decodeURIComponent(teamName).replace('.png', '')
    const decodedLeague = decodeURIComponent(league)

    const svgContent = await generateSVG(decodedLeague, decodedTeamName)

    // Return as PNG-compatible SVG response
    return new NextResponse(svgContent, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=31536000, immutable', // Cache for 1 year
        'Access-Control-Allow-Origin': '*',
      },
    })
  } catch (error) {
    console.error('Error generating team logo:', error)

    // Return a simple fallback logo
    const fallbackSVG = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="128" height="128" viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg">
  <circle cx="64" cy="64" r="60" fill="#666666" stroke="#999999" stroke-width="2"/>
  <text x="64" y="76" font-family="Arial, sans-serif" font-weight="bold" font-size="24" text-anchor="middle" fill="#FFFFFF">???</text>
</svg>`

    return new NextResponse(fallbackSVG, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=3600',
      },
    })
  }
}
