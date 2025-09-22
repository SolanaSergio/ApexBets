import { NextResponse } from 'next/server'

// Dynamic player photo generation for missing player IDs
// Creates professional SVG-based player photos with sport-specific styling

interface SportStyles {
  jerseyColor: string
  skinTone: string
  hairColor: string
  helmetColor: string
  sportShape: string
}

// Dynamic sport styles - will be loaded from database
let SPORT_STYLES: Record<string, SportStyles> = {}

// Initialize sport styles from database
async function initializeSportStyles() {
  try {
    // Use database service to get sport configurations
    const { createClient } = await import('@/lib/supabase/client')
    const supabase = createClient()
    
    const response = await supabase
      ?.from('sports')
      .select('name, jersey_color, skin_tone, hair_color, helmet_color, sport_shape')
      .eq('is_active', true)
    
    if (response && !response.error && response.data) {
      SPORT_STYLES = response.data.reduce((acc, sport) => {
        acc[sport.name] = {
          jerseyColor: sport.jersey_color || '#1E3A8A',
          skinTone: sport.skin_tone || '#D2B48C',
          hairColor: sport.hair_color || '#6B4423',
          helmetColor: sport.helmet_color || '#FFD700',
          sportShape: sport.sport_shape || 'circle'
        }
        return acc
      }, {} as Record<string, SportStyles>)
    }
  } catch (error) {
    console.warn('Failed to load sport styles from database, using defaults:', error)
    // Fallback to minimal default
    SPORT_STYLES = {
      default: { jerseyColor: '#1E3A8A', skinTone: '#D2B48C', hairColor: '#6B4423', helmetColor: '#FFD700', sportShape: 'circle' }
    }
  }
}

function getPlayerInitials(playerId: string | number): string {
  // For string names, extract initials
  if (typeof playerId === 'string' && isNaN(Number(playerId))) {
    const words = playerId.split(/\s+/).filter(word => word.length > 0)
    if (words.length >= 2) {
      return (words[0].charAt(0) + words[1].charAt(0)).toUpperCase()
    }
    return words[0].substring(0, 2).toUpperCase()
  }

  // For numeric IDs, show #ID
  return `#${playerId}`
}

function getPlayerColor(playerId: string | number): string {
  // Hash function to generate consistent colors per player
  const identifier = typeof playerId === 'string' ? playerId : playerId.toString()
  let hash = 0
  for (let i = 0; i < identifier.length; i++) {
    hash = identifier.charCodeAt(i) + ((hash << 5) - hash)
  }

  const hue = Math.abs(hash) % 360
  return `hsl(${hue}, 70%, 45%)`
}

function getSportShape(sportShape: string): string {
  // Dynamic sport shape generation based on sport type
  // This will be loaded from database configuration
  const shapes: Record<string, string> = {
    'basketball': '<circle cx="22" cy="22" r="8" fill="#FF6347" stroke="#8B0000" stroke-width="1"/>',
    'football': '<ellipse cx="22" cy="22" rx="10" ry="6" fill="#8B4513" stroke="#654321" stroke-width="1"/>',
    'soccer': '<circle cx="22" cy="22" r="8" fill="#FFFFFF" stroke="#000000" stroke-width="1"/><path d="M14,22 Q22,14 30,22 Q22,30 14,22Z" fill="#000000"/>',
    'baseball': '<circle cx="22" cy="22" r="8" fill="#FFFFFF" stroke="#8B0000" stroke-width="1"/><path d="M18,22 L22,18 M22,26 L26,22 M22,18 L26,22 M18,22 L22,26" stroke="#8B0000" stroke-width="1" fill="none"/>',
    'hockey': '<polygon points="14,18 16,14 28,14 30,18 28,26 16,26" fill="#D3D3D3" stroke="#696969" stroke-width="1"/>',
    'circle': '<circle cx="22" cy="22" r="8" fill="#FFD700" stroke="#FFA500" stroke-width="1"/>',
    'square': '<rect x="14" y="14" width="16" height="16" fill="#FFD700" stroke="#FFA500" stroke-width="1"/>',
    'triangle': '<polygon points="22,14 14,26 30,26" fill="#FFD700" stroke="#FFA500" stroke-width="1"/>'
  }
  
  return shapes[sportShape] || shapes['circle']
}

