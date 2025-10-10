import { NextRequest, NextResponse } from 'next/server'
import { bulletproofImageService } from '@/lib/services/bulletproof-image-service'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ league: string; teamName: string }> }
) {
  try {
    const { league, teamName } = await params

    if (!league || !teamName) {
      return new NextResponse('Missing parameters', { status: 400 })
    }

    const decodedTeamName = decodeURIComponent(teamName).replace('.png', '')
    const decodedLeague = decodeURIComponent(league)

    // Use bulletproof image service to get team logo
    const result = await bulletproofImageService.getTeamLogo(
      decodedTeamName,
      'unknown', // sport - will be determined by service
      decodedLeague
    )

    // Extract SVG content from data URI if it's SVG
    let svgContent: string
    if (result.url.startsWith('data:image/svg+xml,')) {
      svgContent = decodeURIComponent(result.url.split(',')[1])
    } else {
      // If it's not SVG, return the URL as a redirect
      return NextResponse.redirect(result.url)
    }

    // Return as SVG response
    return new NextResponse(svgContent, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=31536000, immutable', // Cache for 1 year
        'Access-Control-Allow-Origin': '*',
        'X-Image-Source': result.source,
        'X-Image-Fallback': result.fallback ? 'true' : 'false'
      },
    })
  } catch (error) {
    console.error('Error generating team logo:', error)

    // Ultimate fallback SVG
    const fallbackSVG = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="128" height="128" viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg">
  <circle cx="64" cy="64" r="60" fill="#666666" stroke="#999999" stroke-width="2"/>
  <text x="64" y="76" font-family="Arial, sans-serif" font-weight="bold" font-size="24" text-anchor="middle" fill="#FFFFFF">???</text>
</svg>`

    return new NextResponse(fallbackSVG, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=3600',
        'X-Image-Source': 'fallback',
        'X-Image-Fallback': 'true'
      },
    })
  }
}
