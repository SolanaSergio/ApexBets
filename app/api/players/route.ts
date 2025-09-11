import { NextResponse } from 'next/server'
import { cachedUnifiedApiClient } from '@/lib/services/api/cached-unified-api-client'
import { SupportedSport } from '@/lib/services/core/service-factory'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const sport = searchParams.get('sport') as SupportedSport
  const teamId = searchParams.get('teamId')
  const limit = searchParams.get('limit')

  if (!sport) {
    return NextResponse.json({ error: 'Sport is required' }, { status: 400 })
  }

  try {
    const players = await cachedUnifiedApiClient.getPlayers(sport, {
      teamId: teamId || undefined,
      limit: limit ? parseInt(limit) : 100,
    })
    return NextResponse.json(players)
  } catch (error) {
    console.error(`Error fetching players for ${sport}:`, error)
    return NextResponse.json({ error: 'Failed to fetch players' }, { status: 500 })
  }
}