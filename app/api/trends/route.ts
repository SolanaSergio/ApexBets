import { NextResponse } from 'next/server'
import { dynamicTrendsService } from '@/lib/services/trends/dynamic-trends-service'
import { SupportedSport } from '@/lib/services/core/service-factory'
import { getCache, setCache } from '@/lib/redis'

const CACHE_TTL = 60 * 5 // 5 minutes

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const sport = searchParams.get('sport') as SupportedSport
  const limit = searchParams.get('limit')

  if (!sport) {
    return NextResponse.json({ error: 'Sport is required' }, { status: 400 })
  }

  const cacheKey = `trends-${sport}-${limit}`
  const cached = await getCache(cacheKey)
  if (cached) {
    return NextResponse.json(cached)
  }

  try {
    const trends = await dynamicTrendsService.getTrends(sport, limit ? parseInt(limit) : 10)
    await setCache(cacheKey, trends, CACHE_TTL)
    return NextResponse.json(trends)
  } catch (error) {
    console.error(`Error fetching trends for ${sport}:`, error)
    return NextResponse.json({ error: 'Failed to fetch trends' }, { status: 500 })
  }
}
