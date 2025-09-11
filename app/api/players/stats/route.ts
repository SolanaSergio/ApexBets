import { NextResponse } from 'next/server'
import { cachedUnifiedApiClient } from '@/lib/services/api/cached-unified-api-client'
import { SupportedSport } from '@/lib/services/core/service-factory'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const sport = searchParams.get('sport') as SupportedSport
  const playerId = searchParams.get('playerId')

  if (!sport || !playerId) {
    return NextResponse.json({ error: 'Sport and Player ID are required' }, { status: 400 })
  }

  try {
    // Use the individual player stats route instead
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/player-stats/${playerId}?sport=${sport}`)
    const stats = await response.json()
    return NextResponse.json(stats)
  } catch (error) {
    console.error(`Error fetching stats for player ${playerId} in ${sport}:`, error)
    return NextResponse.json({ error: 'Failed to fetch player stats' }, { status: 500 })
  }
}