async function generatePlayerSVG(league: string, playerId: string | number): Promise<string> {
  // Initialize sport styles if not already loaded
  if (Object.keys(SPORT_STYLES).length === 0) {
    await initializeSportStyles()
  }
  
  const style = SPORT_STYLES[league] || SPORT_STYLES.default
  const initials = getPlayerInitials(playerId)
  const uniqueColor = getPlayerColor(playerId)

  const jerseyColor = style.jerseyColor || uniqueColor
  const sportElement = getSportShape(style.sportShape)

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="128" height="128" viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <filter id="playerShadow" x="-50%" y="-50%" width="200%" height="200%">
      <dropShadow dx="2" dy="2" stdDeviation="2" flood-color="rgba(0,0,0,0.3)"/>
    </filter>

    <pattern id="jerseyPattern" patternUnits="userSpaceOnUse" width="10" height="10">
      <rect width="10" height="10" fill="${jerseyColor}" opacity="0.9"/>
      <circle cx="5" cy="3" r="1.5" fill="${uniqueColor}" opacity="0.7"/>
      <circle cx="7" cy="7" r="1.5" fill="${uniqueColor}" opacity="0.5"/>
    </pattern>
  </defs>

  <!-- Background circle -->
  <circle cx="64" cy="64" r="60" fill="#F8F9FA" stroke="#E9ECEF" stroke-width="2"/>

  <!-- Player jersey/background -->
  <circle cx="64" cy="64" r="52" fill="url(#jerseyPattern)" stroke="${jerseyColor}" stroke-width="3"/>

  <!-- Player silhouette -->
  <circle cx="64" cy="50" r="20" fill="${style.skinTone}" stroke="${style.skinTone}" stroke-width="1" opacity="0.9"/>
  <circle cx="64" cy="45" r="12" fill="${style.hairColor}" opacity="0.8"/>
  <ellipse cx="62" cy="48" rx="1.5" ry="0.8" fill="#000000"/>  <!-- Left eye -->
  <ellipse cx="66" cy="48" rx="1.5" ry="0.8" fill="#000000"/>  <!-- Right eye -->

  <!-- Player number/jersey number -->
  <text x="64" y="78" font-family="Arial, sans-serif" font-weight="bold" font-size="32" text-anchor="middle" fill="#FFFFFF" stroke="#000000" stroke-width="0.5" filter="url(#playerShadow)">
    ${initials}
  </text>

  <!-- Sport element -->
  <g transform="translate(0, 84)" opacity="0.8">
    ${sportElement}
  </g>

  <!-- League identifier -->
  <text x="64" y="110" font-family="Arial, sans-serif" font-size="6" text-anchor="middle" fill="#6C757D" opacity="0.6">
    ${league}
  </text>
</svg>`
}

export async function GET(
  context: { params: Promise<{ league: string; playerId: string }> }
) {
  const { params } = context;
  const resolvedParams = await params;
  try {
    const { league, playerId } = resolvedParams

    if (!league || !playerId) {
      return new NextResponse('Missing parameters', { status: 400 })
    }

    const decodedLeague = decodeURIComponent(league)
    const decodedPlayerId = decodeURIComponent(playerId).replace('.jpg', '').replace('.png', '')

    // Try to parse as number first, fallback to string
    const parsedPlayerId = isNaN(Number(decodedPlayerId)) ? decodedPlayerId : Number(decodedPlayerId)

    const svgContent = await generatePlayerSVG(decodedLeague, parsedPlayerId)

    return new NextResponse(svgContent, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Access-Control-Allow-Origin': '*',
      },
    })
  } catch (error) {
    console.error('Error generating player photo:', error)

    // Return a simple fallback player photo
    const fallbackSVG = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="128" height="128" viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg">
  <circle cx="64" cy="64" r="60" fill="#E9ECEF" stroke="#ADB5BD" stroke-width="2"/>
  <circle cx="64" cy="50" r="20" fill="#DDD" stroke="#BBB" stroke-width="1"/>
  <circle cx="64" cy="45" r="12" fill="#888"/>
  <text x="64" y="78" font-family="Arial, sans-serif" font-weight="bold" font-size="24" text-anchor="middle" fill="#666">
    ?
  </text>
</svg>`

    return new NextResponse(fallbackSVG, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=3600',
      },
    })
  }
}
