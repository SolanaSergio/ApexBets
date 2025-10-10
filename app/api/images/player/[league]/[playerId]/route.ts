import { NextResponse } from 'next/server'
import { bulletproofImageService } from '@/lib/services/bulletproof-image-service'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ league: string; playerId: string }> }
) {
  try {
    const { league, playerId } = await params

    if (!league || !playerId) {
      return new NextResponse('Missing parameters', { status: 400 })
    }

    const decodedPlayerId = decodeURIComponent(playerId).replace('.jpg', '').replace('.png', '')

    // Use bulletproof image service to get player photo
    const result = await bulletproofImageService.getPlayerPhoto(
      decodedPlayerId, // playerName
      decodedPlayerId, // playerId
      'unknown', // sport - will be determined by service
      undefined, // teamName
      undefined // colors
    )

    // Extract SVG content from data URI if it's SVG
    let svgContent: string
    if (result.url.startsWith('data:image/svg+xml,')) {
      svgContent = decodeURIComponent(result.url.split(',')[1])
    } else {
      // If it's not SVG, return the URL as a redirect
      return NextResponse.redirect(result.url)
    }

    return new NextResponse(svgContent, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Access-Control-Allow-Origin': '*',
        'X-Image-Source': result.source,
        'X-Image-Fallback': result.fallback ? 'true' : 'false'
      },
    })
  } catch (error) {
    console.error('Error generating player photo:', error)

    // Ultimate fallback SVG
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
        'X-Image-Source': 'fallback',
        'X-Image-Fallback': 'true'
      },
    })
  }
}
