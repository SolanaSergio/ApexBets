import { NextResponse } from 'next/server'
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
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL
    if (!apiBaseUrl) {
      return NextResponse.json(
        { error: 'Server not configured: NEXT_PUBLIC_API_URL is missing' },
        { status: 500 }
      )
    }
    const response = await fetch(`${apiBaseUrl}/api/player-stats/${playerId}?sport=${sport}`)
    const stats = await response.json()
    return NextResponse.json(stats)
  } catch (error) {
    console.error(`Error fetching stats for player ${playerId} in ${sport}:`, error)
    return NextResponse.json({ error: 'Failed to fetch player stats' }, { status: 500 })
  }
}
