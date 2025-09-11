import { NextResponse } from 'next/server'
import { dynamicTrendsService } from '@/lib/services/trends/dynamic-trends-service'
import { SupportedSport } from '@/lib/services/core/service-factory'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const sport = searchParams.get('sport') as SupportedSport
  const limit = searchParams.get('limit')

  if (!sport) {
    return NextResponse.json({ error: 'Sport is required' }, { status: 400 })
  }

  try {
    const trends = await dynamicTrendsService.getTrends(sport, limit ? parseInt(limit) : 10)
    return NextResponse.json(trends)
  } catch (error) {
    console.error(`Error fetching trends for ${sport}:`, error)
    return NextResponse.json({ error: 'Failed to fetch trends' }, { status: 500 })
  }
}
