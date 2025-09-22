import { NextRequest, NextResponse } from 'next/server'
import { productionSupabaseClient } from '@/lib/supabase/production-client'
import { structuredLogger } from '@/lib/services/structured-logger'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const sport = searchParams.get("sport")
  const externalAllowed = process.env.ALLOW_EXTERNAL_FETCH === 'true'
  const limit = parseInt(searchParams.get("limit") || "10")
  const gameId = searchParams.get("gameId")
  
  try {

    // If sport is provided, try sport-specific endpoint first, fallback to general query
    if (sport && externalAllowed) {
      try {
        // Try to get odds from sport-specific endpoint (external)
        const sportResponse = await fetch(`${request.url.replace('/api/odds', `/api/odds/${sport}`)}`)
        if (sportResponse.ok) {
          const sportData = await sportResponse.json()
          if (sportData.success && sportData.data && sportData.data.length > 0) {
            return NextResponse.json({
              success: true,
              data: sportData.data,
              meta: sportData.meta
            })
          }
        }
      } catch (error) {
        structuredLogger.warn('Sport-specific odds failed, falling back to general query', {
          sport,
          error: error instanceof Error ? error.message : String(error)
        })
      }
    }

    // Use production Supabase client for odds data
    const odds = await productionSupabaseClient.getOdds(sport || undefined, gameId || undefined, limit)

    if (odds.length === 0) {
      return NextResponse.json([])
    }

    // Transform data to match expected format - only include odds with valid team data
    const transformedOdds = odds
      .filter((odd: any) => odd.game?.home_team?.name && odd.game?.away_team?.name) // Only include odds with real team data
      .map((odd: any) => ({
        id: odd.id,
        game_id: odd.game_id,
        home_team: odd.game?.home_team?.name,
        away_team: odd.game?.away_team?.name,
        home_odds: odd.home_odds,
        away_odds: odd.away_odds,
        draw_odds: odd.draw_odds,
        over_odds: odd.over_odds,
        under_odds: odd.under_odds,
        sport: odd.sport,
        league: odd.league,
        market: odd.market,
        bookmaker: odd.bookmaker,
        last_updated: odd.updated_at,
        game_date: odd.game?.game_date,
        status: odd.game?.status
      }))

    return NextResponse.json({
      success: true,
      data: transformedOdds,
      meta: {
        fromCache: false,
        responseTime: 0,
        source: "database",
        count: transformedOdds.length
      }
    })

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    const errorStack = error instanceof Error ? error.stack : undefined
    
    structuredLogger.error('Odds API error', {
      error: errorMessage,
      stack: errorStack,
      sport,
      limit,
      gameId
    })
    
    console.error('Odds API detailed error:', error)
    
    return NextResponse.json({ 
      error: "Internal server error",
      details: errorMessage,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
